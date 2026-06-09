// src/dialog/views/createarticle/wizard/CustomTimePicker.tsx
//
// Lightweight time picker that renders its dropdown with position:absolute
// directly below the trigger — safe inside Office.js iframes (no portal).

import React, { useCallback, useEffect, useRef, useState } from "react";

// ─── Time slot generation ────────────────────────────────────────────────────

function buildSlots(): string[] {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const period = h < 12 ? "AM" : "PM";
      const hour   = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const min    = m === 0 ? "00" : "30";
      slots.push(`${hour}:${min} ${period}`);
    }
  }
  return slots;
}

const TIME_SLOTS = buildSlots();

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  value:       string;
  onChange:    (v: string) => void;
  placeholder?: string;
  style?:       React.CSSProperties;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CustomTimePicker({ value, onChange, placeholder = "Select time...", style }: Props) {
  const [open, setOpen]     = useState(false);
  const rootRef             = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return undefined;
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSelect = useCallback((slot: string): void => {
    onChange(slot);
    setOpen(false);
  }, [onChange]);

  return (
    <div ref={rootRef} style={{ position: "relative", flex: 1, minWidth: 0, ...style }}>

      {/* Trigger input */}
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          height:         30,
          padding:        "0 8px 0 9px",
          background:     "#FFFFFF",
          border:         "1px solid #C7C7C7",
          borderRadius:   4,
          cursor:         "pointer",
          boxSizing:      "border-box",
          userSelect:     "none",
          fontFamily:     "'Inter','Segoe UI',sans-serif",
          fontSize:       11.4,
          color:          value ? "#1B1B1B" : "#9E9E9E",
        }}
      >
        <span>{value || placeholder}</span>
        <svg
          width="10" height="6" viewBox="0 0 10 6" fill="none"
          style={{ flexShrink: 0, marginLeft: 4, transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "none" }}
        >
          <path d="M1 1L5 5L9 1" stroke="#616161" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Dropdown — position:absolute, directly below trigger, no portal */}
      {open && (
        <div
          style={{
            position:        "absolute",
            top:             "calc(100% + 2px)",
            left:            0,
            right:           0,
            zIndex:          300,
            background:      "#FFFFFF",
            border:          "1px solid #D1D1D1",
            borderRadius:    4,
            boxShadow:       "0 4px 12px rgba(0,0,0,0.12)",
            maxHeight:       160,
            overflowY:       "auto",
          }}
        >
          {TIME_SLOTS.map((slot) => (
            <div
              key={slot}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(slot); }}
              style={{
                padding:    "5px 10px",
                fontSize:   11.4,
                fontFamily: "'Inter','Segoe UI',sans-serif",
                color:      "#1B1B1B",
                cursor:     "pointer",
                background: slot === value ? "#EBF3FC" : "transparent",
                fontWeight: slot === value ? 600 : 400,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = slot === value ? "#EBF3FC" : "#F5F5F5"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = slot === value ? "#EBF3FC" : "transparent"; }}
            >
              {slot}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
