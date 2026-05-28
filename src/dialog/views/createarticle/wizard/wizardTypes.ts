// src/dialog/views/createarticle/wizard/wizardTypes.ts
//
// Shared types, step definitions, and initial state for the Article Wizard.
// Kept in a separate file so all step components share one source of truth.

// ─── Step IDs ────────────────────────────────────────────────────────────────

export type StepId =
  | "article"         // title + category + provider info (all non-product templates)
  | "givenSet"        // given set toggle + people location + consideration
  | "event"           // event name / location / date / time
  | "info"            // info existed before event (rich text)
  | "prePostObs"      // Sport Template 1: pre/post event observation
  | "content"         // configurable content sections (neg func, func exec, relationship, etc.)
  | "productProvider" // Product Review: provider info page
  | "productArticle"  // Product Review: add article page (product name, model, etc.)
  | "funcReview"      // Product Review: function executed during review
  | "additionalInfo"  // Product Review: additional info, URL, names
  | "done";

export interface StepDef {
  readonly id:    StepId;
  readonly label: string;
}

// ContentConfig determines which sections appear in the "content" step.
export interface ContentConfig {
  motherNature: boolean;
  negFunc:      boolean;
  problem:      boolean;
  funcExec:     boolean;
  relationship: boolean;
}

export const WIZARD_FIRST_EDITABLE_STEP = 1;
export const WIZARD_DONE_STEP           = 6;

// ─── Form data model ─────────────────────────────────────────────────────────

export interface WizardData {
  // Step 3 — Article
  articleTitle:  string;
  category:      string;
  providerName:  string;
  personName:    string;
  personLocation: string;

  // Step 4 — Given Set
  isGivenSet:           boolean;   // true = Yes (provider uses the given set)
  articleBasisReference: string;
  peopleLocation:        string;
  consideration:         string;

  // Step 5 — Event
  eventName:     string;
  eventLocation: string;
  eventDate:     string;
  eventTime:     string;

  // Step 6 — Info (rich text HTML)
  infoBeforeEvent: string;

  // Step 7 — Content (configurable sections)
  motherNatureConsiderations: string;
  negativeFunction:           string;
  problemDetails:             string;
  funcExecuteFromEvent:       string;  // Non-Sport 3/4, all Sport
  relationshipDetails:        string;

  // Sport Template 1 only
  preEventObservation:  string;
  postEventObservation: string;

  // Product Review
  isProviderUseGivenSetOfInfo1: boolean;
  productName:                  string;
  modelNumber:                  string;
  productType:                  string;
  productFunction:              string;
  problemSolved:                string;
  functionExecutedDuringReview: string;
  isSolvedProblem:              boolean;
  additionalInformation:        string;
  productURL:                   string;
  reviewerName:                 string;
}

export const INITIAL_WIZARD_DATA: WizardData = {
  articleTitle:    "",
  category:        "",
  providerName:    "",
  personName:      "",
  personLocation:  "",
  isGivenSet:            false,
  articleBasisReference: "",
  peopleLocation:        "",
  consideration:         "",
  eventName:       "",
  eventLocation:   "",
  eventDate:       "",
  eventTime:       "",
  infoBeforeEvent: "",
  motherNatureConsiderations: "",
  negativeFunction:           "",
  problemDetails:             "",
  funcExecuteFromEvent:       "",
  relationshipDetails:        "",
  preEventObservation:  "",
  postEventObservation: "",
  isProviderUseGivenSetOfInfo1: false,
  productName:                  "",
  modelNumber:                  "",
  productType:                  "",
  productFunction:              "",
  problemSolved:                "",
  functionExecutedDuringReview: "",
  isSolvedProblem:              false,
  additionalInformation:        "",
  productURL:                   "",
  reviewerName:                 "",
};

// ─── Shared step-component prop type ────────────────────────────────────────

export interface StepProps {
  data:     WizardData;
  onChange: (patch: Partial<WizardData>) => void;
  onNext:   () => void;
  onBack:   () => void;
  onCancel: () => void;
}
