// src/dialog/components/toolbar/ToolbarIcons.tsx
import React from "react";

export function ChevronDown() {
  return (
    <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
      <path
        d="M1 1L4 4L7 1"
        stroke="#616161"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AlignmentIcon() {
  return (
    <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
      <path
        d="M0 0.5H11M4 3.5H11M2 6.5H11M5 9.5H11"
        stroke="#1B1B1B"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ClipboardIcon() {
  return (
    <svg width="9" height="12" viewBox="0 0 9 12" fill="none">
      <rect x="0.5" y="1" width="7" height="10" rx="0.5" stroke="#1B1B1B" strokeWidth="1.2" />
      <path d="M2 1V0H6V1" stroke="#1B1B1B" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M2 5H6M2 7.5H5" stroke="#1B1B1B" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

export function FindReplaceIcon() {
  return (
    <svg width="12" height="13" viewBox="0 0 12 13" fill="none">
      <path
        d="M0 2.5H4M0 6H3M0 9.5H4"
        stroke="#1B1B1B"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M6.5 2.5H11.5M6.5 6H11.5M6.5 9.5H11.5"
        stroke="#1B1B1B"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path d="M5 0V12" stroke="#1B1B1B" strokeWidth="0.8" strokeDasharray="2 1" />
    </svg>
  );
}

export function SaveLayoutIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect x="0.5" y="0.5" width="11" height="11" rx="0.7" stroke="#1B1B1B" strokeWidth="1.2" />
      <rect x="3" y="0.5" width="4" height="4.5" rx="0.3" stroke="#1B1B1B" strokeWidth="1.1" />
      <path d="M6.5 1.5V3.5" stroke="#1B1B1B" strokeWidth="1.1" strokeLinecap="round" />
      <rect x="1" y="6.5" width="10" height="3.5" rx="0.3" stroke="#1B1B1B" strokeWidth="1.1" />
    </svg>
  );
}

export function PrintIcon() {
  return (
    <svg width="10" height="13" viewBox="0 0 10 13" fill="none">
      <rect x="0.8" y="0.5" width="7.4" height="5.5" rx="0.4" stroke="#1B1B1B" strokeWidth="1.2" />
      <rect x="0.8" y="7.5" width="7.4" height="4.5" rx="0.4" stroke="#1B1B1B" strokeWidth="1.2" />
      <path d="M2 9.5H7M2 11H5" stroke="#1B1B1B" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="8.5" cy="4" r="0.7" fill="#1B1B1B" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <circle cx="4.5" cy="4.5" r="4" stroke="#1B1B1B" strokeWidth="1.3" />
      <path d="M7.5 7.5L11 11" stroke="#1B1B1B" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function SpellCheckIcon() {
  return (
    <svg width="16" height="13" viewBox="0 0 16 13" fill="none">
      {/* A */}
      <path d="M1 9L2.5 5L4 9M1.7 7.7H3.5" stroke="#1B1B1B" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
      {/* B */}
      <path d="M5.5 5v4M5.5 5h1.5c.9 0 .9 2 0 2M5.5 7h1.5c.9 0 .9 2 0 2H5.5" stroke="#1B1B1B" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
      {/* C */}
      <path d="M10.5 5.8C10 4.8 8 4.8 8 7s2 2.4 2.5 1.4" stroke="#1B1B1B" strokeWidth="1" strokeLinecap="round"/>
      {/* Green checkmark */}
      <path d="M9.5 10.5L11 12.5L15.5 8" stroke="#107C10" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function OpenIconSvg() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path
        d="M1 10.5V2.5C1 1.95 1.45 1.5 2 1.5H5L6.5 3H10C10.55 3 11 3.45 11 4V5"
        stroke="#1B1B1B"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 10.5L3.5 6L6 5.5L9 5L11 5.5L10.5 11.5L2 10.5Z"
        stroke="#1B1B1B"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SuperscriptIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <rect x="2" y="6" width="5" height="6" rx="0.5" stroke="#1B1B1B" strokeWidth="1.3" />
      <rect x="9.5" y="2.5" width="2.5" height="2.5" rx="0.3" stroke="#1B1B1B" strokeWidth="1.1" />
    </svg>
  );
}

export function SubscriptIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <rect x="2" y="4.5" width="5" height="6" rx="0.5" stroke="#1B1B1B" strokeWidth="1.3" />
      <rect x="9.5" y="10" width="2.5" height="2.5" rx="0.3" stroke="#1B1B1B" strokeWidth="1.1" />
    </svg>
  );
}

export function AlignLeftIcon() {
  return (
    <svg width="15" height="12" viewBox="0 0 15 12" fill="none">
      <path
        d="M0 1H15M0 4H9M0 7H11M0 10H7"
        stroke="#1B1B1B"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AlignCenterIcon() {
  return (
    <svg width="15" height="12" viewBox="0 0 15 12" fill="none">
      <path
        d="M0 1H15M3 4H12M2 7H13M4 10H11"
        stroke="#1B1B1B"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AlignRightIcon() {
  return (
    <svg width="15" height="12" viewBox="0 0 15 12" fill="none">
      <path
        d="M0 1H15M6 4H15M4 7H15M8 10H15"
        stroke="#1B1B1B"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AlignJustifyIcon() {
  return (
    <svg width="15" height="12" viewBox="0 0 15 12" fill="none">
      <path
        d="M0 1H15M0 4H15M0 7H15M0 10H15"
        stroke="#1B1B1B"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CutIconSvg() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="3.5" cy="12" r="2" stroke="#1B1B1B" strokeWidth="1.2" />
      <circle cx="11.5" cy="12" r="2" stroke="#1B1B1B" strokeWidth="1.2" />
      <path
        d="M5 10.5L7.5 7.5L10 10.5"
        stroke="#1B1B1B"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 4.5L7.5 7.5L10 4.5"
        stroke="#1B1B1B"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CopyIconSvg() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <rect x="1.5" y="3.5" width="8" height="10" rx="0.7" stroke="#1B1B1B" strokeWidth="1.2" />
      <rect
        x="5"
        y="1.5"
        width="8"
        height="10"
        rx="0.7"
        fill="white"
        stroke="#1B1B1B"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export function PasteIconSvg() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <rect x="3" y="4" width="9" height="10" rx="0.7" stroke="#1B1B1B" strokeWidth="1.2" />
      <path
        d="M6 4V2.5H9V4"
        stroke="#1B1B1B"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M5 7.5H10M5 10H8.5" stroke="#1B1B1B" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

export function BulletListIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="2" cy="3.5" r="1.2" fill="#1B1B1B" />
      <circle cx="2" cy="7.5" r="1.2" fill="#1B1B1B" />
      <circle cx="2" cy="11.5" r="1.2" fill="#1B1B1B" />
      <path
        d="M5.5 3.5H14M5.5 7.5H14M5.5 11.5H14"
        stroke="#1B1B1B"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function NumberedListIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M1.5 2H3V5.5" stroke="#1B1B1B" strokeWidth="1.1" strokeLinecap="round" />
      <path
        d="M1.5 8.5C1.5 7.5 3 7 3 8.5C3 9.5 1.5 10 1.5 11H3"
        stroke="#1B1B1B"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 3.5H14M6 7.5H14M6 11.5H14"
        stroke="#1B1B1B"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function OutlineListIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="2" cy="3.5" r="1.2" fill="#1B1B1B" />
      <circle cx="3.5" cy="7.5" r="0.9" fill="#1B1B1B" />
      <circle cx="3.5" cy="11.5" r="0.9" fill="#1B1B1B" />
      <path
        d="M5.5 3.5H14M6.5 7.5H14M6.5 11.5H14"
        stroke="#1B1B1B"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
