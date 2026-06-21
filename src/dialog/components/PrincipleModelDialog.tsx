// src/dialog/components/PrincipleModelDialog.tsx
// Web-only visual for the related principle (SelectionWithPrinciple).
// No C# equivalent — spec comes from the client diagram:
//   Selection box (top-left) + Principle box (bottom-left) → circle join node → Relationship box (right)
// Each box has a clickable text icon that pops up its content (mirrors the
// View Related Principle tabs: About Selection / About Principle / About Relationship).
// Shares primitives with FeedbackModelDialog via modelShared.tsx.

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

interface Props {
  aboutSelection: string;
  actualPrinciple: string;
  principleName: string;
  setDerivedFrom: string;
  principleDescription: string;
  actualRelationship: string;
  relationshipDescription: string;
  onClose: () => void;
}

// ─── Derived principle model (maps the related-principle fields → diagram) ─────────
function deriveModel(p: Props) {
  const selectionHtml = p.aboutSelection?.trim() || "";

  // "The principle" = the full About Principle tab content.
  const rows: string[] = [];
  if (p.actualPrinciple?.trim()) rows.push(`<b>Actual Principle:</b> ${p.actualPrinciple.trim()}`);
  if (p.principleName?.trim()) rows.push(`<b>Principle Name:</b> ${p.principleName.trim()}`);
  if (p.setDerivedFrom?.trim()) rows.push(`<b>Set Derived From:</b> ${p.setDerivedFrom.trim()}`);
  if (p.principleDescription?.trim())
    rows.push(`<b>Principle Description:</b><br/>${p.principleDescription.trim()}`);
  const principleHtml = rows.join("<br/><br/>");

  // "The relationship text" = the About Relationship tab content.
  const relRows: string[] = [];
  if (p.actualRelationship?.trim()) relRows.push(`<b>Actual Relationship:</b> ${p.actualRelationship.trim()}`);
  if (p.relationshipDescription?.trim())
    relRows.push(`<b>Relationship Description:</b><br/>${p.relationshipDescription.trim()}`);
  const relationshipHtml = relRows.join("<br/><br/>");

  return {
    selectionHtml,
    principleHtml,
    relationshipHtml,
    principlePreview: p.principleName?.trim() || p.actualPrinciple?.trim() || "",
    relationshipPreview: p.actualRelationship?.trim() || "",
  };
}

// ─── Diagram geometry ──────────────────────────────────────────────────────────
const M_W = 580, M_H = 380;
const BOX_W = 180, BOX_H = 96;

const TL_X = 10, TL_Y = 20;            // Selection (top-left)
const BL_X = 10, BL_Y = 240;           // Principle (bottom-left)
const RB_X = 410, RB_Y = 152, RB_W = 170, RB_H = 96;  // Relationship (right)

const CIR_CX = 300, CIR_CY = 200, CIR_R = 42;

const TL_RIGHT = TL_X + BOX_W;         // 190
const TL_CY = TL_Y + BOX_H / 2;        // 68
const BL_RIGHT = BL_X + BOX_W;         // 190
const BL_CY = BL_Y + BOX_H / 2;        // 288
const RB_LEFT = RB_X;                  // 410
const RB_CY = RB_Y + RB_H / 2;         // 200

// ─── Clickable box ────────────────────────────────────────────────────────────
function ModelBox({
  x, y, w, h, label, blueHeader, onClick,
}: {
  x: number; y: number; w: number; h: number;
  label: string; blueHeader?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={`Click to view the ${label.toLowerCase()}`}
      style={{
        position: "absolute", left: x, top: y, width: w, height: h,
        border: `2px solid ${BORDER_COLOR}`, borderRadius: 12, background: colors.white,
        cursor: "pointer", padding: 0, overflow: "hidden", zIndex: 5,
        display: "flex", flexDirection: "column", fontFamily: "inherit",
      }}
    >
      {blueHeader ? (
        <>
          <div style={{
            height: 34, background: colors.azure42, color: colors.white,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 12px", fontSize: "12px", fontWeight: 700, flexShrink: 0,
          }}>
            <span>{label}</span>
            <ChatBubbleIcon color={colors.white} size={15} />
          </div>
          <div style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "11px", color: "#7a807c", fontWeight: 600,
          }}>
            Click to view
          </div>
        </>
      ) : (
        <div style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          gap: 8, fontSize: "12px", color: "#4b524e", fontWeight: 600,
        }}>
          <span>{label}</span>
          <ChatBubbleIcon color="#7a807c" size={16} />
        </div>
      )}
    </button>
  );
}

