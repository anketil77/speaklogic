// src/dialog/views/CommunicationConfigView.tsx

import React, { useState, useEffect, useCallback } from "react";
import { FooterBar, DismissBtn, PrimaryBtn } from "@/dialog/components/FooterButtons";
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
  display: "flex", flexDirection: "column", gap: "4px", marginBottom: "12px",
};

const labelStyle: React.CSSProperties = {
  fontSize: "11.8px", fontWeight: "700", color: colors.grey11, lineHeight: "14px",
};


// ─── Component ────────────────────────────────────────────────────────────────
export default function CommunicationConfigView() {
  const { initData, sendMessage, closeDialog } = useDialogComm();
  const [personName, setPersonName] = useState("");
  const [personEmail, setPersonEmail] = useState("");

  // Pre-fill from Office profile (passed via initData from commands.ts)
  useEffect(() => {
    if (initData) {
      setPersonName(initData.communicationPersonName ?? "");
      setPersonEmail(initData.communicationPersonEmail ?? "");
    }
  }, [initData]);

  const save = useCallback(() => {
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
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: colors.white, fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

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
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 24px" }}>

        <div style={rowStyle}>
          <span style={labelStyle}>Person Name</span>
          <input
            style={inputStyle}
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
          />
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}>Person Email</span>
          <input
            style={inputStyle}
            type="email"
            value={personEmail}
            onChange={(e) => setPersonEmail(e.target.value)}
          />
        </div>

      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <FooterBar>
        <DismissBtn label="Cancel" onClick={closeDialog} />
        <PrimaryBtn label="Apply" onClick={save} />
      </FooterBar>

    </div>
  );
}
