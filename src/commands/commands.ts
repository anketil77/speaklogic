// src/commands/commands.ts

/* global Office Word */

const DIALOG_BASE = window.location.origin;

import { initDb, nowDate } from "@/db/db";
import { saveFullAnalysis, getAllAnalyses, getAnalysisById, getRetainedAnalyses, deleteAnalysis, getErrorsByAnalysis, getQuestionsByAnalysis, getCompensatorsByAnalysis, getAnswersByAnalysis, getFilesByAnalysis, getProblemsByAnalysis } from "@/db/queries/analysis";
import { saveFeedback, saveFeedbackHistory, saveCommSignalInfo, getAllFeedbacks, deleteFeedback, getCommSignalRequests, deleteCommSignalRequest } from "@/db/queries/feedback";
import { saveFlag, getAllFlaggedSelections, deleteFlag, getAllSelectionHistories, deleteSelectionHistory } from "@/db/queries/flag";
import { getAllInterpretations, deleteInterpretation, getFilesByPrincipleInterpretation, addAttachedFile, removeAttachedFile, saveSelectionWithPrinciple, savePrincipleInSelection, getPrinciplesInSelection, getSelectionsWithPrinciple, deletePrincipleInSelection, deleteSelectionWithPrinciple, getFilesByPrincipleInSelection, getFilesBySelectionWithPrinciple, saveInterpretation } from "@/db/queries/principle";
import { getPeopleNames, getPeopleEmailMap, upsertPersonName, upsertPersonWithEmail } from "@/db/queries/people";
import { getCommunicationConfig, saveCommunicationConfig } from "@/db/queries/communication";
import { saveArticle, saveArticleWizard, getAllArticles, deleteArticle } from "@/db/queries/article";
import { saveProblemSolution } from "@/db/queries/problem";
import { dbg, clearLog } from "@/debug/log";
import { openInterpretedPrincipleReport, openIdentifiedPrincipleReport, openRelatedPrincipleReport } from "@/dialog/utils/reportGenerator";

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
  SaveFeedbackPayload,
  SaveRelatedSelectionPayload,
  SavePrincipleInSelectionPayload,
  SaveInterpretationPayload,
  SaveRequestFeedbackPayload,
  SaveRequestSLFeedbackPayload,
  SelectionMode,
} from "@/types/db";

const DIALOG_SIZE = { height: 69, width: 43 } as const;
// Flag dialog: 480×479.59px → 58% height, 25% width ≈ 480px on 1920px screens
const FLAG_DIALOG_SIZE = { height: 58, width: 25 } as const;
// Selection Config dialog: 480×428px → 52% height, 25% width (same ref as FLAG_DIALOG_SIZE)
const SELECTION_CONFIG_DIALOG_SIZE = { height: 52, width: 25 } as const;
// About dialog: 604×292px → 27% height, 32% width on 1920×1080
const ABOUT_DIALOG_SIZE = { height: 27, width: 32 } as const;
// Create Article dialog: 520×508px → 61% height, 27% width (height % is of Word viewport ~827px, not raw 1080)
// Picker (260×163px on 1920×1080): width=14%, height≈20% of Word viewport (~827px)
const CREATE_ARTICLE_PICKER_SIZE        = { height: 20, width: 14 } as const;
const CREATE_ARTICLE_TEMPLATE_SIZE      = { height: 56, width: 27 } as const; // ~605×520px — fits 460×516 card
const CREATE_ARTICLE_DIALOG_SIZE        = { height: 61, width: 27 } as const;
const ARTICLE_WIZARD_SIZE               = { height: 53, width: 27 } as const; // ~572px @ 1080p — all steps fit cleanly

let dbInitialized = false;

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
  Office.actions.associate("createArticle", (event) =>
    void openCreateArticleDialog(event)
  );
  Office.actions.associate("listArticles", (event) =>
    void openListArticlesDialog(event)
  );
}

