// src/dialog/components/ErrorIdentificationDialog.tsx

import React, { useRef, useState, useCallback } from "react";
import { FooterBar, FooterHelperText, DismissBtn, PrimaryBtn } from "@/dialog/components/FooterButtons";
import { useDraggable } from "@/dialog/hooks/useDraggable";
import { createPortal } from "react-dom";
import { RichTextToolbar } from "@/dialog/components/RichTextToolbar";
import { RichEditor } from "@/dialog/components/RichEditor";
import { InfoMessageCard } from "@/dialog/components/InfoMessageCard";
import { ErrorIcon, CloseIcon, ViewListAnalysisIcon, ViewListFeedbackIcon } from "@/dialog/components/Icons";
import { nowDate, nowTime, formatDisplayDate } from "@/db/db";
import type { ProjectError } from "@/types/db";

type ErrorDraft = Omit<ProjectError, "id" | "analysisId">;

export interface ErrorIdentificationDialogProps {
  itemCount: number;
  onAdd: (item: ErrorDraft) => void;
  onClose: () => void;
  prefilledActualError?: string;
  prefilledDescription?: string;
  prefilledFromApplication?: string;
}

const C = {
  red: "#D13438",
  blue: "#0078D4",
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
  viewAnalysis: {
    title: "View List of Analysis",
    text: "The list of analysis contains all analyses that have been performed. By viewing the list of analysis while identifying an error, you can see the context of previous analyses and ensure the error being identified is properly connected to the entity under analysis. Understanding the broader analysis helps determine what compensator will be needed to correct the error.",
  },
  viewFeedback: {
    title: "View List of Feedback",
    text: "The list of feedback contains all feedback that has been provided based on identified errors and compensators. By viewing the list of feedback while identifying an error, you can review what corrections have been applied and understand how errors similar to the one being identified have previously been addressed.",
  },
} as const;

type InfoKey = keyof typeof INFO;

