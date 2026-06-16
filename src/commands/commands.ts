// src/commands/commands.ts

/* global Office Word */

const DIALOG_BASE = window.location.origin;


import { initDb, nowDate, formatDisplayDate } from "@/db/db";
import { saveFullAnalysis, getAllAnalyses, getAnalysisById, getRetainedAnalyses, deleteAnalysis, getErrorsByAnalysis, getQuestionsByAnalysis, getCompensatorsByAnalysis, getAnswersByAnalysis, getFilesByAnalysis, getProblemsByAnalysis, getProblemsByFeedback } from "@/db/queries/analysis";
import { saveFeedback, saveFeedbackHistory, saveCommSignalInfo, getAllFeedbacks, deleteFeedback, getCommSignalRequests, deleteCommSignalRequest } from "@/db/queries/feedback";
import { saveFlag, getAllFlaggedSelections, deleteFlag, getAllSelectionHistories, deleteSelectionHistory, getAllFlaggedArticles, deleteFlaggedArticle } from "@/db/queries/flag";
import { getAllInterpretations, deleteInterpretation, getFilesByPrincipleInterpretation, addAttachedFile, removeAttachedFile, saveSelectionWithPrinciple, savePrincipleInSelection, getPrinciplesInSelection, getSelectionsWithPrinciple, deletePrincipleInSelection, deleteSelectionWithPrinciple, getFilesByPrincipleInSelection, getFilesBySelectionWithPrinciple, saveInterpretation } from "@/db/queries/principle";
import { getPeopleNames, getPeopleEmailMap, upsertPersonName, upsertPersonWithEmail, getAllPeople, updatePersonById, deletePersonById, addPersonContact } from "@/db/queries/people";
import { getCommunicationConfig, saveCommunicationConfig } from "@/db/queries/communication";
import { getKeywordRules, getKeywordSetting, saveKeywordRules, findBannedWords } from "@/db/queries/keywords";
import { saveArticle, updateArticle, publishArticle, saveArticleWizard, getAllArticles, deleteArticle, getArticleById } from "@/db/queries/article";
import { getAllPublishers, savePublisher, deletePublisher } from "@/db/queries/publisher";
import { saveProblemSolution } from "@/db/queries/problem";
import { getUserInformationItems, addUserInformationItem, deleteUserInformationItem } from "@/db/queries/information";
import { dbg, clearLog } from "@/debug/log";
import { openInterpretedPrincipleReport, openIdentifiedPrincipleReport, openRelatedPrincipleReport } from "@/dialog/utils/reportGenerator";
import { formatArticleForAnalysis } from "@/dialog/utils/formatArticleForAnalysis";
import {
  buildProvideFeedbackEmail,
  buildApplyFeedbackEmail,
  buildRequestFeedbackEmail,
} from "@/dialog/utils/emailTemplates";
import type { ProjectAnalysis } from "@/types/db";

function buildPeopleList(commPersonName?: string): string[] {
  const names = getPeopleNames();
  if (commPersonName && !names.includes(commPersonName)) {
    return [commPersonName, ...names];
  }
  return names;
}
import type {
  DialogAction,
  DialogInitPayload,
  FlagEntityForAnalysis,
  HostMessage,
  HostSource,
  SaveAnalysisPayload,
  SaveArticlePayload,
  SaveCommunicationConfigPayload,
  SaveKeywordRulesPayload,
  SaveFeedbackPayload,
  SaveRelatedSelectionPayload,
  SavePrincipleInSelectionPayload,
  SaveInterpretationPayload,
  SaveRequestFeedbackPayload,
  SaveRequestSLFeedbackPayload,
  SelectionMode,
} from "@/types/db";

// Scales a base width % (tuned for 1920px screens) to the current screen size.
// Uses the same breakpoints as the main dialog so all dialogs grow/shrink together.
function adaptiveWidth(base: number): number {
  const sw = typeof window !== "undefined" && window.screen ? window.screen.width : 1920;
  if (sw < 1280) return Math.round(base * 78 / 43);  // small / tablet
  if (sw < 1440) return Math.round(base * 70 / 43);  // 13" laptop
  if (sw <= 1512) return Math.round(base * 52 / 43); // 14" MacBook (1512px logical)
  if (sw < 1920) return Math.round(base * 57 / 43);  // 15" MacBook / laptop
  return base;                                        // full HD and larger (original default)
}
const DIALOG_SIZE = { height: 69, width: adaptiveWidth(43) } as const;
// Flag dialog: computed dynamically via pixel formula in openFlagDialog
// Selection Config dialog: 480×428px → 52% height, 25% width on 1920px
const SELECTION_CONFIG_DIALOG_SIZE = { height: 52, width: adaptiveWidth(25) } as const;
// About dialog: 604×292px → 27% height, 32% width on 1920px
const ABOUT_DIALOG_SIZE = { height: 27, width: adaptiveWidth(32) } as const;
// Create Article dialog: 520×508px → 61% height, 27% width on 1920px
// Picker (260×163px on 1920px): width=16%, height=30%
const CREATE_ARTICLE_PICKER_SIZE        = { height: 30, width: adaptiveWidth(16) } as const;
const CREATE_ARTICLE_TEMPLATE_SIZE      = { height: 56, width: adaptiveWidth(27) } as const;
const CREATE_ARTICLE_DIALOG_SIZE        = { height: 61, width: adaptiveWidth(27) } as const;
const ARTICLE_WIZARD_SIZE               = { height: 53, width: adaptiveWidth(27) } as const;

let dbInitialized = false;

// Thin passthrough kept so all call sites share one entry point for opening dialogs.
function _trackDialogAsync(
  url: string,
  options: { height?: number; width?: number; displayInIframe?: boolean },
  callback: (result: Office.AsyncResult<Office.Dialog>) => void
): void {
  Office.context.ui.displayDialogAsync(url, options, callback);
}

Office.onReady(() => {
  clearLog();
  dbg("HOST", "Office.onReady — commands.ts loaded, registering handlers");
  registerHandlers();
  ensureDb();
});

async function ensureDb(): Promise<void> {
  if (dbInitialized) return;
  try {
    await initDb();
    dbInitialized = true;
  } catch (err) {
    dbg("HOST", "ensureDb FAILED", String(err));
    throw err;
  }
}

function registerHandlers(): void {
  Office.actions.associate("analyzeSelection", (event) => openAnalyzeDialog("selection", event));
  Office.actions.associate("analyzeParagraph", (event) => openAnalyzeDialog("paragraph", event));
  Office.actions.associate("flagSelection", (event) =>
    openFlagDialogFromRibbon("selection", event)
  );
  Office.actions.associate("flagParagraph", (event) =>
    openFlagDialogFromRibbon("paragraph", event)
  );
  Office.actions.associate("selectionConfig", (event) =>
    openSelectionConfigDialog(event)
  );
  Office.actions.associate("applySelection", (event) =>
    openApplyDialogFromRibbon("selection", event)
  );
  Office.actions.associate("applyParagraph", (event) =>
    openApplyDialogFromRibbon("paragraph", event)
  );
  Office.actions.associate("provideFeedbackSelection", (event) =>
    openProvideFeedbackFromRibbon("selection", event)
  );
  Office.actions.associate("provideFeedbackParagraph", (event) =>
    openProvideFeedbackFromRibbon("paragraph", event)
  );
  Office.actions.associate("requestFeedback", (event) =>
    void openRequestFeedbackFromRibbon(event)
  );
  Office.actions.associate("flaggedSelection", (event) =>
    openFlaggedHistoryDialog(event)
  );
  Office.actions.associate("listAnalysis", (event) =>
    openAnalysisHistoryDialog(event)
  );
  Office.actions.associate("listFeedback", (event) =>
    openFeedbackHistoryDialog(event)
  );
  Office.actions.associate("listFeedbackRequested", (event) =>
    openFeedbackHistoryDialog(event)
  );
  Office.actions.associate("listRetained", (event) =>
    openRetainedHistoryDialog(event)
  );
  Office.actions.associate("listSelection", (event) =>
    void openListSelectionDialog(event)
  );
  Office.actions.associate("listIdentifiedPrinciple", (event) =>
    void openListIdentifiedPrincipleDialog(event)
  );
  Office.actions.associate("listInterpretedPrinciple", (event) =>
    void openListInterpretedPrincipleDialog(event)
  );
  Office.actions.associate("listSelectionRelatedPrinciple", (event) =>
    void openListSelectionRelatedPrincipleDialog(event)
  );
  Office.actions.associate("requestSLFeedback", (event) =>
    void openRequestSLFeedbackDialog(event)
  );
  Office.actions.associate("help", (event) => openViewDialogSimple("help", event));
  Office.actions.associate("helpArticle", (event) => {
    showNoSelectionMessage(
      "Open Help Message",
      "Currently, there is no help document available yet. Support request can be forwarded to by using the request feedback from the help menu.  In term of documentation, to enable the learning of the principle of communication, all documentations are downloadable from The Speak Logic website.",
      event
    );
  });
  Office.actions.associate("about", (event) => openAboutDialog(event));
  Office.actions.associate("communicationConfig", (event) => openCommunicationConfigDialog(event));
  Office.actions.associate("keywordSettings", (event) => openKeywordSettingsDialog(event));
  // Outlook Smart Alerts: runs when the user clicks Send (see manifest LaunchEvent).
  Office.actions.associate("onMessageSendHandler", onMessageSendHandler);
  Office.actions.associate("createArticle", (event) =>
    void openCreateArticleDialog(event)
  );
  Office.actions.associate("listArticles", (event) =>
    void openListArticlesDialog(event)
  );
  Office.actions.associate("listFlaggedArticles", (event) =>
    void openFlaggedArticlesDialog(event)
  );
  Office.actions.associate("openPeople", (event) => openPeopleDialog(event));
}

// 12007: dialog already open — user can still see it; complete silently.
// All other codes: unexpected failure — open a message dialog to tell the user.
function handleDialogOpenError(
  error: { code: number; message: string },
  event: Office.AddinCommands.Event
): void {
  if ((error as { code: number }).code === 12007) { event.completed(); return; }
  const code = (error as { code: number }).code;
  showNoSelectionMessage(
    "Dialog Error",
    `Speak Logic could not open the dialog (code ${code}). Please close any open dialogs and try again.`,
    event
  );
}

// Sends a typed ERROR message to an open dialog so the view can show it inline.
// Best-effort — if messageChild itself fails, nothing more can be done.
function replyError(dialog: Office.Dialog, message: string): void {
  try { dialog.messageChild(JSON.stringify({ type: "ERROR", message } as HostMessage)); }
  catch { /* messageChild failed — nothing more to do */ }
}

// Gets text from the host and handles every failure path: API errors and empty
// selection both show the message dialog instead of silently completing the event.
async function fetchSelectionOrNotify(
  mode: SelectionMode,
  emptyTitle: string,
  emptyText: string,
  event: Office.AddinCommands.Event
): Promise<{ text: string; selectionHtml?: string; documentTitle: string; documentName: string; pageNumber: string } | null> {
  let meta: { text: string; selectionHtml?: string; documentTitle: string; documentName: string; pageNumber: string };
  try {
    meta = await getHostTextAndMeta(mode);
  } catch (err) {
    showNoSelectionMessage("Unable to Read Selection", String(err), event);
    return null;
  }
  if (!meta.text) {
    showNoSelectionMessage(emptyTitle, emptyText, event);
    return null;
  }
  return meta;
}

// overhead = header(58) + divider(1) + body-padding(40) + footer(64) = 163px
// +50 for Office.js chrome + safety buffer
// Desktop Word: % is of screen height (~1080px). Word Online: % is of the Office frame (smaller).
function estimateMessageDialogPct(text: string): number {
  const lines = Math.max(1, Math.ceil(text.length / 60));
  const dialogPx = 163 + lines * 22 + 50;
  const isOnline = Office.context.platform === Office.PlatformType.OfficeOnline;
  const ref = isOnline ? 900 : 1080;
  return Math.min(Math.max(Math.ceil((dialogPx / ref) * 100), 22), 60);
}

// Returns a wrapper around event.completed() that only fires once, regardless of
// how many times it is called. Needed because dialog.close() can trigger
// DialogEventReceived in some Office builds, causing a second event.completed()
// call that corrupts Word's event state and freezes text editing.
function makeEventCompleter(event: Office.AddinCommands.Event): () => void {
  let done = false;
  return () => { if (!done) { done = true; event.completed(); } };
}

function showNoSelectionMessage(
  title: string,
  text: string,
  event: Office.AddinCommands.Event
): void {
  const heightPct = estimateMessageDialogPct(text);
  const complete = makeEventCompleter(event);
  _trackDialogAsync(
    `${DIALOG_BASE}/dialog.html?view=message&title=${encodeURIComponent(title)}&text=${encodeURIComponent(text)}`,
    { height: heightPct, width: adaptiveWidth(26), displayInIframe: true },
    (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) {
        // Simple fallback — do NOT call handleDialogOpenError here (would recurse).
        complete();
        return;
      }
      const dialog = result.value;
      dialog.addEventHandler(Office.EventType.DialogMessageReceived, (args) => {
        if (!("message" in args)) return;
        const msg = JSON.parse((args as { message: string }).message) as { action: string };
        if (msg.action === "CLOSE") {
          try { dialog.close(); } catch { }
          complete();
        }
      });
      dialog.addEventHandler(Office.EventType.DialogEventReceived, (evt) => {
        // 12006 = user closed via X; 12002/12003 = nav errors — all paths must complete the event.
        void (evt as { error: number }).error;
        complete();
      });
    }
  );
}

function getSource(): HostSource {
  if (Office.context.host === Office.HostType.Outlook) return "Outlook Mail";
  if (Office.context.host === Office.HostType.PowerPoint) return "PowerPoint Document";
  return "Word Document";
}

function getUserIdentity(): { personName: string; personEmail: string } {
  try {
    if (Office.context.host === Office.HostType.Outlook) {
      const p = Office.context.mailbox.userProfile;
      const rawName = p.displayName ?? "";
      // Desktop Outlook sometimes returns the email address as displayName — treat it as no name
      const personName = rawName.includes("@") ? "" : rawName;
      return { personName, personEmail: p.emailAddress ?? "" };
    }
    // Word / PowerPoint: no automatic identity API available
    return { personName: "", personEmail: "" };
  } catch {
    return { personName: "", personEmail: "" };
  }
}

async function getPowerPointText(_mode: SelectionMode): Promise<string> {
  return new Promise<string>((resolve) => {
    Office.context.document.getSelectedDataAsync(
      Office.CoercionType.Text,
      (result) => {
        // Failed means no text box is focused or no text selected — resolve "" so
        // the caller can show the message dialog rather than swallowing the event.
        if (result.status === Office.AsyncResultStatus.Failed) {
          resolve("");
          return;
        }
        resolve((result.value as string)?.trim() ?? "");
      }
    );
  });
}

async function getPowerPointTextAndMeta(mode: SelectionMode): Promise<{ text: string; documentTitle: string; documentName: string }> {
  const text = await getPowerPointText(mode);
  const url = (Office.context.document as { url?: string }).url ?? "";
  const documentName = url ? (url.split("/").pop()?.split("\\").pop() ?? "") : "";
  return { text, documentTitle: "", documentName };
}

async function getOutlookText(mode: SelectionMode): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const item = (Office.context.mailbox.item) as any;
    if (!item) { resolve(""); return; }

    const getFullBody = () => {
      item.body.getAsync(
        Office.CoercionType.Text,
        (result: Office.AsyncResult<string>) => {
          if (result.status === Office.AsyncResultStatus.Failed) {
            reject(new Error(result.error?.message ?? "Failed to get email body"));
            return;
          }
          resolve(result.value?.trim() ?? "");
        }
      );
    };

    // getSelectedDataAsync only exists in compose mode (Mailbox 1.2+)
    if (typeof item.getSelectedDataAsync === "function") {
      item.getSelectedDataAsync(
        Office.CoercionType.Text,
        (result: Office.AsyncResult<{ data: string; sourceProperty: string }>) => {
          const selected = (result.value?.data ?? "").trim();
          if (selected) { resolve(selected); return; }
          // "Selection" buttons require actual highlighted text — return "" so the
          // caller shows the "Text Selection Message" dialog, matching Word behaviour.
          // "Paragraph" buttons fall back to the full body.
          if (mode === "selection") { resolve(""); return; }
          getFullBody();
        }
      );
    } else {
      // Read mode — no selection API. Selection buttons can't work here (return ""
      // so the caller shows the "Text Selection Message" dialog); paragraph buttons read the full body.
      if (mode === "selection") { resolve(""); return; }
      getFullBody();
    }
  });
}

async function getOutlookTextAndMeta(mode: SelectionMode): Promise<{ text: string; documentTitle: string; documentName: string }> {
  const text = await getOutlookText(mode);
  let subject = "";
  try {
    const rawSubject = (Office.context.mailbox.item as { subject?: string | { getAsync?: unknown } }).subject;
    if (typeof rawSubject === "string") subject = rawSubject;
  } catch { /* ignore */ }
  // An email has no "file name" — use the subject only as the title so buildEntityName
  // does not emit the subject twice (e.g. "Subject  File: Subject").
  return { text, documentTitle: subject, documentName: "" };
}

async function getHostTextAndMeta(mode: SelectionMode): Promise<{ text: string; selectionHtml?: string; documentTitle: string; documentName: string; pageNumber: string }> {
  if (Office.context.host === Office.HostType.Outlook) return { ...await getOutlookTextAndMeta(mode), pageNumber: "" };
  if (Office.context.host === Office.HostType.PowerPoint) return { ...await getPowerPointTextAndMeta(mode), pageNumber: "" };
  return getWordTextAndMeta(mode);
}

