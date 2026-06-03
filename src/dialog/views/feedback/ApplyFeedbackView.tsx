// src/dialog/views/feedback/ApplyFeedbackView.tsx

import React, { useRef, useState, useCallback, useEffect, useMemo } from "react";
import ReactDOM from "react-dom";
import { Spinner, makeStyles } from "@fluentui/react-components";
import { CheckmarkRegular } from "@fluentui/react-icons";
import { useDialogComm } from "@/dialog/hooks/useDialogComm";
import { RichTextToolbar } from "@/dialog/components/RichTextToolbar";
import { RichEditor } from "@/dialog/components/RichEditor";
import {
  HamburgerIcon, PfFeedbackListIcon, PfAnalysisListIcon,
} from "@/dialog/components/Icons";
import { PanelContextMenu } from "@/dialog/components/PanelContextMenu";
import type { PanelMenuEntry } from "@/dialog/components/PanelContextMenu";
import { AnalysisQuestionDialog } from "@/dialog/components/AnalysisQuestionDialog";
import { ViewQuestionDialog } from "@/dialog/components/ViewQuestionDialog";
import { RespondQuestionDialog } from "@/dialog/components/RespondQuestionDialog";
import type { AnswerInfo } from "@/dialog/components/RespondQuestionDialog";
import { ErrorIdentificationDialog } from "@/dialog/components/ErrorIdentificationDialog";
import { ViewErrorDialog } from "@/dialog/components/ViewErrorDialog";
import { CompensatorIdentificationDialog } from "@/dialog/components/CompensatorIdentificationDialog";
import { ViewCompensatorDialog } from "@/dialog/components/ViewCompensatorDialog";
import { ViewAnswerDialog } from "@/dialog/components/ViewAnswerDialog";
import { AttachFileDialog } from "@/dialog/components/AttachFileDialog";
import { ViewFileInformationDialog } from "@/dialog/components/ViewFileInformationDialog";
import { CorrectedItemDialog } from "@/dialog/components/CorrectedItemDialog";
import type { CorrectedItemDraft } from "@/dialog/components/CorrectedItemDialog";
import { AnalysisListPortal } from "@/dialog/components/AnalysisListPortal";
import { FeedbackListPortal } from "@/dialog/components/FeedbackListPortal";
import { ViewAnalysisDialog } from "@/dialog/components/ViewAnalysisDialog";
import { ViewFeedbackDialog } from "@/dialog/components/ViewFeedbackDialog";
import { CommandDropdown } from "@/dialog/components/CommandDropdown";
import type { CmdDropdownDef } from "@/dialog/components/CommandDropdown";
import { PanelTable, PanelTableCol } from "@/dialog/components/PanelTable";
import { nowDate, nowTime } from "@/db/db";
import { colors } from "@/styles/tokens";
import { dbg } from "@/debug/log";
import type { SaveFeedbackPayload, ProjectQuestion, ProjectError, ProjectCompensator, ProjectAnswer, AttachFileToProject, ProjectAnalysis, ProjectFeedback } from "@/types/db";

// ─── Draft types ──────────────────────────────────────────────────────────────
type QuestionDraft = Omit<ProjectQuestion, "id" | "analysisId" | "questionDate" | "questionTime">;
type AnswerDraft = Omit<ProjectAnswer, "id" | "analysisId" | "questionId">;
type ErrorDraft = Omit<ProjectError, "id" | "analysisId">;
type CompensatorDraft = Omit<ProjectCompensator, "id" | "analysisId">;
type FileDraft = Omit<AttachFileToProject, "id" | "analysisId" | "feedbackId" | "flagId" | "articleId">;

// ─── Context menu state ────────────────────────────────────────────────────────
type CtxMenu = { tab: TabValue; idx: number | null; x: number; y: number };

// ─── Open dialog discriminated union ─────────────────────────────────────────
type OpenDialog =
  | { type: "addQuestion"; initialQuestion?: string }
  | { type: "viewQuestion"; item: QuestionDraft }
  | { type: "respondQuestion"; item: QuestionDraft; idx: number }
  | { type: "addError" }
  | { type: "viewError"; item: ErrorDraft }
  | { type: "compensatorForError"; error: string; app: string; description?: string }
  | { type: "viewCompensator"; item: CompensatorDraft }
  | { type: "viewAnswer"; item: AnswerDraft }
  | { type: "addFile" }
  | { type: "viewFile"; item: FileDraft }
  | { type: "addCorrectedItem" }
  | { type: "editCorrectedItem"; item: CorrectedItemDraft; idx: number }
  | { type: "viewCorrectedItem"; item: CorrectedItemDraft };

