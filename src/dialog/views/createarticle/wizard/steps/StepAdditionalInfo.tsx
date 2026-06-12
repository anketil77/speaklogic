// StepAdditionalInfo — Product Review: additional info, URL, provider/reviewer names.
// C# ref: wzAdditionalInfo page — AdditionalInformation + ProductURL + ProviderName + ReviewerName

import React from "react";
import { SectionBox }   from "../SectionBox";
import { WizardFooter } from "../WizardFooter";
import { RichField }    from "../RichField";
import type { StepProps } from "../wizardTypes";

export function StepAdditionalInfo({ data, onChange, onNext, onBack, onCancel }: StepProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "10px 14px 6px", display: "flex", flexDirection: "column", gap: 9 }}>

        <SectionBox title="Additional Information" showHelp>
          <RichField
            placeholder="Enter any additional information about the product"
            value={data.additionalInformation}
            onChange={(v) => onChange({ additionalInformation: v })}
          />
        </SectionBox>

        <SectionBox title="Other Informations" showHelp>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
            <span style={{ fontSize: 10.6, fontWeight: 700, color: "#1B1B1B" }}>Provider Information</span>
            <LabeledInput value={data.providerName}  onChange={(v) => onChange({ providerName: v })}  placeholder="Provider Name" />
            <LabeledInput value={data.providerPhone} onChange={(v) => onChange({ providerPhone: v })} placeholder="Provider Phone" />
            <LabeledInput value={data.providerEmail} onChange={(v) => onChange({ providerEmail: v })} placeholder="Provider Email" />
            <span style={{ fontSize: 10.6, fontWeight: 700, color: "#1B1B1B", marginTop: 4 }}>Reviewer Information</span>
            <LabeledInput value={data.reviewerName}  onChange={(v) => onChange({ reviewerName: v })}  placeholder="Reviewer Name" />
            <LabeledInput value={data.reviewerPhone} onChange={(v) => onChange({ reviewerPhone: v })} placeholder="Reviewer Phone" />
            <LabeledInput value={data.reviewerEmail} onChange={(v) => onChange({ reviewerEmail: v })} placeholder="Reviewer Email" />
          </div>
        </SectionBox>
      </div>

      <WizardFooter
        hintText="Enter additional product details"
        onBack={onBack}
        onCancel={onCancel}
        onNext={onNext}
        nextLabel="Finish"
      />
    </div>
  );
}

function LabeledInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="sl-wizard-input"
      style={{
        boxSizing: "border-box", width: "100%", height: 30, padding: "7px 9px",
        border: "1px solid #C7C7C7", borderRadius: 4,
        fontFamily: "'Inter','Segoe UI',sans-serif", fontSize: 11.1, color: "#1B1B1B",
        outline: "none", background: "#FFFFFF",
      }}
    />
  );
}