async function getWordTextAndMeta(mode: SelectionMode): Promise<{ text: string; selectionHtml: string; documentTitle: string; documentName: string; pageNumber: string }> {
  // Word for the web has no persistent runtime (no taskpane — every command is
  // ExecuteFunction), so the paragraph cannot be pre-captured; it is read at command time.
  if (Office.context.platform === Office.PlatformType.OfficeOnline) {
    const url = (Office.context.document as { url?: string }).url ?? "";
    const documentName = url ? (url.split("/").pop()?.split("\\").pop() ?? "") : "";

    if (mode === "selection") {
      // getSelectedDataAsync never takes the web edit-lock, so selection mode uses it.
      const read = (coercion: Office.CoercionType) =>
        new Promise<string>((resolve) => {
          Office.context.document.getSelectedDataAsync(coercion, (r) =>
            resolve(r.status === Office.AsyncResultStatus.Failed ? "" : ((r.value as string) ?? ""))
          );
        });
      const text = (await read(Office.CoercionType.Text)).replace(/\u00A0/g, " ").trim();
      const selectionHtml = text ? await read(Office.CoercionType.Html) : "";
      return { text, selectionHtml, documentTitle: "", documentName, pageNumber: "" };
    }

    // Paragraph mode needs Word.run to expand the collapsed cursor to its paragraph — there
    // is no Common-API equivalent. Keep this batch MINIMAL: a single context.sync() that reads
    // only the paragraph text. Each extra sync (getHtml, document.title, pages) holds the web
    // edit session open longer and is what leaves the document read-only/frozen after the
    // dialog closes. Trade-off on web: paragraph mode has no rich HTML, title, or page number.
    try {
      return await Word.run(async (context) => {
        const para = context.document.getSelection().paragraphs.getFirst();
        para.load("text");
        await context.sync();
        const text = para.text.replace(/\u00A0/g, " ").trim();
        return { text, selectionHtml: "", documentTitle: "", documentName, pageNumber: "" };
      });
    } catch (err) {
      dbg("HOST", "web paragraph Word.run threw", String(err));
      return { text: "", selectionHtml: "", documentTitle: "", documentName, pageNumber: "" };
    }
  }

  try {
    return await Word.run(async (context) => {
      let text = "";
      let textRange: Word.Range;
      if (mode === "selection") {
        const sel = context.document.getSelection();
        sel.load("text");
        await context.sync();
        // Replace NBSP ( ) with regular space so .trim() treats it as empty content.
        // Word Online can produce NBSP in otherwise-empty ranges.
        text = sel.text.replace(/\u00A0/g, " ").trim();
        textRange = sel;
      } else {
        const sel = context.document.getSelection();
        const para = sel.paragraphs.getFirst();
        para.load("text");
        await context.sync();
        text = para.text.replace(/\u00A0/g, " ").trim();
        textRange = para.getRange();
      }

      // Short-circuit: no selection → no HTML needed; caller will show the message dialog.
      // Avoids calling getHtml() on a collapsed range, which can throw in some Word versions.
      if (!text) {
        return { text: "", selectionHtml: "", documentTitle: "", documentName: "", pageNumber: "" };
      }

      const props = context.document.properties;
      props.load("title");
      await context.sync();
      const documentTitle = props.title ?? "";
      const url = (Office.context.document as { url?: string }).url ?? "";
      const documentName = url ? (url.split("/").pop()?.split("\\").pop() ?? "") : "";

      // getHtml() can throw GeneralException on Word Online for complex content (tracked changes,
      // tables, embedded objects). Isolate it so the dialog still opens with plain text on failure.
      let selectionHtml = "";
      try {
        const htmlResult = textRange.getHtml();
        await context.sync();
        selectionHtml = htmlResult.value ?? "";
      } catch { /* non-critical — HTML unavailable for this content type */ }

      let pageNumber = "";
      if (Office.context.requirements.isSetSupported("WordApiDesktop", "1.2")) {
        try {
          const pages = textRange.pages;
          pages.load("items");
          await context.sync();
          if (pages.items.length > 0) {
            pages.items[0].load("index");
            await context.sync();
            pageNumber = String(pages.items[0].index);
          }
        } catch { /* non-critical */ }
      }

      return { text, selectionHtml, documentTitle, documentName, pageNumber };
    });
  } catch (err) {
    // Word.run failed entirely (e.g. GeneralException on Word Online for tracked-change content,
    // document permission errors, or other Word internals). Fall back to getSelectedDataAsync
    // for plain text — no HTML or metadata, but the dialog still opens instead of crashing.
    dbg("HOST", "getWordTextAndMeta Word.run threw — falling back to getSelectedDataAsync", String(err));
    const text = await new Promise<string>((resolve) => {
      Office.context.document.getSelectedDataAsync(
        Office.CoercionType.Text,
        (result) => { resolve(result.status === Office.AsyncResultStatus.Failed ? "" : ((result.value as string)?.trim() ?? "")); }
      );
    });
    return { text, selectionHtml: "", documentTitle: "", documentName: "", pageNumber: "" };
  }
}

function buildEntityName(documentTitle: string, documentName: string, pageNumber = ""): string {
  try {
    const raw = localStorage.getItem("sl-selection-config");
    const cfg = raw ? JSON.parse(raw) : {};
    const useName = cfg.titleAsApplicationName    !== false;
    const useFile = cfg.showFileNameInApplication !== false;
    const usePage = cfg.showPageNumberInFileName  !== false;
    // Strip the Office file extension (e.g. ".docx") so the entity name reads cleanly.
    // On the web the file name comes from the URL and carries its extension; desktop
    // usually shows the document title instead, so this keeps both consistent.
    const cleanName = documentName.replace(/\.(docx?|docm|dotx?|rtf|txt|odt)$/i, "");
    let result = "";
    if (useName && documentTitle) result = documentTitle;
    if (useFile && cleanName)     result = result ? result + "  File: " + cleanName : "File: " + cleanName;
    if (usePage && pageNumber)    result = result ? result + "  Page: " + pageNumber : "Page: " + pageNumber;
    return result;
  } catch {
    return "";
  }
}

// Strip HTML/entities to plain text for audit-row entity names. Paragraph-mode
// entityUnderAnalysis is sanitized Word HTML; the SelectionHistory list must show
// readable text, not raw `<div class="OutlineGroup" …>` markup.
function plainText(html: string | undefined | null): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

// Replaces the current host selection with the user's selected editor content.
// Prefers HTML (preserves bold/heading/etc) when the host supports it:
//  - Word: Word.run → Range.insertHtml when html, else insertText
//  - PowerPoint: setSelectedDataAsync (Text only — PPT API does not accept HTML
//    for setSelectedDataAsync; HTML is ignored, plain text used)
//  - Outlook compose: setSelectedDataAsync with CoercionType.Html when html
// Best-effort; failures are swallowed because the dialog stays open and the user can retry.
function insertTextAtCursor(text: string, html?: string): void {
  if (!text && !html) return;
  try {
    if (Office.context.host === Office.HostType.Word) {
      Word.run(async (ctx) => {
        const range = ctx.document.getSelection();
        if (html) {
          range.insertHtml(html, Word.InsertLocation.replace);
        } else {
          range.insertText(text, Word.InsertLocation.replace);
        }
        await ctx.sync();
      }).catch((err) => dbg("HOST", "insertTextAtCursor Word.run failed", String(err)));
    } else if (Office.context.host === Office.HostType.PowerPoint) {
      // PowerPoint setSelectedDataAsync supports Text only — no HTML option.
      Office.context.document.setSelectedDataAsync(
        text,
        { coercionType: Office.CoercionType.Text },
        (result) => {
          if (result.status === Office.AsyncResultStatus.Failed) {
            dbg("HOST", "insertTextAtCursor PPT failed", result.error?.message);
          }
        }
      );
    } else if (Office.context.host === Office.HostType.Outlook) {
      const item = Office.context.mailbox?.item as Office.MessageCompose | undefined;
      if (!item?.body?.setSelectedDataAsync) {
        dbg("HOST", "insertTextAtCursor Outlook: not in compose mode");
        return;
      }
      item.body.setSelectedDataAsync(
        html ?? text,
        { coercionType: html ? Office.CoercionType.Html : Office.CoercionType.Text },
        (result) => {
          if (result.status === Office.AsyncResultStatus.Failed) {
            dbg("HOST", "insertTextAtCursor Outlook failed", result.error?.message);
          }
        }
      );
    }
  } catch (err) {
    dbg("HOST", "insertTextAtCursor threw", String(err));
  }
}

// Returns true if the compose window was opened; false if unavailable (caller should pass the
// URL to the dialog instead so the user can click the link natively).
function openMailtoUrl(url: string): boolean {
  dbg("HOST", "openMailtoUrl", { host: Office.context.host, url: url?.slice(0, 80) });
  if (Office.context.host === Office.HostType.Outlook) {
    // displayNewMessageForm is read-mode only — in compose context it is undefined.
    // openBrowserWindow does not support mailto: protocol, so there is no fallback.
    if (typeof Office.context.mailbox.displayNewMessageForm !== "function") {
      dbg("HOST", "displayNewMessageForm unavailable (compose mode) — passing URL to dialog");
      return false;
    }
    try {
      const withoutScheme = url.replace(/^mailto:/, "");
      const [rawTo, rawQuery] = withoutScheme.split("?");
      const to = decodeURIComponent(rawTo || "");
      const params = new URLSearchParams(rawQuery ?? "");
      const form = {
        toRecipients: to ? [to] : [],
        subject: params.get("subject") ?? "",
        htmlBody: params.get("body") ?? "",
      };
      dbg("HOST", "displayNewMessageForm", { to, subject: form.subject.slice(0, 40) });
      Office.context.mailbox.displayNewMessageForm(form);
      return true;
    } catch (err) {
      dbg("HOST", "displayNewMessageForm failed", String(err));
      return false;
    }
  } else {
    try {
      Office.context.ui.openBrowserWindow(url);
      return true;
    } catch (err) {
      dbg("HOST", "openBrowserWindow failed", String(err));
      return false;
    }
  }
}

function buildMailtoUrl(payload: SaveFeedbackPayload): string {
  const email = payload.toPersonEmail ?? "";
  if (!email) return "";
  const subject = encodeURIComponent(payload.feedback.feedbackSubject);
  const tmp = document.createElement("div");
  tmp.innerHTML = payload.feedback.feedbackApplication;
  const bodyText = (tmp.textContent || tmp.innerText || "").slice(0, 1800);
  const body = encodeURIComponent(bodyText);
  return `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
}

function plainTextMailtoUrl(toEmail: string, subject: string, htmlBody: string): string {
  if (!toEmail) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = htmlBody;
  const bodyText = (tmp.textContent || tmp.innerText || "").replace(/\s+/g, " ").trim().slice(0, 1800);
  return `mailto:${encodeURIComponent(toEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
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

// Opens an HTML-formatted email draft:
//   Outlook read mode  → displayNewMessageForm with htmlBody
//   Outlook compose    → setAsync into current item body
//   Word / PowerPoint  → plain-text mailto: fallback
// onDone receives "" when the draft was opened/injected, or a mailto URL for the fallback link.
function openHtmlEmailDraft(
  html: string,
  toEmail: string,
  subject: string,
  htmlBodyForFallback: string,
  onDone: (mailtoUrl: string) => void,
): void {
  if (Office.context.host === Office.HostType.Outlook) {
    if (typeof Office.context.mailbox.displayNewMessageForm === "function") {
      // Read mode: open a new compose window with the fully-formatted HTML body.
      try {
        Office.context.mailbox.displayNewMessageForm({
          toRecipients: toEmail ? [toEmail] : [],
          subject,
          htmlBody: html,
        });
        dbg("HOST", "openHtmlEmailDraft: displayNewMessageForm called");
        onDone("");
      } catch (err) {
        dbg("HOST", "openHtmlEmailDraft: displayNewMessageForm failed", String(err));
        onDone(plainTextMailtoUrl(toEmail, subject, htmlBodyForFallback));
      }
    } else {
      // Compose mode: inject the HTML template into the body of the current compose window.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const item = Office.context.mailbox.item as any;
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
      } else {
        onDone(plainTextMailtoUrl(toEmail, subject, htmlBodyForFallback));
      }
    }
  } else {
    // Word / PowerPoint: mailto: link, plain text only.
    onDone(plainTextMailtoUrl(toEmail, subject, htmlBodyForFallback));
  }
}

async function openAnalyzeDialog(
  mode: SelectionMode,
  event: Office.AddinCommands.Event
): Promise<void> {
  dbg("HOST", "openAnalyzeDialog start", { mode });
  try { await ensureDb(); } catch (err) { showNoSelectionMessage("Database Error", String(err), event); return; }
  const meta = await fetchSelectionOrNotify(
    mode,
    // C# AddinModule.cs: selection handler → "Text Selection Message" (1547);
    // paragraph handler → "Paragraph Selection Message" (1398).
    mode === "selection" ? "Text Selection Message" : "Paragraph Selection Message",
    "In order to analyze an entity, that entity must exist.  In order " +
    "to perform an analysis to an entity, that entity must be identified. " +
    "It is not possible to analyze an entity if that entity is not identified " +
    "or cannot be identified.  Here I will need to specify the entity that " +
    "I need to analyze.  In this case, I will to select the actual text or put " +
    "the cursor or point the mouse to the text that needs to be analyzed.",
    event
  );
  if (!meta) return;
  const { text: selection, selectionHtml, documentTitle, documentName, pageNumber } = meta;

  dbg("HOST", "selection obtained, building initPayload", { selectionLength: selection.length });
  const { personName, personEmail } = getUserIdentity();
  const commConfig = getCommunicationConfig();
  const initPayload: DialogInitPayload = {
    selection,
    selectionHtml,
    mode,
    source: getSource(),
    personName,
    personEmail,
    applicationName: buildEntityName(documentTitle, documentName, pageNumber),
    communicationFunction: "",
    communicationSignal: "",
    projectName: "",
    peopleList: buildPeopleList(commConfig?.personName),
    communicationPersonName: commConfig?.personName ?? "",
    communicationPersonEmail: commConfig?.personEmail ?? "",
  };

  openAnalyzeDialogWithPayload(initPayload, commConfig?.personName ?? "", commConfig?.personEmail ?? "", event);
}

function openAnalyzeDialogWithPayload(
  initPayload: DialogInitPayload,
  commPersonName: string,
  commPersonEmail: string,
  event: Office.AddinCommands.Event,
  attempt = 0
): void {
  const params = new URLSearchParams({ view: "analyze", mode: initPayload.mode });
  _trackDialogAsync(
    `${DIALOG_BASE}/dialog.html?${params.toString()}`,
    { ...DIALOG_SIZE, displayInIframe: true },
    (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) {
        if ((result.error as { code: number }).code === 12007 && attempt < 15) {
          setTimeout(() => openAnalyzeDialogWithPayload(initPayload, commPersonName, commPersonEmail, event, attempt + 1), 300);
          return;
        }
        handleDialogOpenError(result.error, event);
        return;
      }
      const dialog = result.value;
      const complete = makeEventCompleter(event);

      dialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
        const m = JSON.parse((msg as { message: string }).message) as DialogAction;
        dbg("HOST", "DialogMessageReceived", { action: m.action });
        switch (m.action) {
          case "READY":
            dbg("HOST", "READY received — sending INIT");
            dialog.messageChild(JSON.stringify({ type: "INIT", payload: initPayload } as HostMessage));
            break;
          case "SAVE_ANALYSIS": {
            const payload = m.payload as SaveAnalysisPayload;
            dbg("HOST", "SAVE_ANALYSIS received", { whatToDo: payload.analysis.whatToDoWithAnalysis });
            let savedId: number;
            try {
              savedId = saveFullAnalysis(payload);
              if (payload.analysis.fromPerson) upsertPersonName(payload.analysis.fromPerson);
              dbg("HOST", "saveFullAnalysis OK", { savedId });
            } catch (err) {
              dbg("HOST", "saveFullAnalysis THREW", String(err));
              replyError(dialog, `Failed to save analysis: ${String(err)}`);
              break;
            }
            if (payload.analysis.whatToDoWithAnalysis === "ApplyAnalysisAsFeedback") {
              const { personName, personEmail } = getUserIdentity();
              const applyAnalyses = getAllAnalyses().map((a) => {
                if (!a.id) return a;
                return { ...a, questions: getQuestionsByAnalysis(a.id), errors: getErrorsByAnalysis(a.id), compensators: getCompensatorsByAnalysis(a.id), answers: getAnswersByAnalysis(a.id), files: getFilesByAnalysis(a.id) };
              });
              const applyFeedbacks = getAllFeedbacks().map((f) => {
                if (!f.analysisId) return { ...f, problems: f.id ? getProblemsByFeedback(f.id) : [] };
                return { ...f, questions: getQuestionsByAnalysis(f.analysisId), errors: getErrorsByAnalysis(f.analysisId), compensators: getCompensatorsByAnalysis(f.analysisId), answers: getAnswersByAnalysis(f.analysisId), files: getFilesByAnalysis(f.analysisId), problems: [...getProblemsByAnalysis(f.analysisId), ...(f.id ? getProblemsByFeedback(f.id) : [])] };
              });
              const applyPayload: DialogInitPayload = {
                selection: payload.analysis.entityUnderAnalysis,
                mode: payload.analysis.selectionType === "Selection" ? "selection" : "paragraph",
                source: payload.analysis.source,
                personName,
                personEmail,
                applicationName: payload.analysis.applicationName,
                communicationFunction: payload.analysis.communicationFunction,
                communicationSignal: payload.analysis.communicationSignal,
                projectName: payload.analysis.projectName,
                peopleList: [],
                communicationPersonName: commPersonName,
                communicationPersonEmail: commPersonEmail,
                analysisData: {
                  id: savedId,
                  entityUnderAnalysis: payload.analysis.entityUnderAnalysis,
                  analysisSubject: payload.analysis.analysisSubject ?? "",
                  actualAnalysis: payload.analysis.actualAnalysis,
                  fromPerson: payload.analysis.fromPerson ?? "",
                  errors: payload.errors,
                  compensators: payload.compensators,
                  questions: payload.questions,
                  answers: payload.answers,
                  files: payload.files,
                  correctedItems: [],
                },
                analyses: applyAnalyses,
                feedbacks: applyFeedbacks,
              };
              dbg("HOST", "sending NAVIGATE to apply view");
              dialog.messageChild(JSON.stringify({ type: "NAVIGATE", view: "apply", payload: applyPayload } as HostMessage));
            } else if (payload.analysis.whatToDoWithAnalysis === "ProvideFeedbackWithAnalysis") {
              const { personName, personEmail } = getUserIdentity();
              const providePayload: DialogInitPayload = {
                selection: payload.analysis.entityUnderAnalysis,
                mode: payload.analysis.selectionType === "Selection" ? "selection" : "paragraph",
                source: payload.analysis.source,
                personName,
                personEmail,
                applicationName: payload.analysis.applicationName,
                communicationFunction: payload.analysis.communicationFunction,
                communicationSignal: payload.analysis.communicationSignal,
                projectName: payload.analysis.projectName,
                peopleList: getPeopleNames(),
                peopleEmailMap: getPeopleEmailMap(), contacts: getAllPeople(),
                analysisData: {
                  id: savedId,
                  entityUnderAnalysis: payload.analysis.entityUnderAnalysis,
                  analysisSubject: payload.analysis.analysisSubject ?? "",
                  actualAnalysis: payload.analysis.actualAnalysis,
                  fromPerson: payload.analysis.fromPerson ?? "",
                  errors: payload.errors,
                  compensators: payload.compensators,
                  questions: payload.questions,
                  answers: payload.answers,
                  files: payload.files,
                  correctedItems: [],
                },
              };
              dbg("HOST", "sending NAVIGATE to provide-feedback view");
              dialog.messageChild(JSON.stringify({ type: "NAVIGATE", view: "provide-feedback", payload: providePayload } as HostMessage));
            } else {
              dbg("HOST", "whatToDo === Retain — writing audit record, sending RETAIN_SAVED");
              // Audit trail is non-critical — analysis is already saved. Catch so RETAIN_SAVED always sends.
              try {
                saveFeedbackHistory({
                  selectionAction: "Analyzed",
                  entityName: plainText(payload.analysis.entityUnderAnalysis),
                  actualSelection: payload.analysis.entityUnderAnalysis,
                  selectionType: payload.analysis.selectionType ?? "",
                  source: payload.analysis.source,
                  applicationName: payload.analysis.applicationName ?? "",
                  communicationFunction: payload.analysis.communicationFunction ?? "",
                  communicationSignal: payload.analysis.communicationSignal ?? "",
                  projectName: payload.analysis.projectName ?? "",
                  personName: payload.analysis.personName ?? "",
                  personEmail: payload.analysis.personEmail ?? "",
                });
              } catch (err) { dbg("HOST", "saveFeedbackHistory (retain) failed — non-critical", String(err)); }
              dialog.messageChild(JSON.stringify({ type: "RETAIN_SAVED" } as HostMessage));
              // Stay open — wait for CLOSE from the success screen
            }
            break;
          }
          case "SAVE_FEEDBACK": {
            dbg("HOST", "SAVE_FEEDBACK received (from apply/provide view)");
            const fbPayload = m.payload as SaveFeedbackPayload;
            try {
              saveFeedback(fbPayload);
              dbg("HOST", "saveFeedback OK");
            } catch (err) {
              dbg("HOST", "saveFeedback THREW", String(err));
              dialog.messageChild(JSON.stringify({ type: "ERROR", message: String(err) } as HostMessage));
              break;
            }
            // Save recipient to PeopleInProject (mirrors C# behaviour)
            if (fbPayload.feedback.feedbackType === "Provided" && fbPayload.feedback.toPerson) {
              upsertPersonWithEmail(fbPayload.feedback.toPerson, fbPayload.toPersonEmail ?? "");
            }
            // Audit trail — mirrors C# ProvideFeedbackSelection.cs lines 217-224
            // Non-critical: feedback is already saved; catch so SAVED still sends if audit write fails.
            if (fbPayload.feedback.feedbackType === "Provided" || fbPayload.feedback.feedbackType === "Applied") {
              const f = fbPayload.feedback;
              try {
                saveFeedbackHistory({
                  selectionAction: f.feedbackType === "Applied" ? "Applied as Feedback" : "Provided as Feedback",
                  entityName: plainText(f.actualSelection) || plainText(f.feedbackApplication),
                  actualSelection: f.feedbackApplication,
                  selectionType: f.selectionType,
                  source: f.source,
                  applicationName: f.applicationName,
                  communicationFunction: f.communicationFunction,
                  communicationSignal: f.communicationSignal,
                  projectName: f.projectName,
                  personName: f.personName,
                  personEmail: f.personEmail,
                });
              } catch (err) { dbg("HOST", "saveFeedbackHistory (feedback audit) failed — non-critical", String(err)); }
            }
            if (fbPayload.feedback.feedbackType === "Provided" || fbPayload.feedback.feedbackType === "Applied") {
              const analysis = loadAnalysisForFeedback(fbPayload.feedback.analysisId);
              const html = fbPayload.feedback.feedbackType === "Applied"
                ? buildApplyFeedbackEmail(fbPayload.feedback, analysis)
                : buildProvideFeedbackEmail(fbPayload.feedback, analysis);
              openHtmlEmailDraft(
                html,
                fbPayload.toPersonEmail ?? "",
                fbPayload.feedback.feedbackSubject,
                fbPayload.feedback.feedbackApplication,
                (mailtoUrl) => {
                  dbg("HOST", "openHtmlEmailDraft done", { mailtoUrl: mailtoUrl?.slice(0, 60) });
                  dialog.messageChild(JSON.stringify({ type: "SAVED", mailtoUrl } as HostMessage));
                },
              );
              // Do NOT close here — wait for the dialog to send CLOSE after the user clicks.
            } else {
              try { dialog.close(); } catch { }
              complete();
            }
            break;
          }
          case "SAVE_PROBLEM_SOLUTION": {
            const p = m.payload as import("@/types/db").SaveProblemSolutionPayload;
            try {
              saveProblemSolution({
                actualProblem:         p.actualProblem,
                feedbackApplied:       p.feedbackApplied,
                errorCorrected:        p.errorCorrected,
                compensatorReplaced:   p.compensatorReplaced,
                additionalExplanation: p.additionalExplanation,
                files:                 p.files,
              });
            } catch (err) {
              dbg("HOST", "saveProblemSolution THREW", String(err));
              replyError(dialog, `Failed to save problem solution: ${String(err)}`);
            }
            break;
          }
          case "INSERT_TEXT_AT_CURSOR":
            insertTextAtCursor((m as { action: string; text: string; html?: string }).text, (m as { action: string; text: string; html?: string }).html);
            break;
          case "CLOSE":
            dbg("HOST", "CLOSE received — closing dialog, completing event");
            try { dialog.close(); } catch { }
            complete();
            break;
          default:
            dbg("HOST", "unknown action received", { action: (m as { action: string }).action });
            break;
        }
      });

      dialog.addEventHandler(Office.EventType.DialogEventReceived, (evt) => {
        const code = (evt as { error?: number }).error;
        dbg("HOST", "DialogEventReceived (dialog closed by user or error)", { code });
        complete();
      });
    }
  );
}

