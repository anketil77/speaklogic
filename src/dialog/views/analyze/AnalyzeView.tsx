// src/dialog/views/AnalyzeView.tsx

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Spinner, makeStyles } from "@fluentui/react-components";
import { CheckmarkRegular } from "@fluentui/react-icons";
import { useDialogComm } from "@/dialog/hooks/useDialogComm";
import { QuestionPanel } from "@/dialog/views/analyze/panels/QuestionPanel";
import { AnalysisQuestionDialog } from "@/dialog/components/AnalysisQuestionDialog";
import { ViewQuestionDialog } from "@/dialog/components/ViewQuestionDialog";
import { RespondQuestionDialog } from "@/dialog/components/RespondQuestionDialog";
import { AnalysisTabForm } from "@/dialog/views/analyze/AnalysisTabForm";
import { AnswerPanel } from "@/dialog/views/analyze/panels/AnswerPanel";
import { ErrorPanel } from "@/dialog/views/analyze/panels/ErrorPanel";
import { ErrorIdentificationDialog } from "@/dialog/components/ErrorIdentificationDialog";
import { ViewErrorDialog } from "@/dialog/components/ViewErrorDialog";
import { CompensatorPanel } from "@/dialog/views/analyze/panels/CompensatorPanel";
import { CompensatorIdentificationDialog } from "@/dialog/components/CompensatorIdentificationDialog";
import { ViewCompensatorDialog } from "@/dialog/components/ViewCompensatorDialog";
import { ProblemPanel } from "@/dialog/views/analyze/panels/ProblemPanel";
import { ProblemIdentificationDialog } from "@/dialog/components/ProblemIdentificationDialog";
import { ViewProblemDialog } from "@/dialog/components/ViewProblemDialog";
import { SolveProblemDialog } from "@/dialog/components/SolveProblemDialog";
import { ViewAnswerDialog } from "@/dialog/components/ViewAnswerDialog";
import { AttachFilePanel } from "@/dialog/views/analyze/panels/AttachFilePanel";
import { AttachFileDialog } from "@/dialog/components/AttachFileDialog";
import { ViewFileInformationDialog } from "@/dialog/components/ViewFileInformationDialog";
import { RichTextToolbar } from "@/dialog/components/RichTextToolbar";
import { CommandDropdown } from "@/dialog/components/CommandDropdown";
import { HamburgerIcon } from "@/dialog/components/Icons";
import type { CmdDropdownDef } from "@/dialog/components/CommandDropdown";
import type {
  ProjectQuestion,
  ProjectError,
  ProjectCompensator,
  ProjectProblem,
  ProjectAnswer,
  AttachFileToProject,
  SaveAnalysisPayload,
} from "@/types/db";
import { nowDate, nowTime } from "@/db/db";
import { colors } from "@/styles/tokens";
import { loadSelectionConfig } from "@/dialog/views/SelectionConfigView";

// ─── Exact token values from Figma ───────────────────────────────────────────
const F = {
  borderInput: `1px solid #C7C7C7`,
  borderBox: `1px solid #E0E0E0`,
  radiusInput: "4px",
  fontMd: "12.2px",
  fontSm: "11px",
  fontLg: "15.6px",
  fontXs: "10.3px",
  colorPlaceholder: "#BDBDBD",
  bgCommandBar: "#F5F5F5",
  bgApplyBtn: "#0078D4",
  bgApplyTypeBtn: "#EBEBEB",
  sepColor: "#E0E0E0",
} as const;

