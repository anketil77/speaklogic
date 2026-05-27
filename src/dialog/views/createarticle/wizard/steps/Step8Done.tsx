// src/dialog/views/createarticle/wizard/steps/Step8Done.tsx
//
// Wizard Step 8 — "Done" step (success screen).
// Shows:
//   - Green circle with checkmark icon
//   - "Article Saved Successfully" title
//   - Subtitle with category/template name
//   - Blue "Close" button (triggers onClose)
// No Back / Cancel / Next — only Close.

import React from "react";
import { WizardDoneCheckIcon } from "@/dialog/components/Icons";
import type { WizardData } from "../wizardTypes";

interface Props {
  data:    WizardData;
  onClose: () => void;
}

export function Step8Done({ data, onClose }: Props) {
  return (
    <div
      style={{
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        flex:           1,
        padding:        "32px 24px",
        gap:            16,
        textAlign:      "center",
      }}
    >
      {/* Green success circle */}
      <div
        style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          width:          64,
          height:         64,
          background:     "#E6F4EA",
          borderRadius:   "50%",
          flexShrink:     0,
        }}
      >
        <WizardDoneCheckIcon />
      </div>

      {/* Title */}
      <span
        style={{
          fontFamily: "'Inter','Segoe UI',sans-serif",
          fontWeight:  700,
          fontSize:    14,
          lineHeight:  "18px",
          color:       "#1B1B1B",
        }}
      >
        Article Saved Successfully
      </span>

      {/* Subtitle */}
      <span
        style={{
          fontFamily: "'Inter','Segoe UI',sans-serif",
          fontWeight:  400,
          fontSize:    11,
          lineHeight:  "16px",
          color:       "#616161",
          maxWidth:    320,
        }}
      >
        Your article
        {data.articleTitle ? ` "${data.articleTitle}"` : ""}
        {data.category ? ` in the ${data.category} category` : ""}
        {" "}has been saved. You can view it in the Articles list.
      </span>

      {/* Close button */}
      <CloseBtn onClick={onClose} />
    </div>
  );
}

// ─── Close button ─────────────────────────────────────────────────────────────

function CloseBtn({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        width:          120,
        height:         32,
        background:     hov ? "#106EBE" : "#0078D4",
        border:         "none",
        borderRadius:   4,
        cursor:         "pointer",
        fontFamily:     "'Inter','Segoe UI',sans-serif",
        fontWeight:     700,
        fontSize:       11,
        lineHeight:     "13px",
        color:          "#FFFFFF",
        marginTop:      8,
        transition:     "background 0.1s",
      }}
    >
      Close
    </button>
  );
}
