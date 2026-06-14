// src/dialog/components/SetDerivedFromPicker.tsx
// Multi-select checkbox dropdown for the "Set Derived From" field.
// The first 7 sets combine freely; "The Overall Set Combined" (last) is exclusive —
// selecting it clears the others, and selecting any other clears it.
// Value is stored/returned as a comma-joined string of the selected labels.

import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";

export const SET_DERIVED_OPTIONS = [
  "The Given Set of Communication Principle",
  "The Given Set of Information Principle",
  "The Given Set of Instrumentation Principle",
  "The Given Set of Marketing Principle",
  "The Given Set of Exchange Principle",
  "The Given Set of Gaming Principle",
  "The Given Set of Work Principle",
  "The Overall Set Combined",
];

const EXCLUSIVE = "The Overall Set Combined";

const C = {
  blue: "#0078D4",
  grey11: "#1B1B1B",
  grey38: "#616161",
  grey78: "#C7C7C7",
  grey88: "#E0E0E0",
  grey96: "#F5F5F5",
  white: "#FFFFFF",
} as const;

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SetDerivedFromPicker({ value, onChange, placeholder = "— Select a set —" }: Props) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelPos, setPanelPos] = useState({
    openUp: false,
    top: 0,
    bottom: 0,
    left: 0,
    width: 0,
    maxHeight: 280,
  });

  const selected = value ? value.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const toggle = useCallback(
    (opt: string) => {
      let next: string[];
      if (opt === EXCLUSIVE) {
        next = selected.includes(EXCLUSIVE) ? [] : [EXCLUSIVE];
      } else if (selected.includes(opt)) {
        next = selected.filter((o) => o !== opt);
      } else {
        next = [...selected.filter((o) => o !== EXCLUSIVE), opt];
      }
      // keep canonical order so display + storage are stable
      const ordered = SET_DERIVED_OPTIONS.filter((o) => next.includes(o));
      onChange(ordered.join(", "));
    },
    [selected, onChange]
  );

  // Position the portaled panel; flip above the trigger when there isn't enough
  // room below (the host dialog window is short and this field sits low), and
  // clamp the height to the available space so the list always scrolls and every
  // item — including the last "Overall Set Combined" — stays reachable.
  useEffect(() => {
    if (!open) return;
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const margin = 8;
    // Keep the panel compact (~5 rows) and let it scroll internally rather than
    // growing to cover the whole form. Flip up only if even this won't fit below.
    const desired = 196;
    const spaceBelow = window.innerHeight - r.bottom - margin;
    const spaceAbove = r.top - margin;
    const openUp = spaceBelow < Math.min(desired, spaceAbove) && spaceAbove > spaceBelow;
    setPanelPos({
      openUp,
      top: r.bottom + 4,
      bottom: window.innerHeight - r.top + 4,
      left: r.left,
      width: r.width,
      maxHeight: Math.max(120, Math.min(desired, openUp ? spaceAbove : spaceBelow)),
    });
  }, [open]);

  // Outside-click + Escape close.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node)) return;
      if (panelRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          boxSizing: "border-box",
          width: "100%",
          height: 32,
          display: "flex",
          alignItems: "center",
          gap: 8,
          border: `1px solid ${C.grey78}`,
          borderRadius: 4,
          padding: "0 10px",
          fontSize: 12.2,
          fontFamily: "inherit",
          background: C.white,
          cursor: "pointer",
          textAlign: "left",
          outline: "none",
        }}
      >
        <span
          style={{
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: selected.length ? C.grey11 : C.grey38,
          }}
        >
          {selected.length ? selected.join(", ") : placeholder}
        </span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ flexShrink: 0 }}>
          <path d="M1 1L5 5L9 1" stroke={C.grey38} strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </button>

      {open &&
        ReactDOM.createPortal(
          <div
            ref={panelRef}
            role="menu"
            style={{
              position: "fixed",
              ...(panelPos.openUp ? { bottom: panelPos.bottom } : { top: panelPos.top }),
              left: panelPos.left,
              width: panelPos.width,
              maxHeight: panelPos.maxHeight,
              overflowY: "auto",
              background: C.white,
              border: `1px solid ${C.grey88}`,
              borderRadius: 4,
              boxShadow: "0px 4px 16px rgba(0,0,0,0.12)",
              zIndex: 240,
              padding: "4px 0",
              fontFamily: "'Inter', 'Segoe UI', sans-serif",
            }}
          >
            {SET_DERIVED_OPTIONS.map((opt) => {
              const checked = selected.includes(opt);
              const isExclusive = opt === EXCLUSIVE;
              return (
                <React.Fragment key={opt}>
                  {isExclusive && <div style={{ height: 1, background: C.grey88, margin: "4px 0" }} />}
                  <button
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={checked}
                    onClick={() => toggle(opt)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 12px",
                      background: "transparent",
                      border: "none",
                      fontSize: 12.2,
                      fontFamily: "inherit",
                      cursor: "pointer",
                      color: C.grey11,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = C.grey96; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <span
                      style={{
                        width: 15,
                        height: 15,
                        flexShrink: 0,
                        borderRadius: 3,
                        border: `1.5px solid ${checked ? C.blue : C.grey78}`,
                        background: checked ? C.blue : C.white,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {checked && (
                        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                          <path d="M1 3.5L3.5 6L8 1" stroke={C.white} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span>{opt}</span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}