const useStyles = makeStyles({
  root: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: colors.white,
    overflow: "hidden",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },

  // ── Title section (height ~78px)
  titleSection: {
    height: "78px",
    display: "flex",
    alignItems: "center",
    padding: "0 20px",
    gap: "12px",
    flexShrink: 0,
  },
  headerIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    background: colors.grey95,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  titles: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },
  titleText: {
    fontSize: F.fontLg,
    fontWeight: "700",
    lineHeight: "21px",
    letterSpacing: "-0.1px",
    color: colors.grey11,
  },
  subtitleText: {
    fontSize: "11.1px",
    fontWeight: "400",
    lineHeight: "17px",
    color: colors.grey38,
  },
  // ── Command bar (height 44px)
  commandBar: {
    height: "44px",
    background: F.bgCommandBar,
    display: "flex",
    alignItems: "center",
    padding: "0 12px",
    flexShrink: 0,
    gap: "0",
  },
  applyMainBtn: {
    height: "28px",
    minWidth: "105px",
    background: F.bgApplyBtn,
    borderRadius: "4px",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
    cursor: "pointer",
    padding: "0 10px",
    flexShrink: 0,
    fontFamily: "inherit",
    ":hover": { background: "#106EBE" },
  },
  applyMainBtnText: {
    fontSize: "11.6px",
    fontWeight: "700",
    color: colors.white,
    lineHeight: "14px",
  },
  cmdSep: {
    width: "1px",
    height: "20px",
    background: F.sepColor,
    margin: "0 8px",
    flexShrink: 0,
  },
  cmdIconBtn: {
    width: "28px",
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    background: "transparent",
    border: "none",
    borderRadius: "4px",
    padding: "0",
    flexShrink: 0,
    fontFamily: "inherit",
    ":hover": { background: "#EBEBEB" },
  },

  // ── Tab bar
  tabBar: {
    height: "36px",
    borderBottom: F.borderBox,
    display: "flex",
    alignItems: "flex-end",
    padding: "0 20px",
    flexShrink: 0,
    background: colors.white,
    gap: "0",
  },
  tabBtn: {
    position: "relative",
    height: "36px",
    display: "flex",
    alignItems: "center",
    padding: "0 12px",
    cursor: "pointer",
    background: "transparent",
    border: "none",
    fontSize: "12.2px",
    fontWeight: "400",
    lineHeight: "15px",
    color: colors.grey38,
    flexShrink: 0,
    fontFamily: "inherit",
    whiteSpace: "nowrap",
  },
  tabBtnActive: {
    fontWeight: "700",
    fontSize: "12.7px",
    color: colors.grey11,
  },
  tabActiveUnderline: {
    position: "absolute",
    bottom: "0",
    left: "12px",
    right: "12px",
    height: "2px",
    background: colors.azure42,
    borderRadius: "1px 1px 0 0",
  },

  // ── Body
  body: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
  },

  // ── Footer
  footer: {
    height: "57px",
    borderTop: F.borderBox,
    display: "flex",
    alignItems: "center",
    padding: "0 20px",
    gap: "8px",
    flexShrink: 0,
    background: colors.white,
  },
  footerHint: {
    flex: 1,
    fontSize: "10.3px",
    fontWeight: "400",
    color: colors.grey38,
    lineHeight: "15px",
  },
});

type TabValue = "analysis" | "questions" | "errors" | "compensators" | "files" | "problems" | "answers";
type QuestionDraft = Omit<ProjectQuestion, "id" | "analysisId" | "questionDate" | "questionTime">;
type AnswerDraft = Omit<ProjectAnswer, "id" | "analysisId" | "questionId">;
type ErrorDraft = Omit<ProjectError, "id" | "analysisId">;
type CompensatorDraft = Omit<ProjectCompensator, "id" | "analysisId">;
type ProblemDraft = Omit<ProjectProblem, "id" | "analysisId">;
type FileDraft = Omit<
  AttachFileToProject,
  "id" | "analysisId" | "feedbackId" | "flagId" | "articleId"
>;

// Left-side command-bar dropdowns only; right-side toolbar manages its own state.
type DropdownId = "selection" | "question" | "compensator" | "entity";

// ─── Inline-styled native controls to match Figma exactly ────────────────────

const btnStyle = (variant: "cancel" | "apply"): React.CSSProperties => {
  const base: React.CSSProperties = {
    height: "32px",
    borderRadius: "4px",
    fontSize: "12.3px",
    fontFamily: "inherit",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    whiteSpace: "nowrap",
    flexShrink: 0,
  };
  if (variant === "cancel")
    return {
      ...base,
      padding: "0 18px",
      background: colors.white,
      border: F.borderInput,
      color: colors.grey11,
      fontSize: "12.4px",
      fontWeight: "400",
    };
  return {
    ...base,
    padding: "0 20px",
    background: colors.azure42,
    border: "none",
    color: colors.white,
    fontSize: "12.7px",
    fontWeight: "700",
  };
};

// ─── Separator ────────────────────────────────────────────────────────────────
function CmdSep({ styles }: { styles: ReturnType<typeof useStyles> }) {
  return <div className={styles.cmdSep} />;
}

interface AnalyzeViewProps {
  mode: "selection" | "paragraph";
}

const ALL_TABS: { value: TabValue; label: string }[] = [
  { value: "analysis", label: "Analysis" },
  { value: "questions", label: "Analysis Question" },
  { value: "errors", label: "Errors" },
  { value: "compensators", label: "Compensators" },
  { value: "answers", label: "Answers" },
  { value: "files", label: "Attached Files" },
  { value: "problems", label: "Problems" },
];

