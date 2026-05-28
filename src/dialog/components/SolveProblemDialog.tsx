// src/dialog/components/SolveProblemDialog.tsx
// Portal dialog — "Solve Problem" opened from Problems tab context menu.
// C# ref: SolveProblem.cs + SolveProblem.Designer.cs
// Two tabs: About Solution | Attached Files
// Required: Feedback Applied, Error Corrected, Compensator Replaced

import React, { useCallback, useState } from "react";
import ReactDOM from "react-dom";
import { useDraggable } from "@/dialog/hooks/useDraggable";
import { AttachFilePanel } from "@/dialog/views/analyze/panels/AttachFilePanel";
import { AttachFileDialog } from "@/dialog/components/AttachFileDialog";
import { ViewFileInformationDialog } from "@/dialog/components/ViewFileInformationDialog";
import { RichEditor } from "@/dialog/components/RichEditor";
import { RichTextToolbar } from "@/dialog/components/RichTextToolbar";
import type { ProjectProblem, AttachFileToProject } from "@/types/db";

type FileDraft = Omit<AttachFileToProject, "id" | "analysisId" | "feedbackId" | "flagId" | "articleId" | "principleInterpretationId" | "selectionWithPrincipleId" | "principleInSelectionId">;

interface Props {
  problem:              ProjectProblem;
  existingErrors:       string[];
  existingCompensators: string[];
  onSolve: (solution: {
    feedbackApplied:      string;
    errorCorrected:       string;
    compensatorReplaced:  string;
    additionalExplanation: string;
    files:                FileDraft[];
    removeProblem:        boolean;
  }) => void;
  onClose: () => void;
}

const VALIDATION_MSGS = {
  feedbackApplied: "In order for a problem to be solved, a feedback must be applied. By applying a feedback, it is possible for us to solve an identified problem. It is not possible to solve an identified problem with the absence of feedback. Here I need to select the feedback or feedbacks that have applied to solve the problem.",
  errorCorrected:  "In order to solve an identified problem, feedback must be applied where the error that gives rise to that problem must be corrected. If the error itself is not corrected, it is not possible for the identified problem to be solved. Here I need to identified the error or errors that were corrected.",
  compensatorReplaced: "In order for an identified problem to be solved, error must be corrected, where the error itself is replaced by a compensator. The correction itself is not possible without the replacing compensator. The overall solution process of a problem is not possible as well with the absence of a compensator. Here I need to select the compensator or compensators that are replaced to enable the identified problem to be solved.",
} as const;

const DIALOG_W = 760;
const DIALOG_H = 600;