async function openRequestFeedbackFromRibbon(event: Office.AddinCommands.Event): Promise<void> {
  try { await ensureDb(); } catch (err) { showNoSelectionMessage("Database Error", String(err), event); return; }
  const meta = await fetchSelectionOrNotify(
    "paragraph",
    "Paragraph Selection Message",
    "A feedback is requested to correct an identified error or solve an identified problem. " +
    "Let's assume that a selection is identified, where that selection points to a valid entity, " +
    "then it is possible for us to request a feedback in relationship with that selection to enable " +
    "the correction of an error or solve and identified problem.  Since the feedback is requested " +
    "in relationship with the actual selection, we assume that there is a relationship with " +
    "the correction of the identified error in relationship with the feedback and that " +
    "selection.  By understanding that, we can see the absence of the selection prevents " +
    "the actual request for the feedback.  To enable the correction of the error with " +
    "with the actual feedback requested in relationship with the actual selection, that " +
    "selection must be identified.  Since the feedback is requested in relationship with the " +
    "actual selection, it is not possible to request the feedback without the selection.  Here " +
    "I will need to specify or identify the actual selection that I need to request the feedback with.",
    event
  );
  if (!meta) return;
  const { text: selection, documentTitle, documentName, pageNumber } = meta;
  const { personName, personEmail } = getUserIdentity();
  const commConfig = getCommunicationConfig();
  openRequestFeedbackDialog({
    selection,
    mode: "paragraph",
    source: getSource(),
    personName,
    personEmail,
    applicationName: buildEntityName(documentTitle, documentName, pageNumber),
    communicationFunction: "",
    communicationSignal: "",
    projectName: documentTitle,
    peopleList: buildPeopleList(commConfig?.personName),
    peopleEmailMap: getPeopleEmailMap(), contacts: getAllPeople(),
    communicationPersonName: commConfig?.personName ?? "",
    communicationPersonEmail: commConfig?.personEmail ?? "",
  }, event);
}

function openRequestFeedbackDialog(initPayload: DialogInitPayload, addInEvent: Office.AddinCommands.Event, attempt = 0): void {
  _trackDialogAsync(
    `${DIALOG_BASE}/dialog.html?view=request-feedback`,
    { ...DIALOG_SIZE, displayInIframe: true },
    (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) {
        if ((result.error as { code: number }).code === 12007 && attempt < 15) {
          setTimeout(() => openRequestFeedbackDialog(initPayload, addInEvent, attempt + 1), 300);
          return;
        }
        handleDialogOpenError(result.error, addInEvent);
        return;
      }
      const dialog = result.value;
      const complete = makeEventCompleter(addInEvent);
      dialog.addEventHandler(Office.EventType.DialogEventReceived, (evt) => {
        void (evt as { error: number }).error;
        complete();
      });
      dialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
        const m = JSON.parse((msg as { message: string }).message) as DialogAction;
        switch (m.action) {
          case "READY":
            dialog.messageChild(JSON.stringify({ type: "INIT", payload: initPayload } as HostMessage));
            break;
          case "SAVE_REQUEST_FEEDBACK": {
            const p = m.payload as SaveRequestFeedbackPayload;
            const entityName = `Text selected from ${p.selectionType} on ${formatDisplayDate(nowDate())}`;
            try {
              saveCommSignalInfo({ ...p, entitySelected: entityName });
              saveFeedbackHistory({
                selectionAction: "Requested Feedback With",
                entityName: plainText(p.actualSelection) || entityName,
                actualSelection: p.actualSelection,
                selectionType: "Web Contain",
                source: p.selectionType,
                applicationName: p.applicationName,
                communicationFunction: p.communicationFunction,
                communicationSignal: p.communicationSignalType,
                projectName: "",
                personName: initPayload.personName,
                personEmail: initPayload.personEmail,
              });
            } catch (err) {
              dialog.messageChild(JSON.stringify({ type: "ERROR", message: String(err) } as HostMessage));
              break;
            }
            if (p.toPerson) {
              upsertPersonWithEmail(p.toPerson, p.toPersonEmail);
            }
            {
              const html = buildRequestFeedbackEmail(p);
              openHtmlEmailDraft(html, p.toPersonEmail, p.communicationSubject, p.actualCommunication, (mailtoUrl) => {
                dialog.messageChild(JSON.stringify({ type: "SAVED", mailtoUrl } as HostMessage));
              });
            }
            break;
          }
          case "OPEN_MAILTO":
            openMailtoUrl((m as { action: string; url: string }).url);
            try { dialog.close(); } catch { }
            complete();
            break;
          case "CLOSE":
            try { dialog.close(); } catch { }
            complete();
            break;
          default:
            break;
        }
      });
    }
  );
}

function buildRequestMailtoUrl(p: SaveRequestFeedbackPayload): string {
  if (!p.toPersonEmail) return "";
  const subject = encodeURIComponent(p.communicationSubject);
  const prefix = `Application Name: ${p.applicationName}\nCommunication Function: ${p.communicationFunction}\nCommunication Signal: ${p.communicationSignalType}\n${"=".repeat(60)}\n\n`;
  const bodyText = (prefix + p.actualCommunication.replace(/<[^>]*>/g, "")).slice(0, 1800);
  const body = encodeURIComponent(bodyText);
  return `mailto:${encodeURIComponent(p.toPersonEmail)}?subject=${subject}&body=${body}`;
}

function openViewDialog(
  view: string,
  mode: SelectionMode | undefined,
  initPayload: DialogInitPayload,
  event: Office.AddinCommands.Event
): void {
  const params = new URLSearchParams({ view });
  if (mode) params.set("mode", mode);
  _trackDialogAsync(
    `${DIALOG_BASE}/dialog.html?${params.toString()}`,
    { ...DIALOG_SIZE, displayInIframe: true },
    (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) {
        handleDialogOpenError(result.error, event);
        return;
      }
      const dialog = result.value;
      const complete = makeEventCompleter(event);
      dialog.addEventHandler(Office.EventType.DialogEventReceived, (evt) => {
        void (evt as { error: number }).error;
        complete();
      });
      dialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
        const m = JSON.parse((msg as { message: string }).message) as DialogAction;
        if (m.action === "READY") {
          const hostMsg: HostMessage = { type: "INIT", payload: initPayload };
          dialog.messageChild(JSON.stringify(hostMsg));
        }
        if (m.action === "CLOSE") {
          try { dialog.close(); } catch { }
          complete();
        }
      });
    }
  );
}

function openAboutDialog(addInEvent: Office.AddinCommands.Event, attempt = 0): void {
  _trackDialogAsync(
    `${DIALOG_BASE}/dialog.html?view=about`,
    { ...ABOUT_DIALOG_SIZE, displayInIframe: true },
    (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) {
        if ((result.error as { code: number }).code === 12007 && attempt < 15) {
          setTimeout(() => openAboutDialog(addInEvent, attempt + 1), 300);
          return;
        }
        handleDialogOpenError(result.error, addInEvent);
        return;
      }
      const dialog = result.value;
      const complete = makeEventCompleter(addInEvent);
      dialog.addEventHandler(Office.EventType.DialogEventReceived, () => {
        complete();
      });
      dialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
        const m = JSON.parse((msg as { message: string }).message) as { action: string };
        if (m.action === "CLOSE") {
          try { dialog.close(); } catch { }
          complete();
        }
      });
    }
  );
}

function openAnalysisHistoryDialog(event: Office.AddinCommands.Event, attempt = 0): void {
  _trackDialogAsync(
    `${DIALOG_BASE}/dialog.html?view=analysis-history`,
    { ...DIALOG_SIZE, displayInIframe: true },
    (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) {
        if ((result.error as { code: number }).code === 12007 && attempt < 15) {
          setTimeout(() => openAnalysisHistoryDialog(event, attempt + 1), 300);
          return;
        }
        handleDialogOpenError(result.error, event);
        return;
      }
      const dialog = result.value;
      const complete = makeEventCompleter(event);
      dialog.addEventHandler(Office.EventType.DialogEventReceived, () => {
        complete();
      });
      dialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
        const m = JSON.parse((msg as { message: string }).message) as DialogAction;
        if (m.action === "READY") {
          const { personName, personEmail } = getUserIdentity();
          const analyses = getAllAnalyses().map((a) => {
            if (!a.id) return a;
            return {
              ...a,
              questions: getQuestionsByAnalysis(a.id),
              errors: getErrorsByAnalysis(a.id),
              compensators: getCompensatorsByAnalysis(a.id),
              answers: getAnswersByAnalysis(a.id),
              problems: getProblemsByAnalysis(a.id),
              files: getFilesByAnalysis(a.id),
            };
          });
          const hostMsg: HostMessage = {
            type: "INIT",
            payload: {
              selection: "",
              mode: "selection",
              source: getSource(),
              personName,
              personEmail,
              applicationName: "",
              communicationFunction: "",
              communicationSignal: "",
              projectName: "",
              peopleList: [],
              analyses,
            },
          };
          dialog.messageChild(JSON.stringify(hostMsg));
        }
        if (m.action === "CLOSE") {
          try { dialog.close(); } catch { }
          complete();
        }
        if (m.action === "NAVIGATE_TO_APPLY") {
          const navM = m as { action: string; analysisId: number };
          const analysis = getAnalysisById(navM.analysisId);
          if (!analysis) { replyError(dialog, "Analysis record not found."); return; }
          const { personName, personEmail } = getUserIdentity();
          const allAnalyses = getAllAnalyses().map((a) => {
            if (!a.id) return a;
            return { ...a, questions: getQuestionsByAnalysis(a.id), errors: getErrorsByAnalysis(a.id), compensators: getCompensatorsByAnalysis(a.id), answers: getAnswersByAnalysis(a.id), files: getFilesByAnalysis(a.id) };
          });
          const allFeedbacks = getAllFeedbacks().map((f) => {
            if (!f.analysisId) return { ...f, problems: f.id ? getProblemsByFeedback(f.id) : [] };
            return { ...f, questions: getQuestionsByAnalysis(f.analysisId), errors: getErrorsByAnalysis(f.analysisId), compensators: getCompensatorsByAnalysis(f.analysisId), answers: getAnswersByAnalysis(f.analysisId), files: getFilesByAnalysis(f.analysisId), problems: [...getProblemsByAnalysis(f.analysisId), ...(f.id ? getProblemsByFeedback(f.id) : [])] };
          });
          const navCommConfig = getCommunicationConfig();
          const applyPayload: DialogInitPayload = {
            selection: analysis.entityUnderAnalysis?.replace(/<[^>]+>/g, "") ?? "",
            mode: analysis.selectionType === "Paragraph" ? "paragraph" : "selection",
            source: getSource(),
            personName,
            personEmail,
            applicationName: analysis.applicationName ?? "",
            communicationFunction: analysis.communicationFunction ?? "",
            communicationSignal: analysis.communicationSignal ?? "",
            projectName: analysis.projectName ?? "",
            peopleList: getPeopleNames(),
            communicationPersonName: navCommConfig?.personName ?? "",
            communicationPersonEmail: navCommConfig?.personEmail ?? "",
            analyses: allAnalyses,
            feedbacks: allFeedbacks,
            analysisData: {
              id: navM.analysisId,
              entityUnderAnalysis: analysis.entityUnderAnalysis ?? "",
              analysisSubject: analysis.analysisSubject ?? "",
              actualAnalysis: analysis.actualAnalysis ?? "",
              fromPerson: analysis.fromPerson ?? "",
              errors: getErrorsByAnalysis(navM.analysisId),
              compensators: getCompensatorsByAnalysis(navM.analysisId),
              questions: getQuestionsByAnalysis(navM.analysisId),
              answers: getAnswersByAnalysis(navM.analysisId),
              files: getFilesByAnalysis(navM.analysisId),
              correctedItems: [],
            },
          };
          const navMsg: HostMessage = { type: "NAVIGATE", view: "apply", payload: applyPayload };
          dialog.messageChild(JSON.stringify(navMsg));
        }
        if (m.action === "NAVIGATE_TO_PROVIDE") {
          const navM = m as { action: string; analysisId: number };
          const analysis = getAnalysisById(navM.analysisId);
          if (!analysis) { replyError(dialog, "Analysis record not found."); return; }
          const { personName, personEmail } = getUserIdentity();
          const commConfig = getCommunicationConfig();
          const providePayload: DialogInitPayload = {
            selection: analysis.entityUnderAnalysis?.replace(/<[^>]+>/g, "") ?? "",
            mode: "selection",
            source: getSource(),
            personName,
            personEmail,
            applicationName: analysis.applicationName ?? "",
            communicationFunction: analysis.communicationFunction ?? "",
            communicationSignal: analysis.communicationSignal ?? "",
            projectName: analysis.projectName ?? "",
            peopleList: buildPeopleList(commConfig?.personName),
            peopleEmailMap: getPeopleEmailMap(), contacts: getAllPeople(),
            communicationPersonName: commConfig?.personName ?? "",
            communicationPersonEmail: commConfig?.personEmail ?? "",
          };
          const navMsg: HostMessage = { type: "NAVIGATE", view: "provide-feedback", payload: providePayload };
          dialog.messageChild(JSON.stringify(navMsg));
        }
        if (m.action === "DELETE_ANALYSIS") {
          try { deleteAnalysis((m as { action: string; id: number }).id); }
          catch (err) { replyError(dialog, `Delete failed: ${String(err)}`); }
        }
        if (m.action === "SAVE_FEEDBACK") {
          const fbPayload = m.payload as SaveFeedbackPayload;
          try {
            saveFeedback(fbPayload);
          } catch (err) {
            replyError(dialog, `Failed to save feedback: ${String(err)}`);
            return;
          }
          if (fbPayload.feedback.feedbackType === "Provided" && fbPayload.feedback.toPerson) {
            upsertPersonWithEmail(fbPayload.feedback.toPerson, fbPayload.toPersonEmail ?? "");
          }
          if (fbPayload.feedback.feedbackType === "Provided" || fbPayload.feedback.feedbackType === "Applied") {
            const f = fbPayload.feedback;
            try {
              saveFeedbackHistory({
                selectionAction: f.feedbackType === "Applied" ? "Applied as Feedback" : "Provided as Feedback",
                entityName: plainText(f.actualSelection) || plainText(f.feedbackApplication),
                actualSelection: f.feedbackApplication,
                selectionType: f.selectionType,
                source: f.source,
                applicationName: f.applicationName,
                communicationFunction: f.communicationFunction,
                communicationSignal: f.communicationSignal,
                projectName: f.projectName,
                personName: f.personName,
                personEmail: f.personEmail,
              });
            } catch (err) { dbg("HOST", "saveFeedbackHistory (feedback audit) failed — non-critical", String(err)); }
          }
          if (fbPayload.feedback.feedbackType === "Provided" || fbPayload.feedback.feedbackType === "Applied") {
            const analysis = loadAnalysisForFeedback(fbPayload.feedback.analysisId);
            const html = fbPayload.feedback.feedbackType === "Applied"
              ? buildApplyFeedbackEmail(fbPayload.feedback, analysis)
              : buildProvideFeedbackEmail(fbPayload.feedback, analysis);
            openHtmlEmailDraft(
              html,
              fbPayload.toPersonEmail ?? "",
              fbPayload.feedback.feedbackSubject,
              fbPayload.feedback.feedbackApplication,
              (mailtoUrl) => {
                dialog.messageChild(JSON.stringify({ type: "SAVED", mailtoUrl } as HostMessage));
              },
            );
          } else {
            try { dialog.close(); } catch { }
            complete();
          }
        }
      });
    }
  );
}

