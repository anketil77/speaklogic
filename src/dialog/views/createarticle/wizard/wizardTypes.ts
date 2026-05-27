// src/dialog/views/createarticle/wizard/wizardTypes.ts
//
// Shared types, step definitions, and initial state for the Article Wizard.
// Kept in a separate file so all step components share one source of truth.

// ─── Step definitions ────────────────────────────────────────────────────────

export interface WizardStepDef {
  readonly stepNum: number;
  readonly label:   string;
}

/** Wizard steps shown in the step bar — Category and Template are done in the picker, not shown here. */
export const WIZARD_STEPS: readonly WizardStepDef[] = [
  { stepNum: 1, label: "Article"   },
  { stepNum: 2, label: "Given Set" },
  { stepNum: 3, label: "Event"     },
  { stepNum: 4, label: "Info"      },
  { stepNum: 5, label: "Content"   },
  { stepNum: 6, label: "Done"      },
] as const;

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

  // Step 7 — Content
  motherNatureConsiderations: string;
  negativeFunction:           string;
  problemDetails:             string;
  relationshipDetails:        string;
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
  relationshipDetails:        "",
};

// ─── Shared step-component prop type ────────────────────────────────────────

export interface StepProps {
  data:     WizardData;
  onChange: (patch: Partial<WizardData>) => void;
  onNext:   () => void;
  onBack:   () => void;
  onCancel: () => void;
}
