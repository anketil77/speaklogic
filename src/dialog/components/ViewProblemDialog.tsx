// src/dialog/components/ViewProblemDialog.tsx

import React, { useState, useCallback } from "react";
import { formatDisplayDate } from "@/db/db";
import { useDraggable } from "@/dialog/hooks/useDraggable";
import { createPortal } from "react-dom";
import { InfoMessageCard } from "@/dialog/components/InfoMessageCard";
import { ProblemIcon, CloseIcon, EditQuestionIcon, QuestionCheckIcon, FlagCommunicationIcon } from "@/dialog/components/Icons";
import type { ProjectProblem } from "@/types/db";

type ProblemDraft = Omit<ProjectProblem, "id" | "analysisId">;

export interface ViewProblemDialogProps {
  problem: ProblemDraft;
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

const LABEL_W = 168;

const INFO = {
  editProblem: {
    title: "Edit Problem Message",
    text: "We develop a problem by committing an error; we solve that problem by applying a feedback to enable the correction of that error. The error that gives rise to the problem cannot be edited, therefore the problem itself cannot be edited as well. Once we identify a problem, we think about solving that problem, rather than the editing of that problem, since the editing of a problem itself is not possible or practical.",
  },
  deleteProblem: {
    title: "Delete Problem Message",
    text: "A problem that we develop is solved when we apply a feedback to correct the error that gives rise to that problem. By not applying a feedback to enable the correction of the error, it is not possible for the problem to be solved. As we can see, the solution of a problem requires the correction of the error that causes that problem. It is not possible to delete a problem, but it is possible to correct the error that causes that problem.",
  },
  solveProblem: {
    title: "Solve Problem",
    text: "In order for a problem to be solved, a feedback must be applied where the error that gives rise to that problem must be corrected. If the error itself is not corrected, it is not possible for the identified problem to be solved. The overall solution process of a problem requires the identification of the feedback applied, the error corrected, and the compensator that was replaced to enable the correction.",
  },
} as const;

type InfoKey = keyof typeof INFO;

function CmdSep() {
  return <div style={{ width: 1, height: 20, background: C.grey88, flexShrink: 0, margin: "0 8px" }} />;
}

function FormRow({ label, children, alignTop = false }: { label: string; children: React.ReactNode; alignTop?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: alignTop ? "flex-start" : "center" }}>
      <div style={{ width: LABEL_W, minWidth: LABEL_W, fontSize: "11.8px", fontWeight: 700, color: C.grey11, lineHeight: "14px", paddingTop: alignTop ? 9 : 0, flexShrink: 0 }}>
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

export function ViewProblemDialog({ problem, onClose }: ViewProblemDialogProps) {
  const [infoPanel, setInfoPanel] = useState<InfoKey | null>(null);

  const { pos, onHeaderMouseDown } = useDraggable();

  const toggle = useCallback((key: InfoKey) => setInfoPanel((p) => (p === key ? null : key)), []);

  return createPortal(
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 199 }} />
      <div
        style={{
          position: "fixed",
          left: `calc(50% + ${pos.x}px)`,
          top: `calc(50% + ${pos.y}px)`,
          transform: "translate(-50%, -50%)",
          width: 760,
          maxWidth: "96vw",
          height: 560,
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
          style={{ height: 77.59, display: "flex", alignItems: "center", padding: "0 20px", gap: 12, flexShrink: 0, cursor: "grab", userSelect: "none" }}
        >
          <div style={{ width: 32, height: 32, borderRadius: 6, background: C.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ProblemIcon color={C.blue} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "15.5px", fontWeight: 700, color: C.grey11, letterSpacing: "-0.1px", lineHeight: "21px" }}>View Problem</div>
            <div style={{ fontSize: "11.1px", color: C.grey38, lineHeight: "17px", marginTop: 2 }}>View the details of the identified problem.</div>
          </div>
          <button
            className="sl-close-btn"
            onClick={onClose}
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", borderRadius: 4, cursor: "pointer", flexShrink: 0, padding: 0 }}
            title="Close"
          >
            <CloseIcon />
          </button>
        </div>

        {/* ── Command bar ── */}
        <div style={{ height: 44, background: C.grey96, display: "flex", alignItems: "center", padding: "0 12px", flexShrink: 0 }}>
          <button
            className="sl-icon-btn"
            onClick={() => toggle("editProblem")}
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: infoPanel === "editProblem" ? C.iconBg : "transparent", border: "none", borderRadius: 4, cursor: "pointer", padding: 0, flexShrink: 0 }}
            title="Edit Problem"
          >
            <EditQuestionIcon />
          </button>
          <CmdSep />
          <button
            className="sl-icon-btn"
            onClick={() => toggle("solveProblem")}
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: infoPanel === "solveProblem" ? C.iconBg : "transparent", border: "none", borderRadius: 4, cursor: "pointer", padding: 0, flexShrink: 0 }}
            title="Solve Problem"
          >
            <QuestionCheckIcon />
          </button>
          <button
            className="sl-icon-btn"
            onClick={() => toggle("deleteProblem")}
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: infoPanel === "deleteProblem" ? C.iconBg : "transparent", border: "none", borderRadius: 4, cursor: "pointer", padding: 0, flexShrink: 0 }}
            title="Delete Problem"
          >
            <FlagCommunicationIcon />
          </button>
        </div>

        {/* ── Tab bar ── */}
        <div style={{ height: 36, background: C.white, display: "flex", alignItems: "flex-end", padding: "0 20px", borderBottom: `1px solid ${C.grey88}`, flexShrink: 0 }}>
          <div style={{ position: "relative", height: 36, display: "flex", alignItems: "center", fontSize: "12.8px", fontWeight: 700, color: C.grey11, lineHeight: "15px" }}>
            About Problem
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: C.blue, borderRadius: "1px 1px 0 0" }} />
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.grey38, letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: 16 }}>
            Problem Details
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <FormRow label="Actual Problem">
              <input style={readonlyInput} value={problem.actualProblem} readOnly />
            </FormRow>
            <FormRow label="Problem Name">
              <input style={readonlyInput} value={problem.problemName} readOnly />
            </FormRow>
            <FormRow label="From Actual Error">
              <input style={readonlyInput} value={problem.fromActualError} readOnly />
            </FormRow>
          </div>

          <div style={{ height: 1, background: C.grey88, margin: "16px 0", flexShrink: 0 }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <FormRow label="Problem Date">
              <input style={readonlyInput} value={formatDisplayDate(problem.problemDate) ?? ""} readOnly />
            </FormRow>
            <FormRow label="Problem Time">
              <input style={readonlyInput} value={problem.problemTime ?? ""} readOnly />
            </FormRow>
          </div>

          <div style={{ height: 1, background: C.grey88, margin: "16px 0", flexShrink: 0 }} />

          <FormRow label="Problem Description" alignTop>
            <div
              style={{ minHeight: 100, border: `1px solid ${C.grey78}`, borderRadius: 4, padding: "8px 11px", fontSize: "12.2px", fontFamily: "inherit", color: C.grey11, background: C.grey96, lineHeight: "20px", overflowY: "auto" }}
              dangerouslySetInnerHTML={{ __html: problem.problemDescription || "" }}
            />
          </FormRow>
        </div>

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
