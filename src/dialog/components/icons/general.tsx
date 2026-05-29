import React from "react";

export function CloseIcon({ stroke = "#616161" }: { stroke?: string } = {}) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <line x1="1" y1="1" x2="9" y2="9" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
      <line x1="9" y1="1" x2="1" y2="9" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function HamburgerIcon({ color = "#0078D4" }: { color?: string } = {}) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="2" width="14" height="2" rx="1" fill={color} />
      <rect x="2" y="6.5" width="9" height="2" rx="1" fill={color} />
      <rect x="2" y="11" width="11" height="2" rx="1" fill={color} />
      <rect x="2" y="15.5" width="6" height="1.5" rx="0.75" fill={color} />
    </svg>
  );
}

export function SmallCaretDownIcon({ color = "white" }: { color?: string } = {}) {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 3L4 5L6 3" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FilterFunnelIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 3H13L9 8V13L6 11V8L2 3Z" fill="#4259C3" stroke="#4259C3" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Filter dropdown item icons — blue #4259C3, 14×14 per Figma spec */
export function FilterWordDocIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      {/* document outline */}
      <rect x="2" y="1.5" width="10" height="11" rx="0.5" stroke="#4259C3" strokeWidth="1.2" />
      {/* content lines */}
      <rect x="4" y="5" width="6" height="1" rx="0.5" fill="#4259C3" />
      <rect x="4" y="7" width="4" height="1" rx="0.5" fill="#4259C3" />
    </svg>
  );
}

export function FilterOutlookMailIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      {/* envelope body */}
      <rect x="1.5" y="3" width="11" height="8" rx="0.5" stroke="#4259C3" strokeWidth="1.2" />
      {/* envelope V-fold */}
      <polyline points="1.5,3.5 7,8 12.5,3.5" stroke="#4259C3" strokeWidth="1.1" fill="none" />
    </svg>
  );
}

export function FilterPowerPointIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      {/* slide outline */}
      <rect x="1.5" y="2" width="11" height="10" rx="0.5" stroke="#4259C3" strokeWidth="1.2" />
      {/* title bar */}
      <rect x="3.5" y="3.5" width="7" height="1.5" rx="0.5" fill="#4259C3" fillOpacity="0.3" />
      {/* content line */}
      <rect x="4" y="6.5" width="6" height="1" rx="0.5" fill="#4259C3" />
    </svg>
  );
}

export function FilterShowAllIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      {/* 2×2 grid */}
      <rect x="2" y="2" width="4.5" height="4.5" rx="0.5" stroke="#4259C3" strokeWidth="1.1" />
      <rect x="7.5" y="2" width="4.5" height="4.5" rx="0.5" stroke="#4259C3" strokeWidth="1.1" />
      <rect x="2" y="7.5" width="4.5" height="4.5" rx="0.5" stroke="#4259C3" strokeWidth="1.1" />
      <rect x="7.5" y="7.5" width="4.5" height="4.5" rx="0.5" stroke="#4259C3" strokeWidth="1.1" />
    </svg>
  );
}

/** "Insert Guideline Reference" command-bar button — a bookmark/reference tag. */
export function GuidelineReferenceIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 2h8a1 1 0 0 1 1 1v11l-5-3-5 3V3a1 1 0 0 1 1-1Z" stroke="#616161" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M6 6h4M6 8.5h4" stroke="#616161" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
