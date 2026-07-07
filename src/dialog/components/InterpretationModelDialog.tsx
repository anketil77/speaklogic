// src/dialog/components/InterpretationModelDialog.tsx
// Interpretation Model diagram (client feedback: "add model for interpretation").
// Mirrors AnalysisModelDialog — four nodes:
//
//   [Person Interpreted] → [Principle] → [Interpretation Result]
//                              │
//                    [Communication Principle]
//
// Each box is clickable and opens its full content in a popup.
// Shares primitives with the other model dialogs via modelShared.

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useDraggable } from "@/dialog/hooks/useDraggable";
import { CloseIcon, FeedbackModelIcon } from "@/dialog/components/Icons";
import { colors } from "@/styles/tokens";
import {
  ChatBubbleIcon,
  InlinePopup,
  LINE_COLOR,
  BORDER_COLOR,
  NOT_APPLICABLE,
} from "@/dialog/components/modelShared";
import type { PrincipleInterpretation } from "@/types/db";

interface Props {
  interpretation: PrincipleInterpretation;
  onClose: () => void;
  zIndexBase?: number;
}

// ─── Geometry (matches AnalysisModelDialog) ──────────────────────────────────────
const M_W = 600, M_H = 330;
const BOX_W = 168, BOX_H = 76;
const TOP_Y = 14;
const L_X = 6;
const C_X = (M_W - BOX_W) / 2;
const R_X = M_W - BOX_W - 6;
const BOTTOM_Y = TOP_Y + BOX_H + 92;
const TOP_CY = TOP_Y + BOX_H / 2;
const C_CX = C_X + BOX_W / 2;

function toPreview(html: string): string {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || "").trim();
}

