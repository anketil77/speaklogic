// src/dialog/components/AnalysisQuestionDialog.tsx

import React, { useRef, useState, useCallback } from "react";
import { useDraggable } from "@/dialog/hooks/useDraggable";
import { createPortal } from "react-dom";
import { RichTextToolbar } from "@/dialog/components/RichTextToolbar";
import { RichEditor } from "@/dialog/components/RichEditor";
import { InfoMessageCard } from "@/dialog/components/InfoMessageCard";
import { AnalysisQuestionHeaderIcon, AddCircleIcon, CloseIcon, QuestionCheckIcon, QuestionBookmarkIcon } from "@/dialog/components/Icons";
import type { ProjectQuestion } from "@/types/db";

type QuestionDraft = Omit<ProjectQuestion, "id" | "analysisId" | "questionDate" | "questionTime">;

export interface AnalysisQuestionDialogProps {
  itemCount: number;
  onAdd: (item: QuestionDraft) => void;
  onClose: () => void;
  initialQuestion?: string;
}

const C = {
  blue: "#0078D4",
  grey11: "#1B1B1B",
  grey38: "#616161",
  grey78: "#C7C7C7",
  grey88: "#E0E0E0",
  grey96: "#F5F5F5",
  iconBg: "#EBF3FC",
  white: "#FFFFFF",
} as const;

const LABEL_W = 178;

const INFO = {
  analyze: {
    title: "Analyze Question Message",
    text: "Questions are part of communication, while I am communicating with you, I can ask you questions, you can also ask me questions. Before I communicate with you, I analyze my communication internal. For instance before I ask you a question, I analyze that question internally. Why I am using this computer, I can type a question, but I analyze that before I type it. I can also analyze it while I am type it. By understanding that, I can see the analysis must be done here, in this window.",
  },
  flag: {
    title: "Flag Question Message",
    text: "While I am communicating with you, I can ask you questions and you can also ask me question. In this case, a word in a question for instance can be flagged for analysis, so does the question. In this case, the analysis can be done on the question itself or the flagged word as well as the entity that question point to. Here in this window, I can flag a question for analysis and analyze that question.",
  },
} as const;

function CmdSep() {
  return <div style={{ width: 1, height: 20, background: C.grey88, flexShrink: 0, margin: "0 8px" }} />;
}

function FormRow({ label, children, alignTop = false }: { label: string; children: React.ReactNode; alignTop?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: alignTop ? "flex-start" : "center" }}>
      <div style={{ width: LABEL_W, minWidth: LABEL_W, fontSize: "11.3px", fontWeight: 400, color: C.grey11, lineHeight: "14px", paddingTop: alignTop ? 9 : 0, flexShrink: 0 }}>
        {label}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 32,
  border: `1px solid ${C.grey78}`,
  borderRadius: 4,
  padding: "0 11px",
  fontSize: "12.2px",
  fontFamily: "inherit",
  color: C.grey11,
  background: C.white,
  boxSizing: "border-box",
  outline: "none",
};