// ─── Design tokens ────────────────────────────────────────────────────────────
const F = {
  borderInput: `1px solid #C7C7C7`,
  borderBox: `1px solid #E0E0E0`,
  bgCommandBar: "#F5F5F5",
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
  titles: { flex: 1, display: "flex", flexDirection: "column", gap: "3px" },
  titleText: { fontSize: "15.6px", fontWeight: "700", lineHeight: "21px", letterSpacing: "-0.1px", color: colors.grey11 },
  subtitleText: { fontSize: "11.1px", fontWeight: "400", lineHeight: "17px", color: colors.grey38 },
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
    minWidth: "120px",
    background: "#0078D4",
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
  applyMainBtnText: { fontSize: "11.6px", fontWeight: "700", color: colors.white, lineHeight: "14px" },
  cmdSep: { width: "1px", height: "20px", background: F.sepColor, margin: "0 8px", flexShrink: 0 },
  cmdIconBtn: {
    width: "28px",
    height: "28px",
    borderRadius: "3px",
    border: "none",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    padding: 0,
  },
  tabBar: {
    height: "36px",
    borderBottom: F.borderBox,
    display: "flex",
    alignItems: "flex-end",
    padding: "0 20px",
    flexShrink: 0,
    background: colors.white,
    overflowX: "auto",
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
  tabBtnActive: { fontWeight: "700", fontSize: "12.7px", color: colors.grey11 },
  tabActiveUnderline: {
    position: "absolute",
    bottom: "0",
    left: "12px",
    right: "12px",
    height: "2px",
    background: colors.azure42,
    borderRadius: "1px 1px 0 0",
  },
  body: { flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column" },
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
  footerHint: { flex: 1, fontSize: "10.3px", fontWeight: "400", color: colors.grey38, lineHeight: "15px" },
});

type TabValue = "feedback" | "questions" | "errors" | "compensators" | "answers" | "files" | "corrected";

const TABS: { value: TabValue; label: string }[] = [
  { value: "feedback", label: "Feedback" },
  { value: "questions", label: "Analysis Question" },
  { value: "errors", label: "Errors" },
  { value: "compensators", label: "Compensators" },
  { value: "answers", label: "Answers" },
  { value: "corrected", label: "Corrected Items" },
  { value: "files", label: "Attached Files" },
];

// ─── Shared inline styles ─────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%", height: "32px", border: "1px solid #C7C7C7", borderRadius: "4px",
  padding: "0 11px", fontSize: "12.2px", fontFamily: "inherit", color: colors.grey11,
  background: colors.white, outline: "none", boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  padding: "0 32px 0 11px",
  appearance: "none" as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23616161' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat" as const,
  backgroundPosition: "right 11px center",
  cursor: "pointer",
};

const readonlyDisplayStyle: React.CSSProperties = {
  flex: 1, height: "32px", border: "1px solid #E0E0E0", borderRadius: "4px",
  padding: "0 11px", fontSize: "12.2px", fontFamily: "inherit", color: colors.grey38,
  background: "#F9F9F9", display: "flex", alignItems: "center",
  overflow: "hidden", whiteSpace: "nowrap", boxSizing: "border-box",
};

const rowStyle: React.CSSProperties = { display: "flex", alignItems: "center", minHeight: "32px", marginBottom: "14px" };
const rowTopStyle: React.CSSProperties = { display: "flex", alignItems: "flex-start", marginBottom: "14px" };
const labelStyle: React.CSSProperties = { width: "170px", minWidth: "170px", fontSize: "11.8px", fontWeight: "700", color: colors.grey11, lineHeight: "14px", flexShrink: 0 };
const labelTopStyle: React.CSSProperties = { ...labelStyle, paddingTop: "9px" };

const btnStyle = (variant: "cancel" | "apply"): React.CSSProperties => ({
  height: "32px", borderRadius: "4px", fontSize: "12.3px", fontFamily: "inherit",
  cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
  whiteSpace: "nowrap", flexShrink: 0,
  ...(variant === "cancel"
    ? { padding: "0 18px", background: colors.white, border: "1px solid #C7C7C7", color: colors.grey11, fontWeight: "400" }
    : { padding: "0 20px", background: colors.azure42, border: "none", color: colors.white, fontWeight: "700" }),
});

