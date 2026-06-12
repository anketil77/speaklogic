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

// ─── Info-entry model (Step 6 list + Step 7 verifications) ──────────────────

export interface InfoEntry {
  id:           string;  // stable id (uuid-ish) for React keys + edit/delete
  html:         string;  // "Information existed/identified before event" body (HTML)
  verification: string;  // Step 7 per-entry verification body (HTML)
}

export function makeInfoEntry(html: string = ""): InfoEntry {
  return {
    id:           `info-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    html,
    verification: "",
  };
}

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

  // Step 6 — Info (list of identified-information entries, each rich text HTML)
  // Each entry pairs an "information identified before event" HTML body
  // with a per-entry verification HTML body authored on Step 7.
  infoBeforeEvent: InfoEntry[];

  // Step 7 — Content (configurable sections)
  // motherNatureConsiderations is a free-form HTML body stored alongside
  // the per-entry verifications inside infoBeforeEvent.
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
  providerPhone:                string;
  providerEmail:                string;
  reviewerName:                 string;
  reviewerPhone:                string;
  reviewerEmail:                string;
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
  infoBeforeEvent: [],
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
  providerPhone:                "",
  providerEmail:                "",
  reviewerName:                 "",
  reviewerPhone:                "",
  reviewerEmail:                "",
};

// ─── Shared step-component prop type ────────────────────────────────────────

export interface StepProps {
  data:     WizardData;
  onChange: (patch: Partial<WizardData>) => void;
  onNext:   () => void;
  onBack:   () => void;
  onCancel: () => void;
}