export function AnalysisQuestionDialog({ itemCount, onAdd, onClose, initialQuestion }: AnalysisQuestionDialogProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [toolbarCloseSignal, setToolbarCloseSignal] = useState(0);
  const [entityQuestionPointTo, setEntityQuestionPointTo] = useState("");
  const [actualQuestion, setActualQuestion] = useState(initialQuestion ?? "");
  const [error, setError] = useState("");
  const [addBtnHover, setAddBtnHover] = useState(false);
  const [infoPanel, setInfoPanel] = useState<null | "analyze" | "flag">(null);

  const { pos, onHeaderMouseDown } = useDraggable();

  // ── Submit ───────────────────────────────────────────────────────────────────
  // Matches C# behavior: dialog stays open, fields clear so user can add more questions.
  const submit = useCallback(() => {
    if (!entityQuestionPointTo.trim()) { setError("Entity Question Point To is required."); return; }
    if (!actualQuestion.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim()) { setError("Actual Question is required."); return; }
    onAdd({ questionNumber: itemCount + 1, actualQuestion, entityQuestionPointTo, responseStatus: "" });
    setEntityQuestionPointTo("");
    setActualQuestion("");
    setError("");
  }, [entityQuestionPointTo, actualQuestion, itemCount, onAdd]);

  return createPortal(
    <>
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 199 }} />
    <div
      style={{
        position: "fixed",
        left: `calc(50% + ${pos.x}px)`,
        top: `calc(50% + ${pos.y}px)`,
        transform: "translate(-50%, -50%)",
        width: 600,
        height: 437.59,
        maxHeight: "90vh",
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        background: C.white,
        boxShadow: "0px 8px 32px rgba(0,0,0,0.14), 0px 2px 8px rgba(0,0,0,0.06)",
        borderRadius: 8,
        overflow: "hidden",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}
    >
      {/* ── Header ── */}
      <div
        onMouseDown={onHeaderMouseDown}
        style={{ height: 78, display: "flex", alignItems: "center", padding: "0 20px", gap: 12, flexShrink: 0, cursor: "grab", userSelect: "none" }}
      >
        <div style={{ flexShrink: 0 }}><AnalysisQuestionHeaderIcon /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "15.6px", fontWeight: 700, color: C.grey11, letterSpacing: "-0.1px", lineHeight: "21px" }}>Analysis Question</div>
          <div style={{ fontSize: "11.1px", color: C.grey38, lineHeight: "17px", marginTop: 2 }}>Add and manage analysis questions for the current selection.</div>
        </div>
        <button className="sl-close-btn" onClick={onClose} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", borderRadius: 4, cursor: "pointer", flexShrink: 0, padding: 0 }} title="Close">
          <CloseIcon />
        </button>
      </div>

      {/* ── Command bar ── */}
      <div style={{ height: 44, background: C.grey96, display: "flex", alignItems: "center", padding: "0 12px", flexShrink: 0 }}>
        <button
          onClick={submit}
          onMouseEnter={() => setAddBtnHover(true)}
          onMouseLeave={() => setAddBtnHover(false)}
          style={{ height: 28, padding: "0 14px", background: addBtnHover ? "#106EBE" : C.blue, border: "none", borderRadius: 4, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", flexShrink: 0, fontFamily: "inherit" }}
        >
          <AddCircleIcon />
          <span style={{ fontSize: "11.8px", fontWeight: 700, color: C.white, lineHeight: "14px", whiteSpace: "nowrap" }}>Add Analysis Question</span>
        </button>
        <CmdSep />
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
          <button
            className="sl-icon-btn"
            onClick={() => { setToolbarCloseSignal((s) => s + 1); setInfoPanel((p) => (p === "analyze" ? null : "analyze")); }}
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: infoPanel === "analyze" ? C.iconBg : "transparent", border: "none", borderRadius: 4, cursor: "pointer", padding: 0, flexShrink: 0 }}
            title="Analyze Question"
          >
            <QuestionCheckIcon />
          </button>
          <button
            className="sl-icon-btn"
            onClick={() => { setToolbarCloseSignal((s) => s + 1); setInfoPanel((p) => (p === "flag" ? null : "flag")); }}
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: infoPanel === "flag" ? C.iconBg : "transparent", border: "none", borderRadius: 4, cursor: "pointer", padding: 0, flexShrink: 0 }}
            title="Flag Question For Analysis"
          >
            <QuestionBookmarkIcon />
          </button>
          <CmdSep />
          <RichTextToolbar editorRef={editorRef} closeSignal={toolbarCloseSignal} onOpen={() => setInfoPanel(null)} />
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ height: 36, background: C.white, display: "flex", alignItems: "flex-end", padding: "0 20px", borderBottom: `1px solid ${C.grey88}`, flexShrink: 0 }}>
        <div style={{ position: "relative", height: 36, display: "flex", alignItems: "center", fontSize: "12.7px", fontWeight: 700, color: C.grey11, lineHeight: "15px" }}>
          About Question
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: C.blue, borderRadius: "1px 1px 0 0" }} />
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {error && (
          <div style={{ padding: "8px 12px", background: "#FFF0F0", border: "1px solid #F5C2C2", borderRadius: 4, fontSize: "11.5px", color: "#A4262C" }}>
            {error}
          </div>
        )}
        <FormRow label="Entity Question Point To">
          <input style={inputStyle} placeholder="Enter entity this question points to" value={entityQuestionPointTo} onChange={(e) => { setEntityQuestionPointTo(e.target.value); setError(""); }} autoFocus />
        </FormRow>
        <FormRow label="Actual Question" alignTop>
          <RichEditor ref={editorRef} value={actualQuestion} onChange={(v) => { setActualQuestion(v); setError(""); }} placeholder="Enter the actual question..." style={{ minHeight: 120 }} />
        </FormRow>
      </div>

      {/* ── Footer ── */}
      <div style={{ height: 57, borderTop: `1px solid ${C.grey88}`, display: "flex", alignItems: "center", padding: "0 20px", gap: 8, flexShrink: 0, background: C.white, justifyContent: "flex-end" }}>
        <button className="sl-fr-btn" onClick={onClose} style={{ height: 32, padding: "0 18px", background: C.white, border: `1px solid ${C.grey78}`, borderRadius: 4, fontSize: "12.4px", fontFamily: "inherit", color: C.grey11, cursor: "pointer", flexShrink: 0 }}>
          Cancel
        </button>
        <button className="sl-fr-btn-primary" onClick={submit} style={{ height: 32, padding: "0 20px", background: C.blue, border: "none", borderRadius: 4, fontSize: "12.7px", fontWeight: 700, fontFamily: "inherit", color: C.white, cursor: "pointer", flexShrink: 0 }}>
          Add Question
        </button>
      </div>

      {/* ── Floating info card ── */}
      {infoPanel && (
        <InfoMessageCard
          title={INFO[infoPanel].title}
          text={INFO[infoPanel].text}
          onClose={() => setInfoPanel(null)}
        />
      )}
    </div>
    </>,
    document.body
  );
}
