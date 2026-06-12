// src/dialog/views/createarticle/wizard/steps/Step6Info.tsx
//
// Wizard Step 6 — "Info" step.
// Single editor at the top + compact list of saved entries below.
//   • User types in the top RichField, taps "Add information" → entry is
//     pushed onto the list as a one-line summary; the top editor clears.
//   • Each list row has Edit (loads it back into the top editor in Update
//     mode) and Delete (removes it).
//   • "Select Information" opens the picker; chosen item is appended to the
//     list directly.
// The Step 7 verification flow iterates this same list.

import React, { useCallback, useRef, useState } from "react";
import { SectionBox }      from "../SectionBox";
import { WizardFooter }    from "../WizardFooter";
import { SelectInfoPanel } from "../SelectInfoPanel";
import type { InfoItem }   from "../SelectInfoPanel";
import { RichTextToolbar } from "@/dialog/components/RichTextToolbar";
import { RichEditor }      from "@/dialog/components/RichEditor";
import { WizardAddInfoIcon, WizardSelectInfoIcon } from "@/dialog/components/Icons";
import type { StepProps, InfoEntry } from "../wizardTypes";
import { makeInfoEntry } from "../wizardTypes";

// ─── Static sample data ───────────────────────────────────────────────────────
// In production these would be loaded from the DB and passed in via props.

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function summarize(html: string, max = 90): string {
  if (typeof document === "undefined") return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  const text = (tmp.textContent || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.length > max ? text.slice(0, max).trim() + "…" : text;
}

function htmlIsEmpty(html: string): boolean {
  if (!html) return true;
  return summarize(html, 9999).length === 0;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Step6Info({ data, onChange, onNext, onBack, onCancel }: StepProps) {
  const entries = data.infoBeforeEvent;
  const [draftHtml,      setDraftHtml]      = useState<string>("");
  const [editingId,      setEditingId]      = useState<string | null>(null);
  const [showSelectInfo, setShowSelectInfo] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const focusEditor = () => {
    // setTimeout so the value prop propagates before focusing.
    setTimeout(() => editorRef.current?.focus(), 0);
  };

  const handleAddOrUpdate = useCallback(() => {
    if (htmlIsEmpty(draftHtml)) return;
    if (editingId) {
      const next = entries.map((e) =>
        e.id === editingId ? { ...e, html: draftHtml } : e
      );
      onChange({ infoBeforeEvent: next });
      setEditingId(null);
    } else {
      onChange({ infoBeforeEvent: [...entries, makeInfoEntry(draftHtml)] });
    }
    setDraftHtml("");
  }, [draftHtml, editingId, entries, onChange]);

  const handleEditRow = useCallback((entry: InfoEntry) => {
    setEditingId(entry.id);
    setDraftHtml(entry.html);
    focusEditor();
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setDraftHtml("");
  }, []);

  const handleDeleteRow = useCallback((id: string) => {
    onChange({ infoBeforeEvent: entries.filter((e) => e.id !== id) });
    if (editingId === id) {
      setEditingId(null);
      setDraftHtml("");
    }
  }, [entries, onChange, editingId]);

  const handleInfoSelect = useCallback((item: InfoItem) => {
    const html  = `<p><strong>${item.name}:</strong> ${item.formula}</p>`;
    onChange({ infoBeforeEvent: [...entries, makeInfoEntry(html)] });
    setShowSelectInfo(false);
  }, [entries, onChange]);

  const draftEmpty = htmlIsEmpty(draftHtml);

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
        <SectionBox title="Information existed/identified before event" showHelp bodyPadding="11px">
          {/* ── Active editor ───────────────────────────────────────────── */}
          <div
            style={{
              width:        "100%",
              boxSizing:    "border-box",
              border:       editingId ? "1px solid #0078D4" : "1px solid #C7C7C7",
              borderRadius: 6,
              background:   "#FFFFFF",
              boxShadow:    editingId ? "0 0 0 2px rgba(0,120,212,0.12)" : "none",
              transition:   "border-color 0.1s, box-shadow 0.1s",
            }}
          >
            {/* Edit-mode banner */}
            {editingId && (
              <div
                style={{
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "space-between",
                  padding:        "5px 10px",
                  background:     "#EAF3FB",
                  borderBottom:   "1px solid #CFE4F5",
                  borderTopLeftRadius:  6,
                  borderTopRightRadius: 6,
                  fontFamily:     "'Inter','Segoe UI',sans-serif",
                  fontSize:       10,
                  fontWeight:     700,
                  color:          "#075EA8",
                }}
              >
                <span>Editing existing information</span>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={{
                    background: "transparent",
                    border:     "none",
                    cursor:     "pointer",
                    color:      "#075EA8",
                    fontSize:   10,
                    fontWeight: 700,
                    padding:    "0 4px",
                  }}
                >
                  Cancel
                </button>
              </div>
            )}

            <div style={{ borderBottom: "1px solid #E0E0E0", padding: "4px 8px", boxSizing: "border-box" }}>
              <RichTextToolbar editorRef={editorRef} />
            </div>
            <div style={{ width: "100%", padding: "8px 11px", boxSizing: "border-box" }}>
              <RichEditor
                ref={editorRef}
                value={draftHtml}
                onChange={setDraftHtml}
                placeholder={editingId ? "Edit information…" : "Type information here…"}
                htmlContentStyling
                sanitizeOnPaste
                style={{
                  width:      "100%",
                  minHeight:  78,
                  fontSize:   12,
                  lineHeight: "18px",
                  outline:    "none",
                  border:     "none",
                  padding:    0,
                }}
              />
            </div>
          </div>

          {/* ── Action buttons row ──────────────────────────────────────── */}
          <div
            style={{
              display:       "flex",
              flexDirection: "row",
              gap:           8,
              marginTop:     8,
              width:         "100%",
              boxSizing:     "border-box",
            }}
          >
            <InfoActionBtn
              icon={<WizardAddInfoIcon />}
              label={editingId ? "Update information" : "Add information"}
              disabled={draftEmpty}
              onClick={handleAddOrUpdate}
            />
            <InfoActionBtn
              icon={<WizardSelectInfoIcon />}
              label="Select Information"
              onClick={() => setShowSelectInfo(true)}
            />
          </div>

          {/* ── Saved list ──────────────────────────────────────────────── */}
          <div style={{ width: "100%", marginTop: 14 }}>
            <div
              style={{
                fontFamily:    "'Inter','Segoe UI',sans-serif",
                fontWeight:    700,
                fontSize:      10,
                color:         "#5B5B5B",
                letterSpacing: 0.3,
                textTransform: "uppercase",
                marginBottom:  6,
              }}
            >
              Information identified ({entries.length})
            </div>
            {entries.length === 0
              ? <EmptyHint />
              : (
                <ul
                  style={{
                    listStyle: "none",
                    margin:    0,
                    padding:   0,
                    width:     "100%",
                    display:   "flex",
                    flexDirection: "column",
                    gap:       4,
                  }}
                >
                  {entries.map((entry, idx) => (
                    <SummaryRow
                      key={entry.id}
                      entry={entry}
                      index={idx}
                      isEditing={editingId === entry.id}
                      onEdit={() => handleEditRow(entry)}
                      onDelete={() => handleDeleteRow(entry.id)}
                    />
                  ))}
                </ul>
              )
            }
          </div>
        </SectionBox>
      </div>

      <WizardFooter
        hintText="Add information about what happened before the event"
        onBack={onBack}
        onCancel={onCancel}
        onNext={onNext}
      />

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

// ─── One compact row in the saved list ────────────────────────────────────────

interface SummaryRowProps {
  entry:     InfoEntry;
  index:     number;
  isEditing: boolean;
  onEdit:    () => void;
  onDelete:  () => void;
}

function SummaryRow({ entry, index, isEditing, onEdit, onDelete }: SummaryRowProps) {
  const [hov, setHov] = useState(false);
  const summary = summarize(entry.html) || "(empty)";
  return (
    <li
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:        "flex",
        flexDirection:  "row",
        alignItems:     "center",
        gap:            8,
        padding:        "6px 8px",
        border:         "1px solid",
        borderColor:    isEditing ? "#0078D4" : (hov ? "#C7C7C7" : "#E5E5E5"),
        background:     isEditing ? "#F1F8FE" : (hov ? "#FAFAFA" : "#FFFFFF"),
        borderRadius:   5,
        boxSizing:      "border-box",
        transition:     "background 0.1s, border-color 0.1s",
      }}
    >
      <span
        style={{
          flexShrink:    0,
          fontFamily:    "'Inter','Segoe UI',sans-serif",
          fontWeight:    700,
          fontSize:      10,
          color:         "#5B5B5B",
          minWidth:      18,
        }}
      >
        #{index + 1}
      </span>
      <span
        style={{
          flex:          1,
          minWidth:      0,
          fontFamily:    "'Inter','Segoe UI',sans-serif",
          fontSize:      11.5,
          color:         "#1B1B1B",
          overflow:      "hidden",
          textOverflow:  "ellipsis",
          whiteSpace:    "nowrap",
        }}
        title={summary}
      >
        {summary}
      </span>
      <RowIconBtn title="Edit" onClick={onEdit}>
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
          <path d="M1.5 10.5h2L9.6 4.4l-2-2L1.5 8.5v2z" stroke="#0078D4" strokeWidth="1" strokeLinejoin="round"/>
        </svg>
      </RowIconBtn>
      <RowIconBtn title="Delete" onClick={onDelete}>
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
          <path d="M2 3h8M4.5 3V2h3v1M3.5 3l.5 7h4l.5-7" stroke="#B33A3A" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </RowIconBtn>
    </li>
  );
}

// ─── Empty-state hint ─────────────────────────────────────────────────────────

function EmptyHint() {
  return (
    <div
      style={{
        boxSizing:    "border-box",
        width:        "100%",
        padding:      "10px 12px",
        background:   "#FAFAFA",
        border:       "1px dashed #C7C7C7",
        borderRadius: 6,
        fontFamily:   "'Inter','Segoe UI',sans-serif",
        fontSize:     11,
        color:        "#9B9B9B",
        textAlign:    "center",
      }}
    >
      No information yet — type above and tap <strong>Add information</strong>, or pick from <strong>Select Information</strong>.
    </div>
  );
}

// ─── Small row icon button ────────────────────────────────────────────────────

function RowIconBtn({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:        "inline-flex",
        alignItems:     "center",
        justifyContent: "center",
        width:          22,
        height:         22,
        border:         "1px solid transparent",
        background:     hov ? "#FFFFFF" : "transparent",
        borderColor:    hov ? "#C7C7C7" : "transparent",
        borderRadius:   4,
        cursor:         "pointer",
        padding:        0,
        flexShrink:     0,
      }}
    >
      {children}
    </button>
  );
}

// ─── Footer action button ─────────────────────────────────────────────────────

interface InfoActionBtnProps {
  icon:      React.ReactNode;
  label:     string;
  onClick:   () => void;
  disabled?: boolean;
}

function InfoActionBtn({ icon, label, onClick, disabled }: InfoActionBtnProps) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      onMouseEnter={() => !disabled && setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:        "flex",
        flexDirection:  "row",
        alignItems:     "center",
        justifyContent: "center",
        gap:            5,
        height:         26,
        padding:        "0 10px",
        background:     disabled ? "#F5F5F5" : (hov ? "#F0F0F0" : "#FFFFFF"),
        border:         "1px solid #C7C7C7",
        borderRadius:   4,
        cursor:         disabled ? "not-allowed" : "pointer",
        fontFamily:     "'Inter','Segoe UI',sans-serif",
        fontWeight:     700,
        fontSize:       10,
        lineHeight:     "12px",
        color:          disabled ? "#A0A0A0" : "#1B1B1B",
        transition:     "background 0.1s",
        whiteSpace:     "nowrap",
        opacity:        disabled ? 0.7 : 1,
      }}
    >
      {icon}
      {label}
    </button>
  );
}
