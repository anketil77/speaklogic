// src/dialog/components/InsertConfirmToast.tsx
//
// Bottom-left auto-dismissing pill shown after the host inserts text into the
// document. Acknowledges the action since the dialog stays open and the inserted
// content is hidden behind it.

import React, { useEffect } from "react";
import { colors } from "@/styles/tokens";

export interface InsertConfirmToastProps {
  message: string;
  onDismiss: () => void;
  durationMs?: number;
}

// Single source of truth for the "action completed" toast. Used by AnalyzeView,
// ApplyFeedbackView and ProvideFeedbackView — the three editors that send
// INSERT_TEXT_AT_CURSOR. Styled to match the codebase: azure42 (primary blue),
// Inter font, weight 500 — same family as the action buttons in the footer.
export function InsertConfirmToast({ message, onDismiss, durationMs = 1600 }: InsertConfirmToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(t);
  }, [onDismiss, durationMs]);

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        left: 12,
        bottom: 12,
        zIndex: 10000,
        background: colors.azure42,
        color: colors.white,
        padding: "5px 10px",
        borderRadius: 3,
        fontFamily: "'Inter','Segoe UI',sans-serif",
        fontSize: 10.5,
        fontWeight: 500,
        letterSpacing: "-0.05px",
        boxShadow: "0 2px 8px rgba(0, 120, 212, 0.22)",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span aria-hidden style={{ fontSize: 11, lineHeight: 1 }}>✓</span>
      {message}
    </div>
  );
}