function openFeedbackHistoryDialog(event: Office.AddinCommands.Event, attempt = 0): void {
  _trackDialogAsync(
    `${DIALOG_BASE}/dialog.html?view=feedback-history`,
    { ...DIALOG_SIZE, displayInIframe: true },
    (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) {
        if ((result.error as { code: number }).code === 12007 && attempt < 15) {
          setTimeout(() => openFeedbackHistoryDialog(event, attempt + 1), 300);
          return;
        }
        handleDialogOpenError(result.error, event);
        return;
      }
      const dialog = result.value;
      const complete = makeEventCompleter(event);
      dialog.addEventHandler(Office.EventType.DialogEventReceived, () => {
        complete();
      });
      dialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
        const m = JSON.parse((msg as { message: string }).message) as DialogAction;
        if (m.action === "READY") {
          const { personName, personEmail } = getUserIdentity();
          const feedbacks = getAllFeedbacks().map((f) => {
            if (!f.analysisId) return { ...f, problems: f.id ? getProblemsByFeedback(f.id) : [] };
            return {
              ...f,
              questions: getQuestionsByAnalysis(f.analysisId),
              errors: getErrorsByAnalysis(f.analysisId),
              compensators: getCompensatorsByAnalysis(f.analysisId),
              answers: getAnswersByAnalysis(f.analysisId),
              files: getFilesByAnalysis(f.analysisId),
              problems: [...getProblemsByAnalysis(f.analysisId), ...(f.id ? getProblemsByFeedback(f.id) : [])],
            };
          });
          const hostMsg: HostMessage = {
            type: "INIT",
            payload: {
              selection: "",
              mode: "selection",
              source: getSource(),
              personName,
              personEmail,
              applicationName: "",
              communicationFunction: "",
              communicationSignal: "",
              projectName: "",
              peopleList: [],
              feedbacks,
            },
          };
          dialog.messageChild(JSON.stringify(hostMsg));
        }
        if (m.action === "DELETE_FEEDBACK") {
          try { deleteFeedback((m as { action: string; id: number }).id); }
          catch (err) { replyError(dialog, `Delete failed: ${String(err)}`); }
        }
        if (m.action === "SAVE_PROBLEM_SOLUTION") {
          // Solve Problem from the View Feedback dialog's Problems tab.
          const sp = m.payload as import("@/types/db").SaveProblemSolutionPayload;
          try {
            saveProblemSolution({
              actualProblem:         sp.actualProblem,
              feedbackApplied:       sp.feedbackApplied,
              errorCorrected:        sp.errorCorrected,
              compensatorReplaced:   sp.compensatorReplaced,
              additionalExplanation: sp.additionalExplanation,
              files:                 sp.files,
            });
          } catch (err) { dbg("HOST", "saveProblemSolution (feedback history) THREW", String(err)); replyError(dialog, `Failed to save problem solution: ${String(err)}`); }
        }
        if (m.action === "LIST_FEEDBACK_APPLIED" || m.action === "LIST_FEEDBACK_PROVIDED") {
          // Views not yet implemented — no-op until ListFeedbackAppliedView / ListFeedbackProvidedView are built
        }
        if (m.action === "LIST_FEEDBACK_REQUESTED") {
          const navPayload: DialogInitPayload = {
            selection: "",
            mode: "selection",
            source: getSource(),
            personName: getUserIdentity().personName,
            personEmail: getUserIdentity().personEmail,
            applicationName: "",
            communicationFunction: "",
            communicationSignal: "",
            projectName: "",
            peopleList: [],
            commSignalRequests: getCommSignalRequests(),
          };
          dialog.messageChild(JSON.stringify({ type: "NAVIGATE", view: "list-feedback-requested", payload: navPayload } as HostMessage));
        }
        if (m.action === "BACK_TO_FEEDBACK_HISTORY") {
          const { personName, personEmail } = getUserIdentity();
          const feedbacks = getAllFeedbacks().map((f) => {
            if (!f.analysisId) return { ...f, problems: f.id ? getProblemsByFeedback(f.id) : [] };
            return {
              ...f,
              questions: getQuestionsByAnalysis(f.analysisId),
              errors: getErrorsByAnalysis(f.analysisId),
              compensators: getCompensatorsByAnalysis(f.analysisId),
              answers: getAnswersByAnalysis(f.analysisId),
              files: getFilesByAnalysis(f.analysisId),
              problems: [...getProblemsByAnalysis(f.analysisId), ...(f.id ? getProblemsByFeedback(f.id) : [])],
            };
          });
          const backPayload: DialogInitPayload = {
            selection: "",
            mode: "selection",
            source: getSource(),
            personName,
            personEmail,
            applicationName: "",
            communicationFunction: "",
            communicationSignal: "",
            projectName: "",
            peopleList: [],
            feedbacks,
          };
          dialog.messageChild(JSON.stringify({ type: "NAVIGATE", view: "feedback-history", payload: backPayload } as HostMessage));
        }
        if (m.action === "DELETE_COMM_SIGNAL_REQUEST") {
          try { deleteCommSignalRequest((m as { action: string; id: number }).id); }
          catch (err) { replyError(dialog, `Delete failed: ${String(err)}`); }
        }
        if (m.action === "CLOSE") {
          try { dialog.close(); } catch { }
          complete();
        }
      });
    }
  );
}

function openRetainedHistoryDialog(event: Office.AddinCommands.Event, attempt = 0): void {
  _trackDialogAsync(
    `${DIALOG_BASE}/dialog.html?view=retained-history`,
    { ...DIALOG_SIZE, displayInIframe: true },
    (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) {
        if ((result.error as { code: number }).code === 12007 && attempt < 15) {
          setTimeout(() => openRetainedHistoryDialog(event, attempt + 1), 300);
          return;
        }
        handleDialogOpenError(result.error, event);
        return;
      }
      const dialog = result.value;
      const complete = makeEventCompleter(event);
      dialog.addEventHandler(Office.EventType.DialogEventReceived, () => {
        complete();
      });
      dialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
        const m = JSON.parse((msg as { message: string }).message) as DialogAction;
        if (m.action === "READY") {
          const { personName, personEmail } = getUserIdentity();
          const analyses = getRetainedAnalyses().map((a) => {
            if (!a.id) return a;
            return {
              ...a,
              questions: getQuestionsByAnalysis(a.id),
              errors: getErrorsByAnalysis(a.id),
              compensators: getCompensatorsByAnalysis(a.id),
              answers: getAnswersByAnalysis(a.id),
              problems: getProblemsByAnalysis(a.id),
              files: getFilesByAnalysis(a.id),
            };
          });
          const hostMsg: HostMessage = {
            type: "INIT",
            payload: {
              selection: "",
              mode: "selection",
              source: getSource(),
              personName,
              personEmail,
              applicationName: "",
              communicationFunction: "",
              communicationSignal: "",
              projectName: "",
              peopleList: [],
              analyses,
            },
          };
          dialog.messageChild(JSON.stringify(hostMsg));
        }
        if (m.action === "DELETE_ANALYSIS") {
          try { deleteAnalysis((m as { action: string; id: number }).id); }
          catch (err) { replyError(dialog, `Delete failed: ${String(err)}`); }
        }
        if (m.action === "CLOSE") {
          try { dialog.close(); } catch { }
          complete();
        }
      });
    }
  );
}

function openFlaggedHistoryDialog(event: Office.AddinCommands.Event, attempt = 0): void {
  _trackDialogAsync(
    `${DIALOG_BASE}/dialog.html?view=flagged-history`,
    { ...DIALOG_SIZE, displayInIframe: true },
    (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) {
        if ((result.error as { code: number }).code === 12007 && attempt < 15) {
          setTimeout(() => openFlaggedHistoryDialog(event, attempt + 1), 300);
          return;
        }
        handleDialogOpenError(result.error, event);
        return;
      }
      const dialog = result.value;
      const complete = makeEventCompleter(event);
      let transitioning = false;
      dialog.addEventHandler(Office.EventType.DialogEventReceived, () => {
        if (!transitioning) complete();
      });
      // Builds a fresh INIT payload from the DB. Re-sent after every principle
      // save/delete so the inline list portals stay in sync (mirrors C#, where
      // each List* dialog re-queries the DB on open).
      const sendInit = () => {
        const { personName, personEmail } = getUserIdentity();
        const flaggedEntities = getAllFlaggedSelections();

        const principleInterpretations = getAllInterpretations();
        const filesByInterpretationId: Record<number, import("@/types/db").AttachFileToProject[]> = {};
        for (const pi of principleInterpretations) {
          if (pi.id !== undefined) filesByInterpretationId[pi.id] = getFilesByPrincipleInterpretation(pi.id);
        }

        const principlesInSelection = getPrinciplesInSelection();
        const filesByPrincipleInSelectionId: Record<number, import("@/types/db").AttachFileToProject[]> = {};
        for (const p of principlesInSelection) {
          if (p.id !== undefined) filesByPrincipleInSelectionId[p.id] = getFilesByPrincipleInSelection(p.id);
        }

        const selectionsWithPrinciple = getSelectionsWithPrinciple();
        const filesBySelectionWithPrincipleId: Record<number, import("@/types/db").AttachFileToProject[]> = {};
        for (const s of selectionsWithPrinciple) {
          if (s.id !== undefined) filesBySelectionWithPrincipleId[s.id] = getFilesBySelectionWithPrinciple(s.id);
        }

        const hostMsg: HostMessage = {
          type: "INIT",
          payload: {
            selection: "",
            mode: "selection",
            source: getSource(),
            personName,
            personEmail,
            applicationName: "",
            communicationFunction: "",
            communicationSignal: "",
            projectName: "",
            peopleList: [],
            flaggedEntities,
            principleInterpretations,
            filesByInterpretationId,
            principlesInSelection,
            filesByPrincipleInSelectionId,
            selectionsWithPrinciple,
            filesBySelectionWithPrincipleId,
          },
        };
        dialog.messageChild(JSON.stringify(hostMsg));
      };

      dialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
        const m = JSON.parse((msg as { message: string }).message) as DialogAction;
        if (m.action === "READY") {
          sendInit();
        }
        if (m.action === "DELETE_FLAG") {
          try { deleteFlag((m as { action: string; id: number }).id); }
          catch (err) { replyError(dialog, `Delete failed: ${String(err)}`); }
        }
        if (m.action === "ANALYZE_FROM_HISTORY") {
          const flag = (m as { action: string; flag: FlagEntityForAnalysis }).flag;
          const { personName, personEmail } = getUserIdentity();
          transitioning = true;
          try { dialog.close(); } catch { }
          openAnalyzeFromHistory(flag, personName, personEmail, event);
          return;
        }
        if (m.action === "APPLY_FROM_HISTORY") {
          const flag = (m as { action: string; flag: FlagEntityForAnalysis }).flag;
          const { personName, personEmail } = getUserIdentity();
          transitioning = true;
          try { dialog.close(); } catch { }
          openApplyFromHistory(flag, personName, personEmail, event);
          return;
        }
        if (m.action === "PROVIDE_FROM_HISTORY") {
          const flag = (m as { action: string; flag: FlagEntityForAnalysis }).flag;
          const { personName, personEmail } = getUserIdentity();
          transitioning = true;
          try { dialog.close(); } catch { }
          openProvideFromHistory(flag, personName, personEmail, event);
          return;
        }
        if (m.action === "DELETE_INTERPRETED_PRINCIPLE") {
          try { deleteInterpretation((m as { action: string; id: number }).id); sendInit(); }
          catch (err) { replyError(dialog, `Delete failed: ${String(err)}`); }
        }
        if (m.action === "DELETE_PRINCIPLE") {
          try { deletePrincipleInSelection((m as { action: string; id: number }).id); sendInit(); }
          catch (err) { replyError(dialog, `Delete failed: ${String(err)}`); }
        }
        if (m.action === "DELETE_RELATED_SELECTION") {
          try { deleteSelectionWithPrinciple((m as { action: string; id: number }).id); sendInit(); }
          catch (err) { replyError(dialog, `Delete failed: ${String(err)}`); }
        }
        if (m.action === "REPORT_INTERPRETED_PRINCIPLE") {
          try { openInterpretedPrincipleReport((m as { action: string; interpretation: import("@/types/db").PrincipleInterpretation }).interpretation); }
          catch { /* non-critical */ }
        }
        if (m.action === "REPORT_IDENTIFIED_PRINCIPLE") {
          try { openIdentifiedPrincipleReport((m as { action: string; principle: import("@/types/db").PrincipleInSelection }).principle); }
          catch { /* non-critical */ }
        }
        if (m.action === "REPORT_RELATED_SELECTION") {
          try { openRelatedPrincipleReport((m as { action: string; relation: import("@/types/db").SelectionWithPrinciple }).relation); }
          catch { /* non-critical */ }
        }
        if (m.action === "ADD_ATTACHED_FILE") {
          const { file } = m as { action: string; file: import("@/types/db").AttachFileToProject };
          const newId = addAttachedFile(file as Omit<import("@/types/db").AttachFileToProject, "id">);
          dialog.messageChild(JSON.stringify({ type: "FILE_ADDED", id: newId }));
        }
        if (m.action === "REMOVE_ATTACHED_FILE") {
          removeAttachedFile((m as { action: string; id: number }).id);
        }
        if (m.action === "SAVE_RELATED_SELECTION") {
          try {
            const { payload } = m as { action: string; payload: SaveRelatedSelectionPayload };
            const newId = saveSelectionWithPrinciple(payload.record);
            for (const file of payload.files) addAttachedFile({ ...file, selectionWithPrincipleId: newId });
            sendInit();
          } catch (err) { replyError(dialog, `Save failed: ${String(err)}`); }
        }
        if (m.action === "SAVE_PRINCIPLE_IN_SELECTION") {
          try {
            const { payload } = m as { action: string; payload: SavePrincipleInSelectionPayload };
            const newId = savePrincipleInSelection(payload.record);
            for (const file of payload.files) addAttachedFile({ ...file, principleInSelectionId: newId });
            sendInit();
          } catch (err) { replyError(dialog, `Save failed: ${String(err)}`); }
        }
        if (m.action === "SAVE_INTERPRETATION") {
          try {
            const { payload } = m as { action: string; payload: SaveInterpretationPayload };
            const newId = saveInterpretation(payload.record);
            for (const file of payload.files) addAttachedFile({ ...file, principleInterpretationId: newId });
            sendInit();
          } catch (err) { replyError(dialog, `Save failed: ${String(err)}`); }
        }
        if (m.action === "CLOSE") {
          try { dialog.close(); } catch { }
          complete();
        }
      });
    }
  );
}

