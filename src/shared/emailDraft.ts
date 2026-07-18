// src/shared/emailDraft.ts
//
// Single source of truth for "open a formatted email draft" — used by both the
// commands iframe (src/commands/commands.ts) and the Outlook task pane
// (src/taskpane/OutlookTaskPane.tsx). Previously duplicated in both files and
// had already drifted (log message wording, missing branches).

import { dbg } from "@/debug/log";

const HTML_BODY_LIMIT = 32000; // new Outlook / OWA silently refuse to open the form above this
const MAILTO_BODY_LIMIT = 1500; // mailto URLs cap around ~2000 chars once subject+recipient are encoded
const BLOCK_TAGS = new Set(["tr", "p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "li"]);
const VOID_TAGS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
const TRUNCATION_NOTICE_HTML = "<p><em>(Content truncated — see the add-in for the full analysis.)</em></p>";
const TRUNCATION_NOTICE_TEXT = "\n\n(Truncated — open the add-in for the full analysis.)";

// Converts stored HTML into plain text for the mailto: fallback, preserving
// paragraph/row/list structure as newlines instead of Element.textContent's
// wall-of-text concatenation.
export function plainTextMailtoUrl(toEmail: string, subject: string, htmlBody: string): string {
  if (!toEmail) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = htmlBody;
  tmp.querySelectorAll("style, script, title, head").forEach((el) => el.remove());

  const parts: string[] = [];
  walkForText(tmp, parts);

  let bodyText = parts.join("");
  bodyText = bodyText.replace(/[ \t]+/g, " ");
  bodyText = bodyText.replace(/[ \t]*\n[ \t]*/g, "\n"); // trim spaces hugging a newline
  bodyText = bodyText.replace(/\n{3,}/g, "\n\n");
  bodyText = bodyText.trim();

  if (bodyText.length > MAILTO_BODY_LIMIT) {
    let cut = bodyText.slice(0, MAILTO_BODY_LIMIT);
    const lastBreak = Math.max(cut.lastIndexOf(" "), cut.lastIndexOf("\n"));
    if (lastBreak > 0) cut = cut.slice(0, lastBreak);
    bodyText = cut.trimEnd() + TRUNCATION_NOTICE_TEXT;
  }

  return `mailto:${encodeURIComponent(toEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
}

function walkForText(node: Node, out: string[]): void {
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      out.push(child.textContent || "");
      return;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) return;
    const el = child as Element;
    const tag = el.tagName.toLowerCase();
    if (tag === "br") { out.push("\n"); return; }
    if (tag === "td" || tag === "th") {
      walkForText(el, out);
      out.push(" "); // keep a "label : value" row on one line
      return;
    }
    walkForText(el, out);
    if (BLOCK_TAGS.has(tag)) out.push("\n");
  });
}

// Outlook's new-message forms reject bodies over ~32K chars. Cut at the last
// safe closing tag before the limit and re-close whatever's still open.
function capHtmlBody(html: string): string {
  if (html.length <= HTML_BODY_LIMIT) return html;

  const tagRe = /<!--[\s\S]*?-->|<!DOCTYPE[^>]*>|<\/?([a-zA-Z][a-zA-Z0-9]*)((?:\s[^<>]*)?)\/?>/g;
  const stack: string[] = [];
  let lastCut: { index: number; openTags: string[] } | null = null;
  let match: RegExpExecArray | null;

  while ((match = tagRe.exec(html)) !== null) {
    const full = match[0];
    const endIndex = match.index + full.length;
    if (endIndex > HTML_BODY_LIMIT) break;
    const tagName = match[1]?.toLowerCase();
    if (!tagName) continue; // comment or doctype
    const isClosing = full.startsWith("</");
    if (isClosing) {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i] === tagName) { stack.splice(i, 1); break; }
      }
      if (BLOCK_TAGS.has(tagName) && (tagName === "tr" || tagName === "p" || tagName === "div")) {
        lastCut = { index: endIndex, openTags: [...stack] };
      }
    } else if (!full.endsWith("/>") && !VOID_TAGS.has(tagName)) {
      stack.push(tagName);
    }
  }

  if (!lastCut) {
    dbg("HOST", "capHtmlBody: no safe boundary found before limit, hard-cutting", { length: html.length });
    return html.slice(0, HTML_BODY_LIMIT) + TRUNCATION_NOTICE_HTML;
  }

  dbg("HOST", "capHtmlBody: truncated HTML body", { originalLength: html.length, cutAt: lastCut.index });
  const closeTags = [...lastCut.openTags].reverse().map((t) => `</${t}>`).join("");
  return html.slice(0, lastCut.index) + TRUNCATION_NOTICE_HTML + closeTags;
}

// Opens an HTML-formatted email draft, trying progressively less-capable APIs:
//   1. displayNewMessageForm       (Read mode,    Mailbox 1.6)
//   2. displayNewMessageFormAsync  (Read mode,    Mailbox 1.9)
//   3. item.body.setAsync          (Compose mode)
//   4. mailto:                     (last resort, plain text)
// onDone receives "" when the draft was opened/injected, or a mailto URL for the fallback link.
export function openHtmlEmailDraft(
  html: string,
  toEmail: string,
  subject: string,
  htmlBodyForFallback: string,
  onDone: (mailtoUrl: string) => void,
): void {
  const mailbox = Office.context.mailbox;
  dbg("HOST", "openHtmlEmailDraft: entry diagnostics", {
    host: Office.context.host,
    diagHost: Office.context.diagnostics?.host,
    diagVersion: Office.context.diagnostics?.version,
    hasDisplayNewMessageForm: typeof mailbox?.displayNewMessageForm,
    hasDisplayNewMessageFormAsync: typeof mailbox?.displayNewMessageFormAsync,
    hasItemBodySetAsync: typeof mailbox?.item?.body?.setAsync === "function",
  });

  // Presence of mailbox is the reliable Outlook signal — Office.context.host is
  // not consistently populated in Outlook, so gating on it can drop us to mailto
  // on a host that actually supports the HTML draft APIs.
  if (!mailbox) {
    dbg("HOST", "openHtmlEmailDraft: no mailbox (non-Outlook host) -> mailto fallback");
    onDone(plainTextMailtoUrl(toEmail, subject, htmlBodyForFallback));
    return;
  }

  const cappedHtml = capHtmlBody(html);

  if (typeof mailbox.displayNewMessageForm === "function") {
    try {
      mailbox.displayNewMessageForm({
        toRecipients: toEmail ? [toEmail] : [],
        subject,
        htmlBody: cappedHtml,
      });
      dbg("HOST", "openHtmlEmailDraft: displayNewMessageForm called");
      onDone("");
      return;
    } catch (err) {
      dbg("HOST", "openHtmlEmailDraft: displayNewMessageForm threw", String(err));
      // fall through to the next API
    }
  } else {
    dbg("HOST", "openHtmlEmailDraft: displayNewMessageForm not available");
  }

  if (typeof mailbox.displayNewMessageFormAsync === "function") {
    mailbox.displayNewMessageFormAsync(
      { toRecipients: toEmail ? [toEmail] : [], subject, htmlBody: cappedHtml },
      (result: Office.AsyncResult<void>) => {
        if (result.status === Office.AsyncResultStatus.Succeeded) {
          dbg("HOST", "openHtmlEmailDraft: displayNewMessageFormAsync succeeded");
          onDone("");
        } else {
          dbg("HOST", "openHtmlEmailDraft: displayNewMessageFormAsync failed", String(result.error?.message));
          tryComposeThenFallback(mailbox, html, toEmail, subject, htmlBodyForFallback, onDone);
        }
      },
    );
    return;
  }
  dbg("HOST", "openHtmlEmailDraft: displayNewMessageFormAsync not available");

  tryComposeThenFallback(mailbox, html, toEmail, subject, htmlBodyForFallback, onDone);
}

function tryComposeThenFallback(
  mailbox: Office.Mailbox,
  html: string,
  toEmail: string,
  subject: string,
  htmlBodyForFallback: string,
  onDone: (mailtoUrl: string) => void,
): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const item = mailbox.item as any;
  if (item?.body?.setAsync) {
    item.body.setAsync(
      html,
      { coercionType: Office.CoercionType.Html },
      (result: Office.AsyncResult<void>) => {
        if (result.status === Office.AsyncResultStatus.Succeeded) {
          dbg("HOST", "openHtmlEmailDraft: body.setAsync succeeded (compose mode)");
          onDone("");
        } else {
          dbg("HOST", "openHtmlEmailDraft: body.setAsync failed", String(result.error?.message));
          onDone(plainTextMailtoUrl(toEmail, subject, htmlBodyForFallback));
        }
      }
    );
    return;
  }
  dbg("HOST", "openHtmlEmailDraft: no remaining API -> mailto fallback");
  onDone(plainTextMailtoUrl(toEmail, subject, htmlBodyForFallback));
}
