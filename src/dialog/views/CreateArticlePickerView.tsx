// src/dialog/views/CreateArticlePickerView.tsx
//
// Entry picker shown when "Create Article" is clicked.
// Small dialog (260×163px). Sends BLANK_SELECTED or TEMPLATE_SELECTED
// to the host, which closes this dialog and opens the full article form.

import React, { useState } from "react";
import { useDialogComm } from "@/dialog/hooks/useDialogComm";
import {
  ArticlePickerBlankIcon,
  ArticlePickerTemplateIcon,
} from "@/dialog/components/Icons";

export default function CreateArticlePickerView() {
  const { sendMessage } = useDialogComm();
  const [blankHover, setBlankHover] = useState(false);
  const [tmplHover,  setTmplHover]  = useState(false);

  return (
    <div
      style={{
        width: "100vw", height: "100vh",
        background: "#FFFFFF",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        fontFamily: "'Inter','Segoe UI',sans-serif",
      }}
    >
      {/* ── Header — 41px (no custom X — native dialog chrome already has one) */}
      <div
        style={{
          display: "flex", flexDirection: "row",
          alignItems: "center",
          padding: "12px 14px 10px",
          height: 41, boxSizing: "border-box", flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 12.6, lineHeight: "15px", color: "#1B1B1B" }}>
          Create Article
        </span>
      </div>

      {/* ── List ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", padding: "8px 0 12px", flex: 1 }}>

        {/* Item 1 — Blank */}
        <button
          onClick={() => sendMessage({ action: "BLANK_SELECTED" })}
          onMouseEnter={() => setBlankHover(true)}
          onMouseLeave={() => setBlankHover(false)}
          style={{
            display: "flex", flexDirection: "row", alignItems: "flex-start",
            padding: "10px 14px", gap: 11,
            width: "100%", height: 53,
            background: blankHover ? "#F5F5F5" : "transparent",
            border: "none", cursor: "pointer", textAlign: "left",
            boxSizing: "border-box", flexShrink: 0,
          }}
        >
          <div style={{ width: 32, height: 32, background: "#EBF3FC", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ArticlePickerBlankIcon />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, justifyContent: "center", height: 32 }}>
            <span style={{ fontWeight: 700, fontSize: 12, lineHeight: "15px", color: "#1B1B1B" }}>
              Blank
            </span>
            <span style={{ fontWeight: 400, fontSize: 9.2, lineHeight: "14px", color: "#616161" }}>
              Create article from scratch
            </span>
          </div>
        </button>

        {/* Item 2 — Use Template */}
        <button
          onClick={() => sendMessage({ action: "TEMPLATE_SELECTED" })}
          onMouseEnter={() => setTmplHover(true)}
          onMouseLeave={() => setTmplHover(false)}
          style={{
            display: "flex", flexDirection: "row", alignItems: "flex-start",
            padding: "10px 14px", gap: 11,
            width: "100%", height: 53,
            background: tmplHover ? "#F5F5F5" : "transparent",
            border: "none", borderTop: "1px solid #E0E0E0",
            cursor: "pointer", textAlign: "left",
            boxSizing: "border-box", flexShrink: 0,
          }}
        >
          <div style={{ width: 32, height: 32, background: "#EBF3FC", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ArticlePickerTemplateIcon />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, justifyContent: "center", height: 32 }}>
            <span style={{ fontWeight: 700, fontSize: 11.8, lineHeight: "14px", color: "#1B1B1B" }}>
              Use Template
            </span>
            <span style={{ fontWeight: 400, fontSize: 9.2, lineHeight: "14px", color: "#616161" }}>
              Create article using predefined template
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
