// src/dialog/components/HtmlContent.tsx
//
// Single renderer for stored / pasted HTML: article bodies, Word selections, etc.
// Uses normal whitespace handling (no pre-wrap) and supplies block-element CSS
// so structural tags space themselves — paragraph margins, heading sizes, lists,
// blockquotes, images. Em-based so it scales with the caller's font-size.
//
// Pair with sanitizeWordHtml: that pass collapses stray whitespace inside text
// nodes so the visible text matches what window.getSelection().toString() returns.

import React from "react";

const SL_HTML_CONTENT_CSS = `
.sl-html-content > *:first-child { margin-top: 0 !important; padding-top: 0 !important; }
.sl-html-content > *:last-child { margin-bottom: 0 !important; padding-bottom: 0 !important; }
.sl-html-content p { margin: 0 0 0.85em; }
.sl-html-content h1, .sl-html-content h2, .sl-html-content h3,
.sl-html-content h4, .sl-html-content h5, .sl-html-content h6 {
  color: #0F1419; margin: 1.1em 0 0.45em; line-height: 1.25; font-weight: 700;
}
.sl-html-content h1 { font-size: 1.45em; }
.sl-html-content h2 { font-size: 1.22em; }
.sl-html-content h3 { font-size: 1.08em; }
.sl-html-content h4, .sl-html-content h5, .sl-html-content h6 { font-size: 1em; }
.sl-html-content ul, .sl-html-content ol { padding-left: 1.5em; margin: 0 0 0.85em; }
.sl-html-content li { margin-bottom: 0.25em; }
.sl-html-content blockquote {
  border-left: 3px solid #0078D4; margin: 0 0 0.85em; padding: 4px 12px;
  color: #6B7280; font-style: italic; background: #F8FAFF; border-radius: 0 4px 4px 0;
}
.sl-html-content a { color: #0078D4; }
.sl-html-content pre {
  background: #F3F4F6; border-radius: 4px; padding: 8px 12px; overflow-x: auto;
  font-size: 0.92em; margin: 0 0 0.85em; white-space: pre;
}
.sl-html-content pre, .sl-html-content code {
  font-family: Consolas, "SF Mono", Monaco, monospace;
}
.sl-html-content img {
  max-width: 100% !important; height: auto !important; display: block;
  margin: 0.85em 0; border-radius: 4px;
}
.sl-html-content table { border-collapse: collapse; table-layout: fixed; width: 100%; margin: 0 0 0.85em; }
.sl-html-content th, .sl-html-content td { border: 1px solid #C7C7C7; padding: 6px 9px; vertical-align: top; word-break: break-word; overflow-wrap: anywhere; }
.sl-html-content th { background: #F3F4F6; font-weight: 600; text-align: left; }
.sl-html-content hr { margin: 1em 0; border: none; border-top: 1px solid #D0D0D0; }
`;

let injected = false;
export function ensureSlHtmlContentStyleInjected() {
  if (injected || typeof document === "undefined") return;
  const tag = document.createElement("style");
  tag.setAttribute("data-sl-html-content", "");
  tag.textContent = SL_HTML_CONTENT_CSS;
  document.head.appendChild(tag);
  injected = true;
}

// Inject on module load so any element with className="sl-html-content"
// (e.g. the Create/Edit article contentEditable) gets styled even when
// no <HtmlContent> instance is mounted yet.
ensureSlHtmlContentStyleInjected();

interface HtmlContentProps extends React.HTMLAttributes<HTMLDivElement> {
  html: string;
}

export function HtmlContent({ html, className, ...rest }: HtmlContentProps) {
  ensureSlHtmlContentStyleInjected();
  const cls = `sl-html-content${className ? ` ${className}` : ""}`;
  return (
    <div
      {...rest}
      className={cls}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
