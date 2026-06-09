// src/dialog/views/createarticle/wizard/steps/Step5Event.tsx
//
// Wizard Step 5 — "Event" step.
// Section: About Event — Name, Location, Date picker, Time picker.
// DatePicker: Fluent UI compat (inlinePopup).
// TimePicker: custom absolute-positioned dropdown — safe in Office.js iframes.

import React, { useCallback, useMemo } from "react";
import { DatePicker }          from "@fluentui/react-datepicker-compat";
import { CustomTimePicker }    from "../CustomTimePicker";
import { SectionBox }          from "../SectionBox";
import { FormInput }           from "../FormInput";
import { WizardFooter }        from "../WizardFooter";
import type { StepProps }      from "../wizardTypes";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseDateStr(s: string): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function formatDate(date: Date): string {
  const mm   = String(date.getMonth() + 1).padStart(2, "0");
  const dd   = String(date.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${date.getFullYear()}`;
}

const INPUT_SLOT_STYLE: React.CSSProperties = {
  height:     30,
  minHeight:  30,
  fontSize:   11.4,
  fontFamily: "'Inter','Segoe UI',sans-serif",
  color:      "#1B1B1B",
  padding:    "0 9px",
  boxSizing:  "border-box",
};

// ─── Component ───────────────────────────────────────────────────────────────

export function Step5Event({ data, onChange, onNext, onBack, onCancel }: StepProps) {
  const dateValue = useMemo(() => parseDateStr(data.eventDate), [data.eventDate]);

  const handleDateSelect = useCallback((date: Date | null | undefined) => {
    onChange({ eventDate: date ? formatDate(date) : "" });
  }, [onChange]);

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
      {/* Body */}
      <div
        style={{
          flex:          1,
          minHeight:     0,
          padding:       "10px 14px 6px",
          display:       "flex",
          flexDirection: "column",
          gap:           9,
          overflow:      "visible",
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

          {/* Date + Time — 50/50 */}
          <div style={{ display: "flex", gap: 8, width: "100%", minWidth: 0 }}>

            {/* Date picker — Fluent UI, inlinePopup */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <DatePicker
                value={dateValue}
                onSelectDate={handleDateSelect}
                formatDate={(d) => (d ? formatDate(d) : "")}
                placeholder="Select date..."
                allowTextInput={false}
                inlinePopup
                input={{ style: INPUT_SLOT_STYLE }}
                style={{ width: "100%" }}
              />
            </div>

            {/* Time picker — custom, position:absolute dropdown */}
            <CustomTimePicker
              value={data.eventTime}
              onChange={(v) => onChange({ eventTime: v })}
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
