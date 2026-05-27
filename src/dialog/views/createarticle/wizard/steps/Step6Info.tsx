// src/dialog/views/createarticle/wizard/steps/Step6Info.tsx
//
// Wizard Step 6 — "Info" step.
// Section: Information Before Event
//   - RichTextToolbar (shared)
//   - RichEditor (contentEditable)
//   - "Add information" button + "Select Information" button
//   - SelectInfoPanel (portal) opens on "Select Information" click
// Footer hint: "Add information about what happened before the event"

import React, { useCallback, useRef, useState } from "react";
import { SectionBox }    from "../SectionBox";
import { WizardFooter }  from "../WizardFooter";
import { SelectInfoPanel } from "../SelectInfoPanel";
import type { InfoItem }   from "../SelectInfoPanel";
import { RichTextToolbar } from "@/dialog/components/RichTextToolbar";
import { RichEditor }      from "@/dialog/components/RichEditor";
import { WizardAddInfoIcon, WizardSelectInfoIcon } from "@/dialog/components/Icons";
import type { StepProps }  from "../wizardTypes";

// ─── Static sample data ───────────────────────────────────────────────────────
// In production these would be loaded from the DB and passed in via props.
// Keeping them here as constants avoids prop-drilling through the wizard
// container until real data wiring is implemented.

const USER_ITEMS: InfoItem[] = [
  { id: 1, name: "Prior weather report",    formula: "Historical data shows storm warning" },
  { id: 2, name: "Traffic conditions",       formula: "Highway 5 closed due to roadwork"   },
  { id: 3, name: "Local safety advisory",    formula: "City council issued flood advisory"  },
];

const SL_ITEMS: InfoItem[] = [
  { id: 101, name: "Communication principle", formula: "Ensure clarity in all messages"           },
  { id: 102, name: "Information principle",   formula: "Provide verifiable sources"               },
  { id: 103, name: "Reasoning standard",      formula: "Base claims on observable evidence"       },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function Step6Info({ data, onChange, onNext, onBack, onCancel }: StepProps) {
  const editorRef               = useRef<HTMLDivElement>(null);
  const [showSelectInfo, setShowSelectInfo] = useState(false);

  const handleInfoSelect = useCallback((item: InfoItem) => {
    // Append selected item name + formula to the rich-text editor
    const editor = editorRef.current;
    if (editor) {
      const appended = `<p><strong>${item.name}:</strong> ${item.formula}</p>`;
      const newHtml  = (data.infoBeforeEvent || "") + appended;
      onChange({ infoBeforeEvent: newHtml });
    }
    setShowSelectInfo(false);
  }, [data.infoBeforeEvent, onChange]);

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
          padding:       "14px 16px 8px",
          display:       "flex",
          flexDirection: "column",
          gap:           12,
        }}
      >
        <SectionBox title="Information Before Event" showHelp bodyPadding="0">
          {/* Toolbar strip */}
          <div
            style={{
              width:         "100%",
              borderBottom:  "1px solid #E0E0E0",
              padding:       "4px 8px",
              boxSizing:     "border-box",
            }}
          >
            <RichTextToolbar editorRef={editorRef} />
          </div>

          {/* Rich editor */}
          <div style={{ width: "100%", padding: "8px 11px", boxSizing: "border-box", minHeight: 90 }}>
            <RichEditor
              ref={editorRef}
              value={data.infoBeforeEvent}
              onChange={(html) => onChange({ infoBeforeEvent: html })}
              placeholder="Enter information about what happened before the event…"
              style={{
                minHeight:  80,
                fontSize:   11,
                lineHeight: "16px",
                outline:    "none",
              }}
            />
          </div>

          {/* Action buttons row */}
          <div
            style={{
              display:       "flex",
              flexDirection: "row",
              gap:           8,
              padding:       "0 11px 11px",
              width:         "100%",
              boxSizing:     "border-box",
            }}
          >
            <InfoActionBtn
              icon={<WizardAddInfoIcon />}
              label="Add information"
              onClick={() => {/* placeholder — future: open add-info sub-dialog */}}
            />
            <InfoActionBtn
              icon={<WizardSelectInfoIcon />}
              label="Select Information"
              onClick={() => setShowSelectInfo(true)}
            />
          </div>
        </SectionBox>
      </div>

      {/* Footer */}
      <WizardFooter
        hintText="Add information about what happened before the event"
        onBack={onBack}
        onCancel={onCancel}
        onNext={onNext}
      />

      {/* Select Information floating panel */}
      {showSelectInfo && (
        <SelectInfoPanel
          userItems={USER_ITEMS}
          speakLogicItems={SL_ITEMS}
          onSelect={handleInfoSelect}
          onClose={() => setShowSelectInfo(false)}
        />
      )}
    </div>
  );
}

// ─── Small icon button ────────────────────────────────────────────────────────

interface InfoActionBtnProps {
  icon:    React.ReactNode;
  label:   string;
  onClick: () => void;
}

function InfoActionBtn({ icon, label, onClick }: InfoActionBtnProps) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:        "flex",
        flexDirection:  "row",
        alignItems:     "center",
        justifyContent: "center",
        gap:            5,
        height:         26,
        padding:        "0 10px",
        background:     hov ? "#F0F0F0" : "#FFFFFF",
        border:         "1px solid #C7C7C7",
        borderRadius:   4,
        cursor:         "pointer",
        fontFamily:     "'Inter','Segoe UI',sans-serif",
        fontWeight:     700,
        fontSize:       10,
        lineHeight:     "12px",
        color:          "#1B1B1B",
        transition:     "background 0.1s",
        whiteSpace:     "nowrap",
      }}
    >
      {icon}
      {label}
    </button>
  );
}
