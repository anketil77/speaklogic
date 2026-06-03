// src/dialog/components/FooterButtons.tsx
// Standard h57 footer primitives used by all dialog/view footers.
import React from "react";

const FOOTER: React.CSSProperties = {
  height: 57,
  borderTop: "1px solid #E0E0E0",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: "0 20px",
  gap: 8,
  flexShrink: 0,
  background: "#FFFFFF",
};

const DISMISS: React.CSSProperties = {
  height: 32,
  padding: "0 18px",
  background: "#FFFFFF",
  border: "1px solid #C7C7C7",
  borderRadius: 4,
  fontSize: "12.4px",
  fontFamily: "inherit",
  color: "#1B1B1B",
  cursor: "pointer",
  flexShrink: 0,
};

const PRIMARY: React.CSSProperties = {
  height: 32,
  padding: "0 18px",
  background: "#0078D4",
  border: "none",
  borderRadius: 4,
  fontSize: "12.9px",
  fontWeight: 700,
  fontFamily: "inherit",
  color: "#FFFFFF",
  cursor: "pointer",
  flexShrink: 0,
};

const PRIMARY_DISABLED: React.CSSProperties = {
  ...PRIMARY,
  background: "#C5C5C5",
  cursor: "default",
};

/** Standard h57 footer container */
export function FooterBar({ children }: { children: React.ReactNode }) {
  return <div style={FOOTER}>{children}</div>;
}

/** Helper/description text — left side, flex:1, 10.1px grey */
export function FooterHelperText({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ flex: 1, fontSize: "10.1px", color: "#616161", lineHeight: "15px" }}>
      {children}
    </span>
  );
}

/** Count/status text — left side, flex:1, 10.1px grey */
export function FooterStatusText({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ flex: 1, fontSize: "10.1px", color: "#616161", fontFamily: "inherit" }}>
      {children}
    </span>
  );
}

/** Grey-border dismiss button — Cancel, Close, Back */
export function DismissBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="sl-fr-btn" onClick={onClick} style={DISMISS}>
      {label}
    </button>
  );
}

/** Blue primary action button */
export function PrimaryBtn({
  label,
  onClick,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      className={disabled ? undefined : "sl-fr-btn-primary"}
      onClick={onClick}
      disabled={disabled}
      style={disabled ? PRIMARY_DISABLED : PRIMARY}
    >
      {label}
    </button>
  );
}
