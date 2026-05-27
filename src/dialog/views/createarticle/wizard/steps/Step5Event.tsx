// src/dialog/views/createarticle/wizard/steps/Step5Event.tsx
//
// Wizard Step 5 — "Event" step.
// Section: About Event — Name, Location, and a 50/50 Date + Time row.
// Footer hint: "Enter event name, location, date and time"

import React from "react";
import { SectionBox }   from "../SectionBox";
import { FormInput }    from "../FormInput";
import { WizardFooter } from "../WizardFooter";
import type { StepProps } from "../wizardTypes";

export function Step5Event({ data, onChange, onNext, onBack, onCancel }: StepProps) {
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
        <SectionBox title="About Event" showHelp>
          <FormInput
            placeholder="Event Name"
            value={data.eventName}
            onChange={(v) => onChange({ eventName: v })}
          />
          <FormInput
            placeholder="Event Location"
            value={data.eventLocation}
            onChange={(v) => onChange({ eventLocation: v })}
          />

          {/* Date + Time — side by side, 50/50 */}
          <div style={{ display: "flex", flexDirection: "row", gap: 8, width: "100%" }}>
            <FormInput
              placeholder="Event Date"
              value={data.eventDate}
              onChange={(v) => onChange({ eventDate: v })}
              style={{ flex: 1 }}
            />
            <FormInput
              placeholder="Event Time"
              value={data.eventTime}
              onChange={(v) => onChange({ eventTime: v })}
              style={{ flex: 1 }}
            />
          </div>
        </SectionBox>
      </div>

      {/* Footer */}
      <WizardFooter
        hintText="Enter event name, location, date and time"
        onBack={onBack}
        onCancel={onCancel}
        onNext={onNext}
      />
    </div>
  );
}
