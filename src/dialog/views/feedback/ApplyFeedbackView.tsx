// src/dialog/views/feedback/ApplyFeedbackView.tsx

import React, { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { Spinner, makeStyles } from "@fluentui/react-components";
import { CheckmarkRegular } from "@fluentui/react-icons";
import { useDialogComm } from "@/dialog/hooks/useDialogComm";
import { RichTextToolbar } from "@/dialog/components/RichTextToolbar";
import { HamburgerIcon, PfFeedbackListIcon, PfAnalysisListIcon } from "@/dialog/components/Icons";
import type { PanelMenuEntry } from "@/dialog/components/PanelContextMenu";
import { CommandDropdown } from "@/dialog/components/CommandDropdown";
import type { CmdDropdownDef } from "@/dialog/components/CommandDropdown";
import { nowDate, nowTime } from "@/db/db";
import { colors } from "@/styles/tokens";
import { dbg } from "@/debug/log";
import { sanitizeWordHtml } from "@/dialog/utils/sanitizeWordHtml";
import type { SaveFeedbackPayload, ProjectAnalysis, ProjectFeedback } from "@/types/db";
import { ApplyFeedbackTabs } from "./ApplyFeedbackTabs";
import { ApplyFeedbackSubDialogs } from "./ApplyFeedbackSubDialogs";
import { InfoMessageCard } from "@/dialog/components/InfoMessageCard";
import { InsertConfirmToast } from "@/dialog/components/InsertConfirmToast";
import type { QuestionDraft, AnswerDraft, ErrorDraft, CompensatorDraft, ProblemDraft, FileDraft, CorrectedItemDraft, TabValue, CtxMenu, OpenDialog, FeedbackForm } from "./applyFeedbackTypes";

// Per-field validation messages — verbatim from C# ApplyFeedback.cs:169-233.
// Each empty field fires its own dialog (matches MyXtraMessageBox.Show in the legacy app).
const MSG_APPLICATION_NAME_TITLE = "Application Name Message";
const MSG_APPLICATION_NAME =
  "By applying a feedback, we correct an error that needs to be.  In this case, we " +
  "view the application as the actual entity to which the correction is being made. " +
  "Since the application of the feedback to the actual entity must show the corrected " +
  "version of that entity, the actual entity must be named.  Here I enter the name of " +
  "the application to which the feedback is being applied.";

const MSG_COMMUNICATION_FUNCTION_TITLE = "Communication Function Message";
const MSG_COMMUNICATION_FUNCTION =
  "The communication function itself is the function of the application that contains " +
  "the entity that we are correcting.  Since the application of the feedback is being " +
  "viewed as the corrected version of that entity, the communication function is needed " +
  "to enable that correction.  Here I enter the communication function of the application " +
  "to which the feedback is being applied.";

const MSG_FEEDBACK_SUBJECT_TITLE = "Feedback Subject Message";
const MSG_FEEDBACK_SUBJECT =
  "The subject of our feedback is what our feedback is about.  For instance if we apply " +
  "the feedback for Entity One, the subject of our feedback about Entity One reflects " +
  "what our feedback is about.  Here I enter a subject of my feedback to show what it " +
  "is about.";

const MSG_ERROR_TO_SUBSTITUTE_TITLE = "Error To Be Corrected";
const MSG_ERROR_TO_SUBSTITUTE =
  "In order for a correction to be made, the error must be identified and must be " +
  "specified.  The error is being viewed as the entity that needs to be substituted by " +
  "the compensator.  Here I select the error that needs to be substituted.";

const MSG_COMPENSATOR_REPLACED_TITLE = "Compensator Replaced Message";
const MSG_COMPENSATOR_REPLACED =
  "In order for an error to be corrected, that error itself must be substituted by " +
  "another entity.  In this case, the entity that replaces the error to correct that " +
  "error is being viewed as the compensator.  Here I select the compensator that is " +
  "used to replace the error.";

const MSG_FEEDBACK_APPLICATION_TITLE = "Feedback Application Message";
const MSG_FEEDBACK_APPLICATION =
  "The feedback application is being view as the description of the application of the " +
  "feedback.  Since the application of the feedback to an entity that contains an error " +
  "must enable us to correct that error, the application of the feedback to that entity " +
  "must be described.  Here I describe my feedback application by writing the description " +
  "of the application of the feedback.";

// ── Design tokens ─────────────────────────────────────────────────────────────
const F = { borderInput: `1px solid #C7C7C7`, borderBox: `1px solid #E0E0E0`, bgCommandBar: "#F5F5F5", sepColor: "#E0E0E0" } as const;

const useStyles = makeStyles({
  root: { position: "relative", display: "flex", flexDirection: "column", height: "100vh", background: colors.white, overflow: "hidden", fontFamily: "'Inter', 'Segoe UI', sans-serif" },
  titleSection: { height: "78px", display: "flex", alignItems: "center", padding: "0 20px", gap: "12px", flexShrink: 0 },
  headerIcon: { width: "32px", height: "32px", borderRadius: "6px", background: colors.grey95, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  titles: { flex: 1, display: "flex", flexDirection: "column", gap: "3px" },
  titleText: { fontSize: "15.6px", fontWeight: "700", lineHeight: "21px", letterSpacing: "-0.1px", color: colors.grey11 },
  subtitleText: { fontSize: "11.1px", fontWeight: "400", lineHeight: "17px", color: colors.grey38 },
  commandBar: { height: "44px", background: F.bgCommandBar, display: "flex", alignItems: "center", padding: "0 12px", flexShrink: 0, gap: "0", overflowX: "auto" },
  applyMainBtn: { height: "28px", minWidth: "120px", background: "#0078D4", borderRadius: "4px", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", cursor: "pointer", padding: "0 10px", flexShrink: 0, fontFamily: "inherit", ":hover": { background: "#106EBE" } },
  applyMainBtnText: { fontSize: "11.6px", fontWeight: "700", color: colors.white, lineHeight: "14px" },
  cmdSep: { width: "1px", height: "20px", background: F.sepColor, margin: "0 8px", flexShrink: 0 },
  cmdIconBtn: { width: "28px", height: "28px", borderRadius: "3px", border: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, padding: 0 },
  footer: { height: "57px", borderTop: F.borderBox, display: "flex", alignItems: "center", padding: "0 20px", gap: "8px", flexShrink: 0, background: colors.white },
  footerHint: { flex: 1, fontSize: "10.3px", fontWeight: "400", color: colors.grey38, lineHeight: "15px" },
});

const cancelBtnS = (): React.CSSProperties => ({ height: "32px", padding: "0 18px", borderRadius: "4px", fontSize: "12.3px", fontFamily: "inherit", cursor: "pointer", background: colors.white, border: "1px solid #C7C7C7", color: colors.grey11, fontWeight: "400" });
const applyBtnS = (hover: boolean): React.CSSProperties => ({ height: "32px", padding: "0 20px", borderRadius: "4px", fontSize: "12.3px", fontFamily: "inherit", cursor: "pointer", background: hover ? "#106EBE" : colors.azure42, border: "none", color: colors.white, fontWeight: "700" });

// ── Component ─────────────────────────────────────────────────────────────────
export default function ApplyView() {
  const styles = useStyles();
  const { initData, sendMessage, submitSave, saving, closeDialog } = useDialogComm();
  const editorRef = useRef<HTMLDivElement>(null);
  const lastSelectionRef = useRef<string>("");
  const [activeTab, setActiveTab] = useState<TabValue>("feedback");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<{ title: string; text: string } | null>(null);
  const [insertToast, setInsertToast] = useState(false);
  const [footerBtnHover, setFooterBtnHover] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<SaveFeedbackPayload | null>(null);

  const [form, setForm] = useState<FeedbackForm>({ applicationName: "", communicationFunction: "", feedbackSubject: "", errorSubstituted: "", compensatorReplaced: "", feedbackApplication: "", fromPerson: "", toPerson: "" });
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [errors, setErrors] = useState<ErrorDraft[]>([]);
  const [compensators, setCompensators] = useState<CompensatorDraft[]>([]);
  const [answers, setAnswers] = useState<AnswerDraft[]>([]);
  const [files, setFiles] = useState<FileDraft[]>([]);
  const [correctedItems, setCorrectedItems] = useState<CorrectedItemDraft[]>([]);
  const [problems, setProblems] = useState<ProblemDraft[]>([]);
  const [selectedRow, setSelectedRow] = useState<{ tab: TabValue; idx: number } | null>(null);
  const [openDialog, setOpenDialog] = useState<OpenDialog | null>(null);
  const [pendingRemove, setPendingRemove] = useState<{ tab: TabValue; idx: number; message: string } | null>(null);
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
  const [showAnalysisList, setShowAnalysisList] = useState(false);
  const [showFeedbackList, setShowFeedbackList] = useState(false);
  const [viewAnalysis, setViewAnalysis] = useState<ProjectAnalysis | null>(null);
  const [viewFeedback, setViewFeedback] = useState<ProjectFeedback | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const availableAnalyses = useMemo(() => (initData?.analyses ?? []) as ProjectAnalysis[], [initData]);
  const availableFeedbacks = useMemo(() => (initData?.feedbacks ?? []) as ProjectFeedback[], [initData]);

  useEffect(() => {
    if (!initData) return;
    const ad = initData.analysisData;
    setForm((prev) => ({
      ...prev,
      applicationName: prev.applicationName || initData.applicationName || "",
      communicationFunction: prev.communicationFunction || initData.communicationFunction || "",
      fromPerson: prev.fromPerson || initData.communicationPersonName || ad?.fromPerson || initData.personName || "",
      toPerson: prev.toPerson || ad?.fromPerson || initData.personName || "",
    }));
    if (ad) {
      setQuestions(ad.questions.map((q) => ({ ...q })));
      setErrors(ad.errors.map((e) => ({ ...e })));
      setCompensators(ad.compensators.map((c) => ({ ...c })));
      setAnswers(ad.answers.map((a) => ({ ...a })));
      setFiles(ad.files.map((f) => ({ ...f })));
      setCorrectedItems((ad.correctedItems ?? []).map((ci) => ({ ...ci })));
    }
  }, [initData]);

  useEffect(() => {
    const onSel = () => {
      const sel = window.getSelection();
      if (!sel || !editorRef.current) return;
      if (editorRef.current.contains(sel.anchorNode)) lastSelectionRef.current = sel.toString();
    };
    document.addEventListener("selectionchange", onSel);
    return () => document.removeEventListener("selectionchange", onSel);
  }, []);

  const analysisData = initData?.analysisData;
  const selectionHtml = useMemo(() => (initData?.selectionHtml ? sanitizeWordHtml(initData.selectionHtml) : ""), [initData?.selectionHtml]);
  const errorOptions = useMemo(() => errors.map((e) => e.actualError).filter(Boolean), [errors]);
  const compensatorOptions = useMemo(() => compensators.map((c) => c.actualCompensator).filter(Boolean), [compensators]);
  // Solve Problem auto-select: errors corrected + compensators replaced by THIS feedback
  // (the substituted error/compensator plus every corrected-item pair). Client spec:
  // "selected automatically, because they were corrected during the applied feedback".
  const solvePreselectedErrors = useMemo(
    () => Array.from(new Set([form.errorSubstituted, ...correctedItems.map((c) => c.errorSelection)].filter(Boolean))),
    [form.errorSubstituted, correctedItems]
  );
  const solvePreselectedCompensators = useMemo(
    () => Array.from(new Set([form.compensatorReplaced, ...correctedItems.map((c) => c.compensatorSelection)].filter(Boolean))),
    [form.compensatorReplaced, correctedItems]
  );

  const tabs = useMemo((): { value: TabValue; label: string }[] => {
    const mid = initData?.mode === "selection" ? { value: "selection" as TabValue, label: "Selection" } :
      initData?.mode === "paragraph" ? { value: "paragraph" as TabValue, label: "Paragraph" } : null;
    return [{ value: "feedback", label: "Feedback" }, ...(mid ? [mid] : []), { value: "questions", label: "Analysis Question" }, { value: "errors", label: "Errors" }, { value: "compensators", label: "Compensators" }, { value: "answers", label: "Answers" }, { value: "problems", label: "Problems" }, { value: "corrected", label: "Corrected Items" }, { value: "files", label: "Attached Files" }];
  }, [initData]);

  const updateForm = useCallback(<K extends keyof FeedbackForm>(key: K, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setValidationError(null);
  }, []);
  const closePortal = useCallback(() => setOpenDialog(null), []);
  const onRowClick = useCallback((tab: TabValue, idx: number) => setSelectedRow((prev) => prev?.tab === tab && prev.idx === idx ? null : { tab, idx }), []);
  const onCtx = useCallback((tab: TabValue, idx: number | null, x: number, y: number) => { if (idx !== null) setSelectedRow({ tab, idx }); setCtxMenu({ tab, idx, x, y }); }, []);

  const ctxItems = useMemo((): PanelMenuEntry[] => {
    if (!ctxMenu) return [];
    const { tab, idx } = ctxMenu;
    switch (tab) {
      case "questions": {
        const q = idx !== null ? questions[idx] : undefined;
        return [
          { label: "Add Analysis Question", onClick: () => { setOpenDialog({ type: "addQuestion" }); setCtxMenu(null); } },
          { label: "Respond To Analysis Question", onClick: () => { if (q && idx !== null) { setOpenDialog({ type: "respondQuestion", item: q, idx }); setCtxMenu(null); } }, disabled: !q },
          { label: "Remove Analysis Question", onClick: () => { if (q && idx !== null) { setPendingRemove({ tab: "questions", idx, message: "Remove this analysis question?" }); setCtxMenu(null); } }, disabled: !q },
          { label: "View Analysis Question", onClick: () => { if (q) { setOpenDialog({ type: "viewQuestion", item: q }); setCtxMenu(null); } }, disabled: !q },
        ];
      }
      case "errors": {
        const e = idx !== null ? errors[idx] : undefined;
        return [
          { label: "Identify Additional Error", onClick: () => { setOpenDialog({ type: "addError" }); setCtxMenu(null); } },
          { label: "View Error", onClick: () => { if (e) { setOpenDialog({ type: "viewError", item: e }); setCtxMenu(null); } }, disabled: !e },
          { isSep: true },
          { label: "Identify Compensator For Error", onClick: () => { setOpenDialog({ type: "compensatorForError", error: e?.actualError ?? "", app: e?.fromActualCommunication ?? "" }); setCtxMenu(null); }, disabled: !e },
        ];
      }
      case "compensators": {
        const c = idx !== null ? compensators[idx] : undefined;
        return [{ label: "View Compensator", onClick: () => { if (c) { setOpenDialog({ type: "viewCompensator", item: c }); setCtxMenu(null); } }, disabled: !c }];
      }
      case "answers": {
        const a = idx !== null ? answers[idx] : undefined;
        return [
          { label: "View Answer", onClick: () => { if (a) { setOpenDialog({ type: "viewAnswer", item: a }); setCtxMenu(null); } }, disabled: !a },
          { isSep: true },
          { label: "Remove Selected Answer", onClick: () => { if (a && idx !== null) { setPendingRemove({ tab: "answers", idx, message: "Remove this answer?" }); setCtxMenu(null); } }, disabled: !a },
        ];
      }
      case "files": {
        const f = idx !== null ? files[idx] : undefined;
        return [
          { label: "Add File", onClick: () => { setOpenDialog({ type: "addFile" }); setCtxMenu(null); } },
          { label: "Remove File", onClick: () => { if (f && idx !== null) { setPendingRemove({ tab: "files", idx, message: "Remove this attached file?" }); setCtxMenu(null); } }, disabled: !f },
          { isSep: true },
          { label: "View File Info", onClick: () => { if (f) { setOpenDialog({ type: "viewFile", item: f }); setCtxMenu(null); } }, disabled: !f },
        ];
      }
      case "corrected": {
        const ci = idx !== null ? correctedItems[idx] : undefined;
        return [
          { label: "Add Corrected Item", onClick: () => { setOpenDialog({ type: "addCorrectedItem" }); setCtxMenu(null); } },
          { label: "Edit Corrected Item", onClick: () => { if (ci && idx !== null) { setOpenDialog({ type: "editCorrectedItem", item: ci, idx }); setCtxMenu(null); } }, disabled: !ci },
          { label: "View Corrected Item", onClick: () => { if (ci) { setOpenDialog({ type: "viewCorrectedItem", item: ci }); setCtxMenu(null); } }, disabled: !ci },
          { isSep: true },
          { label: "Identify Additional Error", onClick: () => { setOpenDialog({ type: "addError" }); setCtxMenu(null); } },
          { label: "Identify Additional Compensator", onClick: () => { setOpenDialog({ type: "compensatorForError", error: "", app: "" }); setCtxMenu(null); } },
        ];
      }
      case "problems": {
        const pr = idx !== null ? problems[idx] : undefined;
        return [
          { label: "Identify Problem", onClick: () => { setOpenDialog({ type: "addProblem" }); setCtxMenu(null); } },
          { label: "View Problem", onClick: () => { if (pr) { setOpenDialog({ type: "viewProblem", item: pr }); setCtxMenu(null); } }, disabled: !pr },
          { label: "Solve Problem", onClick: () => { if (pr && idx !== null) { setOpenDialog({ type: "solveProblem", item: pr, idx }); setCtxMenu(null); } }, disabled: !pr },
          { isSep: true },
          { label: "Remove Problem", onClick: () => { if (pr && idx !== null) { setPendingRemove({ tab: "problems", idx, message: "Remove this identified problem?" }); setCtxMenu(null); } }, disabled: !pr },
        ];
      }
      default: return [];
    }
  }, [ctxMenu, questions, errors, compensators, answers, files, correctedItems, problems]);

  const selectedQuestionIdx = selectedRow?.tab === "questions" ? selectedRow.idx : null;
  const analysisToolsDef = useMemo((): CmdDropdownDef => ({
    id: "analysis-tools", iconSrc: "assets/icons/analysis.svg", title: "Analysis Tools",
    items: [
      { label: "Identify Selection as Compensator", iconSrc: "assets/icons/selection.svg", enabled: true, onClick: () => { setOpenDialog({ type: "compensatorForError", error: "", app: "", description: lastSelectionRef.current }); setOpenDropdownId(null); } },
      { label: "Identify Selection as Analysis Question", iconSrc: "assets/icons/analysis-question.svg", enabled: true, onClick: () => { setOpenDialog({ type: "addQuestion", initialQuestion: lastSelectionRef.current }); setOpenDropdownId(null); } },
      { label: "Respond Analysis Question", iconSrc: "assets/icons/view-selected-answer.svg", enabled: selectedQuestionIdx !== null, onClick: () => { if (selectedQuestionIdx !== null) { setOpenDialog({ type: "respondQuestion", item: questions[selectedQuestionIdx], idx: selectedQuestionIdx }); setOpenDropdownId(null); } } },
      { label: "Add Analysis Question", iconSrc: "assets/icons/add-analysis-question.svg", enabled: true, onClick: () => { setOpenDialog({ type: "addQuestion" }); setOpenDropdownId(null); } },
      { label: "Add Compensator", iconSrc: "assets/icons/compensator-error.svg", enabled: true, onClick: () => { setOpenDialog({ type: "compensatorForError", error: "", app: "" }); setOpenDropdownId(null); } },
    ],
  }), [selectedQuestionIdx, questions]);

  const confirmRemove = useCallback(() => {
    if (!pendingRemove) return;
    const { tab, idx } = pendingRemove;
    if (tab === "questions") setQuestions((prev) => prev.filter((_, i) => i !== idx));
    else if (tab === "answers") setAnswers((prev) => prev.filter((_, i) => i !== idx));
    else if (tab === "files") setFiles((prev) => prev.filter((_, i) => i !== idx));
    else if (tab === "problems") setProblems((prev) => prev.filter((_, i) => i !== idx));
    setSelectedRow(null);
    setPendingRemove(null);
  }, [pendingRemove]);

  const save = useCallback(() => {
    dbg("APPLY", "save() called", { form, hasInitData: !!initData });
    if (!initData) return;
    const feedbackApplicationText = form.feedbackApplication.replace(/<[^>]*>/g, "").trim();
    // Match C# ApplyFeedback.cs:169-233: check fields in order, fire one message per
    // empty field, return on the first empty one.
    if (!form.applicationName.trim()) {
      setActiveTab("feedback");
      setInfoMsg({ title: MSG_APPLICATION_NAME_TITLE, text: MSG_APPLICATION_NAME });
      return;
    }
    if (!form.communicationFunction.trim()) {
      setActiveTab("feedback");
      setInfoMsg({ title: MSG_COMMUNICATION_FUNCTION_TITLE, text: MSG_COMMUNICATION_FUNCTION });
      return;
    }
    if (!form.feedbackSubject.trim()) {
      setActiveTab("feedback");
      setInfoMsg({ title: MSG_FEEDBACK_SUBJECT_TITLE, text: MSG_FEEDBACK_SUBJECT });
      return;
    }
    if (!form.errorSubstituted.trim()) {
      setActiveTab("feedback");
      setInfoMsg({ title: MSG_ERROR_TO_SUBSTITUTE_TITLE, text: MSG_ERROR_TO_SUBSTITUTE });
      return;
    }
    if (!form.compensatorReplaced.trim()) {
      setActiveTab("feedback");
      setInfoMsg({ title: MSG_COMPENSATOR_REPLACED_TITLE, text: MSG_COMPENSATOR_REPLACED });
      return;
    }
    if (!feedbackApplicationText) {
      setActiveTab("feedback");
      setInfoMsg({ title: MSG_FEEDBACK_APPLICATION_TITLE, text: MSG_FEEDBACK_APPLICATION });
      return;
    }
    setValidationError(null);

    const originalCICount = analysisData?.correctedItems?.length ?? 0;
    const newCorrectedItems = correctedItems.slice(originalCICount);
    const originalFileCount = analysisData?.files?.length ?? 0;
    const newFiles = files.slice(originalFileCount);

    const payload: SaveFeedbackPayload = {
      feedback: {
        feedbackApplication: form.feedbackApplication, feedbackDate: nowDate(), feedbackTime: nowTime(),
        fromPerson: form.fromPerson || analysisData?.fromPerson || "", toPerson: form.toPerson || analysisData?.fromPerson || "",
        feedbackSubject: form.feedbackSubject, internalFeedbackName: "", feedbackType: "Applied",
        actualSelection: selectionHtml || initData.selection,
        selectionType: initData.mode === "selection" ? "Selection" : "Paragraph",
        actualErrorSubstituted: form.errorSubstituted, actualCompensatorReplaced: form.compensatorReplaced,
        source: initData.source, applicationName: form.applicationName, communicationFunction: form.communicationFunction,
        communicationSignal: initData.communicationSignal, projectName: initData.projectName,
        personName: initData.personName, personEmail: initData.personEmail, analysisId: analysisData?.id,
      },
      files: newFiles, newCorrectedItems,
      problems: problems.map((pr) => ({
        problemNumber: pr.problemNumber,
        problemName: pr.problemName,
        actualProblem: pr.actualProblem,
        fromActualError: pr.fromActualError,
        problemDescription: pr.problemDescription,
        problemDate: pr.problemDate,
        problemTime: pr.problemTime,
      })),
    };
    setPendingPayload(payload);
    setShowConfirm(true);
  }, [form, initData, analysisData, correctedItems, files, selectionHtml, problems]);

  const confirmSave = useCallback(() => {
    if (pendingPayload) { dbg("APPLY", "confirmSave — sending SAVE_FEEDBACK"); submitSave({ action: "SAVE_FEEDBACK", payload: pendingPayload }); }
  }, [pendingPayload, submitSave]);

  if (!initData) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <Spinner label="Loading..." />
    </div>
  );

  return (
    <div className={styles.root}>
      {/* ── Title ─────────────────────────────────────────────────────────── */}
      <div className={styles.titleSection}>
        <div className={styles.headerIcon}><HamburgerIcon /></div>
        <div className={styles.titles}>
          <span className={styles.titleText}>Apply Feedback</span>
          <span className={styles.subtitleText}>Apply analysis as feedback and document the correction.</span>
        </div>
      </div>

      {/* ── Command bar ───────────────────────────────────────────────────── */}
      <div className={styles.commandBar} style={{ position: "relative" }}>
        <button className={styles.applyMainBtn} onClick={save}>
          <CheckmarkRegular style={{ fontSize: "13px", color: colors.white }} />
          <span className={styles.applyMainBtnText}>Apply Feedback</span>
        </button>
        <div className={styles.cmdSep} />
        <button className={`${styles.cmdIconBtn} sl-icon-btn`} title="View List of Feedback" onClick={() => setShowFeedbackList(true)}><PfFeedbackListIcon /></button>
        <button className={`${styles.cmdIconBtn} sl-icon-btn`} title="View List of Analysis" onClick={() => setShowAnalysisList(true)}><PfAnalysisListIcon /></button>
        <div className={styles.cmdSep} />
        <CommandDropdown def={analysisToolsDef} open={openDropdownId === "analysis-tools"} onToggle={() => setOpenDropdownId((p) => p === "analysis-tools" ? null : "analysis-tools")} onClose={() => setOpenDropdownId(null)} />
        <div className={styles.cmdSep} />
        <RichTextToolbar editorRef={editorRef} />
      </div>

      {/* ── Tab bar + body ────────────────────────────────────────────────── */}
      <ApplyFeedbackTabs
        activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} validationError={validationError}
        initData={initData} analysisData={analysisData} selectionHtml={selectionHtml}
        form={form} updateForm={updateForm} errorOptions={errorOptions} compensatorOptions={compensatorOptions}
        editorRef={editorRef} questions={questions} errors={errors} compensators={compensators}
        answers={answers} files={files} correctedItems={correctedItems} problems={problems}
        selectedRow={selectedRow} onRowClick={onRowClick} onCtx={onCtx}
        onInsertToDocument={(text, html) => {
          if (text || html) {
            sendMessage({ action: "INSERT_TEXT_AT_CURSOR", text, html });
            setInsertToast(true);
          }
        }}
      />

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div className={styles.footer}>
        <span className={styles.footerHint}>Feedback can be applied after completing all required fields.</span>
        <button style={cancelBtnS()} onClick={closeDialog}>Cancel</button>
        <button style={applyBtnS(footerBtnHover)} onMouseEnter={() => setFooterBtnHover(true)} onMouseLeave={() => setFooterBtnHover(false)} onClick={save}>
          Apply Feedback
        </button>
      </div>

      {/* ── Sub-dialogs + overlays ────────────────────────────────────────── */}
      <ApplyFeedbackSubDialogs
        openDialog={openDialog} closePortal={closePortal}
        questions={questions} setQuestions={setQuestions} setAnswers={setAnswers}
        setErrors={setErrors} setCompensators={setCompensators} setFiles={setFiles}
        setCorrectedItems={setCorrectedItems} errorOptions={errorOptions} compensatorOptions={compensatorOptions}
        errors={errors} correctedItems={correctedItems}
        problems={problems} setProblems={setProblems} feedbackSubject={form.feedbackSubject}
        solvePreselectedErrors={solvePreselectedErrors} solvePreselectedCompensators={solvePreselectedCompensators}
        pendingRemove={pendingRemove} setPendingRemove={setPendingRemove} confirmRemove={confirmRemove}
        showConfirm={showConfirm} setShowConfirm={setShowConfirm}
        setPendingPayload={setPendingPayload} saving={saving} confirmSave={confirmSave}
        ctxMenu={ctxMenu} setCtxMenu={setCtxMenu} ctxItems={ctxItems}
        showAnalysisList={showAnalysisList} setShowAnalysisList={setShowAnalysisList}
        showFeedbackList={showFeedbackList} setShowFeedbackList={setShowFeedbackList}
        viewAnalysis={viewAnalysis} setViewAnalysis={setViewAnalysis}
        viewFeedback={viewFeedback} setViewFeedback={setViewFeedback}
        availableAnalyses={availableAnalyses} availableFeedbacks={availableFeedbacks}
        sendMessage={sendMessage}
      />

      {infoMsg && (
        <InfoMessageCard
          title={infoMsg.title}
          text={infoMsg.text}
          onClose={() => setInfoMsg(null)}
        />
      )}

      {insertToast && (
        <InsertConfirmToast
          message="Inserted"
          onDismiss={() => setInsertToast(false)}
        />
      )}
    </div>
  );
}
