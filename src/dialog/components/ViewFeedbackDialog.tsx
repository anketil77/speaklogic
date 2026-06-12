// src/dialog/components/ViewFeedbackDialog.tsx

import React, { useState, useMemo, useCallback } from "react";
import { formatDisplayDate } from "@/db/db";
import { FooterBar, DismissBtn } from "@/dialog/components/FooterButtons";
import { createPortal } from "react-dom";
import { useDraggable } from "@/dialog/hooks/useDraggable";
import { PanelTable, type PanelTableCol } from "@/dialog/components/PanelTable";
import { PanelContextMenu, type PanelMenuEntry } from "@/dialog/components/PanelContextMenu";
import { InfoMessageCard } from "@/dialog/components/InfoMessageCard";
import { ViewQuestionDialog } from "@/dialog/components/ViewQuestionDialog";
import { ViewErrorDialog } from "@/dialog/components/ViewErrorDialog";
import { ViewCompensatorDialog } from "@/dialog/components/ViewCompensatorDialog";
import { ViewAnswerDialog } from "@/dialog/components/ViewAnswerDialog";
import { ViewFileInformationDialog } from "@/dialog/components/ViewFileInformationDialog";
import {
  CloseIcon,
  FeedbackHistoryHeaderIcon,
  FeedbackModelIcon,
  SmallCaretDownIcon,
  DeleteSelectedIcon,
  EditSelectedAnalysisIcon,
  PfAnalysisListIcon,
  PfFeedbackListIcon,
} from "@/dialog/components/Icons";
import { FeedbackModelDialog } from "@/dialog/components/FeedbackModelDialog";
import { HtmlContent } from "@/dialog/components/HtmlContent";
import { colors } from "@/styles/tokens";
import type { ProjectFeedback, ProjectQuestion, ProjectError, ProjectCompensator, ProjectAnswer, AttachFileToProject } from "@/types/db";

// ─── Tab types ────────────────────────────────────────────────────────────────
type VFTab = "feedback" | "selection" | "errors" | "compensators" | "questions" | "answers" | "files";

// Base tabs (always shown). The "Selection" tab is inserted at position #2 at
// runtime only when the feedback was created from a selection/paragraph apply.
const VF_TABS: { value: VFTab; label: string }[] = [
  { value: "feedback", label: "Feedback" },
  { value: "errors", label: "Errors" },
  { value: "compensators", label: "Compensators" },
  { value: "questions", label: "Analysis Question" },
  { value: "answers", label: "Answers" },
  { value: "files", label: "Attached Files" },
];

const VF_SELECTION_TAB_SELECTION: { value: VFTab; label: string } = { value: "selection", label: "Selection" };
const VF_SELECTION_TAB_PARAGRAPH: { value: VFTab; label: string } = { value: "selection", label: "Paragraph" };

// ─── Sub-tab column definitions ───────────────────────────────────────────────
const Q_COLS: PanelTableCol<ProjectQuestion>[] = [
  { header: "Question Number", width: "16%", render: (q) => q.questionNumber, truncate: true },
  { header: "Actual Question", width: "38%", render: (q) => <span dangerouslySetInnerHTML={{ __html: q.actualQuestion }} />, truncate: true },
  { header: "Entity Question Point To", width: "30%", render: (q) => q.entityQuestionPointTo || "—", truncate: true },
  { header: "Question Date", width: "16%", render: (q) => formatDisplayDate(q.questionDate) || "—", truncate: true },
];

const E_COLS: PanelTableCol<ProjectError>[] = [
  { header: "Error Number", width: "14%", render: (e) => e.errorNumber, truncate: true },
  { header: "Actual Error", width: "32%", render: (e) => e.actualError || "—", truncate: true },
  { header: "From Communication", width: "22%", render: (e) => e.fromActualCommunication || "—", truncate: true },
  { header: "Points To", width: "18%", render: (e) => e.entityErrorPointTo || "—", truncate: true },
  { header: "Error Date", width: "14%", render: (e) => formatDisplayDate(e.errorDate) || "—", truncate: true },
];

