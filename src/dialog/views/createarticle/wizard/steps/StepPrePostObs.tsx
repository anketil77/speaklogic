// StepPrePostObs — Sport Template 1: pre/post event observations.
// C# ref: wzPrePostObservation page — preEventObservation + postEventObservation

import React from "react";
import { SectionBox }   from "../SectionBox";
import { WizardFooter } from "../WizardFooter";
import { RichField }    from "../RichField";
import type { StepProps } from "../wizardTypes";

export function StepPrePostObs({ data, onChange, onNext, onBack, onCancel }: StepProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "10px 14px 6px", display: "flex", flexDirection: "column", gap: 9 }}>
        <SectionBox
          title="Pre-event observation"
          showHelp
          helpText="This is the information observed before the event. For example, before a football game or basketball game, the information observed. Things can be any information like fans interaction, players shaking hands and so forth."
        >
          <RichField
            placeholder="Describe observations before the event"
            value={data.preEventObservation}
            onChange={(v) => onChange({ preEventObservation: v })}
          />
        </SectionBox>
        <SectionBox
          title="Post-event observation"
          showHelp
          helpText="Post-event information includes fans interaction after the game, any abnormality and normality observed, for example players shaking hands and so forth."
        >
          <RichField
            placeholder="Describe observations after the event"
            value={data.postEventObservation}
            onChange={(v) => onChange({ postEventObservation: v })}
          />
        </SectionBox>
      </div>
      <WizardFooter hintText="Describe pre and post event observations" onBack={onBack} onCancel={onCancel} onNext={onNext} />
    </div>
  );
}
