// src/dialog/components/SolveProblemDialog.tsx
// Portal dialog — "Solve Problem" opened from Problems tab context menu.
// C# ref: SolveProblem.cs + SolveProblem.Designer.cs
// Styling matches reference portal dialogs (IdentifyPrincipleInSelectionDialog pattern).

import React, { useCallback, useMemo, useRef, useState } from "react";
import { FooterBar, DismissBtn } from "@/dialog/components/FooterButtons";
import ReactDOM from "react-dom";
import { useDraggable }    from "@/dialog/hooks/useDraggable";
import { RichTextToolbar } from "@/dialog/components/RichTextToolbar";
import { RichEditor }      from "@/dialog/components/RichEditor";
import { PanelTable, type PanelTableCol } from "@/dialog/components/PanelTable";
import { ProblemIcon }     from "@/dialog/components/Icons";
import type { ProjectProblem, AttachFileToProject } from "@/types/db";

// ─── Types ────────────────────────────────────────────────────────────────────

type FileDraft = Omit<
  AttachFileToProject,
  "id" | "analysisId" | "feedbackId" | "flagId" | "articleId" |
  "principleInterpretationId" | "selectionWithPrincipleId" | "principleInSelectionId"
>;

interface Props {
  problem:              ProjectProblem;
  existingErrors:       string[];
  existingCompensators: string[];
  onSolve: (solution: {
    feedbackApplied:       string;
    errorCorrected:        string;
    compensatorReplaced:   string;
    additionalExplanation: string;
    files:                 FileDraft[];
    removeProblem:         boolean;
  }) => void;
  onClose: () => void;
}

type TabId = "solution" | "files";

// ─── Constants ────────────────────────────────────────────────────────────────

const C = {
  blue:     "#0078D4",
  blueHov:  "#106EBE",
  grey11:   "#1B1B1B",
  grey38:   "#616161",
  grey78:   "#C7C7C7",
  grey88:   "#E0E0E0",
  grey96:   "#F5F5F5",
  iconBg:   "#EBF3FC",
  white:    "#FFFFFF",
} as const;

const TABS: { id: TabId; label: string }[] = [
  { id: "solution", label: "About Solution"  },
  { id: "files",    label: "Attached Files"  },
];

const VALIDATION_MSGS = {
  feedbackApplied:
    "In order for a problem to be solved, a feedback must be applied. By applying a feedback, it is possible for us to solve an identified problem. It is not possible to solve an identified problem with the absence of feedback. Here I need to select the feedback or feedbacks that have applied to solve the problem.",
  errorCorrected:
    "In order to solve an identified problem, feedback must be applied where the error that gives rise to that problem must be corrected. If the error itself is not corrected, it is not possible for the identified problem to be solved. Here I need to identified the error or errors that were corrected.",
  compensatorReplaced:
    "In order for an identified problem to be solved, error must be corrected, where the error itself is replaced by a compensator. The correction itself is not possible without the replacing compensator. The overall solution process of a problem is not possible as well with the absence of a compensator. Here I need to select the compensator or compensators that are replaced to enable the identified problem to be solved.",
} as const;

const FILE_COLS: PanelTableCol<FileDraft>[] = [
  { header: "File Name",  width: "28%", render: (f) => f.fileName  || "—", truncate: true },
  { header: "File Type",  width: "15%", render: (f) => f.fileType  || "—" },
  { header: "File Date",  width: "17%", render: (f) => f.fileDate  || "—" },
  { header: "File Time",  width: "15%", render: (f) => f.fileTime  || "—" },
  { header: "File Size",  width: "15%", render: (f) => f.fileSize  || "—" },
];

const inputStyle: React.CSSProperties = {
  boxSizing: "border-box", width: "100%", height: 32,
  border: `1px solid ${C.grey78}`, borderRadius: 4, padding: "0 10px",
  fontSize: "12.2px", fontFamily: "inherit", color: C.grey11,
  background: C.white, outline: "none",
};

// ─── Main dialog ──────────────────────────────────────────────────────────────

