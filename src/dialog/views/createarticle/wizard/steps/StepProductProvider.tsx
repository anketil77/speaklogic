// StepProductProvider — Product Review: product info + given set toggle.
// C# ref: wzProductReview page — IsProviderUseGivenSetOfInfo1 + product details

import React from "react";
import { SectionBox }   from "../SectionBox";
import { WizardFooter } from "../WizardFooter";
import type { StepProps } from "../wizardTypes";

if (typeof document !== "undefined" && !document.getElementById("__sl-wizard-input__")) {
  const s = document.createElement("style");
  s.id = "__sl-wizard-input__";
  s.textContent = ".sl-wizard-input::placeholder { color: #757575; }";
  document.head.appendChild(s);
}

export function StepProductProvider({ data, onChange, onNext, onBack, onCancel }: StepProps) {
  const nextDisabled = !data.productName.trim();

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "10px 14px 6px", display: "flex", flexDirection: "column", gap: 9 }}>

        <SectionBox
          title="About The Given Set"
          showHelp
          helpText="Specify whether the information provider uses The Given Set to provide the information. The Given Set includes principles that are used to provide information. Also identify the basis of that information. The basis of the information is related to the principles used by the information provider to provide the information."
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "2px 0", width: "100%" }}>
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
            <LabeledInput value={data.articleBasisReference} onChange={(v) => onChange({ articleBasisReference: v })} placeholder="Article Basis Reference" />
          </div>
        </SectionBox>

        <SectionBox
          title="Product Informations"
          showHelp
          helpText="Product function, this is the function of the product. Consider a telephone or car has a function, during the review, the reviewer can identify the function of the item being reviewed. Problem solved is simply problem solved by the function of the item."
        >
          <LabeledInput value={data.productName}     onChange={(v) => onChange({ productName: v })}     placeholder="Product Name"     error={nextDisabled && data.productName === ""} />
          <LabeledInput value={data.modelNumber}     onChange={(v) => onChange({ modelNumber: v })}     placeholder="Model Number" />
          <LabeledInput value={data.productType}     onChange={(v) => onChange({ productType: v })}     placeholder="Product Type" />
          <LabeledInput value={data.productFunction} onChange={(v) => onChange({ productFunction: v })} placeholder="Product Function" />
          <LabeledInput value={data.productURL}      onChange={(v) => onChange({ productURL: v })}      placeholder="Product URL" />
          <LabeledInput value={data.problemSolved}   onChange={(v) => onChange({ problemSolved: v })}   placeholder="Problem Solved" />
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

function LabeledInput({ value, onChange, placeholder, error }: { value: string; onChange: (v: string) => void; placeholder: string; error?: boolean }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="sl-wizard-input"
      style={{
        boxSizing: "border-box", width: "100%", height: 30, padding: "7px 9px",
        border: `1px solid ${error ? "#D13438" : "#C7C7C7"}`, borderRadius: 4,
        fontFamily: "'Inter','Segoe UI',sans-serif", fontSize: 11.1, color: "#1B1B1B",
        outline: "none", background: "#FFFFFF",
      }}
    />
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
