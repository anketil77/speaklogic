// StepAdditionalInfo — Product Review: additional info, URL, provider/reviewer names.
// C# ref: wzAdditionalInfo page — AdditionalInformation + ProductURL + ProviderName + ReviewerName

import React from "react";
import { SectionBox }   from "../SectionBox";
import { WizardFooter } from "../WizardFooter";
import type { StepProps } from "../wizardTypes";

export function StepAdditionalInfo({ data, onChange, onNext, onBack, onCancel }: StepProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "10px 14px 6px", display: "flex", flexDirection: "column", gap: 9 }}>

        <SectionBox title="Additional Information" showHelp>
          <textarea
            rows={5}
            placeholder="Enter any additional information about the product"
            value={data.additionalInformation}
            onChange={(e) => onChange({ additionalInformation: e.target.value })}
            style={TEXTAREA_STYLE}
          />
        </SectionBox>

        <SectionBox title="Product & Reviewer Details" showHelp>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "2px 0" }}>
            <LabeledInput label="Product URL"     value={data.productURL}     onChange={(v) => onChange({ productURL: v })}     placeholder="Enter product URL" />
            <LabeledInput label="Provider Name"   value={data.providerName}   onChange={(v) => onChange({ providerName: v })}   placeholder="Enter provider name" />
            <LabeledInput label="Reviewer Name"   value={data.reviewerName}   onChange={(v) => onChange({ reviewerName: v })}   placeholder="Enter reviewer name" />
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

function LabeledInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 10.6, fontWeight: 600, color: "#616161" }}>{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          boxSizing: "border-box", height: 30, padding: "0 8px",
          border: "1px solid #C7C7C7", borderRadius: 4,
          fontFamily: "'Inter','Segoe UI',sans-serif", fontSize: 11.1, color: "#1B1B1B", outline: "none",
        }}
      />
    </div>
  );
}

const TEXTAREA_STYLE: React.CSSProperties = {
  boxSizing: "border-box", width: "100%", padding: "7px 9px",
  background: "#FFFFFF", border: "1px solid #C7C7C7", borderRadius: 4,
  fontFamily: "'Inter','Segoe UI',sans-serif", fontWeight: 400, fontSize: 11.1,
  lineHeight: "18px", color: "#1B1B1B", outline: "none", resize: "vertical", minHeight: 78,
};
