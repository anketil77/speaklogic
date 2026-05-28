// StepPrePostObs — Sport Template 1: pre/post event observations.
// C# ref: wzPrePostObservation page — preEventObservation + postEventObservation

import React from "react";
import { SectionBox }   from "../SectionBox";
import { WizardFooter } from "../WizardFooter";
import type { StepProps } from "../wizardTypes";

export function StepPrePostObs({ data, onChange, onNext, onBack, onCancel }: StepProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "10px 14px 6px", display: "flex", flexDirection: "column", gap: 9 }}>
        <SectionBox title="Pre-event observation" showHelp>
          <textarea
            rows={5}
            placeholder="Describe observations before the event"
            value={data.preEventObservation}
            onChange={(e) => onChange({ preEventObservation: e.target.value })}
            style={TEXTAREA_STYLE}
          />
        </SectionBox>
        <SectionBox title="Post-event observation" showHelp>
          <textarea
            rows={5}
            placeholder="Describe observations after the event"
            value={data.postEventObservation}
            onChange={(e) => onChange({ postEventObservation: e.target.value })}
            style={TEXTAREA_STYLE}
          />
        </SectionBox>
      </div>
      <WizardFooter hintText="Describe pre and post event observations" onBack={onBack} onCancel={onCancel} onNext={onNext} />
    </div>
  );
}

const TEXTAREA_STYLE: React.CSSProperties = {
  boxSizing: "border-box", width: "100%", padding: "7px 9px",
  background: "#FFFFFF", border: "1px solid #C7C7C7", borderRadius: 4,
  fontFamily: "'Inter','Segoe UI',sans-serif", fontWeight: 400, fontSize: 11.1,
  lineHeight: "18px", color: "#1B1B1B", outline: "none", resize: "vertical", minHeight: 78,
};
