// src/dialog/components/ProblemIdentificationDialog.tsx

import React, { useRef, useState, useCallback, useEffect } from "react";
import { useDraggable } from "@/dialog/hooks/useDraggable";
import { createPortal } from "react-dom";
import { RichTextToolbar } from "@/dialog/components/RichTextToolbar";
import { RichEditor } from "@/dialog/components/RichEditor";
import { InfoMessageCard } from "@/dialog/components/InfoMessageCard";
import { IdentifyProblemStarIcon, CloseIcon, ViewListAnalysisIcon, ViewListFeedbackIcon } from "@/dialog/components/Icons";
import { nowDate, nowTime } from "@/db/db";
import type { ProjectProblem } from "@/types/db";

type ProblemDraft = Omit<ProjectProblem, "id" | "analysisId">;

export interface ProblemIdentificationDialogProps {
  itemCount: number;
  existingErrors: string[];
  onAdd: (item: ProblemDraft) => void;
  onClose: () => void;
}

const C = {
  blue: "#0078D4",
  red: "#D13438",
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
  viewAnalysis: {
    title: "View List of Analysis",
    text: "The list of analysis contains all analyses that have been performed. By viewing the list of analysis while identifying a problem, you can see the context of previous analyses and ensure the problem being identified is properly connected to the entity under analysis.",
  },
  viewFeedback: {
    title: "View List of Feedback",
    text: "The list of feedback contains all feedback that has been provided based on identified errors and compensators. By viewing the list of feedback while identifying a problem, you can review what corrections have been applied and understand how errors that give rise to problems have previously been addressed.",
  },
} as const;

type InfoKey = keyof typeof INFO;

