// src/dialog/components/modelShared.tsx
// Shared primitives for the diagram dialogs (FeedbackModelDialog, PrincipleModelDialog).
// Keep these in one place — do NOT duplicate inside the model dialogs.

import React from "react";
import { CloseIcon } from "@/dialog/components/Icons";
import { colors } from "@/styles/tokens";

// ─── Shared constants ────────────────────────────────────────────────────────────
export const LINE_COLOR = "#2d2d2d"; // near-black arrow/line color
export const BORDER_COLOR = "#5aa06d"; // sage-green border
export const NOT_APPLICABLE = "Not Applicable";

// ─── Circular avatar with first-letter initial ────────────────────────────────────
export function InitialAvatar({
  name,
  size = 36,
  bg = "#C8D9EC",
  color: fgColor = "#1B5E8A",
}: {
  name: string;
  size?: number;
  bg?: string;
  color?: string;
}) {
  const trimmed = name?.trim();
  const letter = (trimmed && trimmed !== NOT_APPLICABLE ? trimmed[0] : "?").toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.38,
        fontWeight: 700,
        color: fgColor,
        flexShrink: 0,
        border: `1.5px solid ${colors.green}`,
        boxSizing: "border-box",
      }}
    >
      {letter}
    </div>
  );
}

// ─── Small chat-bubble glyph ──────────────────────────────────────────────────────
export function ChatBubbleIcon({
  color: c = colors.grey38,
  size = 12,
}: { color?: string; size?: number } = {}) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path
        d="M1.5 2C1.5 1.45 1.95 1 2.5 1H11.5C12.05 1 12.5 1.45 12.5 2V8C12.5 8.55 12.05 9 11.5 9H5L2.5 11.5V9H2.5C1.95 9 1.5 8.55 1.5 8V2Z"
        stroke={c} strokeWidth="1.2" strokeLinejoin="round"
      />
      <rect x="4" y="3.5" width="6" height="1" rx="0.5" fill={c} />
      <rect x="4" y="5.5" width="4" height="1" rx="0.5" fill={c} />
    </svg>
  );
}

// ─── Small pencil glyph ───────────────────────────────────────────────────────────
export function PencilIcon({ color: c = colors.grey38 }: { color?: string } = {}) {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
      <path d="M7 1.5L8.5 3 3.5 8H2V6.5L7 1.5Z" stroke={c} strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Small floating popup inside a relative container ─────────────────────────────
export function InlinePopup({
  title,
  htmlContent,
  plainText,
  onClose,
}: {
  title: string;
  htmlContent?: string;
  plainText?: string;
  onClose: () => void;
}) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -58%)",
        zIndex: 230,
        background: colors.white,
        border: `1px solid ${colors.grey88}`,
        borderRadius: 6,
        boxShadow: "0 6px 24px rgba(0,0,0,0.18)",
        width: 300,
        maxHeight: 210,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Inter','Segoe UI',sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "8px 11px 7px",
          borderBottom: `1px solid ${colors.grey88}`,
          flexShrink: 0,
        }}
      >
        <span style={{ flex: 1, fontSize: "11.5px", fontWeight: 700, color: colors.grey11 }}>
          {title}
        </span>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }}
        >
          <CloseIcon />
        </button>
      </div>
      <div
        style={{
          padding: "9px 11px",
          fontSize: "11px",
          color: colors.grey11,
          lineHeight: "17px",
          overflowY: "auto",
          flex: 1,
        }}
      >
        {htmlContent ? (
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        ) : (
          plainText || NOT_APPLICABLE
        )}
      </div>
    </div>
  );
}
