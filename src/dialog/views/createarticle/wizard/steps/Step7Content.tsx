// src/dialog/views/createarticle/wizard/steps/Step7Content.tsx
//
// Wizard Step 7 — "Content" step (tallest at ~647px in Figma).
// Three bordered SectionBoxes with multi-line textareas:
//   1. Mother Nature Considerations
//   2. Negative Function
//   3. Problem Details
// Footer hint: "Describe the article content in detail"
// Finish button (onNext with nextLabel="Finish") triggers SAVE_ARTICLE_WIZARD.

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
        {/* ── Mother Nature Considerations ── */}
        <SectionBox title="Mother Nature Considerations" showHelp>
          <ContentTextArea
            placeholder="Describe mother nature considerations relevant to this event…"
            value={data.motherNatureConsiderations}
            onChange={(v) => onChange({ motherNatureConsiderations: v })}
            rows={4}
          />
        </SectionBox>

        {/* ── Negative Function ── */}
        <SectionBox title="Negative Function" showHelp>
          <ContentTextArea
            placeholder="Describe any negative functions or outcomes…"
            value={data.negativeFunction}
            onChange={(v) => onChange({ negativeFunction: v })}
            rows={4}
          />
        </SectionBox>

        {/* ── Problem Details ── */}
        <SectionBox title="Problem Details" showHelp>
          <ContentTextArea
            placeholder="Describe the core problem in detail…"
            value={data.problemDetails}
            onChange={(v) => onChange({ problemDetails: v })}
            rows={4}
          />
        </SectionBox>
      </div>

      {/* Footer — last step so label is "Finish" */}
      <WizardFooter
        hintText="Describe the article content in detail"
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
        fontSize:     11.4,
        lineHeight:   "16px",
        color:        "#1B1B1B",
        outline:      "none",
        resize:       "vertical",
        minHeight:    72,
      }}
    />
  );
}
