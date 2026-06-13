// src/dialog/views/createarticle/wizard/steps/Step4GivenSet.tsx
//
// Wizard Step 4 — "Given Set" step (Template 2 Non-Sport & Game).
// Sections:
//   1. About The Given Set — pill-style Yes/No toggle + Article Basis Reference input
//   2. About People Information Directed To — People Location + Consideration inputs
// Footer hint: "Fill in given set and people information"

import React, { useCallback } from "react";
import { SectionBox }   from "../SectionBox";
import { FormInput }    from "../FormInput";
import { WizardFooter } from "../WizardFooter";
import type { StepProps } from "../wizardTypes";

export function Step4GivenSet({ data, onChange, onNext, onBack, onCancel }: StepProps) {
  const handleToggle = useCallback(
    () => onChange({ isGivenSet: !data.isGivenSet }),
    [onChange, data.isGivenSet],
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
          padding:       "10px 14px 6px",
          display:       "flex",
          flexDirection: "column",
          gap:           9,
        }}
      >
        {/* ── About The Given Set ── */}
        <SectionBox
          title="About The Given Set"
          showHelp
          helpText="Specify whether the information provider uses The Given Set to provide the information. The Given Set includes principles that are used to provide information. Also identify the basis of that information. The basis of the information is related to the principles used by the information provider to provide the information."
        >
          {/* Toggle row */}
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
                fontSize:    11.1,
                lineHeight:  "17px",
                color:       "#1B1B1B",
                flex:        1,
                paddingRight: 8,
              }}
            >
              Does provider use The Given Set to provide this information?
            </span>

            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 5, flexShrink: 0 }}>
              <span
                style={{
                  fontFamily: "'Inter','Segoe UI',sans-serif",
                  fontWeight:  700,
                  fontSize:    11,
                  lineHeight:  "13px",
                  color:       "#616161",
                }}
              >
                {data.isGivenSet ? "Yes" : "No"}
              </span>

              {/* Pill toggle */}
              <button
                onClick={handleToggle}
                aria-pressed={data.isGivenSet}
                style={{
                  display:        "flex",
                  flexDirection:  "column",
                  alignItems:     "flex-end",
                  padding:        data.isGivenSet ? "3px 3px 3px 17px" : "3px 17px 3px 3px",
                  width:          32,
                  height:         18,
                  background:     data.isGivenSet ? "#0078D4" : "#C7C7C7",
                  borderRadius:   18,
                  border:         "none",
                  cursor:         "pointer",
                  transition:     "background 0.15s, padding 0.15s",
                  flexShrink:     0,
                }}
              >
                <div
                  style={{
                    width:        12,
                    height:       12,
                    background:   "#FFFFFF",
                    borderRadius: 6,
                    flexShrink:   0,
                  }}
                />
              </button>
            </div>
          </div>

          {/* Article Basis Reference */}
          <div
            style={{
              display:       "flex",
              flexDirection: "column",
              gap:           4,
              width:         "100%",
              paddingTop:    4,
            }}
          >
            <label
              style={{
                fontFamily: "'Inter','Segoe UI',sans-serif",
                fontWeight:  700,
                fontSize:    9.8,
                lineHeight:  "12px",
                color:       "#1B1B1B",
              }}
            >
              Article Basis Reference
            </label>
            <FormInput
              placeholder="Enter reference number"
              value={data.articleBasisReference}
              onChange={(v) => onChange({ articleBasisReference: v })}
            />
          </div>
        </SectionBox>

        {/* ── About People Information Directed To ── */}
        <SectionBox
          title="About People Information Directed To"
          showHelp
          helpText="Specify the location of the people the information directed to. For example, the information can be directed to people in specific state, where it can be emphasized to people in a city. The information can be directed to people in a city, where the consideration can be people in a specific neighborhood."
        >
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
        hintText="Fill in given set and people information"
        onBack={onBack}
        onCancel={onCancel}
        onNext={onNext}
      />
    </div>
  );
}
