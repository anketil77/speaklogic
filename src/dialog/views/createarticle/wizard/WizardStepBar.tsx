// src/dialog/views/createarticle/wizard/WizardStepBar.tsx
//
// The 8-step progress indicator strip shown below the wizard header.
// Steps 1–2 are always "completed" (done in the template picker).
// Props: currentStep (3–8).

import React from "react";
import { WizardStepCheckIcon } from "@/dialog/components/Icons";
import { WIZARD_STEPS } from "./wizardTypes";

type StepStatus = "completed" | "active" | "pending";

function getStatus(stepNum: number, currentStep: number): StepStatus {
  if (stepNum < currentStep)  return "completed";
  if (stepNum === currentStep) return "active";
  return "pending";
}

interface Props {
  currentStep: number;
}

export function WizardStepBar({ currentStep }: Props) {
  return (
    <div
      style={{
        display:       "flex",
        flexDirection: "row",
        alignItems:    "center",
        padding:       "8px 14px",
        height:        33,
        background:    "#F5F5F5",
        flexShrink:    0,
        boxSizing:     "border-box",
      }}
    >
      {WIZARD_STEPS.map((step, idx) => (
        <React.Fragment key={step.stepNum}>
          {idx > 0 && <StepSep />}
          <StepItem
            stepNum={step.stepNum}
            label={step.label}
            status={getStatus(step.stepNum, currentStep)}
          />
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Internal sub-components ─────────────────────────────────────────────────

function StepSep() {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 3px" }}>
      <div style={{ width: 1, height: 1, background: "#E0E0E0", alignSelf: "stretch" }} />
    </div>
  );
}

interface StepItemProps {
  stepNum: number;
  label:   string;
  status:  StepStatus;
}

const CIRCLE_STYLE: Record<StepStatus, React.CSSProperties> = {
  completed: {
    background:   "#EBF3FC",
    border:       "2px solid #0078D4",
  },
  active: {
    background:   "#0078D4",
    border:       "2px solid #0078D4",
  },
  pending: {
    background:   "#FFFFFF",
    border:       "2px solid #C7C7C7",
  },
};

const LABEL_STYLE: Record<StepStatus, React.CSSProperties> = {
  completed: { fontWeight: 400, color: "#616161" },
  active:    { fontWeight: 700, color: "#0078D4" },
  pending:   { fontWeight: 400, color: "#616161" },
};

function StepItem({ stepNum, label, status }: StepItemProps) {
  return (
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 4, flexShrink: 0 }}>
      {/* Circle */}
      <div
        style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          width:          16,
          height:         16,
          borderRadius:   8,
          boxSizing:      "border-box",
          ...CIRCLE_STYLE[status],
        }}
      >
        {status === "completed" ? (
          <WizardStepCheckIcon />
        ) : (
          <span
            style={{
              fontFamily: "'Inter','Segoe UI',sans-serif",
              fontWeight:  700,
              fontSize:    8,
              lineHeight:  "10px",
              color:       status === "active" ? "#FFFFFF" : "#616161",
            }}
          >
            {stepNum}
          </span>
        )}
      </div>

      {/* Label */}
      <span
        style={{
          fontFamily: "'Inter','Segoe UI',sans-serif",
          fontSize:    status === "active" ? 8.9 : 8.6,
          lineHeight:  "11px",
          ...LABEL_STYLE[status],
        }}
      >
        {label}
      </span>
    </div>
  );
}