function ModelBox({
  x, y, label, content, onClick,
}: {
  x: number; y: number; label: string; content: string; onClick: () => void;
}) {
  const preview = toPreview(content);
  return (
    <button
      onClick={onClick}
      title={`Click to view the ${label.toLowerCase()}`}
      style={{
        position: "absolute", left: x, top: y, width: BOX_W, height: BOX_H,
        border: `2px solid ${BORDER_COLOR}`, borderRadius: 12, background: colors.white,
        cursor: "pointer", padding: "9px 11px", overflow: "hidden", zIndex: 5,
        display: "flex", flexDirection: "column", gap: 5, textAlign: "left", fontFamily: "inherit",
      }}
    >
      <div style={{
        fontSize: "11px", fontWeight: 700, color: colors.grey11,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, flexShrink: 0,
      }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
        <ChatBubbleIcon color="#7a807c" size={15} />
      </div>
      <div style={{
        flex: 1, fontSize: "11px", color: preview ? "#4b524e" : "#9aa09c",
        lineHeight: "15px", fontWeight: preview ? 500 : 600, overflow: "hidden",
        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
      }}>
        {preview || NOT_APPLICABLE}
      </div>
    </button>
  );
}

export function InterpretationModelDialog({ interpretation, onClose, zIndexBase = 215 }: Props) {
  const { pos, onHeaderMouseDown } = useDraggable();
  const [popup, setPopup] = useState<{ title: string; htmlContent?: string; plainText?: string } | null>(null);

  const open = (title: string, content: string) =>
    setPopup({
      title,
      htmlContent: content?.trim() ? content : undefined,
      plainText: content?.trim() ? undefined : NOT_APPLICABLE,
    });

  const personText = (interpretation.personInterpreted || "").trim();
  const principleText = (interpretation.principleName || "").trim();
  const resultText = interpretation.interpretationResult || "";
  const commText = interpretation.communicationPrinciple || "";

  // Full content shown in each box's popup.
  const principlePopup = [
    interpretation.principleName ? `<b>Principle Name:</b> ${interpretation.principleName}` : "",
    interpretation.setDerivedFrom ? `<b>Set Derived From:</b> ${interpretation.setDerivedFrom}` : "",
  ].filter(Boolean).join("<br/><br/>");
  const commPopup = [
    interpretation.communicationPrinciple ? `<b>Communication Principle:</b> ${interpretation.communicationPrinciple}` : "",
    interpretation.commPrincipleDescription ? `<br/>${interpretation.commPrincipleDescription}` : "",
  ].filter(Boolean).join("");

  return createPortal(
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.12)", zIndex: zIndexBase }} onClick={onClose} />
      <div
        style={{
          position: "fixed",
          left: `calc(50% + ${pos.x}px)`,
          top: `calc(50% + ${pos.y}px)`,
          transform: "translate(-50%, -50%)",
          zIndex: zIndexBase + 1,
          background: colors.white, borderRadius: 8,
          boxShadow: "0px 8px 32px rgba(0,0,0,0.14), 0px 2px 8px rgba(0,0,0,0.06)",
          width: 660, maxWidth: "96vw", maxHeight: "92vh", overflow: "hidden",
          display: "flex", flexDirection: "column", fontFamily: "'Inter','Segoe UI',sans-serif",
        }}
      >
        {/* Header */}
        <div
          onMouseDown={onHeaderMouseDown}
          style={{ height: 72, display: "flex", alignItems: "center", padding: "0 20px", gap: 12, flexShrink: 0, cursor: "grab", userSelect: "none" }}
        >
          <div style={{ width: 32, height: 32, borderRadius: 6, background: "#EBF3FC", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FeedbackModelIcon color={colors.azure42} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "15.6px", fontWeight: 700, color: colors.grey11, letterSpacing: "-0.1px", lineHeight: "21px" }}>
              Interpretation Model
            </div>
            <div style={{ fontSize: "11.1px", color: colors.grey38, lineHeight: "17px", marginTop: 2 }}>
              View the interpretation model representation.
            </div>
          </div>
          <button
            className="sl-close-btn"
            onClick={onClose}
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", borderRadius: 4, cursor: "pointer", flexShrink: 0, padding: 0 }}
            title="Close"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Diagram */}
        <div style={{ flex: 1, overflow: "auto", padding: "20px 30px 28px" }}>
          <div style={{ position: "relative", width: M_W, height: M_H, flexShrink: 0, userSelect: "none", margin: "0 auto" }}>
            <svg style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }} width={M_W} height={M_H}>
              <defs>
                <marker id="imarr" markerWidth="10" markerHeight="10" refX="6.5" refY="3.5" orient="auto">
                  <path d="M0,0 L0,7 L8,3.5 Z" fill={LINE_COLOR} />
                </marker>
              </defs>

              {/* Person Interpreted → Principle */}
              <line x1={L_X + BOX_W} y1={TOP_CY} x2={C_X - 4} y2={TOP_CY} stroke={LINE_COLOR} strokeWidth="1.8" strokeLinecap="round" markerEnd="url(#imarr)" />
              {/* Principle → Interpretation Result */}
              <line x1={C_X + BOX_W} y1={TOP_CY} x2={R_X - 4} y2={TOP_CY} stroke={LINE_COLOR} strokeWidth="1.8" strokeLinecap="round" markerEnd="url(#imarr)" />
              {/* Principle ↓ Communication Principle */}
              <line x1={C_CX} y1={TOP_Y + BOX_H} x2={C_CX} y2={BOTTOM_Y - 4} stroke={LINE_COLOR} strokeWidth="1.8" strokeLinecap="round" markerEnd="url(#imarr)" />
            </svg>

            <ModelBox x={L_X} y={TOP_Y}       label="Person Interpreted"      content={personText}    onClick={() => open("Person Interpreted", personText)} />
            <ModelBox x={C_X} y={TOP_Y}       label="Principle"               content={principleText} onClick={() => open("Principle", principlePopup)} />
            <ModelBox x={R_X} y={TOP_Y}       label="Interpretation Result"   content={resultText}    onClick={() => open("Interpretation Result", resultText)} />
            <ModelBox x={C_X} y={BOTTOM_Y}    label="Communication Principle" content={commText}      onClick={() => open("Communication Principle", commPopup)} />

            {popup && (
              <InlinePopup
                title={popup.title}
                htmlContent={popup.htmlContent}
                plainText={popup.plainText}
                onClose={() => setPopup(null)}
              />
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
