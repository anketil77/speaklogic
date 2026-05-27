// src/dialog/views/createarticle/wizard/wizardTypes.ts
//
// Shared types, step definitions, and initial state for the Article Wizard.
// Kept in a separate file so all step components share one source of truth.

// ─── Step definitions ────────────────────────────────────────────────────────

export interface WizardStepDef {
  readonly stepNum: number;
  readonly label:   string;
}

/** All 8 steps in the wizard (steps 1–2 are pre-completed from the template picker). */
export const WIZARD_STEPS: readonly WizardStepDef[] = [
  { stepNum: 1, label: "Category"  },
  { stepNum: 2, label: "Template"  },
  { stepNum: 3, label: "Article"   },
  { stepNum: 4, label: "Given Set" },
  { stepNum: 5, label: "Event"     },
  { stepNum: 6, label: "Info"      },
  { stepNum: 7, label: "Content"   },
  { stepNum: 8, label: "Done"      },
] as const;

export const WIZARD_FIRST_EDITABLE_STEP = 3;
export const WIZARD_DONE_STEP           = 8;

// ─── Form data model ─────────────────────────────────────────────────────────

export interface WizardData {
  // Step 3 — Article
  articleTitle:  string;
  category:      string;
  providerName:  string;
  personName:    string;
  personLocation: string;

  // Step 4 — Given Set
  isGivenSet:   boolean;   // true = Yes (provider uses the given set)
  peopleLocation: string;
  consideration: string;

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
}

export const INITIAL_WIZARD_DATA: WizardData = {
  articleTitle:    "",
  category:        "",
  providerName:    "",
  personName:      "",
  personLocation:  "",
  isGivenSet:      false,
  peopleLocation:  "",
  consideration:   "",
  eventName:       "",
  eventLocation:   "",
  eventDate:       "",
  eventTime:       "",
  infoBeforeEvent: "",
  motherNatureConsiderations: "",
  negativeFunction:           "",
  problemDetails:             "",
};

// ─── Shared step-component prop type ────────────────────────────────────────

export interface StepProps {
  data:     WizardData;
  onChange: (patch: Partial<WizardData>) => void;
  onNext:   () => void;
  onBack:   () => void;
  onCancel: () => void;
}
