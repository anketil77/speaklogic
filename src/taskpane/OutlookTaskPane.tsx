/* global Office */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { initDb, nowDate, formatDisplayDate } from "@/db/db";
import { dbg } from "@/debug/log";
import { getCommunicationConfig, saveCommunicationConfig } from "@/db/queries/communication";
import { getAllPeople, getPeopleEmailMap, getPeopleNames, upsertPersonName, upsertPersonWithEmail } from "@/db/queries/people";
import {
  deleteAnalysis,
  getAnalysisById,
  getAnswersByAnalysis,
  getCompensatorsByAnalysis,
  getErrorsByAnalysis,
  getFilesByAnalysis,
  getProblemsByAnalysis,
  getQuestionsByAnalysis,
  getAllAnalyses,
  getRetainedAnalyses,
  saveFullAnalysis,
} from "@/db/queries/analysis";
import {
  deleteFeedback,
  getAllFeedbacks,
  saveFeedback,
  saveFeedbackHistory,
  saveCommSignalInfo,
  getCommSignalRequests,
  deleteCommSignalRequest,
} from "@/db/queries/feedback";
import { saveArticle, updateArticle, saveArticleWizard, getAllArticles, deleteArticle, getArticleById, publishArticle } from "@/db/queries/article";
import { getUserInformationItems, addUserInformationItem, deleteUserInformationItem } from "@/db/queries/information";
import { saveProblemSolution } from "@/db/queries/problem";
import { getAllPublishers, savePublisher, deletePublisher } from "@/db/queries/publisher";
import { deleteFlag, getAllFlaggedSelections, saveFlag, getAllSelectionHistories, deleteSelectionHistory } from "@/db/queries/flag";
import {
  addAttachedFile,
  deleteInterpretation,
  deletePrincipleInSelection,
  deleteSelectionWithPrinciple,
  getAllInterpretations,
  getFilesByPrincipleInterpretation,
  getFilesByPrincipleInSelection,
  getFilesBySelectionWithPrinciple,
  getPrinciplesInSelection,
  getSelectionsWithPrinciple,
  removeAttachedFile,
  savePrincipleInSelection,
  saveSelectionWithPrinciple,
} from "@/db/queries/principle";
import { openIdentifiedPrincipleReport, openInterpretedPrincipleReport, openRelatedPrincipleReport } from "@/dialog/utils/reportGenerator";
import { buildProvideFeedbackEmail, buildApplyFeedbackEmail, buildRequestFeedbackEmail } from "@/dialog/utils/emailTemplates";
import type { ProjectAnalysis } from "@/types/db";
import type {
  AttachFileToProject,
  DialogAction,
  DialogInitPayload,
  HostMessage,
  PrincipleInterpretation,
  SaveAnalysisPayload,
  SaveArticlePayload,
  SaveArticleWizardPayload,
  SaveCommunicationConfigPayload,
  SaveFeedbackPayload,
  SavePrincipleInSelectionPayload,
  SaveRelatedSelectionPayload,
  SaveRequestFeedbackPayload,
  SaveRequestSLFeedbackPayload,
  SelectionMode,
} from "@/types/db";

const DIALOG_BASE = window.location.origin;
const DIALOG_SIZE = { height: 69, width: 43 };
const FLAG_DIALOG_SIZE = { height: 58, width: 25 };
const SELECTION_CONFIG_DIALOG_SIZE = { height: 52, width: 25 };
const ABOUT_DIALOG_SIZE = { height: 27, width: 32 };
const COMM_CONFIG_SIZE = { height: 36, width: 28 };
const CREATE_ARTICLE_PICKER_SIZE = { height: 20, width: 14 };
const CREATE_ARTICLE_TEMPLATE_SIZE = { height: 56, width: 27 };
const CREATE_ARTICLE_DIALOG_SIZE = { height: 61, width: 27 };
const ARTICLE_WIZARD_SIZE = { height: 53, width: 27 };

// ─── helpers ─────────────────────────────────────────────────────────────────

function getSource(): "Outlook Mail" { return "Outlook Mail"; }

// Strip HTML/entities to plain text for audit-row entity names (mirrors commands.ts).
function plainText(html: string | undefined | null): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
}

// Compose mode: subject exposes setAsync (compose-only API); read mode: subject is a plain string.
function isComposeMode(): boolean {
  try {
    const item = Office.context.mailbox?.item as { subject?: { setAsync?: unknown } } | undefined;
    return typeof item?.subject?.setAsync === "function";
  } catch {
    return false;
  }
}

// ── Comm Context email marker (visible block, parsed by recipient's sidebar) ──
// Encode order matters: & first on encode, last on decode.
function encodeCtxValue(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\|/g, "&#124;");
}
function decodeCtxValue(v: string): string {
  return v.replace(/&#124;/g, "|").replace(/&lt;/g, "<").replace(/&amp;/g, "&");
}

type CommCtxValues = { appName: string; commFunction: string; commSignal: string; projectName: string };

// No nested <div> inside — the strip/parse regexes stop at the first </div>.
// 2×2 table layout (tables render reliably across all email clients).
function buildCtxMarker(ctx: CommCtxValues): string {
  const signalColor = ctx.commSignal === "Red" ? "#D13438" : ctx.commSignal === "Blue" ? "#0078D4" : ctx.commSignal === "Green" ? "#107C10" : "#1B1B1B";
  const labelStyle = `font-size:10px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:#1B1B1B;padding:6px 20px 1px 0`;
  const valueStyle = `font-size:12px;color:#424242;padding:0 20px 4px 0`;
  return (
    `<div id="sl-comm-ctx" style="margin-top:16px;padding:8px 14px 10px;border:1px solid #DDDDDD;border-radius:4px;background:#F7F7F7;font-family:'Segoe UI',Arial,sans-serif">` +
    `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-family:'Segoe UI',Arial,sans-serif">` +
    `<tr><td style="${labelStyle}">App Name</td><td style="${labelStyle}">Project Name</td></tr>` +
    `<tr><td style="${valueStyle}">${encodeCtxValue(ctx.appName) || "-"}</td><td style="${valueStyle}">${encodeCtxValue(ctx.projectName) || "-"}</td></tr>` +
    `<tr><td style="${labelStyle}">Comm. Function</td><td style="${labelStyle}">Comm. Signal</td></tr>` +
    `<tr><td style="${valueStyle}">${encodeCtxValue(ctx.commFunction) || "-"}</td><td style="${valueStyle.replace("#424242", signalColor)};font-weight:600">${encodeCtxValue(ctx.commSignal) || "-"}</td></tr>` +
    `</table>` +
    `<span id="sl-comm-ctx-data" style="display:none;mso-hide:all;font-size:1px;max-height:0;overflow:hidden">${encodeCtxValue(ctx.appName)}|${encodeCtxValue(ctx.commFunction)}|${encodeCtxValue(ctx.commSignal)}|${encodeCtxValue(ctx.projectName)}</span>` +
    `</div>`
  );
}

const CTX_MARKER_STRIP_RE = /<div[^>]*id=["']?sl-comm-ctx["']?[^>]*>[\s\S]*?<\/div>/gi;
const CTX_MARKER_DATA_RE = /<span[^>]*id=["']?sl-comm-ctx-data["']?[^>]*>([\s\S]*?)<\/span>/i;

// Subject stamp — readable fallback so recipients WITHOUT the add-in still see the
// context (the body marker only auto-fills the panel if both sides have the add-in).
// Format (per client): "<subject>; Application[App] Communication Function [Func] Communication Signal [Signal]"
function buildSubjectStamp(ctx: CommCtxValues): string {
  return `Application[${ctx.appName}] Communication Function [${ctx.commFunction}] Communication Signal [${ctx.commSignal}]`;
}
// Strip a previously appended stamp (and its "; " separator) so re-attaching never duplicates it.
const SUBJECT_STAMP_RE = /\s*;\s*Application\[[^\]]*\]\s*Communication Function\s*\[[^\]]*\]\s*Communication Signal\s*\[[^\]]*\]\s*$/i;
// Parse a stamped subject back into context values (final fallback on receive — appName + commFunction + commSignal only; projectName isn't carried in the subject).
const SUBJECT_STAMP_PARSE_RE = /Application\[([^\]]*)\]\s*Communication Function\s*\[([^\]]*)\]\s*Communication Signal\s*\[([^\]]*)\]/i;
function parseSubjectStamp(subject: string): CommCtxValues | null {
  const m = subject.match(SUBJECT_STAMP_PARSE_RE);
  if (!m) return null;
  return { appName: (m[1] ?? "").trim(), commFunction: (m[2] ?? "").trim(), commSignal: (m[3] ?? "").trim(), projectName: "" };
}

function parseCtxMarker(bodyHtml: string): CommCtxValues | null {
  const match = bodyHtml.match(CTX_MARKER_DATA_RE);
  if (!match) return null;
  const parts = match[1].split("|").map(decodeCtxValue);
  if (parts.length !== 4) return null;
  return { appName: parts[0] ?? "", commFunction: parts[1] ?? "", commSignal: parts[2] ?? "", projectName: parts[3] ?? "" };
}

function getUserIdentity(): { personName: string; personEmail: string } {
  try {
    const p = Office.context.mailbox.userProfile;
    const rawName = p.displayName ?? "";
    const personName = rawName.includes("@") ? "" : rawName;
    return { personName, personEmail: p.emailAddress ?? "" };
  } catch { return { personName: "", personEmail: "" }; }
}

async function readOutlookText(mode: SelectionMode): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const item = Office.context.mailbox.item as any;
    if (!item) { resolve(""); return; }

    const getFullBody = () => {
      item.body.getAsync(Office.CoercionType.Text, (result: Office.AsyncResult<string>) => {
        if (result.status === Office.AsyncResultStatus.Failed) {
          reject(new Error(result.error?.message ?? "Failed to get email body"));
          return;
        }
        resolve(result.value?.trim() ?? "");
      });
    };

    // getSelectedDataAsync only exists in compose mode (Mailbox 1.2+)
    if (typeof item.getSelectedDataAsync === "function") {
      item.getSelectedDataAsync(
        Office.CoercionType.Text,
        (result: Office.AsyncResult<{ data: string; sourceProperty: string }>) => {
          const selected = (result.value?.data ?? "").trim();
          if (selected) { resolve(selected); return; }
          // "Selection" buttons require actual highlighted text — return "" so the
          // caller shows the "no text" status, matching Word behaviour.
          // "Paragraph" buttons fall back to the full body.
          if (mode === "selection") { resolve(""); return; }
          getFullBody();
        }
      );
    } else {
      // Read mode — no selection API. Selection buttons can't work here (return ""
      // so the caller shows the "no text" error); paragraph buttons read the full body.
      if (mode === "selection") { resolve(""); return; }
      getFullBody();
    }
  });
}

async function readSubject(): Promise<string> {
  try {
    const rawSubject = (Office.context.mailbox.item as { subject?: string | { getAsync?: unknown } }).subject;
    if (typeof rawSubject === "string") return rawSubject;
  } catch { /* ignore */ }
  return "";
}

