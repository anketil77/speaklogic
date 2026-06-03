// src/dialog/views/AboutView.tsx

import React from "react";
import { useDialogComm } from "@/dialog/hooks/useDialogComm";
import { colors } from "@/styles/tokens";
import { FooterBar, DismissBtn } from "@/dialog/components/FooterButtons";

export default function AboutView() {
  const { closeDialog } = useDialogComm();

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Tahoma, Segoe UI, sans-serif",
        background: colors.white,
        boxSizing: "border-box",
      }}
    >
      {/* ── Main content area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "row", padding: "16px 16px 8px 16px" }}>
        {/* Logo */}
        <div style={{ width: 133, minWidth: 133, display: "flex", alignItems: "flex-start", paddingTop: 2 }}>
          <img
            src="/assets/aboutword.png"
            alt="Speak Logic"
            style={{ width: 72, height: 72 }}
          />
        </div>

        {/* Text stack */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <span style={{ fontSize: "21px", fontWeight: "400", color: "#1F1F1F", lineHeight: "1.25", marginBottom: 6 }}>
            Speak Logic Information Analysis
          </span>
          <span style={{ fontSize: "19px", fontWeight: "400", color: "#1F1F1F", lineHeight: "1.25", marginBottom: 10 }}>
            For Microsoft Office
          </span>
          <span style={{ fontSize: "16px", color: "#1F1F1F", lineHeight: "1.4", marginBottom: 4 }}>
            Copyright © 2012
          </span>
          <span style={{ fontSize: "16px", color: "#1F1F1F", lineHeight: "1.4", marginBottom: 16 }}>
            The Speak Logic Project
          </span>
          <a
            href="http://speaklogic.org"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: "14px", color: "#0563C1", textDecoration: "underline", marginBottom: 0 }}
          >
            www.SpeakLogic.Org
          </a>
        </div>
      </div>

      {/* Version — bottom-right of content, above divider */}
      <div style={{ paddingRight: 16, paddingBottom: 6, textAlign: "right" }}>
        <span style={{ fontSize: "11px", color: colors.grey11 }}>Version 2012 Release 2.1</span>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "#C7C7C7", marginLeft: 16, marginRight: 16 }} />

      {/* Footer — Close button */}
      <FooterBar><DismissBtn label="Close" onClick={closeDialog} /></FooterBar>
    </div>
  );
}
