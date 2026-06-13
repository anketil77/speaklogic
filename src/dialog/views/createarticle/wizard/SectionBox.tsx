// src/dialog/views/createarticle/wizard/SectionBox.tsx
//
// Bordered section card with a grey header bar used across all wizard steps.
// Spec: border: 1px solid #E0E0E0; border-radius: 6px
//       header: #F5F5F5 bg; title bold 10.7px; optional blue ? badge
//       helpText: clicking ? shows a floating popup with the message.

import React, { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  title:        string;
  /** Show a blue circular "?" help badge on the right of the header. */
  showHelp?:    boolean;
  /** Text shown in the popup when the ? badge is clicked. */
  helpText?:    string;
  children:     React.ReactNode;
  /** Override body padding (default "9px"). */
  bodyPadding?: string;
  /** Pass height/flex style for the outer box. */
  style?:       React.CSSProperties;
}

export function SectionBox({
  title,
  showHelp = false,
  helpText,
  children,
  bodyPadding = "9px",
  style,
}: Props) {
  const [open, setOpen] = useState(false);
  const containerRef   = useRef<HTMLDivElement>(null);

  const toggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen((v) => !v);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div
      ref={containerRef}
      style={{
        boxSizing:     "border-box",
        display:       "flex",
        flexDirection: "column",
        alignItems:    "flex-start",
        border:        "1px solid #E0E0E0",
        borderRadius:  6,
        alignSelf:     "stretch",
        ...style,
      }}
    >
      {/* Header strip — position:relative so the popup anchors to the badge */}
      <div
        style={{
          display:        "flex",
          flexDirection:  "row",
          justifyContent: "space-between",
          alignItems:     "center",
          padding:        "5px 11px",
          width:          "100%",
          minHeight:      25,
          background:     "#F5F5F5",
          boxSizing:      "border-box",
          flexShrink:     0,
          position:       "relative",
        }}
      >
        <span
          style={{
            fontFamily: "'Inter','Segoe UI',sans-serif",
            fontWeight:  700,
            fontSize:    10.7,
            lineHeight:  "13px",
            color:       "#1B1B1B",
          }}
        >
          {title}
        </span>

        {showHelp && (
          <HelpBadge
            active={open}
            onClick={helpText ? toggle : undefined}
          />
        )}

        {/* Help popup — anchored just below the header via top:100% */}
        {open && helpText && (
          <div
            style={{
              position:     "absolute",
              top:          "100%",
              right:        0,
              zIndex:       200,
              width:        "min(310px, 90vw)",
              background:   "#FFFFFF",
              border:       "1px solid #D0D0D0",
              borderRadius: 6,
              boxShadow:    "0px 4px 16px rgba(0,0,0,0.14)",
              padding:      "10px 12px 12px",
              boxSizing:    "border-box",
            }}
          >
            <div
              style={{
                display:        "flex",
                justifyContent: "space-between",
                alignItems:     "center",
                marginBottom:   7,
              }}
            >
              <span
                style={{
                  fontFamily:    "'Inter','Segoe UI',sans-serif",
                  fontWeight:    700,
                  fontSize:      10.4,
                  color:         "#1B1B1B",
                  letterSpacing: 0.2,
                }}
              >
                Message
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); setOpen(false); }}
                style={{
                  background: "none",
                  border:     "none",
                  cursor:     "pointer",
                  padding:    "0 2px",
                  lineHeight: 1,
                  color:      "#616161",
                  fontSize:   13,
                  fontWeight: 700,
                }}
                aria-label="Close help"
              >
                ×
              </button>
            </div>
            <p
              style={{
                margin:     0,
                fontFamily: "'Inter','Segoe UI',sans-serif",
                fontWeight:  400,
                fontSize:    11,
                lineHeight:  "16px",
                color:       "#1B1B1B",
              }}
            >
              {helpText}
            </p>
          </div>
        )}
      </div>

      {/* Body */}
      <div
        style={{
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "flex-start",
          padding:        bodyPadding,
          gap:            9,
          width:          "100%",
          boxSizing:      "border-box",
          flex:           1,
        }}
      >
        {children}
      </div>
    </div>
  );
}

interface HelpBadgeProps {
  active:   boolean;
  onClick?: (e: React.MouseEvent) => void;
}

function HelpBadge({ active, onClick }: HelpBadgeProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? "Show help" : undefined}
      style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        width:          13,
        height:         13,
        background:     active ? "#005A9E" : "#0078D4",
        borderRadius:   "50%",
        flexShrink:     0,
        cursor:         onClick ? "pointer" : "default",
        transition:     "background 0.1s",
      }}
    >
      <span
        style={{
          fontFamily: "'Inter','Segoe UI',sans-serif",
          fontWeight:  700,
          fontSize:    8,
          lineHeight:  "10px",
          color:       "#FFFFFF",
        }}
      >
        ?
      </span>
    </div>
  );
}