// ─── Tab column definitions ────────────────────────────────────────────────────
const AFV_Q_COLS: PanelTableCol<string[]>[] = [
  { header: "#", width: "8%", render: (r) => r[0] },
  { header: "Question", width: "44%", render: (r) => r[1], truncate: true },
  { header: "Points To", width: "30%", render: (r) => r[2], truncate: true },
  { header: "Status", width: "18%", render: (r) => r[3], truncate: true },
];
const AFV_ERR_COLS: PanelTableCol<string[]>[] = [
  { header: "#", width: "8%", render: (r) => r[0] },
  { header: "Actual Error", width: "38%", render: (r) => r[1], truncate: true },
  { header: "From Communication", width: "30%", render: (r) => r[2], truncate: true },
  { header: "Points To", width: "24%", render: (r) => r[3], truncate: true },
];
const AFV_COMP_COLS: PanelTableCol<string[]>[] = [
  { header: "#", width: "8%", render: (r) => r[0] },
  { header: "Compensator", width: "36%", render: (r) => r[1], truncate: true },
  { header: "Error Replaced", width: "28%", render: (r) => r[2], truncate: true },
  { header: "In Communication", width: "28%", render: (r) => r[3], truncate: true },
];
const AFV_ANS_COLS: PanelTableCol<string[]>[] = [
  { header: "#", width: "8%", render: (r) => r[0] },
  { header: "Question", width: "30%", render: (r) => r[1], truncate: true },
  { header: "Answer", width: "40%", render: (r) => r[2], truncate: true },
  { header: "Points To", width: "22%", render: (r) => r[3], truncate: true },
];
const AFV_FILE_COLS: PanelTableCol<string[]>[] = [
  { header: "#", width: "8%", render: (r) => r[0] },
  { header: "File Name", width: "50%", render: (r) => r[1], truncate: true },
  { header: "Type", width: "20%", render: (r) => r[2], truncate: true },
  { header: "Date", width: "22%", render: (r) => r[3], truncate: true },
];
const AFV_CI_COLS: PanelTableCol<string[]>[] = [
  { header: "#", width: "8%", render: (r) => r[0] },
  { header: "Error Selection", width: "36%", render: (r) => r[1], truncate: true },
  { header: "Compensator", width: "36%", render: (r) => r[2], truncate: true },
  { header: "Corrected", width: "20%", render: (r) => r[3], truncate: true },
];