export default function AnalyzeView({ mode: _mode }: AnalyzeViewProps) {
  const styles = useStyles();
  const { initData, sendMessage, closeDialog, retainSaved } = useDialogComm();
  const editorRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<TabValue>("analysis");
  const [openDropdown, setOpenDropdown] = useState<DropdownId | null>(null);
  type EntityViewMode = "both" | "analysis-only" | "entity-only";
  const [entityViewMode, setEntityViewMode] = useState<EntityViewMode>("both");
  const showEntityBox = entityViewMode !== "analysis-only";
  const entityOnlyMode = entityViewMode === "entity-only";
  const [toolbarCloseSignal, setToolbarCloseSignal] = useState(0);
  const cmdBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (cmdBarRef.current && !cmdBarRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  // Track text selected inside the Actual Analysis editor so "Identify Selection as Analysis Question" can pre-fill.
  useEffect(() => {
    function onSelChange() {
      const sel = window.getSelection();
      const text = sel?.toString().trim() ?? "";
      if (text && editorRef.current && sel?.anchorNode && editorRef.current.contains(sel.anchorNode)) {
        lastAnalysisSelectionRef.current = text;
      }
    }
    document.addEventListener("selectionchange", onSelChange);
    return () => document.removeEventListener("selectionchange", onSelChange);
  }, []); // editorRef is a stable ref

  const toggleDd = useCallback((id: DropdownId) => {
    setOpenDropdown((prev) => {
      const next = prev === id ? null : id;
      if (next !== null) setToolbarCloseSignal((s) => s + 1);
      return next;
    });
  }, []);

  const closeDd = useCallback(() => setOpenDropdown(null), []);

  const [showAnswersTab, setShowAnswersTab] = useState(false);
  const [addQuestionInitial, setAddQuestionInitial] = useState<string | null>(null);
  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState<number | null>(null);
  const [selectedAnswerIdx, setSelectedAnswerIdx] = useState<number | null>(null);
  const lastAnalysisSelectionRef = useRef<string>("");

  const openAddQuestion = useCallback((prefilledText: string | null = null) => {
    setAddQuestionInitial(prefilledText);
    setShowAddQuestion(true);
    setActiveTab("questions");
    closeDd();
  }, [closeDd]);

  const cmdDropdowns: CmdDropdownDef[] = [
    {
      id: "selection",
      iconSrc: "assets/icons/selection.svg",
      title: "Selection",
      items: [
        { label: "Identify Selection as Error", iconSrc: "assets/icons/compensator-error.svg", enabled: true, onClick: () => { setActiveTab("errors"); closeDd(); } },
        { label: "Identify Selection as Analysis Question", iconSrc: "assets/icons/analysis-question.svg", enabled: true, onClick: () => openAddQuestion(lastAnalysisSelectionRef.current || null) },
        { label: "Identify Selection as Compensator", iconSrc: "assets/icons/selection.svg", enabled: true, onClick: () => { setActiveTab("compensators"); closeDd(); } },
      ],
    },
    {
      id: "question",
      iconSrc: "assets/icons/question.svg",
      title: "Question",
      items: [
        { label: "Add Analysis Question", iconSrc: "assets/icons/add-analysis-question.svg", enabled: true, onClick: () => openAddQuestion(null) },
        {
          label: "Respond Analysis Question",
          iconSrc: "assets/icons/analysis-question.svg",
          enabled: selectedQuestionIdx !== null,
          onClick: () => {
            if (selectedQuestionIdx !== null && questions[selectedQuestionIdx]) {
              setRespondQuestion({ q: questions[selectedQuestionIdx], idx: selectedQuestionIdx });
              closeDd();
            }
          },
        },
        { label: "Show List Answered Question", iconSrc: "assets/icons/list-answered-question.svg", enabled: !showAnswersTab, onClick: () => { setShowAnswersTab(true); setActiveTab("answers"); closeDd(); } },
        { label: "Hide List Answered Question", iconSrc: "assets/icons/hide-list-answered-question.svg", enabled: showAnswersTab, onClick: () => { setShowAnswersTab(false); setActiveTab((prev) => prev === "answers" ? "questions" : prev); closeDd(); } },
        {
          label: "View Selected Answer",
          iconSrc: "assets/icons/view-selected-answer.svg",
          enabled: selectedAnswerIdx !== null,
          onClick: () => {
            if (selectedAnswerIdx !== null && answers[selectedAnswerIdx]) {
              setViewAnswer(answers[selectedAnswerIdx]);
              closeDd();
            }
          },
        },
      ],
    },
    {
      id: "compensator",
      iconSrc: "assets/icons/compensator-error.svg",
      title: "Compensator and Error",
      items: [
        { label: "Identify Error", iconSrc: "assets/icons/identify-error.svg", enabled: true, onClick: () => { setActiveTab("errors"); closeDd(); } },
        { label: "Identify Compensator", iconSrc: "assets/icons/selection.svg", enabled: true, onClick: () => { setActiveTab("compensators"); closeDd(); } },
        { label: "Identify Problem", iconSrc: "assets/icons/identify-problem.svg", enabled: true, onClick: () => { setActiveTab("problems"); closeDd(); } },
      ],
    },
    {
      id: "entity",
      iconSrc: "assets/icons/entity-under-analysis.svg",
      title: "Entity Under Analysis",
      items: [
        // C# PanelVisibility.Panel2 — hide entity text, show analysis form only
        { label: "Hide Entity Under Analysis", iconSrc: "assets/icons/hide-entity-under-analysis.svg", enabled: entityViewMode !== "analysis-only", onClick: () => { setEntityViewMode("analysis-only"); closeDd(); } },
        // C# PanelVisibility.Both — show both entity text and analysis form
        { label: "Show Entity Under Analysis", iconSrc: "assets/icons/entity-under-analysis.svg", enabled: entityViewMode !== "both", onClick: () => { setEntityViewMode("both"); closeDd(); } },
        // C# PanelVisibility.Panel2 — same as Hide Entity (hides entity, shows analysis); also jump to analysis tab
        { label: "Show Analysis Only", iconSrc: "assets/icons/analysis.svg", enabled: entityViewMode !== "analysis-only", onClick: () => { setEntityViewMode("analysis-only"); setActiveTab("analysis"); closeDd(); } },
        // C# PanelVisibility.Panel1 — show entity text only, hide entire analysis form and tabs
        { label: "Show Entity Under Analysis Only", iconSrc: "assets/icons/show-entity-under-analysis-only.svg", enabled: entityViewMode !== "entity-only", onClick: () => { setEntityViewMode("entity-only"); closeDd(); } },
      ],
    },
  ];

  const [form, setForm] = useState({ fromPerson: "", analysisSubject: "", actualAnalysis: "" });
  const [validationError, setValidationError] = useState<string | null>(null);

  // Pre-fill From Person from Communication Configuration on first load
  useEffect(() => {
    if (initData?.communicationPersonName) {
      setForm((prev) => prev.fromPerson ? prev : { ...prev, fromPerson: initData.communicationPersonName! });
    }
  }, [initData]);

  function updateForm<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setValidationError(null);
  }

  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [viewQuestion, setViewQuestion] = useState<QuestionDraft | null>(null);
  const [respondQuestion, setRespondQuestion] = useState<{ q: QuestionDraft; idx: number } | null>(null);
  const [showAddError, setShowAddError] = useState(false);
  const [viewError, setViewError] = useState<ErrorDraft | null>(null);
  const [showAddCompensator, setShowAddCompensator] = useState(false);
  const [showAddProblem, setShowAddProblem] = useState(false);
  const [viewProblem, setViewProblem] = useState<ProblemDraft | null>(null);
  const [solveProblem, setSolveProblem] = useState<{ problem: ProblemDraft; idx: number } | null>(null);
  const [viewAnswer, setViewAnswer] = useState<AnswerDraft | null>(null);
  const [showAddFile, setShowAddFile] = useState(false);
  const [viewFile, setViewFile] = useState<FileDraft | null>(null);
  const [viewCompensator, setViewCompensator] = useState<CompensatorDraft | null>(null);
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [answers, setAnswers] = useState<AnswerDraft[]>([]);
  const [errors, setErrors] = useState<ErrorDraft[]>([]);
  const [compensators, setCompensators] = useState<CompensatorDraft[]>([]);
  const [problems, setProblems] = useState<ProblemDraft[]>([]);
  const [files, setFiles] = useState<FileDraft[]>([]);

  // Pre-filled values for CompensatorIdentificationDialog
  const [prefilledError, setPrefilledError] = useState<string | undefined>(undefined);
  const [prefilledApplication, setPrefilledApplication] = useState<string | undefined>(undefined);
  const [prefilledCompensatorDescription, setPrefilledCompensatorDescription] = useState<string | undefined>(undefined);
  const [prefilledActualCompensatorText, setPrefilledActualCompensatorText] = useState<string | undefined>(undefined);
  // Pre-filled actual error text from Entity Under Analysis right-click context menu
  const [prefilledErrorText, setPrefilledErrorText] = useState<string | undefined>(undefined);
  const [prefilledErrorDescription, setPrefilledErrorDescription] = useState<string | undefined>(undefined);

  // Right-click "Identify Selection as Error" from the Entity Under Analysis box
  const handleContextMenuError = useCallback((selectedText: string) => {
    const cfg = loadSelectionConfig();
    if (cfg.selectedErrorAsActualError) {
      setPrefilledErrorText(selectedText || undefined);
      setPrefilledErrorDescription(undefined);
    } else {
      setPrefilledErrorText(undefined);
      setPrefilledErrorDescription(selectedText || undefined);
    }
    setShowAddError(true);
  }, []);

  const addQuestion = useCallback((q: QuestionDraft) => setQuestions((prev) => [...prev, q]), []);
  const removeQuestion = useCallback((i: number) => setQuestions((prev) => prev.filter((_, idx) => idx !== i)), []);

  const addAnswer = useCallback(
    (questionIdx: number, info: { informationAnswerPointTo: string; actualAnswer: string }) => {
      const q = questions[questionIdx];
      if (!q) return;
      const draft: AnswerDraft = {
        answerNumber: answers.length + 1,
        actualQuestion: q.actualQuestion,
        entityQuestionPointTo: q.entityQuestionPointTo,
        informationAnswerPointTo: info.informationAnswerPointTo,
        actualAnswer: info.actualAnswer,
        answerDate: nowDate(),
        answerTime: nowTime(),
      };
      setAnswers((prev) => [...prev, draft]);
      setQuestions((prev) =>
        prev.map((item, i) => (i === questionIdx ? { ...item, responseStatus: "Answered" } : item))
      );
    },
    [questions, answers.length]
  );

  const handleRespond = useCallback((info: { informationAnswerPointTo: string; actualAnswer: string }) => {
    if (!respondQuestion) return;
    addAnswer(respondQuestion.idx, info);
    setRespondQuestion(null);
  }, [respondQuestion, addAnswer]);

  const removeAnswer = useCallback((i: number) => setAnswers((prev) => prev.filter((_, idx) => idx !== i)), []);
  const addError = useCallback((e: ErrorDraft) => setErrors((prev) => [...prev, e]), []);
  const removeError = useCallback((i: number) => setErrors((prev) => prev.filter((_, idx) => idx !== i)), []);

  const addCompensator = useCallback((c: CompensatorDraft) => setCompensators((prev) => [...prev, c]), []);
  const removeCompensator = useCallback((i: number) => setCompensators((prev) => prev.filter((_, idx) => idx !== i)), []);

  const addProblem = useCallback((p: ProblemDraft) => setProblems((prev) => [...prev, p]), []);
  const removeProblem = useCallback((i: number) => setProblems((prev) => prev.filter((_, idx) => idx !== i)), []);

  const addFile = useCallback((f: FileDraft) => setFiles((prev) => [...prev, f]), []);
  const removeFile = useCallback((i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i)), []);

  // "Identify Compensator For Error": switch to compensators tab and open add dialog with prefill
  const handleIdentifyCompensator = useCallback((errorText: string, fromActualCommunication: string) => {
    setPrefilledError(errorText);
    setPrefilledApplication(fromActualCommunication);
    setShowAddCompensator(true);
    setActiveTab("compensators");
  }, []);

  // Right-click "Identify Selection as Compensator" from the Actual Analysis editor.
  const handleContextMenuCompensator = useCallback((selectedText: string) => {
    const cfg = loadSelectionConfig();
    setPrefilledError(undefined);
    setPrefilledApplication(initData?.applicationName || undefined);
    if (cfg.selectedCompensatorAsActual) {
      setPrefilledActualCompensatorText(selectedText || undefined);
      setPrefilledCompensatorDescription(undefined);
    } else {
      setPrefilledActualCompensatorText(undefined);
      setPrefilledCompensatorDescription(selectedText || undefined);
    }
    setShowAddCompensator(true);
  }, [initData?.applicationName]);


  const save = useCallback(
    (action: "ApplyAnalysisAsFeedback" | "ProvideFeedbackWithAnalysis" | "RetainAnalysisAsNeed") => {
      if (!initData) return;

      const missing: string[] = [];
      if (!form.fromPerson.trim()) missing.push("From Person");
      if (!form.analysisSubject.trim()) missing.push("Analysis Subject");
      const plainAnalysis = form.actualAnalysis.replace(/<[^>]*>/g, "").trim();
      if (!plainAnalysis) missing.push("Actual Analysis");
      if (missing.length > 0) {
        setValidationError(`Required: ${missing.join(", ")}`);
        setActiveTab("analysis");
        return;
      }
      setValidationError(null);

      sendMessage({
        action: "SAVE_ANALYSIS",
        payload: {
          analysis: {
            entityUnderAnalysis: initData.selection,
            fromPerson: form.fromPerson,
            analysisSubject: form.analysisSubject,
            actualAnalysis: form.actualAnalysis,
            whatToDoWithAnalysis: action,
            source: initData.source,
            applicationName: initData.applicationName,
            communicationFunction: initData.communicationFunction,
            communicationSignal: initData.communicationSignal,
            projectName: initData.projectName,
            analysisDate: nowDate(),
            analysisTime: nowTime(),
            personName: initData.personName,
            personEmail: initData.personEmail,
            selectionType: initData.mode === "selection" ? "Selection" : "Paragraph",
            errorCount: errors.length,
            questionCount: questions.length,
            compensatorCount: compensators.length,
            answerCount: answers.length,
            problemCount: problems.length,
            correctedItemCount: 0,
          },
          errors: errors.map((e) => ({ ...e, errorDate: nowDate(), errorTime: nowTime() })),
          questions: questions.map((q) => ({ ...q, questionDate: nowDate(), questionTime: nowTime() })),
          answers,
          compensators: compensators.map((c) => ({
            ...c,
            compensatorDate: nowDate(),
            compensatorTime: nowTime(),
          })),
          problems,
          files: files.map((f) => ({ ...f, fileDate: f.fileDate || nowDate(), fileTime: f.fileTime || nowTime() })),
        } satisfies SaveAnalysisPayload,
      });

    },
    [form, questions, answers, errors, compensators, problems, files, initData]
  );

  const tabCount = useMemo(
    () => ({
      questions: questions.length,
      errors: errors.length,
      compensators: compensators.length,
      files: files.length,
      problems: problems.length,
      answers: answers.length,
    }),
    [questions.length, errors.length, compensators.length, files.length, problems.length, answers.length]
  );

  const visibleTabs = useMemo(
    () => ALL_TABS.filter((t) => t.value !== "answers" || showAnswersTab),
    [showAnswersTab]
  );

  if (!initData) {
    return (
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}
      >
        <Spinner label="Loading..." />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {/* ── Title section ─────────────────────────────────────────────────── */}
      <div className={styles.titleSection}>
        <div className={styles.headerIcon}>
          <HamburgerIcon />
        </div>
        <div className={styles.titles}>
          <span className={styles.titleText}>Analysis</span>
          <span className={styles.subtitleText}>
            Review selected content, define the analysis subject, and prepare structured feedback.
          </span>
        </div>
      </div>

      {/* ── Command bar ───────────────────────────────────────────────────── */}
      <div className={styles.commandBar} ref={cmdBarRef}>
        {/* Apply main button */}
        <button className={styles.applyMainBtn} onClick={() => save("ApplyAnalysisAsFeedback")}>
          <CheckmarkRegular style={{ fontSize: "13px", color: colors.white }} />
          <span className={styles.applyMainBtnText}>Apply</span>
        </button>

        <CmdSep styles={styles} />

        {/* Action icons: Provide Feedback, Retain */}
        <button
          className={styles.cmdIconBtn}
          title="Provide Feedback"
          onClick={() => save("ProvideFeedbackWithAnalysis")}
        >
          <img
            src="assets/icons/provide-feedback.svg"
            width={16}
            height={15}
            alt="Provide Feedback"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </button>
        <button
          className={styles.cmdIconBtn}
          title="Retain Analysis as Need"
          onClick={() => save("RetainAnalysisAsNeed")}
        >
          <img
            src="assets/icons/retain-analysis.svg"
            width={14}
            height={14}
            alt="Retain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </button>

        <CmdSep styles={styles} />

        {cmdDropdowns.map((dd) => (
          <CommandDropdown
            key={dd.id}
            def={dd}
            open={openDropdown === dd.id}
            onToggle={() => toggleDd(dd.id as DropdownId)}
            onClose={closeDd}
          />
        ))}

        <CmdSep styles={styles} />

        {/* ── Right-side formatting toolbar ────────────────────────────────── */}
        <RichTextToolbar
          editorRef={editorRef}
          closeSignal={toolbarCloseSignal}
          onOpen={closeDd}
        />
      </div>

      {/* ── Tab bar — hidden in entity-only mode (C# PanelVisibility.Panel1) ─ */}
      <div className={styles.tabBar} style={entityOnlyMode ? { display: "none" } : undefined}>
        {visibleTabs.map(({ value, label }) => {
          const count = tabCount[value] ?? 0;
          const isActive = activeTab === value;
          return (
            <button
              key={value}
              className={`${styles.tabBtn}${isActive ? ` ${styles.tabBtnActive}` : ""}`}
              onClick={() => setActiveTab(value)}
            >
              {count > 0 ? `${label} (${count})` : label}
              {isActive && <span className={styles.tabActiveUnderline} />}
            </button>
          );
        })}
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className={styles.body} style={!entityOnlyMode && activeTab !== "analysis" ? { padding: 0 } : undefined}>
        {/* Analysis tab — always mounted so editorRef stays valid; also shown in entity-only mode */}
        <div
          style={{
            display: activeTab === "analysis" || entityOnlyMode ? "flex" : "none",
            flexDirection: "column",
            width: "100%",
          }}
        >
          <AnalysisTabForm
            selection={initData.selection}
            peopleList={initData.peopleList ?? []}
            showEntityBox={showEntityBox}
            entityOnlyMode={entityOnlyMode}
            fromPerson={form.fromPerson}
            onFromPersonChange={(v) => updateForm("fromPerson", v)}
            analysisSubject={form.analysisSubject}
            onAnalysisSubjectChange={(v) => updateForm("analysisSubject", v)}
            actualAnalysis={form.actualAnalysis}
            onActualAnalysisChange={(v) => updateForm("actualAnalysis", v)}
            editorRef={editorRef}
            onContextMenuQuestion={(text) => {
              // Open question dialog without switching tabs — user stays on Analysis tab.
              setAddQuestionInitial(text || null);
              setShowAddQuestion(true);
            }}
            onContextMenuCompensator={handleContextMenuCompensator}
            onContextMenuError={handleContextMenuError}
          />
        </div>

        {!entityOnlyMode && activeTab === "questions" && (
          <QuestionPanel
            items={questions}
            onRemove={removeQuestion}
            onOpenAdd={() => setShowAddQuestion(true)}
            onOpenView={(q) => setViewQuestion(q)}
            onOpenRespond={(q, idx) => setRespondQuestion({ q, idx })}
            onSelectionChange={setSelectedQuestionIdx}
          />
        )}
        {!entityOnlyMode && activeTab === "errors" && (
          <ErrorPanel
            items={errors}
            onOpenAdd={() => setShowAddError(true)}
            onOpenView={(e) => setViewError(e)}
            onRemove={removeError}
            onIdentifyCompensator={handleIdentifyCompensator}
          />
        )}
        {!entityOnlyMode && activeTab === "compensators" && (
          <CompensatorPanel
            items={compensators}
            onOpenAdd={() => setShowAddCompensator(true)}
            onOpenView={(c) => setViewCompensator(c)}
            onRemove={removeCompensator}
          />
        )}
        {!entityOnlyMode && activeTab === "files" && (
          <AttachFilePanel
            items={files}
            onAdd={addFile}
            onRemove={removeFile}
            onOpenAdd={() => setShowAddFile(true)}
            onOpenView={(f) => setViewFile(f)}
          />
        )}
        {!entityOnlyMode && activeTab === "problems" && (
          <ProblemPanel
            items={problems}
            onOpenAdd={() => setShowAddProblem(true)}
            onOpenView={(p) => setViewProblem(p)}
            onOpenSolve={(p, idx) => setSolveProblem({ problem: p, idx })}
            onRemove={removeProblem}
          />
        )}
        {!entityOnlyMode && activeTab === "answers" && (
          <AnswerPanel
            items={answers}
            onOpenView={(a) => setViewAnswer(a)}
            onRemove={removeAnswer}
            onSelectionChange={setSelectedAnswerIdx}
          />
        )}
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div className={styles.footer}>
        {validationError ? (
          <span style={{ flex: 1, fontSize: "10.3px", color: "#D13438", lineHeight: "15px" }}>
            {validationError}
          </span>
        ) : (
          <span className={styles.footerHint}>Analysis can be applied as feedback after review.</span>
        )}
        <button style={btnStyle("cancel")} onClick={closeDialog}>
          Cancel
        </button>
        <button style={btnStyle("apply")} onClick={() => save("ApplyAnalysisAsFeedback")}>
          Apply Analysis
        </button>
      </div>

      {/* ── Analysis Question dialogs ───────────────────────────────── */}
      {showAddQuestion && (
        <AnalysisQuestionDialog
          itemCount={questions.length}
          onAdd={addQuestion}
          onClose={() => { setShowAddQuestion(false); setAddQuestionInitial(null); }}
          initialQuestion={addQuestionInitial ?? undefined}
        />
      )}
      {viewQuestion && (
        <ViewQuestionDialog
          question={viewQuestion}
          onClose={() => setViewQuestion(null)}
        />
      )}
      {respondQuestion && (
        <RespondQuestionDialog
          question={respondQuestion.q}
          onRespond={handleRespond}
          onClose={() => setRespondQuestion(null)}
        />
      )}

      {/* ── Error dialogs ───────────────────────────────────────────── */}
      {showAddError && (
        <ErrorIdentificationDialog
          itemCount={errors.length}
          onAdd={addError}
          onClose={() => { setShowAddError(false); setPrefilledErrorText(undefined); setPrefilledErrorDescription(undefined); }}
          prefilledActualError={prefilledErrorText}
          prefilledDescription={prefilledErrorDescription}
          prefilledFromApplication={initData?.applicationName || undefined}
        />
      )}
      {viewError && (
        <ViewErrorDialog
          error={viewError}
          onClose={() => setViewError(null)}
        />
      )}

      {/* ── Problem dialogs ─────────────────────────────────────────────── */}
      {showAddProblem && (
        <ProblemIdentificationDialog
          itemCount={problems.length}
          existingErrors={errors.map((e) => e.actualError)}
          onAdd={addProblem}
          onClose={() => setShowAddProblem(false)}
        />
      )}
      {viewProblem && (
        <ViewProblemDialog
          problem={viewProblem}
          onClose={() => setViewProblem(null)}
        />
      )}
      {solveProblem && (
        <SolveProblemDialog
          problem={solveProblem.problem}
          existingErrors={errors.map((e) => e.actualError)}
          existingCompensators={compensators.map((c) => c.actualCompensator)}
          onSolve={(solution) => {
            sendMessage({ action: "SAVE_PROBLEM_SOLUTION", payload: { ...solution, problemIdx: solveProblem.idx } });
            if (solution.removeProblem) removeProblem(solveProblem.idx);
          }}
          onClose={() => setSolveProblem(null)}
        />
      )}
      {viewAnswer && (
        <ViewAnswerDialog
          answer={viewAnswer}
          onClose={() => setViewAnswer(null)}
        />
      )}

      {/* ── Compensator dialogs ─────────────────────────────────────────── */}
      {showAddCompensator && (
        <CompensatorIdentificationDialog
          itemCount={compensators.length}
          existingErrors={errors.map((e) => e.actualError)}
          existingApplications={errors.map((e) => e.fromActualCommunication)}
          onAdd={addCompensator}
          onClose={() => { setShowAddCompensator(false); setPrefilledError(undefined); setPrefilledApplication(undefined); setPrefilledCompensatorDescription(undefined); setPrefilledActualCompensatorText(undefined); }}
          prefilledError={prefilledError}
          prefilledApplication={prefilledApplication}
          prefilledDescription={prefilledCompensatorDescription}
          prefilledActualCompensator={prefilledActualCompensatorText}
        />
      )}
      {viewCompensator && (
        <ViewCompensatorDialog
          compensator={viewCompensator}
          onClose={() => setViewCompensator(null)}
        />
      )}

      {/* ── Attach File dialogs ─────────────────────────────────────────── */}
      {showAddFile && (
        <AttachFileDialog
          onAdd={addFile}
          onClose={() => setShowAddFile(false)}
        />
      )}
      {viewFile && (
        <ViewFileInformationDialog
          file={viewFile}
          onClose={() => setViewFile(null)}
        />
      )}

      {/* ── Retain saved success overlay ────────────────────────────────── */}
      {retainSaved && (
        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.18)", zIndex: 300 }}>
          <div style={{ width: 380, background: "#FFFFFF", borderRadius: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", padding: "28px 28px 20px", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#1B1B1B", marginBottom: 10 }}>Analysis Saved</div>
            <div style={{ fontSize: "12.5px", color: "#444", lineHeight: "19px", marginBottom: 22 }}>
              Your analysis has been saved.
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => sendMessage({ action: "CLOSE" })}
                style={{ height: 30, padding: "0 20px", background: "#0078D4", border: "none", borderRadius: 4, fontSize: "12.3px", fontWeight: 700, fontFamily: "inherit", color: "#FFFFFF", cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
