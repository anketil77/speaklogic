// src/dialog/views/IdentifyProblemView.tsx

/* global Office */

import React, { useRef, useState, useCallback } from "react";
import { RichTextToolbar } from "@/dialog/components/RichTextToolbar";
import { RichEditor } from "@/dialog/components/RichEditor";
import { ProblemIcon } from "@/dialog/components/Icons";
import { nowDate, nowTime } from "@/db/db";
import type { ProjectProblem } from "@/types/db";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  red: "#D13438",
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
    <div style={{ width: 1, height: 20, background: C.grey88, flexShrink: 0, margin: "0 8px" }} />
  );
}

function SelectArrow() {
  return (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ pointerEvents: "none" }}>
      <path
        d="M1 1L5 5L9 1"
        stroke={C.grey38}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
    <div style={{ display: "flex", alignItems: alignTop ? "flex-start" : "center" }}>
      <div
        style={{
          width: LABEL_W,
          minWidth: LABEL_W,
          fontSize: "11.8px",
          fontWeight: 700,
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

interface IdentifyProblemViewProps {
  /** Existing error texts passed from parent to populate the dropdown. */
  existingErrors?: string[];
}

export default function IdentifyProblemView({ existingErrors = [] }: IdentifyProblemViewProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [toolbarCloseSignal, setToolbarCloseSignal] = useState(0);

  const [problemName, setProblemName] = useState("");
  const [actualProblem, setActualProblem] = useState("");
  const [fromActualError, setFromActualError] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [submitHovered, setSubmitHovered] = useState(false);

  const close = useCallback(() => {
    try {
      Office.context.ui.messageParent(JSON.stringify({ action: "CLOSE" }));
    } catch {
      window.close();
    }
  }, []);

  const submit = useCallback(() => {
    const payload: Omit<ProjectProblem, "id" | "analysisId"> = {
      problemNumber: 0,
      problemName,
      actualProblem,
      fromActualError,
      problemDescription,
      problemDate: nowDate(),
      problemTime: nowTime(),
    };
    try {
      Office.context.ui.messageParent(JSON.stringify({ action: "ADD_PROBLEM", payload }));
    } catch {
      window.close();
    }
  }, [problemName, actualProblem, fromActualError, problemDescription]);

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
          <ProblemIcon />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "15.5px",
              fontWeight: 700,
              color: C.grey11,
              letterSpacing: "-0.1px",
              lineHeight: "21px",
            }}
          >
            Problem Identification
          </div>
          <div style={{ fontSize: "11.1px", color: C.grey38, lineHeight: "17px", marginTop: 2 }}>
            Identify and describe a problem linked to the current selection.
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
        <button
          className="sl-icon-btn"
          onClick={submit}
          style={{
            height: 28,
            padding: "0 14px",
            background: C.red,
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
          <ProblemIcon color="#FFFFFF" />
          <span
            style={{
              fontSize: "11.8px",
              fontWeight: 700,
              color: C.white,
              lineHeight: "14px",
              whiteSpace: "nowrap",
            }}
          >
            Identify Problem
          </span>
        </button>

        <CmdSep />

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
          About Problem
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
          gap: 0,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: C.grey38,
            letterSpacing: "0.6px",
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          Problem Details
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <FormRow label="Problem Name">
            <input
              style={inputStyle}
              placeholder="Enter problem name"
              value={problemName}
              onChange={(e) => setProblemName(e.target.value)}
            />
          </FormRow>

          <FormRow label="Actual Problem">
            <input
              style={inputStyle}
              placeholder="Enter the actual problem"
              value={actualProblem}
              onChange={(e) => setActualProblem(e.target.value)}
            />
          </FormRow>

          <FormRow label="From Actual Error">
            {existingErrors.length > 0 ? (
              <div style={{ position: "relative", width: "100%" }}>
                <select
                  value={fromActualError}
                  onChange={(e) => setFromActualError(e.target.value)}
                  style={{ ...inputStyle, appearance: "none", paddingRight: 30, cursor: "pointer" }}
                >
                  <option value="">Select actual error</option>
                  {existingErrors.map((err, i) => (
                    <option key={i} value={err}>
                      {err}
                    </option>
                  ))}
                </select>
                <div
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}
                >
                  <SelectArrow />
                </div>
              </div>
            ) : (
              <input
                style={inputStyle}
                placeholder="Enter the error that gives rise to this problem"
                value={fromActualError}
                onChange={(e) => setFromActualError(e.target.value)}
              />
            )}
          </FormRow>
        </div>

        <div style={{ height: 1, background: C.grey88, margin: "16px 0" }} />

        <FormRow label="Problem Description" alignTop>
          <RichEditor
            ref={editorRef}
            value={problemDescription}
            onChange={setProblemDescription}
            placeholder="Describe the problem in detail..."
            style={{ minHeight: 160 }}
          />
        </FormRow>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div
        style={{
          height: 57,
          borderTop: `1px solid ${C.grey88}`,
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: 8,
          flexShrink: 0,
          background: C.white,
        }}
      >
        <span
          style={{
            flex: 1,
            fontSize: "10.1px",
            fontWeight: 400,
            color: C.grey38,
            lineHeight: "15px",
          }}
        >
          A problem must have a name, an actual problem, and the error it comes from.
        </span>

        <button
          className="sl-fr-btn"
          onClick={close}
          style={{
            height: 32,
            padding: "0 18px",
            background: C.white,
            border: `1px solid ${C.grey78}`,
            borderRadius: 4,
            fontSize: "12.4px",
            fontFamily: "inherit",
            color: C.grey11,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          Cancel
        </button>

        <button
          onClick={submit}
          onMouseEnter={() => setSubmitHovered(true)}
          onMouseLeave={() => setSubmitHovered(false)}
          style={{
            height: 32,
            padding: "0 20px",
            background: submitHovered ? "#C50F1F" : C.red,
            border: "none",
            borderRadius: 4,
            fontSize: "12.9px",
            fontWeight: 700,
            fontFamily: "inherit",
            color: C.white,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          Identify Problem
        </button>
      </div>
    </div>
  );
}