const C_COLS: PanelTableCol<ProjectCompensator>[] = [
  { header: "Compensator Number", width: "20%", render: (c) => c.compensatorNumber, truncate: true },
  { header: "Actual Compensator", width: "32%", render: (c) => c.actualCompensator || "—", truncate: true },
  { header: "Error Replaced", width: "30%", render: (c) => c.actualErrorReplaced || "—", truncate: true },
  { header: "Compensator Date", width: "18%", render: (c) => formatDisplayDate(c.compensatorDate) || "—", truncate: true },
];

const A_COLS: PanelTableCol<ProjectAnswer>[] = [
  { header: "Actual Answer", width: "32%", render: (a) => <span dangerouslySetInnerHTML={{ __html: a.actualAnswer }} />, truncate: true },
  { header: "Information Answer Point To", width: "28%", render: (a) => a.informationAnswerPointTo || "—", truncate: true },
  { header: "Entity Question Point To", width: "25%", render: (a) => a.entityQuestionPointTo || "—", truncate: true },
  { header: "Answer Date", width: "15%", render: (a) => formatDisplayDate(a.answerDate) || "—", truncate: true },
];

const F_COLS: PanelTableCol<AttachFileToProject>[] = [
  { header: "File Name", width: "32%", render: (f) => f.fileName || "—", truncate: true },
  { header: "File Type", width: "18%", render: (f) => f.fileType || "—", truncate: true },
  { header: "File Date", width: "18%", render: (f) => formatDisplayDate(f.fileDate) || "—", truncate: true },
  { header: "File Time", width: "16%", render: (f) => f.fileTime || "—", truncate: true },
  { header: "File Size", width: "16%", render: (f) => f.fileSize || "—", truncate: true },
];

// ─── Info messages (from C# ViewFeedback source) ──────────────────────────────
const VF_INFO = {
  deleteFeedback: {
    title: "Delete Feedback Message",
    text: "A feedback is given to enable the correction of an error; a feedback is applied to enable the correction of an error. A feedback is requested to enable the correction of an error; a feed is applied to enable the correction of an error. While a feedback can be given, applied, and requested, but it is not possible or practical to delete a given feedback. The way to look at it, after a feedback is given, that feedback cannot be deleted. As well as, after a feedback is applied or requested, that feedback cannot be deleted. If it was possible practically to delete a feedback, then the overall correction process would not be possible at all. If it was possible to delete a given feedback, then it would not be possible for us to correct our errors.",
  },
  editFeedback: {
    title: "Edit Feedback Message",
    text: "A feedback is provided to enable the correction of an error. The given feedback enables the correction of the error that needs to be corrected. If it was possible to edit that feedback, then the correction of the identified error would not be possible as all. As we can see, it is not possible to edit a given feedback, disregard if it is provided, received, or applied.",
  },
  flagForAnalysis: {
    title: "Flag Feedback For Analysis",
    text: "An analysis is provided as feedback, an analysis is applied as feedback to enable the correction of an error. Once we analyze an entity and we use that analysis to enable the correction of an error, the overall process that enable the correction of an error is being viewed as a feedback. For instance, if we analyze a sentence and we identify a bad word in that sentence, the analysis that enables us to substitute the bad word for a good word is being view as a feedback. What is important here, is that the analysis weights on the feedback. In term flag a feedback for analysis, we simply flag an analysis for analysis rather than flagging a feedback for analysis.",
  },
  analyzeFeedback: {
    title: "Analyze Feedback Message",
    text: "After an analysis is performed, that analysis can be applied as feedback, it can also be given as feedback to enable the correction of an error. The way to look at it, the application of an analysis to enable the correction is being viewed as a feedback. For instance, if we identify an application or a communication that contains error, the analysis that we perform to identify that error and to enable the correction of that error is being viewed as a feedback. In term of analysis, since we cannot analyze an analysis directly without flagging it first as communication, it is not possible for us as well to analyze a feedback. By understanding that, we can see that the possibility of analyzing a feedback is weighted on the analysis itself, rather than the feedback.",
  },
  flagAsCommunication: {
    title: "Flag Feedback as Communication",
    text: "The relationship of the feedback entity with the analysis entity enables the feedback entity not to exist without the analysis entity. For instance, if we identify an entity that is a feedback, there must exist an analysis for that feedback entity. Since the analysis entity is weighted on the feedback entity and the feedback entity cannot exist without the analysis entity, flagging a feedback as communication requires the flagging of the analysis as communication. In this case, rather than thinking about flagging the feedback entity as communication, we can think about flagging the analysis entity as communication instead.",
  },
  applyFeedback: {
    title: "Apply Feedback Message",
    text: "We apply an analysis as feedback to enable the correction of an error. From an analysis, a feedback is given or provided to enable the correction of an identified error. Since the relationship of the feedback entity and the analysis entity enables the feedback entity not to exist without the analysis entity, in this case, an analysis is applied as feedback, rather than a feedback is applied as feedback. The way to look at it, after an analysis has been applied as feedback, that same feedback cannot be applied as feedback again. In this case, another feedback based on the same analysis would required the analysis to be flagged as communication.",
  },
  provideFeedback: {
    title: "Provide Feedback With Feedback",
    text: "The process of providing feedback requires the analysis of an entity. Usually, we provide a feedback in the event of an error or if we feel that an error is going to be committed. As we can see, the overall process requires analysis. In this case, it is not possible to provide a feedback with another feedback. Here what I can do, save the identified feedback analyze the entity that needs to be corrected, then load that feedback. But it is better to say, flag the analysis that related to this feedback as communication, perform another analysis and provide feedback with that analysis.",
  },
} as const;