function openViewDialogSimple(
  view: string,
  event: Office.AddinCommands.Event
): void {
  const { personName, personEmail } = getUserIdentity();
  openViewDialog(view, undefined, {
    selection: "",
    mode: "selection",
    source: getSource(),
    personName,
    personEmail,
    applicationName: "",
    communicationFunction: "",
    communicationSignal: "",
    projectName: "",
    peopleList: [],
  }, event);
}


async function openCreateArticleDialog(event: Office.AddinCommands.Event): Promise<void> {
  try { await ensureDb(); } catch (err) { showNoSelectionMessage("Database Error", String(err), event); return; }
  const { personName: identityName, personEmail } = getUserIdentity();
  const commConfig = getCommunicationConfig();
  const personName = identityName || commConfig?.personName || "";

  // ── Step 1: open the small entry picker (260×163px) ───────────────────────
  _trackDialogAsync(
    `${DIALOG_BASE}/dialog.html?view=create-article-picker`,
    { ...CREATE_ARTICLE_PICKER_SIZE, displayInIframe: true },
    (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) {
        handleDialogOpenError(result.error, event);
        return;
      }
      const pickerDialog = result.value;
      const complete = makeEventCompleter(event);
      let transitioning = false;

      pickerDialog.addEventHandler(Office.EventType.DialogEventReceived, () => {
        // Only complete if the picker is truly being dismissed (not handing off to the next dialog).
        if (!transitioning) complete();
      });

      pickerDialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
        const m = JSON.parse((msg as { message: string }).message) as DialogAction;

        if (m.action === "BLANK_SELECTED") {
          // Blank — go straight to the article form
          transitioning = true;
          pickerDialog.close();
          openArticleFormDialog(event, personName, personEmail);

        } else if (m.action === "TEMPLATE_SELECTED") {
          // Use Template — close picker, open the template picker step
          transitioning = true;
          pickerDialog.close();
          openTemplatePickerDialog(event, personName, personEmail);

        } else if (m.action === "CLOSE") {
          pickerDialog.close();
          complete();
        }
      });
    }
  );
}

/**
 * Step 1b — open the template picker dialog so the user can choose a template
 * category and specific template before creating the article.
 */
function openTemplatePickerDialog(
  event:      Office.AddinCommands.Event,
  personName: string,
  personEmail: string,
  attempt     = 0,
): void {
  _trackDialogAsync(
    `${DIALOG_BASE}/dialog.html?view=template-picker`,
    { ...CREATE_ARTICLE_TEMPLATE_SIZE, displayInIframe: true },
    (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) {
        if ((result.error as { code: number }).code === 12007 && attempt < 15) {
          setTimeout(() => openTemplatePickerDialog(event, personName, personEmail, attempt + 1), 300);
          return;
        }
        handleDialogOpenError(result.error, event);
        return;
      }
      const tplDialog = result.value;
      const complete = makeEventCompleter(event);
      let transitioning = false;

      tplDialog.addEventHandler(Office.EventType.DialogEventReceived, () => {
        if (!transitioning) complete();
      });

      tplDialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
        const m = JSON.parse((msg as { message: string }).message) as DialogAction;

        switch (m.action) {
          case "TEMPLATE_CONFIRMED":
            // User picked a template — close picker, open article wizard
            transitioning = true;
            tplDialog.close();
            openArticleWizardDialog(event, personName, personEmail, m.templateName, m.category);
            break;

          case "BACK":
            // Go back to entry picker (close template picker, reopen entry picker)
            transitioning = true;
            tplDialog.close();
            openCreateArticleDialog(event);
            break;

          case "CLOSE":
            tplDialog.close();
            complete();
            break;

          default:
            break;
        }
      });
    }
  );
}

/**
 * Step 2 (wizard path) — open the Article Wizard after the user selects a template.
 * Passes templateName + wizardCategory in the INIT payload so Step 3 can pre-fill category.
 */
function openArticleWizardDialog(
  event:        Office.AddinCommands.Event,
  personName:   string,
  personEmail:  string,
  templateName: string,
  wizardCategory: string,
  attempt       = 0,
): void {
  const commConfig = getCommunicationConfig();

  _trackDialogAsync(
    `${DIALOG_BASE}/dialog.html?view=article-wizard`,
    { ...ARTICLE_WIZARD_SIZE, displayInIframe: true },
    (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) {
        if ((result.error as { code: number }).code === 12007 && attempt < 15) {
          setTimeout(
            () => openArticleWizardDialog(event, personName, personEmail, templateName, wizardCategory, attempt + 1),
            300,
          );
          return;
        }
        handleDialogOpenError(result.error, event);
        return;
      }

      const wzDialog = result.value;
      const complete = makeEventCompleter(event);
      let transitioning = false;

      // Rebuilds + re-sends INIT. Re-reads user "Select Information" items so
      // the panel refreshes after every add/remove. templateName/wizardCategory
      // are unchanged, so the wizard's category/personName effects don't re-fire.
      const sendInit = () => {
        const initPayload: DialogInitPayload = {
          selection:             "",
          mode:                  "selection",
          source:                getSource(),
          personName,
          personEmail,
          applicationName:       "",
          communicationFunction: "",
          communicationSignal:   "",
          projectName:           "",
          peopleList:            [],
          templateName,
          wizardCategory,
          communicationPersonName: commConfig?.personName ?? "",
          userInfoItems:           getUserInformationItems(),
        };
        wzDialog.messageChild(JSON.stringify({ type: "INIT", payload: initPayload } as HostMessage));
      };

      wzDialog.addEventHandler(Office.EventType.DialogEventReceived, () => {
        if (!transitioning) complete();
      });

      wzDialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
        const m = JSON.parse((msg as { message: string }).message) as DialogAction;

        switch (m.action) {
          case "READY":
            sendInit();
            break;

          case "SAVE_USER_INFO_ITEM":
            try { addUserInformationItem(m.name, m.html); } catch { /* title required — ignore */ }
            sendInit();
            break;

          case "DELETE_USER_INFO_ITEM":
            deleteUserInformationItem(m.id);
            sendInit();
            break;

          case "SAVE_ARTICLE_WIZARD": {
            try {
              saveArticleWizard({ ...m.payload, personEmail, source: getSource() });
              wzDialog.messageChild(JSON.stringify({ type: "SAVED" } as HostMessage));
            } catch (err) {
              wzDialog.messageChild(JSON.stringify({ type: "ERROR", message: String(err) } as HostMessage));
            }
            break;
          }

          case "BACK_TO_PICKER":
            transitioning = true;
            wzDialog.close();
            openTemplatePickerDialog(event, personName, personEmail);
            break;

          case "CLOSE":
            wzDialog.close();
            complete();
            break;

          default:
            break;
        }
      });
    },
  );
}

/** Step 2 — open the full article creation form after the picker closes. */
function openArticleFormDialog(
  event: Office.AddinCommands.Event,
  personName: string,
  personEmail: string,
  attempt = 0,
): void {
  const initPayload: DialogInitPayload = {
    selection: "",
    mode: "selection",
    source: getSource(),
    personName,
    personEmail,
    applicationName: "",
    communicationFunction: "",
    communicationSignal: "",
    projectName: "",
    peopleList: [],
  };
  _trackDialogAsync(
    `${DIALOG_BASE}/dialog.html?view=create-article`,
    { ...CREATE_ARTICLE_DIALOG_SIZE, displayInIframe: true },
    (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) {
        // 12007 = picker dialog still closing; retry up to 15×
        if ((result.error as { code: number }).code === 12007 && attempt < 15) {
          setTimeout(() => openArticleFormDialog(event, personName, personEmail, attempt + 1), 300);
          return;
        }
        handleDialogOpenError(result.error, event);
        return;
      }
      const dialog = result.value;
      const complete = makeEventCompleter(event);
      dialog.addEventHandler(Office.EventType.DialogEventReceived, () => {
        complete();
      });
      dialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
        const m = JSON.parse((msg as { message: string }).message) as DialogAction;
        switch (m.action) {
          case "READY":
            dialog.messageChild(JSON.stringify({ type: "INIT", payload: initPayload } as HostMessage));
            break;
          case "SAVE_ARTICLE": {
            const p = m.payload as SaveArticlePayload;
            try {
              if (p.id !== undefined) {
                updateArticle(p.id, p);
              } else {
                saveArticle({ ...p, personName, personEmail, source: getSource() });
              }
            } catch (err) {
              dialog.messageChild(JSON.stringify({ type: "ERROR", message: String(err) } as HostMessage));
              break;
            }
            try { dialog.close(); } catch { }
            complete();
            break;
          }
          case "CLOSE":
            try { dialog.close(); } catch { }
            complete();
            break;
          default:
            break;
        }
      });
    }
  );
}

/** Opens the List of Articles full-screen dialog. */
async function openListArticlesDialog(event: Office.AddinCommands.Event): Promise<void> {
  try { await ensureDb(); } catch (err) { showNoSelectionMessage("Database Error", String(err), event); return; }
  const { personName, personEmail } = getUserIdentity();

  const initPayload: DialogInitPayload = {
    selection: "",
    mode: "selection",
    source: getSource(),
    personName,
    personEmail,
    applicationName: "",
    communicationFunction: "",
    communicationSignal: "",
    projectName: "",
    peopleList: [],
    articles: getAllArticles(),
    publishers: getAllPublishers(),
  };

  _trackDialogAsync(
    `${DIALOG_BASE}/dialog.html?view=list-articles`,
    { ...DIALOG_SIZE, displayInIframe: true },
    (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) {
        handleDialogOpenError(result.error, event);
        return;
      }
      const dialog = result.value;
      const complete = makeEventCompleter(event);
      let transitioning = false;

      dialog.addEventHandler(Office.EventType.DialogEventReceived, () => {
        if (!transitioning) complete();
      });
      dialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
        const m = JSON.parse((msg as { message: string }).message) as DialogAction;
        switch (m.action) {
          case "READY":
            dialog.messageChild(JSON.stringify({ type: "INIT", payload: initPayload } as HostMessage));
            break;
          case "DELETE_ARTICLE": {
            try { deleteArticle((m as { action: string; id: number }).id); }
            catch (err) { replyError(dialog, `Delete failed: ${String(err)}`); }
            break;
          }
          case "EDIT_ARTICLE": {
            const article = getArticleById((m as { action: string; id: number }).id);
            if (!article) break;
            transitioning = true;
            try { dialog.close(); } catch { }
            openEditArticleDialog(event, personName, personEmail, article);
            break;
          }
          case "PUBLISH_ARTICLE": {
            const pm = m as { action: string; id: number; publishers: string[] };
            try {
              publishArticle(pm.id, pm.publishers);
              initPayload.articles = getAllArticles();
              dialog.messageChild(JSON.stringify({ type: "INIT", payload: initPayload } as HostMessage));
            } catch (err) {
              replyError(dialog, `Publish failed: ${String(err)}`);
            }
            break;
          }
          case "ADD_PUBLISHER": {
            const ap = m as { action: string; name: string; logoBase64: string };
            try {
              savePublisher(ap.name, ap.logoBase64);
              initPayload.publishers = getAllPublishers();
              dialog.messageChild(JSON.stringify({ type: "INIT", payload: initPayload } as HostMessage));
            } catch (err) {
              replyError(dialog, `Add publisher failed: ${String(err)}`);
            }
            break;
          }
          case "DELETE_PUBLISHER": {
            const dp = m as { action: string; id: number };
            try {
              deletePublisher(dp.id);
              initPayload.publishers = getAllPublishers();
              dialog.messageChild(JSON.stringify({ type: "INIT", payload: initPayload } as HostMessage));
            } catch (err) {
              replyError(dialog, `Delete publisher failed: ${String(err)}`);
            }
            break;
          }
          case "FLAG_ARTICLE": {
            const faArticle = getArticleById((m as { action: string; id: number }).id);
            if (!faArticle) break;
            transitioning = true;
            try { dialog.close(); } catch { }
            openFlagArticleDialog(event, personName, personEmail, faArticle);
            break;
          }
          case "ANALYZE_ARTICLE": {
            const aaArticle = getArticleById((m as { action: string; id: number }).id);
            if (!aaArticle) break;
            transitioning = true;
            try { dialog.close(); } catch { }
            openAnalyzeArticleDialog(event, personName, personEmail, aaArticle);
            break;
          }
          case "REQUEST_FEEDBACK_ARTICLE": {
            const rfArticle = getArticleById((m as { action: string; id: number }).id);
            if (!rfArticle) break;
            transitioning = true;
            try { dialog.close(); } catch { }
            openRequestFeedbackArticleDialog(event, personName, personEmail, rfArticle);
            break;
          }
          case "CLOSE":
            try { dialog.close(); } catch { }
            complete();
            break;
          default:
            break;
        }
      });
    }
  );
}

async function openFlaggedArticlesDialog(event: Office.AddinCommands.Event): Promise<void> {
  try { await ensureDb(); } catch (err) { showNoSelectionMessage("Database Error", String(err), event); return; }
  const { personName, personEmail } = getUserIdentity();

  const initPayload: DialogInitPayload = {
    selection: "",
    mode: "selection",
    source: getSource(),
    personName,
    personEmail,
    applicationName: "",
    communicationFunction: "",
    communicationSignal: "",
    projectName: "",
    peopleList: [],
    flaggedArticles: getAllFlaggedArticles(),
    articles: getAllArticles(),
  };

  _trackDialogAsync(
    `${DIALOG_BASE}/dialog.html?view=flagged-articles`,
    { ...DIALOG_SIZE, displayInIframe: true },
    (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) {
        handleDialogOpenError(result.error, event);
        return;
      }
      const dialog = result.value;
      const complete = makeEventCompleter(event);
      let transitioning = false;

      dialog.addEventHandler(Office.EventType.DialogEventReceived, () => {
        if (!transitioning) complete();
      });
      dialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
        const m = JSON.parse((msg as { message: string }).message) as DialogAction;
        switch (m.action) {
          case "READY":
            dialog.messageChild(JSON.stringify({ type: "INIT", payload: initPayload } as HostMessage));
            break;
          case "DELETE_FLAGGED_ARTICLE": {
            try { deleteFlaggedArticle((m as { action: string; id: number }).id); }
            catch (err) { replyError(dialog, `Delete failed: ${String(err)}`); }
            break;
          }
          case "FLAG_ARTICLE": {
            const faArticle = getArticleById((m as { action: string; id: number }).id);
            if (!faArticle) break;
            transitioning = true;
            try { dialog.close(); } catch { }
            openFlagArticleDialog(event, personName, personEmail, faArticle);
            break;
          }
          case "ANALYZE_ARTICLE": {
            const aaArticle = getArticleById((m as { action: string; id: number }).id);
            if (!aaArticle) break;
            transitioning = true;
            try { dialog.close(); } catch { }
            openAnalyzeArticleDialog(event, personName, personEmail, aaArticle);
            break;
          }
          case "REQUEST_FEEDBACK_ARTICLE": {
            const rfArticle = getArticleById((m as { action: string; id: number }).id);
            if (!rfArticle) break;
            transitioning = true;
            try { dialog.close(); } catch { }
            openRequestFeedbackArticleDialog(event, personName, personEmail, rfArticle);
            break;
          }
          case "CLOSE":
            try { dialog.close(); } catch { }
            complete();
            break;
          default:
            break;
        }
      });
    }
  );
}

function openFlagArticleDialog(
  event: Office.AddinCommands.Event,
  personName: string,
  personEmail: string,
  article: import("@/types/db").Article,
  attempt = 0
): void {
  const commConfig = getCommunicationConfig();
  const initPayload: DialogInitPayload = {
    selection: plainText(article.articleContent),
    selectionHtml: formatArticleForAnalysis(article),
    mode: "paragraph",
    source: getSource(),
    personName,
    personEmail,
    applicationName: article.articleTitle,
    communicationFunction: "",
    communicationSignal: "",
    projectName: "",
    peopleList: buildPeopleList(commConfig?.personName),
    communicationPersonName: commConfig?.personName ?? "",
  };
  const screenH = window.screen?.availHeight || 1080;
  const screenW = window.screen?.availWidth  || 1440;
  const flagHeight = Math.min(75, Math.max(28, Math.round((433 / (screenH * 0.93)) * 100) + 4));
  const flagWidth  = Math.min(80, Math.max(22, Math.round((380 / (screenW * 0.95)) * 100)));
  _trackDialogAsync(
    `${DIALOG_BASE}/dialog.html?view=flag`,
    { height: flagHeight, width: flagWidth, displayInIframe: true },
    (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) {
        if ((result.error as { code: number }).code === 12007 && attempt < 15) {
          setTimeout(() => openFlagArticleDialog(event, personName, personEmail, article, attempt + 1), 300);
          return;
        }
        handleDialogOpenError(result.error, event);
        return;
      }
      const dialog = result.value;
      const complete = makeEventCompleter(event);
      dialog.addEventHandler(Office.EventType.DialogEventReceived, (evt) => {
        void (evt as { error: number }).error;
        complete();
      });
      dialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
        const m = JSON.parse((msg as { message: string }).message) as DialogAction;
        switch (m.action) {
          case "READY":
            dialog.messageChild(JSON.stringify({ type: "INIT", payload: initPayload } as HostMessage));
            break;
          case "SAVE_FLAG": {
            const flag = m.payload as Omit<FlagEntityForAnalysis, "id">;
            try {
              saveFlag({ ...flag, articleId: article.id });
            } catch (err) {
              dialog.messageChild(JSON.stringify({ type: "ERROR", message: String(err) } as HostMessage));
              break;
            }
            break;
          }
          case "CLOSE":
            try { dialog.close(); } catch { }
            complete();
            break;
          default:
            break;
        }
      });
    }
  );
}

// Returns HTML for the EUA only when the saved actualSelection already looks like
// HTML (older flows store the rich-text selection here). For plain text, return ""
// and let the dialog's existing plain-text fallback wrap it correctly — wrapping
// here would double-escape pre-existing tags and show them as literal text.
function flagSelectionToHtml(text: string | undefined | null): string {
  if (!text) return "";
  return /<\w+[^>]*>/.test(text) ? text : "";
}

