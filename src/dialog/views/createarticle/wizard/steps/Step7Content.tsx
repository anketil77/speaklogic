// src/dialog/views/createarticle/wizard/steps/Step7Content.tsx
//
// Wizard Step 7 — "Content" step (Template 2 Non-Sport & Game).
// Four bordered SectionBoxes with resizable textareas:
//   1. Mother nature into consideration  — textarea + "Add verification" full-width button
//   2. Negative function executed from event
//   3. Problem developed from negative function execution
//   4. Relationship if any between information existed before event
//      & negative function executed from event  (wrapping 2-line header)
// Footer hint: "Add content details"
// Finish button triggers SAVE_ARTICLE_WIZARD via onNext.

import React from "react";
import { SectionBox }   from "../SectionBox";
import { WizardFooter } from "../WizardFooter";
import type { StepProps } from "../wizardTypes";

export function Step7Content({ data, onChange, onNext, onBack, onCancel }: StepProps) {
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
        {/* ── 1. Mother nature into consideration ── */}
        <SectionBox title="Mother nature into consideration" showHelp>
          <ContentTextArea
            placeholder="Add considerations"
            value={data.motherNatureConsiderations}
            onChange={(v) => onChange({ motherNatureConsiderations: v })}
          />
          {/* Add verification full-width button */}
          <button
            onClick={() => {/* placeholder — future: open verification sub-dialog */}}
            style={{
              boxSizing:      "border-box",
              display:        "flex",
              flexDirection:  "row",
              justifyContent: "center",
              alignItems:     "center",
              padding:        "6px",
              gap:            5,
              width:          "100%",
              height:         27,
              background:     "#F5F5F5",
              border:         "1px solid #C7C7C7",
              borderRadius:   4,
              cursor:         "pointer",
              fontFamily:     "'Inter','Segoe UI',sans-serif",
              fontWeight:     700,
              fontSize:       10.8,
              lineHeight:     "13px",
              color:          "#1B1B1B",
            }}
          >
            {/* + icon */}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M5 1v8M1 5h8" stroke="#1B1B1B" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            Add verification
          </button>
        </SectionBox>

        {/* ── 2. Negative function executed from event ── */}
        <SectionBox title="Negative function executed from event" showHelp>
          <ContentTextArea
            placeholder="Add negative function details"
            value={data.negativeFunction}
            onChange={(v) => onChange({ negativeFunction: v })}
          />
        </SectionBox>

        {/* ── 3. Problem developed from negative function execution ── */}
        <SectionBox title="Problem developed from negative function execution" showHelp>
          <ContentTextArea
            placeholder="Add problem details"
            value={data.problemDetails}
            onChange={(v) => onChange({ problemDetails: v })}
          />
        </SectionBox>

        {/* ── 4. Relationship (2-line header) ── */}
        <SectionBox
          title="Relationship if any between information existed before event & negative function executed from event"
          showHelp
        >
          <ContentTextArea
            placeholder="Add relationship details"
            value={data.relationshipDetails}
            onChange={(v) => onChange({ relationshipDetails: v })}
          />
        </SectionBox>
      </div>

      {/* Footer — last step so label is "Finish" */}
      <WizardFooter
        hintText="Add content details"
        onBack={onBack}
        onCancel={onCancel}
        onNext={onNext}
        nextLabel="Finish"
      />
    </div>
  );
}

// ─── Multi-line textarea ──────────────────────────────────────────────────────

interface ContentTextAreaProps {
  placeholder: string;
  value:       string;
  onChange:    (v: string) => void;
  rows?:       number;
}

function ContentTextArea({ placeholder, value, onChange, rows = 4 }: ContentTextAreaProps) {
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      style={{
        boxSizing:    "border-box",
        width:        "100%",
        padding:      "7px 9px",
        background:   "#FFFFFF",
        border:       "1px solid #C7C7C7",
        borderRadius: 4,
        fontFamily:   "'Inter','Segoe UI',sans-serif",
        fontWeight:   400,
        fontSize:     11.1,
        lineHeight:   "18px",
        color:        "#1B1B1B",
        outline:      "none",
        resize:       "vertical",
        minHeight:    78,
      }}
    />
  );
}
