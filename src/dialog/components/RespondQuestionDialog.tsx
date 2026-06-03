// src/dialog/components/RespondQuestionDialog.tsx

import React, { useRef, useState, useCallback } from "react";
import { FooterBar, DismissBtn, PrimaryBtn } from "@/dialog/components/FooterButtons";
import { useDraggable } from "@/dialog/hooks/useDraggable";
import { createPortal } from "react-dom";
import { RichTextToolbar } from "@/dialog/components/RichTextToolbar";
import { RichEditor } from "@/dialog/components/RichEditor";
import { RespondQuestionHeaderIcon, AddCircleIcon, CloseIcon, ViewListAnalysisIcon, ViewListFeedbackIcon } from "@/dialog/components/Icons";
import type { ProjectQuestion } from "@/types/db";

type QuestionDraft = Omit<ProjectQuestion, "id" | "analysisId" | "questionDate" | "questionTime">;

export interface AnswerInfo {
  informationAnswerPointTo: string;
  actualAnswer: string;
}

export interface RespondQuestionDialogProps {
  question: QuestionDraft;
  onRespond: (info: AnswerInfo) => void;
  onClose: () => void;
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

const readonlyInput: React.CSSProperties = {
  width: "100%",
  height: 32,
  border: `1px solid ${C.grey78}`,
  borderRadius: 4,
  padding: "0 11px",
  fontSize: "12.2px",
  fontFamily: "inherit",
  color: C.grey38,
  background: C.grey96,
  boxSizing: "border-box",
  outline: "none",
  cursor: "default",
};

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

export function RespondQuestionDialog({ question, onRespond, onClose }: RespondQuestionDialogProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [toolbarCloseSignal] = useState(0);
  const [informationAnswerPointTo, setInformationAnswerPointTo] = useState("");
  const [actualAnswer, setActualAnswer] = useState("");
  const [error, setError] = useState("");
  const [respondBtnHover, setRespondBtnHover] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  // ── Dragging ──────────────────────────────────────────────────────────────────
  const { pos, onHeaderMouseDown } = useDraggable();

  // ── Submit ────────────────────────────────────────────────────────────────────
  const submit = useCallback(() => {
    if (!informationAnswerPointTo.trim()) {
      setError("Information Answer Point To is required.");
      return;
    }
    if (!actualAnswer.trim()) {
      setError("Actual Answer is required.");
      return;
    }
    onRespond({ informationAnswerPointTo, actualAnswer });
    setSucceeded(true);
  }, [informationAnswerPointTo, actualAnswer, onRespond]);

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
        height: 520,
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
      <div onMouseDown={onHeaderMouseDown} style={{ height: 78, display: "flex", alignItems: "center", padding: "0 20px", gap: 12, flexShrink: 0, cursor: "grab", userSelect: "none" }}>
        <div style={{ flexShrink: 0 }}><RespondQuestionHeaderIcon /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "15.6px", fontWeight: 700, color: C.grey11, letterSpacing: "-0.1px", lineHeight: "21px" }}>Respond Analysis Question</div>
          <div style={{ fontSize: "11.1px", color: C.grey38, lineHeight: "17px", marginTop: 2 }}>Provide an answer to the selected analysis question.</div>
        </div>
        <button className="sl-close-btn" onClick={onClose} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", borderRadius: 4, cursor: "pointer", flexShrink: 0, padding: 0 }} title="Close">
          <CloseIcon />
        </button>
      </div>

      {/* ── Command bar ── */}
      <div style={{ height: 44, background: C.grey96, display: "flex", alignItems: "center", padding: "0 12px", flexShrink: 0 }}>
        <button
          onClick={submit}
          onMouseEnter={() => setRespondBtnHover(true)}
          onMouseLeave={() => setRespondBtnHover(false)}
          style={{ height: 28, padding: "0 14px", background: respondBtnHover ? "#106EBE" : C.blue, border: "none", borderRadius: 4, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", flexShrink: 0, fontFamily: "inherit" }}
        >
          <AddCircleIcon />
          <span style={{ fontSize: "11.8px", fontWeight: 700, color: C.white, lineHeight: "14px", whiteSpace: "nowrap" }}>Respond Question</span>
        </button>
        <CmdSep />
        <button className="sl-icon-btn" style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", borderRadius: 4, cursor: "pointer", padding: 0, flexShrink: 0 }} title="View List Analysis">
          <ViewListAnalysisIcon />
        </button>
        <button className="sl-icon-btn" style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", borderRadius: 4, cursor: "pointer", padding: 0, flexShrink: 0 }} title="View List Feedback">
          <ViewListFeedbackIcon />
        </button>
        <CmdSep />
        <RichTextToolbar editorRef={editorRef} closeSignal={toolbarCloseSignal} />
      </div>

      {/* ── Tab bar ── */}
      <div style={{ height: 36, background: C.white, display: "flex", alignItems: "flex-end", padding: "0 20px", borderBottom: `1px solid ${C.grey88}`, flexShrink: 0 }}>
        <div style={{ position: "relative", height: 36, display: "flex", alignItems: "center", fontSize: "12.7px", fontWeight: 700, color: C.grey11, lineHeight: "15px" }}>
          About Answer
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: C.blue, borderRadius: "1px 1px 0 0" }} />
        </div>
      </div>

      {/* ── Body ── */}
      {succeeded ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: "32px 24px" }}>
          <div style={{ fontSize: "13.5px", color: C.grey11, textAlign: "center", lineHeight: "22px" }}>
            I have responded the question.<br />The Dialog is now Close.
          </div>
          <button
            onClick={onClose}
            style={{ height: 32, padding: "0 28px", background: C.blue, border: "none", borderRadius: 4, fontSize: "12.7px", fontWeight: 700, fontFamily: "inherit", color: C.white, cursor: "pointer" }}
          >
            OK
          </button>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          {error && (
            <div style={{ padding: "8px 12px", background: "#FFF0F0", border: "1px solid #F5C2C2", borderRadius: 4, fontSize: "11.5px", color: "#A4262C" }}>
              {error}
            </div>
          )}
          {/* Read-only question context */}
          <FormRow label="Actual Question" alignTop>
            <div
              style={{ minHeight: 48, border: `1px solid ${C.grey78}`, borderRadius: 4, padding: "8px 11px", fontSize: "12.2px", fontFamily: "inherit", color: C.grey38, background: C.grey96, lineHeight: "20px" }}
              dangerouslySetInnerHTML={{ __html: question.actualQuestion || "" }}
            />
          </FormRow>
          <FormRow label="Entity Question Point To">
            <input style={readonlyInput} value={question.entityQuestionPointTo} readOnly />
          </FormRow>
          {/* Editable answer fields */}
          <FormRow label="Information Answer Point To">
            <input
              style={inputStyle}
              placeholder="Enter the information this answer points to"
              value={informationAnswerPointTo}
              onChange={(e) => { setInformationAnswerPointTo(e.target.value); setError(""); }}
              autoFocus
            />
          </FormRow>
          <FormRow label="Actual Answer" alignTop>
            <RichEditor
              ref={editorRef}
              value={actualAnswer}
              onChange={(v) => { setActualAnswer(v); setError(""); }}
              placeholder="Enter the actual answer..."
              style={{ minHeight: 110 }}
            />
          </FormRow>
        </div>
      )}

      {/* ── Footer ── */}
      {!succeeded && (
        <FooterBar>
          <DismissBtn label="Cancel" onClick={onClose} />
          <PrimaryBtn label="Respond Question" onClick={submit} />
        </FooterBar>
      )}
    </div>
    </>,
    document.body
  );
}
