// src/dialog/views/AnalysisQuestionView.tsx

/* global Office */

import React, { useRef, useState, useCallback } from "react";
import { FooterBar, DismissBtn, PrimaryBtn } from "@/dialog/components/FooterButtons";
import { RichTextToolbar } from "@/dialog/components/RichTextToolbar";
import { RichEditor } from "@/dialog/components/RichEditor";
import { QuestionIcon } from "@/dialog/components/Icons";
import { nowDate, nowTime } from "@/db/db";
import type { ProjectQuestion } from "@/types/db";

// ─── Design tokens ────────────────────────────────────────────────────────────
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

// ─── Small pieces ─────────────────────────────────────────────────────────────

function CmdSep() {
  return (
    <div
      style={{ width: 1, height: 20, background: C.grey88, flexShrink: 0, margin: "0 8px" }}
    />
  );
}

function FormRow({
  label,
  children,
  alignTop = false,
}: {
  label: string;
  children: React.ReactNode;
  alignTop?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: alignTop ? "flex-start" : "center", gap: 0 }}>
      <div
        style={{
          width: LABEL_W,
          minWidth: LABEL_W,
          fontSize: "11.3px",
          fontWeight: 400,
          color: C.grey11,
          lineHeight: "14px",
          paddingTop: alignTop ? 9 : 0,
          flexShrink: 0,
        }}
      >
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

// ─── Main component ───────────────────────────────────────────────────────────

export default function AnalysisQuestionView() {
  const editorRef = useRef<HTMLDivElement>(null);
  const [toolbarCloseSignal, setToolbarCloseSignal] = useState(0);

  const [entityQuestionPointTo, setEntityQuestionPointTo] = useState("");
  const [actualQuestion, setActualQuestion] = useState("");

  const close = useCallback(() => {
    try {
      Office.context.ui.messageParent(JSON.stringify({ action: "CLOSE" }));
    } catch {
      window.close();
    }
  }, []);

  const submit = useCallback(() => {
    const payload: Omit<ProjectQuestion, "id" | "analysisId"> = {
      questionNumber: 0,
      actualQuestion,
      entityQuestionPointTo,
      responseStatus: "Pending",
      questionDate: nowDate(),
      questionTime: nowTime(),
    };
    try {
      Office.context.ui.messageParent(JSON.stringify({ action: "ADD_QUESTION", payload }));
    } catch {
      window.close();
    }
  }, [actualQuestion, entityQuestionPointTo]);

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        background: C.white,
        overflow: "hidden",
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        style={{
          height: 78,
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: 12,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            background: C.iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <QuestionIcon />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "15.6px",
              fontWeight: 700,
              color: C.grey11,
              letterSpacing: "-0.1px",
              lineHeight: "21px",
            }}
          >
            Analysis Question
          </div>
          <div style={{ fontSize: "11.1px", color: C.grey38, lineHeight: "17px", marginTop: 2 }}>
            Add and manage analysis questions for the current selection.
          </div>
        </div>
      </div>

      {/* ── Command bar ─────────────────────────────────────────────────── */}
      <div
        style={{
          height: 44,
          background: C.grey96,
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          flexShrink: 0,
        }}
      >
        {/* Primary: Add Analysis Question */}
        <button
          className="sl-icon-btn"
          onClick={submit}
          style={{
            height: 28,
            padding: "0 14px",
            background: C.blue,
            border: "none",
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
            flexShrink: 0,
            fontFamily: "inherit",
          }}
        >
          <QuestionIcon />
          <span
            style={{
              fontSize: "11.8px",
              fontWeight: 700,
              color: C.white,
              lineHeight: "14px",
              whiteSpace: "nowrap",
            }}
          >
            Add Analysis Question
          </span>
        </button>

        <CmdSep />

        {/* Right: RichTextToolbar */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
          <RichTextToolbar
            editorRef={editorRef}
            closeSignal={toolbarCloseSignal}
            onOpen={() => setToolbarCloseSignal((s) => s + 1)}
          />
        </div>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <div
        style={{
          height: 36,
          background: C.white,
          display: "flex",
          alignItems: "flex-end",
          padding: "0 20px",
          borderBottom: `1px solid ${C.grey88}`,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "relative",
            height: 36,
            display: "flex",
            alignItems: "center",
            fontSize: "12.7px",
            fontWeight: 700,
            color: C.grey11,
            lineHeight: "15px",
          }}
        >
          About Question
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 2,
              background: C.blue,
              borderRadius: "1px 1px 0 0",
            }}
          />
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <FormRow label="Entity Question Point To">
          <input
            style={inputStyle}
            placeholder="Enter entity this question points to"
            value={entityQuestionPointTo}
            onChange={(e) => setEntityQuestionPointTo(e.target.value)}
          />
        </FormRow>

        <FormRow label="Actual Question" alignTop>
          <RichEditor
            ref={editorRef}
            value={actualQuestion}
            onChange={setActualQuestion}
            placeholder="Enter the actual question..."
            style={{ minHeight: 160 }}
          />
        </FormRow>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <FooterBar>
        <DismissBtn label="Cancel" onClick={close} />
        <PrimaryBtn label="Add Question" onClick={submit} />
      </FooterBar>
    </div>
  );
}
