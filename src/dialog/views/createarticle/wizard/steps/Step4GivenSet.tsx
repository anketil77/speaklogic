// src/dialog/views/createarticle/wizard/steps/Step4GivenSet.tsx
//
// Wizard Step 4 — "Given Set" step.
// Sections:
//   1. About The Given Set — Yes/No toggle (isGivenSet)
//   2. About People Information Directed To — Location + Consideration inputs
// Footer hint: "Describe the given set and target audience"

import React, { useCallback } from "react";
import { SectionBox }   from "../SectionBox";
import { FormInput }    from "../FormInput";
import { WizardFooter } from "../WizardFooter";
import type { StepProps } from "../wizardTypes";

export function Step4GivenSet({ data, onChange, onNext, onBack, onCancel }: StepProps) {
  const handleToggle = useCallback(
    (val: boolean) => onChange({ isGivenSet: val }),
    [onChange],
  );

  return (
    <div
      style={{
        display:       "flex",
        flexDirection: "column",
        flex:          1,
        minHeight:     0,
        overflow:      "hidden",
      }}
    >
      {/* Scrollable body */}
      <div
        style={{
          flex:          1,
          overflowY:     "auto",
          minHeight:     0,
          padding:       "14px 16px 8px",
          display:       "flex",
          flexDirection: "column",
          gap:           12,
        }}
      >
        {/* ── About The Given Set ── */}
        <SectionBox title="About The Given Set" showHelp>
          <div
            style={{
              display:        "flex",
              flexDirection:  "row",
              alignItems:     "center",
              justifyContent: "space-between",
              width:          "100%",
            }}
          >
            <span
              style={{
                fontFamily: "'Inter','Segoe UI',sans-serif",
                fontWeight:  400,
                fontSize:    10.7,
                lineHeight:  "13px",
                color:       "#616161",
              }}
            >
              Provider uses the given set of information
            </span>

            <ToggleGroup
              value={data.isGivenSet}
              onChange={handleToggle}
            />
          </div>
        </SectionBox>

        {/* ── About People Information Directed To ── */}
        <SectionBox title="About People Information Directed To" showHelp>
          <FormInput
            placeholder="People Location"
            value={data.peopleLocation}
            onChange={(v) => onChange({ peopleLocation: v })}
          />
          <FormInput
            placeholder="Consideration"
            value={data.consideration}
            onChange={(v) => onChange({ consideration: v })}
          />
        </SectionBox>
      </div>

      {/* Footer */}
      <WizardFooter
        hintText="Describe the given set and target audience"
        onBack={onBack}
        onCancel={onCancel}
        onNext={onNext}
      />
    </div>
  );
}

// ─── Yes / No toggle pair ────────────────────────────────────────────────────

interface ToggleGroupProps {
  value:    boolean;
  onChange: (v: boolean) => void;
}

function ToggleGroup({ value, onChange }: ToggleGroupProps) {
  return (
    <div style={{ display: "flex", flexDirection: "row", gap: 6 }}>
      <ToggleBtn label="Yes" active={value}  onClick={() => onChange(true)}  />
      <ToggleBtn label="No"  active={!value} onClick={() => onChange(false)} />
    </div>
  );
}

interface ToggleBtnProps {
  label:   string;
  active:  boolean;
  onClick: () => void;
}

function ToggleBtn({ label, active, onClick }: ToggleBtnProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        width:          42,
        height:         24,
        background:     active ? "#0078D4" : "#FFFFFF",
        border:         `1px solid ${active ? "#0078D4" : "#C7C7C7"}`,
        borderRadius:   4,
        cursor:         "pointer",
        fontFamily:     "'Inter','Segoe UI',sans-serif",
        fontWeight:     700,
        fontSize:       10.5,
        lineHeight:     "13px",
        color:          active ? "#FFFFFF" : "#616161",
        transition:     "background 0.1s, border-color 0.1s",
      }}
    >
      {label}
    </button>
  );
}
