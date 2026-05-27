// src/dialog/views/createarticle/wizard/WizardFooter.tsx
//
// Shared footer strip for every wizard step.
// Shows a grey hint text on the left and Back / Cancel / Next (or Finish) on the right.
// Steps 3–7: Next button. Step 7 last: Finish button. Step 3 back returns to picker.

import React, { useState } from "react";
import { WizardBackChevron, WizardNextChevron } from "@/dialog/components/Icons";

interface Props {
  hintText:        string;
  onBack:          () => void;
  onCancel:        () => void;
  onNext:          () => void;
  nextLabel?:      string;   // defaults to "Next"
  showBack?:       boolean;  // defaults to true
  showCancel?:     boolean;  // defaults to true
  nextDisabled?:   boolean;  // defaults to false
}

export function WizardFooter({
  hintText,
  onBack,
  onCancel,
  onNext,
  nextLabel  = "Next",
  showBack   = true,
  showCancel = true,
  nextDisabled = false,
}: Props) {
  return (
    <div
      style={{
        display:        "flex",
        flexDirection:  "row",
        justifyContent: "space-between",
        alignItems:     "center",
        padding:        "10px 16px",
        height:         47,
        background:     "#FFFFFF",
        borderTop:      "1px solid #E0E0E0",
        flexShrink:     0,
        boxSizing:      "border-box",
      }}
    >
      {/* Hint text */}
      <span
        style={{
          fontFamily: "'Inter','Segoe UI',sans-serif",
          fontWeight:  400,
          fontSize:    9.4,
          lineHeight:  "11px",
          color:       "#616161",
          flex:        1,
        }}
      >
        {hintText}
      </span>

      {/* Button group */}
      <div style={{ display: "flex", flexDirection: "row", gap: 6 }}>
        {showBack   && <BackBtn   onClick={onBack}   />}
        {showCancel && <CancelBtn onClick={onCancel} />}
        <NextBtn label={nextLabel} onClick={onNext} disabled={nextDisabled} />
      </div>
    </div>
  );
}

// ─── Button sub-components ────────────────────────────────────────────────────

function BackBtn({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:        "flex",
        flexDirection:  "row",
        alignItems:     "center",
        padding:        "0 13px",
        gap:            4,
        width:          67,
        height:         26,
        background:     hov ? "#F0F0F0" : "#FFFFFF",
        border:         "1px solid #C7C7C7",
        borderRadius:   4,
        cursor:         "pointer",
        fontFamily:     "'Inter','Segoe UI',sans-serif",
        fontWeight:     700,
        fontSize:       11,
        lineHeight:     "13px",
        color:          "#1B1B1B",
        boxSizing:      "border-box",
        transition:     "background 0.1s",
      }}
    >
      <WizardBackChevron />
      Back
    </button>
  );
}

function CancelBtn({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        width:          66,
        height:         26,
        background:     hov ? "#F0F0F0" : "#FFFFFF",
        border:         "1px solid #C7C7C7",
        borderRadius:   4,
        cursor:         "pointer",
        fontFamily:     "'Inter','Segoe UI',sans-serif",
        fontWeight:     700,
        fontSize:       11,
        lineHeight:     "13px",
        color:          "#1B1B1B",
        boxSizing:      "border-box",
        transition:     "background 0.1s",
      }}
    >
      Cancel
    </button>
  );
}

function NextBtn({
  label,
  onClick,
  disabled,
}: {
  label:    string;
  onClick:  () => void;
  disabled: boolean;
}) {
  const [hov, setHov] = useState(false);
  const bg = disabled ? "#B0B0B0" : hov ? "#106EBE" : "#0078D4";
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => !disabled && setHov(true)}
      onMouseLeave={() => setHov(false)}
      disabled={disabled}
      style={{
        display:        "flex",
        flexDirection:  "row",
        alignItems:     "center",
        padding:        "0 13px",
        gap:            4,
        height:         26,
        minWidth:       65,
        background:     bg,
        border:         "none",
        borderRadius:   4,
        cursor:         disabled ? "default" : "pointer",
        fontFamily:     "'Inter','Segoe UI',sans-serif",
        fontWeight:     700,
        fontSize:       10.8,
        lineHeight:     "13px",
        color:          "#FFFFFF",
        boxSizing:      "border-box",
        transition:     "background 0.1s",
      }}
    >
      {label}
      {label !== "Finish" && <WizardNextChevron />}
    </button>
  );
}