const VAL = {
  actualProblem: {
    title: "Actual Problem Message",
    text: "If we identify an entity, that entity must be actual. If we identify a problem in our project, then that problem must be actual. Here I need to enter or state the actual problem.",
  },
  problemName: {
    title: "Problem Name Message",
    text: "If we identify a problem, then that problem must have a name. If we identify a problem in our project, then that problem must have a name. Here I need to enter the name of the problem that I have identified.",
  },
  fromActualError: {
    title: "From Actual Error",
    text: "Error gives rise to problem; a problem that we identify comes from an error that we committed. Problems that we identify in our project are from errors that we are committed. Here I need to select the error that gives rise to the problem that I identify or need to identify.",
  },
  problemDescription: {
    title: "Problem Description Message",
    text: "We identify an entity, that entity has a description, and then we can describe that entity. We identify a problem, that problem has a description and we can state that description. Here I need to provide a description for the problem that I have identified.",
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

export function ProblemIdentificationDialog({ itemCount, existingErrors, onAdd, onClose }: ProblemIdentificationDialogProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const errorDropRef = useRef<HTMLDivElement>(null);
  const [toolbarCloseSignal, setToolbarCloseSignal] = useState(0);

  const [actualProblem, setActualProblem] = useState("");
  const [problemName, setProblemName] = useState("");
  // Multi-select when existingErrors are available (mirrors C# CheckedCombo)
  const [selectedErrors, setSelectedErrors] = useState<string[]>([]);
  const [errorDropOpen, setErrorDropOpen] = useState(false);
  // Plain text fallback when no errors exist yet
  const [fromActualErrorText, setFromActualErrorText] = useState("");
  const [problemDescription, setProblemDescription] = useState("");

  useEffect(() => {
    if (!errorDropOpen) return undefined;
    const handler = (e: MouseEvent) => {
      if (!errorDropRef.current?.contains(e.target as Node)) setErrorDropOpen(false);
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [errorDropOpen]);

  const toggleError = useCallback((err: string) => {
    setSelectedErrors((prev) => prev.includes(err) ? prev.filter((e) => e !== err) : [...prev, err]);
  }, []);

  const [problemDate] = useState(() => nowDate());
  const [problemTime] = useState(() => nowTime());

  const [infoPanel, setInfoPanel] = useState<InfoKey | null>(null);
  const [validation, setValidation] = useState<ValKey | null>(null);
  const [submitHovered, setSubmitHovered] = useState(false);

  const { pos, onHeaderMouseDown } = useDraggable();

  const toggleInfo = useCallback((key: InfoKey) => {
    setValidation(null);
    setToolbarCloseSignal((s) => s + 1);
    setInfoPanel((p) => (p === key ? null : key));
  }, []);

  const submit = useCallback(() => {
    setInfoPanel(null);
    if (!actualProblem.trim()) { setValidation("actualProblem"); return; }
    if (!problemName.trim()) { setValidation("problemName"); return; }
    const fromActualError = existingErrors.length > 0 ? selectedErrors.join(", ") : fromActualErrorText.trim();
    if (!fromActualError) { setValidation("fromActualError"); return; }
    if (!problemDescription.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim()) { setValidation("problemDescription"); return; }
    onAdd({
      problemNumber: itemCount + 1,
      actualProblem: actualProblem.trim(),
      problemName: problemName.trim(),
      fromActualError,
      problemDescription,
      problemDate,
      problemTime,
    });
    onClose();
  }, [actualProblem, problemName, selectedErrors, fromActualErrorText, existingErrors, problemDescription, problemDate, problemTime, itemCount, onAdd, onClose]);

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
          height: 580,
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
            <IdentifyProblemStarIcon color={C.blue} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "15.5px", fontWeight: 700, color: C.grey11, letterSpacing: "-0.1px", lineHeight: "21px" }}>Problem Identification</div>
            <div style={{ fontSize: "11.1px", color: C.grey38, lineHeight: "17px", marginTop: 2 }}>Identify and describe a problem linked to an error in the current analysis.</div>
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
            onMouseEnter={() => setSubmitHovered(true)}
            onMouseLeave={() => setSubmitHovered(false)}
            style={{ height: 28, padding: "0 14px", background: submitHovered ? "#C50F1F" : C.red, border: "none", borderRadius: 4, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", flexShrink: 0, fontFamily: "inherit" }}
          >
            <IdentifyProblemStarIcon color="white" />
            <span style={{ fontSize: "11.6px", fontWeight: 700, color: C.white, lineHeight: "14px", whiteSpace: "nowrap" }}>Identify Problem</span>
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
              <input
                style={inputStyle}
                placeholder="Enter the actual problem"
                value={actualProblem}
                onChange={(e) => setActualProblem(e.target.value)}
                autoFocus
              />
            </FormRow>
            <FormRow label="Problem Name">
              <input
                style={inputStyle}
                placeholder="Enter the name of this problem"
                value={problemName}
                onChange={(e) => setProblemName(e.target.value)}
              />
            </FormRow>
            <FormRow label="From Actual Error">
              {existingErrors.length > 0 ? (
                <div ref={errorDropRef} style={{ position: "relative" }}>
                  <button
                    type="button"
                    onClick={() => setErrorDropOpen((p) => !p)}
                    style={{
                      ...inputStyle,
                      textAlign: "left",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, color: selectedErrors.length === 0 ? "#BDBDBD" : C.grey11 }}>
                      {selectedErrors.length === 0
                        ? "Select error(s) that give rise to this problem"
                        : selectedErrors.join(", ")}
                    </span>
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ flexShrink: 0 }}>
                      <path d="M1 1L5 5L9 1" stroke="#616161" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {errorDropOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 2px)",
                        left: 0,
                        right: 0,
                        zIndex: 220,
                        background: C.white,
                        border: `1px solid ${C.grey78}`,
                        borderRadius: 4,
                        maxHeight: 180,
                        overflowY: "auto",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                      }}
                    >
                      {existingErrors.map((err, i) => (
                        <label
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "7px 10px",
                            cursor: "pointer",
                            fontSize: "12.2px",
                            fontFamily: "inherit",
                            color: C.grey11,
                            userSelect: "none",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedErrors.includes(err)}
                            onChange={() => toggleError(err)}
                            style={{ cursor: "pointer", flexShrink: 0 }}
                          />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{err}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <input
                  style={inputStyle}
                  placeholder="Enter the error that gives rise to this problem"
                  value={fromActualErrorText}
                  onChange={(e) => setFromActualErrorText(e.target.value)}
                />
              )}
            </FormRow>
          </div>

          <div style={{ height: 1, background: C.grey88, margin: "16px 0", flexShrink: 0 }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <FormRow label="Problem Date">
              <input style={readonlyInputStyle} value={problemDate} readOnly />
            </FormRow>
            <FormRow label="Problem Time">
              <input style={readonlyInputStyle} value={problemTime} readOnly />
            </FormRow>
          </div>

          <div style={{ height: 1, background: C.grey88, margin: "16px 0", flexShrink: 0 }} />

          <FormRow label="Problem Description" alignTop>
            <RichEditor
              ref={editorRef}
              value={problemDescription}
              onChange={setProblemDescription}
              placeholder="Describe the problem in detail..."
              style={{ minHeight: 100 }}
            />
          </FormRow>
        </div>

        {/* ── Footer ── */}
        <div style={{ height: 57, borderTop: `1px solid ${C.grey88}`, display: "flex", alignItems: "center", padding: "0 20px", gap: 8, flexShrink: 0, background: C.white }}>
          <span style={{ flex: 1, fontSize: "10.1px", color: C.grey38, lineHeight: "15px" }}>
            All four fields are required. The error selected determines the source of this problem.
          </span>
          <button
            className="sl-fr-btn"
            onClick={onClose}
            style={{ height: 32, padding: "0 18px", background: C.white, border: `1px solid ${C.grey78}`, borderRadius: 4, fontSize: "12.4px", fontFamily: "inherit", color: C.grey11, cursor: "pointer", flexShrink: 0 }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            onMouseEnter={() => setSubmitHovered(true)}
            onMouseLeave={() => setSubmitHovered(false)}
            style={{ height: 32, padding: "0 18px", background: submitHovered ? "#C50F1F" : C.red, border: "none", borderRadius: 4, fontSize: "12.9px", fontWeight: 700, fontFamily: "inherit", color: C.white, cursor: "pointer", flexShrink: 0 }}
          >
            Identify Problem
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
                <div style={{ width: 28, height: 28, borderRadius: 6, background: C.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="1.5" y="1.5" width="13" height="13" rx="6.5" stroke={C.blue} strokeWidth="1.4" />
                    <rect x="7.3" y="4.5" width="1.4" height="4.2" rx="0.7" fill={C.blue} />
                    <circle cx="8" cy="11" r="0.9" fill={C.blue} />
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
