// src/dialog/components/toolbar/tableIcons.tsx
//
// Small glyphs for the table context menu (icon-only grid). Colocated with the
// table-editing code per the toolbar-internals convention (like ToolbarIcons).
// 16×16 viewBox; insert accent is blue, delete accent is red.

import React from "react";

const BASE = "#5B5B5B";
const ADD = "#0078D4";
const DEL = "#D13438";

type P = { color?: string };

function Plus({ cx, cy, c = ADD }: { cx: number; cy: number; c?: string }) {
  return (
    <>
      <line
        x1={cx}
        y1={cy - 1.9}
        x2={cx}
        y2={cy + 1.9}
        stroke={c}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1={cx - 1.9}
        y1={cy}
        x2={cx + 1.9}
        y2={cy}
        stroke={c}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </>
  );
}

export function InsertRowAboveIcon({ color = BASE }: P = {}) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="6" width="12" height="8" rx="1" stroke={color} strokeWidth="1.2" />
      <line x1="2" y1="10" x2="14" y2="10" stroke={color} strokeWidth="1" />
      <line x1="8" y1="6" x2="8" y2="14" stroke={color} strokeWidth="1" />
      <Plus cx={8} cy={2.7} />
    </svg>
  );
}

export function InsertRowBelowIcon({ color = BASE }: P = {}) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="12" height="8" rx="1" stroke={color} strokeWidth="1.2" />
      <line x1="2" y1="6" x2="14" y2="6" stroke={color} strokeWidth="1" />
      <line x1="8" y1="2" x2="8" y2="10" stroke={color} strokeWidth="1" />
      <Plus cx={8} cy={13.3} />
    </svg>
  );
}

export function InsertColLeftIcon({ color = BASE }: P = {}) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="6" y="2" width="8" height="12" rx="1" stroke={color} strokeWidth="1.2" />
      <line x1="10" y1="2" x2="10" y2="14" stroke={color} strokeWidth="1" />
      <line x1="6" y1="8" x2="14" y2="8" stroke={color} strokeWidth="1" />
      <Plus cx={2.7} cy={8} />
    </svg>
  );
}

export function InsertColRightIcon({ color = BASE }: P = {}) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="8" height="12" rx="1" stroke={color} strokeWidth="1.2" />
      <line x1="6" y1="2" x2="6" y2="14" stroke={color} strokeWidth="1" />
      <line x1="2" y1="8" x2="10" y2="8" stroke={color} strokeWidth="1" />
      <Plus cx={13.3} cy={8} />
    </svg>
  );
}

export function MergeCellsIcon({ color = BASE }: P = {}) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="4" width="12" height="8" rx="1" stroke={color} strokeWidth="1.2" />
      <line x1="8" y1="4" x2="8" y2="12" stroke={color} strokeWidth="1" strokeDasharray="1.6 1.6" />
      {/* arrows pointing inward to the seam */}
      <path
        d="M4.4 8 H6.6 M5.4 7 L6.6 8 L5.4 9"
        stroke={ADD}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.6 8 H9.4 M10.6 7 L9.4 8 L10.6 9"
        stroke={ADD}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SplitCellIcon({ color = BASE }: P = {}) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="4" width="12" height="8" rx="1" stroke={color} strokeWidth="1.2" />
      <line x1="8" y1="4" x2="8" y2="12" stroke={color} strokeWidth="1.2" />
      {/* arrows pointing outward from the divider */}
      <path
        d="M6.4 8 H4.2 M5.2 7 L4.2 8 L5.2 9"
        stroke={ADD}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.6 8 H11.8 M10.8 7 L11.8 8 L10.8 9"
        stroke={ADD}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DeleteRowIcon({ color = BASE }: P = {}) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3" width="12" height="10" rx="1" stroke={color} strokeWidth="1.2" />
      <line x1="2" y1="8" x2="14" y2="8" stroke={color} strokeWidth="1" />
      {/* red bar over the lower row */}
      <rect x="3.2" y="9.4" width="9.6" height="2.2" rx="1.1" fill={DEL} />
    </svg>
  );
}

export function DeleteColIcon({ color = BASE }: P = {}) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="3" y="2" width="10" height="12" rx="1" stroke={color} strokeWidth="1.2" />
      <line x1="8" y1="2" x2="8" y2="14" stroke={color} strokeWidth="1" />
      {/* red bar over the right column */}
      <rect x="9.4" y="3.2" width="2.2" height="9.6" rx="1.1" fill={DEL} />
    </svg>
  );
}

export function DeleteTableIcon({ color = DEL }: P = {}) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2.5" width="12" height="11" rx="1" stroke={color} strokeWidth="1.2" />
      <line x1="2" y1="6.5" x2="14" y2="6.5" stroke={color} strokeWidth="1" />
      <line x1="8" y1="2.5" x2="8" y2="13.5" stroke={color} strokeWidth="1" />
      <line
        x1="10"
        y1="9"
        x2="13.5"
        y2="12.5"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <line
        x1="13.5"
        y1="9"
        x2="10"
        y2="12.5"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
