// src/dialog/views/createarticle/wizard/steps/Step7Content.tsx
//
// Wizard Step 7 — "Content" step (Template 2 Non-Sport & Game).
// Mother nature section shows per-entry verification pairs:
//   • Read-only "Identified info" (from Step 6) — green card
//   • Editable verification (RichEditor with toolbar)
// All other content sections (neg func, problem, func exec, relationship) also
// use the shared RichField so the editing surface is consistent.
// Finish button triggers SAVE_ARTICLE_WIZARD via onNext.

import React from "react";
import { SectionBox }   from "../SectionBox";
import { WizardFooter } from "../WizardFooter";
import { HtmlContent }  from "@/dialog/components/HtmlContent";
import { RichField }    from "../RichField";
import type { StepProps, ContentConfig, InfoEntry } from "../wizardTypes";

interface Props extends StepProps {
  config: ContentConfig;
  isFinish?: boolean;
}

export function Step7Content({ data, onChange, onNext, onBack, onCancel, config, isFinish = true }: Props) {
  const entries = data.infoBeforeEvent;

  const updateEntryVerification = (id: string, verification: string) => {
    const next = entries.map((e) => (e.id === id ? { ...e, verification } : e));
    onChange({ infoBeforeEvent: next });
  };

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
        {config.motherNature && (
          <>
            {entries.length === 0 && (
              <SectionBox title="Mother nature into consideration" showHelp>
                <EmptyVerificationHint />
              </SectionBox>
            )}
            {entries.map((entry, idx) => (
              <VerificationPair
                key={entry.id}
                entry={entry}
                index={idx}
                onVerificationChange={(v) => updateEntryVerification(entry.id, v)}
              />
            ))}

            {entries.length > 0 && (
              <SectionBox title="Additional considerations" showHelp>
                <RichField
                  placeholder="Add considerations"
                  value={data.motherNatureConsiderations}
                  onChange={(v) => onChange({ motherNatureConsiderations: v })}
                />
              </SectionBox>
            )}
          </>
        )}

        {config.negFunc && (
          <SectionBox title="Negative function executed from event" showHelp>
            <RichField
              placeholder="Add negative function details"
              value={data.negativeFunction}
              onChange={(v) => onChange({ negativeFunction: v })}
            />
          </SectionBox>
        )}

        {config.problem && (
          <SectionBox title="Problem developed from negative function execution" showHelp>
            <RichField
              placeholder="Add problem details"
              value={data.problemDetails}
              onChange={(v) => onChange({ problemDetails: v })}
            />
          </SectionBox>
        )}

        {config.funcExec && (
          <SectionBox title="Function executed from event" showHelp>
            <RichField
              placeholder="Add function execution details"
              value={data.funcExecuteFromEvent}
              onChange={(v) => onChange({ funcExecuteFromEvent: v })}
            />
          </SectionBox>
        )}

        {config.relationship && (
          <SectionBox
            title="Relationship if any between information existed before event & negative function executed from event"
            showHelp
          >
            <RichField
              placeholder="Add relationship details"
              value={data.relationshipDetails}
              onChange={(v) => onChange({ relationshipDetails: v })}
            />
          </SectionBox>
        )}
      </div>

      <WizardFooter
        hintText="Add content details"
        onBack={onBack}
        onCancel={onCancel}
        onNext={onNext}
        nextLabel={isFinish ? "Finish" : "Next"}
      />
    </div>
  );
}

// ─── Per-entry verification pair ──────────────────────────────────────────────

interface VerificationPairProps {
  entry:                InfoEntry;
  index:                number;
  onVerificationChange: (html: string) => void;
}

function VerificationPair({ entry, index, onVerificationChange }: VerificationPairProps) {
  return (
    <SectionBox title={`Information #${index + 1} — verification`} showHelp bodyPadding="10px">
      {/* Read-only identified-information block (top) */}
      <div
        style={{
          width:        "100%",
          boxSizing:    "border-box",
          border:       "1px solid #D0D0D0",
          borderRadius: 6,
          background:   "#F6FBF7",
          padding:      "10px 12px",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            fontFamily:    "'Inter','Segoe UI',sans-serif",
            fontWeight:    700,
            fontSize:      9.5,
            color:         "#1B7C3A",
            marginBottom:  4,
            letterSpacing: 0.3,
            textTransform: "uppercase",
          }}
        >
          Identified info
        </div>
        {entry.html
          ? <HtmlContent html={entry.html} style={{ color: "#1B5E2A", fontSize: 12, lineHeight: "18px" }} />
          : <div style={{ color: "#9B9B9B", fontStyle: "italic", fontSize: 11 }}>(no information captured)</div>
        }
      </div>

      {/* Editable verification block (bottom) */}
      <RichField
        placeholder="Add verification (example applying the information above)…"
        value={entry.verification}
        onChange={onVerificationChange}
      />
    </SectionBox>
  );
}

// ─── Empty-state hint for verification section ────────────────────────────────

function EmptyVerificationHint() {
  return (
    <div
      style={{
        boxSizing:     "border-box",
        width:         "100%",
        display:       "flex",
        flexDirection: "column",
        alignItems:    "center",
        justifyContent:"center",
        gap:           4,
        padding:       "16px 12px",
        background:    "#FAFAFA",
        border:        "1px dashed #C7C7C7",
        borderRadius:  6,
        fontFamily:    "'Inter','Segoe UI',sans-serif",
        fontSize:      11,
        color:         "#5B5B5B",
      }}
    >
      <span style={{ fontWeight: 700 }}>No information identified yet</span>
      <span>Go back to the Info step and add at least one information item.</span>
    </div>
  );
}

