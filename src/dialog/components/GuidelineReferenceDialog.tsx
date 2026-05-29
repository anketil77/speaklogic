// src/dialog/components/GuidelineReferenceDialog.tsx
// Inline floating dialog (rendered inside AnalyzeView's position:relative root)
// for inserting an analysis guideline reference at the caret of Actual Analysis.
// C# original: InsertAnalysisGuideLineReference.cs
//
// Note: the C# "Use Link" hyperlink-insertion was commented out (dead). Here it
// inserts the reference text as a clickable anchor pointing to the guideline URL.

import React, { useState, useCallback } from "react";
import { useDraggable } from "@/dialog/hooks/useDraggable";

const REFERENCE_OPTIONS = [
  "refer to analysis guideline number",
  "see analysis guideline number",
];

const DEFAULT_LINK = "http://www.speaklogic.org/analysisguideline";

const C = {
  blue: "#0078D4",
  blueHover: "#106EBE",
  grey11: "#1B1B1B",
  grey38: "#616161",
  grey78: "#C7C7C7",
  grey88: "#E0E0E0",
  grey96: "#F5F5F5",
  iconBg: "#EBF3FC",
  white: "#FFFFFF",
} as const;

interface Props {
  /** Receives the HTML to insert at the editor caret. */
  onInsert: (html: string) => void;
  onClose: () => void;
}

const inputStyle: React.CSSProperties = {
  boxSizing: "border-box",
  width: "100%",
  height: 32,
  border: `1px solid ${C.grey78}`,
  borderRadius: 4,
  padding: "0 10px",
  fontSize: "12.2px",
  fontFamily: "inherit",
  color: C.grey11,
  background: C.white,
  outline: "none",
};

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
      <label style={{ minWidth: 124, fontSize: 12.2, color: C.grey11, flexShrink: 0 }}>{label}</label>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

export function GuidelineReferenceDialog({ onInsert, onClose }: Props) {
  const { pos, onHeaderMouseDown } = useDraggable();
  const [reference, setReference] = useState(REFERENCE_OPTIONS[0]);
  const [guidelineNumber, setGuidelineNumber] = useState(1);
  const [link, setLink] = useState(DEFAULT_LINK);
  const [useLink, setUseLink] = useState(false); // false = Use Text (C# default)
  const [applyHover, setApplyHover] = useState(false);
  const [cancelHover, setCancelHover] = useState(false);

  const clampNumber = useCallback((n: number) => Math.max(1, Math.min(501, Math.round(n || 1))), []);

  const handleApply = useCallback(() => {
    const num = clampNumber(guidelineNumber);
    const referenceText = `${reference.trim()} ${num}`;
    if (useLink) {
      const href = `${link.trim()}#${num}`;
      onInsert(`<a href="${escapeHtml(href)}">${escapeHtml(referenceText)}</a>`);
    } else {
      onInsert(escapeHtml(referenceText));
    }
    onClose();
  }, [reference, guidelineNumber, link, useLink, clampNumber, onInsert, onClose]);

  return (
    <>
      {/* Backdrop (inside the position:relative AnalyzeView root) */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 199 }} onClick={onClose} />

      <div
        style={{
          position: "absolute",
          left: `calc(50% + ${pos.x}px)`,
          top: `calc(50% + ${pos.y}px)`,
          transform: "translate(-50%, -50%)",
          zIndex: 200,
          width: 460,
          background: C.white,
          borderRadius: 8,
          boxShadow: "0px 8px 32px rgba(0,0,0,0.14), 0px 2px 8px rgba(0,0,0,0.06)",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          onMouseDown={onHeaderMouseDown}
          style={{ height: 64, display: "flex", alignItems: "center", padding: "0 20px", gap: 12, cursor: "grab", userSelect: "none" }}
        >
          <div style={{ width: 32, height: 32, borderRadius: 6, background: C.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 2h8a1 1 0 0 1 1 1v11l-5-3-5 3V3a1 1 0 0 1 1-1Z" stroke="#0078D4" strokeWidth="1.2" strokeLinejoin="round" />
              <path d="M6 6h4M6 8.5h4" stroke="#0078D4" strokeWidth="1.1" strokeLinecap="round" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14.4, color: C.grey11, lineHeight: "19px" }}>Analysis Guideline Reference</div>
            <div style={{ fontSize: 11, color: C.grey38, lineHeight: "16px", marginTop: 1 }}>Insert a guideline reference into the analysis.</div>
          </div>
          <button
            onClick={onClose}
            title="Close"
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", borderRadius: 4, cursor: "pointer", padding: 0 }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="#616161" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "8px 20px 4px" }}>
          <Row label="Guideline Text">
            <input
              style={inputStyle}
              value={reference}
              list="sl-guideline-refs"
              onChange={(e) => setReference(e.target.value)}
            />
            <datalist id="sl-guideline-refs">
              {REFERENCE_OPTIONS.map((opt) => <option key={opt} value={opt} />)}
            </datalist>
          </Row>
          <Row label="Guideline Number">
            <input
              type="number"
              min={1}
              max={501}
              style={inputStyle}
              value={guidelineNumber}
              onChange={(e) => setGuidelineNumber(Number(e.target.value))}
              onBlur={() => setGuidelineNumber((n) => clampNumber(n))}
            />
          </Row>
          <Row label="Guideline Link">
            <input
              style={{ ...inputStyle, color: useLink ? C.grey11 : C.grey38, background: useLink ? C.white : C.grey96 }}
              value={link}
              disabled={!useLink}
              onChange={(e) => setLink(e.target.value)}
            />
          </Row>

          <div style={{ display: "flex", gap: 20, marginTop: 4, marginBottom: 4 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.2, color: C.grey11, cursor: "pointer" }}>
              <input type="checkbox" checked={!useLink} onChange={() => setUseLink(false)} />
              Use Guideline Text
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.2, color: C.grey11, cursor: "pointer" }}>
              <input type="checkbox" checked={useLink} onChange={() => setUseLink(true)} />
              Use Guideline Link
            </label>
          </div>
        </div>

        {/* Footer */}
        <div style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, padding: "0 20px", borderTop: `1px solid ${C.grey88}` }}>
          <button
            onClick={onClose}
            onMouseEnter={() => setCancelHover(true)}
            onMouseLeave={() => setCancelHover(false)}
            style={{ width: 82, height: 32, background: cancelHover ? "#F3F3F3" : C.white, border: `1px solid ${C.grey78}`, borderRadius: 4, fontSize: 12.4, fontFamily: "inherit", cursor: "pointer", color: C.grey11 }}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            onMouseEnter={() => setApplyHover(true)}
            onMouseLeave={() => setApplyHover(false)}
            style={{ width: 82, height: 32, background: applyHover ? C.blueHover : C.blue, border: "none", borderRadius: 4, fontSize: 12.6, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", color: C.white }}
          >
            Apply
          </button>
        </div>
      </div>
    </>
  );
}
