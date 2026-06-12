// StepFuncDuringReview — Product Review: function during review + solved status.
// C# ref: wzProductReviewFuncExecuted page

import React from "react";
import { SectionBox }   from "../SectionBox";
import { WizardFooter } from "../WizardFooter";
import { RichField }    from "../RichField";
import type { StepProps } from "../wizardTypes";

export function StepFuncDuringReview({ data, onChange, onNext, onBack, onCancel }: StepProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "10px 14px 6px", display: "flex", flexDirection: "column", gap: 9 }}>

        <SectionBox title="Function executed during review" showHelp>
          <RichField
            placeholder="Describe the function executed during the product review"
            value={data.functionExecutedDuringReview}
            onChange={(v) => onChange({ functionExecutedDuringReview: v })}
            minHeight={100}
          />
        </SectionBox>

        <SectionBox title="Problem solved by product?" showHelp>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
            <span style={{ fontSize: 11.1, color: "#616161", flex: 1 }}>
              Is the identified problem solved by this product?
            </span>
            <Toggle
              value={data.isSolvedProblem}
              onChange={(v) => onChange({ isSolvedProblem: v })}
            />
            <span style={{ fontSize: 11.1, color: data.isSolvedProblem ? "#0078D4" : "#616161", fontWeight: 600, minWidth: 28 }}>
              {data.isSolvedProblem ? "Yes" : "No"}
            </span>
          </div>
        </SectionBox>
      </div>
      <WizardFooter hintText="Describe function and problem status" onBack={onBack} onCancel={onCancel} onNext={onNext} />
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        position: "relative", width: 32, height: 18, borderRadius: 18,
        background: value ? "#0078D4" : "#C7C7C7", cursor: "pointer", flexShrink: 0, transition: "background 0.15s",
      }}
    >
      <div style={{
        position: "absolute", top: 2, left: value ? 14 : 2, width: 14, height: 14,
        borderRadius: 14, background: "#FFFFFF", transition: "left 0.15s",
      }} />
    </div>
  );
}