// ─── Style helpers ────────────────────────────────────────────────────────────
const VF_LABEL_W = 178;

const vfReadonlyInput: React.CSSProperties = {
  width: "100%",
  height: 32,
  border: `1px solid ${colors.grey78}`,
  borderRadius: 4,
  padding: "0 11px",
  fontSize: "12.2px",
  fontFamily: "inherit",
  color: colors.grey38,
  background: colors.grey96,
  boxSizing: "border-box",
  outline: "none",
  cursor: "default",
};

function VfFormRow({ label, children, alignTop = false }: { label: string; children: React.ReactNode; alignTop?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: alignTop ? "flex-start" : "center", marginBottom: 12 }}>
      <div style={{ width: VF_LABEL_W, minWidth: VF_LABEL_W, fontSize: "11.3px", fontWeight: 400, color: colors.grey11, lineHeight: "14px", paddingTop: alignTop ? 9 : 0, flexShrink: 0 }}>
        {label}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function VfCmdSep() {
  return <div style={{ width: 1, height: 20, background: colors.grey88, flexShrink: 0, margin: "0 2px" }} />;
}

// ─── Component ────────────────────────────────────────────────────────────────
interface Props {
  feedback: ProjectFeedback;
  onClose: () => void;
}

export function ViewFeedbackDialog({ feedback, onClose }: Props) {
  const { pos, onHeaderMouseDown } = useDraggable();
  const [activeTab, setActiveTab] = useState<VFTab>("feedback");
  const [openDropId, setOpenDropId] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<{ title: string; text: string } | null>(null);
  const [showModel, setShowModel] = useState(false);

  const [qSelIdx, setQSelIdx] = useState<number | null>(null);
  const [qMenu, setQMenu] = useState<{ x: number; y: number } | null>(null);
  const [viewQ, setViewQ] = useState<ProjectQuestion | null>(null);

  const [eSelIdx, setESelIdx] = useState<number | null>(null);
  const [eMenu, setEMenu] = useState<{ x: number; y: number } | null>(null);
  const [viewE, setViewE] = useState<ProjectError | null>(null);

  const [cSelIdx, setCSelIdx] = useState<number | null>(null);
  const [cMenu, setCMenu] = useState<{ x: number; y: number } | null>(null);
  const [viewC, setViewC] = useState<ProjectCompensator | null>(null);

  const [aSelIdx, setASelIdx] = useState<number | null>(null);
  const [aMenu, setAMenu] = useState<{ x: number; y: number } | null>(null);
  const [viewA, setViewA] = useState<ProjectAnswer | null>(null);

  const [fSelIdx, setFSelIdx] = useState<number | null>(null);
  const [fMenu, setFMenu] = useState<{ x: number; y: number } | null>(null);
  const [viewF, setViewF] = useState<AttachFileToProject | null>(null);

  const questions = feedback.questions ?? [];
  const errors = feedback.errors ?? [];
  const compensators = feedback.compensators ?? [];
  const answers = feedback.answers ?? [];
  const files = feedback.files ?? [];

  // Selection tab appears only for selection/paragraph-applied feedback.
  const hasSelection = !!(feedback.actualSelection || feedback.selectionType);
  const vfSelectionTab = feedback.selectionType === "Paragraph" ? VF_SELECTION_TAB_PARAGRAPH : VF_SELECTION_TAB_SELECTION;
  const visibleTabs = useMemo(
    () => (hasSelection ? [VF_TABS[0], vfSelectionTab, ...VF_TABS.slice(1)] : VF_TABS),
    [hasSelection, vfSelectionTab],
  );

  const tabCount: Record<VFTab, number> = {
    feedback: 0,
    selection: 0,
    errors: errors.length,
    compensators: compensators.length,
    questions: questions.length,
    answers: answers.length,
    files: files.length,
  };

  const showInfo = useCallback((key: keyof typeof VF_INFO) => {
    setOpenDropId(null);
    setInfoMsg(VF_INFO[key]);
  }, []);

  const qMenuItems = useMemo<PanelMenuEntry[]>(() => [
    { label: "Add Analysis Question", onClick: () => {}, disabled: true },
    { label: "Respond To Analysis Question", onClick: () => {}, disabled: true },
    { label: "Remove Analysis Question", onClick: () => {}, disabled: true },
    { isSep: true },
    {
      label: "View Analysis Question",
      disabled: qSelIdx === null,
      onClick: () => { if (qSelIdx !== null) { setViewQ(questions[qSelIdx]); setQMenu(null); } },
    },
  ], [qSelIdx, questions]);

  const eMenuItems = useMemo<PanelMenuEntry[]>(() => [
    { label: "Add Error", onClick: () => {}, disabled: true },
    { label: "Remove Error", onClick: () => {}, disabled: true },
    { isSep: true },
    {
      label: "View Error",
      disabled: eSelIdx === null,
      onClick: () => { if (eSelIdx !== null) { setViewE(errors[eSelIdx]); setEMenu(null); } },
    },
  ], [eSelIdx, errors]);

  const cMenuItems = useMemo<PanelMenuEntry[]>(() => [
    { label: "Add Compensator", onClick: () => {}, disabled: true },
    { label: "Remove Compensator", onClick: () => {}, disabled: true },
    { isSep: true },
    {
      label: "View Compensator",
      disabled: cSelIdx === null,
      onClick: () => { if (cSelIdx !== null) { setViewC(compensators[cSelIdx]); setCMenu(null); } },
    },
  ], [cSelIdx, compensators]);

  const aMenuItems = useMemo<PanelMenuEntry[]>(() => [
    {
      label: "View Answer",
      disabled: aSelIdx === null,
      onClick: () => { if (aSelIdx !== null) { setViewA(answers[aSelIdx]); setAMenu(null); } },
    },
  ], [aSelIdx, answers]);

  const fMenuItems = useMemo<PanelMenuEntry[]>(() => [
    { label: "Add File", onClick: () => {}, disabled: true },
    { label: "Remove File", onClick: () => {}, disabled: true },
    { isSep: true },
    {
      label: "View File Info",
      disabled: fSelIdx === null,
      onClick: () => { if (fSelIdx !== null) { setViewF(files[fSelIdx]); setFMenu(null); } },
    },
  ], [fSelIdx, files]);

  const handleQContextMenu = useCallback((e: React.MouseEvent, idx: number | null) => {
    e.preventDefault();
    if (idx !== null) setQSelIdx(idx);
    setQMenu({ x: e.clientX, y: e.clientY });
  }, []);
  const handleEContextMenu = useCallback((e: React.MouseEvent, idx: number | null) => {
    e.preventDefault();
    if (idx !== null) setESelIdx(idx);
    setEMenu({ x: e.clientX, y: e.clientY });
  }, []);
  const handleCContextMenu = useCallback((e: React.MouseEvent, idx: number | null) => {
    e.preventDefault();
    if (idx !== null) setCSelIdx(idx);
    setCMenu({ x: e.clientX, y: e.clientY });
  }, []);
  const handleAContextMenu = useCallback((e: React.MouseEvent, idx: number | null) => {
    e.preventDefault();
    if (idx !== null) setASelIdx(idx);
    setAMenu({ x: e.clientX, y: e.clientY });
  }, []);
  const handleFContextMenu = useCallback((e: React.MouseEvent, idx: number | null) => {
    e.preventDefault();
    if (idx !== null) setFSelIdx(idx);
    setFMenu({ x: e.clientX, y: e.clientY });
  }, []);

  return createPortal(
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 199 }} onClick={onClose} />
      <div
        style={{
          position: "fixed",
          left: `calc(50% + ${pos.x}px)`,
          top: `calc(50% + ${pos.y}px)`,
          transform: "translate(-50%, -50%)",
          zIndex: 200,
          background: colors.white,
          borderRadius: 8,
          boxShadow: "0px 8px 32px rgba(0,0,0,0.14), 0px 2px 8px rgba(0,0,0,0.06)",
          width: 700,
          height: 600,
          maxWidth: "96vw",
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
        }}
      >
        {/* ── Header ── */}
        <div
          onMouseDown={onHeaderMouseDown}
          style={{ height: 78, display: "flex", alignItems: "center", padding: "0 20px", gap: 12, flexShrink: 0, cursor: "grab", userSelect: "none" }}
        >
          <div style={{ width: 32, height: 32, borderRadius: 6, background: "#EBF3FC", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FeedbackHistoryHeaderIcon />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "15.6px", fontWeight: 700, color: colors.grey11, letterSpacing: "-0.1px", lineHeight: "21px" }}>View Feedback</div>
            <div style={{ fontSize: "11.1px", color: colors.grey38, lineHeight: "17px", marginTop: 2 }}>View the selected feedback record and its details.</div>
          </div>
          <button className="sl-close-btn" onClick={onClose} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", borderRadius: 4, cursor: "pointer", flexShrink: 0, padding: 0 }} title="Close">
            <CloseIcon />
          </button>
        </div>

        {/* ── Command bar ── */}
        <div style={{ height: 44, background: colors.grey96, display: "flex", alignItems: "center", padding: "0 12px", gap: 4, flexShrink: 0, position: "relative" }}>
          <button className="sl-icon-btn" title="Delete Feedback" onClick={() => showInfo("deleteFeedback")} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", borderRadius: 4, cursor: "pointer", padding: 0, flexShrink: 0 }}>
            <DeleteSelectedIcon color="#D13438" />
          </button>
          <button className="sl-icon-btn" title="Edit Feedback" onClick={() => showInfo("editFeedback")} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", borderRadius: 4, cursor: "pointer", padding: 0, flexShrink: 0 }}>
            <EditSelectedAnalysisIcon />
          </button>
          <button
            className="sl-icon-btn"
            title="View Feedback Model"
            onClick={() => { setOpenDropId(null); setShowModel(true); }}
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: showModel ? colors.grey92 : "none", border: "none", borderRadius: 4, cursor: "pointer", padding: 0, flexShrink: 0 }}
          >
            <FeedbackModelIcon />
          </button>

          <VfCmdSep />

          {/* Analysis Option dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setOpenDropId((p) => (p === "analysis" ? null : "analysis"))}
              aria-expanded={openDropId === "analysis"}
              aria-haspopup="menu"
              style={{ height: 28, display: "flex", alignItems: "center", gap: 3, background: openDropId === "analysis" ? colors.grey92 : "none", border: "none", borderRadius: 4, cursor: "pointer", padding: "0 8px", fontSize: "11.4px", fontFamily: "inherit", color: colors.grey11, flexShrink: 0 }}
            >
              <PfAnalysisListIcon />
              <span>Analysis Option</span>
              <SmallCaretDownIcon color={colors.grey38} />
            </button>
            {openDropId === "analysis" && (
              <div role="menu" style={{ position: "absolute", top: "calc(100% + 2px)", left: 0, zIndex: 210, background: colors.white, border: `1px solid ${colors.grey88}`, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", borderRadius: 4, minWidth: 200, whiteSpace: "nowrap" }}>
                {[
                  { label: "Flag Feedback For Analysis", key: "flagForAnalysis" as const },
                  { label: "Analyze Feedback", key: "analyzeFeedback" as const },
                  { label: "Flag Feedback as Communication", key: "flagAsCommunication" as const },
                ].map(({ label, key }) => (
                  <button key={key} role="menuitem" onClick={() => showInfo(key)} className="sl-panel-item" style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", background: "none", border: "none", cursor: "pointer", fontSize: "12.3px", color: colors.grey11, fontFamily: "inherit" }}>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Feedback Option dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setOpenDropId((p) => (p === "feedback" ? null : "feedback"))}
              aria-expanded={openDropId === "feedback"}
              aria-haspopup="menu"
              style={{ height: 28, display: "flex", alignItems: "center", gap: 3, background: openDropId === "feedback" ? colors.grey92 : "none", border: "none", borderRadius: 4, cursor: "pointer", padding: "0 8px", fontSize: "11.4px", fontFamily: "inherit", color: colors.grey11, flexShrink: 0 }}
            >
              <PfFeedbackListIcon />
              <span>Feedback Option</span>
              <SmallCaretDownIcon color={colors.grey38} />
            </button>
            {openDropId === "feedback" && (
              <div role="menu" style={{ position: "absolute", top: "calc(100% + 2px)", left: 0, zIndex: 210, background: colors.white, border: `1px solid ${colors.grey88}`, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", borderRadius: 4, minWidth: 220, whiteSpace: "nowrap" }}>
                {[
                  { label: "Apply Feedback", key: "applyFeedback" as const },
                  { label: "Provide Feedback With Feedback", key: "provideFeedback" as const },
                ].map(({ label, key }) => (
                  <button key={key} role="menuitem" onClick={() => showInfo(key)} className="sl-panel-item" style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", background: "none", border: "none", cursor: "pointer", fontSize: "12.3px", color: colors.grey11, fontFamily: "inherit" }}>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div style={{ height: 36, background: colors.white, display: "flex", alignItems: "flex-end", padding: "0 20px", borderBottom: `1px solid ${colors.grey88}`, flexShrink: 0 }}>
          {visibleTabs.map(({ value, label }) => {
            const count = tabCount[value];
            const isActive = activeTab === value;
            return (
              <button
                key={value}
                onClick={() => setActiveTab(value)}
                style={{ height: 36, padding: "0 12px", border: "none", background: "none", cursor: "pointer", fontSize: "12px", fontWeight: isActive ? 700 : 400, color: isActive ? colors.grey11 : colors.grey38, borderBottom: isActive ? `2px solid ${colors.azure42}` : "2px solid transparent", fontFamily: "inherit", whiteSpace: "nowrap", lineHeight: "15px" }}
              >
                {count > 0 ? `${label} (${count})` : label}
              </button>
            );
          })}
        </div>

        {/* ── Tab content ── */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {activeTab === "feedback" && (
            <div style={{ overflowY: "auto", flex: 1, padding: "12px 20px", display: "flex", flexDirection: "column" }}>
              <VfFormRow label="Application Name"><input style={vfReadonlyInput} value={feedback.applicationName || ""} readOnly /></VfFormRow>
              <VfFormRow label="Communication Function"><input style={vfReadonlyInput} value={feedback.communicationFunction || ""} readOnly /></VfFormRow>
              <VfFormRow label="Feedback Subject"><input style={vfReadonlyInput} value={feedback.feedbackSubject || ""} readOnly /></VfFormRow>
              <VfFormRow label="Actual Error Substituted"><input style={vfReadonlyInput} value={feedback.actualErrorSubstituted || ""} readOnly /></VfFormRow>
              <VfFormRow label="Actual Compensator Replaced"><input style={vfReadonlyInput} value={feedback.actualCompensatorReplaced || ""} readOnly /></VfFormRow>
              <VfFormRow label="From Person"><input style={vfReadonlyInput} value={feedback.fromPerson || ""} readOnly /></VfFormRow>
              <VfFormRow label="To Person"><input style={vfReadonlyInput} value={feedback.toPerson || ""} readOnly /></VfFormRow>
              <VfFormRow label="Feedback Type"><input style={vfReadonlyInput} value={feedback.feedbackType || ""} readOnly /></VfFormRow>
              <VfFormRow label="Feedback Date"><input style={vfReadonlyInput} value={formatDisplayDate(feedback.feedbackDate) || ""} readOnly /></VfFormRow>
              <VfFormRow label="Feedback Time"><input style={vfReadonlyInput} value={feedback.feedbackTime || ""} readOnly /></VfFormRow>
              <VfFormRow label="Feedback Application" alignTop>
                <div dangerouslySetInnerHTML={{ __html: feedback.feedbackApplication || "" }} style={{ minHeight: 80, border: `1px solid ${colors.grey78}`, borderRadius: 4, padding: "8px 11px", fontSize: "12.2px", fontFamily: "inherit", color: colors.grey11, background: colors.grey96, lineHeight: "20px", overflowY: "auto" }} />
              </VfFormRow>
            </div>
          )}

          {activeTab === "selection" && (
            <div style={{ overflowY: "auto", flex: 1, padding: "12px 20px", display: "flex", flexDirection: "column" }}>
              <VfFormRow label="Selection Type"><input style={vfReadonlyInput} value={feedback.selectionType || feedback.source || ""} readOnly /></VfFormRow>
              <VfFormRow label="From Person"><input style={vfReadonlyInput} value={feedback.fromPerson || ""} readOnly /></VfFormRow>
              <VfFormRow label="To Person"><input style={vfReadonlyInput} value={feedback.toPerson || ""} readOnly /></VfFormRow>
              <VfFormRow label="Actual Selection" alignTop>
                {feedback.actualSelection ? (
                  <HtmlContent
                    html={feedback.actualSelection}
                    style={{ minHeight: 120, maxHeight: 260, border: `1px solid ${colors.grey78}`, borderRadius: 4, padding: "8px 11px", fontSize: "12.2px", fontFamily: "inherit", color: colors.grey38, background: colors.grey96, lineHeight: 1.7, overflowY: "auto", wordBreak: "break-word" }}
                  />
                ) : (
                  <div style={{ minHeight: 120, maxHeight: 260, border: `1px solid ${colors.grey78}`, borderRadius: 4, padding: "8px 11px", fontSize: "12.2px", fontFamily: "inherit", color: colors.grey38, background: colors.grey96, lineHeight: "20px", overflowY: "auto" }}>
                    <em>No selection captured.</em>
                  </div>
                )}
              </VfFormRow>
            </div>
          )}

          {activeTab === "questions" && (
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}>
              <PanelTable<ProjectQuestion>
                columns={Q_COLS}
                rows={questions}
                emptyText="No analysis questions."
                selectedIndex={qSelIdx}
                onRowClick={(idx) => setQSelIdx((p) => (p === idx ? null : idx))}
                onRowContextMenu={handleQContextMenu}
              />
            </div>
          )}

          {activeTab === "errors" && (
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}>
              <PanelTable<ProjectError>
                columns={E_COLS}
                rows={errors}
                emptyText="No errors."
                selectedIndex={eSelIdx}
                onRowClick={(idx) => setESelIdx((p) => (p === idx ? null : idx))}
                onRowContextMenu={handleEContextMenu}
              />
            </div>
          )}

          {activeTab === "compensators" && (
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}>
              <PanelTable<ProjectCompensator>
                columns={C_COLS}
                rows={compensators}
                emptyText="No compensators."
                selectedIndex={cSelIdx}
                onRowClick={(idx) => setCSelIdx((p) => (p === idx ? null : idx))}
                onRowContextMenu={handleCContextMenu}
              />
            </div>
          )}

          {activeTab === "answers" && (
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}>
              <PanelTable<ProjectAnswer>
                columns={A_COLS}
                rows={answers}
                emptyText="No answers."
                selectedIndex={aSelIdx}
                onRowClick={(idx) => setASelIdx((p) => (p === idx ? null : idx))}
                onRowContextMenu={handleAContextMenu}
              />
            </div>
          )}

          {activeTab === "files" && (
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}>
              <PanelTable<AttachFileToProject>
                columns={F_COLS}
                rows={files}
                emptyText="No files attached."
                selectedIndex={fSelIdx}
                onRowClick={(idx) => setFSelIdx((p) => (p === idx ? null : idx))}
                onRowContextMenu={handleFContextMenu}
              />
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <FooterBar><DismissBtn label="Close" onClick={onClose} /></FooterBar>

        {/* ── Info message card ── */}
        {infoMsg && (
          <InfoMessageCard title={infoMsg.title} text={infoMsg.text} onClose={() => setInfoMsg(null)} />
        )}
      </div>

      {/* Context menus — outside the transform container so position:fixed anchors to viewport */}
      {qMenu && <PanelContextMenu x={qMenu.x} y={qMenu.y} items={qMenuItems} onClose={() => setQMenu(null)} />}
      {eMenu && <PanelContextMenu x={eMenu.x} y={eMenu.y} items={eMenuItems} onClose={() => setEMenu(null)} />}
      {cMenu && <PanelContextMenu x={cMenu.x} y={cMenu.y} items={cMenuItems} onClose={() => setCMenu(null)} />}
      {aMenu && <PanelContextMenu x={aMenu.x} y={aMenu.y} items={aMenuItems} onClose={() => setAMenu(null)} />}
      {fMenu && <PanelContextMenu x={fMenu.x} y={fMenu.y} items={fMenuItems} onClose={() => setFMenu(null)} />}

      {/* Sub-view dialogs */}
      {viewQ && <ViewQuestionDialog question={viewQ} onClose={() => setViewQ(null)} />}
      {viewE && <ViewErrorDialog error={viewE} onClose={() => setViewE(null)} />}
      {viewC && <ViewCompensatorDialog compensator={viewC} onClose={() => setViewC(null)} />}
      {viewA && <ViewAnswerDialog answer={viewA} onClose={() => setViewA(null)} />}
      {viewF && <ViewFileInformationDialog file={viewF} onClose={() => setViewF(null)} />}

      {/* Feedback model dialog */}
      {showModel && <FeedbackModelDialog feedback={feedback} onClose={() => setShowModel(false)} />}
    </>,
    document.body
  );
}