// ─── Remove confirmation overlay ──────────────────────────────────────────────
function RemoveOverlay({ message, onYes, onNo }: { message: string; onYes: () => void; onNo: () => void }) {
  return ReactDOM.createPortal(
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: colors.white, borderRadius: 6, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", width: 360, padding: "24px 24px 18px" }}>
        <div style={{ fontSize: 12.5, color: colors.grey11, lineHeight: "19px", marginBottom: 18 }}>{message}</div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onNo} className="sl-fr-btn" style={{ height: 32, padding: "0 18px", borderRadius: 4, border: "1px solid #C7C7C7", background: colors.white, fontSize: 12.3, cursor: "pointer", fontFamily: "inherit" }}>No</button>
          <button onClick={onYes} style={{ height: 32, padding: "0 18px", borderRadius: 4, border: "none", background: colors.azure42, color: colors.white, fontSize: 12.3, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Yes</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ApplyView() {
  const styles = useStyles();
  const { initData, sendMessage, closeDialog } = useDialogComm();
  const editorRef = useRef<HTMLDivElement>(null);
  const lastSelectionRef = useRef<string>("");
  const [activeTab, setActiveTab] = useState<TabValue>("feedback");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [footerBtnHover, setFooterBtnHover] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<SaveFeedbackPayload | null>(null);

  // ── Feedback form fields ────────────────────────────────────────────────────
  const [form, setForm] = useState({
    applicationName: "",
    communicationFunction: "",
    feedbackSubject: "",
    errorSubstituted: "",
    compensatorReplaced: "",
    feedbackApplication: "",
  });

  // ── Tab item state (initialized from initData) ─────────────────────────────
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [errors, setErrors] = useState<ErrorDraft[]>([]);
  const [compensators, setCompensators] = useState<CompensatorDraft[]>([]);
  const [answers, setAnswers] = useState<AnswerDraft[]>([]);
  const [files, setFiles] = useState<FileDraft[]>([]);
  const [correctedItems, setCorrectedItems] = useState<CorrectedItemDraft[]>([]);
  const [selectedRow, setSelectedRow] = useState<{ tab: TabValue; idx: number } | null>(null);

  // ── Portal dialog state ────────────────────────────────────────────────────
  const [openDialog, setOpenDialog] = useState<OpenDialog | null>(null);
  const [pendingRemove, setPendingRemove] = useState<{ tab: TabValue; idx: number; message: string } | null>(null);

  // ── Context menu state ─────────────────────────────────────────────────────
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);

  // ── List portal state ──────────────────────────────────────────────────────
  const [showAnalysisList, setShowAnalysisList] = useState(false);
  const [showFeedbackList, setShowFeedbackList] = useState(false);
  const [viewAnalysis, setViewAnalysis] = useState<ProjectAnalysis | null>(null);
  const [viewFeedback, setViewFeedback] = useState<ProjectFeedback | null>(null);

  const availableAnalyses = useMemo(() => (initData?.analyses ?? []) as ProjectAnalysis[], [initData]);
  const availableFeedbacks = useMemo(() => (initData?.feedbacks ?? []) as ProjectFeedback[], [initData]);

  // ── Command bar dropdown state ─────────────────────────────────────────────
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const toggleDropdown = useCallback((id: string) => setOpenDropdownId((prev) => prev === id ? null : id), []);

  // ── Init from payload ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!initData) return;
    setForm((prev) => ({
      ...prev,
      applicationName: prev.applicationName || initData.applicationName || "",
      communicationFunction: prev.communicationFunction || initData.communicationFunction || "",
    }));
    const ad = initData.analysisData;
    if (ad) {
      setQuestions(ad.questions.map((q) => ({ ...q })));
      setErrors(ad.errors.map((e) => ({ ...e })));
      setCompensators(ad.compensators.map((c) => ({ ...c })));
      setAnswers(ad.answers.map((a) => ({ ...a })));
      setFiles(ad.files.map((f) => ({ ...f })));
      setCompensators(ad.compensators.map((c) => ({ ...c })));
      setFiles(ad.files.map((f) => ({ ...f })));
      setCorrectedItems((ad.correctedItems ?? []).map((ci) => ({ ...ci })));
    }
  }, [initData]);

  // Track text selected inside the Feedback Application editor so "Identify Selection" items can pre-fill dialogs.
  useEffect(() => {
    const onSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || !editorRef.current) return;
      if (editorRef.current.contains(sel.anchorNode)) {
        lastSelectionRef.current = sel.toString();
      }
    };
    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, []);

  const analysisData = initData?.analysisData;

  // ── Derived lists for dropdowns ─────────────────────────────────────────────
  const errorOptions = useMemo(() => errors.map((e) => e.actualError).filter(Boolean), [errors]);
  const compensatorOptions = useMemo(() => compensators.map((c) => c.actualCompensator).filter(Boolean), [compensators]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const updateForm = useCallback(<K extends keyof typeof form>(key: K, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setValidationError(null);
  }, []);

  const closePortal = useCallback(() => setOpenDialog(null), []);

  const onRowClick = useCallback((tab: TabValue, idx: number) => {
    setSelectedRow((prev) => prev?.tab === tab && prev.idx === idx ? null : { tab, idx });
  }, []);

  const onCtx = useCallback((tab: TabValue, idx: number | null, x: number, y: number) => {
    if (idx !== null) setSelectedRow({ tab, idx });
    setCtxMenu({ tab, idx, x, y });
  }, []);

  // ── Context menu items per tab ──────────────────────────────────────────────
  const ctxItems = useMemo((): PanelMenuEntry[] => {
    if (!ctxMenu) return [];
    const { tab, idx } = ctxMenu;
    // idx null = right-click on empty space; row-specific actions are disabled
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
        return [
          { label: "View Compensator", onClick: () => { if (c) { setOpenDialog({ type: "viewCompensator", item: c }); setCtxMenu(null); } }, disabled: !c },
        ];
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
      default:
        return [];
    }
  }, [ctxMenu, questions, errors, compensators, answers, files, correctedItems]);

  // ── Remove confirm ──────────────────────────────────────────────────────────
  // ── Analysis Tools dropdown (mirrors C# ribbon Analysis Tools sub-menu) ────
  const selectedQuestionIdx = selectedRow?.tab === "questions" ? selectedRow.idx : null;
  const analysisToolsDef = useMemo((): CmdDropdownDef => ({
    id: "analysis-tools",
    iconSrc: "assets/icons/analysis.svg",
    title: "Analysis Tools",
    items: [
      {
        label: "Identify Selection as Compensator",
        iconSrc: "assets/icons/selection.svg",
        enabled: true,
        onClick: () => { setOpenDialog({ type: "compensatorForError", error: "", app: "", description: lastSelectionRef.current }); setOpenDropdownId(null); },
      },
      {
        label: "Identify Selection as Analysis Question",
        iconSrc: "assets/icons/analysis-question.svg",
        enabled: true,
        onClick: () => { setOpenDialog({ type: "addQuestion", initialQuestion: lastSelectionRef.current }); setOpenDropdownId(null); },
      },
      {
        label: "Respond Analysis Question",
        iconSrc: "assets/icons/view-selected-answer.svg",
        enabled: selectedQuestionIdx !== null,
        onClick: () => {
          if (selectedQuestionIdx !== null) {
            setOpenDialog({ type: "respondQuestion", item: questions[selectedQuestionIdx], idx: selectedQuestionIdx });
            setOpenDropdownId(null);
          }
        },
      },
      {
        label: "Add Analysis Question",
        iconSrc: "assets/icons/add-analysis-question.svg",
        enabled: true,
        onClick: () => { setOpenDialog({ type: "addQuestion" }); setOpenDropdownId(null); },
      },
      {
        label: "Add Compensator",
        iconSrc: "assets/icons/compensator-error.svg",
        enabled: true,
        onClick: () => { setOpenDialog({ type: "compensatorForError", error: "", app: "" }); setOpenDropdownId(null); },
      },
    ],
  }), [selectedQuestionIdx, questions]);

  const confirmRemove = useCallback(() => {
    if (!pendingRemove) return;
    const { tab, idx } = pendingRemove;
    if (tab === "questions") setQuestions((prev) => prev.filter((_, i) => i !== idx));
    else if (tab === "answers") setAnswers((prev) => prev.filter((_, i) => i !== idx));
    else if (tab === "files") setFiles((prev) => prev.filter((_, i) => i !== idx));
    setSelectedRow(null);
    setPendingRemove(null);
  }, [pendingRemove]);

  // ── Save ────────────────────────────────────────────────────────────────────
  const save = useCallback(() => {
    dbg("APPLY", "save() called", { form, hasInitData: !!initData });
    if (!initData) return;

    const feedbackApplicationText = form.feedbackApplication.replace(/<[^>]*>/g, "").trim();
    const missing: string[] = [];
    if (!form.applicationName.trim()) missing.push("Application Name");
    if (!form.communicationFunction.trim()) missing.push("Communication Function");
    if (!form.feedbackSubject.trim()) missing.push("Feedback Subject");
    if (!form.errorSubstituted.trim()) missing.push("Error Substituted");
    if (!form.compensatorReplaced.trim()) missing.push("Compensator Replaced");
    if (!feedbackApplicationText) missing.push("Feedback Application");

    if (missing.length > 0) {
      setValidationError(`Required: ${missing.join(", ")}`);
      setActiveTab("feedback");
      return;
    }

    // Distinguish items that were added during this Apply session (not from analysis)
    const originalCICount = analysisData?.correctedItems?.length ?? 0;
    const newCorrectedItems = correctedItems.slice(originalCICount);
    const originalFileCount = analysisData?.files?.length ?? 0;
    const newFiles = files.slice(originalFileCount);

    const payload: SaveFeedbackPayload = {
      feedback: {
        feedbackApplication: form.feedbackApplication,
        feedbackDate: nowDate(),
        feedbackTime: nowTime(),
        fromPerson: analysisData?.fromPerson ?? "",
        toPerson: analysisData?.fromPerson ?? "",
        feedbackSubject: form.feedbackSubject,
        internalFeedbackName: "",
        feedbackType: "Applied",
        actualSelection: initData.selection,
        selectionType: initData.mode === "selection" ? "Selection" : "Paragraph",
        actualErrorSubstituted: form.errorSubstituted,
        actualCompensatorReplaced: form.compensatorReplaced,
        source: initData.source,
        applicationName: form.applicationName,
        communicationFunction: form.communicationFunction,
        communicationSignal: initData.communicationSignal,
        projectName: initData.projectName,
        personName: initData.personName,
        personEmail: initData.personEmail,
        analysisId: analysisData?.id,
      },
      files: newFiles,
      newCorrectedItems,
    };
    setPendingPayload(payload);
    setShowConfirm(true);
  }, [form, initData, analysisData, correctedItems, files]);

  const confirmSave = useCallback(() => {
    if (pendingPayload) {
      dbg("APPLY", "confirmSave — sending SAVE_FEEDBACK");
      sendMessage({ action: "SAVE_FEEDBACK", payload: pendingPayload });
    }
  }, [pendingPayload, sendMessage]);

  if (!initData) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <Spinner label="Loading..." />
      </div>
    );
  }

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
        <button
          className={`${styles.cmdIconBtn} sl-icon-btn`}
          title="View List of Feedback"
          onClick={() => setShowFeedbackList(true)}
        >
          <PfFeedbackListIcon />
        </button>
        <button
          className={`${styles.cmdIconBtn} sl-icon-btn`}
          title="View List of Analysis"
          onClick={() => setShowAnalysisList(true)}
        >
          <PfAnalysisListIcon />
        </button>
        <div className={styles.cmdSep} />
        <CommandDropdown
          def={analysisToolsDef}
          open={openDropdownId === "analysis-tools"}
          onToggle={() => toggleDropdown("analysis-tools")}
          onClose={() => setOpenDropdownId(null)}
        />
        <div className={styles.cmdSep} />
        <RichTextToolbar editorRef={editorRef} />
      </div>

      {/* ── Tab bar ───────────────────────────────────────────────────────── */}
      <div className={styles.tabBar}>
        {TABS.map(({ value, label }) => {
          const isActive = activeTab === value;
          return (
            <button
              key={value}
              className={`${styles.tabBtn}${isActive ? ` ${styles.tabBtnActive}` : ""}`}
              onClick={() => setActiveTab(value)}
            >
              {label}
              {isActive && <span className={styles.tabActiveUnderline} />}
            </button>
          );
        })}
      </div>

      {/* ── Validation banner ─────────────────────────────────────────────── */}
      {validationError && (
        <div style={{ background: "#FDE7E9", borderBottom: "1px solid #F1707B", padding: "8px 20px", fontSize: "12px", color: "#A4262C", flexShrink: 0 }}>
          ⚠ {validationError}
        </div>
      )}

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className={styles.body} style={activeTab !== "feedback" ? { padding: 0 } : undefined}>

        {/* ── Feedback tab ───────────────────────────────────────────────── */}
        {activeTab === "feedback" && (
          <>
            {analysisData && (
              <>
                <span style={{ display: "block", fontSize: "11px", fontWeight: "700", letterSpacing: "0.6px", textTransform: "uppercase", color: colors.grey38, lineHeight: "13px", marginBottom: "8px" }}>
                  Entity Under Analysis
                </span>
                <div style={{ background: colors.white, border: "1px solid #E0E0E0", borderRadius: "4px", height: "72px", display: "flex", alignItems: "center", padding: "0 12px", overflow: "hidden", marginBottom: "16px" }}>
                  <span style={{ fontSize: "16.9px", fontWeight: "400", lineHeight: "25px", color: colors.grey11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {analysisData.entityUnderAnalysis}
                  </span>
                </div>

                {analysisData.fromPerson && (
                  <div style={rowStyle}>
                    <span style={labelStyle}>From Person</span>
                    <span style={readonlyDisplayStyle}>{analysisData.fromPerson}</span>
                  </div>
                )}

                {analysisData.analysisSubject && (
                  <div style={rowStyle}>
                    <span style={labelStyle}>Analysis Subject</span>
                    <span style={readonlyDisplayStyle}>{analysisData.analysisSubject}</span>
                  </div>
                )}

                {analysisData.actualAnalysis && (
                  <div style={rowTopStyle}>
                    <span style={labelTopStyle}>Actual Analysis</span>
                    <div
                      style={{ flex: 1, border: "1px solid #E0E0E0", borderRadius: "4px", padding: "8px 11px", fontSize: "12.2px", color: colors.grey38, background: "#F9F9F9", minHeight: "60px", maxHeight: "120px", overflowY: "auto" }}
                      dangerouslySetInnerHTML={{ __html: analysisData.actualAnalysis }}
                    />
                  </div>
                )}

                <div style={{ height: "1px", background: "#E0E0E0", margin: "0 0 16px 0" }} />
              </>
            )}

            <div style={rowStyle}>
              <span style={labelStyle}>Application Name</span>
              <input style={inputStyle} value={form.applicationName} onChange={(e) => updateForm("applicationName", e.target.value)} placeholder="Enter application name" />
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>Communication Function</span>
              <input style={inputStyle} value={form.communicationFunction} onChange={(e) => updateForm("communicationFunction", e.target.value)} placeholder="Enter communication function" />
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>Feedback Subject</span>
              <input style={inputStyle} value={form.feedbackSubject} onChange={(e) => updateForm("feedbackSubject", e.target.value)} placeholder="Enter feedback subject" />
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>Error Substituted</span>
              {errorOptions.length > 0 ? (
                <select style={selectStyle} value={form.errorSubstituted} onChange={(e) => updateForm("errorSubstituted", e.target.value)}>
                  <option value="">-- Select error --</option>
                  {errorOptions.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              ) : (
                <input style={inputStyle} value={form.errorSubstituted} onChange={(e) => updateForm("errorSubstituted", e.target.value)} placeholder="Enter error substituted" />
              )}
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>Compensator Replaced</span>
              {compensatorOptions.length > 0 ? (
                <select style={selectStyle} value={form.compensatorReplaced} onChange={(e) => updateForm("compensatorReplaced", e.target.value)}>
                  <option value="">-- Select compensator --</option>
                  {compensatorOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <input style={inputStyle} value={form.compensatorReplaced} onChange={(e) => updateForm("compensatorReplaced", e.target.value)} placeholder="Enter compensator replaced" />
              )}
            </div>
            <div style={rowTopStyle}>
              <span style={labelTopStyle}>Feedback Application</span>
              <div style={{ flex: 1 }}>
                <RichEditor
                  ref={editorRef}
                  value={form.feedbackApplication}
                  onChange={(v) => updateForm("feedbackApplication", v)}
                  placeholder="Describe how the feedback was applied..."
                />
              </div>
            </div>
          </>
        )}

        {/* ── Analysis Question tab ──────────────────────────────────────── */}
        {activeTab === "questions" && (
          <PanelTable<string[]>
            columns={AFV_Q_COLS}
            rows={questions.map((q) => [String(q.questionNumber), q.actualQuestion, q.entityQuestionPointTo, q.responseStatus])}
            selectedIndex={selectedRow?.tab === "questions" ? selectedRow.idx : null}
            onRowClick={(idx) => onRowClick("questions", idx)}
            onRowContextMenu={(e, idx) => onCtx("questions", idx, e.clientX, e.clientY)}
          />
        )}

        {/* ── Errors tab ────────────────────────────────────────────────── */}
        {activeTab === "errors" && (
          <PanelTable<string[]>
            columns={AFV_ERR_COLS}
            rows={errors.map((e) => [String(e.errorNumber), e.actualError, e.fromActualCommunication, e.entityErrorPointTo])}
            selectedIndex={selectedRow?.tab === "errors" ? selectedRow.idx : null}
            onRowClick={(idx) => onRowClick("errors", idx)}
            onRowContextMenu={(e, idx) => onCtx("errors", idx, e.clientX, e.clientY)}
          />
        )}

        {/* ── Compensators tab ──────────────────────────────────────────── */}
        {activeTab === "compensators" && (
          <PanelTable<string[]>
            columns={AFV_COMP_COLS}
            rows={compensators.map((c) => [String(c.compensatorNumber), c.actualCompensator, c.actualErrorReplaced, c.inActualCommunication])}
            selectedIndex={selectedRow?.tab === "compensators" ? selectedRow.idx : null}
            onRowClick={(idx) => onRowClick("compensators", idx)}
            onRowContextMenu={(e, idx) => onCtx("compensators", idx, e.clientX, e.clientY)}
          />
        )}

        {/* ── Answers tab ───────────────────────────────────────────────── */}
        {activeTab === "answers" && (
          <PanelTable<string[]>
            columns={AFV_ANS_COLS}
            rows={answers.map((a) => [String(a.answerNumber), a.actualQuestion, a.actualAnswer, a.informationAnswerPointTo])}
            selectedIndex={selectedRow?.tab === "answers" ? selectedRow.idx : null}
            onRowClick={(idx) => onRowClick("answers", idx)}
            onRowContextMenu={(e, idx) => onCtx("answers", idx, e.clientX, e.clientY)}
          />
        )}

        {/* ── Attached Files tab ────────────────────────────────────────── */}
        {activeTab === "files" && (
          <PanelTable<string[]>
            columns={AFV_FILE_COLS}
            rows={files.map((f, i) => [String(i + 1), f.fileName, f.fileType, f.fileDate])}
            selectedIndex={selectedRow?.tab === "files" ? selectedRow.idx : null}
            onRowClick={(idx) => onRowClick("files", idx)}
            onRowContextMenu={(e, idx) => onCtx("files", idx, e.clientX, e.clientY)}
          />
        )}

        {/* ── Corrected Items tab ───────────────────────────────────────── */}
        {activeTab === "corrected" && (
          <PanelTable<string[]>
            columns={AFV_CI_COLS}
            rows={correctedItems.map((ci) => [String(ci.correctedItemNumber), ci.errorSelection, ci.compensatorSelection, ci.corrected])}
            selectedIndex={selectedRow?.tab === "corrected" ? selectedRow.idx : null}
            onRowClick={(idx) => onRowClick("corrected", idx)}
            onRowContextMenu={(e, idx) => onCtx("corrected", idx, e.clientX, e.clientY)}
          />
        )}
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div className={styles.footer}>
        <span className={styles.footerHint}>Feedback can be applied after completing all required fields.</span>
        <button style={btnStyle("cancel")} onClick={closeDialog}>Cancel</button>
        <button
          style={{ ...btnStyle("apply"), background: footerBtnHover ? "#106EBE" : colors.azure42 }}
          onMouseEnter={() => setFooterBtnHover(true)}
          onMouseLeave={() => setFooterBtnHover(false)}
          onClick={save}
        >
          Apply Feedback
        </button>
      </div>

      {/* ── Context menu ─────────────────────────────────────────────────── */}
      {ctxMenu && (
        <PanelContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          items={ctxItems}
          onClose={() => setCtxMenu(null)}
        />
      )}

      {/* ── Apply confirmation overlay ─────────────────────────────────── */}
      {showConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: colors.white, borderRadius: "6px", boxShadow: "0 8px 32px rgba(0,0,0,0.18)", width: "360px", padding: "28px 24px 20px" }}>
            <div style={{ fontSize: "14px", fontWeight: "700", color: colors.grey11, marginBottom: "10px" }}>Apply Feedback</div>
            <div style={{ fontSize: "12.5px", color: colors.grey11, lineHeight: "19px", marginBottom: "20px" }}>
              Does the application of the feedback correct the error?
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button style={{ ...btnStyle("cancel"), fontSize: "12px" }} onClick={() => { setShowConfirm(false); setPendingPayload(null); }}>
                No — Continue Editing
              </button>
              <button style={{ ...btnStyle("apply"), fontSize: "12px" }} onClick={confirmSave}>
                Yes — Save Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Remove confirmation ───────────────────────────────────────────── */}
      {pendingRemove && (
        <RemoveOverlay
          message={pendingRemove.message}
          onYes={confirmRemove}
          onNo={() => setPendingRemove(null)}
        />
      )}

      {/* ── Portal dialogs ────────────────────────────────────────────────── */}
      {openDialog?.type === "addQuestion" && (
        <AnalysisQuestionDialog
          itemCount={questions.length}
          onAdd={(q) => { setQuestions((prev) => [...prev, q]); closePortal(); }}
          onClose={closePortal}
          initialQuestion={openDialog.initialQuestion}
        />
      )}

      {openDialog?.type === "viewQuestion" && (
        <ViewQuestionDialog
          question={openDialog.item}
          onClose={closePortal}
        />
      )}

      {openDialog?.type === "respondQuestion" && (
        <RespondQuestionDialog
          question={openDialog.item}
          onRespond={(info: AnswerInfo) => {
            const q = openDialog.item;
            setAnswers((prev) => [
              ...prev,
              {
                answerNumber: prev.length + 1,
                actualQuestion: q.actualQuestion,
                entityQuestionPointTo: q.entityQuestionPointTo,
                informationAnswerPointTo: info.informationAnswerPointTo,
                actualAnswer: info.actualAnswer,
                answerDate: nowDate(),
                answerTime: nowTime(),
              },
            ]);
            setQuestions((prev) => prev.map((x, i) => i === openDialog.idx ? { ...x, responseStatus: "Answered" } : x));
            closePortal();
          }}
          onClose={closePortal}
        />
      )}

      {openDialog?.type === "addError" && (
        <ErrorIdentificationDialog
          itemCount={errors.length}
          onAdd={(e) => { setErrors((prev) => [...prev, e]); closePortal(); }}
          onClose={closePortal}
        />
      )}

      {openDialog?.type === "viewError" && (
        <ViewErrorDialog
          error={openDialog.item}
          onClose={closePortal}
        />
      )}

      {openDialog?.type === "compensatorForError" && (
        <CompensatorIdentificationDialog
          itemCount={compensators.length}
          existingErrors={errorOptions}
          existingApplications={errors.map((e) => e.fromActualCommunication).filter(Boolean)}
          prefilledError={openDialog.error}
          prefilledApplication={openDialog.app}
          prefilledDescription={openDialog.description}
          onAdd={(c) => { setCompensators((prev) => [...prev, c]); closePortal(); }}
          onClose={closePortal}
        />
      )}

      {openDialog?.type === "viewCompensator" && (
        <ViewCompensatorDialog
          compensator={openDialog.item}
          onClose={closePortal}
        />
      )}

      {openDialog?.type === "viewAnswer" && (
        <ViewAnswerDialog
          answer={openDialog.item}
          onClose={closePortal}
        />
      )}

      {openDialog?.type === "addFile" && (
        <AttachFileDialog
          onAdd={(f) => { setFiles((prev) => [...prev, f]); closePortal(); }}
          onClose={closePortal}
        />
      )}

      {openDialog?.type === "viewFile" && (
        <ViewFileInformationDialog
          file={openDialog.item}
          onClose={closePortal}
        />
      )}

      {openDialog?.type === "addCorrectedItem" && (
        <CorrectedItemDialog
          itemCount={correctedItems.length}
          existingErrors={errorOptions}
          existingCompensators={compensatorOptions}
          onAdd={(ci) => { setCorrectedItems((prev) => [...prev, ci]); closePortal(); }}
          onClose={closePortal}
        />
      )}

      {openDialog?.type === "editCorrectedItem" && (
        <CorrectedItemDialog
          itemCount={correctedItems.length}
          existingErrors={errorOptions}
          existingCompensators={compensatorOptions}
          initialItem={openDialog.item}
          onAdd={(ci) => {
            setCorrectedItems((prev) => prev.map((x, i) => i === openDialog.idx ? ci : x));
            closePortal();
          }}
          onClose={closePortal}
        />
      )}

      {openDialog?.type === "viewCorrectedItem" && (
        <CorrectedItemDialog
          itemCount={correctedItems.length}
          existingErrors={errorOptions}
          existingCompensators={compensatorOptions}
          initialItem={openDialog.item}
          readOnly
          onAdd={closePortal}
          onClose={closePortal}
        />
      )}

      {/* ── Analysis List portal ───────────────────────────────────────────── */}
      {showAnalysisList && (
        <AnalysisListPortal
          analyses={availableAnalyses}
          sendMessage={sendMessage}
          onClose={() => setShowAnalysisList(false)}
          onViewAnalysis={(a) => { setViewAnalysis(a); setShowAnalysisList(false); }}
        />
      )}

      {/* ── Feedback List portal ───────────────────────────────────────────── */}
      {showFeedbackList && (
        <FeedbackListPortal
          feedbacks={availableFeedbacks}
          sendMessage={sendMessage}
          onClose={() => setShowFeedbackList(false)}
          onViewFeedback={(f) => { setViewFeedback(f); setShowFeedbackList(false); }}
        />
      )}

      {/* ── Analysis detail (from list portal) ────────────────────────────── */}
      {viewAnalysis && <ViewAnalysisDialog analysis={viewAnalysis} onClose={() => setViewAnalysis(null)} />}

      {/* ── Feedback detail (from list portal) ────────────────────────────── */}
      {viewFeedback && <ViewFeedbackDialog feedback={viewFeedback} onClose={() => setViewFeedback(null)} />}
    </div>
  );
}