export function SolveProblemDialog({ problem, existingErrors, existingCompensators, onSolve, onClose }: Props) {
  const { pos, onHeaderMouseDown } = useDraggable({
    initialX: Math.round((window.innerWidth - DIALOG_W) / 2),
    initialY: Math.round((window.innerHeight - DIALOG_H) / 2),
  });

  const [activeTab, setActiveTab] = useState<"solution" | "files">("solution");
  const [feedbackApplied, setFeedbackApplied]     = useState("");
  const [selectedErrors, setSelectedErrors]       = useState<string[]>([]);
  const [errorText, setErrorText]                 = useState("");
  const [selectedComps, setSelectedComps]         = useState<string[]>([]);
  const [compText, setCompText]                   = useState("");
  const [additionalExplanation, setAdditional]    = useState("");
  const [files, setFiles]                         = useState<FileDraft[]>([]);
  const [validationMsg, setValidationMsg]         = useState("");

  const [showAddFile, setShowAddFile]             = useState(false);
  const [viewFile, setViewFile]                   = useState<FileDraft | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const editorRef = React.useRef<HTMLDivElement>(null);

  const toggleError = (val: string) =>
    setSelectedErrors((prev) => prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]);
  const toggleComp = (val: string) =>
    setSelectedComps((prev) => prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]);

  const effectiveFeedback     = feedbackApplied.trim();
  const effectiveError        = existingErrors.length > 0 ? selectedErrors.join(", ") : errorText.trim();
  const effectiveCompensator  = existingCompensators.length > 0 ? selectedComps.join(", ") : compText.trim();

  const handleSolve = useCallback(() => {
    if (!effectiveFeedback)    { setValidationMsg(VALIDATION_MSGS.feedbackApplied); return; }
    if (!effectiveError)       { setValidationMsg(VALIDATION_MSGS.errorCorrected);  return; }
    if (!effectiveCompensator) { setValidationMsg(VALIDATION_MSGS.compensatorReplaced); return; }
    setValidationMsg("");
    setShowRemoveConfirm(true);
  }, [effectiveFeedback, effectiveError, effectiveCompensator]);

  const confirmSolve = (removeProblem: boolean) => {
    onSolve({ feedbackApplied: effectiveFeedback, errorCorrected: effectiveError, compensatorReplaced: effectiveCompensator, additionalExplanation, files, removeProblem });
    onClose();
  };

  const dialog = (
    <div style={{ position: "fixed", inset: 0, zIndex: 199, background: "rgba(0,0,0,0.18)" }}>
      <div
        style={{
          position:   "absolute",
          left:       pos.x,
          top:        pos.y,
          width:      DIALOG_W,
          height:     DIALOG_H,
          background: "#FFFFFF",
          borderRadius: 6,
          boxShadow:  "0 8px 32px rgba(0,0,0,0.18)",
          display:    "flex",
          flexDirection: "column",
          overflow:   "hidden",
          fontFamily: "'Inter','Segoe UI',sans-serif",
        }}
      >
        {/* Header */}
        <div
          onMouseDown={onHeaderMouseDown}
          style={{
            display:      "flex",
            alignItems:   "center",
            justifyContent: "space-between",
            padding:      "0 14px",
            height:       40,
            background:   "#F5F5F5",
            borderBottom: "1px solid #E0E0E0",
            cursor:       "move",
            userSelect:   "none",
            flexShrink:   0,
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 12.4, color: "#1B1B1B" }}>Solve Identify Problem</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2l10 10M12 2L2 12" stroke="#616161" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #E0E0E0", flexShrink: 0 }}>
          {(["solution", "files"] as const).map((tab) => {
            const label = tab === "solution" ? "About Solution" : "Attached Files";
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding:     "7px 16px",
                  border:      "none",
                  background:  active ? "#FFFFFF" : "#F5F5F5",
                  borderBottom: active ? "2px solid #0078D4" : "2px solid transparent",
                  cursor:      "pointer",
                  fontFamily:  "'Inter','Segoe UI',sans-serif",
                  fontWeight:  active ? 700 : 400,
                  fontSize:    11.4,
                  color:       active ? "#0078D4" : "#616161",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          {activeTab === "solution" && (
            <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Toolbar */}
              <RichTextToolbar editorRef={editorRef} />

              {/* Actual Problem (readonly) */}
              <FormRow label="Actual Problem">
                <div
                  style={{
                    padding: "6px 9px", background: "#F5F5F5", border: "1px solid #D0D0D0",
                    borderRadius: 3, fontSize: 11.1, color: "#616161", lineHeight: "16px", minHeight: 30,
                  }}
                >
                  {problem.actualProblem || "—"}
                </div>
              </FormRow>

              {/* Feedback Applied */}
              <FormRow label="Feedback Applied">
                <input
                  type="text"
                  placeholder="Enter applied feedback(s), comma-separated"
                  value={feedbackApplied}
                  onChange={(e) => setFeedbackApplied(e.target.value)}
                  style={INPUT_STYLE}
                />
              </FormRow>

              {/* Error Corrected */}
              <FormRow label="Error Corrected">
                {existingErrors.length > 0 ? (
                  <CheckList items={existingErrors} selected={selectedErrors} onToggle={toggleError} />
                ) : (
                  <input
                    type="text"
                    placeholder="Enter corrected error(s), comma-separated"
                    value={errorText}
                    onChange={(e) => setErrorText(e.target.value)}
                    style={INPUT_STYLE}
                  />
                )}
              </FormRow>

              {/* Compensator Replaced */}
              <FormRow label="Compensator Replaced">
                {existingCompensators.length > 0 ? (
                  <CheckList items={existingCompensators} selected={selectedComps} onToggle={toggleComp} />
                ) : (
                  <input
                    type="text"
                    placeholder="Enter replaced compensator(s), comma-separated"
                    value={compText}
                    onChange={(e) => setCompText(e.target.value)}
                    style={INPUT_STYLE}
                  />
                )}
              </FormRow>

              {/* Additional Explanation */}
              <FormRow label="Additional Explanation">
                <RichEditor
                  value={additionalExplanation}
                  onChange={setAdditional}
                  style={{ minHeight: 80, fontSize: "11.1px" }}
                  placeholder="Enter additional explanation..."
                />
              </FormRow>
            </div>
          )}
          {activeTab === "files" && (
            <AttachFilePanel
              items={files}
              onAdd={(f) => setFiles((prev) => [...prev, f])}
              onOpenAdd={() => setShowAddFile(true)}
              onOpenView={(f) => setViewFile(f)}
              onRemove={(idx) => setFiles((prev) => prev.filter((_, i) => i !== idx))}
            />
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display:      "flex",
            alignItems:   "center",
            justifyContent: "space-between",
            padding:      "8px 14px",
            borderTop:    "1px solid #E0E0E0",
            flexShrink:   0,
          }}
        >
          {validationMsg ? (
            <span style={{ flex: 1, fontSize: 10.3, color: "#D13438", lineHeight: "14px", marginRight: 10 }}>
              {validationMsg}
            </span>
          ) : (
            <span />
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose} style={BTN_CANCEL}>Cancel</button>
            <button
              onClick={handleSolve}
              style={{ ...BTN_PRIMARY, background: "#0078D4" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#106EBE"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#0078D4"; }}
            >
              Solve Problem
            </button>
          </div>
        </div>
      </div>

      {/* "Remove problem?" confirmation overlay */}
      {showRemoveConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 201, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 460, background: "#FFFFFF", borderRadius: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", padding: "22px 24px 18px", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#1B1B1B", marginBottom: 10 }}>Solve Problem Message</div>
            <div style={{ fontSize: 12, color: "#444", lineHeight: "18px", marginBottom: 20 }}>
              Now that the problem is solved, do I want to remove it from the list or keep it?
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => confirmSolve(false)} style={BTN_CANCEL}>No</button>
              <button
                onClick={() => confirmSolve(true)}
                style={{ ...BTN_PRIMARY, background: "#0078D4" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#106EBE"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#0078D4"; }}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddFile && (
        <AttachFileDialog
          onAdd={(f) => { setFiles((prev) => [...prev, f]); setShowAddFile(false); }}
          onClose={() => setShowAddFile(false)}
        />
      )}
      {viewFile && (
        <ViewFileInformationDialog
          file={viewFile}
          onClose={() => setViewFile(null)}
          zIndexBase={200}
        />
      )}
    </div>
  );

  return ReactDOM.createPortal(dialog, document.body);
}

// ─── Shared sub-components ───────────────────────────────────────────────────

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <label style={{ fontWeight: 600, fontSize: 10.8, color: "#616161" }}>{label}</label>
      {children}
    </div>
  );
}

