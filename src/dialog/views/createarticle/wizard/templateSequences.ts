// src/dialog/views/createarticle/wizard/templateSequences.ts
//
// Defines the ordered step sequence and ContentConfig for each Article template.
// C# ref: AddArticleWizard.cs — wzArticle_NextClick branching logic.

import type { StepDef, ContentConfig } from "./wizardTypes";

export interface TemplateSequence {
  steps:         StepDef[];
  contentConfig: ContentConfig | null;  // null for product-review (no content step)
}

// ─── Content configs ─────────────────────────────────────────────────────────

const NS1_CONTENT:   ContentConfig = { motherNature: true,  negFunc: true,  problem: true,  funcExec: false, relationship: false };
const NS2_CONTENT:   ContentConfig = { motherNature: true,  negFunc: true,  problem: true,  funcExec: false, relationship: true  };
const NS3_CONTENT:   ContentConfig = { motherNature: true,  negFunc: true,  problem: false, funcExec: false, relationship: true  };
const NS4_CONTENT:   ContentConfig = { motherNature: true,  negFunc: true,  problem: false, funcExec: false, relationship: false };
const SP1_CONTENT:   ContentConfig = { motherNature: false, negFunc: false, problem: false, funcExec: true,  relationship: false };
const SP2_CONTENT:   ContentConfig = { motherNature: false, negFunc: false, problem: false, funcExec: true,  relationship: false };
const SP3_CONTENT:   ContentConfig = { motherNature: true,  negFunc: false, problem: false, funcExec: true,  relationship: false };
const SP4_CONTENT:   ContentConfig = { motherNature: true,  negFunc: false, problem: false, funcExec: true,  relationship: true  };

// ─── Step sequences ───────────────────────────────────────────────────────────

const BASE_NS: StepDef[] = [
  { id: "article",  label: "Article"   },
  { id: "givenSet", label: "Given Set" },
  { id: "event",    label: "Event"     },
  { id: "info",     label: "Info"      },
  { id: "content",  label: "Content"   },
  { id: "done",     label: "Done"      },
];

// Sport Template 1 uses prePostObs instead of info
const SP1_STEPS: StepDef[] = [
  { id: "article",    label: "Article"      },
  { id: "givenSet",   label: "Given Set"    },
  { id: "event",      label: "Event"        },
  { id: "prePostObs", label: "Observations" },
  { id: "content",    label: "Content"      },
  { id: "done",       label: "Done"         },
];

// Sport Template 2 skips info entirely
const SP2_STEPS: StepDef[] = [
  { id: "article",  label: "Article"  },
  { id: "givenSet", label: "Given Set"},
  { id: "event",    label: "Event"    },
  { id: "content",  label: "Content"  },
  { id: "done",     label: "Done"     },
];

// Sport Templates 3 & 4 include info
const BASE_SPORT: StepDef[] = BASE_NS;

// Product Review — completely different step set
const PR_STEPS: StepDef[] = [
  { id: "productProvider", label: "Product"  },
  { id: "productArticle",  label: "Article"  },
  { id: "funcReview",      label: "Function" },
  { id: "additionalInfo",  label: "Details"  },
  { id: "done",            label: "Done"     },
];

// ─── Lookup map ───────────────────────────────────────────────────────────────

export function getTemplateSequence(templateName: string, category: string): TemplateSequence {
  const cat = category.toLowerCase();
  const t   = templateName.toLowerCase();

  if (cat === "product-reviews") {
    return { steps: PR_STEPS, contentConfig: null };
  }

  if (cat === "sport") {
    if (t.includes("template 1") || t.includes("template1")) return { steps: SP1_STEPS, contentConfig: SP1_CONTENT };
    if (t.includes("template 2") || t.includes("template2")) return { steps: SP2_STEPS, contentConfig: SP2_CONTENT };
    if (t.includes("template 3") || t.includes("template3")) return { steps: BASE_SPORT, contentConfig: SP3_CONTENT };
    if (t.includes("template 4") || t.includes("template4")) return { steps: BASE_SPORT, contentConfig: SP4_CONTENT };
    return { steps: SP1_STEPS, contentConfig: SP1_CONTENT };
  }

  // Non-Sport & Game (cat === "non-sport")
  if (t.includes("template 1") || t.includes("template1")) return { steps: BASE_NS, contentConfig: NS1_CONTENT };
  if (t.includes("template 2") || t.includes("template2")) return { steps: BASE_NS, contentConfig: NS2_CONTENT };
  if (t.includes("template 3") || t.includes("template3")) return { steps: BASE_NS, contentConfig: NS3_CONTENT };
  if (t.includes("template 4") || t.includes("template4")) return { steps: BASE_NS, contentConfig: NS4_CONTENT };
  return { steps: BASE_NS, contentConfig: NS2_CONTENT };
}
