// src/dialog/views/createarticle/wizard/SectionBox.tsx
//
// Bordered section card with a grey header bar used across all wizard steps.
// Spec: border: 1px solid #E0E0E0; border-radius: 6px
//       header: #F5F5F5 bg; title bold 10.7px; optional blue ? badge

import React from "react";

interface Props {
  title:       string;
  /** Show a blue circular "?" help badge on the right of the header. */
  showHelp?:   boolean;
  children:    React.ReactNode;
  /** Override body padding (default "11px"). */
  bodyPadding?: string;
  /** Pass height/flex style for the outer box. */
  style?:      React.CSSProperties;
}

export function SectionBox({
  title,
  showHelp = false,
  children,
  bodyPadding = "9px",
  style,
}: Props) {
  return (
    <div
      style={{
        boxSizing:    "border-box",
        display:      "flex",
        flexDirection: "column",
        alignItems:   "flex-start",
        border:       "1px solid #E0E0E0",
        borderRadius: 6,
        alignSelf:    "stretch",
        ...style,
      }}
    >
      {/* Header strip */}
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

        {showHelp && <HelpBadge />}
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

function HelpBadge() {
  return (
    <div
      style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        width:          13,
        height:         13,
        background:     "#0078D4",
        borderRadius:   "50%",
        flexShrink:     0,
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