function openAnalyzeFromHistory(
  flag: FlagEntityForAnalysis,
  personName: string,
  personEmail: string,
  event: Office.AddinCommands.Event
): void {
  const commConfig = getCommunicationConfig();
  const initPayload: DialogInitPayload = {
    selection: flag.actualSelection,
    selectionHtml: flagSelectionToHtml(flag.actualSelection),
    mode: flag.selectionType === "Selection" ? "selection" : "paragraph",
    source: flag.source,
    personName,
    personEmail,
    applicationName: flag.applicationName,
    communicationFunction: flag.communicationFunction,
    communicationSignal: flag.communicationSignal,
    projectName: flag.projectName,
    peopleList: buildPeopleList(commConfig?.personName),
    communicationPersonName: commConfig?.personName ?? "",
    communicationPersonEmail: commConfig?.personEmail ?? "",
  };
  openAnalyzeDialogWithPayload(initPayload, commConfig?.personName ?? "", commConfig?.personEmail ?? "", event);
}

function openApplyFromHistory(
  flag: FlagEntityForAnalysis,
  personName: string,
  personEmail: string,
  event: Office.AddinCommands.Event
): void {
  const commConfig = getCommunicationConfig();
  const analyses = getAllAnalyses().map((a) => {
    if (!a.id) return a;
    return { ...a, questions: getQuestionsByAnalysis(a.id), errors: getErrorsByAnalysis(a.id), compensators: getCompensatorsByAnalysis(a.id), answers: getAnswersByAnalysis(a.id), files: getFilesByAnalysis(a.id) };
  });
  const feedbacks = getAllFeedbacks().map((f) => {
    if (!f.analysisId) return { ...f, problems: f.id ? getProblemsByFeedback(f.id) : [] };
    return { ...f, questions: getQuestionsByAnalysis(f.analysisId), errors: getErrorsByAnalysis(f.analysisId), compensators: getCompensatorsByAnalysis(f.analysisId), answers: getAnswersByAnalysis(f.analysisId), files: getFilesByAnalysis(f.analysisId), problems: [...getProblemsByAnalysis(f.analysisId), ...(f.id ? getProblemsByFeedback(f.id) : [])] };
  });
  openApplyDialog({
    selection: flag.actualSelection,
    selectionHtml: flagSelectionToHtml(flag.actualSelection),
    mode: flag.selectionType === "Selection" ? "selection" : "paragraph",
    source: flag.source,
    personName,
    personEmail,
    applicationName: flag.applicationName,
    communicationFunction: flag.communicationFunction,
    communicationSignal: flag.communicationSignal,
    projectName: flag.projectName,
    peopleList: buildPeopleList(commConfig?.personName),
    peopleEmailMap: getPeopleEmailMap(),
    contacts: getAllPeople(),
    communicationPersonName: commConfig?.personName ?? "",
    communicationPersonEmail: commConfig?.personEmail ?? "",
    analyses,
    feedbacks,
  }, event);
}

function openProvideFromHistory(
  flag: FlagEntityForAnalysis,
  personName: string,
  personEmail: string,
  event: Office.AddinCommands.Event
): void {
  const commConfig = getCommunicationConfig();
  openProvideFeedbackDialog({
    selection: flag.actualSelection,
    selectionHtml: flagSelectionToHtml(flag.actualSelection),
    mode: flag.selectionType === "Selection" ? "selection" : "paragraph",
    source: flag.source,
    personName,
    personEmail,
    applicationName: flag.applicationName,
    communicationFunction: flag.communicationFunction,
    communicationSignal: flag.communicationSignal,
    projectName: flag.projectName,
    peopleList: buildPeopleList(commConfig?.personName),
    peopleEmailMap: getPeopleEmailMap(),
    contacts: getAllPeople(),
    communicationPersonName: commConfig?.personName ?? "",
    communicationPersonEmail: commConfig?.personEmail ?? "",
  }, event);
}

function openAnalyzeArticleDialog(
  event: Office.AddinCommands.Event,
  personName: string,
  personEmail: string,
  article: import("@/types/db").Article
): void {
  const commConfig = getCommunicationConfig();
  const initPayload: DialogInitPayload = {
    selection: plainText(article.articleContent),
    selectionHtml: formatArticleForAnalysis(article),
    mode: "paragraph",
    source: getSource(),
    personName,
    personEmail,
    applicationName: article.articleTitle,
    communicationFunction: "",
    communicationSignal: "",
    projectName: "",
    peopleList: buildPeopleList(commConfig?.personName),
    communicationPersonName: commConfig?.personName ?? "",
    communicationPersonEmail: commConfig?.personEmail ?? "",
  };
  openAnalyzeDialogWithPayload(initPayload, commConfig?.personName ?? "", commConfig?.personEmail ?? "", event);
}

function openRequestFeedbackArticleDialog(
  event: Office.AddinCommands.Event,
  personName: string,
  personEmail: string,
  article: import("@/types/db").Article,
  attempt = 0
): void {
  const commConfig = getCommunicationConfig();
  openRequestFeedbackDialog({
    selection: article.articleTitle,
    selectionHtml: formatArticleForAnalysis(article),
    mode: "paragraph",
    source: getSource(),
    personName,
    personEmail,
    applicationName: article.articleTitle,
    communicationFunction: "",
    communicationSignal: "",
    projectName: "",
    peopleList: buildPeopleList(commConfig?.personName),
    peopleEmailMap: getPeopleEmailMap(), contacts: getAllPeople(),
    communicationPersonName: commConfig?.personName ?? "",
    communicationPersonEmail: commConfig?.personEmail ?? "",
  }, event, attempt);
}

function openEditArticleDialog(
  event: Office.AddinCommands.Event,
  personName: string,
  personEmail: string,
  article: import("@/types/db").Article,
  attempt = 0,
): void {
  const editPayload: DialogInitPayload = {
    selection: "",
    mode: "selection",
    source: getSource(),
    personName,
    personEmail,
    applicationName: "",
    communicationFunction: "",
    communicationSignal: "",
    projectName: "",
    peopleList: [],
    editArticleData: article,
  };
  _trackDialogAsync(
    `${DIALOG_BASE}/dialog.html?view=create-article`,
    { ...CREATE_ARTICLE_DIALOG_SIZE, displayInIframe: true },
    (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) {
        if ((result.error as { code: number }).code === 12007 && attempt < 15) {
          setTimeout(() => openEditArticleDialog(event, personName, personEmail, article, attempt + 1), 300);
          return;
        }
        handleDialogOpenError(result.error, event);
        return;
      }
      const d = result.value;
      const complete = makeEventCompleter(event);
      d.addEventHandler(Office.EventType.DialogEventReceived, () => { complete(); });
      d.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
        const m2 = JSON.parse((msg as { message: string }).message) as DialogAction;
        switch (m2.action) {
          case "READY":
            d.messageChild(JSON.stringify({ type: "INIT", payload: editPayload } as HostMessage));
            break;
          case "SAVE_ARTICLE": {
            const p = m2.payload as SaveArticlePayload;
            try {
              if (p.id !== undefined) {
                updateArticle(p.id, p);
              } else {
                saveArticle({ ...p, personName, personEmail, source: getSource() });
              }
            } catch (err) {
              d.messageChild(JSON.stringify({ type: "ERROR", message: String(err) } as HostMessage));
              break;
            }
            try { d.close(); } catch { }
            complete();
            break;
          }
          case "CLOSE":
            try { d.close(); } catch { }
            complete();
            break;
          default:
            break;
        }
      });
    }
  );
}

/** Opens the List of Selection (selection history) dialog. */
async function openListSelectionDialog(event: Office.AddinCommands.Event): Promise<void> {
  try { await ensureDb(); } catch (err) { showNoSelectionMessage("Database Error", String(err), event); return; }
  const { personName, personEmail } = getUserIdentity();

  _trackDialogAsync(
    `${DIALOG_BASE}/dialog.html?view=selection-history`,
    { ...DIALOG_SIZE, displayInIframe: true },
    (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) {
        handleDialogOpenError(result.error, event);
        return;
      }
      const dialog = result.value;
      const complete = makeEventCompleter(event);
      let transitioning = false;
      dialog.addEventHandler(Office.EventType.DialogEventReceived, () => {
        if (!transitioning) complete();
      });

      // Builds a fresh INIT payload from the DB. Re-sent after every principle
      // save/delete so the inline list portals stay in sync (mirrors
      // openFlaggedHistoryDialog — ViewSelectionDialog's Principle dropdown is
      // reachable from this view too).
      const sendInit = () => {
        const selectionHistories = getAllSelectionHistories();

        const principleInterpretations = getAllInterpretations();
        const filesByInterpretationId: Record<number, import("@/types/db").AttachFileToProject[]> = {};
        for (const pi of principleInterpretations) {
          if (pi.id !== undefined) filesByInterpretationId[pi.id] = getFilesByPrincipleInterpretation(pi.id);
        }

        const principlesInSelection = getPrinciplesInSelection();
        const filesByPrincipleInSelectionId: Record<number, import("@/types/db").AttachFileToProject[]> = {};
        for (const p of principlesInSelection) {
          if (p.id !== undefined) filesByPrincipleInSelectionId[p.id] = getFilesByPrincipleInSelection(p.id);
        }

        const selectionsWithPrinciple = getSelectionsWithPrinciple();
        const filesBySelectionWithPrincipleId: Record<number, import("@/types/db").AttachFileToProject[]> = {};
        for (const s of selectionsWithPrinciple) {
          if (s.id !== undefined) filesBySelectionWithPrincipleId[s.id] = getFilesBySelectionWithPrinciple(s.id);
        }

        const initPayload: DialogInitPayload = {
          selection: "",
          mode: "selection",
          source: getSource(),
          personName,
          personEmail,
          applicationName: "",
          communicationFunction: "",
          communicationSignal: "",
          projectName: "",
          peopleList: [],
          selectionHistories,
          principleInterpretations,
          filesByInterpretationId,
          principlesInSelection,
          filesByPrincipleInSelectionId,
          selectionsWithPrinciple,
          filesBySelectionWithPrincipleId,
        };
        dialog.messageChild(JSON.stringify({ type: "INIT", payload: initPayload } as HostMessage));
      };

      dialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
        const m = JSON.parse((msg as { message: string }).message) as DialogAction;
        switch (m.action) {
          case "READY":
            sendInit();
            break;
          case "DELETE_SELECTION_HISTORY": {
            try { deleteSelectionHistory((m as { action: string; id: number }).id); }
            catch (err) { replyError(dialog, `Delete failed: ${String(err)}`); }
            break;
          }
          case "ANALYZE_FROM_HISTORY": {
            const flag = (m as { action: string; flag: FlagEntityForAnalysis }).flag;
            transitioning = true;
            try { dialog.close(); } catch { }
            openAnalyzeFromHistory(flag, personName, personEmail, event);
            break;
          }
          case "APPLY_FROM_HISTORY": {
            const flag = (m as { action: string; flag: FlagEntityForAnalysis }).flag;
            transitioning = true;
            try { dialog.close(); } catch { }
            openApplyFromHistory(flag, personName, personEmail, event);
            break;
          }
          case "PROVIDE_FROM_HISTORY": {
            const flag = (m as { action: string; flag: FlagEntityForAnalysis }).flag;
            transitioning = true;
            try { dialog.close(); } catch { }
            openProvideFromHistory(flag, personName, personEmail, event);
            break;
          }
          case "DELETE_INTERPRETED_PRINCIPLE": {
            try { deleteInterpretation((m as { action: string; id: number }).id); sendInit(); }
            catch (err) { replyError(dialog, `Delete failed: ${String(err)}`); }
            break;
          }
          case "DELETE_PRINCIPLE": {
            try { deletePrincipleInSelection((m as { action: string; id: number }).id); sendInit(); }
            catch (err) { replyError(dialog, `Delete failed: ${String(err)}`); }
            break;
          }
          case "DELETE_RELATED_SELECTION": {
            try { deleteSelectionWithPrinciple((m as { action: string; id: number }).id); sendInit(); }
            catch (err) { replyError(dialog, `Delete failed: ${String(err)}`); }
            break;
          }
          case "REPORT_INTERPRETED_PRINCIPLE": {
            try { openInterpretedPrincipleReport((m as { action: string; interpretation: import("@/types/db").PrincipleInterpretation }).interpretation); }
            catch { /* non-critical */ }
            break;
          }
          case "REPORT_IDENTIFIED_PRINCIPLE": {
            try { openIdentifiedPrincipleReport((m as { action: string; principle: import("@/types/db").PrincipleInSelection }).principle); }
            catch { /* non-critical */ }
            break;
          }
          case "REPORT_RELATED_SELECTION": {
            try { openRelatedPrincipleReport((m as { action: string; relation: import("@/types/db").SelectionWithPrinciple }).relation); }
            catch { /* non-critical */ }
            break;
          }
          case "ADD_ATTACHED_FILE": {
            const { file } = m as { action: string; file: import("@/types/db").AttachFileToProject };
            const newId = addAttachedFile(file as Omit<import("@/types/db").AttachFileToProject, "id">);
            dialog.messageChild(JSON.stringify({ type: "FILE_ADDED", id: newId }));
            break;
          }
          case "REMOVE_ATTACHED_FILE":
            removeAttachedFile((m as { action: string; id: number }).id);
            break;
          case "SAVE_RELATED_SELECTION": {
            try {
              const { payload } = m as { action: string; payload: SaveRelatedSelectionPayload };
              const newId = saveSelectionWithPrinciple(payload.record);
              for (const file of payload.files) addAttachedFile({ ...file, selectionWithPrincipleId: newId });
              sendInit();
            } catch (err) { replyError(dialog, `Save failed: ${String(err)}`); }
            break;
          }
          case "SAVE_PRINCIPLE_IN_SELECTION": {
            try {
              const { payload } = m as { action: string; payload: SavePrincipleInSelectionPayload };
              const newId = savePrincipleInSelection(payload.record);
              for (const file of payload.files) addAttachedFile({ ...file, principleInSelectionId: newId });
              sendInit();
            } catch (err) { replyError(dialog, `Save failed: ${String(err)}`); }
            break;
          }
          case "SAVE_INTERPRETATION": {
            try {
              const { payload } = m as { action: string; payload: SaveInterpretationPayload };
              const newId = saveInterpretation(payload.record);
              for (const file of payload.files) addAttachedFile({ ...file, principleInterpretationId: newId });
              sendInit();
            } catch (err) { replyError(dialog, `Save failed: ${String(err)}`); }
            break;
          }
          case "CLOSE":
            try { dialog.close(); } catch { }
            complete();
            break;
          default:
            break;
        }
      });
    }
  );
}

async function openListIdentifiedPrincipleDialog(event: Office.AddinCommands.Event): Promise<void> {
  try { await ensureDb(); } catch (err) { showNoSelectionMessage("Database Error", String(err), event); return; }
  const { personName, personEmail } = getUserIdentity();

  function buildPayload(): DialogInitPayload {
    const principlesInSelection = getPrinciplesInSelection();
    const filesByPrincipleInSelectionId: Record<number, import("@/types/db").AttachFileToProject[]> = {};
    for (const p of principlesInSelection) {
      if (p.id !== undefined) filesByPrincipleInSelectionId[p.id] = getFilesByPrincipleInSelection(p.id);
    }
    return {
      selection: "", mode: "selection", source: getSource(), personName, personEmail,
      applicationName: "", communicationFunction: "", communicationSignal: "", projectName: "", peopleList: [],
      principlesInSelection, filesByPrincipleInSelectionId,
    };
  }

  _trackDialogAsync(
    `${DIALOG_BASE}/dialog.html?view=list-identified-principle`,
    { ...DIALOG_SIZE, displayInIframe: true },
    (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) { handleDialogOpenError(result.error, event); return; }
      const dialog = result.value;
      const complete = makeEventCompleter(event);
      dialog.addEventHandler(Office.EventType.DialogEventReceived, () => { complete(); });
      dialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
        const m = JSON.parse((msg as { message: string }).message) as DialogAction;
        if (m.action === "READY") {
          dialog.messageChild(JSON.stringify({ type: "INIT", payload: buildPayload() } as HostMessage));
        } else if (m.action === "DELETE_PRINCIPLE") {
          try {
            deletePrincipleInSelection((m as { action: string; id: number }).id);
            dialog.messageChild(JSON.stringify({ type: "INIT", payload: buildPayload() } as HostMessage));
          } catch (err) { replyError(dialog, `Delete failed: ${String(err)}`); }
        } else if (m.action === "REPORT_IDENTIFIED_PRINCIPLE") {
          try { openIdentifiedPrincipleReport((m as { action: string; principle: import("@/types/db").PrincipleInSelection }).principle); }
          catch { /* non-critical */ }
        } else if (m.action === "ADD_ATTACHED_FILE") {
          const { file } = m as { action: string; file: import("@/types/db").AttachFileToProject };
          const newId = addAttachedFile(file as Omit<import("@/types/db").AttachFileToProject, "id">);
          dialog.messageChild(JSON.stringify({ type: "FILE_ADDED", id: newId }));
        } else if (m.action === "REMOVE_ATTACHED_FILE") {
          removeAttachedFile((m as { action: string; id: number }).id);
        } else if (m.action === "SAVE_INTERPRETATION") {
          // Interpret is reachable from this list (Identified → Interpret hinge).
          try {
            const { payload } = m as { action: string; payload: SaveInterpretationPayload };
            const newId = saveInterpretation(payload.record);
            for (const file of payload.files) addAttachedFile({ ...file, principleInterpretationId: newId });
          } catch (err) { replyError(dialog, `Save failed: ${String(err)}`); }
        } else if (m.action === "CLOSE") {
          try { dialog.close(); } catch { } complete();
        }
      });
    }
  );
}

