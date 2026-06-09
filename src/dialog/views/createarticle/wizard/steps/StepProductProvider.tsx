// StepProductProvider — Product Review: product info + given set toggle.
// C# ref: wzProductReview page — IsProviderUseGivenSetOfInfo1 + product details

import React from "react";
import { SectionBox }   from "../SectionBox";
import { WizardFooter } from "../WizardFooter";
import type { StepProps } from "../wizardTypes";

export function StepProductProvider({ data, onChange, onNext, onBack, onCancel }: StepProps) {
  const nextDisabled = !data.productName.trim();

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "10px 14px 6px", display: "flex", flexDirection: "column", gap: 9 }}>

        {/* Product details */}
        <SectionBox title="Product Details" showHelp>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <LabeledInput label="Product Name *"  value={data.productName}     onChange={(v) => onChange({ productName: v })}     placeholder="Enter product name" error={nextDisabled && data.productName === ""} />
            <LabeledInput label="Model Number"    value={data.modelNumber}     onChange={(v) => onChange({ modelNumber: v })}     placeholder="Enter model number" />
            <LabeledInput label="Product Type"    value={data.productType}     onChange={(v) => onChange({ productType: v })}     placeholder="Enter product type" />
            <LabeledInput label="Product Function" value={data.productFunction} onChange={(v) => onChange({ productFunction: v })} placeholder="Enter product function" />
            <LabeledInput label="Problem Solved"  value={data.problemSolved}   onChange={(v) => onChange({ problemSolved: v })}   placeholder="What problem does this product solve?" />
            <LabeledInput label="Product URL"     value={data.productURL}      onChange={(v) => onChange({ productURL: v })}      placeholder="Enter product URL" />
          </div>
        </SectionBox>

        {/* Given Set toggle + Article Basis Reference */}
        <SectionBox title="About The Given Set" showHelp>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "2px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11.1, color: "#616161", flex: 1 }}>
                Does provider use The Given Set to provide this information?
              </span>
              <Toggle
                value={data.isProviderUseGivenSetOfInfo1}
                onChange={(v) => onChange({ isProviderUseGivenSetOfInfo1: v })}
              />
              <span style={{ fontSize: 11.1, color: data.isProviderUseGivenSetOfInfo1 ? "#0078D4" : "#616161", fontWeight: 600, minWidth: 28 }}>
                {data.isProviderUseGivenSetOfInfo1 ? "Yes" : "No"}
              </span>
            </div>
            <LabeledInput label="Article Basis Reference" value={data.articleBasisReference} onChange={(v) => onChange({ articleBasisReference: v })} placeholder="Enter article basis reference" />
          </div>
        </SectionBox>
      </div>

      <WizardFooter
        hintText="Enter product information"
        onBack={onBack}
        onCancel={onCancel}
        onNext={onNext}
        nextDisabled={nextDisabled}
      />
    </div>
  );
}

function LabeledInput({ label, value, onChange, placeholder, error }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; error?: boolean }) {
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
          border: `1px solid ${error ? "#D13438" : "#C7C7C7"}`, borderRadius: 4,
          fontFamily: "'Inter','Segoe UI',sans-serif", fontSize: 11.1, color: "#1B1B1B", outline: "none",
        }}
      />
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        position:     "relative",
        width:        32,
        height:       18,
        borderRadius: 18,
        background:   value ? "#0078D4" : "#C7C7C7",
        cursor:       "pointer",
        flexShrink:   0,
        transition:   "background 0.15s",
      }}
    >
      <div
        style={{
          position:     "absolute",
          top:          2,
          left:         value ? 14 : 2,
          width:        14,
          height:       14,
          borderRadius: 14,
          background:   "#FFFFFF",
          transition:   "left 0.15s",
        }}
      />
    </div>
  );
}
