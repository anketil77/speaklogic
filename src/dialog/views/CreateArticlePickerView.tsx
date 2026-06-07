// src/dialog/views/CreateArticlePickerView.tsx

import React, { useState } from "react";
import { useDialogComm } from "@/dialog/hooks/useDialogComm";
import { FooterBar, DismissBtn, PrimaryBtn } from "@/dialog/components/FooterButtons";
import {
  ArticlePickerBlankIcon,
  ArticlePickerTemplateIcon,
} from "@/dialog/components/Icons";

type PickerChoice = "blank" | "template";

export default function CreateArticlePickerView() {
  const { sendMessage } = useDialogComm();
  const [blankHover, setBlankHover] = useState(false);
  const [tmplHover,  setTmplHover]  = useState(false);
  const [selected,   setSelected]   = useState<PickerChoice | null>(null);

  const itemBase: React.CSSProperties = {
    display: "flex", flexDirection: "row", alignItems: "center",
    padding: "0 14px", gap: 11,
    width: "100%", height: 53,
    border: "none", cursor: "pointer", textAlign: "left",
    boxSizing: "border-box", flexShrink: 0,
    color: "#1B1B1B",           // reset browser button colour
    fontFamily: "'Inter','Segoe UI',sans-serif",
  };

  // Background per row: selected (blue tint) wins over hover.
  const rowBg = (choice: PickerChoice, hover: boolean) =>
    selected === choice ? "#EBF3FC" : hover ? "#F5F5F5" : "#FFFFFF";

  const handleDone = () => {
    if (selected === "blank") sendMessage({ action: "BLANK_SELECTED" });
    else if (selected === "template") sendMessage({ action: "TEMPLATE_SELECTED" });
  };

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
      {/* ── Header ── */}
      <div
        style={{
          padding: "13px 14px 10px",
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 12.6, lineHeight: "15px", color: "#1B1B1B" }}>
          Create Article
        </span>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: 1, background: "#F0F0F0", flexShrink: 0 }} />

      {/* ── List ── */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>

        {/* Blank */}
        <button
          onClick={() => setSelected("blank")}
          aria-pressed={selected === "blank"}
          onMouseEnter={() => setBlankHover(true)}
          onMouseLeave={() => setBlankHover(false)}
          style={{ ...itemBase, background: rowBg("blank", blankHover) }}
        >
          <div style={{
            width: 32, height: 32, background: "#EBF3FC", borderRadius: 6,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <ArticlePickerBlankIcon />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{ fontWeight: 700, fontSize: 12, lineHeight: "15px", color: "#1B1B1B" }}>
              Blank
            </span>
            <span style={{ fontWeight: 400, fontSize: 9.2, lineHeight: "13px", color: "#616161" }}>
              Create article from scratch
            </span>
          </div>
        </button>

        {/* Use Template */}
        <button
          onClick={() => setSelected("template")}
          aria-pressed={selected === "template"}
          onMouseEnter={() => setTmplHover(true)}
          onMouseLeave={() => setTmplHover(false)}
          style={{ ...itemBase, background: rowBg("template", tmplHover), borderTop: "1px solid #E0E0E0" }}
        >
          <div style={{
            width: 32, height: 32, background: "#EBF3FC", borderRadius: 6,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <ArticlePickerTemplateIcon />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{ fontWeight: 700, fontSize: 11.8, lineHeight: "14px", color: "#1B1B1B" }}>
              Use Template
            </span>
            <span style={{ fontWeight: 400, fontSize: 9.2, lineHeight: "13px", color: "#616161" }}>
              Create article using predefined template
            </span>
          </div>
        </button>
      </div>

      {/* ── Footer: Close + Done (Done enabled once an option is selected) ── */}
      <FooterBar>
        <DismissBtn label="Close" onClick={() => sendMessage({ action: "CLOSE" })} />
        <PrimaryBtn label="Done" onClick={handleDone} disabled={selected === null} />
      </FooterBar>
    </div>
  );
}