function buildMailtoUrl(payload: SaveFeedbackPayload): string {
  const email = payload.toPersonEmail ?? "";
  if (!email) return "";
  const subject = encodeURIComponent(payload.feedback.feedbackSubject);
  const bodyText = payload.feedback.feedbackApplication.replace(/<[^>]*>/g, "").slice(0, 1800);
  return `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
}

function buildRequestMailtoUrl(p: SaveRequestFeedbackPayload): string {
  const email = (p as { toPersonEmail?: string }).toPersonEmail ?? "";
  if (!email) return "";
  const subject = encodeURIComponent(p.communicationSubject ?? "");
  const bodyText = (p.actualCommunication ?? "").replace(/<[^>]*>/g, "").slice(0, 1800);
  return `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
}

function buildRequestSLMailtoUrl(p: SaveRequestSLFeedbackPayload): string {
  const subject = encodeURIComponent(p.communicationSubject ?? "");
  const bodyText = (p.actualCommunication ?? "").replace(/<[^>]*>/g, "").slice(0, 1800);
  return `mailto:support@speaklogic.org?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
}

function loadAnalysisForFeedback(analysisId: number | undefined): ProjectAnalysis | null {
  if (!analysisId) return null;
  try {
    const a = getAnalysisById(analysisId);
    if (!a || !a.id) return null;
    return {
      ...a,
      errors: getErrorsByAnalysis(a.id),
      compensators: getCompensatorsByAnalysis(a.id),
      questions: getQuestionsByAnalysis(a.id),
      answers: getAnswersByAnalysis(a.id),
    };
  } catch { return null; }
}

function plainTextMailtoUrl(toEmail: string, subject: string, htmlBody: string): string {
  if (!toEmail) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = htmlBody;
  const bodyText = (tmp.textContent || tmp.innerText || "").replace(/\s+/g, " ").trim().slice(0, 1800);
  return `mailto:${encodeURIComponent(toEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
}

function openHtmlEmailDraft(
  html: string,
  toEmail: string,
  subject: string,
  htmlBodyForFallback: string,
  onDone: (mailtoUrl: string) => void,
): void {
  if (Office.context.host === Office.HostType.Outlook) {
    if (typeof Office.context.mailbox.displayNewMessageForm === "function") {
      try {
        Office.context.mailbox.displayNewMessageForm({
          toRecipients: toEmail ? [toEmail] : [],
          subject,
          htmlBody: html,
        });
        onDone("");
      } catch {
        onDone(plainTextMailtoUrl(toEmail, subject, htmlBodyForFallback));
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const item = Office.context.mailbox.item as any;
      if (item?.body?.setAsync) {
        item.body.setAsync(
          html,
          { coercionType: Office.CoercionType.Html },
          (result: Office.AsyncResult<void>) => {
            if (result.status === Office.AsyncResultStatus.Succeeded) {
              onDone("");
            } else {
              onDone(plainTextMailtoUrl(toEmail, subject, htmlBodyForFallback));
            }
          }
        );
      } else {
        onDone(plainTextMailtoUrl(toEmail, subject, htmlBodyForFallback));
      }
    }
  } else {
    onDone(plainTextMailtoUrl(toEmail, subject, htmlBodyForFallback));
  }
}

function buildPeopleList(commPersonName?: string): string[] {
  const names = getPeopleNames();
  if (commPersonName && !names.includes(commPersonName)) return [commPersonName, ...names];
  return names;
}

// ─── button layout ────────────────────────────────────────────────────────────

interface ButtonDef { id: string; label: string; icon: string; }
interface GroupDef { id: string; label: string; items: ButtonDef[]; }

const GROUPS: GroupDef[] = [
  {
    id: "analysis", label: "Analysis",
    items: [
      { id: "analyzeSelection",  label: "Analyze Selection",  icon: "btn-analyze-sel-32.png" },
      { id: "analyzeParagraph",  label: "Analyze Paragraph",  icon: "btn-analyze-para-32.png" },
      { id: "flagSelection",     label: "Flag Selection",     icon: "btn-flag-sel-32.png" },
      { id: "flagParagraph",     label: "Flag Paragraph",     icon: "btn-flag-para-32.png" },
      { id: "listSelection",                  label: "List of Selection",                    icon: "btn-flagged-sel-32.png" },
      { id: "listIdentifiedPrinciple",         label: "List Identified Principle",            icon: "btn-flagged-sel-32.png" },
      { id: "listInterpretedPrinciple",        label: "List Interpreted Principle",           icon: "btn-flagged-sel-32.png" },
      { id: "listSelectionRelatedPrinciple",   label: "List Selection Related with Principle", icon: "btn-flagged-sel-32.png" },
      { id: "selectionConfig",                 label: "Selection Config",                     icon: "btn-sel-config-32.png" },
    ],
  },
  {
    id: "feedback", label: "Feedback",
    items: [
      { id: "applySelection",    label: "Apply Selection",    icon: "btn-apply-sel-32.png" },
      { id: "applyParagraph",    label: "Apply Paragraph",    icon: "btn-apply-para-32.png" },
      { id: "provideFeedback",   label: "Provide Feedback",   icon: "btn-provide-fb-sel-32.png" },
      { id: "feedbackParagraph", label: "Feedback Paragraph", icon: "btn-provide-fb-para-32.png" },
      { id: "requestFeedback",   label: "Request Feedback",   icon: "btn-req-fb-32.png" },
    ],
  },
  {
    id: "article", label: "Article",
    items: [
      { id: "createArticle", label: "Create Article", icon: "btn-create-article-32.png" },
      { id: "listArticles",  label: "List Articles",  icon: "btn-list-articles-32.png" },
    ],
  },
  {
    id: "history", label: "History",
    items: [
      { id: "flaggedSelection", label: "Flagged Selection", icon: "btn-flagged-sel-32.png" },
      { id: "listAnalysis",     label: "List of Analysis",  icon: "btn-list-analysis-32.png" },
      { id: "listFeedback",     label: "List of Feedback",  icon: "btn-list-feedback-32.png" },
      { id: "listRetained",     label: "List of Retained",  icon: "btn-list-retained-32.png" },
    ],
  },
  {
    id: "about", label: "About",
    items: [
      { id: "communicationConfig", label: "Comm Config",        icon: "btn-comm-config-32.png" },
      { id: "requestSLFeedback",   label: "Request SL Feedback",icon: "btn-req-sl-fb-32.png" },
      { id: "help",                label: "Help",               icon: "btn-help-32.png" },
      { id: "about",               label: "About",              icon: "btn-about-32.png" },
    ],
  },
];

// ─── component ────────────────────────────────────────────────────────────────

export function OutlookTaskPane() {
  const [dbReady, setDbReady] = useState(false);
  const [status, setStatus] = useState<{ msg: string; ok: boolean } | null>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const dialogRef = useRef<Office.Dialog | null>(null);
  const commCtxRef = useRef({ appName: "", commFunction: "", commSignal: "", projectName: "" });
  const [commCtx, setCommCtx] = useState(commCtxRef.current);
  const [commCtxOpen, setCommCtxOpen] = useState(true);

  useEffect(() => {
    // ── TEMP DIAGNOSTIC: why is userProfile empty on M365? Remove once root cause found. ──
    // This task pane is a visible runtime — open its console (F12 / right-click → Inspect)
    // and the snapshot prints on load. Or read the persisted log with:
    //   JSON.parse(localStorage.getItem('sl-debug')||'[]').filter(l=>l.includes('IDENTITY')).forEach(l=>console.log(l))
    try {
      const p = Office.context.mailbox.userProfile;
      dbg("IDENTITY", "Outlook taskpane userProfile snapshot", {
        displayName: p.displayName || null,
        emailAddress: p.emailAddress || null,
        accountType: p.accountType || null,        // enterprise = on-prem/hybrid (empty expected); office365 = real bug
        timeZone: p.timeZone || null,
        mailbox16Supported: Office.context.requirements.isSetSupported("Mailbox", "1.6"),
        mbHostName: Office.context.mailbox.diagnostics.hostName,
        mbHostVersion: Office.context.mailbox.diagnostics.hostVersion,
        diagPlatform: Office.context.diagnostics.platform,
        diagVersion: Office.context.diagnostics.version,
      });
    } catch (err) {
      dbg("IDENTITY", "Outlook taskpane userProfile read THREW", String(err));
    }

    initDb()
      .then(() => setDbReady(true))
      .catch(() => setStatus({ msg: "Failed to initialize database.", ok: false }));

    // Load the Communication Context for this item: saved props → body marker → subject stamp.
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (Office.context.mailbox.item as any).loadCustomPropertiesAsync((result: Office.AsyncResult<Office.CustomProperties>) => {
        if (result.status === Office.AsyncResultStatus.Succeeded) {
          const props = result.value;
          const saved = {
            appName: props.get("sl_appName") ?? "",
            commFunction: props.get("sl_commFunction") ?? "",
            commSignal: props.get("sl_commSignal") ?? "",
            projectName: props.get("sl_projectName") ?? "",
          };
          commCtxRef.current = saved;
          setCommCtx(saved);

          // Fallback: no saved props — look for a Speak Logic Context block in the
          // email body (injected by the sender's "Attach context" button).
          const hasAnyValue = saved.appName || saved.commFunction || saved.commSignal || saved.projectName;
          if (!hasAnyValue) {
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (Office.context.mailbox.item as any).body.getAsync(
                Office.CoercionType.Html,
                (bodyResult: Office.AsyncResult<string>) => {
                  if (bodyResult.status !== Office.AsyncResultStatus.Succeeded) return;
                  const fromBody = parseCtxMarker(bodyResult.value);
                  if (fromBody) {
                    commCtxRef.current = fromBody;
                    setCommCtx(fromBody);
                    return;
                  }
                  // Final fallback: parse the context stamp off the subject line
                  // (recipient without the add-in still carried the stamp through).
                  const rawSubject = (Office.context.mailbox.item as { subject?: string }).subject;
                  const fromSubject = typeof rawSubject === "string" ? parseSubjectStamp(rawSubject) : null;
                  if (fromSubject) {
                    commCtxRef.current = fromSubject;
                    setCommCtx(fromSubject);
                  }
                }
              );
            } catch { /* non-critical */ }
          }
        }
      });
    } catch { /* non-critical */ }
  }, []);

  // ── core dialog helper ────────────────────────────────────────────────────

  const openManagedDialog = useCallback((
    url: string,
    size: { height: number; width: number },
    getPayload: () => DialogInitPayload,
    onCustomMessage: (dialog: Office.Dialog, action: DialogAction) => void
  ) => {
    if (dialogRef.current) {
      setStatus({ msg: "Please close the open dialog first.", ok: false });
      return;
    }
    Office.context.ui.displayDialogAsync(url, { ...size, displayInIframe: true }, (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) {
        const code = (result.error as { code: number }).code;
        setStatus({ msg: code === 12007 ? "A dialog is already open. Close it first." : `Could not open dialog (${code}).`, ok: false });
        return;
      }
      const dialog = result.value;
      dialogRef.current = dialog;
      dialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
        const m = JSON.parse((msg as { message: string }).message) as DialogAction;
        if (m.action === "READY") {
          dialog.messageChild(JSON.stringify({ type: "INIT", payload: getPayload() } as HostMessage));
        } else if (m.action === "CLOSE") {
          dialog.close();
          dialogRef.current = null;
        } else {
          onCustomMessage(dialog, m);
        }
      });
      dialog.addEventHandler(Office.EventType.DialogEventReceived, (evt) => {
        const code = (evt as { error: number }).error;
        dialogRef.current = null;
        if (code === 12002) setStatus({ msg: "Dialog page not found — check deployment.", ok: false });
        else if (code === 12003) setStatus({ msg: "Dialog requires HTTPS.", ok: false });
        // 12006 = user closed via X — no message needed
      });
    });
  }, []);

  // ── action handlers ───────────────────────────────────────────────────────

  const saveCommCtxToProps = useCallback((ctx: { appName: string; commFunction: string; commSignal: string; projectName: string }) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (Office.context.mailbox.item as any).loadCustomPropertiesAsync((result: Office.AsyncResult<Office.CustomProperties>) => {
        if (result.status !== Office.AsyncResultStatus.Succeeded) return;
        const props = result.value;
        props.set("sl_appName", ctx.appName);
        props.set("sl_commFunction", ctx.commFunction);
        props.set("sl_commSignal", ctx.commSignal);
        props.set("sl_projectName", ctx.projectName);
        props.saveAsync(() => {});
      });
    } catch { /* non-critical */ }
  }, []);

  const updateCommCtx = useCallback((field: "appName" | "commFunction" | "commSignal" | "projectName", value: string) => {
    const newCtx = { ...commCtxRef.current, [field]: value };
    commCtxRef.current = newCtx;
    setCommCtx(newCtx);
    saveCommCtxToProps(newCtx);
  }, [saveCommCtxToProps]);

  // Inject a visible "Speak Logic Context" block at the end of the email body.
  // Recipients see it in any client; their sidebar parses it to auto-fill the panel.
  const handleAttachCtx = useCallback(() => {
    const ctx = commCtxRef.current;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const item = Office.context.mailbox.item as any;
    if (!item?.body) return;

    item.body.getAsync(Office.CoercionType.Html, (result: Office.AsyncResult<string>) => {
      if (result.status !== Office.AsyncResultStatus.Succeeded) {
        setStatus({ msg: "Failed to read email body.", ok: false });
        return;
      }
      const html = result.value.replace(CTX_MARKER_STRIP_RE, "");
      item.body.setAsync(html + buildCtxMarker(ctx), { coercionType: Office.CoercionType.Html },
        (setResult: Office.AsyncResult<void>) => {
          if (setResult.status === Office.AsyncResultStatus.Succeeded) {
            setStatus({ msg: "Context attached to email.", ok: true });
            setTimeout(() => setStatus(null), 2500);
          } else {
            setStatus({ msg: "Failed to attach context.", ok: false });
          }
        });
    });

    // Also stamp the subject so recipients without the add-in still see the context.
    if (item.subject?.getAsync) {
      item.subject.getAsync((subRes: Office.AsyncResult<string>) => {
        if (subRes.status !== Office.AsyncResultStatus.Succeeded) return;
        const base = (subRes.value || "").replace(SUBJECT_STAMP_RE, "").trim();
        const stamped = base ? `${base}; ${buildSubjectStamp(ctx)}` : buildSubjectStamp(ctx);
        item.subject.setAsync(stamped);
      });
    }
  }, []);

  const handleAnalyze = useCallback(async (mode: SelectionMode) => {
    if (!dbReady) return;
    let text = "";
    try { text = await readOutlookText(mode); } catch { setStatus({ msg: "Failed to read email body.", ok: false }); return; }
    if (!text) { setStatus({ msg: mode === "selection" ? "Please select text in your email first." : "No text found in the email body.", ok: false }); return; }
    const { personName, personEmail } = getUserIdentity();
    const commConfig = getCommunicationConfig();
    const subject = await readSubject();
    const initPayload: DialogInitPayload = {
      selection: text, mode, source: getSource(), personName, personEmail,
      applicationName: commCtxRef.current.appName || subject, communicationFunction: commCtxRef.current.commFunction, communicationSignal: commCtxRef.current.commSignal, projectName: commCtxRef.current.projectName,
      peopleList: buildPeopleList(commConfig?.personName),
      communicationPersonName: commConfig?.personName ?? "",
      communicationPersonEmail: commConfig?.personEmail ?? "",
    };
    openManagedDialog(
      `${DIALOG_BASE}/dialog.html?view=analyze&mode=${mode}`,
      DIALOG_SIZE,
      () => initPayload,
      (dialog, action) => {
        if (action.action === "SAVE_ANALYSIS") {
          const payload = action.payload as SaveAnalysisPayload;
          let savedId: number;
          try {
            savedId = saveFullAnalysis(payload);
            if (payload.analysis.fromPerson) upsertPersonName(payload.analysis.fromPerson);
          } catch (err) {
            dialog.messageChild(JSON.stringify({ type: "ERROR", message: String(err) } as HostMessage));
            return;
          }
          if (payload.analysis.whatToDoWithAnalysis === "ApplyAnalysisAsFeedback") {
            const { personName: pn, personEmail: pe } = getUserIdentity();
            const cc = getCommunicationConfig();
            const applyAnalyses = getAllAnalyses().map((a) => !a.id ? a : { ...a, questions: getQuestionsByAnalysis(a.id), errors: getErrorsByAnalysis(a.id), compensators: getCompensatorsByAnalysis(a.id), answers: getAnswersByAnalysis(a.id), files: getFilesByAnalysis(a.id) });
            const applyFeedbacks = getAllFeedbacks().map((f) => !f.analysisId ? f : { ...f, questions: getQuestionsByAnalysis(f.analysisId), errors: getErrorsByAnalysis(f.analysisId), compensators: getCompensatorsByAnalysis(f.analysisId), answers: getAnswersByAnalysis(f.analysisId), files: getFilesByAnalysis(f.analysisId) });
            dialog.messageChild(JSON.stringify({ type: "NAVIGATE", view: "apply", payload: { selection: payload.analysis.entityUnderAnalysis, mode: payload.analysis.selectionType === "Selection" ? "selection" : "paragraph", source: payload.analysis.source, personName: pn, personEmail: pe, applicationName: payload.analysis.applicationName, communicationFunction: payload.analysis.communicationFunction, communicationSignal: payload.analysis.communicationSignal, projectName: payload.analysis.projectName, peopleList: [], communicationPersonName: cc?.personName ?? "", communicationPersonEmail: cc?.personEmail ?? "", analysisData: { id: savedId, entityUnderAnalysis: payload.analysis.entityUnderAnalysis, analysisSubject: payload.analysis.analysisSubject ?? "", actualAnalysis: payload.analysis.actualAnalysis, fromPerson: payload.analysis.fromPerson ?? "", errors: payload.errors, compensators: payload.compensators, questions: payload.questions, answers: payload.answers, files: payload.files, correctedItems: [] }, analyses: applyAnalyses, feedbacks: applyFeedbacks } } as HostMessage));
          } else if (payload.analysis.whatToDoWithAnalysis === "ProvideFeedbackWithAnalysis") {
            const { personName: pn, personEmail: pe } = getUserIdentity();
            dialog.messageChild(JSON.stringify({ type: "NAVIGATE", view: "provide-feedback", payload: { selection: payload.analysis.entityUnderAnalysis, mode: payload.analysis.selectionType === "Selection" ? "selection" : "paragraph", source: payload.analysis.source, personName: pn, personEmail: pe, applicationName: payload.analysis.applicationName, communicationFunction: payload.analysis.communicationFunction, communicationSignal: payload.analysis.communicationSignal, projectName: payload.analysis.projectName, peopleList: getPeopleNames(), peopleEmailMap: getPeopleEmailMap(), contacts: getAllPeople(), analysisData: { id: savedId, entityUnderAnalysis: payload.analysis.entityUnderAnalysis, analysisSubject: payload.analysis.analysisSubject ?? "", actualAnalysis: payload.analysis.actualAnalysis, fromPerson: payload.analysis.fromPerson ?? "", errors: payload.errors, compensators: payload.compensators, questions: payload.questions, answers: payload.answers, files: payload.files, correctedItems: [] } } } as HostMessage));
          } else {
            saveFeedbackHistory({ selectionAction: "Analyzed", entityName: plainText(payload.analysis.entityUnderAnalysis), actualSelection: payload.analysis.entityUnderAnalysis, selectionType: payload.analysis.selectionType ?? "", source: payload.analysis.source, applicationName: payload.analysis.applicationName ?? "", communicationFunction: payload.analysis.communicationFunction ?? "", communicationSignal: payload.analysis.communicationSignal ?? "", projectName: payload.analysis.projectName ?? "", personName: payload.analysis.personName ?? "", personEmail: payload.analysis.personEmail ?? "" });
            dialog.messageChild(JSON.stringify({ type: "RETAIN_SAVED" } as HostMessage));
          }
        } else if (action.action === "SAVE_FEEDBACK") {
          const p = action.payload as SaveFeedbackPayload;
          try { saveFeedback(p); }
          catch (err) { dialog.messageChild(JSON.stringify({ type: "ERROR", message: String(err) } as HostMessage)); return; }
          // Audit trail — log the feedback disposition (non-critical).
          if (p.feedback.feedbackType === "Provided" || p.feedback.feedbackType === "Applied") {
            const f = p.feedback;
            try {
              saveFeedbackHistory({ selectionAction: f.feedbackType === "Applied" ? "Applied as Feedback" : "Provided as Feedback", entityName: plainText(f.actualSelection) || plainText(f.feedbackApplication), actualSelection: f.feedbackApplication, selectionType: f.selectionType, source: f.source, applicationName: f.applicationName, communicationFunction: f.communicationFunction, communicationSignal: f.communicationSignal, projectName: f.projectName, personName: f.personName, personEmail: f.personEmail });
            } catch { /* non-critical */ }
          }
          if (p.feedback.feedbackType === "Provided" || p.feedback.feedbackType === "Applied") {
            const analysis = loadAnalysisForFeedback(p.feedback.analysisId);
            const html = p.feedback.feedbackType === "Applied"
              ? buildApplyFeedbackEmail(p.feedback, analysis)
              : buildProvideFeedbackEmail(p.feedback, analysis);
            openHtmlEmailDraft(html, p.toPersonEmail ?? "", p.feedback.feedbackSubject, p.feedback.feedbackApplication, (mailtoUrl) => {
              dialog.messageChild(JSON.stringify({ type: "SAVED", mailtoUrl } as HostMessage));
            });
          } else {
            dialog.close(); dialogRef.current = null;
          }
        } else if (action.action === "SAVE_PROBLEM_SOLUTION") {
          const p = action.payload as import("@/types/db").SaveProblemSolutionPayload;
          try { saveProblemSolution({ actualProblem: p.actualProblem, feedbackApplied: p.feedbackApplied, errorCorrected: p.errorCorrected, compensatorReplaced: p.compensatorReplaced, additionalExplanation: p.additionalExplanation, files: p.files }); }
          catch (err) { dialog.messageChild(JSON.stringify({ type: "ERROR", message: `Failed to save problem solution: ${String(err)}` } as HostMessage)); }
        }
      }
    );
  }, [dbReady, openManagedDialog]);

  const handleFlag = useCallback(async (mode: SelectionMode) => {
    if (!dbReady) return;
    let text = "";
    try { text = await readOutlookText(mode); } catch { setStatus({ msg: "Failed to read email body.", ok: false }); return; }
    if (!text) { setStatus({ msg: mode === "selection" ? "Please select text in your email first." : "No text found in the email body.", ok: false }); return; }
    const { personName, personEmail } = getUserIdentity();
    const commConfig = getCommunicationConfig();
    const subject = await readSubject();
    const initPayload: DialogInitPayload = {
      selection: text, mode, source: getSource(), personName, personEmail,
      applicationName: commCtxRef.current.appName || subject, communicationFunction: commCtxRef.current.commFunction, communicationSignal: commCtxRef.current.commSignal, projectName: commCtxRef.current.projectName, peopleList: [],
      communicationPersonName: commConfig?.personName ?? "",
      communicationPersonEmail: commConfig?.personEmail ?? "",
    };
    openManagedDialog(
      `${DIALOG_BASE}/dialog.html?view=flag&mode=${mode}`,
      FLAG_DIALOG_SIZE,
      () => initPayload,
      (dialog, action) => {
        if (action.action === "SAVE_FLAG") {
          try { saveFlag({ ...(action.payload as object), wasEntityAnalyzed: "No" } as Parameters<typeof saveFlag>[0]); }
          catch (err) { setStatus({ msg: `Failed to save flag: ${String(err)}`, ok: false }); dialog.close(); dialogRef.current = null; return; }
          dialog.close(); dialogRef.current = null;
        }
      }
    );
  }, [dbReady, openManagedDialog]);

  const handleSelectionConfig = useCallback(() => {
    openManagedDialog(
      `${DIALOG_BASE}/dialog.html?view=selection-config`,
      SELECTION_CONFIG_DIALOG_SIZE,
      () => ({ selection: "", mode: "selection" as const, source: getSource(), personName: "", personEmail: "", applicationName: commCtxRef.current.appName, communicationFunction: commCtxRef.current.commFunction, communicationSignal: commCtxRef.current.commSignal, projectName: commCtxRef.current.projectName, peopleList: [] }),
      () => { /* handled inside the dialog */ }
    );
  }, [openManagedDialog]);

  const handleApply = useCallback(async (mode: SelectionMode) => {
    if (!dbReady) return;
    let text = "";
    try { text = await readOutlookText(mode); } catch { setStatus({ msg: "Failed to read email body.", ok: false }); return; }
    if (!text) { setStatus({ msg: mode === "selection" ? "Please select text in your email first." : "No text found in the email body.", ok: false }); return; }
    const { personName, personEmail } = getUserIdentity();
    const commConfig = getCommunicationConfig();
    const subject = await readSubject();
    const analyses = getAllAnalyses().map((a) => !a.id ? a : { ...a, questions: getQuestionsByAnalysis(a.id), errors: getErrorsByAnalysis(a.id), compensators: getCompensatorsByAnalysis(a.id), answers: getAnswersByAnalysis(a.id), files: getFilesByAnalysis(a.id) });
    const feedbacks = getAllFeedbacks().map((f) => !f.analysisId ? f : { ...f, questions: getQuestionsByAnalysis(f.analysisId), errors: getErrorsByAnalysis(f.analysisId), compensators: getCompensatorsByAnalysis(f.analysisId), answers: getAnswersByAnalysis(f.analysisId), files: getFilesByAnalysis(f.analysisId) });
    const initPayload: DialogInitPayload = { selection: text, mode, source: getSource(), personName, personEmail, applicationName: commCtxRef.current.appName || subject, communicationFunction: commCtxRef.current.commFunction, communicationSignal: commCtxRef.current.commSignal, projectName: commCtxRef.current.projectName || subject, peopleList: getPeopleNames(), peopleEmailMap: getPeopleEmailMap(), contacts: getAllPeople(), communicationPersonName: commConfig?.personName ?? "", communicationPersonEmail: commConfig?.personEmail ?? "", analyses, feedbacks };
    openManagedDialog(
      `${DIALOG_BASE}/dialog.html?view=apply`,
      DIALOG_SIZE,
      () => initPayload,
      (dialog, action) => {
        if (action.action === "SAVE_FEEDBACK") {
          const p = action.payload as SaveFeedbackPayload;
          try { saveFeedback(p); }
          catch (err) { setStatus({ msg: `Failed to save feedback: ${String(err)}`, ok: false }); dialog.close(); dialogRef.current = null; return; }
          if (p.feedback.feedbackType === "Provided" || p.feedback.feedbackType === "Applied") {
            const analysis = loadAnalysisForFeedback(p.feedback.analysisId);
            const html = p.feedback.feedbackType === "Applied"
              ? buildApplyFeedbackEmail(p.feedback, analysis)
              : buildProvideFeedbackEmail(p.feedback, analysis);
            openHtmlEmailDraft(html, p.toPersonEmail ?? "", p.feedback.feedbackSubject, p.feedback.feedbackApplication, (mailtoUrl) => {
              dialog.messageChild(JSON.stringify({ type: "SAVED", mailtoUrl } as HostMessage));
            });
          } else {
            dialog.close(); dialogRef.current = null;
          }
        }
      }
    );
  }, [dbReady, openManagedDialog]);

  const handleProvideFeedback = useCallback(async (mode: SelectionMode) => {
    if (!dbReady) return;
    let text = "";
    try { text = await readOutlookText(mode); } catch { setStatus({ msg: "Failed to read email body.", ok: false }); return; }
    if (!text) { setStatus({ msg: mode === "selection" ? "Please select text in your email first." : "No text found in the email body.", ok: false }); return; }
    const { personName, personEmail } = getUserIdentity();
    const commConfig = getCommunicationConfig();
    const subject = await readSubject();
    const initPayload: DialogInitPayload = { selection: text, mode, source: getSource(), personName, personEmail, applicationName: commCtxRef.current.appName || subject, communicationFunction: commCtxRef.current.commFunction, communicationSignal: commCtxRef.current.commSignal, projectName: commCtxRef.current.projectName || subject, peopleList: buildPeopleList(commConfig?.personName), peopleEmailMap: getPeopleEmailMap(), contacts: getAllPeople(), communicationPersonName: commConfig?.personName ?? "", communicationPersonEmail: commConfig?.personEmail ?? "" };
    openManagedDialog(
      `${DIALOG_BASE}/dialog.html?view=provide-feedback`,
      DIALOG_SIZE,
      () => initPayload,
      (dialog, action) => {
        if (action.action === "SAVE_FEEDBACK") {
          const p = action.payload as SaveFeedbackPayload;
          try { saveFeedback(p); }
          catch (err) { dialog.messageChild(JSON.stringify({ type: "ERROR", message: String(err) } as HostMessage)); return; }
          try { saveFeedbackHistory({ selectionAction: "Provided as Feedback", entityName: plainText(p.feedback.actualSelection) || plainText(p.feedback.feedbackApplication), actualSelection: p.feedback.feedbackApplication, selectionType: p.feedback.selectionType, source: p.feedback.source, applicationName: p.feedback.applicationName, communicationFunction: p.feedback.communicationFunction, communicationSignal: p.feedback.communicationSignal, projectName: p.feedback.projectName, personName: p.feedback.personName, personEmail: p.feedback.personEmail }); } catch { /* non-critical */ }
          {
            const analysis = loadAnalysisForFeedback(p.feedback.analysisId);
            const html = buildProvideFeedbackEmail(p.feedback, analysis);
            openHtmlEmailDraft(html, p.toPersonEmail ?? "", p.feedback.feedbackSubject, p.feedback.feedbackApplication, (mailtoUrl) => {
              dialog.messageChild(JSON.stringify({ type: "SAVED", mailtoUrl } as HostMessage));
            });
          }
        }
      }
    );
  }, [dbReady, openManagedDialog]);

  const handleRequestFeedback = useCallback(async () => {
    if (!dbReady) return;
    let text = "";
    try { text = await readOutlookText("paragraph"); } catch { setStatus({ msg: "Failed to read email body.", ok: false }); return; }
    if (!text) { setStatus({ msg: "No text found in the email body.", ok: false }); return; }
    const { personName, personEmail } = getUserIdentity();
    const commConfig = getCommunicationConfig();
    const subject = await readSubject();
    const initPayload: DialogInitPayload = { selection: text, mode: "paragraph", source: getSource(), personName, personEmail, applicationName: commCtxRef.current.appName || subject, communicationFunction: commCtxRef.current.commFunction, communicationSignal: commCtxRef.current.commSignal, projectName: commCtxRef.current.projectName, peopleList: buildPeopleList(commConfig?.personName), peopleEmailMap: getPeopleEmailMap(), contacts: getAllPeople(), communicationPersonName: commConfig?.personName ?? "", communicationPersonEmail: commConfig?.personEmail ?? "" };
    openManagedDialog(
      `${DIALOG_BASE}/dialog.html?view=request-feedback`,
      DIALOG_SIZE,
      () => initPayload,
      (dialog, action) => {
        if (action.action === "SAVE_REQUEST_FEEDBACK") {
          const p = action.payload as SaveRequestFeedbackPayload;
          try {
            saveCommSignalInfo({ fromPerson: p.fromPerson ?? "", toPerson: (p as { toPerson?: string }).toPerson ?? "", toPersonEmail: (p as { toPersonEmail?: string }).toPersonEmail ?? "", applicationName: p.applicationName ?? "", communicationFunction: p.communicationFunction ?? "", communicationSignalType: (p as { communicationSignalType?: string }).communicationSignalType ?? "", communicationSubject: p.communicationSubject ?? "", actualCommunication: p.actualCommunication ?? "", actualSelection: "", selectionType: "Request Feedback", entitySelected: "", files: (p as { files?: AttachFileToProject[] }).files ?? [] });
            const email = (p as { toPersonEmail?: string }).toPersonEmail ?? "";
            if (email) upsertPersonWithEmail((p as { toPerson?: string }).toPerson ?? "", email);
            try { saveFeedbackHistory({ selectionAction: "Requested Feedback With", entityName: p.fromPerson ?? "", actualSelection: p.applicationName ?? "", selectionType: "Request Feedback", source: getSource(), applicationName: p.applicationName ?? "", communicationFunction: p.communicationFunction ?? "", communicationSignal: (p as { communicationSignalType?: string }).communicationSignalType ?? "", projectName: "", personName: p.fromPerson ?? "", personEmail: "" }); } catch { /* non-critical */ }
          } catch (err) { setStatus({ msg: `Failed to save request: ${String(err)}`, ok: false }); }
          {
            const html = buildRequestFeedbackEmail(p);
            openHtmlEmailDraft(html, (p as { toPersonEmail?: string }).toPersonEmail ?? "", p.communicationSubject ?? "", p.actualCommunication ?? "", (mailtoUrl) => {
              dialog.messageChild(JSON.stringify({ type: "SAVED", mailtoUrl } as HostMessage));
            });
          }
        }
      }
    );
  }, [dbReady, openManagedDialog]);

  const handleFlaggedHistory = useCallback(() => {
    if (!dbReady) return;
    const flaggedEntities = getAllFlaggedSelections();
    const principleInterpretations = getAllInterpretations();
    const filesByInterpretationId: Record<number, AttachFileToProject[]> = {};
    for (const pi of principleInterpretations) {
      if (pi.id !== undefined) filesByInterpretationId[pi.id] = getFilesByPrincipleInterpretation(pi.id);
    }
    const { personName, personEmail } = getUserIdentity();
    openManagedDialog(
      `${DIALOG_BASE}/dialog.html?view=flagged-history`,
      DIALOG_SIZE,
      () => ({ selection: "", mode: "selection" as const, source: getSource(), personName, personEmail, applicationName: commCtxRef.current.appName, communicationFunction: commCtxRef.current.commFunction, communicationSignal: commCtxRef.current.commSignal, projectName: commCtxRef.current.projectName, peopleList: [], flaggedEntities, principleInterpretations, filesByInterpretationId }),
      (dialog, action) => {
        if (action.action === "DELETE_FLAG") {
          try { deleteFlag((action as { action: string; id: number }).id); }
          catch (err) { setStatus({ msg: `Delete failed: ${String(err)}`, ok: false }); }
        }
        if (action.action === "DELETE_INTERPRETED_PRINCIPLE") {
          try { deleteInterpretation((action as { action: string; id: number }).id); }
          catch (err) { setStatus({ msg: `Delete failed: ${String(err)}`, ok: false }); }
        }
        if (action.action === "REPORT_INTERPRETED_PRINCIPLE") openInterpretedPrincipleReport((action as { action: string; interpretation: PrincipleInterpretation }).interpretation);
        if (action.action === "ADD_ATTACHED_FILE") {
          const newId = addAttachedFile((action as { action: string; file: AttachFileToProject }).file as Omit<AttachFileToProject, "id">);
          dialog.messageChild(JSON.stringify({ type: "FILE_ADDED", id: newId }));
        }
        if (action.action === "REMOVE_ATTACHED_FILE") removeAttachedFile((action as { action: string; id: number }).id);
        if (action.action === "SAVE_RELATED_SELECTION") {
          try {
            const { payload } = action as { action: string; payload: SaveRelatedSelectionPayload };
            const newId = saveSelectionWithPrinciple(payload.record);
            for (const file of payload.files) addAttachedFile({ ...file, selectionWithPrincipleId: newId });
          } catch (err) { dialog.messageChild(JSON.stringify({ type: "ERROR", message: String(err) } as HostMessage)); }
        }
        if (action.action === "SAVE_PRINCIPLE_IN_SELECTION") {
          try {
            const { payload } = action as { action: string; payload: SavePrincipleInSelectionPayload };
            const newId = savePrincipleInSelection(payload.record);
            for (const file of payload.files) addAttachedFile({ ...file, principleInSelectionId: newId });
          } catch (err) { dialog.messageChild(JSON.stringify({ type: "ERROR", message: String(err) } as HostMessage)); }
        }
      }
    );
  }, [dbReady, openManagedDialog]);

  const handleAnalysisHistory = useCallback(() => {
    if (!dbReady) return;
    const { personName, personEmail } = getUserIdentity();
    const analyses = getAllAnalyses().map((a) => !a.id ? a : { ...a, questions: getQuestionsByAnalysis(a.id), errors: getErrorsByAnalysis(a.id), compensators: getCompensatorsByAnalysis(a.id), answers: getAnswersByAnalysis(a.id), problems: getProblemsByAnalysis(a.id), files: getFilesByAnalysis(a.id) });
    openManagedDialog(
      `${DIALOG_BASE}/dialog.html?view=analysis-history`,
      DIALOG_SIZE,
      () => ({ selection: "", mode: "selection" as const, source: getSource(), personName, personEmail, applicationName: commCtxRef.current.appName, communicationFunction: commCtxRef.current.commFunction, communicationSignal: commCtxRef.current.commSignal, projectName: commCtxRef.current.projectName, peopleList: [], analyses }),
      (dialog, action) => {
        if (action.action === "DELETE_ANALYSIS") {
          try { deleteAnalysis((action as { action: string; id: number }).id); }
          catch (err) { setStatus({ msg: `Delete failed: ${String(err)}`, ok: false }); }
        }
        if (action.action === "NAVIGATE_TO_APPLY") {
          const { analysisId } = action as { action: string; analysisId: number };
          const analysis = getAnalysisById(analysisId);
          if (!analysis) return;
          const { personName: pn, personEmail: pe } = getUserIdentity();
          const cc = getCommunicationConfig();
          const allAnalyses = getAllAnalyses().map((a) => !a.id ? a : { ...a, questions: getQuestionsByAnalysis(a.id), errors: getErrorsByAnalysis(a.id), compensators: getCompensatorsByAnalysis(a.id), answers: getAnswersByAnalysis(a.id), files: getFilesByAnalysis(a.id) });
          const allFeedbacks = getAllFeedbacks().map((f) => !f.analysisId ? f : { ...f, questions: getQuestionsByAnalysis(f.analysisId), errors: getErrorsByAnalysis(f.analysisId), compensators: getCompensatorsByAnalysis(f.analysisId), answers: getAnswersByAnalysis(f.analysisId), files: getFilesByAnalysis(f.analysisId) });
          dialog.messageChild(JSON.stringify({ type: "NAVIGATE", view: "apply", payload: { selection: analysis.entityUnderAnalysis?.replace(/<[^>]+>/g, "") ?? "", mode: analysis.selectionType === "Paragraph" ? "paragraph" : "selection", source: getSource(), personName: pn, personEmail: pe, applicationName: analysis.applicationName ?? "", communicationFunction: analysis.communicationFunction ?? "", communicationSignal: analysis.communicationSignal ?? "", projectName: analysis.projectName ?? "", peopleList: getPeopleNames(), communicationPersonName: cc?.personName ?? "", communicationPersonEmail: cc?.personEmail ?? "", analyses: allAnalyses, feedbacks: allFeedbacks } } as HostMessage));
        }
        if (action.action === "NAVIGATE_TO_PROVIDE") {
          const { analysisId } = action as { action: string; analysisId: number };
          const analysis = getAnalysisById(analysisId);
          if (!analysis) return;
          const { personName: pn, personEmail: pe } = getUserIdentity();
          const cc = getCommunicationConfig();
          dialog.messageChild(JSON.stringify({ type: "NAVIGATE", view: "provide-feedback", payload: { selection: analysis.entityUnderAnalysis?.replace(/<[^>]+>/g, "") ?? "", mode: "selection", source: getSource(), personName: pn, personEmail: pe, applicationName: analysis.applicationName ?? "", communicationFunction: analysis.communicationFunction ?? "", communicationSignal: analysis.communicationSignal ?? "", projectName: analysis.projectName ?? "", peopleList: buildPeopleList(cc?.personName), peopleEmailMap: getPeopleEmailMap(), contacts: getAllPeople(), communicationPersonName: cc?.personName ?? "", communicationPersonEmail: cc?.personEmail ?? "" } } as HostMessage));
        }
        if (action.action === "SAVE_FEEDBACK") {
          const p = action.payload as SaveFeedbackPayload;
          try { saveFeedback(p); }
          catch (err) { setStatus({ msg: `Failed to save feedback: ${String(err)}`, ok: false }); dialog.close(); dialogRef.current = null; return; }
          if (p.feedback.feedbackType === "Provided" || p.feedback.feedbackType === "Applied") {
            const analysis = loadAnalysisForFeedback(p.feedback.analysisId);
            const html = p.feedback.feedbackType === "Applied"
              ? buildApplyFeedbackEmail(p.feedback, analysis)
              : buildProvideFeedbackEmail(p.feedback, analysis);
            openHtmlEmailDraft(html, p.toPersonEmail ?? "", p.feedback.feedbackSubject, p.feedback.feedbackApplication, (mailtoUrl) => {
              dialog.messageChild(JSON.stringify({ type: "SAVED", mailtoUrl } as HostMessage));
            });
          } else {
            dialog.close(); dialogRef.current = null;
          }
        }
      }
    );
  }, [dbReady, openManagedDialog]);

  const handleFeedbackHistory = useCallback(() => {
    if (!dbReady) return;
    const { personName, personEmail } = getUserIdentity();

    const buildFeedbacks = () => getAllFeedbacks().map((f) => !f.analysisId ? f : { ...f, questions: getQuestionsByAnalysis(f.analysisId), errors: getErrorsByAnalysis(f.analysisId), compensators: getCompensatorsByAnalysis(f.analysisId), answers: getAnswersByAnalysis(f.analysisId), files: getFilesByAnalysis(f.analysisId) });

    openManagedDialog(
      `${DIALOG_BASE}/dialog.html?view=feedback-history`,
      DIALOG_SIZE,
      () => ({ selection: "", mode: "selection" as const, source: getSource(), personName, personEmail, applicationName: commCtxRef.current.appName, communicationFunction: commCtxRef.current.commFunction, communicationSignal: commCtxRef.current.commSignal, projectName: commCtxRef.current.projectName, peopleList: [], feedbacks: buildFeedbacks() }),
      (dialog, action) => {
        if (action.action === "DELETE_FEEDBACK") {
          try { deleteFeedback((action as { action: string; id: number }).id); }
          catch (err) { setStatus({ msg: `Delete failed: ${String(err)}`, ok: false }); }
        }
        if (action.action === "LIST_FEEDBACK_REQUESTED") {
          const { personName: pn, personEmail: pe } = getUserIdentity();
          dialog.messageChild(JSON.stringify({ type: "NAVIGATE", view: "list-feedback-requested", payload: { selection: "", mode: "selection", source: getSource(), personName: pn, personEmail: pe, applicationName: commCtxRef.current.appName, communicationFunction: commCtxRef.current.commFunction, communicationSignal: commCtxRef.current.commSignal, projectName: commCtxRef.current.projectName, peopleList: [], commSignalRequests: getCommSignalRequests() } } as HostMessage));
        }
        if (action.action === "BACK_TO_FEEDBACK_HISTORY") {
          const { personName: pn, personEmail: pe } = getUserIdentity();
          dialog.messageChild(JSON.stringify({ type: "NAVIGATE", view: "feedback-history", payload: { selection: "", mode: "selection", source: getSource(), personName: pn, personEmail: pe, applicationName: commCtxRef.current.appName, communicationFunction: commCtxRef.current.commFunction, communicationSignal: commCtxRef.current.commSignal, projectName: commCtxRef.current.projectName, peopleList: [], feedbacks: buildFeedbacks() } } as HostMessage));
        }
        if (action.action === "DELETE_COMM_SIGNAL_REQUEST") {
          try { deleteCommSignalRequest((action as { action: string; id: number }).id); }
          catch (err) { setStatus({ msg: `Delete failed: ${String(err)}`, ok: false }); }
        }
      }
    );
  }, [dbReady, openManagedDialog]);

  const handleRetainedHistory = useCallback(() => {
    if (!dbReady) return;
    const { personName, personEmail } = getUserIdentity();
    const analyses = getRetainedAnalyses().map((a) => !a.id ? a : { ...a, questions: getQuestionsByAnalysis(a.id), errors: getErrorsByAnalysis(a.id), compensators: getCompensatorsByAnalysis(a.id), answers: getAnswersByAnalysis(a.id), problems: getProblemsByAnalysis(a.id), files: getFilesByAnalysis(a.id) });
    openManagedDialog(
      `${DIALOG_BASE}/dialog.html?view=retained-history`,
      DIALOG_SIZE,
      () => ({ selection: "", mode: "selection" as const, source: getSource(), personName, personEmail, applicationName: commCtxRef.current.appName, communicationFunction: commCtxRef.current.commFunction, communicationSignal: commCtxRef.current.commSignal, projectName: commCtxRef.current.projectName, peopleList: [], analyses }),
      (_dialog, action) => {
        if (action.action === "DELETE_ANALYSIS") {
          try { deleteAnalysis((action as { action: string; id: number }).id); }
          catch (err) { setStatus({ msg: `Delete failed: ${String(err)}`, ok: false }); }
        }
      }
    );
  }, [dbReady, openManagedDialog]);

  const handleListSelection = useCallback(() => {
    if (!dbReady) return;
    const { personName, personEmail } = getUserIdentity();
    openManagedDialog(
      `${DIALOG_BASE}/dialog.html?view=selection-history`,
      DIALOG_SIZE,
      () => ({ selection: "", mode: "selection" as const, source: getSource(), personName, personEmail, applicationName: commCtxRef.current.appName, communicationFunction: commCtxRef.current.commFunction, communicationSignal: commCtxRef.current.commSignal, projectName: commCtxRef.current.projectName, peopleList: [], selectionHistories: getAllSelectionHistories() }),
      (_dialog, action) => {
        if (action.action === "DELETE_SELECTION_HISTORY") {
          try { deleteSelectionHistory((action as { action: string; id: number }).id); }
          catch (err) { setStatus({ msg: `Delete failed: ${String(err)}`, ok: false }); }
        }
      }
    );
  }, [dbReady, openManagedDialog]);

  const handleListIdentifiedPrinciple = useCallback(() => {
    if (!dbReady) return;
    openManagedDialog(
      `${DIALOG_BASE}/dialog.html?view=list-identified-principle`,
      DIALOG_SIZE,
      () => {
        const principlesInSelection = getPrinciplesInSelection();
        const filesByPrincipleInSelectionId: Record<number, import("@/types/db").AttachFileToProject[]> = {};
        for (const p of principlesInSelection) {
          if (p.id !== undefined) filesByPrincipleInSelectionId[p.id] = getFilesByPrincipleInSelection(p.id);
        }
        const { personName, personEmail } = getUserIdentity();
        return { selection: "", mode: "selection" as const, source: getSource(), personName, personEmail, applicationName: commCtxRef.current.appName, communicationFunction: commCtxRef.current.commFunction, communicationSignal: commCtxRef.current.commSignal, projectName: commCtxRef.current.projectName, peopleList: [], principlesInSelection, filesByPrincipleInSelectionId };
      },
      (dialog, action) => {
        if (action.action === "DELETE_PRINCIPLE") {
          try { deletePrincipleInSelection((action as { action: string; id: number }).id); }
          catch (err) { setStatus({ msg: `Delete failed: ${String(err)}`, ok: false }); return; }
          const principlesInSelection = getPrinciplesInSelection();
          const filesByPrincipleInSelectionId: Record<number, import("@/types/db").AttachFileToProject[]> = {};
          for (const p of principlesInSelection) {
            if (p.id !== undefined) filesByPrincipleInSelectionId[p.id] = getFilesByPrincipleInSelection(p.id);
          }
          const { personName, personEmail } = getUserIdentity();
          dialog.messageChild(JSON.stringify({ type: "INIT", payload: { selection: "", mode: "selection", source: getSource(), personName, personEmail, applicationName: commCtxRef.current.appName, communicationFunction: commCtxRef.current.commFunction, communicationSignal: commCtxRef.current.commSignal, projectName: commCtxRef.current.projectName, peopleList: [], principlesInSelection, filesByPrincipleInSelectionId } }));
        } else if (action.action === "REPORT_IDENTIFIED_PRINCIPLE") {
          const { principle } = action as { action: string; principle: import("@/types/db").PrincipleInSelection };
          openIdentifiedPrincipleReport(principle);
        }
      }
    );
  }, [dbReady, openManagedDialog]);

  const handleListInterpretedPrinciple = useCallback(() => {
    if (!dbReady) return;
    openManagedDialog(
      `${DIALOG_BASE}/dialog.html?view=list-interpreted-principle`,
      DIALOG_SIZE,
      () => {
        const principleInterpretations = getAllInterpretations();
        const filesByInterpretationId: Record<number, import("@/types/db").AttachFileToProject[]> = {};
        for (const pi of principleInterpretations) {
          if (pi.id !== undefined) filesByInterpretationId[pi.id] = getFilesByPrincipleInterpretation(pi.id);
        }
        const { personName, personEmail } = getUserIdentity();
        return { selection: "", mode: "selection" as const, source: getSource(), personName, personEmail, applicationName: commCtxRef.current.appName, communicationFunction: commCtxRef.current.commFunction, communicationSignal: commCtxRef.current.commSignal, projectName: commCtxRef.current.projectName, peopleList: [], principleInterpretations, filesByInterpretationId };
      },
      (dialog, action) => {
        if (action.action === "DELETE_INTERPRETED_PRINCIPLE") {
          try { deleteInterpretation((action as { action: string; id: number }).id); }
          catch (err) { setStatus({ msg: `Delete failed: ${String(err)}`, ok: false }); return; }
          const principleInterpretations = getAllInterpretations();
          const filesByInterpretationId: Record<number, import("@/types/db").AttachFileToProject[]> = {};
          for (const pi of principleInterpretations) {
            if (pi.id !== undefined) filesByInterpretationId[pi.id] = getFilesByPrincipleInterpretation(pi.id);
          }
          const { personName, personEmail } = getUserIdentity();
          dialog.messageChild(JSON.stringify({ type: "INIT", payload: { selection: "", mode: "selection", source: getSource(), personName, personEmail, applicationName: commCtxRef.current.appName, communicationFunction: commCtxRef.current.commFunction, communicationSignal: commCtxRef.current.commSignal, projectName: commCtxRef.current.projectName, peopleList: [], principleInterpretations, filesByInterpretationId } }));
        } else if (action.action === "REPORT_INTERPRETED_PRINCIPLE") {
          const { interpretation } = action as { action: string; interpretation: import("@/types/db").PrincipleInterpretation };
          openInterpretedPrincipleReport(interpretation);
        }
      }
    );
  }, [dbReady, openManagedDialog]);

  const handleListSelectionRelatedPrinciple = useCallback(() => {
    if (!dbReady) return;
    openManagedDialog(
      `${DIALOG_BASE}/dialog.html?view=list-selection-related-principle`,
      DIALOG_SIZE,
      () => {
        const selectionsWithPrinciple = getSelectionsWithPrinciple();
        const filesBySelectionWithPrincipleId: Record<number, import("@/types/db").AttachFileToProject[]> = {};
        for (const s of selectionsWithPrinciple) {
          if (s.id !== undefined) filesBySelectionWithPrincipleId[s.id] = getFilesBySelectionWithPrinciple(s.id);
        }
        const { personName, personEmail } = getUserIdentity();
        return { selection: "", mode: "selection" as const, source: getSource(), personName, personEmail, applicationName: commCtxRef.current.appName, communicationFunction: commCtxRef.current.commFunction, communicationSignal: commCtxRef.current.commSignal, projectName: commCtxRef.current.projectName, peopleList: [], selectionsWithPrinciple, filesBySelectionWithPrincipleId };
      },
      (dialog, action) => {
        if (action.action === "DELETE_RELATED_SELECTION") {
          try { deleteSelectionWithPrinciple((action as { action: string; id: number }).id); }
          catch (err) { setStatus({ msg: `Delete failed: ${String(err)}`, ok: false }); return; }
          const selectionsWithPrinciple = getSelectionsWithPrinciple();
          const filesBySelectionWithPrincipleId: Record<number, import("@/types/db").AttachFileToProject[]> = {};
          for (const s of selectionsWithPrinciple) {
            if (s.id !== undefined) filesBySelectionWithPrincipleId[s.id] = getFilesBySelectionWithPrinciple(s.id);
          }
          const { personName, personEmail } = getUserIdentity();
          dialog.messageChild(JSON.stringify({ type: "INIT", payload: { selection: "", mode: "selection", source: getSource(), personName, personEmail, applicationName: commCtxRef.current.appName, communicationFunction: commCtxRef.current.commFunction, communicationSignal: commCtxRef.current.commSignal, projectName: commCtxRef.current.projectName, peopleList: [], selectionsWithPrinciple, filesBySelectionWithPrincipleId } }));
        } else if (action.action === "REPORT_RELATED_SELECTION") {
          const { relation } = action as { action: string; relation: import("@/types/db").SelectionWithPrinciple };
          openRelatedPrincipleReport(relation);
        }
      }
    );
  }, [dbReady, openManagedDialog]);

  const handleListArticles = useCallback(() => {
    if (!dbReady) return;
    const { personName, personEmail } = getUserIdentity();
    openManagedDialog(
      `${DIALOG_BASE}/dialog.html?view=list-articles`,
      DIALOG_SIZE,
      () => ({ selection: "", mode: "selection" as const, source: getSource(), personName, personEmail, applicationName: commCtxRef.current.appName, communicationFunction: commCtxRef.current.commFunction, communicationSignal: commCtxRef.current.commSignal, projectName: commCtxRef.current.projectName, peopleList: [], articles: getAllArticles(), publishers: getAllPublishers() }),
      (dlg, action) => {
        const rebuildPayload = () => ({ selection: "", mode: "selection" as const, source: getSource(), personName, personEmail, applicationName: commCtxRef.current.appName, communicationFunction: commCtxRef.current.commFunction, communicationSignal: commCtxRef.current.commSignal, projectName: commCtxRef.current.projectName, peopleList: [], articles: getAllArticles(), publishers: getAllPublishers() });
        if (action.action === "DELETE_ARTICLE") {
          try { deleteArticle((action as { action: string; id: number }).id); }
          catch (err) { setStatus({ msg: `Delete failed: ${String(err)}`, ok: false }); }
        } else if (action.action === "PUBLISH_ARTICLE") {
          const pm = action as { action: string; id: number; publishers: string[] };
          try {
            publishArticle(pm.id, pm.publishers);
            dlg.messageChild(JSON.stringify({ type: "INIT", payload: rebuildPayload() }));
          } catch (err) { setStatus({ msg: `Publish failed: ${String(err)}`, ok: false }); }
        } else if (action.action === "ADD_PUBLISHER") {
          const ap = action as { action: string; name: string; logoBase64: string };
          try {
            savePublisher(ap.name, ap.logoBase64);
            dlg.messageChild(JSON.stringify({ type: "INIT", payload: rebuildPayload() }));
          } catch (err) { setStatus({ msg: `Add publisher failed: ${String(err)}`, ok: false }); }
        } else if (action.action === "DELETE_PUBLISHER") {
          const dp = action as { action: string; id: number };
          try {
            deletePublisher(dp.id);
            dlg.messageChild(JSON.stringify({ type: "INIT", payload: rebuildPayload() }));
          } catch (err) { setStatus({ msg: `Delete publisher failed: ${String(err)}`, ok: false }); }
        } else if (action.action === "EDIT_ARTICLE") {
          const ea = action as { action: string; id: number };
          const article = getArticleById(ea.id);
          if (!article) { setStatus({ msg: "Article not found.", ok: false }); return; }
          const editPayload: DialogInitPayload = { selection: "", mode: "selection" as const, source: getSource(), personName, personEmail, applicationName: commCtxRef.current.appName, communicationFunction: commCtxRef.current.commFunction, communicationSignal: commCtxRef.current.commSignal, projectName: commCtxRef.current.projectName, peopleList: [], editArticleData: article };
          dlg.messageChild(JSON.stringify({ type: "NAVIGATE", view: "create-article", payload: editPayload } as HostMessage));
        } else if (action.action === "SAVE_ARTICLE") {
          const p = action.payload as import("@/types/db").SaveArticlePayload;
          try {
            if (p.id !== undefined) { updateArticle(p.id, p); }
            else { saveArticle({ ...p, personName, personEmail, source: getSource() }); }
          } catch (err) { dlg.messageChild(JSON.stringify({ type: "ERROR", message: String(err) } as HostMessage)); return; }
          dlg.messageChild(JSON.stringify({ type: "NAVIGATE", view: "list-articles", payload: rebuildPayload() } as HostMessage));
        }
      }
    );
  }, [dbReady, openManagedDialog]);

  const handleCreateArticle = useCallback(() => {
    if (!dbReady) return;
    if (dialogRef.current) { setStatus({ msg: "Please close the open dialog first.", ok: false }); return; }
    const { personName: rawName, personEmail } = getUserIdentity();
    const commConfig = getCommunicationConfig();
    const personName = rawName || commConfig?.personName || "";

    const basePayload = (extra?: Partial<DialogInitPayload>): DialogInitPayload => ({
      selection: "", mode: "selection" as const, source: getSource(), personName, personEmail,
      applicationName: commCtxRef.current.appName, communicationFunction: commCtxRef.current.commFunction, communicationSignal: commCtxRef.current.commSignal, projectName: commCtxRef.current.projectName, peopleList: [],
      ...extra,
    });

    // Opens a dialog with READY→INIT + CLOSE handled; onMsg handles everything else.
    // Uses identity check on dialogRef to avoid stale-closure races during transitions.
    function openDlg(
      url: string,
      size: { height: number; width: number },
      payload: DialogInitPayload,
      onMsg: (dlg: Office.Dialog, action: DialogAction) => void,
      attempt = 0,
    ) {
      Office.context.ui.displayDialogAsync(url, { ...size, displayInIframe: true }, (result) => {
        if (result.status === Office.AsyncResultStatus.Failed) {
          if ((result.error as { code: number }).code === 12007 && attempt < 15) {
            setTimeout(() => openDlg(url, size, payload, onMsg, attempt + 1), 300);
            return;
          }
          dialogRef.current = null;
          setStatus({ msg: `Could not open dialog (${(result.error as { code: number }).code}).`, ok: false });
          return;
        }
        const dlg = result.value;
        dialogRef.current = dlg;
        dlg.addEventHandler(Office.EventType.DialogEventReceived, () => {
          if (dialogRef.current === dlg) dialogRef.current = null;
        });
        dlg.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
          const m = JSON.parse((msg as { message: string }).message) as DialogAction;
          if (m.action === "READY") { dlg.messageChild(JSON.stringify({ type: "INIT", payload } as HostMessage)); return; }
          if (m.action === "CLOSE") { dlg.close(); if (dialogRef.current === dlg) dialogRef.current = null; return; }
          onMsg(dlg, m);
        });
      });
    }

    function openWizard(templateName: string, wizardCategory: string) {
      // Re-send INIT with the latest user "Select Information" items (Point 14)
      // so the panel refreshes after each add/remove. Mirrors commands.ts.
      const reinit = (wzDlg: Office.Dialog) =>
        wzDlg.messageChild(JSON.stringify({
          type: "INIT",
          payload: basePayload({ templateName, wizardCategory, userInfoItems: getUserInformationItems() }),
        } as HostMessage));
      openDlg(
        `${DIALOG_BASE}/dialog.html?view=article-wizard`,
        ARTICLE_WIZARD_SIZE,
        basePayload({ templateName, wizardCategory, userInfoItems: getUserInformationItems() }),
        (wzDlg, action) => {
          if (action.action === "SAVE_ARTICLE_WIZARD") {
            const p = action.payload as SaveArticleWizardPayload;
            try {
              saveArticleWizard({ ...p, personName, personEmail, source: getSource() });
              wzDlg.messageChild(JSON.stringify({ type: "SAVED" } as HostMessage));
            } catch (err) {
              wzDlg.messageChild(JSON.stringify({ type: "ERROR", message: String(err) } as HostMessage));
            }
          }
          if (action.action === "SAVE_USER_INFO_ITEM") {
            try { addUserInformationItem(action.name, action.html); } catch { /* title required */ }
            reinit(wzDlg);
          }
          if (action.action === "DELETE_USER_INFO_ITEM") {
            deleteUserInformationItem(action.id);
            reinit(wzDlg);
          }
          if (action.action === "BACK_TO_PICKER") {
            wzDlg.close();
            if (dialogRef.current === wzDlg) dialogRef.current = null;
            openTemplatePicker();
          }
        },
      );
    }

    function openTemplatePicker() {
      openDlg(
        `${DIALOG_BASE}/dialog.html?view=template-picker`,
        CREATE_ARTICLE_TEMPLATE_SIZE,
        basePayload(),
        (tplDlg, action) => {
          if (action.action === "BACK") {
            tplDlg.close();
            if (dialogRef.current === tplDlg) dialogRef.current = null;
            openPicker();
          }
          if (action.action === "TEMPLATE_CONFIRMED") {
            const { templateName, category } = action as { action: string; templateName: string; category: string };
            tplDlg.close();
            if (dialogRef.current === tplDlg) dialogRef.current = null;
            openWizard(templateName, category);
          }
        },
      );
    }

    function openPicker() {
      openDlg(
        `${DIALOG_BASE}/dialog.html?view=create-article-picker`,
        CREATE_ARTICLE_PICKER_SIZE,
        basePayload(),
        (pickerDlg, action) => {
          if (action.action === "BLANK_SELECTED") {
            pickerDlg.close();
            if (dialogRef.current === pickerDlg) dialogRef.current = null;
            openDlg(
              `${DIALOG_BASE}/dialog.html?view=create-article`,
              CREATE_ARTICLE_DIALOG_SIZE,
              basePayload(),
              (formDlg, formAction) => {
                if (formAction.action === "SAVE_ARTICLE") {
                  const p = formAction.payload as SaveArticlePayload;
                  try { saveArticle({ ...p, personName, personEmail, source: getSource() }); }
                  catch (err) { formDlg.messageChild(JSON.stringify({ type: "ERROR", message: String(err) } as HostMessage)); return; }
                  formDlg.close();
                  if (dialogRef.current === formDlg) dialogRef.current = null;
                }
              },
            );
          }
          if (action.action === "TEMPLATE_SELECTED") {
            pickerDlg.close();
            if (dialogRef.current === pickerDlg) dialogRef.current = null;
            openTemplatePicker();
          }
        },
      );
    }

    openPicker();
  }, [dbReady]);

  const handleCommunicationConfig = useCallback(() => {
    if (!dbReady) return;
    const commConfig = getCommunicationConfig();
    let prefillName = "";
    let prefillEmail = "";
    try {
      const p = Office.context.mailbox.userProfile;
      const rawName = p.displayName ?? "";
      prefillName  = (rawName.includes("@") ? "" : rawName) || commConfig?.personName || "";
      prefillEmail = p.emailAddress || commConfig?.personEmail || "";
    } catch {
      prefillName  = commConfig?.personName  ?? "";
      prefillEmail = commConfig?.personEmail ?? "";
    }
    openManagedDialog(
      `${DIALOG_BASE}/dialog.html?view=communication-config`,
      COMM_CONFIG_SIZE,
      () => ({ selection: "", mode: "selection" as const, source: getSource(), personName: "", personEmail: "", applicationName: commCtxRef.current.appName, communicationFunction: commCtxRef.current.commFunction, communicationSignal: commCtxRef.current.commSignal, projectName: commCtxRef.current.projectName, peopleList: [], communicationPersonName: prefillName, communicationPersonEmail: prefillEmail }),
      (dialog, action) => {
        if (action.action === "SAVE_COMMUNICATION_CONFIG") {
          try {
            saveCommunicationConfig(action.payload as SaveCommunicationConfigPayload);
            dialog.close(); dialogRef.current = null;
          } catch (err) { setStatus({ msg: `Failed to save configuration: ${String(err)}`, ok: false }); }
        }
      }
    );
  }, [dbReady, openManagedDialog]);

  const handleRequestSLFeedback = useCallback(() => {
    if (!dbReady) return;
    const commConfig = getCommunicationConfig();
    const { personName, personEmail } = getUserIdentity();
    openManagedDialog(
      `${DIALOG_BASE}/dialog.html?view=request-sl-feedback`,
      DIALOG_SIZE,
      () => ({ selection: "", mode: "selection" as const, source: getSource(), personName, personEmail, applicationName: commCtxRef.current.appName, communicationFunction: commCtxRef.current.commFunction, communicationSignal: commCtxRef.current.commSignal, projectName: commCtxRef.current.projectName, peopleList: buildPeopleList(commConfig?.personName), communicationPersonName: commConfig?.personName ?? "", communicationPersonEmail: commConfig?.personEmail ?? "" }),
      (dialog, action) => {
        if (action.action === "SAVE_REQUEST_SL_FEEDBACK") {
          const p = action.payload as SaveRequestSLFeedbackPayload;
          try {
            saveCommSignalInfo({ fromPerson: p.fromPerson ?? "", toPerson: "Speak Logic", toPersonEmail: "support@speaklogic.org", applicationName: p.applicationName ?? "", communicationFunction: p.communicationFunction ?? "", communicationSignalType: (p as { communicationSignalType?: string }).communicationSignalType ?? "", communicationSubject: p.communicationSubject ?? "", actualCommunication: p.actualCommunication ?? "", actualSelection: "", selectionType: "Speak Logic Request", entitySelected: `Speak Logic feedback request on ${formatDisplayDate(nowDate())}`, files: (p as { files?: AttachFileToProject[] }).files ?? [] });
            try { saveFeedbackHistory({ selectionAction: "Requested Feedback From Speak Logic", entityName: p.fromPerson ?? "", actualSelection: p.applicationName ?? "", selectionType: "Speak Logic Request", source: getSource(), applicationName: p.applicationName ?? "", communicationFunction: p.communicationFunction ?? "", communicationSignal: "", projectName: "", personName: p.fromPerson ?? "", personEmail: "" }); } catch { /* non-critical */ }
          } catch (err) { setStatus({ msg: `Failed to save request: ${String(err)}`, ok: false }); }
          dialog.messageChild(JSON.stringify({ type: "SAVED", mailtoUrl: buildRequestSLMailtoUrl(p) } as HostMessage));
        }
      }
    );
  }, [dbReady, openManagedDialog]);

  const handleSimple = useCallback((view: string) => {
    openManagedDialog(
      `${DIALOG_BASE}/dialog.html?view=${view}`,
      view === "about" ? ABOUT_DIALOG_SIZE : DIALOG_SIZE,
      () => ({ selection: "", mode: "selection" as const, source: getSource(), personName: "", personEmail: "", applicationName: commCtxRef.current.appName, communicationFunction: commCtxRef.current.commFunction, communicationSignal: commCtxRef.current.commSignal, projectName: commCtxRef.current.projectName, peopleList: [] }),
      () => { /* no custom messages */ }
    );
  }, [openManagedDialog]);

  const handleClick = useCallback((id: string) => {
    setStatus(null);
    switch (id) {
      case "analyzeSelection":   void handleAnalyze("selection"); break;
      case "analyzeParagraph":   void handleAnalyze("paragraph"); break;
      case "flagSelection":      void handleFlag("selection"); break;
      case "flagParagraph":      void handleFlag("paragraph"); break;
      case "selectionConfig":    handleSelectionConfig(); break;
      case "applySelection":     void handleApply("selection"); break;
      case "applyParagraph":     void handleApply("paragraph"); break;
      case "provideFeedback":    void handleProvideFeedback("selection"); break;
      case "feedbackParagraph":  void handleProvideFeedback("paragraph"); break;
      case "requestFeedback":    void handleRequestFeedback(); break;
      case "flaggedSelection":   handleFlaggedHistory(); break;
      case "listAnalysis":       handleAnalysisHistory(); break;
      case "listFeedback":       handleFeedbackHistory(); break;
      case "listRetained":       handleRetainedHistory(); break;
      case "listSelection":                  handleListSelection(); break;
      case "listIdentifiedPrinciple":         handleListIdentifiedPrinciple(); break;
      case "listInterpretedPrinciple":        handleListInterpretedPrinciple(); break;
      case "listSelectionRelatedPrinciple":   handleListSelectionRelatedPrinciple(); break;
      case "communicationConfig":handleCommunicationConfig(); break;
      case "requestSLFeedback":  handleRequestSLFeedback(); break;
      case "createArticle":      handleCreateArticle(); break;
      case "listArticles":       handleListArticles(); break;
      case "help":               handleSimple("help"); break;
      case "about":              handleSimple("about"); break;
      default: break;
    }
  }, [handleAnalyze, handleFlag, handleSelectionConfig, handleApply, handleProvideFeedback, handleRequestFeedback, handleFlaggedHistory, handleAnalysisHistory, handleFeedbackHistory, handleRetainedHistory, handleListSelection, handleListIdentifiedPrinciple, handleListInterpretedPrinciple, handleListSelectionRelatedPrinciple, handleListArticles, handleCreateArticle, handleCommunicationConfig, handleRequestSLFeedback, handleSimple]);

  // ── render ────────────────────────────────────────────────────────────────

  // Comm Context fields are editable only while composing/replying; read-only when reading a received email.
  const composeMode = isComposeMode();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#FAFAFA" }}>
      {!dbReady && (
        <div style={{ padding: "6px 16px", background: "#EBF3FC", color: "#0078D4", fontSize: 11, flexShrink: 0 }}>
          Loading…
        </div>
      )}

      {/* Status bar */}
      {status && (
        <div style={{ padding: "8px 16px", background: status.ok ? "#DFF6DD" : "#FDE7E9", color: status.ok ? "#107C10" : "#A4262C", fontSize: 12, borderBottom: `1px solid ${status.ok ? "#BDDA9B" : "#F4B8BB"}`, flexShrink: 0 }}>
          {status.msg}
          <button onClick={() => setStatus(null)} style={{ float: "right", background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
        </div>
      )}

      {/* Communication Context Panel — fields editable only in compose/reply, read-only when reading a received email */}
      <div style={{ borderBottom: "1px solid #E0E0E0", background: "#FFFFFF", flexShrink: 0 }}>
        <button
          onClick={() => setCommCtxOpen((o) => !o)}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", background: "none", border: "none", borderBottom: commCtxOpen ? "1px solid #E8E8E8" : "none", cursor: "pointer" }}
        >
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: "#616161" }}>
            Communication Context
          </span>
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: commCtxOpen ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.15s", flexShrink: 0 }}>
            <path d="M1 1L5 5L9 1" stroke="#616161" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        {commCtxOpen && <div style={{ padding: "10px 12px 12px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 8px" }}>
          <div>
            <div style={{ fontSize: 10, color: "#616161", marginBottom: 3, fontWeight: 500 }}>App Name</div>
            <input
              disabled={!composeMode}
              style={{ width: "100%", height: 26, border: "1px solid #C7C7C7", fontSize: "11px", borderRadius: 3, padding: "0 6px", background: composeMode ? "#FFFFFF" : "#F2F2F2", fontFamily: "inherit", boxSizing: "border-box", color: composeMode ? "#1B1B1B" : "#616161", cursor: composeMode ? "text" : "not-allowed" }}
              value={commCtx.appName}
              onChange={(e) => updateCommCtx("appName", e.target.value)}
              placeholder="App name"
            />
          </div>
          <div>
            <div style={{ fontSize: 10, color: "#616161", marginBottom: 3, fontWeight: 500 }}>Project Name</div>
            <input
              disabled={!composeMode}
              style={{ width: "100%", height: 26, border: "1px solid #C7C7C7", fontSize: "11px", borderRadius: 3, padding: "0 6px", background: composeMode ? "#FFFFFF" : "#F2F2F2", fontFamily: "inherit", boxSizing: "border-box", color: composeMode ? "#1B1B1B" : "#616161", cursor: composeMode ? "text" : "not-allowed" }}
              value={commCtx.projectName}
              onChange={(e) => updateCommCtx("projectName", e.target.value)}
              placeholder="Project"
            />
          </div>
          <div>
            <div style={{ fontSize: 10, color: "#616161", marginBottom: 3, fontWeight: 500 }}>Comm. Function</div>
            <input
              disabled={!composeMode}
              style={{ width: "100%", height: 26, border: "1px solid #C7C7C7", fontSize: "11px", borderRadius: 3, padding: "0 6px", background: composeMode ? "#FFFFFF" : "#F2F2F2", fontFamily: "inherit", boxSizing: "border-box", color: composeMode ? "#1B1B1B" : "#616161", cursor: composeMode ? "text" : "not-allowed" }}
              value={commCtx.commFunction}
              onChange={(e) => updateCommCtx("commFunction", e.target.value)}
              placeholder="Function"
            />
          </div>
          <div>
            <div style={{ fontSize: 10, color: "#616161", marginBottom: 3, fontWeight: 500 }}>Comm. Signal</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: commCtx.commSignal === "Red" ? "#D13438" : commCtx.commSignal === "Blue" ? "#0078D4" : commCtx.commSignal === "Green" ? "#107C10" : "#BDBDBD" }} />
              <select
                disabled={!composeMode}
                style={{ flex: 1, height: 26, border: "1px solid #C7C7C7", fontSize: "11px", borderRadius: 3, padding: "0 2px", background: composeMode ? "#FFFFFF" : "#F2F2F2", fontFamily: "inherit", color: composeMode ? "#1B1B1B" : "#616161", cursor: composeMode ? "pointer" : "not-allowed" }}
                value={commCtx.commSignal}
                onChange={(e) => updateCommCtx("commSignal", e.target.value)}
              >
                <option value="">Signal</option>
                <option value="Red">Red</option>
                <option value="Blue">Blue</option>
                <option value="Green">Green</option>
              </select>
            </div>
          </div>
        </div>
        {isComposeMode() && (
          <button
            onClick={handleAttachCtx}
            title="Insert a visible context card at the end of this email so the recipient's sidebar can auto-fill these fields"
            onMouseEnter={(e) => { e.currentTarget.style.background = "#EBF3FC"; e.currentTarget.style.borderColor = "#0078D4"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#FFFFFF"; e.currentTarget.style.borderColor = "#C7C7C7"; }}
            style={{ marginTop: 10, width: "100%", height: 28, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "#FFFFFF", border: "1px solid #C7C7C7", borderRadius: 3, cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#0078D4", fontFamily: "inherit", transition: "background 0.12s, border-color 0.12s" }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.5 7.5L8 13C6.6 14.4 4.4 14.4 3 13C1.6 11.6 1.6 9.4 3 8L8.5 2.5C9.4 1.6 10.9 1.6 11.8 2.5C12.7 3.4 12.7 4.9 11.8 5.8L6.5 11.1C6 11.6 5.2 11.6 4.7 11.1C4.2 10.6 4.2 9.8 4.7 9.3L9.5 4.5" stroke="#0078D4" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            Attach Context to Email
          </button>
        )}
        </div>}
      </div>

      {/* Button grid */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px 20px" }}>
        {GROUPS.map((group) => (
          <div key={group.id} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: "#616161", marginBottom: 6, paddingBottom: 4, borderBottom: "1px solid #E8E8E8" }}>
              {group.label}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {group.items.map((btn) => {
                const hovered = hoveredBtn === btn.id;
                return (
                  <button
                    key={btn.id}
                    disabled={!dbReady}
                    onClick={() => handleClick(btn.id)}
                    onMouseEnter={() => setHoveredBtn(btn.id)}
                    onMouseLeave={() => setHoveredBtn(null)}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, padding: "10px 6px", background: hovered ? "#EBF3FC" : "#FFFFFF", border: `1px solid ${hovered ? "#0078D4" : "#E0E0E0"}`, borderRadius: 6, cursor: dbReady ? "pointer" : "default", opacity: dbReady ? 1 : 0.5, transition: "background 0.12s, border-color 0.12s", minHeight: 66 }}
                  >
                    <img src={`${DIALOG_BASE}/assets/${btn.icon}`} width={22} height={22} alt="" />
                    <span style={{ fontSize: 11, color: hovered ? "#0078D4" : "#1B1B1B", textAlign: "center", lineHeight: 1.3, fontWeight: 500 }}>
                      {btn.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: "8px 16px", borderTop: "1px solid #E0E0E0", fontSize: 10, color: "#9E9E9E", textAlign: "center", flexShrink: 0 }}>
        Speak Logic
      </div>
    </div>
  );
}
