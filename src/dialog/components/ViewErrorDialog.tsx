// src/dialog/components/ViewErrorDialog.tsx

import React, { useState, useCallback } from "react";
import { formatDisplayDate } from "@/db/db";
import { useDraggable } from "@/dialog/hooks/useDraggable";
import { createPortal } from "react-dom";
import { InfoMessageCard } from "@/dialog/components/InfoMessageCard";
import { ErrorIcon, CloseIcon, QuestionCheckIcon, FlagCommunicationIcon, EditQuestionIcon, FeedbackModelIcon, ViewListAnalysisIcon } from "@/dialog/components/Icons";
import { EntityModelDialog } from "@/dialog/components/EntityModelDialog";
import type { ProjectError } from "@/types/db";

type ErrorDraft = Omit<ProjectError, "id" | "analysisId">;

export interface ViewErrorDialogProps {
  error: ErrorDraft;
  onClose: () => void;
  zIndexBase?: number;
  /** When provided, a "View Analysis" button appears in the command bar that opens
   *  the analysis this error belongs to (used by the Stats Overview error list). */
  onViewAnalysis?: () => void;
}

const C = {
  red: "#D13438",
  grey11: "#1B1B1B",
  grey38: "#616161",
  grey78: "#C7C7C7",
  grey88: "#E0E0E0",
  grey96: "#F5F5F5",
  iconBg: "#F0FFF4",
  white: "#FFFFFF",
} as const;

const LABEL_W = 168;