async function openListInterpretedPrincipleDialog(event: Office.AddinCommands.Event): Promise<void> {
  try { await ensureDb(); } catch (err) { showNoSelectionMessage("Database Error", String(err), event); return; }
  const { personName, personEmail } = getUserIdentity();

  function buildPayload(): DialogInitPayload {
    const principleInterpretations = getAllInterpretations();
    const filesByInterpretationId: Record<number, import("@/types/db").AttachFileToProject[]> = {};
    for (const pi of principleInterpretations) {
      if (pi.id !== undefined) filesByInterpretationId[pi.id] = getFilesByPrincipleInterpretation(pi.id);
    }
    return {
      selection: "", mode: "selection", source: getSource(), personName, personEmail,
      applicationName: "", communicationFunction: "", communicationSignal: "", projectName: "", peopleList: [],
      principleInterpretations, filesByInterpretationId,
    };
  }

  _trackDialogAsync(
    `${DIALOG_BASE}/dialog.html?view=list-interpreted-principle`,
    { ...DIALOG_SIZE, displayInIframe: true },
    (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) { handleDialogOpenError(result.error, event); return; }
      const dialog = result.value;
      const complete = makeEventCompleter(event);
      dialog.addEventHandler(Office.EventType.DialogEventReceived, () => { complete(); });
      dialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
        const m = JSON.parse((msg as { message: string }).message) as DialogAction;
        if (m.action === "READY") {
          dialog.messageChild(JSON.stringify({ type: "INIT", payload: buildPayload() } as HostMessage));
        } else if (m.action === "DELETE_INTERPRETED_PRINCIPLE") {
          try {
            deleteInterpretation((m as { action: string; id: number }).id);
            dialog.messageChild(JSON.stringify({ type: "INIT", payload: buildPayload() } as HostMessage));
          } catch (err) { replyError(dialog, `Delete failed: ${String(err)}`); }
        } else if (m.action === "REPORT_INTERPRETED_PRINCIPLE") {
          try { openInterpretedPrincipleReport((m as { action: string; interpretation: import("@/types/db").PrincipleInterpretation }).interpretation); }
          catch { /* non-critical */ }
        } else if (m.action === "ADD_ATTACHED_FILE") {
          const { file } = m as { action: string; file: import("@/types/db").AttachFileToProject };
          const newId = addAttachedFile(file as Omit<import("@/types/db").AttachFileToProject, "id">);
          dialog.messageChild(JSON.stringify({ type: "FILE_ADDED", id: newId }));
        } else if (m.action === "REMOVE_ATTACHED_FILE") {
          removeAttachedFile((m as { action: string; id: number }).id);
        } else if (m.action === "CLOSE") {
          try { dialog.close(); } catch { } complete();
        }
      });
    }
  );
}

async function openListSelectionRelatedPrincipleDialog(event: Office.AddinCommands.Event): Promise<void> {
  try { await ensureDb(); } catch (err) { showNoSelectionMessage("Database Error", String(err), event); return; }
  const { personName, personEmail } = getUserIdentity();

  function buildPayload(): DialogInitPayload {
    const selectionsWithPrinciple = getSelectionsWithPrinciple();
    const filesBySelectionWithPrincipleId: Record<number, import("@/types/db").AttachFileToProject[]> = {};
    for (const s of selectionsWithPrinciple) {
      if (s.id !== undefined) filesBySelectionWithPrincipleId[s.id] = getFilesBySelectionWithPrinciple(s.id);
    }
    return {
      selection: "", mode: "selection", source: getSource(), personName, personEmail,
      applicationName: "", communicationFunction: "", communicationSignal: "", projectName: "", peopleList: [],
      selectionsWithPrinciple, filesBySelectionWithPrincipleId,
    };
  }

  _trackDialogAsync(
    `${DIALOG_BASE}/dialog.html?view=list-selection-related-principle`,
    { ...DIALOG_SIZE, displayInIframe: true },
    (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) { handleDialogOpenError(result.error, event); return; }
      const dialog = result.value;
      const complete = makeEventCompleter(event);
      dialog.addEventHandler(Office.EventType.DialogEventReceived, () => { complete(); });
      dialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
        const m = JSON.parse((msg as { message: string }).message) as DialogAction;
        if (m.action === "READY") {
          dialog.messageChild(JSON.stringify({ type: "INIT", payload: buildPayload() } as HostMessage));
        } else if (m.action === "DELETE_RELATED_SELECTION") {
          try {
            deleteSelectionWithPrinciple((m as { action: string; id: number }).id);
            dialog.messageChild(JSON.stringify({ type: "INIT", payload: buildPayload() } as HostMessage));
          } catch (err) { replyError(dialog, `Delete failed: ${String(err)}`); }
        } else if (m.action === "REPORT_RELATED_SELECTION") {
          try {
            const { relation } = m as { action: string; relation: import("@/types/db").SelectionWithPrinciple };
            openRelatedPrincipleReport(relation);
          } catch { /* non-critical — report window blocked or failed */ }
        } else if (m.action === "CLOSE") {
          try { dialog.close(); } catch { } complete();
        }
      });
    }
  );
}

function openProvideFeedbackDialog(initPayload: DialogInitPayload, addInEvent: Office.AddinCommands.Event, attempt = 0): void {
  _trackDialogAsync(
    `${DIALOG_BASE}/dialog.html?view=provide-feedback`,
    { ...DIALOG_SIZE, displayInIframe: true },
    (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) {
        if ((result.error as { code: number }).code === 12007 && attempt < 15) {
          setTimeout(() => openProvideFeedbackDialog(initPayload, addInEvent, attempt + 1), 300);
          return;
        }
        handleDialogOpenError(result.error, addInEvent);
        return;
      }
      const dialog = result.value;
      const complete = makeEventCompleter(addInEvent);
      dialog.addEventHandler(Office.EventType.DialogEventReceived, (evt) => {
        void (evt as { error: number }).error;
        complete();
      });
      dialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
        const m = JSON.parse((msg as { message: string }).message) as DialogAction;
        switch (m.action) {
          case "READY":
            dialog.messageChild(JSON.stringify({ type: "INIT", payload: initPayload } as HostMessage));
            break;
          case "SAVE_FEEDBACK": {
            const fbPayload = m.payload as SaveFeedbackPayload;
            try {
              saveFeedback(fbPayload);
            } catch (err) {
              dialog.messageChild(JSON.stringify({ type: "ERROR", message: String(err) } as HostMessage));
              break;
            }
            if (fbPayload.feedback.toPerson) {
              upsertPersonWithEmail(fbPayload.feedback.toPerson, fbPayload.toPersonEmail ?? "");
            }
            const f = fbPayload.feedback;
            saveFeedbackHistory({
              selectionAction: "Applied as Feedback",
              entityName: plainText(f.actualSelection) || plainText(f.feedbackApplication),
              actualSelection: f.feedbackApplication,
              selectionType: f.selectionType,
              source: f.source,
              applicationName: f.applicationName,
              communicationFunction: f.communicationFunction,
              communicationSignal: f.communicationSignal,
              projectName: f.projectName,
              personName: f.personName,
              personEmail: f.personEmail,
            });
            {
              const analysis = loadAnalysisForFeedback(fbPayload.feedback.analysisId);
              const html = fbPayload.feedback.feedbackType === "Applied"
                ? buildApplyFeedbackEmail(fbPayload.feedback, analysis)
                : buildProvideFeedbackEmail(fbPayload.feedback, analysis);
              openHtmlEmailDraft(
                html,
                fbPayload.toPersonEmail ?? "",
                fbPayload.feedback.feedbackSubject,
                fbPayload.feedback.feedbackApplication,
                (mailtoUrl) => {
                  dialog.messageChild(JSON.stringify({ type: "SAVED", mailtoUrl } as HostMessage));
                },
              );
            }
            // Stay open — wait for CLOSE from the success screen.
            break;
          }
          case "OPEN_MAILTO":
            openMailtoUrl((m as { action: string; url: string }).url);
            try { dialog.close(); } catch { }
            complete();
            break;
          case "INSERT_TEXT_AT_CURSOR":
            insertTextAtCursor((m as { action: string; text: string; html?: string }).text, (m as { action: string; text: string; html?: string }).html);
            break;
          case "CLOSE":
            try { dialog.close(); } catch { }
            complete();
            break;
          default:
            break;
        }
      });
    }
  );
}

async function openProvideFeedbackFromRibbon(mode: SelectionMode, event: Office.AddinCommands.Event): Promise<void> {
  try { await ensureDb(); } catch (err) { showNoSelectionMessage("Database Error", String(err), event); return; }
  const meta = await fetchSelectionOrNotify(
    mode,
    mode === "selection" ? "Text Selection Message" : "Paragraph Selection Message",
    "The feedback entity is an entity that enables us to make an adjustment to " +
    "to another entity where the other entity contains error.  In this case, " +
    "the feedback entity enables us to correct error in the other entity.  In " +
    "order for that to happen, the feedback entity must exists.  It is not possible " +
    "to correct error to an entity with the absence of the feedback entity.  For instance " +
    "if we have a sentence that contains error, where that error is being viewed as a bad " +
    "word, with the help and the existence of the feedback entity, it is possible for us to " +
    "correct that error.  Since in order for the error to be corrected the feedback entity must " +
    "exist, here I will need to identify that actual paragraph or selected text that I need to " +
    "to provide as feedback.",
    event
  );
  if (!meta) return;
  const { text: selection, selectionHtml, documentTitle, documentName, pageNumber } = meta;
  const { personName, personEmail } = getUserIdentity();
  const commConfig = getCommunicationConfig();
  openProvideFeedbackDialog({
    selection,
    selectionHtml,
    mode,
    source: getSource(),
    personName,
    personEmail,
    applicationName: buildEntityName(documentTitle, documentName, pageNumber),
    communicationFunction: "",
    communicationSignal: "",
    projectName: documentTitle,
    peopleList: buildPeopleList(commConfig?.personName),
    peopleEmailMap: getPeopleEmailMap(), contacts: getAllPeople(),
    communicationPersonName: commConfig?.personName ?? "",
    communicationPersonEmail: commConfig?.personEmail ?? "",
  }, event);
}

function openApplyDialog(initPayload: DialogInitPayload, addInEvent: Office.AddinCommands.Event, attempt = 0): void {
  _trackDialogAsync(
    `${DIALOG_BASE}/dialog.html?view=apply`,
    { ...DIALOG_SIZE, displayInIframe: true },
    (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) {
        // 12007 = previous dialog not fully torn down yet; retry up to 15×300ms = 4.5s.
        if ((result.error as { code: number }).code === 12007 && attempt < 15) {
          setTimeout(() => openApplyDialog(initPayload, addInEvent, attempt + 1), 300);
          return;
        }
        handleDialogOpenError(result.error, addInEvent);
        return;
      }
      const dialog = result.value;
      const complete = makeEventCompleter(addInEvent);
      dialog.addEventHandler(Office.EventType.DialogEventReceived, (evt) => {
        void (evt as { error: number }).error;
        complete();
      });
      dialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
        const m = JSON.parse((msg as { message: string }).message) as DialogAction;
        switch (m.action) {
          case "READY":
            dialog.messageChild(JSON.stringify({ type: "INIT", payload: initPayload } as HostMessage));
            break;
          case "SAVE_FEEDBACK":
            try {
              saveFeedback(m.payload as SaveFeedbackPayload);
            } catch (err) {
              dialog.messageChild(JSON.stringify({ type: "ERROR", message: String(err) } as HostMessage));
            }
            try { dialog.close(); } catch { }
            complete();
            break;
          case "SAVE_PROBLEM_SOLUTION": {
            // Solve Problem from the apply-feedback Problems tab — save, keep dialog open.
            const sp = m.payload as import("@/types/db").SaveProblemSolutionPayload;
            try {
              saveProblemSolution({
                actualProblem:         sp.actualProblem,
                feedbackApplied:       sp.feedbackApplied,
                errorCorrected:        sp.errorCorrected,
                compensatorReplaced:   sp.compensatorReplaced,
                additionalExplanation: sp.additionalExplanation,
                files:                 sp.files,
              });
            } catch (err) {
              dbg("HOST", "saveProblemSolution (apply) THREW", String(err));
              dialog.messageChild(JSON.stringify({ type: "ERROR", message: String(err) } as HostMessage));
            }
            break;
          }
          case "INSERT_TEXT_AT_CURSOR":
            insertTextAtCursor((m as { action: string; text: string; html?: string }).text, (m as { action: string; text: string; html?: string }).html);
            break;
          case "CLOSE":
            try { dialog.close(); } catch { }
            complete();
            break;
          default:
            break;
        }
      });
    }
  );
}

async function openApplyDialogFromRibbon(mode: SelectionMode, event: Office.AddinCommands.Event): Promise<void> {
  try { await ensureDb(); } catch (err) { showNoSelectionMessage("Database Error", String(err), event); return; }
  const meta = await fetchSelectionOrNotify(
    mode,
    mode === "selection" ? "Text Selection Message" : "Paragraph Selection Message",
    "In order to apply an entity as feedback, that entity must exist. " +
    "If an entity does not exist, then that entity cannot be applied as " +
    "feedback.  In order for me to apply a paragraph or a selected text " +
    "as feedback, I must I must select that paragraph by pointing to it " +
    "or select the portion of the text that I want to apply as feedback.",
    event
  );
  if (!meta) return;
  const { text: selection, selectionHtml, documentTitle, documentName, pageNumber } = meta;
  const { personName, personEmail } = getUserIdentity();
  const commConfig = getCommunicationConfig();
  const analyses = getAllAnalyses().map((a) => {
    if (!a.id) return a;
    return { ...a, questions: getQuestionsByAnalysis(a.id), errors: getErrorsByAnalysis(a.id), compensators: getCompensatorsByAnalysis(a.id), answers: getAnswersByAnalysis(a.id), files: getFilesByAnalysis(a.id) };
  });
  const feedbacks = getAllFeedbacks().map((f) => {
    if (!f.analysisId) return { ...f, problems: f.id ? getProblemsByFeedback(f.id) : [] };
    return { ...f, questions: getQuestionsByAnalysis(f.analysisId), errors: getErrorsByAnalysis(f.analysisId), compensators: getCompensatorsByAnalysis(f.analysisId), answers: getAnswersByAnalysis(f.analysisId), files: getFilesByAnalysis(f.analysisId), problems: [...getProblemsByAnalysis(f.analysisId), ...(f.id ? getProblemsByFeedback(f.id) : [])] };
  });
  openApplyDialog({
    selection,
    selectionHtml,
    mode,
    source: getSource(),
    personName,
    personEmail,
    applicationName: buildEntityName(documentTitle, documentName, pageNumber),
    communicationFunction: "",
    communicationSignal: "",
    projectName: documentTitle,
    peopleList: buildPeopleList(commConfig?.personName),
    peopleEmailMap: getPeopleEmailMap(), contacts: getAllPeople(),
    communicationPersonName: commConfig?.personName ?? "",
    communicationPersonEmail: commConfig?.personEmail ?? "",
    analyses,
    feedbacks,
  }, event);
}

function openSelectionConfigDialog(addInEvent: Office.AddinCommands.Event): void {
  _trackDialogAsync(
    `${DIALOG_BASE}/dialog.html?view=selection-config`,
    { ...SELECTION_CONFIG_DIALOG_SIZE, displayInIframe: true },
    (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) {
        handleDialogOpenError(result.error, addInEvent);
        return;
      }
      const dialog = result.value;
      const complete = makeEventCompleter(addInEvent);
      dialog.addEventHandler(Office.EventType.DialogEventReceived, (evt) => {
        void (evt as { error: number }).error;
        complete();
      });
      dialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
        const m = JSON.parse((msg as { message: string }).message) as DialogAction;
        switch (m.action) {
          case "READY":
            dialog.messageChild(JSON.stringify({ type: "INIT", payload: {
              selection: "", mode: "selection" as const, source: getSource(),
              personName: "", personEmail: "", applicationName: "",
            } } as HostMessage));
            break;
          case "CLOSE":
            try { dialog.close(); } catch { }
            complete();
            break;
          default:
            break;
        }
      });
    }
  );
}

function openFlagDialog(initPayload: DialogInitPayload, addInEvent: Office.AddinCommands.Event): void {
  const screenH = window.screen?.availHeight || 1080;
  const screenW = window.screen?.availWidth  || 1440;
  const flagHeight = Math.min(75, Math.max(28, Math.round((433 / (screenH * 0.93)) * 100) + 4));
  const flagWidth  = Math.min(80, Math.max(22, Math.round((380 / (screenW * 0.95)) * 100)));
  _trackDialogAsync(
    `${DIALOG_BASE}/dialog.html?view=flag`,
    { height: flagHeight, width: flagWidth, displayInIframe: true },
    (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) {
        handleDialogOpenError(result.error, addInEvent);
        return;
      }
      const dialog = result.value;
      const complete = makeEventCompleter(addInEvent);
      dialog.addEventHandler(Office.EventType.DialogEventReceived, (evt) => {
        void (evt as { error: number }).error;
        complete();
      });
      dialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
        const m = JSON.parse((msg as { message: string }).message) as DialogAction;
        switch (m.action) {
          case "READY":
            dialog.messageChild(JSON.stringify({ type: "INIT", payload: initPayload } as HostMessage));
            break;
          case "SAVE_FLAG": {
            const flag = m.payload as Omit<FlagEntityForAnalysis, "id">;
            try {
              saveFlag(flag);
            } catch (err) {
              dialog.messageChild(JSON.stringify({ type: "ERROR", message: String(err) } as HostMessage));
              break;
            }
            // Stay open — dialog shows success state, user clicks Close → sends CLOSE
            break;
          }
          case "CLOSE":
            try { dialog.close(); } catch { }
            complete();
            break;
          default:
            break;
        }
      });
    }
  );
}

async function openFlagDialogFromRibbon(mode: SelectionMode, event: Office.AddinCommands.Event): Promise<void> {
  try { await ensureDb(); } catch (err) { showNoSelectionMessage("Database Error", String(err), event); return; }
  const meta = await fetchSelectionOrNotify(
    mode,
    mode === "selection" ? "Text Selection Message" : "Paragraph Selection Message",
    "In order to flag an entity for analysis, that entity must exist. " +
    "In order to flag an entity for analysis, that entity must be identified. " +
    "It is not possible to flag an entity for analysis if that entity is not " +
    "identified or cannot be identified. Here I will need to select the actual " +
    "text or put the cursor or point the mouse to the text that needs to be flagged.",
    event
  );
  if (!meta) return;
  const { text: selection, documentTitle, documentName, pageNumber } = meta;
  const entityName = buildEntityName(documentTitle, documentName, pageNumber);
  const { personName, personEmail } = getUserIdentity();
  const commConfig = getCommunicationConfig();
  openFlagDialog({
    selection,
    mode,
    source: getSource(),
    personName,
    personEmail,
    applicationName: entityName,
    communicationFunction: "",
    communicationSignal: "",
    projectName: documentTitle,
    peopleList: buildPeopleList(commConfig?.personName),
    communicationPersonName: commConfig?.personName ?? "",
    communicationPersonEmail: commConfig?.personEmail ?? "",
  }, event);
}

