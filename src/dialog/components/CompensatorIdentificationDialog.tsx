// src/dialog/components/CompensatorIdentificationDialog.tsx

import React, { useRef, useState, useCallback } from "react";
import { useDraggable } from "@/dialog/hooks/useDraggable";
import { createPortal } from "react-dom";
import { RichTextToolbar } from "@/dialog/components/RichTextToolbar";
import { RichEditor } from "@/dialog/components/RichEditor";
import { InfoMessageCard } from "@/dialog/components/InfoMessageCard";
import { CompensatorIcon, CloseIcon, ViewListAnalysisIcon, ViewListFeedbackIcon } from "@/dialog/components/Icons";
import { nowDate, nowTime } from "@/db/db";
import type { ProjectCompensator } from "@/types/db";

type CompensatorDraft = Omit<ProjectCompensator, "id" | "analysisId">;

export interface CompensatorIdentificationDialogProps {
  itemCount: number;
  existingErrors: string[];
  existingApplications: string[];
  onAdd: (item: CompensatorDraft) => void;
  onClose: () => void;
  prefilledError?: string;
  prefilledApplication?: string;
  prefilledDescription?: string;
  prefilledActualCompensator?: string;
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
  viewAnalysis: {
    title: "View List of Analysis",
    text: "The list of analysis contains all analyses that have been performed. By viewing the list of analysis while identifying a compensator, you can see the context of previous analyses and ensure the compensator being identified is properly connected to the entity under analysis and the error it is meant to replace.",
  },
  viewFeedback: {
    title: "View List of Feedback",
    text: "The list of feedback contains all feedback that has been provided based on identified errors and compensators. By viewing the list of feedback while identifying a compensator, you can review what corrections have been applied and understand how compensators similar to the one being identified have previously been used.",
  },
} as const;

type InfoKey = keyof typeof INFO;

const VAL = {
  actualCompensator: {
    title: "Actual Compensator Message",
    text: "The actual compensator is the entity that needs to replace the error. Here I need to enter the actual compensator to enable the correction of the identified error.",
  },
  errorToReplace: {
    title: "Actual Error to Replace",
    text: "A compensator exists solely to enable the correction of an error. In order for the compensator to replace that error, that error itself must be identified. Here I identify the error that the compensator will replace.",
  },
  inActualApplication: {
    title: "In Actual Application or Communication",
    text: "The actual application or communization where the compensator is going to be used or corrected. For instance if there is an error in a sentence, that sentence is being viewed as the actual communication or the actual sentence. As well as, if within the production of an entity there is an error, if the compensator is going to be used to correct that error, then the actual production is being viewed as the actual application.",
  },
  compensatorDescription: {
    title: "Compensator Description",
    text: "If the compensator exists to enable the correction of an error, that compensator itself must have a description. Here I provide a description of the actual compensator.",
  },
} as const;

type ValKey = keyof typeof VAL;

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

const readonlyInputStyle: React.CSSProperties = {
  ...inputStyle,
  background: "#FAFAFA",
  cursor: "default",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none",
  paddingRight: 24,
  cursor: "pointer",
};

