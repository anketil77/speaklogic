// src/dialog/views/createarticle/wizard/steps/Step3Article.tsx
//
// Wizard Step 3 — "Article" step.
// Sections:
//   1. Article Title input + Category selector row
//   2. Provider Information: Provider Name, Person Name, Person Location
// Footer hint: "Enter article title and provider details"
// Next disabled when articleTitle is empty.

import React, { useState, useCallback, useRef } from "react";
import { SectionBox }  from "../SectionBox";
import { FormInput }   from "../FormInput";
import { WizardFooter } from "../WizardFooter";
import { CategoryPickerPanel, CategoryIcon } from "@/dialog/views/createarticle/CategoryPickerPanel";
import type { StepProps } from "../wizardTypes";
import type { ArticleCategory } from "@/dialog/views/createarticle/CategoryPickerPanel";

export function Step3Article({ data, onChange, onNext, onBack, onCancel, hideProviderSection }: StepProps & { hideProviderSection?: boolean }) {
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  const catBtnRef = useRef<HTMLButtonElement>(null);

  const openCategoryPicker = useCallback(() => {
    if (catBtnRef.current) {
      setTriggerRect(catBtnRef.current.getBoundingClientRect());
    }
    setShowCategoryPicker(true);
  }, []);

  const handleCategorySelect = useCallback((cat: ArticleCategory) => {
    onChange({ category: cat });
    setShowCategoryPicker(false);
  }, [onChange]);

  const nextDisabled = data.articleTitle.trim() === "";

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
          padding:       "10px 14px 6px",
          display:       "flex",
          flexDirection: "column",
          gap:           9,
        }}
      >
        {/* ── Article Title + Category ── */}
        <SectionBox title="Article Title">
          <FormInput
            placeholder="Enter article title"
            value={data.articleTitle}
            onChange={(v) => onChange({ articleTitle: v })}
          />

          {/* Category row */}
          <div
            style={{
              display:        "flex",
              flexDirection:  "row",
              justifyContent: "space-between",
              alignItems:     "center",
              width:          "100%",
              marginTop:      2,
            }}
          >
            <span
              style={{
                fontFamily: "'Inter','Segoe UI',sans-serif",
                fontWeight:  400,
                fontSize:    10.7,
                lineHeight:  "13px",
                color:       "#616161",
              }}
            >
              Category
            </span>

            <button
              ref={catBtnRef}
              onClick={openCategoryPicker}
              style={{
                display:    "flex",
                alignItems: "center",
                gap:        6,
                background: "none",
                border:     "none",
                padding:    0,
                cursor:     "pointer",
                fontFamily: "'Inter','Segoe UI',sans-serif",
                fontWeight:  700,
                fontSize:    10.7,
                lineHeight:  "13px",
                color:       data.category ? "#1B1B1B" : "#0078D4",
              }}
            >
              {data.category && (
                <CategoryIcon
                  category={data.category as ArticleCategory}
                  size={14}
                  color="#1B1B1B"
                />
              )}
              {data.category || "Select category"}
              <span style={{ color: "#0078D4", fontSize: 12, lineHeight: "1" }}>›</span>
            </button>
          </div>
        </SectionBox>

        {/* ── Provider Information (hidden for Product Reviews) ── */}
        {!hideProviderSection && (
          <SectionBox title="Provider Information" showHelp>
            <FormInput
              placeholder="Provider Name"
              value={data.providerName}
              onChange={(v) => onChange({ providerName: v })}
            />
            <FormInput
              placeholder="Person Name"
              value={data.personName}
              onChange={(v) => onChange({ personName: v })}
            />
            <FormInput
              placeholder="Person Location"
              value={data.personLocation}
              onChange={(v) => onChange({ personLocation: v })}
            />
          </SectionBox>
        )}
      </div>

      {/* Footer */}
      <WizardFooter
        hintText="Enter article title and provider details"
        onBack={onBack}
        onCancel={onCancel}
        onNext={onNext}
        nextDisabled={nextDisabled}
      />

      {/* Category picker portal */}
      {showCategoryPicker && triggerRect && (
        <CategoryPickerPanel
          triggerRect={triggerRect}
          selectedCategory={(data.category as ArticleCategory) || ""}
          onSelect={handleCategorySelect}
          onClose={() => setShowCategoryPicker(false)}
        />
      )}
    </div>
  );
}
