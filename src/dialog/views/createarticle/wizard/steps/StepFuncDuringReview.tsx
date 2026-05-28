// StepFuncDuringReview — Product Review: function during review + solved status.
// C# ref: wzProductReviewFuncExecuted page

import React from "react";
import { SectionBox }   from "../SectionBox";
import { WizardFooter } from "../WizardFooter";
import type { StepProps } from "../wizardTypes";

export function StepFuncDuringReview({ data, onChange, onNext, onBack, onCancel }: StepProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "10px 14px 6px", display: "flex", flexDirection: "column", gap: 9 }}>

        <SectionBox title="Function executed during review" showHelp>
          <textarea
            rows={6}
            placeholder="Describe the function executed during the product review"
            value={data.functionExecutedDuringReview}
            onChange={(e) => onChange({ functionExecutedDuringReview: e.target.value })}
            style={TEXTAREA_STYLE}
          />
        </SectionBox>

        <SectionBox title="Problem solved by product?" showHelp>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
            <span style={{ fontSize: 11.1, color: "#616161" }}>Is the identified problem solved by this product?</span>
            <label style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer", fontSize: 11.1, color: "#1B1B1B" }}>
              <input
                type="radio"
                checked={data.isSolvedProblem === true}
                onChange={() => onChange({ isSolvedProblem: true })}
              />
              Yes
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer", fontSize: 11.1, color: "#1B1B1B" }}>
              <input
                type="radio"
                checked={data.isSolvedProblem === false}
                onChange={() => onChange({ isSolvedProblem: false })}
              />
              No
            </label>
          </div>
        </SectionBox>
      </div>
      <WizardFooter hintText="Describe function and problem status" onBack={onBack} onCancel={onCancel} onNext={onNext} />
    </div>
  );
}

const TEXTAREA_STYLE: React.CSSProperties = {
  boxSizing: "border-box", width: "100%", padding: "7px 9px",
  background: "#FFFFFF", border: "1px solid #C7C7C7", borderRadius: 4,
  fontFamily: "'Inter','Segoe UI',sans-serif", fontWeight: 400, fontSize: 11.1,
  lineHeight: "18px", color: "#1B1B1B", outline: "none", resize: "vertical", minHeight: 78,
};