export function CompensatorIdentificationDialog({
  itemCount,
  existingErrors,
  existingApplications,
  onAdd,
  onClose,
  prefilledError,
  prefilledApplication,
  prefilledDescription,
  prefilledActualCompensator,
}: CompensatorIdentificationDialogProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [toolbarCloseSignal, setToolbarCloseSignal] = useState(0);

  const [actualCompensator, setActualCompensator] = useState(prefilledActualCompensator ?? "");
  const [errorToReplace, setErrorToReplace] = useState(prefilledError ?? "");
  const [inActualCommunication, setInActualCommunication] = useState(prefilledApplication ?? "");
  const [compensatorDescription, setCompensatorDescription] = useState(prefilledDescription ?? "");

  const [compensatorDate] = useState(() => nowDate());
  const [compensatorTime] = useState(() => nowTime());

  const [infoPanel, setInfoPanel] = useState<InfoKey | null>(null);
  const [validation, setValidation] = useState<ValKey | null>(null);

  const { pos, onHeaderMouseDown } = useDraggable();

  const toggleInfo = useCallback((key: InfoKey) => {
    setValidation(null);
    setToolbarCloseSignal((s) => s + 1);
    setInfoPanel((p) => (p === key ? null : key));
  }, []);

  const submit = useCallback(() => {
    setInfoPanel(null);
    if (!actualCompensator.trim()) { setValidation("actualCompensator"); return; }
    if (!errorToReplace.trim()) { setValidation("errorToReplace"); return; }
    if (!inActualCommunication.trim()) { setValidation("inActualApplication"); return; }
    if (!compensatorDescription.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim()) { setValidation("compensatorDescription"); return; }
    onAdd({
      compensatorNumber: itemCount + 1,
      actualCompensator: actualCompensator.trim(),
      actualErrorReplaced: errorToReplace.trim(),
      inActualCommunication: inActualCommunication.trim(),
      compensatorDescription,
      compensatorDate,
      compensatorTime,
    });
    onClose();
  }, [actualCompensator, errorToReplace, inActualCommunication, compensatorDescription, itemCount, onAdd, onClose]);

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
        height: 641.59,
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
          <CompensatorIcon />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "15.5px", fontWeight: 700, color: C.grey11, letterSpacing: "-0.1px", lineHeight: "21px" }}>Compensator</div>
          <div style={{ fontSize: "11.1px", color: C.grey38, lineHeight: "17px", marginTop: 2 }}>Identify the compensator that replaces the error and describe its role in the correction.</div>
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
          onClick={submit}
          style={{ height: 28, padding: "0 14px", background: C.blue, border: "none", borderRadius: 4, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", flexShrink: 0, fontFamily: "inherit" }}
        >
          <CompensatorIcon color="white" />
          <span style={{ fontSize: "11.6px", fontWeight: 700, color: C.white, lineHeight: "14px", whiteSpace: "nowrap" }}>Identify Compensator</span>
        </button>
        <CmdSep />
        <button
          className="sl-icon-btn"
          onClick={() => toggleInfo("viewAnalysis")}
          style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: infoPanel === "viewAnalysis" ? C.iconBg : "transparent", border: "none", borderRadius: 4, cursor: "pointer", padding: 0, flexShrink: 0 }}
          title="View List of Analysis"
        >
          <ViewListAnalysisIcon />
        </button>
        <button
          className="sl-icon-btn"
          onClick={() => toggleInfo("viewFeedback")}
          style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: infoPanel === "viewFeedback" ? C.iconBg : "transparent", border: "none", borderRadius: 4, cursor: "pointer", padding: 0, flexShrink: 0 }}
          title="View List of Feedback"
        >
          <ViewListFeedbackIcon />
        </button>
        <CmdSep />
        <RichTextToolbar editorRef={editorRef} closeSignal={toolbarCloseSignal} onOpen={() => setInfoPanel(null)} />
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
            <input
              style={inputStyle}
              placeholder="Enter actual compensator"
              value={actualCompensator}
              onChange={(e) => setActualCompensator(e.target.value)}
              autoFocus
            />
          </FormRow>
          <FormRow label="Actual Error To Replace">
            {existingErrors.length > 0 ? (
              <select
                style={selectStyle}
                value={errorToReplace}
                onChange={(e) => setErrorToReplace(e.target.value)}
              >
                <option value="">Select error to replace</option>
                {existingErrors.map((err, i) => (
                  <option key={i} value={err}>{err}</option>
                ))}
              </select>
            ) : (
              <input
                style={inputStyle}
                placeholder="Enter error to replace"
                value={errorToReplace}
                onChange={(e) => setErrorToReplace(e.target.value)}
              />
            )}
          </FormRow>
          <FormRow label="In Actual App / Comm">
            {existingApplications.length > 0 ? (
              <select
                style={selectStyle}
                value={inActualCommunication}
                onChange={(e) => setInActualCommunication(e.target.value)}
              >
                <option value="">Select application or communication</option>
                {existingApplications.map((app, i) => (
                  <option key={i} value={app}>{app}</option>
                ))}
              </select>
            ) : (
              <input
                style={inputStyle}
                placeholder="Enter actual application or communication"
                value={inActualCommunication}
                onChange={(e) => setInActualCommunication(e.target.value)}
              />
            )}
          </FormRow>
        </div>

        <div style={{ height: 1, background: C.grey88, margin: "16px 0", flexShrink: 0 }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <FormRow label="Compensator Date">
            <input style={readonlyInputStyle} value={compensatorDate} readOnly />
          </FormRow>
          <FormRow label="Compensator Time">
            <input style={readonlyInputStyle} value={compensatorTime} readOnly />
          </FormRow>
        </div>

        <div style={{ height: 1, background: C.grey88, margin: "16px 0", flexShrink: 0 }} />

        <FormRow label="Compensator Description" alignTop>
          <RichEditor
            ref={editorRef}
            value={compensatorDescription}
            onChange={setCompensatorDescription}
            placeholder="Describe the compensator and how it enables correction..."
            style={{ minHeight: 140 }}
          />
        </FormRow>
      </div>

      {/* ── Footer ── */}
      <div style={{ height: 57, borderTop: `1px solid ${C.grey88}`, display: "flex", alignItems: "center", padding: "0 20px", gap: 8, flexShrink: 0, background: C.white }}>
        <span style={{ flex: 1, fontSize: "10.1px", color: C.grey38, lineHeight: "15px" }}>
          Compensator replaces an identified error to enable correction.
        </span>
        <button
          className="sl-fr-btn"
          onClick={onClose}
          style={{ height: 32, padding: "0 18px", background: C.white, border: `1px solid ${C.grey78}`, borderRadius: 4, fontSize: "12.4px", fontFamily: "inherit", color: C.grey11, cursor: "pointer", flexShrink: 0 }}
        >
          Cancel
        </button>
        <button
          className="sl-fr-btn-primary"
          onClick={submit}
          style={{ height: 32, padding: "0 18px", background: C.blue, border: "none", borderRadius: 4, fontSize: "12.9px", fontWeight: 700, fontFamily: "inherit", color: C.white, cursor: "pointer", flexShrink: 0 }}
        >
          Submit Compensator
        </button>
      </div>

      {/* ── Info card ── */}
      {infoPanel && (
        <InfoMessageCard
          title={INFO[infoPanel].title}
          text={INFO[infoPanel].text}
          onClose={() => setInfoPanel(null)}
        />
      )}

      {/* ── Validation popup ── */}
      {validation && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.08)", zIndex: 210 }}>
          <div style={{ width: 480, background: C.white, borderRadius: 8, boxShadow: "0px 8px 32px rgba(0,0,0,0.14), 0px 2px 8px rgba(0,0,0,0.06)", overflow: "hidden", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
            <div style={{ height: 58, display: "flex", alignItems: "center", padding: "0 16px", gap: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: "#EBF3FC", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="1.5" y="1.5" width="13" height="13" rx="6.5" stroke="#0078D4" strokeWidth="1.4" />
                  <rect x="7.3" y="4.5" width="1.4" height="4.2" rx="0.7" fill="#0078D4" />
                  <circle cx="8" cy="11" r="0.9" fill="#0078D4" />
                </svg>
              </div>
              <div style={{ flex: 1, fontSize: "13.6px", fontWeight: 700, color: C.grey11, letterSpacing: "-0.1px" }}>{VAL[validation].title}</div>
              <button
                className="sl-close-btn"
                onClick={() => setValidation(null)}
                style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", borderRadius: 4, cursor: "pointer", padding: 0, flexShrink: 0 }}
              >
                <CloseIcon />
              </button>
            </div>
            <div style={{ padding: "8px 20px 16px", fontSize: "12px", color: C.grey11, lineHeight: "22px" }}>
              {VAL[validation].text}
            </div>
            <div style={{ height: 57, display: "flex", alignItems: "center", justifyContent: "center", borderTop: `1px solid ${C.grey88}` }}>
              <button
                onClick={() => setValidation(null)}
                style={{ height: 32, padding: "0 36px", background: C.blue, border: "none", borderRadius: 4, fontSize: "13px", fontWeight: 700, fontFamily: "inherit", color: C.white, cursor: "pointer" }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>,
    document.body
  );
}
