// src/dialog/components/ViewCompensatorDialog.tsx

import React, { useState, useCallback } from "react";
import { useDraggable } from "@/dialog/hooks/useDraggable";
import { createPortal } from "react-dom";
import { InfoMessageCard } from "@/dialog/components/InfoMessageCard";
import { CompensatorIcon, CloseIcon, EditQuestionIcon, QuestionCheckIcon, FlagCommunicationIcon } from "@/dialog/components/Icons";
import type { ProjectCompensator } from "@/types/db";

type CompensatorDraft = Omit<ProjectCompensator, "id" | "analysisId">;

export interface ViewCompensatorDialogProps {
  compensator: CompensatorDraft;
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
  iconBg: "#F0FFF4",
  white: "#FFFFFF",
} as const;

const LABEL_W = 178;

const INFO = {
  editCompensator: {
    title: "Edit Compensator Message",
    text: "An error that is committed is corrected with the application of a feedback and the replacement of a compensator. Within the feedback itself or the application of the feedback, there exists a compensator that enables the correction of that error. Now if it was possible for us to edit the compensator that enables the correction of the identified error, the correction process would not be possible at all. By understanding that we can see it is not possible or practical to edit a compensator.",
  },
  analyzeCompensator: {
    title: "Analyze Compensator Message",
    text: "Within a feedback itself, a compensator is identified. In an analysis, a compensator can be identified. A compensator itself, is a part of a feedback or a part of an analysis. For instance, we identify the compensator entity in a feedback, we can also identify the compensator entity in an analysis. Since the compensator entity is a part of a feedback or an analysis, it is not possible for us to detach or separate that entity from the entity is a part of. Therefore we cannot analyze a compensator by itself.",
  },
  flagCompensator: {
    title: "Flag Compensator Message",
    text: "An identified compensator does not exist by itself, but with the analysis or the feedback it is a part of. For instance, within my communication, if I repeat a sentence where a bad word is identified, then the analysis of that sentence enable the identification of a good word that can be used as a compensator for the bad word. As well as, if the analysis is given as within that feedback, a good word can be used as a compensator for the bad word. As we can see, the compensator does not exist by itself, but with the analysis of the sentence or the feedback that enables the correction of the sentence. As we cannot flag the good word that acts as a compensator without the analysis or the feedback it is a part of.",
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

export function ViewCompensatorDialog({ compensator, onClose, zIndexBase = 200 }: ViewCompensatorDialogProps) {
  const [infoPanel, setInfoPanel] = useState<InfoKey | null>(null);

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
          <CompensatorIcon />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "15.5px", fontWeight: 700, color: C.grey11, letterSpacing: "-0.1px", lineHeight: "21px" }}>View Compensator</div>
          <div style={{ fontSize: "11.1px", color: C.grey38, lineHeight: "17px", marginTop: 2 }}>View the identified compensator and its details.</div>
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
          onClick={() => toggle("editCompensator")}
          style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: infoPanel === "editCompensator" ? C.iconBg : "transparent", border: "none", borderRadius: 4, cursor: "pointer", padding: 0, flexShrink: 0 }}
          title="Edit Compensator"
        >
          <EditQuestionIcon />
        </button>
        <CmdSep />
        <button
          className="sl-icon-btn"
          onClick={() => toggle("analyzeCompensator")}
          style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: infoPanel === "analyzeCompensator" ? C.iconBg : "transparent", border: "none", borderRadius: 4, cursor: "pointer", padding: 0, flexShrink: 0 }}
          title="Analyze Compensator"
        >
          <QuestionCheckIcon />
        </button>
        <button
          className="sl-icon-btn"
          onClick={() => toggle("flagCompensator")}
          style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: infoPanel === "flagCompensator" ? C.iconBg : "transparent", border: "none", borderRadius: 4, cursor: "pointer", padding: 0, flexShrink: 0 }}
          title="Flag Compensator For Analysis"
        >
          <FlagCommunicationIcon />
        </button>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ height: 36, background: C.white, display: "flex", alignItems: "flex-end", padding: "0 20px", borderBottom: `1px solid ${C.grey88}`, flexShrink: 0 }}>
        <div style={{ position: "relative", height: 36, display: "flex", alignItems: "center", fontSize: "12.8px", fontWeight: 700, color: C.grey11, lineHeight: "15px" }}>
          About Compensator
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: C.blue, borderRadius: "1px 1px 0 0" }} />
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.grey38, letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: 16 }}>
          Compensator Details
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <FormRow label="Actual Compensator">
            <input style={readonlyInput} value={compensator.actualCompensator} readOnly />
          </FormRow>
          <FormRow label="Actual Error Replaced">
            <input style={readonlyInput} value={compensator.actualErrorReplaced} readOnly />
          </FormRow>
          <FormRow label="In Actual App / Comm">
            <input style={readonlyInput} value={compensator.inActualCommunication} readOnly />
          </FormRow>
        </div>

        <div style={{ height: 1, background: C.grey88, margin: "16px 0", flexShrink: 0 }} />

        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: LABEL_W, minWidth: LABEL_W, fontSize: "11.8px", fontWeight: 700, color: C.grey11, flexShrink: 0 }}>Compensator Date</div>
          <input style={{ ...readonlyInput, flex: 1 }} value={compensator.compensatorDate || "—"} readOnly />
          <div style={{ width: 80, minWidth: 80, fontSize: "11.8px", fontWeight: 700, color: C.grey11, textAlign: "right", paddingRight: 12, flexShrink: 0 }}>Time</div>
          <input style={{ ...readonlyInput, width: 120, flex: "0 0 120px" }} value={compensator.compensatorTime || "—"} readOnly />
        </div>

        <div style={{ height: 1, background: C.grey88, margin: "16px 0", flexShrink: 0 }} />

        <FormRow label="Compensator Description" alignTop>
          <div
            style={{ minHeight: 120, border: `1px solid ${C.grey78}`, borderRadius: 4, padding: "8px 11px", fontSize: "12.2px", fontFamily: "inherit", color: C.grey11, background: C.grey96, lineHeight: "20px", overflowY: "auto" }}
            dangerouslySetInnerHTML={{ __html: compensator.compensatorDescription || "" }}
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