const INFO = {
  editError: {
    title: "Edit Error Message",
    text: "An error is committed, the correction of that error requires the application of a feedback with a replacement of a compensator. The way to look at it, the overall correction process requires that error to be substituted and replaced by a compensator. In this case, we can see that it is not possible to edit an error after it is committed. After an error is committed, our objective is to get that error corrected with the application of a feedback.",
  },
  analyze: {
    title: "Analyze Error Message",
    text: "An error is identified within a communication or an application. Once identified, the error can be analyzed to determine its nature and what kind of compensator is needed to enable its correction. Within this window, the error being identified points to an entity. That entity can be analyzed to better understand the error within the context of this analysis.",
  },
  flag: {
    title: "Flag Error For Analysis",
    text: "An identified error can be flagged for further analysis. By flagging the error, it can later be reviewed in the context of the overall analysis. The error, once flagged, becomes a subject of analysis where a compensator can be identified to enable its correction.",
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
  border: `1px solid #C7C7C7`,
  borderRadius: 4,
  padding: "0 11px",
  fontSize: "12.2px",
  fontFamily: "inherit",
  color: "#616161",
  background: "#F5F5F5",
  boxSizing: "border-box",
  outline: "none",
  cursor: "default",
};

export function ViewErrorDialog({ error, onClose, zIndexBase = 200, onViewAnalysis }: ViewErrorDialogProps) {
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
        width: 760,
        maxWidth: "96vw",
        height: 621.59,
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
        style={{ height: 77.59, display: "flex", alignItems: "center", padding: "0 20px", gap: 12, flexShrink: 0, cursor: "grab", userSelect: "none" }}
      >
        <div style={{ width: 32, height: 32, borderRadius: 6, background: C.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <ErrorIcon />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "15.5px", fontWeight: 700, color: C.grey11, letterSpacing: "-0.1px", lineHeight: "21px" }}>View Error</div>
          <div style={{ fontSize: "11.1px", color: C.grey38, lineHeight: "17px", marginTop: 2 }}>View the identified error and its details.</div>
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
          onClick={() => toggle("editError")}
          style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: infoPanel === "editError" ? C.iconBg : "transparent", border: "none", borderRadius: 4, cursor: "pointer", padding: 0, flexShrink: 0 }}
          title="Edit Error"
        >
          <EditQuestionIcon />
        </button>
        <CmdSep />
        <button
          className="sl-icon-btn"
          onClick={() => toggle("analyze")}
          style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: infoPanel === "analyze" ? C.iconBg : "transparent", border: "none", borderRadius: 4, cursor: "pointer", padding: 0, flexShrink: 0 }}
          title="Analyze Error"
        >
          <QuestionCheckIcon />
        </button>
        <button
          className="sl-icon-btn"
          onClick={() => toggle("flag")}
          style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: infoPanel === "flag" ? C.iconBg : "transparent", border: "none", borderRadius: 4, cursor: "pointer", padding: 0, flexShrink: 0 }}
          title="Flag Error For Analysis"
        >
          <FlagCommunicationIcon />
        </button>
        <CmdSep />
        <button
          className="sl-icon-btn"
          onClick={() => setShowModel(true)}
          style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", borderRadius: 4, cursor: "pointer", padding: 0, flexShrink: 0 }}
          title="View Error Model"
        >
          <FeedbackModelIcon color={C.grey38} />
        </button>
        {onViewAnalysis && (
          <>
            <CmdSep />
            <button
              className="sl-icon-btn"
              onClick={onViewAnalysis}
              style={{ height: 28, padding: "0 10px", display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", borderRadius: 4, cursor: "pointer", flexShrink: 0, fontFamily: "inherit" }}
              title="View the analysis this error belongs to"
            >
              <ViewListAnalysisIcon />
              <span style={{ fontSize: "11.6px", fontWeight: 700, color: C.grey11, whiteSpace: "nowrap" }}>View Analysis</span>
            </button>
          </>
        )}
      </div>

      {/* ── Tab bar ── */}
      <div style={{ height: 36, background: C.white, display: "flex", alignItems: "flex-end", padding: "0 20px", borderBottom: `1px solid ${C.grey88}`, flexShrink: 0 }}>
        <div style={{ position: "relative", height: 36, display: "flex", alignItems: "center", fontSize: "12.8px", fontWeight: 700, color: C.grey11, lineHeight: "15px" }}>
          About Error
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: C.red, borderRadius: "1px 1px 0 0" }} />
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.grey38, letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: 16 }}>
          Error Details
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <FormRow label="Actual Error">
            <input style={readonlyInput} value={error.actualError} readOnly />
          </FormRow>
          <FormRow label="From Actual Comm / App">
            <input style={readonlyInput} value={error.fromActualCommunication} readOnly />
          </FormRow>
          <FormRow label="Entity Error Point To">
            <input style={readonlyInput} value={error.entityErrorPointTo} readOnly />
          </FormRow>
        </div>

        <div style={{ height: 1, background: C.grey88, margin: "16px 0", flexShrink: 0 }} />

        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: LABEL_W, minWidth: LABEL_W, fontSize: "11.8px", fontWeight: 700, color: C.grey11, flexShrink: 0 }}>Error Date</div>
          <input style={{ ...readonlyInput, flex: 1 }} value={formatDisplayDate(error.errorDate) || "—"} readOnly />
          <div style={{ width: 80, minWidth: 80, fontSize: "11.8px", fontWeight: 700, color: C.grey11, textAlign: "right", paddingRight: 12, flexShrink: 0 }}>Error Time</div>
          <input style={{ ...readonlyInput, width: 120, flex: "0 0 120px" }} value={error.errorTime || "—"} readOnly />
        </div>

        <div style={{ height: 1, background: C.grey88, margin: "16px 0", flexShrink: 0 }} />

        <FormRow label="Error Description" alignTop>
          <div
            style={{ minHeight: 120, border: `1px solid ${C.grey78}`, borderRadius: 4, padding: "8px 11px", fontSize: "12.2px", fontFamily: "inherit", color: C.grey11, background: C.grey96, lineHeight: "20px", overflowY: "auto" }}
            dangerouslySetInnerHTML={{ __html: error.errorDescription || "" }}
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

    {showModel && (
      <EntityModelDialog
        title="Error Model"
        subtitle="View the error model representation."
        left={{ label: "Actual Error", content: error.actualError }}
        right={{ label: "Entity Error Points To", content: error.entityErrorPointTo }}
        arrowLabel="points to"
        zIndexBase={zIndexBase + 20}
        onClose={() => setShowModel(false)}
      />
    )}
    </>,
    document.body
  );
}
