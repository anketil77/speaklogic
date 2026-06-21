// src/dialog/components/ViewQuestionDialog.tsx

import React, { useState, useCallback } from "react";
import { useDraggable } from "@/dialog/hooks/useDraggable";
import { createPortal } from "react-dom";
import { InfoMessageCard } from "@/dialog/components/InfoMessageCard";
import { ViewQuestionHeaderIcon, CloseIcon, QuestionCheckIcon, QuestionBookmarkIcon, FlagCommunicationIcon, EditQuestionIcon, FeedbackModelIcon } from "@/dialog/components/Icons";
import { EntityModelDialog } from "@/dialog/components/EntityModelDialog";
import type { ProjectQuestion } from "@/types/db";

type QuestionDraft = Omit<ProjectQuestion, "id" | "analysisId" | "questionDate" | "questionTime">;

export interface ViewQuestionDialogProps {
  question: QuestionDraft;
  onClose: () => void;
  zIndexBase?: number;
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
    text: "A question assumes the existence of the entity it points to. If the entity a question points to does not exist, then that question does not exist as well. By having a very good understanding of question and answer, we can see that a question about a question about an entity depends on that entity, while the answer of that question depends on information about that entity. If we cannot analyze the answer, we cannot analyze that question either. In this case we can see that in order to analyze a question, it has to be flagged as communication.",
  },
  flagForAnalysis: {
    title: "Flag Question For Analysis",
    text: "Usually, we don't analyze a question directly without flagging it first as communication. By understanding question and answer we know that the process of flagging a question for analysis requires first for that question to be flagged as communication, then flag that communication for analysis.",
  },
  flagAsCommunication: {
    title: "Flag Question as Communication",
    text: "A question assumes the existence of an entity it points to. If an entity exists, then there exists questions of that entity. If an entity does not exist, then questions about that entity do not exist, since those questions do not point to that entity. In our communication, if a question does not point to an entity, we simply call it an improper question. In this case, that question no longer exists for that entity, since it does not point to it. Within the communication itself, we simply call that question an improper question or an error in communication. Now by doing so, we can flag that question as a communication.",
  },
  editQuestion: {
    title: "Edit Question Message",
    text: "A question about an entity points to that entity, where the answer of that question points to information about that entity. In order to edit a question about an entity, the information about that entity must be edited, so does the entity itself. Since it is not possible to edit the information about the entity and the entity itself, it is not possible as well to edit the question about an entity. Rather than editing the question about an entity, here think about the possibility of another question about the same entity.",
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

export function ViewQuestionDialog({ question, onClose, zIndexBase = 200 }: ViewQuestionDialogProps) {
  const [infoPanel, setInfoPanel] = useState<InfoKey | null>(null);
  const [showModel, setShowModel] = useState(false);

  // ── Dragging ──────────────────────────────────────────────────────────────────
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
        width: 600,
        height: 400,
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
      <div onMouseDown={onHeaderMouseDown} style={{ height: 78, display: "flex", alignItems: "center", padding: "0 20px", gap: 12, flexShrink: 0, cursor: "grab", userSelect: "none" }}>
        <div style={{ flexShrink: 0 }}><ViewQuestionHeaderIcon /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "15.6px", fontWeight: 700, color: C.grey11, letterSpacing: "-0.1px", lineHeight: "21px" }}>View Analysis Question</div>
          <div style={{ fontSize: "11.1px", color: C.grey38, lineHeight: "17px", marginTop: 2 }}>View the selected analysis question and its details.</div>
        </div>
        <button className="sl-close-btn" onClick={onClose} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", borderRadius: 4, cursor: "pointer", flexShrink: 0, padding: 0 }} title="Close">
          <CloseIcon />
        </button>
      </div>

      {/* ── Command bar ── */}
      <div style={{ height: 44, background: C.grey96, display: "flex", alignItems: "center", padding: "0 12px", flexShrink: 0 }}>
        <button className="sl-icon-btn" onClick={() => toggle("analyze")} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: infoPanel === "analyze" ? C.iconBg : "transparent", border: "none", borderRadius: 4, cursor: "pointer", padding: 0, flexShrink: 0 }} title="Analyze Question">
          <QuestionCheckIcon />
        </button>
        <button className="sl-icon-btn" onClick={() => toggle("flagForAnalysis")} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: infoPanel === "flagForAnalysis" ? C.iconBg : "transparent", border: "none", borderRadius: 4, cursor: "pointer", padding: 0, flexShrink: 0 }} title="Flag Question For Analysis">
          <QuestionBookmarkIcon />
        </button>
        <CmdSep />
        <button className="sl-icon-btn" onClick={() => toggle("flagAsCommunication")} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: infoPanel === "flagAsCommunication" ? C.iconBg : "transparent", border: "none", borderRadius: 4, cursor: "pointer", padding: 0, flexShrink: 0 }} title="Flag Question as Communication">
          <FlagCommunicationIcon />
        </button>
        <button className="sl-icon-btn" onClick={() => toggle("editQuestion")} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: infoPanel === "editQuestion" ? C.iconBg : "transparent", border: "none", borderRadius: 4, cursor: "pointer", padding: 0, flexShrink: 0 }} title="Edit This Question">
          <EditQuestionIcon />
        </button>
        <CmdSep />
        <button className="sl-icon-btn" onClick={() => setShowModel(true)} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", borderRadius: 4, cursor: "pointer", padding: 0, flexShrink: 0 }} title="View Question Model">
          <FeedbackModelIcon color={C.grey38} />
        </button>
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
        <FormRow label="Entity Question Point To">
          <input style={readonlyInput} value={question.entityQuestionPointTo} readOnly />
        </FormRow>
        <FormRow label="Actual Question" alignTop>
          <div
            style={{ minHeight: 120, border: `1px solid ${C.grey78}`, borderRadius: 4, padding: "8px 11px", fontSize: "12.2px", fontFamily: "inherit", color: C.grey11, background: C.grey96, lineHeight: "20px", overflowY: "auto" }}
            dangerouslySetInnerHTML={{ __html: question.actualQuestion || "" }}
          />
        </FormRow>
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

    {showModel && (
      <EntityModelDialog
        title="Question Model"
        subtitle="View the question model representation."
        left={{ label: "Actual Question", content: question.actualQuestion }}
        right={{ label: "Entity Question Points To", content: question.entityQuestionPointTo }}
        arrowLabel="points to"
        onClose={() => setShowModel(false)}
      />
    )}
    </>,
    document.body
  );
}
