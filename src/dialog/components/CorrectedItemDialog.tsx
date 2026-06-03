// src/dialog/components/CorrectedItemDialog.tsx

import React, { useState, useCallback } from "react";
import { FooterBar, DismissBtn, PrimaryBtn } from "@/dialog/components/FooterButtons";
import ReactDOM from "react-dom";
import { useDraggable } from "@/dialog/hooks/useDraggable";
import type { ProjectCorrectedItem } from "@/types/db";

export type CorrectedItemDraft = Omit<ProjectCorrectedItem, "id" | "analysisId">;

export interface CorrectedItemDialogProps {
  itemCount: number;
  existingErrors: string[];
  existingCompensators: string[];
  onAdd: (item: CorrectedItemDraft) => void;
  onClose: () => void;
  initialItem?: CorrectedItemDraft;
  readOnly?: boolean;
}

const C = {
  blue: "#0078D4",
  grey11: "#1B1B1B",
  grey38: "#616161",
  grey78: "#C7C7C7",
  grey88: "#E0E0E0",
  grey96: "#F5F5F5",
  white: "#FFFFFF",
  red: "#D13438",
} as const;

const W = 600;

const labelW = 190;

function Row({ label, children, alignTop = false }: { label: string; children: React.ReactNode; alignTop?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: alignTop ? "flex-start" : "center", marginBottom: 14 }}>
      <span style={{ width: labelW, minWidth: labelW, fontSize: 11.8, fontWeight: 700, color: C.grey11, paddingTop: alignTop ? 9 : 0, flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

const inputBase: React.CSSProperties = {
  width: "100%", height: 32, border: `1px solid ${C.grey78}`, borderRadius: 4,
  padding: "0 11px", fontSize: 12.2, fontFamily: "inherit", color: C.grey11,
  background: C.white, outline: "none", boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  ...inputBase,
  padding: "0 28px 0 11px",
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23616161' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
  cursor: "pointer",
};

const readonlyStyle: React.CSSProperties = {
  ...inputBase,
  background: C.grey96,
  border: `1px solid ${C.grey88}`,
  color: C.grey38,
  cursor: "default",
};

export function CorrectedItemDialog({
  itemCount,
  existingErrors,
  existingCompensators,
  onAdd,
  onClose,
  initialItem,
  readOnly = false,
}: CorrectedItemDialogProps) {
  const { pos, onHeaderMouseDown } = useDraggable();

  const [form, setForm] = useState<{
    errorSelection: string;
    compensatorSelection: string;
    corrected: string;
    correctedDescription: string;
  }>({
    errorSelection: initialItem?.errorSelection ?? "",
    compensatorSelection: initialItem?.compensatorSelection ?? "",
    corrected: initialItem?.corrected ?? "",
    correctedDescription: initialItem?.correctedDescription ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  const set = useCallback(<K extends keyof typeof form>(k: K, v: string) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    setError(null);
  }, []);

  const handleSave = useCallback(() => {
    if (!form.errorSelection) { setError("Error Selection is required."); return; }
    if (!form.compensatorSelection) { setError("Compensator Selection is required."); return; }
    if (!form.corrected) { setError("Corrected is required."); return; }
    if (!form.correctedDescription.trim()) { setError("Corrected Description is required."); return; }

    onAdd({
      correctedItemNumber: itemCount + 1,
      errorSelection: form.errorSelection,
      compensatorSelection: form.compensatorSelection,
      corrected: form.corrected,
      correctedDescription: form.correctedDescription,
    });
  }, [form, itemCount, onAdd]);

  const modal = (
    <>
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 199 }}
        onClick={onClose}
      />
      <div
        style={{
          position: "fixed",
          left: pos.x,
          top: pos.y,
          width: W,
          zIndex: 200,
          background: C.white,
          borderRadius: 6,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Inter','Segoe UI',sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          onMouseDown={onHeaderMouseDown}
          style={{
            height: 44, background: "#F5F5F5", borderBottom: `1px solid ${C.grey88}`,
            display: "flex", alignItems: "center", padding: "0 14px",
            cursor: "grab", userSelect: "none", flexShrink: 0,
          }}
        >
          <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: C.grey11 }}>
            {readOnly ? "View Corrected Item" : initialItem ? "Edit Corrected Item" : "Add Corrected Item"}
          </span>
          <button
            className="sl-close-btn"
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px", fontSize: 16, color: C.grey38 }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px 12px", flex: 1 }}>
          {error && (
            <div style={{ background: "#FDE7E9", border: `1px solid #F1707B`, borderRadius: 4, padding: "7px 12px", fontSize: 12, color: "#A4262C", marginBottom: 14 }}>
              {error}
            </div>
          )}

          <Row label="Error Selection">
            {readOnly ? (
              <div style={readonlyStyle}>{form.errorSelection}</div>
            ) : (
              <select
                style={selectStyle}
                value={form.errorSelection}
                onChange={(e) => set("errorSelection", e.target.value)}
              >
                <option value="">-- Select error --</option>
                {existingErrors.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            )}
          </Row>

          <Row label="Compensator Selection">
            {readOnly ? (
              <div style={readonlyStyle}>{form.compensatorSelection}</div>
            ) : (
              <select
                style={selectStyle}
                value={form.compensatorSelection}
                onChange={(e) => set("compensatorSelection", e.target.value)}
              >
                <option value="">-- Select compensator --</option>
                {existingCompensators.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </Row>

          <Row label="Corrected">
            {readOnly ? (
              <div style={readonlyStyle}>{form.corrected}</div>
            ) : (
              <select
                style={selectStyle}
                value={form.corrected}
                onChange={(e) => set("corrected", e.target.value)}
              >
                <option value="">-- Select --</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            )}
          </Row>

          <Row label="Corrected Description" alignTop>
            {readOnly ? (
              <div style={{ ...readonlyStyle, height: "auto", minHeight: 80, padding: "8px 11px", lineHeight: "18px" }}>
                {form.correctedDescription}
              </div>
            ) : (
              <textarea
                style={{ ...inputBase, height: 80, padding: "8px 11px", resize: "vertical", lineHeight: "18px" }}
                value={form.correctedDescription}
                onChange={(e) => set("correctedDescription", e.target.value)}
                placeholder="Describe the correction..."
              />
            )}
          </Row>
        </div>

        {/* Footer */}
        <FooterBar>
          <DismissBtn label={readOnly ? "Close" : "Cancel"} onClick={onClose} />
          {!readOnly && (
            <PrimaryBtn label={initialItem ? "Save Changes" : "Add Corrected Item"} onClick={handleSave} />
          )}
        </FooterBar>
      </div>
    </>
  );

  return ReactDOM.createPortal(modal, document.body);
}