async function openRequestSLFeedbackDialog(addInEvent: Office.AddinCommands.Event, attempt = 0): Promise<void> {
  try { await ensureDb(); } catch (err) { showNoSelectionMessage("Database Error", String(err), addInEvent); return; }
  const commConfig = getCommunicationConfig();
  const { personName, personEmail } = getUserIdentity();
  const peopleList = buildPeopleList(commConfig?.personName);

  const initPayload: DialogInitPayload = {
    selection: "",
    mode: "selection",
    source: getSource(),
    personName,
    personEmail,
    applicationName: "",
    communicationFunction: "",
    communicationSignal: "",
    projectName: "",
    peopleList,
    communicationPersonName: commConfig?.personName ?? "",
    communicationPersonEmail: commConfig?.personEmail ?? "",
  };

  _trackDialogAsync(
    `${DIALOG_BASE}/dialog.html?view=request-sl-feedback`,
    { ...DIALOG_SIZE, displayInIframe: true },
    (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) {
        if ((result.error as { code: number }).code === 12007 && attempt < 15) {
          setTimeout(() => void openRequestSLFeedbackDialog(addInEvent, attempt + 1), 300);
          return;
        }
        handleDialogOpenError(result.error, addInEvent);
        return;
      }
      const dialog = result.value;
      const complete = makeEventCompleter(addInEvent);
      dialog.addEventHandler(Office.EventType.DialogEventReceived, () => {
        complete();
      });
      dialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
        const m = JSON.parse((msg as { message: string }).message) as DialogAction;
        switch (m.action) {
          case "READY":
            dialog.messageChild(JSON.stringify({ type: "INIT", payload: initPayload } as HostMessage));
            break;
          case "SAVE_REQUEST_SL_FEEDBACK": {
            const p = m.payload as SaveRequestSLFeedbackPayload;
            try {
              saveCommSignalInfo({
                fromPerson: p.fromPerson,
                toPerson: "Speak Logic",
                toPersonEmail: "support@speaklogic.org",
                applicationName: p.applicationName,
                communicationFunction: p.communicationFunction,
                communicationSignalType: p.communicationSignalType,
                communicationSubject: p.communicationSubject,
                actualCommunication: p.actualCommunication,
                actualSelection: "",
                selectionType: "Speak Logic Request",
                entitySelected: `Speak Logic feedback request on ${formatDisplayDate(nowDate())}`,
                files: p.files,
              });
              saveFeedbackHistory({
                selectionAction: "Requested Feedback From Speak Logic",
                entityName: `Speak Logic feedback request on ${formatDisplayDate(nowDate())}`,
                actualSelection: "",
                selectionType: "Web Contain",
                source: initPayload.source,
                applicationName: p.applicationName,
                communicationFunction: p.communicationFunction,
                communicationSignal: p.communicationSignalType,
                projectName: "",
                personName,
                personEmail,
              });
            } catch (err) {
              dialog.messageChild(JSON.stringify({ type: "ERROR", message: String(err) } as HostMessage));
              break;
            }
            const mailtoUrl = buildRequestSLMailtoUrl(p);
            const opened = mailtoUrl ? openMailtoUrl(mailtoUrl) : false;
            dialog.messageChild(JSON.stringify({ type: "SAVED", mailtoUrl: opened ? "" : mailtoUrl } as HostMessage));
            break;
          }
          case "OPEN_MAILTO":
            openMailtoUrl((m as { action: string; url: string }).url);
            try { dialog.close(); } catch { }
            complete();
            break;
          case "CLOSE":
            try { dialog.close(); } catch { }
            complete();
            break;
          default:
            break;
        }
      });
    }
  );
}

function buildRequestSLMailtoUrl(p: SaveRequestSLFeedbackPayload): string {
  const subject = encodeURIComponent(p.communicationSubject);
  const prefix = `Application Name: ${p.applicationName}\nCommunication Function: ${p.communicationFunction}\nCommunication Signal: ${p.communicationSignalType}\n${"=".repeat(60)}\n\n`;
  const bodyText = (prefix + p.actualCommunication.replace(/<[^>]*>/g, "")).slice(0, 1800);
  const body = encodeURIComponent(bodyText);
  return `mailto:support@speaklogic.org?subject=${subject}&body=${body}`;
}

function openCommunicationConfigDialog(event: Office.AddinCommands.Event, attempt = 0): void {
  ensureDb().then(() => {
    const commConfig = getCommunicationConfig();

    let prefillName = "";
    let prefillEmail = "";

    if (Office.context.host === Office.HostType.Outlook) {
      try {
        const mb = Office.context.mailbox;
        const p = mb.userProfile;
        // ── TEMP DIAGNOSTIC: identify why userProfile is empty on M365. Remove once root cause found. ──
        // Read from any same-origin console:
        //   JSON.parse(localStorage.getItem('sl-debug')||'[]').filter(l=>l.includes('IDENTITY')).forEach(l=>console.log(l))
        dbg("IDENTITY", "Outlook userProfile snapshot", {
          hasMailbox: !!mb,
          hasUserProfile: !!p,
          displayName: p?.displayName ?? null,
          emailAddress: p?.emailAddress ?? null,
          accountType: p?.accountType ?? null,        // enterprise = on-prem/hybrid (empty expected); office365 = real bug
          timeZone: p?.timeZone ?? null,
          mailbox16Supported: Office.context.requirements.isSetSupported("Mailbox", "1.6"),
          mbHostName: mb?.diagnostics?.hostName ?? null,
          mbHostVersion: mb?.diagnostics?.hostVersion ?? null,
          diagHost: Office.context.diagnostics?.host ?? null,
          diagPlatform: Office.context.diagnostics?.platform ?? null,
          diagVersion: Office.context.diagnostics?.version ?? null,
        });
        const rawName = p.displayName ?? "";
        prefillName  = (rawName.includes("@") ? "" : rawName) || commConfig?.personName || "";
        prefillEmail = p.emailAddress || commConfig?.personEmail || "";
      } catch (err) {
        dbg("IDENTITY", "Outlook userProfile read THREW", String(err));
        prefillName  = commConfig?.personName  ?? "";
        prefillEmail = commConfig?.personEmail ?? "";
      }
    } else {
      // Word / PPT: use saved config first; Office.context.userProfile is unreliable
      prefillName  = commConfig?.personName  ?? "";
      prefillEmail = commConfig?.personEmail ?? "";
      if (!prefillName || !prefillEmail) {
        try {
          const up = (Office.context as { userProfile?: { displayName?: string; email?: string } }).userProfile;
          if (!prefillName)  prefillName  = up?.displayName ?? "";
          if (!prefillEmail) prefillEmail = up?.email       ?? "";
        } catch { /* not available */ }
      }
    }


    const initPayload: DialogInitPayload = {
      selection: "",
      mode: "selection",
      source: getSource(),
      personName: "",
      personEmail: "",
      applicationName: "",
      communicationFunction: "",
      communicationSignal: "",
      projectName: "",
      peopleList: [],
      communicationPersonName: prefillName,
      communicationPersonEmail: prefillEmail,
    };
    // Convert target pixel dimensions to % of screen resolution — the only
    // workaround for Office.js's % -only API (confirmed "by design", GitHub #4155).
    // This gives a near-fixed pixel size on a normal full-screen window.
    const TARGET_H_PX = 340;
    const TARGET_W_PX = 420;
    const screenH = window.screen?.availHeight || 900;
    const screenW = window.screen?.availWidth  || 1440;
    const commConfigHeight = Math.min(75, Math.max(28, Math.round((TARGET_H_PX / (screenH * 0.93)) * 100) + 4));
    const commConfigWidth  = Math.min(80, Math.max(22, Math.round((TARGET_W_PX / (screenW * 0.95)) * 100)));

    _trackDialogAsync(
      `${DIALOG_BASE}/dialog.html?view=communication-config`,
      { height: commConfigHeight, width: commConfigWidth, displayInIframe: true },
      (result) => {
        if (result.status === Office.AsyncResultStatus.Failed) {
          if ((result.error as { code: number }).code === 12007 && attempt < 15) {
            setTimeout(() => openCommunicationConfigDialog(event, attempt + 1), 300);
            return;
          }
          handleDialogOpenError(result.error, event);
          return;
        }
        const dialog = result.value;
        const complete = makeEventCompleter(event);
        dialog.addEventHandler(Office.EventType.DialogEventReceived, () => {
          complete();
        });
        dialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
          const m = JSON.parse((msg as { message: string }).message) as DialogAction;
          switch (m.action) {
            case "READY":
              dialog.messageChild(JSON.stringify({ type: "INIT", payload: initPayload } as HostMessage));
              break;
            case "SAVE_COMMUNICATION_CONFIG":
              try {
                saveCommunicationConfig(m.payload as SaveCommunicationConfigPayload);
                try { dialog.close(); } catch { }
                complete();
              } catch (err) { replyError(dialog, `Failed to save configuration: ${String(err)}`); }
              break;
            case "CLOSE":
              try { dialog.close(); } catch { }
              complete();
              break;
            default:
              break;
          }
        });
      }
    );
  }).catch((err: unknown) => {
    showNoSelectionMessage("Database Error", String(err), event);
  });
}

// ─── Speak Logic Settings: People & Keywords ──────────────────────────────────
function openKeywordSettingsDialog(event: Office.AddinCommands.Event, attempt = 0): void {
  ensureDb().then(() => {
    const initPayload: DialogInitPayload = {
      selection: "",
      mode: "selection",
      source: getSource(),
      personName: "",
      personEmail: "",
      applicationName: "",
      communicationFunction: "",
      communicationSignal: "",
      projectName: "",
      peopleList: getPeopleNames(),
      peopleEmailMap: getPeopleEmailMap(),
      contacts: getAllPeople(),
      keywordRules: getKeywordRules(),
      keywordSendMode: getKeywordSetting().sendMode,
    };

    const TARGET_H_PX = 560;
    const TARGET_W_PX = 460;
    const screenH = window.screen?.availHeight || 900;
    const screenW = window.screen?.availWidth || 1440;
    const h = Math.min(85, Math.max(40, Math.round((TARGET_H_PX / (screenH * 0.93)) * 100) + 4));
    const w = Math.min(85, Math.max(24, Math.round((TARGET_W_PX / (screenW * 0.95)) * 100)));

    _trackDialogAsync(
      `${DIALOG_BASE}/dialog.html?view=keyword-settings`,
      { height: h, width: w, displayInIframe: true },
      (result) => {
        if (result.status === Office.AsyncResultStatus.Failed) {
          if ((result.error as { code: number }).code === 12007 && attempt < 15) {
            setTimeout(() => openKeywordSettingsDialog(event, attempt + 1), 300);
            return;
          }
          handleDialogOpenError(result.error, event);
          return;
        }
        const dialog = result.value;
        const complete = makeEventCompleter(event);
        dialog.addEventHandler(Office.EventType.DialogEventReceived, () => complete());
        dialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
          const m = JSON.parse((msg as { message: string }).message) as DialogAction;
          switch (m.action) {
            case "READY":
              dialog.messageChild(JSON.stringify({ type: "INIT", payload: initPayload } as HostMessage));
              break;
            case "SAVE_KEYWORD_RULES":
              try {
                const p = m.payload as SaveKeywordRulesPayload;
                saveKeywordRules(p.rules, p.sendMode);
                try { dialog.close(); } catch { /* already closed */ }
                complete();
              } catch (err) { replyError(dialog, `Failed to save keyword settings: ${String(err)}`); }
              break;
            case "CLOSE":
              try { dialog.close(); } catch { /* already closed */ }
              complete();
              break;
            default:
              break;
          }
        });
      }
    );
  }).catch((err: unknown) => {
    showNoSelectionMessage("Database Error", String(err), event);
  });
}

// ─── Outlook Smart Alerts: block/warn on banned words before send ─────────────
type SmartAlertsEvent = Office.AddinCommands.Event & {
  completed: (options?: { allowEvent?: boolean; errorMessage?: string; sendModeOverride?: string }) => void;
};

function getRecipientsAsync(): Promise<Array<{ name?: string; email?: string }>> {
  return new Promise((resolve) => {
    try {
      const item = Office.context.mailbox.item as Office.MessageCompose;
      const out: Array<{ name?: string; email?: string }> = [];
      let pending = 0;
      let done = false;
      const finish = () => { if (done) return; done = true; resolve(out); };
      const collect = (field?: { getAsync: (cb: (r: Office.AsyncResult<Office.EmailAddressDetails[]>) => void) => void }) => {
        if (!field) return;
        pending++;
        field.getAsync((r) => {
          if (r.status === Office.AsyncResultStatus.Succeeded && r.value) {
            for (const a of r.value) out.push({ name: a.displayName, email: a.emailAddress });
          }
          if (--pending === 0) finish();
        });
      };
      collect(item.to);
      collect(item.cc);
      if (pending === 0) finish();
      setTimeout(finish, 4000); // safety: never hang the send
    } catch {
      resolve([]);
    }
  });
}

function getBodyTextAsync(): Promise<string> {
  return new Promise((resolve) => {
    try {
      Office.context.mailbox.item.body.getAsync(Office.CoercionType.Text, (r) => {
        resolve(r.status === Office.AsyncResultStatus.Succeeded ? String(r.value ?? "") : "");
      });
    } catch {
      resolve("");
    }
  });
}

async function onMessageSendHandler(event: Office.AddinCommands.Event): Promise<void> {
  const ev = event as SmartAlertsEvent;
  try {
    await ensureDb();
    if (getKeywordRules().length === 0) { ev.completed({ allowEvent: true }); return; }

    const [recipients, body] = await Promise.all([getRecipientsAsync(), getBodyTextAsync()]);
    const subject = (() => {
      try { return String((Office.context.mailbox.item as Office.MessageCompose).subject as unknown as string) || ""; }
      catch { return ""; }
    })();
    const hits = findBannedWords(recipients, `${subject}\n${body}`);

    if (hits.length === 0) { ev.completed({ allowEvent: true }); return; }

    const mode = getKeywordSetting().sendMode;
    const wordList = hits.join(", ");
    if (mode === "stop") {
      // Manifest SendMode is SoftBlock → no "Send Anyway"; user must remove the words.
      ev.completed({
        allowEvent: false,
        errorMessage: `Forbidden word found: ${wordList}. Remove it before sending.`,
      });
    } else {
      // warn: relax the SoftBlock default to PromptUser so a "Send Anyway" button appears.
      // sendModeOverride only supports PromptUser (Mailbox 1.14+); harmless if unsupported.
      const promptUser =
        (Office.MailboxEnums as unknown as { SendModeOverride?: { PromptUser?: string } })?.SendModeOverride?.PromptUser ??
        "promptUser";
      ev.completed({
        allowEvent: false,
        sendModeOverride: promptUser,
        errorMessage: `Flagged word found: ${wordList}. Send anyway?`,
      });
    }
  } catch {
    // Never block the user on our own failure.
    ev.completed({ allowEvent: true });
  }
}

function openPeopleDialog(event: Office.AddinCommands.Event): void {
  ensureDb().then(() => {
    const buildPayload = () => {
      const commConfig = getCommunicationConfig();
      return {
        selection: "",
        mode: "selection" as const,
        source: getSource(),
        personName: "",
        personEmail: "",
        applicationName: "",
        communicationFunction: "",
        communicationSignal: "",
        projectName: "",
        peopleList: [],
        communicationPersonName: commConfig?.personName ?? "",
        communicationPersonEmail: commConfig?.personEmail ?? "",
        contacts: getAllPeople(),
      };
    };

    const TARGET_H_PX = 520;
    const TARGET_W_PX = 460;
    const screenH = window.screen?.availHeight || 900;
    const screenW = window.screen?.availWidth || 1440;
    const h = Math.min(80, Math.max(30, Math.round((TARGET_H_PX / (screenH * 0.93)) * 100) + 4));
    const w = Math.min(80, Math.max(22, Math.round((TARGET_W_PX / (screenW * 0.95)) * 100)));

    _trackDialogAsync(
      `${DIALOG_BASE}/dialog.html?view=people`,
      { height: h, width: w, displayInIframe: true },
      (result) => {
        if (result.status === Office.AsyncResultStatus.Failed) {
          handleDialogOpenError(result.error, event);
          return;
        }
        const dialog = result.value;
        const complete = makeEventCompleter(event);
        let handingOffToCommConfig = false;
        dialog.addEventHandler(Office.EventType.DialogEventReceived, () => { if (!handingOffToCommConfig) complete(); });
        dialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
          const m = JSON.parse((msg as { message: string }).message) as { action: string; id?: number; personName?: string; emailAddress?: string };
          const sendInit = () => dialog.messageChild(JSON.stringify({ type: "INIT", payload: buildPayload() }));
          switch (m.action) {
            case "READY":
              sendInit();
              break;
            case "ADD_CONTACT":
              try {
                addPersonContact(m.personName ?? "", m.emailAddress ?? "");
                sendInit();
              } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                replyError(dialog, message);
              }
              break;
            case "UPDATE_CONTACT":
              try {
                updatePersonById(m.id ?? 0, m.personName ?? "", m.emailAddress ?? "");
                sendInit();
              } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                replyError(dialog, message);
              }
              break;
            case "DELETE_CONTACT":
              try {
                deletePersonById(m.id ?? 0);
                sendInit();
              } catch (err) { replyError(dialog, `Failed to delete contact: ${String(err)}`); }
              break;
            case "OPEN_COMM_CONFIG":
              handingOffToCommConfig = true;
              try { dialog.close(); } catch { }
              openCommunicationConfigDialog(event);
              break;
            case "CLOSE":
              try { dialog.close(); } catch { }
              complete();
              break;
            default:
              break;
          }
        });
      }
    );
  }).catch((err: unknown) => {
    showNoSelectionMessage("Database Error", String(err), event);
  });
}