function CheckList({ items, selected, onToggle }: { items: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div
      style={{
        maxHeight: 90, overflowY: "auto", border: "1px solid #C7C7C7", borderRadius: 3,
        background: "#FAFAFA", padding: "4px 0",
      }}
    >
      {items.map((item) => (
        <label
          key={item}
          style={{
            display: "flex", alignItems: "center", gap: 7, padding: "3px 9px",
            cursor: "pointer", fontSize: 11.1, color: "#1B1B1B",
          }}
        >
          <input
            type="checkbox"
            checked={selected.includes(item)}
            onChange={() => onToggle(item)}
            style={{ margin: 0 }}
          />
          {item}
        </label>
      ))}
    </div>
  );
}

const INPUT_STYLE: React.CSSProperties = {
  boxSizing: "border-box", width: "100%", height: 30, padding: "0 9px",
  border: "1px solid #C7C7C7", borderRadius: 3, fontSize: 11.1,
  fontFamily: "'Inter','Segoe UI',sans-serif", color: "#1B1B1B", outline: "none",
};

const BTN_CANCEL: React.CSSProperties = {
  height: 28, padding: "0 18px", background: "#FFFFFF", border: "1px solid #C7C7C7",
  borderRadius: 4, fontSize: 12.3, fontFamily: "'Inter','Segoe UI',sans-serif",
  color: "#1B1B1B", cursor: "pointer",
};

const BTN_PRIMARY: React.CSSProperties = {
  height: 28, padding: "0 18px", border: "none", borderRadius: 4,
  fontSize: 12.3, fontWeight: 700, fontFamily: "'Inter','Segoe UI',sans-serif",
  color: "#FFFFFF", cursor: "pointer",
};