const VAL = {
  actualError: {
    title: "Actual Error Identify",
    text: "If we identify an error, that error must be an actual error. If an error exists, it must be real. Let's assume that in a sentence we identify a bad word and that word is Word One in that sentence. In this case, Word One is considered to be the actual error. We can name the actual error Word One or simply Word One identified in the identified sentence. Here I must enter the actual error or I must identify it.",
  },
  fromActual: {
    title: "From Actual Application or Communication",
    text: "If we identify an actual error, then that error must be identified either in an application or in a communication. If we identify an error, then that error must be in our communication or in what we do. Here we need to identify or say in what communication or the application the error is coming from. For instance, while I am communicating with my friend, I repeat a sentence that contains a bad word. Here the actual error is coming from my communication or my communication with my friend. Here I need to specify where the error is coming from.",
  },
  entityErrorPointTo: {
    title: "Entity Error Point To Message",
    text: "For instance, in oral and written communications, we identify entities by words that we use. Usually we commit an error if we don't think accordingly about an entity. In this case for instance, we can simply disregard the actual information about an entity and think about that entity differently than what it is. By thinking differently about an entity, then what we think about that entity does not match that entity or match the information about that entity. In this case, we simply think about another entity, whether it exists or not, but does not match the entity we should think about. By understanding that, we can see that this is simply an error that point to an incorrect entity or an entity that does not exist. Here all that I need to do is identify the entity the error points to.",
  },
  errorDescription: {
    title: "Error Description Message",
    text: "If an error exists, it must have a description. If we identify an error in our application, then we must be able to describe that error. If we identify an error in our communication, then we must be able to describe that error. By being able to describe an error, then that provides us with the possibility of correcting it. Here I will need to provide a description for the error that I have identified.",
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

export function ErrorIdentificationDialog({ itemCount, onAdd, onClose, prefilledActualError, prefilledDescription, prefilledFromApplication }: ErrorIdentificationDialogProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [toolbarCloseSignal, setToolbarCloseSignal] = useState(0);

  const [actualError, setActualError] = useState(prefilledActualError ?? "");
  const [fromActualCommunication, setFromActualCommunication] = useState(prefilledFromApplication ?? "");
  const [entityErrorPointTo, setEntityErrorPointTo] = useState("");
  const [errorDescription, setErrorDescription] = useState(prefilledDescription ?? "");

  const [errorDate] = useState(() => nowDate());
  const [errorTime] = useState(() => nowTime());

  const [infoPanel, setInfoPanel] = useState<InfoKey | null>(null);
  const [validation, setValidation] = useState<ValKey | null>(null);

  // ── Dragging ──────────────────────────────────────────────────────────────────
  const { pos, onHeaderMouseDown } = useDraggable();

  const toggleInfo = useCallback((key: InfoKey) => {
    setValidation(null);
    setToolbarCloseSignal((s) => s + 1);
    setInfoPanel((p) => (p === key ? null : key));
  }, []);

  const submit = useCallback(() => {
    setInfoPanel(null);
    if (!actualError.trim()) { setValidation("actualError"); return; }
    if (!fromActualCommunication.trim()) { setValidation("fromActual"); return; }
    if (!entityErrorPointTo.trim()) { setValidation("entityErrorPointTo"); return; }
    if (!errorDescription.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim()) { setValidation("errorDescription"); return; }
    onAdd({
      errorNumber: itemCount + 1,
      actualError: actualError.trim(),
      fromActualCommunication: fromActualCommunication.trim(),
      entityErrorPointTo: entityErrorPointTo.trim(),
      errorDescription,
      errorDate,
      errorTime,
    });
    onClose();
  }, [actualError, fromActualCommunication, entityErrorPointTo, errorDescription, itemCount, onAdd, onClose]);

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
        height: 621.59,
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
          <ErrorIcon />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "15.5px", fontWeight: 700, color: C.grey11, letterSpacing: "-0.1px", lineHeight: "21px" }}>Error Identification</div>
          <div style={{ fontSize: "11.1px", color: C.grey38, lineHeight: "17px", marginTop: 2 }}>Record and describe the error, link it to a communication or application, and submit for review.</div>
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
          style={{ height: 28, padding: "0 14px", background: C.red, border: "none", borderRadius: 4, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", flexShrink: 0, fontFamily: "inherit" }}
        >
          <ErrorIcon color="white" />
          <span style={{ fontSize: "11.6px", fontWeight: 700, color: C.white, lineHeight: "14px", whiteSpace: "nowrap" }}>Identify Error</span>
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
            <input
              style={inputStyle}
              placeholder="Enter actual error"
              value={actualError}
              onChange={(e) => setActualError(e.target.value)}
              autoFocus
            />
          </FormRow>
          <FormRow label="From Actual Comm / App">
            <input
              style={inputStyle}
              placeholder="Enter communication or application source"
              value={fromActualCommunication}
              onChange={(e) => setFromActualCommunication(e.target.value)}
            />
          </FormRow>
          <FormRow label="Entity Error Point To">
            <input
              style={inputStyle}
              placeholder="Enter entity this error points to"
              value={entityErrorPointTo}
              onChange={(e) => setEntityErrorPointTo(e.target.value)}
            />
          </FormRow>
        </div>

        <div style={{ height: 1, background: C.grey88, margin: "16px 0", flexShrink: 0 }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <FormRow label="Error Date">
            <input style={readonlyInputStyle} value={formatDisplayDate(errorDate)} readOnly />
          </FormRow>
          <FormRow label="Error Time">
            <input style={readonlyInputStyle} value={errorTime} readOnly />
          </FormRow>
        </div>

        <div style={{ height: 1, background: C.grey88, margin: "16px 0", flexShrink: 0 }} />

        <FormRow label="Error Description" alignTop>
          <RichEditor
            ref={editorRef}
            value={errorDescription}
            onChange={setErrorDescription}
            placeholder="Describe the error in detail..."
            style={{ minHeight: 120 }}
          />
        </FormRow>
      </div>

      {/* ── Footer ── */}
      <FooterBar>
        <FooterHelperText>Error can be linked to a selection and submitted for review.</FooterHelperText>
        <DismissBtn label="Cancel" onClick={onClose} />
        <PrimaryBtn label="Submit Error" onClick={submit} />
      </FooterBar>

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
