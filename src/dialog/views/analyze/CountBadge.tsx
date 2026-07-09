// src/dialog/views/analyze/CountBadge.tsx
// Small circular live-count badge pinned to the bottom-right of its (position:
// relative) parent box. Used on the Analysis dialog to show the running count of
// identified errors (on Entity Under Analysis) and compensators (on Actual
// Analysis) — mirrors the old desktop app's counters. Client feedback 07-09.

import React from "react";

export function CountBadge({ count, color, title }: { count: number; color: string; title: string }) {
  return (
    <div
      title={title}
      aria-label={title}
      style={{
        position: "absolute",
        right: 8,
        bottom: 8,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        background: color,
        color: "#FFFFFF",
        fontSize: 11,
        fontWeight: 700,
        lineHeight: "20px",
        textAlign: "center",
        padding: "0 6px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
        pointerEvents: "none",
        zIndex: 3,
        fontFamily: "'Inter','Segoe UI',sans-serif",
      }}
    >
      {count}
    </div>
  );
}