export function SolveProblemDialog({
  problem, existingErrors, existingCompensators, onSolve, onClose,
}: Props) {
  const { pos, onHeaderMouseDown } = useDraggable();

  const [activeTab, setActiveTab]         = useState<TabId>("solution");
  const [feedbackApplied, setFeedback]    = useState("");
  const [selectedErrors, setSelErrors]    = useState<string[]>([]);
  const [errorText, setErrorText]         = useState("");
  const [selectedComps, setSelComps]      = useState<string[]>([]);
  const [compText, setCompText]           = useState("");
  const [additionalExp, setAdditional]    = useState("");
  const [files, setFiles]                 = useState<FileDraft[]>([]);

  const [errorMsg, setErrorMsg]           = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemove]= useState(false);

  const [fileMenuIdx, setFileMenuIdx]     = useState<number | null>(null);
  const [pendingRemove, setPendingRemove] = useState<number | null>(null);
  const fileInputRef                      = useRef<HTMLInputElement>(null);

  const [solveHover, setSolveHover]       = useState(false);
  const editorRef                         = useRef<HTMLDivElement>(null);

  const toggleError = (v: string) =>
    setSelErrors((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);
  const toggleComp  = (v: string) =>
    setSelComps((p)  => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);

  const effectiveFeedback    = feedbackApplied.trim();
  const effectiveError       = existingErrors.length       > 0 ? selectedErrors.join(", ") : errorText.trim();
  const effectiveCompensator = existingCompensators.length > 0 ? selectedComps.join(", ")  : compText.trim();

  const handleSolve = useCallback(() => {
    if (!effectiveFeedback)    { setErrorMsg(VALIDATION_MSGS.feedbackApplied);    return; }
    if (!effectiveError)       { setErrorMsg(VALIDATION_MSGS.errorCorrected);     return; }
    if (!effectiveCompensator) { setErrorMsg(VALIDATION_MSGS.compensatorReplaced); return; }
    setErrorMsg(null);
    setShowRemove(true);
  }, [effectiveFeedback, effectiveError, effectiveCompensator]);

  const confirmSolve = (removeProblem: boolean) => {
    onSolve({
      feedbackApplied: effectiveFeedback,
      errorCorrected: effectiveError,
      compensatorReplaced: effectiveCompensator,
      additionalExplanation: additionalExp,
      files,
      removeProblem,
    });
    onClose();
  };

  const handleFileSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const fileDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const fileTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const sizeKB = Math.round(f.size / 1024);
    const fileSize = sizeKB >= 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
    setFiles((prev) => [...prev, {
      fileName: f.name, fileType: f.type || "application/octet-stream",
      fileSize, fileDate, fileTime, fileDirectory: "", fileDescription: "",
      storageId: "", fullFileName: f.name,
    }]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const fileMenuItems = useMemo(() => [
    {
      label: "Add File",
      disabled: false,
      onClick: () => { setFileMenuIdx(null); fileInputRef.current?.click(); },
    },
    {
      label: "Remove File",
      disabled: fileMenuIdx === null || fileMenuIdx < 0,
      onClick: () => { if (fileMenuIdx !== null && fileMenuIdx >= 0) setPendingRemove(fileMenuIdx); },
    },
    {
      label: "View File Info",
      disabled: fileMenuIdx === null || fileMenuIdx < 0,
      onClick: () => setFileMenuIdx(null),
    },
  ], [fileMenuIdx]);

  const renderTabContent = () => {
    if (activeTab === "solution") {
      return (
        <div style={{ padding: "20px 20px" }}>
          <FieldRow label="Actual Problem">
            <div style={{
              padding: "8px 10px", background: C.grey96, border: `1px solid ${C.grey88}`,
              borderRadius: 4, fontSize: "12.2px", color: C.grey38,
              lineHeight: "18px", minHeight: 32, wordBreak: "break-word",
            }}>
              {problem.actualProblem || "—"}
            </div>
          </FieldRow>

          <FieldRow label="Feedback Applied">
            <input
              type="text"
              placeholder="Enter applied feedback(s), comma-separated"
              value={feedbackApplied}
              onChange={(e) => setFeedback(e.target.value)}
              style={inputStyle}
            />
          </FieldRow>

          <FieldRow label="Error Corrected">
            {existingErrors.length > 0 ? (
              <CheckList items={existingErrors} selected={selectedErrors} onToggle={toggleError} />
            ) : (
              <input
                type="text"
                placeholder="Enter corrected error(s), comma-separated"
                value={errorText}
                onChange={(e) => setErrorText(e.target.value)}
                style={inputStyle}
              />
            )}
          </FieldRow>

          <FieldRow label="Compensator Replaced">
            {existingCompensators.length > 0 ? (
              <CheckList items={existingCompensators} selected={selectedComps} onToggle={toggleComp} />
            ) : (
              <input
                type="text"
                placeholder="Enter replaced compensator(s), comma-separated"
                value={compText}
                onChange={(e) => setCompText(e.target.value)}
                style={inputStyle}
              />
            )}
          </FieldRow>

          <FieldRow label="Additional Explanation">
            <RichEditor
              value={additionalExp}
              onChange={setAdditional}
              style={{ minHeight: 90, fontSize: "12.2px" }}
              placeholder="Enter additional explanation..."
            />
          </FieldRow>
        </div>
      );
    }

    // Files tab
    return (
      <div style={{ position: "relative", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        <PanelTable<FileDraft>
          columns={FILE_COLS}
          rows={files}
          emptyText="No attached files."
          onRowContextMenu={(e, idx) => { e.preventDefault(); e.stopPropagation(); setFileMenuIdx(idx); }}
        >
          {fileMenuIdx !== null && (
            <div style={{
              position: "fixed", background: C.white, border: `1px solid ${C.grey78}`,
              borderRadius: 4, boxShadow: "0px 4px 16px rgba(0,0,0,0.12)", zIndex: 220,
              minWidth: 160, padding: "4px 0",
            }} onClick={(e) => e.stopPropagation()}>
              {fileMenuItems.map((item, i) => (
                <button key={i} disabled={item.disabled} onClick={item.onClick} style={{
                  display: "block", width: "100%", textAlign: "left", padding: "6px 16px",
                  background: "transparent", border: "none", fontSize: "12.2px",
                  fontFamily: "inherit", cursor: item.disabled ? "default" : "pointer",
                  color: item.disabled ? C.grey78 : C.grey11,
                }}
                onMouseEnter={(e) => { if (!item.disabled) e.currentTarget.style.background = C.grey96; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
          {pendingRemove !== null && (
            <div style={{
              position: "absolute", inset: 0, background: "rgba(255,255,255,0.88)",
              display: "flex", alignItems: "center", justifyContent: "center", zIndex: 215,
            }}>
              <div style={{
                background: C.white, borderRadius: 6, boxShadow: "0px 4px 16px rgba(0,0,0,0.14)",
                padding: "20px 24px", maxWidth: 280, textAlign: "center",
              }}>
                <div style={{ fontSize: "12.4px", fontWeight: 600, color: C.grey11, marginBottom: 12, lineHeight: "18px" }}>
                  Remove this file?
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                  <button onClick={() => setPendingRemove(null)} style={BTN_CANCEL}>No</button>
                  <button onClick={() => { setFiles((p) => p.filter((_, i) => i !== pendingRemove)); setPendingRemove(null); setFileMenuIdx(null); }} style={BTN_PRIMARY}>Yes</button>
                </div>
              </div>
            </div>
          )}
        </PanelTable>
        <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileSelected} />
      </div>
    );
  };

  const showToolbar = activeTab === "solution";

  const dialog = (
    <>
      {/* Backdrop */}
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 199 }} onClick={onClose} />

      {/* Dialog */}
      <div
        style={{
          position:  "fixed",
          left:      `calc(50% + ${pos.x}px)`,
          top:       `calc(50% + ${pos.y}px)`,
          transform: "translate(-50%, -50%)",
          width:     760,
          height:    600,
          maxWidth:  "96vw",
          maxHeight: "90vh",
          zIndex:    200,
          display:   "flex",
          flexDirection: "column",
          background: C.white,
          boxShadow: "0px 8px 32px rgba(0,0,0,0.14), 0px 2px 8px rgba(0,0,0,0.06)",
          borderRadius: 8,
          overflow:  "hidden",
          fontFamily: "'Inter','Segoe UI',sans-serif",
        }}
        onClick={() => setFileMenuIdx(null)}
      >
        {/* ── Header ── */}
        <div
          onMouseDown={onHeaderMouseDown}
          style={{
            height: 72, flexShrink: 0, display: "flex", alignItems: "center",
            paddingLeft: 20, paddingRight: 20, gap: 12, cursor: "grab", userSelect: "none",
          }}
        >
          <div style={{
            width: 32, height: 32, borderRadius: 6, background: C.iconBg,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <ProblemIcon color={C.blue} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "15.6px", fontWeight: 700, color: C.grey11, letterSpacing: "-0.1px", lineHeight: "21px" }}>
              Solve Identify Problem
            </div>
            <div style={{ fontSize: "11.1px", color: C.grey38, lineHeight: "17px", marginTop: 2 }}>
              Record the solution for the identified problem.
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
              background: "transparent", border: "none", borderRadius: 4, cursor: "pointer",
              flexShrink: 0, padding: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M13 1L1 13" stroke={C.grey38} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* ── Command bar ── */}
        <div style={{
          height: 44, flexShrink: 0, background: C.grey96,
          display: "flex", alignItems: "center", paddingLeft: 12, paddingRight: 12,
          gap: 8, position: "relative",
        }}>
          <button
            onClick={handleSolve}
            onMouseEnter={() => setSolveHover(true)}
            onMouseLeave={() => setSolveHover(false)}
            style={{
              height: 28, padding: "0 16px", display: "flex", alignItems: "center", gap: 6,
              background: solveHover ? C.blueHov : C.blue, color: C.white, border: "none",
              borderRadius: 4, cursor: "pointer", fontSize: "11.6px", fontWeight: 700,
              fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0,
            }}
          >
            <ProblemIcon color={C.white} />
            Solve Problem
          </button>
          <div style={{ width: 1, height: 20, background: C.grey88, flexShrink: 0 }} />
          {showToolbar && <RichTextToolbar editorRef={editorRef} />}
        </div>

        {/* ── Tab bar ── */}
        <div style={{
          height: 36, flexShrink: 0, display: "flex", alignItems: "flex-end",
          borderBottom: `1px solid ${C.grey88}`, overflow: "hidden",
        }}>
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setErrorMsg(null); setFileMenuIdx(null); }} style={{
              height: 36, padding: "0 16px", background: "transparent", border: "none",
              borderBottom: activeTab === tab.id ? `2px solid ${C.blue}` : "2px solid transparent",
              fontSize: "12.2px", fontWeight: activeTab === tab.id ? 700 : 400,
              color: activeTab === tab.id ? C.grey11 : C.grey38,
              fontFamily: "inherit", cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap",
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Validation message ── */}
        {errorMsg && (
          <div style={{
            background: "#FFF4CE", border: "1px solid #F0D060", borderRadius: 4,
            margin: "8px 12px 0", padding: "7px 12px", fontSize: "11.5px",
            color: "#5D4037", lineHeight: "17px", flexShrink: 0,
          }}>
            {errorMsg}
          </div>
        )}

        {/* ── Content ── */}
        <div style={{ flex: 1, overflowY: "auto", minHeight: 0, display: "flex", flexDirection: "column" }}>
          {renderTabContent()}
        </div>

        {/* ── Footer ── */}
        <FooterBar>
          <DismissBtn label="Cancel" onClick={onClose} />
        </FooterBar>
      </div>

      {/* ── Remove problem confirm ── */}
      {showRemoveConfirm && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 210,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            width: 460, background: C.white, borderRadius: 8,
            boxShadow: "0px 8px 32px rgba(0,0,0,0.18)", padding: "22px 24px 18px",
            fontFamily: "'Inter','Segoe UI',sans-serif",
          }}>
            <div style={{ fontWeight: 700, fontSize: "13px", color: C.grey11, marginBottom: 10 }}>
              Solve Problem Message
            </div>
            <div style={{ fontSize: "12.2px", color: "#444", lineHeight: "18px", marginBottom: 20 }}>
              Now that the problem is solved, do I want to remove it from the list or keep it?
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => confirmSolve(false)} style={BTN_CANCEL}>No</button>
              <button onClick={() => confirmSolve(true)}  style={BTN_PRIMARY}>Yes</button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return ReactDOM.createPortal(dialog, document.body);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
      <label style={{
        minWidth: 180, fontSize: "12.2px", color: "#1B1B1B",
        paddingTop: 8, flexShrink: 0, lineHeight: "16px",
      }}>
        {label}
      </label>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function CheckList({
  items, selected, onToggle,
}: { items: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div style={{
      maxHeight: 96, overflowY: "auto", border: "1px solid #C7C7C7",
      borderRadius: 4, background: "#FAFAFA", padding: "4px 0",
    }}>
      {items.map((item) => (
        <label key={item} style={{
          display: "flex", alignItems: "center", gap: 7, padding: "4px 10px",
          cursor: "pointer", fontSize: "12.2px", color: "#1B1B1B",
        }}>
          <input
            type="checkbox"
            checked={selected.includes(item)}
            onChange={() => onToggle(item)}
            style={{ margin: 0, flexShrink: 0 }}
          />
          {item}
        </label>
      ))}
    </div>
  );
}

const BTN_CANCEL: React.CSSProperties = {
  height: 30, padding: "0 16px", background: "#FFFFFF",
  border: "1px solid #C7C7C7", borderRadius: 4, fontSize: "12.2px",
  fontFamily: "'Inter','Segoe UI',sans-serif", color: "#1B1B1B", cursor: "pointer",
};

const BTN_PRIMARY: React.CSSProperties = {
  height: 30, padding: "0 16px", background: "#0078D4", border: "none",
  borderRadius: 4, fontSize: "12.2px", fontWeight: 700,
  fontFamily: "'Inter','Segoe UI',sans-serif", color: "#FFFFFF", cursor: "pointer",
};
