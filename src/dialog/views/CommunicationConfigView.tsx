// src/dialog/views/CommunicationConfigView.tsx

import React, { useState, useEffect, useCallback } from "react";
import { Spinner } from "@fluentui/react-components";
import { useDialogComm } from "@/dialog/hooks/useDialogComm";
import { HamburgerIcon } from "@/dialog/components/Icons";
import { colors } from "@/styles/tokens";
import type { SaveCommunicationConfigPayload } from "@/types/db";

// ─── Shared inline styles ─────────────────────────────────────────────────────
const F = {
  borderInput: "1px solid #C7C7C7",
  borderBox: "1px solid #E0E0E0",
  bgCommandBar: "#F5F5F5",
  sepColor: "#E0E0E0",
} as const;

const inputStyle: React.CSSProperties = {
  width: "100%", height: "32px", border: F.borderInput, borderRadius: "4px",
  padding: "0 11px", fontSize: "12.2px", fontFamily: "inherit", color: colors.grey11,
  background: colors.white, outline: "none", boxSizing: "border-box",
};

const rowStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", minHeight: "32px", marginBottom: "16px",
};

const labelStyle: React.CSSProperties = {
  width: "150px", minWidth: "150px", fontSize: "11.8px", fontWeight: "700",
  color: colors.grey11, lineHeight: "14px", flexShrink: 0,
};

const btnStyle = (variant: "cancel" | "apply"): React.CSSProperties => ({
  height: "32px", borderRadius: "4px", fontSize: "12.3px", fontFamily: "inherit",
  cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
  whiteSpace: "nowrap", flexShrink: 0,
  ...(variant === "cancel"
    ? { padding: "0 18px", background: colors.white, border: "1px solid #C7C7C7", color: colors.grey11, fontWeight: "400" }
    : { padding: "0 20px", background: colors.azure42, border: "none", color: colors.white, fontWeight: "700" }),
});

// ─── Component ────────────────────────────────────────────────────────────────
export default function CommunicationConfigView() {
  const { initData, sendMessage, closeDialog } = useDialogComm();

  const [personName, setPersonName] = useState("");
  const [personEmail, setPersonEmail] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [applyHover, setApplyHover] = useState(false);

  // Pre-fill from existing CommunicationData record passed in initData
  useEffect(() => {
    if (initData) {
      setPersonName(initData.communicationPersonName ?? "");
      setPersonEmail(initData.communicationPersonEmail ?? "");
    }
  }, [initData]);

  const save = useCallback(() => {
    const missing: string[] = [];
    if (!personName.trim()) missing.push("Person Name");
    if (!personEmail.trim()) missing.push("Person Email");
    if (missing.length > 0) {
      setValidationError(`The ${missing.join(" and ")} field${missing.length > 1 ? "s are" : " is"} mandatory to be filled.`);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(personEmail.trim())) {
      setValidationError("Please enter a valid email address.");
      return;
    }
    const payload: SaveCommunicationConfigPayload = {
      personName: personName.trim(),
      personEmail: personEmail.trim(),
    };
    sendMessage({ action: "SAVE_COMMUNICATION_CONFIG", payload });
  }, [personName, personEmail, sendMessage]);

  if (!initData) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <Spinner label="Loading..." />
      </div>
    );
  }

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", height: "100vh", background: colors.white, overflow: "hidden", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* ── Title ─────────────────────────────────────────────────────────── */}
      <div style={{ height: "78px", display: "flex", alignItems: "center", padding: "0 20px", gap: "12px", flexShrink: 0 }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: colors.grey95, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <HamburgerIcon />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "3px" }}>
          <span style={{ fontSize: "15.6px", fontWeight: "700", lineHeight: "21px", letterSpacing: "-0.1px", color: colors.grey11 }}>
            Communication Configuration
          </span>
          <span style={{ fontSize: "11.1px", fontWeight: "400", lineHeight: "17px", color: colors.grey38 }}>
            Set your name and email used in analysis and feedback.
          </span>
        </div>
      </div>

      {/* ── Divider ───────────────────────────────────────────────────────── */}
      <div style={{ height: "1px", background: F.borderBox, flexShrink: 0 }} />

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>

        <div style={rowStyle}>
          <span style={labelStyle}>Person Name</span>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
            <input
              style={inputStyle}
              value={personName}
              onChange={(e) => { setPersonName(e.target.value); setValidationError(null); }}
              placeholder="Enter your name"
              autoFocus
            />
          </div>
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}>Person Email</span>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
            <input
              style={inputStyle}
              type="email"
              value={personEmail}
              onChange={(e) => { setPersonEmail(e.target.value); setValidationError(null); }}
              placeholder="Enter your email address"
            />
          </div>
        </div>

        {validationError && (
          <div style={{ color: colors.redDestructive, fontSize: "11.8px", marginTop: "4px", lineHeight: "16px" }}>
            {validationError}
          </div>
        )}
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div style={{ height: "57px", borderTop: F.borderBox, display: "flex", alignItems: "center", padding: "0 20px", gap: "8px", flexShrink: 0, background: colors.white, justifyContent: "flex-end" }}>
        <button style={btnStyle("cancel")} onClick={closeDialog}>
          Cancel
        </button>
        <button
          style={{ ...btnStyle("apply"), background: applyHover ? "#106EBE" : colors.azure42 }}
          onMouseEnter={() => setApplyHover(true)}
          onMouseLeave={() => setApplyHover(false)}
          onClick={save}
        >
          Apply
        </button>
      </div>

    </div>
  );
}