// Handles displayDialogAsync failure codes that need explicit treatment.
// 12007: a dialog is already open from this host window — user can interact with the existing one.
// 12009: user blocked the dialog on Office on the web — no task pane to show alternate feedback.
// 12011: browser pop-up config blocks the dialog (Safari, Edge Legacy) — same limitation.
// All other codes: unexpected platform/network error — still must complete the event.
function handleDialogOpenError(
  _error: { code: number; message: string },
  event: Office.AddinCommands.Event
): void {
  event.completed();
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

function showNoSelectionMessage(
  title: string,
  text: string,
  event: Office.AddinCommands.Event
): void {
  const heightPct = estimateMessageDialogPct(text);
  Office.context.ui.displayDialogAsync(
    `${DIALOG_BASE}/dialog.html?view=message&title=${encodeURIComponent(title)}&text=${encodeURIComponent(text)}`,
    { height: heightPct, width: 26, displayInIframe: true },
    (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) {
        handleDialogOpenError(result.error, event);
        return;
      }
      const dialog = result.value;
      dialog.addEventHandler(Office.EventType.DialogMessageReceived, (args) => {
        if (!("message" in args)) return;
        const msg = JSON.parse((args as { message: string }).message) as { action: string };
        if (msg.action === "CLOSE") {
          dialog.close();
          event.completed();
        }
      });
      dialog.addEventHandler(Office.EventType.DialogEventReceived, (evt) => {
        // 12006 = user closed via X; 12002/12003 = nav errors — all paths must complete the event.
        void (evt as { error: number }).error;
        event.completed();
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
      return { personName: p.displayName ?? "", personEmail: p.emailAddress ?? "" };
    }
    const p = (Office.context as { userProfile?: { displayName?: string; email?: string } })
      .userProfile;
    return { personName: p?.displayName ?? "", personEmail: p?.email ?? "" };
  } catch {
    return { personName: "", personEmail: "" };
  }
}

async function getPowerPointText(_mode: SelectionMode): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    Office.context.document.getSelectedDataAsync(
      Office.CoercionType.Text,
      (result) => {
        if (result.status === Office.AsyncResultStatus.Failed) {
          reject(new Error(result.error?.message ?? "Failed to get selection"));
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

async function getHostTextAndMeta(mode: SelectionMode): Promise<{ text: string; documentTitle: string; documentName: string; pageNumber: string }> {
  if (Office.context.host === Office.HostType.Outlook) return { ...await getOutlookTextAndMeta(mode), pageNumber: "" };
  if (Office.context.host === Office.HostType.PowerPoint) return { ...await getPowerPointTextAndMeta(mode), pageNumber: "" };
  return getWordTextAndMeta(mode);
}

async function getWordTextAndMeta(mode: SelectionMode): Promise<{ text: string; documentTitle: string; documentName: string; pageNumber: string }> {
  return Word.run(async (context) => {
    let text = "";
    let textRange: Word.Range;
    if (mode === "selection") {
      const sel = context.document.getSelection();
      sel.load("text");
      await context.sync();
      text = sel.text.trim();
      textRange = sel;
    } else {
      const sel = context.document.getSelection();
      const para = sel.paragraphs.getFirst();
      para.load("text");
      await context.sync();
      text = para.text.trim();
      textRange = para.getRange();
    }
    const props = context.document.properties;
    props.load("title");
    await context.sync();
    const url = (Office.context.document as { url?: string }).url ?? "";
    const documentName = url ? (url.split("/").pop()?.split("\\").pop() ?? "") : "";

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

    return { text, documentTitle: props.title ?? "", documentName, pageNumber };
  });
}

function buildEntityName(documentTitle: string, documentName: string, pageNumber = ""): string {
  try {
    const raw = localStorage.getItem("sl-selection-config");
    const cfg = raw ? JSON.parse(raw) : {};
    const useName = cfg.titleAsApplicationName    !== false;
    const useFile = cfg.showFileNameInApplication !== false;
    const usePage = cfg.showPageNumberInFileName  !== false;
    let result = "";
    if (useName && documentTitle) result = documentTitle;
    if (useFile && documentName)  result = result ? result + "  File: " + documentName : "File: " + documentName;
    if (usePage && pageNumber)    result = result ? result + "  Page: " + pageNumber : "Page: " + pageNumber;
    return result;
  } catch {
    return "";
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
  const bodyText = payload.feedback.feedbackApplication.replace(/<[^>]*>/g, "").slice(0, 1800);
  const body = encodeURIComponent(bodyText);
  return `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
}

async function openAnalyzeDialog(
  mode: SelectionMode,
  event: Office.AddinCommands.Event
): Promise<void> {
  dbg("HOST", "openAnalyzeDialog start", { mode });
  try { await ensureDb(); } catch (err) { showNoSelectionMessage("Database Error", String(err), event); return; }
  let selection = "";
  let documentTitle = "";
  let documentName = "";
  let pageNumber = "";
  try {
    ({ text: selection, documentTitle, documentName, pageNumber } = await getHostTextAndMeta(mode));
  } catch (err) {
    dbg("HOST", "getWordText threw — completing event", String(err));
    event.completed();
    return;
  }
  if (!selection) {
    dbg("HOST", "empty selection — showing message dialog");
    const title =
      mode === "selection" ? "Text Selection Message" : "Paragraph Selection Message";
    const text =
      "In order to analyze an entity, that entity must exist.  In order " +
      "to perform an analysis to an entity, that entity must be identified. " +
      "It is not possible to analyze an entity if that entity is not identified " +
      "or cannot be identified.  Here I will need to specify the entity that " +
      "I need to analyze.  In this case, I will to select the actual text or put " +
      "the cursor or point the mouse to the text that needs to be analyzed.";
    showNoSelectionMessage(title, text, event);
    return;
  }

  dbg("HOST", "selection obtained, building initPayload", { selectionLength: selection.length });
  const { personName, personEmail } = getUserIdentity();
  const commConfig = getCommunicationConfig();
  const initPayload: DialogInitPayload = {
    selection,
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

  const params = new URLSearchParams({ view: "analyze", mode });
  dbg("HOST", "calling displayDialogAsync for analyze");
  Office.context.ui.displayDialogAsync(
    `${DIALOG_BASE}/dialog.html?${params.toString()}`,
    { ...DIALOG_SIZE, displayInIframe: true },
    (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) {
        dbg("HOST", "displayDialogAsync FAILED (analyze)", { code: (result.error as { code: number }).code, message: result.error.message });
        handleDialogOpenError(result.error, event);
        return;
      }
      dbg("HOST", "analyze dialog opened successfully");
      const dialog = result.value;

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
              dbg("HOST", "saveFullAnalysis THREW — closing dialog", String(err));
              dialog.close();
              event.completed();
              break;
            }
            if (payload.analysis.whatToDoWithAnalysis === "ApplyAnalysisAsFeedback") {
              const { personName, personEmail } = getUserIdentity();
              const applyAnalyses = getAllAnalyses().map((a) => {
                if (!a.id) return a;
                return { ...a, questions: getQuestionsByAnalysis(a.id), errors: getErrorsByAnalysis(a.id), compensators: getCompensatorsByAnalysis(a.id), answers: getAnswersByAnalysis(a.id), files: getFilesByAnalysis(a.id) };
              });
              const applyFeedbacks = getAllFeedbacks().map((f) => {
                if (!f.analysisId) return f;
                return { ...f, questions: getQuestionsByAnalysis(f.analysisId), compensators: getCompensatorsByAnalysis(f.analysisId), answers: getAnswersByAnalysis(f.analysisId), files: getFilesByAnalysis(f.analysisId) };
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
                peopleEmailMap: getPeopleEmailMap(),
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
              saveFeedbackHistory({
                selectionAction: "Retain as Needed",
                entityName: payload.analysis.entityUnderAnalysis,
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
            if (fbPayload.feedback.feedbackType === "Provided") {
              const f = fbPayload.feedback;
              saveFeedbackHistory({
                selectionAction: "Provided as Feedback",
                entityName: f.internalFeedbackName || `Text selected from ${f.source} on ${f.feedbackDate}`,
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
            }
            // For "Provided" feedback: send SAVED with a mailto URL back to the dialog
            // so the user can open it via a user-initiated click (window.open from dialog
            // context opens a new browser tab in Office Online instead of the OS handler).
            if (fbPayload.feedback.feedbackType === "Provided") {
              const mailtoUrl = buildMailtoUrl(fbPayload);
              const opened = mailtoUrl ? openMailtoUrl(mailtoUrl) : false;
              dbg("HOST", "sending SAVED to dialog", { hasMailto: !!mailtoUrl, opened });
              // If host opened the compose window, send empty URL (hide link in dialog).
              // If not (compose mode / failed), send the URL so the user can click natively.
              dialog.messageChild(JSON.stringify({ type: "SAVED", mailtoUrl: opened ? "" : mailtoUrl } as HostMessage));
              // Do NOT close here — wait for the dialog to send CLOSE after the user clicks.
            } else {
              dialog.close();
              event.completed();
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
            }
            break;
          }
          case "CLOSE":
            dbg("HOST", "CLOSE received — closing dialog, completing event");
            dialog.close();
            event.completed();
            break;
          default:
            dbg("HOST", "unknown action received", { action: (m as { action: string }).action });
            break;
        }
      });

      dialog.addEventHandler(Office.EventType.DialogEventReceived, (evt) => {
        const code = (evt as { error?: number }).error;
        dbg("HOST", "DialogEventReceived (dialog closed by user or error)", { code });
        event.completed();
      });
    }
  );
}

async function openRequestFeedbackFromRibbon(event: Office.AddinCommands.Event): Promise<void> {
  try { await ensureDb(); } catch (err) { showNoSelectionMessage("Database Error", String(err), event); return; }
  let selection = "";
  let documentTitle = "";
  let documentName = "";
  let pageNumber = "";
  try {
    ({ text: selection, documentTitle, documentName, pageNumber } = await getHostTextAndMeta("paragraph"));
  } catch {
    event.completed();
    return;
  }
  if (!selection) {
    showNoSelectionMessage(
      "Paragraph Selection Message",
      "In order to request feedback, the entity must exist. Place the cursor in the paragraph you want to request feedback on, then click the button again.",
      event
    );
    return;
  }
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
    peopleEmailMap: getPeopleEmailMap(),
    communicationPersonName: commConfig?.personName ?? "",
    communicationPersonEmail: commConfig?.personEmail ?? "",
  }, event);
}

function openRequestFeedbackDialog(initPayload: DialogInitPayload, addInEvent: Office.AddinCommands.Event, attempt = 0): void {
  Office.context.ui.displayDialogAsync(
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
      dialog.addEventHandler(Office.EventType.DialogEventReceived, (evt) => {
        void (evt as { error: number }).error;
        addInEvent.completed();
      });
      dialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
        const m = JSON.parse((msg as { message: string }).message) as DialogAction;
        switch (m.action) {
          case "READY":
            dialog.messageChild(JSON.stringify({ type: "INIT", payload: initPayload } as HostMessage));
            break;
          case "SAVE_REQUEST_FEEDBACK": {
            const p = m.payload as SaveRequestFeedbackPayload;
            const entityName = `Text selected from ${p.selectionType} on ${nowDate()}`;
            try {
              saveCommSignalInfo({ ...p, entitySelected: entityName });
              saveFeedbackHistory({
                selectionAction: "Requested Feedback With",
                entityName,
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
            const mailtoUrl = buildRequestMailtoUrl(p);
            const opened = mailtoUrl ? openMailtoUrl(mailtoUrl) : false;
            dialog.messageChild(JSON.stringify({ type: "SAVED", mailtoUrl: opened ? "" : mailtoUrl } as HostMessage));
            break;
          }
          case "OPEN_MAILTO":
            openMailtoUrl((m as { action: string; url: string }).url);
            dialog.close();
            addInEvent.completed();
            break;
          case "CLOSE":
            dialog.close();
            addInEvent.completed();
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
  Office.context.ui.displayDialogAsync(
    `${DIALOG_BASE}/dialog.html?${params.toString()}`,
    { ...DIALOG_SIZE, displayInIframe: true },
    (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) {
        handleDialogOpenError(result.error, event);
        return;
      }
      const dialog = result.value;
      dialog.addEventHandler(Office.EventType.DialogEventReceived, (evt) => {
        void (evt as { error: number }).error;
        event.completed();
      });
      dialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
        const m = JSON.parse((msg as { message: string }).message) as DialogAction;
        if (m.action === "READY") {
          const hostMsg: HostMessage = { type: "INIT", payload: initPayload };
          dialog.messageChild(JSON.stringify(hostMsg));
        }
        if (m.action === "CLOSE") {
          dialog.close();
          event.completed();
        }
      });
    }
  );
}

function openAboutDialog(addInEvent: Office.AddinCommands.Event, attempt = 0): void {
  Office.context.ui.displayDialogAsync(
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
      dialog.addEventHandler(Office.EventType.DialogEventReceived, () => {
        addInEvent.completed();
      });
      dialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
        const m = JSON.parse((msg as { message: string }).message) as { action: string };
        if (m.action === "CLOSE") {
          dialog.close();
          addInEvent.completed();
        }
      });
    }
  );
}

function openAnalysisHistoryDialog(event: Office.AddinCommands.Event, attempt = 0): void {
  Office.context.ui.displayDialogAsync(
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
      dialog.addEventHandler(Office.EventType.DialogEventReceived, () => {
        event.completed();
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
          dialog.close();
          event.completed();
        }
        if (m.action === "NAVIGATE_TO_APPLY") {
          const navM = m as { action: string; analysisId: number };
          const analysis = getAnalysisById(navM.analysisId);
          if (!analysis) return;
          const { personName, personEmail } = getUserIdentity();
          const allAnalyses = getAllAnalyses().map((a) => {
            if (!a.id) return a;
            return { ...a, questions: getQuestionsByAnalysis(a.id), errors: getErrorsByAnalysis(a.id), compensators: getCompensatorsByAnalysis(a.id), answers: getAnswersByAnalysis(a.id), files: getFilesByAnalysis(a.id) };
          });
          const allFeedbacks = getAllFeedbacks().map((f) => {
            if (!f.analysisId) return f;
            return { ...f, questions: getQuestionsByAnalysis(f.analysisId), compensators: getCompensatorsByAnalysis(f.analysisId), answers: getAnswersByAnalysis(f.analysisId), files: getFilesByAnalysis(f.analysisId) };
          });
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
          if (!analysis) return;
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
            peopleEmailMap: getPeopleEmailMap(),
            communicationPersonName: commConfig?.personName ?? "",
            communicationPersonEmail: commConfig?.personEmail ?? "",
          };
          const navMsg: HostMessage = { type: "NAVIGATE", view: "provide-feedback", payload: providePayload };
          dialog.messageChild(JSON.stringify(navMsg));
        }
      });
    }
  );
}

function openFeedbackHistoryDialog(event: Office.AddinCommands.Event, attempt = 0): void {
  Office.context.ui.displayDialogAsync(
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
      dialog.addEventHandler(Office.EventType.DialogEventReceived, () => {
        event.completed();
      });
      dialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
        const m = JSON.parse((msg as { message: string }).message) as DialogAction;
        if (m.action === "READY") {
          const { personName, personEmail } = getUserIdentity();
          const feedbacks = getAllFeedbacks().map((f) => {
            if (!f.analysisId) return f;
            return {
              ...f,
              questions: getQuestionsByAnalysis(f.analysisId),
              compensators: getCompensatorsByAnalysis(f.analysisId),
              answers: getAnswersByAnalysis(f.analysisId),
              files: getFilesByAnalysis(f.analysisId),
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
          deleteFeedback((m as { action: string; id: number }).id);
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
            if (!f.analysisId) return f;
            return {
              ...f,
              questions: getQuestionsByAnalysis(f.analysisId),
              compensators: getCompensatorsByAnalysis(f.analysisId),
              answers: getAnswersByAnalysis(f.analysisId),
              files: getFilesByAnalysis(f.analysisId),
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
          try {
            deleteCommSignalRequest((m as { action: string; id: number }).id);
          } catch (err) {
            dbg("commands", "DELETE_COMM_SIGNAL_REQUEST failed", String(err));
          }
        }
        if (m.action === "CLOSE") {
          dialog.close();
          event.completed();
        }
      });
    }
  );
}

function openRetainedHistoryDialog(event: Office.AddinCommands.Event, attempt = 0): void {
  Office.context.ui.displayDialogAsync(
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
      dialog.addEventHandler(Office.EventType.DialogEventReceived, () => {
        event.completed();
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
          deleteAnalysis((m as { action: string; id: number }).id);
        }
        if (m.action === "CLOSE") {
          dialog.close();
          event.completed();
        }
      });
    }
  );
}

function openFlaggedHistoryDialog(event: Office.AddinCommands.Event, attempt = 0): void {
  Office.context.ui.displayDialogAsync(
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
      dialog.addEventHandler(Office.EventType.DialogEventReceived, () => {
        event.completed();
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
          deleteFlag((m as { action: string; id: number }).id);
        }
        if (m.action === "DELETE_INTERPRETED_PRINCIPLE") {
          deleteInterpretation((m as { action: string; id: number }).id);
          sendInit();
        }
        if (m.action === "DELETE_PRINCIPLE") {
          deletePrincipleInSelection((m as { action: string; id: number }).id);
          sendInit();
        }
        if (m.action === "DELETE_RELATED_SELECTION") {
          deleteSelectionWithPrinciple((m as { action: string; id: number }).id);
          sendInit();
        }
        if (m.action === "REPORT_INTERPRETED_PRINCIPLE") {
          const { interpretation } = m as { action: string; interpretation: import("@/types/db").PrincipleInterpretation };
          openInterpretedPrincipleReport(interpretation);
        }
        if (m.action === "REPORT_IDENTIFIED_PRINCIPLE") {
          const { principle } = m as { action: string; principle: import("@/types/db").PrincipleInSelection };
          openIdentifiedPrincipleReport(principle);
        }
        if (m.action === "REPORT_RELATED_SELECTION") {
          const { relation } = m as { action: string; relation: import("@/types/db").SelectionWithPrinciple };
          openRelatedPrincipleReport(relation);
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
          const { payload } = m as { action: string; payload: SaveRelatedSelectionPayload };
          const newId = saveSelectionWithPrinciple(payload.record);
          for (const file of payload.files) {
            addAttachedFile({ ...file, selectionWithPrincipleId: newId });
          }
          sendInit();
        }
        if (m.action === "SAVE_PRINCIPLE_IN_SELECTION") {
          const { payload } = m as { action: string; payload: SavePrincipleInSelectionPayload };
          const newId = savePrincipleInSelection(payload.record);
          for (const file of payload.files) {
            addAttachedFile({ ...file, principleInSelectionId: newId });
          }
          sendInit();
        }
        if (m.action === "SAVE_INTERPRETATION") {
          const { payload } = m as { action: string; payload: SaveInterpretationPayload };
          const newId = saveInterpretation(payload.record);
          for (const file of payload.files) {
            addAttachedFile({ ...file, principleInterpretationId: newId });
          }
          sendInit();
        }
        if (m.action === "CLOSE") {
          dialog.close();
          event.completed();
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
  Office.context.ui.displayDialogAsync(
    `${DIALOG_BASE}/dialog.html?view=create-article-picker`,
    { ...CREATE_ARTICLE_PICKER_SIZE, displayInIframe: true },
    (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) {
        handleDialogOpenError(result.error, event);
        return;
      }
      const pickerDialog = result.value;

      pickerDialog.addEventHandler(Office.EventType.DialogEventReceived, () => {
        // User closed the picker via the native OS X
        event.completed();
      });

      pickerDialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
        const m = JSON.parse((msg as { message: string }).message) as DialogAction;

        if (m.action === "BLANK_SELECTED") {
          // Blank — go straight to the article form
          pickerDialog.close();
          openArticleFormDialog(event, personName, personEmail);

        } else if (m.action === "TEMPLATE_SELECTED") {
          // Use Template — close picker, open the template picker step
          pickerDialog.close();
          openTemplatePickerDialog(event, personName, personEmail);

        } else if (m.action === "CLOSE") {
          pickerDialog.close();
          event.completed();
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
  Office.context.ui.displayDialogAsync(
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

      tplDialog.addEventHandler(Office.EventType.DialogEventReceived, () => {
        event.completed();
      });

      tplDialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
        const m = JSON.parse((msg as { message: string }).message) as DialogAction;

        switch (m.action) {
          case "TEMPLATE_CONFIRMED":
            // User picked a template — close picker, open article wizard
            tplDialog.close();
            openArticleWizardDialog(event, personName, personEmail, m.templateName, m.category);
            break;

          case "BACK":
            // Go back to entry picker (close template picker, reopen entry picker)
            tplDialog.close();
            openCreateArticleDialog(event);
            break;

          case "CLOSE":
            tplDialog.close();
            event.completed();
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
  };

  Office.context.ui.displayDialogAsync(
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

      wzDialog.addEventHandler(Office.EventType.DialogEventReceived, () => {
        event.completed();
      });

      wzDialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
        const m = JSON.parse((msg as { message: string }).message) as DialogAction;

        switch (m.action) {
          case "READY":
            wzDialog.messageChild(JSON.stringify({ type: "INIT", payload: initPayload } as HostMessage));
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
            wzDialog.close();
            openTemplatePickerDialog(event, personName, personEmail);
            break;

          case "CLOSE":
            wzDialog.close();
            event.completed();
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
  Office.context.ui.displayDialogAsync(
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
      dialog.addEventHandler(Office.EventType.DialogEventReceived, () => {
        event.completed();
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
              saveArticle({ ...p, personName, personEmail, source: getSource() });
            } catch (err) {
              dialog.messageChild(JSON.stringify({ type: "ERROR", message: String(err) } as HostMessage));
              break;
            }
            dialog.close();
            event.completed();
            break;
          }
          case "CLOSE":
            dialog.close();
            event.completed();
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
  };

  Office.context.ui.displayDialogAsync(
    `${DIALOG_BASE}/dialog.html?view=list-articles`,
    { ...DIALOG_SIZE, displayInIframe: true },
    (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) {
        handleDialogOpenError(result.error, event);
        return;
      }
      const dialog = result.value;
      dialog.addEventHandler(Office.EventType.DialogEventReceived, () => {
        event.completed();
      });
      dialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
        const m = JSON.parse((msg as { message: string }).message) as DialogAction;
        switch (m.action) {
          case "READY":
            dialog.messageChild(JSON.stringify({ type: "INIT", payload: initPayload } as HostMessage));
            break;
          case "DELETE_ARTICLE": {
            try {
              deleteArticle((m as { action: string; id: number }).id);
            } catch (err) {
              dbg("commands", "DELETE_ARTICLE failed", String(err));
            }
            break;
          }
          case "CLOSE":
            dialog.close();
            event.completed();
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
    selectionHistories: getAllSelectionHistories(),
  };

  Office.context.ui.displayDialogAsync(
    `${DIALOG_BASE}/dialog.html?view=selection-history`,
    { ...DIALOG_SIZE, displayInIframe: true },
    (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) {
        handleDialogOpenError(result.error, event);
        return;
      }
      const dialog = result.value;
      dialog.addEventHandler(Office.EventType.DialogEventReceived, () => {
        event.completed();
      });
      dialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
        const m = JSON.parse((msg as { message: string }).message) as DialogAction;
        switch (m.action) {
          case "READY":
            dialog.messageChild(JSON.stringify({ type: "INIT", payload: initPayload } as HostMessage));
            break;
          case "DELETE_SELECTION_HISTORY": {
            try {
              deleteSelectionHistory((m as { action: string; id: number }).id);
            } catch (err) {
              dbg("commands", "DELETE_SELECTION_HISTORY failed", String(err));
            }
            break;
          }
          case "CLOSE":
            dialog.close();
            event.completed();
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

  Office.context.ui.displayDialogAsync(
    `${DIALOG_BASE}/dialog.html?view=list-identified-principle`,
    { ...DIALOG_SIZE, displayInIframe: true },
    (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) { handleDialogOpenError(result.error, event); return; }
      const dialog = result.value;
      dialog.addEventHandler(Office.EventType.DialogEventReceived, () => { event.completed(); });
      dialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
        const m = JSON.parse((msg as { message: string }).message) as DialogAction;
        if (m.action === "READY") {
          dialog.messageChild(JSON.stringify({ type: "INIT", payload: buildPayload() } as HostMessage));
        } else if (m.action === "DELETE_PRINCIPLE") {
          deletePrincipleInSelection((m as { action: string; id: number }).id);
          dialog.messageChild(JSON.stringify({ type: "INIT", payload: buildPayload() } as HostMessage));
        } else if (m.action === "REPORT_IDENTIFIED_PRINCIPLE") {
          const { principle } = m as { action: string; principle: import("@/types/db").PrincipleInSelection };
          openIdentifiedPrincipleReport(principle);
        } else if (m.action === "CLOSE") {
          dialog.close(); event.completed();
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

  Office.context.ui.displayDialogAsync(
    `${DIALOG_BASE}/dialog.html?view=list-interpreted-principle`,
    { ...DIALOG_SIZE, displayInIframe: true },
    (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) { handleDialogOpenError(result.error, event); return; }
      const dialog = result.value;
      dialog.addEventHandler(Office.EventType.DialogEventReceived, () => { event.completed(); });
      dialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
        const m = JSON.parse((msg as { message: string }).message) as DialogAction;
        if (m.action === "READY") {
          dialog.messageChild(JSON.stringify({ type: "INIT", payload: buildPayload() } as HostMessage));
        } else if (m.action === "DELETE_INTERPRETED_PRINCIPLE") {
          deleteInterpretation((m as { action: string; id: number }).id);
          dialog.messageChild(JSON.stringify({ type: "INIT", payload: buildPayload() } as HostMessage));
        } else if (m.action === "REPORT_INTERPRETED_PRINCIPLE") {
          const { interpretation } = m as { action: string; interpretation: import("@/types/db").PrincipleInterpretation };
          openInterpretedPrincipleReport(interpretation);
        } else if (m.action === "ADD_ATTACHED_FILE") {
          const { file } = m as { action: string; file: import("@/types/db").AttachFileToProject };
          const newId = addAttachedFile(file as Omit<import("@/types/db").AttachFileToProject, "id">);
          dialog.messageChild(JSON.stringify({ type: "FILE_ADDED", id: newId }));
        } else if (m.action === "REMOVE_ATTACHED_FILE") {
          removeAttachedFile((m as { action: string; id: number }).id);
        } else if (m.action === "CLOSE") {
          dialog.close(); event.completed();
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

  Office.context.ui.displayDialogAsync(
    `${DIALOG_BASE}/dialog.html?view=list-selection-related-principle`,
    { ...DIALOG_SIZE, displayInIframe: true },
    (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) { handleDialogOpenError(result.error, event); return; }
      const dialog = result.value;
      dialog.addEventHandler(Office.EventType.DialogEventReceived, () => { event.completed(); });
      dialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
        const m = JSON.parse((msg as { message: string }).message) as DialogAction;
        if (m.action === "READY") {
          dialog.messageChild(JSON.stringify({ type: "INIT", payload: buildPayload() } as HostMessage));
        } else if (m.action === "DELETE_RELATED_SELECTION") {
          deleteSelectionWithPrinciple((m as { action: string; id: number }).id);
          dialog.messageChild(JSON.stringify({ type: "INIT", payload: buildPayload() } as HostMessage));
        } else if (m.action === "REPORT_RELATED_SELECTION") {
          const { relation } = m as { action: string; relation: import("@/types/db").SelectionWithPrinciple };
          openRelatedPrincipleReport(relation);
        } else if (m.action === "CLOSE") {
          dialog.close(); event.completed();
        }
      });
    }
  );
}

function openProvideFeedbackDialog(initPayload: DialogInitPayload, addInEvent: Office.AddinCommands.Event, attempt = 0): void {
  Office.context.ui.displayDialogAsync(
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
      dialog.addEventHandler(Office.EventType.DialogEventReceived, (evt) => {
        void (evt as { error: number }).error;
        addInEvent.completed();
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
              entityName: f.internalFeedbackName || `Text selected from ${f.source} on ${f.feedbackDate}`,
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
            const mailtoUrl = buildMailtoUrl(fbPayload);
            const opened = mailtoUrl ? openMailtoUrl(mailtoUrl) : false;
            dialog.messageChild(JSON.stringify({ type: "SAVED", mailtoUrl: opened ? "" : mailtoUrl } as HostMessage));
            // Stay open — wait for CLOSE from the success screen.
            break;
          }
          case "OPEN_MAILTO":
            openMailtoUrl((m as { action: string; url: string }).url);
            dialog.close();
            addInEvent.completed();
            break;
          case "CLOSE":
            dialog.close();
            addInEvent.completed();
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
  let selection = "";
  let documentTitle = "";
  let documentName = "";
  let pageNumber = "";
  try {
    ({ text: selection, documentTitle, documentName, pageNumber } = await getHostTextAndMeta(mode));
  } catch {
    event.completed();
    return;
  }
  if (!selection) {
    const title = mode === "selection" ? "Text Selection Message" : "Paragraph Selection Message";
    const text =
      "In order to provide feedback, the entity must exist. " +
      "Select the text you want to provide feedback on, then click the button again.";
    showNoSelectionMessage(title, text, event);
    return;
  }
  const { personName, personEmail } = getUserIdentity();
  const commConfig = getCommunicationConfig();
  openProvideFeedbackDialog({
    selection,
    mode,
    source: getSource(),
    personName,
    personEmail,
    applicationName: buildEntityName(documentTitle, documentName, pageNumber),
    communicationFunction: "",
    communicationSignal: "",
    projectName: documentTitle,
    peopleList: buildPeopleList(commConfig?.personName),
    peopleEmailMap: getPeopleEmailMap(),
    communicationPersonName: commConfig?.personName ?? "",
    communicationPersonEmail: commConfig?.personEmail ?? "",
  }, event);
}

function openApplyDialog(initPayload: DialogInitPayload, addInEvent: Office.AddinCommands.Event, attempt = 0): void {
  Office.context.ui.displayDialogAsync(
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
      dialog.addEventHandler(Office.EventType.DialogEventReceived, (evt) => {
        void (evt as { error: number }).error;
        addInEvent.completed();
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
            dialog.close();
            addInEvent.completed();
            break;
          case "CLOSE":
            dialog.close();
            addInEvent.completed();
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
  let selection = "";
  let documentTitle = "";
  let documentName = "";
  let pageNumber = "";
  try {
    ({ text: selection, documentTitle, documentName, pageNumber } = await getHostTextAndMeta(mode));
  } catch {
    event.completed();
    return;
  }
  if (!selection) {
    const title = mode === "selection" ? "Text Selection Message" : "Paragraph Selection Message";
    const text =
      "In order to apply an entity as feedback, that entity must exist. " +
      "If an entity does not exist, then that entity cannot be applied as " +
      "feedback.  In order for me to apply a paragraph or a selected text " +
      "as feedback, I must I must select that paragraph by pointing to it " +
      "or select the portion of the text that I want to apply as feedback.";
    showNoSelectionMessage(title, text, event);
    return;
  }
  const { personName, personEmail } = getUserIdentity();
  const analyses = getAllAnalyses().map((a) => {
    if (!a.id) return a;
    return { ...a, questions: getQuestionsByAnalysis(a.id), errors: getErrorsByAnalysis(a.id), compensators: getCompensatorsByAnalysis(a.id), answers: getAnswersByAnalysis(a.id), files: getFilesByAnalysis(a.id) };
  });
  const feedbacks = getAllFeedbacks().map((f) => {
    if (!f.analysisId) return f;
    return { ...f, questions: getQuestionsByAnalysis(f.analysisId), compensators: getCompensatorsByAnalysis(f.analysisId), answers: getAnswersByAnalysis(f.analysisId), files: getFilesByAnalysis(f.analysisId) };
  });
  openApplyDialog({
    selection,
    mode,
    source: getSource(),
    personName,
    personEmail,
    applicationName: buildEntityName(documentTitle, documentName, pageNumber),
    communicationFunction: "",
    communicationSignal: "",
    projectName: documentTitle,
    peopleList: getPeopleNames(),
    analyses,
    feedbacks,
  }, event);
}

function openSelectionConfigDialog(addInEvent: Office.AddinCommands.Event): void {
  Office.context.ui.displayDialogAsync(
    `${DIALOG_BASE}/dialog.html?view=selection-config`,
    { ...SELECTION_CONFIG_DIALOG_SIZE, displayInIframe: true },
    (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) {
        handleDialogOpenError(result.error, addInEvent);
        return;
      }
      const dialog = result.value;
      dialog.addEventHandler(Office.EventType.DialogEventReceived, (evt) => {
        void (evt as { error: number }).error;
        addInEvent.completed();
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
            dialog.close();
            addInEvent.completed();
            break;
          default:
            break;
        }
      });
    }
  );
}

function openFlagDialog(initPayload: DialogInitPayload, addInEvent: Office.AddinCommands.Event): void {
  Office.context.ui.displayDialogAsync(
    `${DIALOG_BASE}/dialog.html?view=flag`,
    { ...FLAG_DIALOG_SIZE, displayInIframe: true },
    (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) {
        handleDialogOpenError(result.error, addInEvent);
        return;
      }
      const dialog = result.value;
      dialog.addEventHandler(Office.EventType.DialogEventReceived, (evt) => {
        void (evt as { error: number }).error;
        addInEvent.completed();
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
            dialog.close();
            addInEvent.completed();
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
  let selection = "";
  let documentTitle = "";
  let documentName = "";
  let pageNumber = "";
  try {
    const meta = await getHostTextAndMeta(mode);
    selection = meta.text;
    documentTitle = meta.documentTitle;
    documentName = meta.documentName;
    pageNumber = meta.pageNumber;
  } catch {
    event.completed();
    return;
  }
  if (!selection) {
    const title = mode === "selection" ? "Text Selection Message" : "Paragraph Selection Message";
    const text =
      "In order to flag an entity for analysis, that entity must exist. " +
      "In order to flag an entity for analysis, that entity must be identified. " +
      "It is not possible to flag an entity for analysis if that entity is not " +
      "identified or cannot be identified. Here I will need to select the actual " +
      "text or put the cursor or point the mouse to the text that needs to be flagged.";
    showNoSelectionMessage(title, text, event);
    return;
  }
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

  Office.context.ui.displayDialogAsync(
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
      dialog.addEventHandler(Office.EventType.DialogEventReceived, () => {
        addInEvent.completed();
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
                entitySelected: `Speak Logic feedback request on ${nowDate()}`,
                files: p.files,
              });
              saveFeedbackHistory({
                selectionAction: "Requested Feedback From Speak Logic",
                entityName: `Speak Logic feedback request on ${nowDate()}`,
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
            dialog.close();
            addInEvent.completed();
            break;
          case "CLOSE":
            dialog.close();
            addInEvent.completed();
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

function openCommunicationConfigDialog(event: Office.AddinCommands.Event): void {
  ensureDb().then(() => {
    const commConfig = getCommunicationConfig();

    let prefillName = "";
    let prefillEmail = "";

    if (Office.context.host === Office.HostType.Outlook) {
      // Outlook: always read live profile first — it's always accurate
      try {
        const p = Office.context.mailbox.userProfile;
        prefillName  = p.displayName  ?? "";
        prefillEmail = p.emailAddress ?? "";
      } catch { /* ignore */ }
      // Fall back to saved config only if profile returned empty
      if (!prefillName)  prefillName  = commConfig?.personName  ?? "";
      if (!prefillEmail) prefillEmail = commConfig?.personEmail ?? "";
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

    Office.context.ui.displayDialogAsync(
      `${DIALOG_BASE}/dialog.html?view=communication-config`,
      { height: commConfigHeight, width: commConfigWidth, displayInIframe: true },
      (result) => {
        if (result.status === Office.AsyncResultStatus.Failed) {
          handleDialogOpenError(result.error, event);
          return;
        }
        const dialog = result.value;
        dialog.addEventHandler(Office.EventType.DialogEventReceived, () => {
          event.completed();
        });
        dialog.addEventHandler(Office.EventType.DialogMessageReceived, (msg) => {
          const m = JSON.parse((msg as { message: string }).message) as DialogAction;
          switch (m.action) {
            case "READY":
              dialog.messageChild(JSON.stringify({ type: "INIT", payload: initPayload } as HostMessage));
              break;
            case "SAVE_COMMUNICATION_CONFIG":
              saveCommunicationConfig(m.payload as SaveCommunicationConfigPayload);
              dialog.close();
              event.completed();
              break;
            case "CLOSE":
              dialog.close();
              event.completed();
              break;
            default:
              break;
          }
        });
      }
    );
  });
}
