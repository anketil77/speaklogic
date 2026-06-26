// src/dialog/components/ViewAnswerDialog.tsx

import React, { useState, useCallback } from "react";
import { useDraggable } from "@/dialog/hooks/useDraggable";
import { createPortal } from "react-dom";
import { InfoMessageCard } from "@/dialog/components/InfoMessageCard";
import { AnswerIcon, CloseIcon, EditQuestionIcon, FlagCommunicationIcon, FeedbackModelIcon, ViewListAnalysisIcon } from "@/dialog/components/Icons";
import { EntityModelDialog } from "@/dialog/components/EntityModelDialog";
import type { ProjectAnswer } from "@/types/db";

type AnswerDraft = Omit<ProjectAnswer, "id" | "analysisId" | "questionId">;

export interface ViewAnswerDialogProps {
  answer: AnswerDraft;
  onClose: () => void;
  zIndexBase?: number;
  /** When provided, a "View Analysis" button opens the analysis this answer belongs to. */
  onViewAnalysis?: () => void;
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

const LABEL_W = 188;

const INFO = {
  editAnswer: {
    title: "Edit Answer Message",
    text: "An answer about an entity points to information about that entity. In order to edit an answer about an entity, the information about that entity must be edited. Since it is not possible to edit the information about the entity, it is not possible as well to edit the answer about that entity. Rather than editing the answer about an entity, think about the possibility of another answer about the same entity that points to the same or different information about it.",
  },
  deleteAnswer: {
    title: "Delete Answer Message",
    text: "An answer to a question about an entity points to information about that entity. If the entity exists, then the information about it exists, and so does the answer about that entity. Since the entity cannot be removed, the information about it cannot be removed either, and therefore the answer about it cannot be deleted. The only way to remove an answer is to remove the question it answers, which itself requires the entity it points to to no longer exist.",
  },
} as const;

type InfoKey = keyof typeof INFO;

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

export function ViewAnswerDialog({ answer, onClose, zIndexBase = 200, onViewAnalysis }: ViewAnswerDialogProps) {
  const [infoPanel, setInfoPanel] = useState<InfoKey | null>(null);
  const [showModel, setShowModel] = useState(false);

  const { pos, onHeaderMouseDown } = useDraggable();

  const toggle = useCallback((key: InfoKey) => setInfoPanel((p) => (p === key ? null : key)), []);

  return createPortal(
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: zIndexBase - 1 }} />
      <div
        style={{
          position: "fixed",
          left: `calc(50% + ${pos.x}px)`,
          top: `calc(50% + ${pos.y}px)`,
          transform: "translate(-50%, -50%)",
          width: 680,
          maxWidth: "96vw",
          height: 520,
          maxHeight: "90vh",
          zIndex: zIndexBase,
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
          <div style={{ width: 32, height: 32, borderRadius: 6, background: C.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <AnswerIcon color={C.blue} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "15.5px", fontWeight: 700, color: C.grey11, letterSpacing: "-0.1px", lineHeight: "21px" }}>View Answer</div>
            <div style={{ fontSize: "11.1px", color: C.grey38, lineHeight: "17px", marginTop: 2 }}>View the details of the selected answer.</div>
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
            onClick={() => toggle("editAnswer")}
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: infoPanel === "editAnswer" ? C.iconBg : "transparent", border: "none", borderRadius: 4, cursor: "pointer", padding: 0, flexShrink: 0 }}
            title="Edit Answer"
          >
            <EditQuestionIcon />
          </button>
          <CmdSep />
          <button
            className="sl-icon-btn"
            onClick={() => toggle("deleteAnswer")}
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: infoPanel === "deleteAnswer" ? C.iconBg : "transparent", border: "none", borderRadius: 4, cursor: "pointer", padding: 0, flexShrink: 0 }}
            title="Delete Answer"
          >
            <FlagCommunicationIcon />
          </button>
          <CmdSep />
          <button
            className="sl-icon-btn"
            onClick={() => setShowModel(true)}
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", borderRadius: 4, cursor: "pointer", padding: 0, flexShrink: 0 }}
            title="View Answer Model"
          >
            <FeedbackModelIcon color={C.grey38} />
          </button>
          {onViewAnalysis && (
            <>
              <CmdSep />
              <button className="sl-icon-btn" onClick={onViewAnalysis} style={{ height: 28, padding: "0 10px", display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", borderRadius: 4, cursor: "pointer", flexShrink: 0, fontFamily: "inherit" }} title="View the analysis this answer belongs to">
                <ViewListAnalysisIcon />
                <span style={{ fontSize: "11.6px", fontWeight: 700, color: C.grey11, whiteSpace: "nowrap" }}>View Analysis</span>
              </button>
            </>
          )}
        </div>

        {/* ── Tab bar ── */}
        <div style={{ height: 36, background: C.white, display: "flex", alignItems: "flex-end", padding: "0 20px", borderBottom: `1px solid ${C.grey88}`, flexShrink: 0 }}>
          <div style={{ position: "relative", height: 36, display: "flex", alignItems: "center", fontSize: "12.7px", fontWeight: 700, color: C.grey11, lineHeight: "15px" }}>
            About Answer
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: C.blue, borderRadius: "1px 1px 0 0" }} />
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          <FormRow label="Entity Question Point To">
            <input style={readonlyInput} value={answer.entityQuestionPointTo} readOnly />
          </FormRow>
          <FormRow label="Actual Question">
            <input style={readonlyInput} value={answer.actualQuestion} readOnly />
          </FormRow>
          <FormRow label="Information Answer Point To">
            <input style={readonlyInput} value={answer.informationAnswerPointTo} readOnly />
          </FormRow>
          <FormRow label="Actual Answer" alignTop>
            <div
              style={{ minHeight: 100, border: `1px solid ${C.grey78}`, borderRadius: 4, padding: "8px 11px", fontSize: "12.2px", fontFamily: "inherit", color: C.grey11, background: C.grey96, lineHeight: "20px", overflowY: "auto" }}
              dangerouslySetInnerHTML={{ __html: answer.actualAnswer || "" }}
            />
          </FormRow>

          <div style={{ height: 1, background: C.grey88, flexShrink: 0 }} />

          <FormRow label="Answer Date">
            <input style={readonlyInput} value={answer.answerDate ?? ""} readOnly />
          </FormRow>
          <FormRow label="Answer Time">
            <input style={readonlyInput} value={answer.answerTime ?? ""} readOnly />
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

      {showModel && (
        <EntityModelDialog
          title="Answer Model"
          subtitle="View the answer model representation."
          tabs={[
            // Model 1 (client 06-22, image23): the answer points to the information it identifies.
            {
              name: "Model 1",
              left: { label: "Actual Answer", content: answer.actualAnswer },
              right: { label: "Information", content: answer.informationAnswerPointTo },
              arrowLabel: "point to",
            },
            // Model 2 (existing, image24): the question is answered by the answer.
            {
              name: "Model 2",
              left: { label: "Actual Question", content: answer.actualQuestion },
              right: { label: "Actual Answer", content: answer.actualAnswer },
              arrowLabel: "answered by",
            },
          ]}
          zIndexBase={zIndexBase + 20}
          onClose={() => setShowModel(false)}
        />
      )}
    </>,
    document.body
  );
}
