// src/dialog/components/EntityModelDialog.tsx
// Web-only visual — no C# equivalent. Spec comes from the client diagram (point 10
// "Additional models"): a simple box → arrow → box flow for View Error / Compensator
// / Question / Answer / Problem. Both boxes are clickable; if the text does not fit it
// is truncated with "…" inside the box and the full content opens in an InlinePopup.
// Shares primitives with FeedbackModelDialog / PrincipleModelDialog via modelShared.tsx.

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

export interface EntityModelBox {
  /** Small bold label shown at the top of the box (e.g. "Actual Error"). */
  label: string;
  /** Full content shown in the popup; HTML is rendered, plain text is escaped by the browser. */
  content: string;
}

interface Props {
  title: string;
  subtitle: string;
  left: EntityModelBox;
  right: EntityModelBox;
  /** Text rendered above the connector arrow (e.g. "points to"). */
  arrowLabel?: string;
  onClose: () => void;
  /** Base z-index for the overlay; the dialog sits at base + 1. Pass the parent
   *  dialog's z-index + a margin so the model always stacks above its opener
   *  (e.g. View Error opened at 300 from the Analysis dialog). */
  zIndexBase?: number;
}

// ─── Diagram geometry ──────────────────────────────────────────────────────────
const M_W = 560, M_H = 200;
const BOX_W = 210, BOX_H = 120;
const L_X = 8, R_X = M_W - BOX_W - 8;       // left / right box X
const BOX_Y = (M_H - BOX_H) / 2;            // vertically centered
const L_RIGHT = L_X + BOX_W;
const R_LEFT = R_X;
const CY = BOX_Y + BOX_H / 2;

// Strip HTML tags for the in-box preview (the popup keeps full HTML).
function toPreview(html: string): string {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || "").trim();
}

function ModelBox({
  x, box, onClick,
}: {
  x: number; box: EntityModelBox; onClick: () => void;
}) {
  const preview = toPreview(box.content);
  return (
    <button
      onClick={onClick}
      title={`Click to view the ${box.label.toLowerCase()}`}
      style={{
        position: "absolute", left: x, top: BOX_Y, width: BOX_W, height: BOX_H,
        border: `2px solid ${BORDER_COLOR}`, borderRadius: 12, background: colors.white,
        cursor: "pointer", padding: "10px 12px", overflow: "hidden", zIndex: 5,
        display: "flex", flexDirection: "column", gap: 6, textAlign: "left",
        fontFamily: "inherit",
      }}
    >
      <div style={{
        fontSize: "11px", fontWeight: 700, color: colors.grey11,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6,
        flexShrink: 0,
      }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {box.label}
        </span>
        <ChatBubbleIcon color="#7a807c" size={15} />
      </div>
      <div style={{
        flex: 1, fontSize: "11px", color: preview ? "#4b524e" : "#9aa09c",
        lineHeight: "15px", fontWeight: preview ? 500 : 600, overflow: "hidden",
        display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical",
      }}>
        {preview || NOT_APPLICABLE}
      </div>
    </button>
  );
}

export function EntityModelDialog({ title, subtitle, left, right, arrowLabel, onClose, zIndexBase = 215 }: Props) {
  const { pos, onHeaderMouseDown } = useDraggable();
  const [popup, setPopup] = useState<{ title: string; htmlContent?: string; plainText?: string } | null>(null);

  const open = (b: EntityModelBox) =>
    setPopup({
      title: b.label,
      htmlContent: b.content?.trim() ? b.content : undefined,
      plainText: b.content?.trim() ? undefined : NOT_APPLICABLE,
    });

  const arrowMidX = (L_RIGHT + R_LEFT) / 2;

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
          background: colors.white,
          borderRadius: 8,
          boxShadow: "0px 8px 32px rgba(0,0,0,0.14), 0px 2px 8px rgba(0,0,0,0.06)",
          width: 620,
          maxWidth: "96vw",
          maxHeight: "92vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Inter','Segoe UI',sans-serif",
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
              {title}
            </div>
            <div style={{ fontSize: "11.1px", color: colors.grey38, lineHeight: "17px", marginTop: 2 }}>
              {subtitle}
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
        <div style={{ flex: 1, overflow: "auto", padding: "24px 30px" }}>
          <div style={{ position: "relative", width: M_W, height: M_H, flexShrink: 0, userSelect: "none", margin: "0 auto" }}>
            <svg
              style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}
              width={M_W} height={M_H}
            >
              <defs>
                <marker id="emarr" markerWidth="10" markerHeight="10" refX="6.5" refY="3.5" orient="auto">
                  <path d="M0,0 L0,7 L8,3.5 Z" fill={LINE_COLOR} />
                </marker>
              </defs>

              {/* Left box → right box (straight horizontal arrow) */}
              <line
                x1={L_RIGHT} y1={CY} x2={R_LEFT - 4} y2={CY}
                stroke={LINE_COLOR} strokeWidth="1.8" strokeLinecap="round" markerEnd="url(#emarr)"
              />

              {arrowLabel && (
                <text
                  x={arrowMidX} y={CY - 10}
                  textAnchor="middle"
                  fontSize="11.5" fontWeight="600" fill="#7a807c"
                  fontFamily="'Inter','Segoe UI',sans-serif"
                >
                  {arrowLabel}
                </text>
              )}
            </svg>

            <ModelBox x={L_X} box={left} onClick={() => open(left)} />
            <ModelBox x={R_X} box={right} onClick={() => open(right)} />

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
