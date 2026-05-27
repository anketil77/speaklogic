// src/dialog/views/ArticleWizardView.tsx
//
// Main container for the Article Creation Wizard (?view=article-wizard).
// Manages step state (3–8) and WizardData, renders the shared header +
// WizardStepBar + the active step component.
//
// Communication pattern:
//   Step 7 Finish → sendMessage(SAVE_ARTICLE_WIZARD) → host saves → sends SAVED
//   SAVED received → advance to Step 8 (Done screen)
//   Back on Step 3 → sendMessage(BACK_TO_PICKER) → host reopens template picker
//   Cancel (any step) / Close (Step 8) → sendMessage(CLOSE)

import React, { useCallback, useEffect, useReducer, useState } from "react";
import { useDialogComm }   from "@/dialog/hooks/useDialogComm";
import { WizardStepBar }   from "./createarticle/wizard/WizardStepBar";
import { Step3Article }    from "./createarticle/wizard/steps/Step3Article";
import { Step4GivenSet }   from "./createarticle/wizard/steps/Step4GivenSet";
import { Step5Event }      from "./createarticle/wizard/steps/Step5Event";
import { Step6Info }       from "./createarticle/wizard/steps/Step6Info";
import { Step7Content }    from "./createarticle/wizard/steps/Step7Content";
import { Step8Done }       from "./createarticle/wizard/steps/Step8Done";
import {
  INITIAL_WIZARD_DATA,
  WIZARD_FIRST_EDITABLE_STEP,
  WIZARD_DONE_STEP,
} from "./createarticle/wizard/wizardTypes";
import type { WizardData, StepProps } from "./createarticle/wizard/wizardTypes";
import type { SaveArticleWizardPayload } from "@/types/db";

// ─── Reducer ─────────────────────────────────────────────────────────────────

function wizardDataReducer(state: WizardData, patch: Partial<WizardData>): WizardData {
  return { ...state, ...patch };
}

// ─── Header ──────────────────────────────────────────────────────────────────

function WizardHeader({ title }: { title: string }) {
  return (
    <div
      style={{
        display:        "flex",
        flexDirection:  "row",
        alignItems:     "center",
        padding:        "0 16px",
        height:         42,
        background:     "#FFFFFF",
        borderBottom:   "1px solid #E0E0E0",
        flexShrink:     0,
        boxSizing:      "border-box",
      }}
    >
      <span
        style={{
          fontFamily: "'Inter','Segoe UI',sans-serif",
          fontWeight:  700,
          fontSize:    13,
          lineHeight:  "16px",
          color:       "#1B1B1B",
        }}
      >
        {title}
      </span>
    </div>
  );
}

// ─── Main view ───────────────────────────────────────────────────────────────

export default function ArticleWizardView() {
  const { initData, sendMessage } = useDialogComm();

  const [step, setStep]      = useState(WIZARD_FIRST_EDITABLE_STEP);   // 3–8
  const [data, dispatch]     = useReducer(wizardDataReducer, {
    ...INITIAL_WIZARD_DATA,
    // Pre-fill category from template picker if provided
    category: initData?.wizardCategory ?? "",
  });

  // Pre-fill templateName / wizardCategory once initData arrives
  useEffect(() => {
    if (initData?.wizardCategory) {
      dispatch({ category: initData.wizardCategory });
    }
  }, [initData?.wizardCategory]);

  const onChange = useCallback((patch: Partial<WizardData>) => dispatch(patch), []);

  // ── Navigation ──────────────────────────────────────────────────────────────

  const handleNext = useCallback(() => {
    if (step === 7) {
      // Finish — send payload to host
      const payload: SaveArticleWizardPayload = {
        articleTitle:               data.articleTitle,
        category:                   data.category,
        providerName:               data.providerName,
        personName:                 data.personName,
        personLocation:             data.personLocation,
        isGivenSet:                 data.isGivenSet ? 1 : 0,
        peopleLocation:             data.peopleLocation,
        consideration:              data.consideration,
        eventName:                  data.eventName,
        eventLocation:              data.eventLocation,
        eventDate:                  data.eventDate,
        eventTime:                  data.eventTime,
        infoBeforeEvent:            data.infoBeforeEvent,
        motherNatureConsiderations: data.motherNatureConsiderations,
        negativeFunction:           data.negativeFunction,
        problemDetails:             data.problemDetails,
        templateName:               initData?.templateName  ?? "",
        wizardCategory:             initData?.wizardCategory ?? data.category,
      };
      sendMessage({ action: "SAVE_ARTICLE_WIZARD", payload });
      // Host will send SAVED → handled by index.tsx SAVED case.
      // We advance to Done here optimistically (host confirms via SAVED).
      setStep(WIZARD_DONE_STEP);
    } else {
      setStep((s) => s + 1);
    }
  }, [step, data, initData, sendMessage]);

  const handleBack = useCallback(() => {
    if (step === WIZARD_FIRST_EDITABLE_STEP) {
      // Back from step 3 → back to template picker
      sendMessage({ action: "BACK_TO_PICKER" });
    } else {
      setStep((s) => s - 1);
    }
  }, [step, sendMessage]);

  const handleCancel = useCallback(() => {
    sendMessage({ action: "CLOSE" });
  }, [sendMessage]);

  const handleClose = useCallback(() => {
    sendMessage({ action: "CLOSE" });
  }, [sendMessage]);

  // ── Resolve active step component ───────────────────────────────────────────

  const stepProps: StepProps = { data, onChange, onNext: handleNext, onBack: handleBack, onCancel: handleCancel };

  const renderStep = () => {
    switch (step) {
      case 3:  return <Step3Article  {...stepProps} />;
      case 4:  return <Step4GivenSet {...stepProps} />;
      case 5:  return <Step5Event    {...stepProps} />;
      case 6:  return <Step6Info     {...stepProps} />;
      case 7:  return <Step7Content  {...stepProps} />;
      case 8:  return <Step8Done data={data} onClose={handleClose} />;
      default: return null;
    }
  };

  const stepTitles: Record<number, string> = {
    3: "Create Article",
    4: "Create Article",
    5: "Create Article",
    6: "Create Article",
    7: "Create Article",
    8: "Create Article",
  };

  return (
    <div
      style={{
        display:       "flex",
        flexDirection: "column",
        height:        "100vh",
        background:    "#FFFFFF",
        overflow:      "hidden",
        fontFamily:    "'Inter','Segoe UI',sans-serif",
      }}
    >
      <WizardHeader title={stepTitles[step] ?? "Create Article"} />
      <WizardStepBar currentStep={step} />
      {renderStep()}
    </div>
  );
}