export function PrincipleModelDialog(props: Props) {
  const { onClose } = props;
  const { pos, onHeaderMouseDown } = useDraggable();
  const [popup, setPopup] = useState<{ title: string; htmlContent?: string; plainText?: string } | null>(null);

  const m = deriveModel(props);

  const open = (title: string, html: string) =>
    setPopup({ title, htmlContent: html || undefined, plainText: html ? undefined : NOT_APPLICABLE });

  return createPortal(
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.12)", zIndex: 215 }} onClick={onClose} />
      <div
        style={{
          position: "fixed",
          left: `calc(50% + ${pos.x}px)`,
          top: `calc(50% + ${pos.y}px)`,
          transform: "translate(-50%, -50%)",
          zIndex: 216,
          background: colors.white,
          borderRadius: 8,
          boxShadow: "0px 8px 32px rgba(0,0,0,0.14), 0px 2px 8px rgba(0,0,0,0.06)",
          width: 640,
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
              Principle Model
            </div>
            <div style={{ fontSize: "11.1px", color: colors.grey38, lineHeight: "17px", marginTop: 2 }}>
              View the selection-principle relationship model.
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
                <marker id="pmarr" markerWidth="9" markerHeight="9" refX="6.5" refY="3.5" orient="auto">
                  <path d="M0,0 L0,7 L8,3.5 Z" fill={LINE_COLOR} />
                </marker>
              </defs>

              {/* Selection box → down into circle top */}
              <path
                d={`M ${TL_RIGHT} ${TL_CY} L ${CIR_CX} ${TL_CY} L ${CIR_CX} ${CIR_CY - CIR_R - 4}`}
                fill="none" stroke={LINE_COLOR} strokeWidth="1.7"
                strokeLinecap="round" strokeLinejoin="round" markerEnd="url(#pmarr)"
              />

              {/* Principle box → up into circle bottom */}
              <path
                d={`M ${BL_RIGHT} ${BL_CY} L ${CIR_CX} ${BL_CY} L ${CIR_CX} ${CIR_CY + CIR_R + 4}`}
                fill="none" stroke={LINE_COLOR} strokeWidth="1.7"
                strokeLinecap="round" strokeLinejoin="round" markerEnd="url(#pmarr)"
              />

              {/* Circle join node */}
              <circle cx={CIR_CX} cy={CIR_CY} r={CIR_R} fill={colors.white} stroke={BORDER_COLOR} strokeWidth="2" />
              <text
                x={CIR_CX} y={CIR_CY}
                textAnchor="middle" dominantBaseline="central"
                fontSize="13" fontWeight="600" fill={colors.grey11}
                fontFamily="'Inter','Segoe UI',sans-serif"
              >
                Related
              </text>

              {/* Circle → Relationship box */}
              <line
                x1={CIR_CX + CIR_R} y1={CIR_CY} x2={RB_LEFT - 4} y2={RB_CY}
                stroke={LINE_COLOR} strokeWidth="1.7" strokeLinecap="round" markerEnd="url(#pmarr)"
              />
            </svg>

            <ModelBox x={TL_X} y={TL_Y} w={BOX_W} h={BOX_H} label="Selection" onClick={() => open("Selection", m.selectionHtml)} />
            <ModelBox x={BL_X} y={BL_Y} w={BOX_W} h={BOX_H} label="Principle" blueHeader onClick={() => open("Principle", m.principleHtml)} />
            <ModelBox x={RB_X} y={RB_Y} w={RB_W} h={RB_H} label="Relationship" onClick={() => open("Relationship", m.relationshipHtml)} />

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
