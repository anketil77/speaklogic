// src/dialog/views/ArticleWizardView.tsx
//
// Main container for the Article Creation Wizard (?view=article-wizard).
// Step routing is template-driven via getTemplateSequence() — supports all 9 templates.
//
// Communication pattern:
//   Last step Finish → sendMessage(SAVE_ARTICLE_WIZARD) → host saves → sends SAVED → Done screen
//   Back on first step → sendMessage(BACK_TO_PICKER) → host reopens template picker
//   Cancel (any step) / Close (Done screen) → sendMessage(CLOSE)

import React, { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { useDialogComm }       from "@/dialog/hooks/useDialogComm";
import { WizardStepBar }       from "./createarticle/wizard/WizardStepBar";
import { Step3Article }        from "./createarticle/wizard/steps/Step3Article";
import { Step4GivenSet }       from "./createarticle/wizard/steps/Step4GivenSet";
import { Step5Event }          from "./createarticle/wizard/steps/Step5Event";
import { Step6Info }           from "./createarticle/wizard/steps/Step6Info";
import { Step7Content }        from "./createarticle/wizard/steps/Step7Content";
import { Step8Done }           from "./createarticle/wizard/steps/Step8Done";
import { StepPrePostObs }      from "./createarticle/wizard/steps/StepPrePostObs";
import { StepProductProvider } from "./createarticle/wizard/steps/StepProductProvider";
import { StepFuncDuringReview }from "./createarticle/wizard/steps/StepFuncDuringReview";
import { StepAdditionalInfo }  from "./createarticle/wizard/steps/StepAdditionalInfo";
import { getTemplateSequence } from "./createarticle/wizard/templateSequences";
import { INITIAL_WIZARD_DATA } from "./createarticle/wizard/wizardTypes";
import type { WizardData, StepProps, StepId } from "./createarticle/wizard/wizardTypes";
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
        display:       "flex",
        flexDirection: "row",
        alignItems:    "center",
        padding:       "0 16px",
        height:        42,
        background:    "#FFFFFF",
        borderBottom:  "1px solid #E0E0E0",
        flexShrink:    0,
        boxSizing:     "border-box",
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
  const { initData, sendMessage, submitSave } = useDialogComm();

  const [stepIdx, setStepIdx] = useState(0);
  const [data, dispatch]      = useReducer(wizardDataReducer, {
    ...INITIAL_WIZARD_DATA,
    category: initData?.wizardCategory ?? "",
  });

  useEffect(() => {
    if (initData?.wizardCategory) dispatch({ category: initData.wizardCategory });
  }, [initData?.wizardCategory]);

  useEffect(() => {
    if (initData?.communicationPersonName && !data.personName) {
      dispatch({ personName: initData.communicationPersonName });
    }
  }, [initData?.communicationPersonName]);

  const onChange = useCallback((patch: Partial<WizardData>) => dispatch(patch), []);

  // Derive sequence once per template (initData won't change mid-wizard)
  const { steps, contentConfig } = useMemo(
    () => getTemplateSequence(initData?.templateName ?? "", initData?.wizardCategory ?? ""),
    [initData?.templateName, initData?.wizardCategory]
  );

  // ── Navigation ──────────────────────────────────────────────────────────────

  const handleNext = useCallback(() => {
    const currentId: StepId = steps[stepIdx]?.id;

    // Last real step before "done" — send save payload
    const doneIdx = steps.findIndex((s) => s.id === "done");
    if (stepIdx === doneIdx - 1) {
      const payload: SaveArticleWizardPayload = {
        articleTitle:               data.articleTitle,
        category:                   data.category,
        providerName:               data.providerName,
        personName:                 data.personName,
        personLocation:             data.personLocation,
        isGivenSet:                 data.isGivenSet ? 1 : 0,
        articleBasisReference:      data.articleBasisReference,
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
        relationshipDetails:        data.relationshipDetails,
        templateName:               initData?.templateName  ?? "",
        wizardCategory:             initData?.wizardCategory ?? data.category,
        funcExecuteFromEvent:       data.funcExecuteFromEvent,
        preEventObservation:        data.preEventObservation,
        postEventObservation:       data.postEventObservation,
        isProviderUseGivenSetOfInfo1: data.isProviderUseGivenSetOfInfo1 ? 1 : 0,
        productName:                data.productName,
        modelNumber:                data.modelNumber,
        productType:                data.productType,
        productFunction:            data.productFunction,
        problemSolved:              data.problemSolved,
        functionExecutedDuringReview: data.functionExecutedDuringReview,
        isSolvedProblem:            data.isSolvedProblem ? 1 : 0,
        additionalInformation:      data.additionalInformation,
        productURL:                 data.productURL,
        reviewerName:               data.reviewerName,
      };
      submitSave({ action: "SAVE_ARTICLE_WIZARD", payload });
      setStepIdx(doneIdx);
      return;
    }

    // "done" step — Close button handled by handleClose, not Next
    if (currentId !== "done") {
      setStepIdx((i) => i + 1);
    }
  }, [stepIdx, steps, data, initData, submitSave]);

  const handleBack = useCallback(() => {
    if (stepIdx === 0) {
      sendMessage({ action: "BACK_TO_PICKER" });
    } else {
      setStepIdx((i) => i - 1);
    }
  }, [stepIdx, sendMessage]);

  const handleCancel = useCallback(() => sendMessage({ action: "CLOSE" }), [sendMessage]);
  const handleClose  = useCallback(() => sendMessage({ action: "CLOSE" }), [sendMessage]);

  // ── Step renderer ──────────────────────────────────────────────────────────

  const stepProps: StepProps = { data, onChange, onNext: handleNext, onBack: handleBack, onCancel: handleCancel };

  const currentId: StepId = steps[stepIdx]?.id ?? "done";
  const isLastBeforeDone   = stepIdx === steps.findIndex((s) => s.id === "done") - 1;

  const STEP_TITLES: Record<StepId, string> = {
    article:         "Add Article",
    givenSet:        "Given Set",
    event:           "About Event",
    prePostObs:      "Observations",
    info:            "Information",
    content:         "Content",
    productProvider: "Product Provider",
    productArticle:  "Add Article",
    funcReview:      "Function Review",
    additionalInfo:  "Additional Info",
    done:            "Done",
  };
  const wizardTitle = STEP_TITLES[currentId] ?? "Add Article";

  const renderStep = () => {
    switch (currentId) {
      case "article":         return <Step3Article        {...stepProps} />;
      case "givenSet":        return <Step4GivenSet       {...stepProps} />;
      case "event":           return <Step5Event          {...stepProps} />;
      case "info":            return <Step6Info           {...stepProps} />;
      case "prePostObs":      return <StepPrePostObs      {...stepProps} />;
      case "content":
        return contentConfig
          ? <Step7Content {...stepProps} config={contentConfig} isFinish={isLastBeforeDone} />
          : null;
      case "productProvider": return <StepProductProvider {...stepProps} />;
      case "productArticle":  return <Step3Article        {...stepProps} hideProviderSection />;
      case "funcReview":      return <StepFuncDuringReview {...stepProps} />;
      case "additionalInfo":  return <StepAdditionalInfo  {...stepProps} />;
      case "done":            return <Step8Done data={data} onClose={handleClose} />;
      default:                return null;
    }
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
      <WizardHeader title={wizardTitle} />
      <WizardStepBar steps={steps} currentIdx={stepIdx} />
      {renderStep()}
    </div>
  );
}
