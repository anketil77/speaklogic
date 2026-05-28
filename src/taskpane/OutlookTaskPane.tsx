/* global Office */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { initDb, nowDate } from "@/db/db";
import { getCommunicationConfig, saveCommunicationConfig } from "@/db/queries/communication";
import { getPeopleEmailMap, getPeopleNames, upsertPersonName, upsertPersonWithEmail } from "@/db/queries/people";
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
} from "@/db/queries/feedback";
import { deleteFlag, getAllFlaggedSelections, saveFlag } from "@/db/queries/flag";
import {
  addAttachedFile,
  deleteInterpretation,
  getAllInterpretations,
  getFilesByPrincipleInterpretation,
  removeAttachedFile,
  savePrincipleInSelection,
  saveSelectionWithPrinciple,
} from "@/db/queries/principle";
import { openInterpretedPrincipleReport } from "@/dialog/utils/reportGenerator";
import type {
  AttachFileToProject,
  DialogAction,
  DialogInitPayload,
  HostMessage,
  PrincipleInterpretation,
  SaveAnalysisPayload,
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

// ─── helpers ─────────────────────────────────────────────────────────────────

function getSource(): "Outlook Mail" { return "Outlook Mail"; }

function getUserIdentity(): { personName: string; personEmail: string } {
  try {
    const p = Office.context.mailbox.userProfile;
    return { personName: p.displayName ?? "", personEmail: p.emailAddress ?? "" };
  } catch { return { personName: "", personEmail: "" }; }
}

async function readOutlookText(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const item = Office.context.mailbox.item as any;
    if (!item) { resolve(""); return; }
    item.body.getAsync(Office.CoercionType.Text, (result: Office.AsyncResult<string>) => {
      if (result.status === Office.AsyncResultStatus.Failed) {
        reject(new Error(result.error?.message ?? "Failed to get email body"));
        return;
      }
      resolve(result.value?.trim() ?? "");
    });
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
      { id: "selectionConfig",   label: "Selection Config",   icon: "btn-sel-config-32.png" },
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

  useEffect(() => {
    initDb()
      .then(() => setDbReady(true))
      .catch(() => setStatus({ msg: "Failed to initialize database.", ok: false }));
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
      dialog.addEventHandler(Office.EventType.DialogEventReceived, () => {
        dialogRef.current = null;
      });
    });
  }, []);

  // ── action handlers ───────────────────────────────────────────────────────

  const handleAnalyze = useCallback(async (mode: SelectionMode) => {
    if (!dbReady) return;
    let text = "";
    try { text = await readOutlookText(); } catch { setStatus({ msg: "Failed to read email body.", ok: false }); return; }
    if (!text) { setStatus({ msg: "No text found in the email body.", ok: false }); return; }
    const { personName, personEmail } = getUserIdentity();
    const commConfig = getCommunicationConfig();
    const subject = await readSubject();
    const initPayload: DialogInitPayload = {
      selection: text, mode, source: getSource(), personName, personEmail,
      applicationName: subject, communicationFunction: "", communicationSignal: "", projectName: "",
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
          } catch { dialog.close(); dialogRef.current = null; return; }

          if (payload.analysis.whatToDoWithAnalysis === "ApplyAnalysisAsFeedback") {
            const { personName: pn, personEmail: pe } = getUserIdentity();
            const applyAnalyses = getAllAnalyses().map((a) => !a.id ? a : { ...a, questions: getQuestionsByAnalysis(a.id), errors: getErrorsByAnalysis(a.id), compensators: getCompensatorsByAnalysis(a.id), answers: getAnswersByAnalysis(a.id), files: getFilesByAnalysis(a.id) });
            const applyFeedbacks = getAllFeedbacks().map((f) => !f.analysisId ? f : { ...f, questions: getQuestionsByAnalysis(f.analysisId), compensators: getCompensatorsByAnalysis(f.analysisId), answers: getAnswersByAnalysis(f.analysisId), files: getFilesByAnalysis(f.analysisId) });
            dialog.messageChild(JSON.stringify({ type: "NAVIGATE", view: "apply", payload: { selection: payload.analysis.entityUnderAnalysis, mode: payload.analysis.selectionType === "Selection" ? "selection" : "paragraph", source: payload.analysis.source, personName: pn, personEmail: pe, applicationName: payload.analysis.applicationName, communicationFunction: payload.analysis.communicationFunction, communicationSignal: payload.analysis.communicationSignal, projectName: payload.analysis.projectName, peopleList: [], analysisData: { id: savedId, entityUnderAnalysis: payload.analysis.entityUnderAnalysis, analysisSubject: payload.analysis.analysisSubject ?? "", actualAnalysis: payload.analysis.actualAnalysis, fromPerson: payload.analysis.fromPerson ?? "", errors: payload.errors, compensators: payload.compensators, questions: payload.questions, answers: payload.answers, files: payload.files, correctedItems: [] }, analyses: applyAnalyses, feedbacks: applyFeedbacks } } as HostMessage));
          } else if (payload.analysis.whatToDoWithAnalysis === "ProvideFeedbackWithAnalysis") {
            const { personName: pn, personEmail: pe } = getUserIdentity();
            dialog.messageChild(JSON.stringify({ type: "NAVIGATE", view: "provide-feedback", payload: { selection: payload.analysis.entityUnderAnalysis, mode: payload.analysis.selectionType === "Selection" ? "selection" : "paragraph", source: payload.analysis.source, personName: pn, personEmail: pe, applicationName: payload.analysis.applicationName, communicationFunction: payload.analysis.communicationFunction, communicationSignal: payload.analysis.communicationSignal, projectName: payload.analysis.projectName, peopleList: getPeopleNames(), peopleEmailMap: getPeopleEmailMap(), analysisData: { id: savedId, entityUnderAnalysis: payload.analysis.entityUnderAnalysis, analysisSubject: payload.analysis.analysisSubject ?? "", actualAnalysis: payload.analysis.actualAnalysis, fromPerson: payload.analysis.fromPerson ?? "", errors: payload.errors, compensators: payload.compensators, questions: payload.questions, answers: payload.answers, files: payload.files, correctedItems: [] } } } as HostMessage));
          } else {
            saveFeedbackHistory({ selectionAction: "Retain as Needed", entityName: payload.analysis.entityUnderAnalysis, actualSelection: payload.analysis.entityUnderAnalysis, selectionType: payload.analysis.selectionType ?? "", source: payload.analysis.source, applicationName: payload.analysis.applicationName ?? "", communicationFunction: payload.analysis.communicationFunction ?? "", communicationSignal: payload.analysis.communicationSignal ?? "", projectName: payload.analysis.projectName ?? "", personName: payload.analysis.personName ?? "", personEmail: payload.analysis.personEmail ?? "" });
            dialog.messageChild(JSON.stringify({ type: "RETAIN_SAVED" } as HostMessage));
          }
        } else if (action.action === "SAVE_FEEDBACK") {
          const p = action.payload as SaveFeedbackPayload;
          try { saveFeedback(p); } catch { /* ignore */ }
          const mailtoUrl = buildMailtoUrl(p);
          if (mailtoUrl) { dialog.messageChild(JSON.stringify({ type: "SAVED", mailtoUrl } as HostMessage)); }
          else { dialog.close(); dialogRef.current = null; }
        }
      }
    );
  }, [dbReady, openManagedDialog]);

  const handleFlag = useCallback(async (mode: SelectionMode) => {
    if (!dbReady) return;
    let text = "";
    try { text = await readOutlookText(); } catch { setStatus({ msg: "Failed to read email body.", ok: false }); return; }
    if (!text) { setStatus({ msg: "No text found in the email body.", ok: false }); return; }
    const { personName, personEmail } = getUserIdentity();
    const subject = await readSubject();
    const initPayload: DialogInitPayload = {
      selection: text, mode, source: getSource(), personName, personEmail,
      applicationName: subject, communicationFunction: "", communicationSignal: "", projectName: "", peopleList: [],
    };
    openManagedDialog(
      `${DIALOG_BASE}/dialog.html?view=flag&mode=${mode}`,
      FLAG_DIALOG_SIZE,
      () => initPayload,
      (dialog, action) => {
        if (action.action === "SAVE_FLAG") {
          try { saveFlag({ ...(action.payload as object), wasEntityAnalyzed: "No" } as Parameters<typeof saveFlag>[0]); } catch { /* ignore */ }
          dialog.close(); dialogRef.current = null;
        }
      }
    );
  }, [dbReady, openManagedDialog]);

  const handleSelectionConfig = useCallback(() => {
    openManagedDialog(
      `${DIALOG_BASE}/dialog.html?view=selection-config`,
      SELECTION_CONFIG_DIALOG_SIZE,
      () => ({ selection: "", mode: "selection" as const, source: getSource(), personName: "", personEmail: "", applicationName: "", communicationFunction: "", communicationSignal: "", projectName: "", peopleList: [] }),
      () => { /* handled inside the dialog */ }
    );
  }, [openManagedDialog]);

  const handleApply = useCallback(async (mode: SelectionMode) => {
    if (!dbReady) return;
    let text = "";
    try { text = await readOutlookText(); } catch { setStatus({ msg: "Failed to read email body.", ok: false }); return; }
    if (!text) { setStatus({ msg: "No text found in the email body.", ok: false }); return; }
    const { personName, personEmail } = getUserIdentity();
    const analyses = getAllAnalyses().map((a) => !a.id ? a : { ...a, questions: getQuestionsByAnalysis(a.id), errors: getErrorsByAnalysis(a.id), compensators: getCompensatorsByAnalysis(a.id), answers: getAnswersByAnalysis(a.id), files: getFilesByAnalysis(a.id) });
    const feedbacks = getAllFeedbacks().map((f) => !f.analysisId ? f : { ...f, questions: getQuestionsByAnalysis(f.analysisId), compensators: getCompensatorsByAnalysis(f.analysisId), answers: getAnswersByAnalysis(f.analysisId), files: getFilesByAnalysis(f.analysisId) });
    const initPayload: DialogInitPayload = { selection: text, mode, source: getSource(), personName, personEmail, applicationName: "", communicationFunction: "", communicationSignal: "", projectName: "", peopleList: getPeopleNames(), analyses, feedbacks };
    openManagedDialog(
      `${DIALOG_BASE}/dialog.html?view=apply`,
      DIALOG_SIZE,
      () => initPayload,
      (dialog, action) => {
        if (action.action === "SAVE_FEEDBACK") {
          try { saveFeedback(action.payload as SaveFeedbackPayload); } catch { /* ignore */ }
          dialog.close(); dialogRef.current = null;
        }
      }
    );
  }, [dbReady, openManagedDialog]);

  const handleProvideFeedback = useCallback(async (mode: SelectionMode) => {
    if (!dbReady) return;
    let text = "";
    try { text = await readOutlookText(); } catch { setStatus({ msg: "Failed to read email body.", ok: false }); return; }
    if (!text) { setStatus({ msg: "No text found in the email body.", ok: false }); return; }
    const { personName, personEmail } = getUserIdentity();
    const commConfig = getCommunicationConfig();
    const initPayload: DialogInitPayload = { selection: text, mode, source: getSource(), personName, personEmail, applicationName: "", communicationFunction: "", communicationSignal: "", projectName: "", peopleList: buildPeopleList(commConfig?.personName), peopleEmailMap: getPeopleEmailMap(), communicationPersonName: commConfig?.personName ?? "", communicationPersonEmail: commConfig?.personEmail ?? "" };
    openManagedDialog(
      `${DIALOG_BASE}/dialog.html?view=provide-feedback`,
      DIALOG_SIZE,
      () => initPayload,
      (dialog, action) => {
        if (action.action === "SAVE_FEEDBACK") {
          const p = action.payload as SaveFeedbackPayload;
          try { saveFeedback(p); } catch { /* ignore */ }
          dialog.messageChild(JSON.stringify({ type: "SAVED", mailtoUrl: buildMailtoUrl(p) } as HostMessage));
        }
      }
    );
  }, [dbReady, openManagedDialog]);

  const handleRequestFeedback = useCallback(async () => {
    if (!dbReady) return;
    let text = "";
    try { text = await readOutlookText(); } catch { setStatus({ msg: "Failed to read email body.", ok: false }); return; }
    if (!text) { setStatus({ msg: "No text found in the email body.", ok: false }); return; }
    const { personName, personEmail } = getUserIdentity();
    const commConfig = getCommunicationConfig();
    const initPayload: DialogInitPayload = { selection: text, mode: "paragraph", source: getSource(), personName, personEmail, applicationName: "", communicationFunction: "", communicationSignal: "", projectName: "", peopleList: buildPeopleList(commConfig?.personName), peopleEmailMap: getPeopleEmailMap(), communicationPersonName: commConfig?.personName ?? "", communicationPersonEmail: commConfig?.personEmail ?? "" };
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
          } catch { /* ignore */ }
          dialog.messageChild(JSON.stringify({ type: "SAVED", mailtoUrl: buildRequestMailtoUrl(p) } as HostMessage));
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
      () => ({ selection: "", mode: "selection" as const, source: getSource(), personName, personEmail, applicationName: "", communicationFunction: "", communicationSignal: "", projectName: "", peopleList: [], flaggedEntities, principleInterpretations, filesByInterpretationId }),
      (dialog, action) => {
        if (action.action === "DELETE_FLAG") deleteFlag((action as { action: string; id: number }).id);
        if (action.action === "DELETE_INTERPRETED_PRINCIPLE") deleteInterpretation((action as { action: string; id: number }).id);
        if (action.action === "REPORT_INTERPRETED_PRINCIPLE") openInterpretedPrincipleReport((action as { action: string; interpretation: PrincipleInterpretation }).interpretation);
        if (action.action === "ADD_ATTACHED_FILE") {
          const newId = addAttachedFile((action as { action: string; file: AttachFileToProject }).file as Omit<AttachFileToProject, "id">);
          dialog.messageChild(JSON.stringify({ type: "FILE_ADDED", id: newId }));
        }
        if (action.action === "REMOVE_ATTACHED_FILE") removeAttachedFile((action as { action: string; id: number }).id);
        if (action.action === "SAVE_RELATED_SELECTION") {
          const { payload } = action as { action: string; payload: SaveRelatedSelectionPayload };
          const newId = saveSelectionWithPrinciple(payload.record);
          for (const file of payload.files) addAttachedFile({ ...file, selectionWithPrincipleId: newId });
        }
        if (action.action === "SAVE_PRINCIPLE_IN_SELECTION") {
          const { payload } = action as { action: string; payload: SavePrincipleInSelectionPayload };
          const newId = savePrincipleInSelection(payload.record);
          for (const file of payload.files) addAttachedFile({ ...file, principleInSelectionId: newId });
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
      () => ({ selection: "", mode: "selection" as const, source: getSource(), personName, personEmail, applicationName: "", communicationFunction: "", communicationSignal: "", projectName: "", peopleList: [], analyses }),
      (dialog, action) => {
        if (action.action === "DELETE_ANALYSIS") deleteAnalysis((action as { action: string; id: number }).id);
        if (action.action === "NAVIGATE_TO_APPLY") {
          const { analysisId } = action as { action: string; analysisId: number };
          const analysis = getAnalysisById(analysisId);
          if (!analysis) return;
          const { personName: pn, personEmail: pe } = getUserIdentity();
          const allAnalyses = getAllAnalyses().map((a) => !a.id ? a : { ...a, questions: getQuestionsByAnalysis(a.id), errors: getErrorsByAnalysis(a.id), compensators: getCompensatorsByAnalysis(a.id), answers: getAnswersByAnalysis(a.id), files: getFilesByAnalysis(a.id) });
          const allFeedbacks = getAllFeedbacks().map((f) => !f.analysisId ? f : { ...f, questions: getQuestionsByAnalysis(f.analysisId), compensators: getCompensatorsByAnalysis(f.analysisId), answers: getAnswersByAnalysis(f.analysisId), files: getFilesByAnalysis(f.analysisId) });
          dialog.messageChild(JSON.stringify({ type: "NAVIGATE", view: "apply", payload: { selection: analysis.entityUnderAnalysis?.replace(/<[^>]+>/g, "") ?? "", mode: "selection", source: getSource(), personName: pn, personEmail: pe, applicationName: "", communicationFunction: "", communicationSignal: "", projectName: "", peopleList: getPeopleNames(), analyses: allAnalyses, feedbacks: allFeedbacks } } as HostMessage));
        }
        if (action.action === "SAVE_FEEDBACK") {
          try { saveFeedback(action.payload as SaveFeedbackPayload); } catch { /* ignore */ }
          dialog.close(); dialogRef.current = null;
        }
      }
    );
  }, [dbReady, openManagedDialog]);

  const handleFeedbackHistory = useCallback(() => {
    if (!dbReady) return;
    const { personName, personEmail } = getUserIdentity();
    const feedbacks = getAllFeedbacks().map((f) => !f.analysisId ? f : { ...f, questions: getQuestionsByAnalysis(f.analysisId), compensators: getCompensatorsByAnalysis(f.analysisId), answers: getAnswersByAnalysis(f.analysisId), files: getFilesByAnalysis(f.analysisId) });
    openManagedDialog(
      `${DIALOG_BASE}/dialog.html?view=feedback-history`,
      DIALOG_SIZE,
      () => ({ selection: "", mode: "selection" as const, source: getSource(), personName, personEmail, applicationName: "", communicationFunction: "", communicationSignal: "", projectName: "", peopleList: [], feedbacks }),
      (_dialog, action) => {
        if (action.action === "DELETE_FEEDBACK") deleteFeedback((action as { action: string; id: number }).id);
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
      () => ({ selection: "", mode: "selection" as const, source: getSource(), personName, personEmail, applicationName: "", communicationFunction: "", communicationSignal: "", projectName: "", peopleList: [], analyses }),
      (_dialog, action) => {
        if (action.action === "DELETE_ANALYSIS") deleteAnalysis((action as { action: string; id: number }).id);
      }
    );
  }, [dbReady, openManagedDialog]);

  const handleCommunicationConfig = useCallback(() => {
    if (!dbReady) return;
    const commConfig = getCommunicationConfig();
    openManagedDialog(
      `${DIALOG_BASE}/dialog.html?view=communication-config`,
      COMM_CONFIG_SIZE,
      () => ({ selection: "", mode: "selection" as const, source: getSource(), personName: "", personEmail: "", applicationName: "", communicationFunction: "", communicationSignal: "", projectName: "", peopleList: [], communicationPersonName: commConfig?.personName ?? "", communicationPersonEmail: commConfig?.personEmail ?? "" }),
      (dialog, action) => {
        if (action.action === "SAVE_COMMUNICATION_CONFIG") {
          saveCommunicationConfig(action.payload as SaveCommunicationConfigPayload);
          dialog.close(); dialogRef.current = null;
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
      () => ({ selection: "", mode: "selection" as const, source: getSource(), personName, personEmail, applicationName: "", communicationFunction: "", communicationSignal: "", projectName: "", peopleList: buildPeopleList(commConfig?.personName), communicationPersonName: commConfig?.personName ?? "", communicationPersonEmail: commConfig?.personEmail ?? "" }),
      (dialog, action) => {
        if (action.action === "SAVE_REQUEST_SL_FEEDBACK") {
          const p = action.payload as SaveRequestSLFeedbackPayload;
          try {
            saveCommSignalInfo({ fromPerson: p.fromPerson ?? "", toPerson: "Speak Logic", toPersonEmail: "support@speaklogic.org", applicationName: p.applicationName ?? "", communicationFunction: p.communicationFunction ?? "", communicationSignalType: (p as { communicationSignalType?: string }).communicationSignalType ?? "", communicationSubject: p.communicationSubject ?? "", actualCommunication: p.actualCommunication ?? "", actualSelection: "", selectionType: "Speak Logic Request", entitySelected: `Speak Logic feedback request on ${nowDate()}`, files: (p as { files?: AttachFileToProject[] }).files ?? [] });
          } catch { /* ignore */ }
          dialog.messageChild(JSON.stringify({ type: "SAVED", mailtoUrl: buildRequestSLMailtoUrl(p) } as HostMessage));
        }
      }
    );
  }, [dbReady, openManagedDialog]);

  const handleSimple = useCallback((view: string) => {
    openManagedDialog(
      `${DIALOG_BASE}/dialog.html?view=${view}`,
      view === "about" ? ABOUT_DIALOG_SIZE : DIALOG_SIZE,
      () => ({ selection: "", mode: "selection" as const, source: getSource(), personName: "", personEmail: "", applicationName: "", communicationFunction: "", communicationSignal: "", projectName: "", peopleList: [] }),
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
      case "communicationConfig":handleCommunicationConfig(); break;
      case "requestSLFeedback":  handleRequestSLFeedback(); break;
      case "createArticle":      handleSimple("create-article"); break;
      case "listArticles":       handleSimple("list-articles"); break;
      case "help":               handleSimple("help"); break;
      case "about":              handleSimple("about"); break;
      default: break;
    }
  }, [handleAnalyze, handleFlag, handleSelectionConfig, handleApply, handleProvideFeedback, handleRequestFeedback, handleFlaggedHistory, handleAnalysisHistory, handleFeedbackHistory, handleRetainedHistory, handleCommunicationConfig, handleRequestSLFeedback, handleSimple]);

  // ── render ────────────────────────────────────────────────────────────────

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
        Speak Logic Add-in
      </div>
    </div>
  );
}
