// src/dialog/views/SelectionConfigView.tsx

import React, { useState, useCallback } from "react";
import { FooterBar, DismissBtn, PrimaryBtn } from "@/dialog/components/FooterButtons";
import { useDialogComm } from "@/dialog/hooks/useDialogComm";
import { SelectionConfigHeaderIcon, SelectionConfigBannerIcon } from "@/dialog/components/Icons";

// ── Figma design tokens ───────────────────────────────────────────────────────
const COD_GRAY    = "#1B1B1B";
const SILVER      = "#C7C7C7";
const NARVIK      = "#F5F5F5";

// ── Layout constants ──────────────────────────────────────────────────────────
const HEADER_H = 70;
const BANNER_H = 61;

const chevronSvg = `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23616161' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`;

// Each row is a normal-flow flex line: label (flex) + Yes/No select (fixed proportion).
// The body scrolls, so Cancel/Apply stay pinned regardless of dialog frame height.
const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  minHeight: 32,
};

const selectBase: React.CSSProperties = {
  boxSizing: "border-box",
  flex: "0 0 46%",
  height: 32,
  background: "#FFFFFF",
  border: `1px solid ${SILVER}`,
  borderRadius: 4,
  padding: "0 28px 0 11px",
  fontFamily: "Inter, 'Segoe UI', sans-serif",
  fontSize: 12.4,
  lineHeight: "13px",
  color: COD_GRAY,
  outline: "none",
  appearance: "none",
  backgroundImage: chevronSvg,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
  cursor: "pointer",
};

const labelBase: React.CSSProperties = {
  flex: 1,
  fontFamily: "Inter, 'Segoe UI', sans-serif",
  fontWeight: 400,
  lineHeight: "14px",
  color: COD_GRAY,
};

// ── Config type ───────────────────────────────────────────────────────────────

const LS_KEY = "sl-selection-config";

export interface SelectionConfig {
  selectedErrorAsActualError: boolean;
  selectedCompensatorAsActual: boolean;
  titleAsApplicationName: boolean;
  showFileNameInApplication: boolean;
  showPageNumberInFileName: boolean;
  showParagraphNumberInFileName: boolean;
}

const DEFAULTS: SelectionConfig = {
  selectedErrorAsActualError: true,
  selectedCompensatorAsActual: true,
  titleAsApplicationName: true,
  showFileNameInApplication: true,
  showPageNumberInFileName: true,
  showParagraphNumberInFileName: true,
};

export function loadSelectionConfig(): SelectionConfig {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) } as SelectionConfig;
  } catch { /* ignore */ }
  return { ...DEFAULTS };
}

function saveSelectionConfig(cfg: SelectionConfig): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(cfg));
  } catch { /* ignore */ }
}

// ── Row definitions ───────────────────────────────────────────────────────────

const ROWS: Array<{ key: keyof SelectionConfig; label: string; fs: number }> = [
  { key: "selectedErrorAsActualError",        label: "Selected Error as Actual Error",         fs: 11.4 },
  { key: "selectedCompensatorAsActual",       label: "Selected Compensator as Actual",         fs: 11.1 },
  { key: "titleAsApplicationName",            label: "Title as Application Name",               fs: 11.1 },
  { key: "showFileNameInApplication",         label: "Show File Name in Application",           fs: 11.3 },
  { key: "showPageNumberInFileName",          label: "Show Page Number in File Name",           fs: 11.4 },
  { key: "showParagraphNumberInFileName",     label: "Show Paragraph Number in File Name",      fs: 11.4 },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function SelectionConfigView() {
  const { closeDialog } = useDialogComm();

  const [cfg, setCfg] = useState<SelectionConfig>(() => loadSelectionConfig());

  const set = useCallback(<K extends keyof SelectionConfig>(k: K, v: boolean) => {
    setCfg((prev) => ({ ...prev, [k]: v }));
  }, []);

  const handleApply = useCallback(() => {
    saveSelectionConfig(cfg);
    closeDialog();
  }, [cfg, closeDialog]);

  return (
    <div style={{
      width: "100%",
      height: "100vh",
      background: "#FFFFFF",
      fontFamily: "Inter, 'Segoe UI', sans-serif",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>

      {/* ── HEADER — h: 70px ── */}
      <div style={{ position: "relative", height: HEADER_H, flexShrink: 0 }}>
        {/* Gear icon — SVG includes the 32×32 #EBF3FC rounded-rect background */}
        <div style={{ position: "absolute", left: 20, top: 21 }}>
          <SelectionConfigHeaderIcon />
        </div>
        {/* Title */}
        <span style={{
          position: "absolute", left: 64, top: 20,
          fontWeight: 700, fontSize: 15.4, lineHeight: "21px",
          letterSpacing: "-0.1px", color: COD_GRAY,
        }}>
          Configuration
        </span>
      </div>

      {/* ── BANNER — h: 61px ── */}
      <div style={{
        position: "relative", height: BANNER_H,
        background: NARVIK, flexShrink: 0,
        display: "flex", alignItems: "center",
      }}>
        <div style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)" }}>
          <SelectionConfigBannerIcon />
        </div>
        <span style={{
          position: "absolute", left: 68,
          fontWeight: 700, fontSize: 13.6, lineHeight: "16px", color: COD_GRAY,
        }}>
          Selection Configuration
        </span>
      </div>

      {/* ── BODY — scrolls when the dialog frame is short; footer stays pinned ── */}
      <div style={{
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}>
        {ROWS.map((row) => (
          <div key={row.key} style={rowStyle}>
            <span style={{ ...labelBase, fontSize: row.fs }}>
              {row.label}
            </span>
            <select
              style={selectBase}
              value={cfg[row.key] ? "Yes" : "No"}
              onChange={(e) => set(row.key, e.target.value === "Yes")}
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
        ))}
      </div>

      {/* ── FOOTER — h: 57px ── */}
      <FooterBar>
        <DismissBtn label="Cancel" onClick={closeDialog} />
        <PrimaryBtn label="Apply" onClick={handleApply} />
      </FooterBar>

    </div>
  );
}
