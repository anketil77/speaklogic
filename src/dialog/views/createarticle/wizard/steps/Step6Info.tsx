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

import React, { useCallback, useMemo, useRef, useState } from "react";
import { SectionBox }      from "../SectionBox";
import { WizardFooter }    from "../WizardFooter";
import { SelectInfoPanel } from "../SelectInfoPanel";
import type { InfoItem }   from "../SelectInfoPanel";
import { SPEAK_LOGIC_INFO_ITEMS } from "../speakLogicInfoData";
import { RichTextToolbar } from "@/dialog/components/RichTextToolbar";
import { RichEditor }      from "@/dialog/components/RichEditor";
import { HtmlContent }     from "@/dialog/components/HtmlContent";
import { useDialogComm }   from "@/dialog/hooks/useDialogComm";
import { extractHtmlBody } from "@/dialog/utils/extractHtmlBody";
import { WizardAddInfoIcon, WizardSelectInfoIcon } from "@/dialog/components/Icons";
import type { StepProps, InfoEntry } from "../wizardTypes";
import { makeInfoEntry } from "../wizardTypes";

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
  const { initData, sendMessage } = useDialogComm();
  const entries = data.infoBeforeEvent;
  const [draftHtml,      setDraftHtml]      = useState<string>("");
  const [editingId,      setEditingId]      = useState<string | null>(null);
  const [showSelectInfo, setShowSelectInfo] = useState(false);
  const [previewMode,    setPreviewMode]    = useState(false); // false = edit source, true = rendered preview
  const editorRef = useRef<HTMLDivElement>(null);

  // User Identified list — DB-backed, passed in via INIT and refreshed after
  // each add/remove (the host re-sends INIT). Speak Logic list is constant.
  const userItems: InfoItem[] = useMemo(
    () => (initData?.userInfoItems ?? []).map((it) => ({
      id:   `user-${it.id}`,
      name: it.name,
      html: it.html,
    })),
    [initData?.userInfoItems]
  );

  const handleAddUserItem = useCallback((name: string, html: string) => {
    // extractHtmlBody lets the user paste a WHOLE client HTML file (with
    // <head>/<script>/<style>): it keeps the renderable body + LaTeX/SVG and
    // drops the wrapper. Plain text / fragments pass through unchanged.
    sendMessage({ action: "SAVE_USER_INFO_ITEM", name, html: extractHtmlBody(html) });
  }, [sendMessage]);

  const handleRemoveUserItem = useCallback((id: string) => {
    const dbId = Number(id.replace(/^user-/, ""));
    if (!Number.isNaN(dbId)) sendMessage({ action: "DELETE_USER_INFO_ITEM", id: dbId });
  }, [sendMessage]);

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
    setPreviewMode(false);   // show the editable source when editing a row
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
    // Insert the item's FULL rich content (text / inline SVG diagram / LaTeX
    // math). It renders via the math-aware HtmlContent at view time.
    const html = `<p><strong>${item.name}</strong></p>${item.html}`;
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
        <SectionBox
          title="Information existed/identified before event"
          showHelp
          helpText="This is the information that is aware by the person or people before being informed. For example, I am informing you about an event, this is the information you are aware before I inform you about the event."
          bodyPadding="11px"
        >
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
            {/* Header strip: edit banner (left) + Edit/Preview toggle (right).
                The toggle flips the SAME box between editable source and the
                typeset render — no extra height (good for the small dialog). */}
            <div
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "5px 8px 5px 10px", background: editingId ? "#EAF3FB" : "#F7F9FB",
                borderBottom: `1px solid ${editingId ? "#CFE4F5" : "#E0E0E0"}`,
                borderTopLeftRadius: 6, borderTopRightRadius: 6,
                fontFamily: "'Inter','Segoe UI',sans-serif", fontSize: 10, fontWeight: 700,
              }}
            >
              {editingId ? (
                <span style={{ color: "#075EA8", display: "flex", alignItems: "center", gap: 8 }}>
                  Editing existing information
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: "#075EA8", fontSize: 10, fontWeight: 700, padding: 0, textDecoration: "underline" }}
                  >
                    Cancel
                  </button>
                </span>
              ) : <span style={{ color: "#5B5B5B" }}>Information</span>}

              {/* Edit | Preview segmented toggle */}
              <div style={{ display: "flex", background: "#FFFFFF", border: "1px solid #D7DCE3", borderRadius: 5, overflow: "hidden" }}>
                <ToggleSeg label="Edit"    active={!previewMode} onClick={() => setPreviewMode(false)} />
                <ToggleSeg label="Preview" active={previewMode}  onClick={() => setPreviewMode(true)} />
              </div>
            </div>

            {previewMode ? (
              /* Rendered: math typeset, diagrams drawn. Read-only — switch to Edit to change. */
              <div style={{ width: "100%", padding: "8px 11px", boxSizing: "border-box", minHeight: 94, maxHeight: 260, overflowY: "auto" }}>
                {draftEmpty
                  ? <span style={{ fontSize: 12, color: "#9B9B9B", fontStyle: "italic" }}>Nothing to preview yet.</span>
                  : <HtmlContent html={draftHtml} style={{ fontSize: 12, lineHeight: "18px", color: "#1B1B1B" }} />}
              </div>
            ) : (
              <>
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
              </>
            )}
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
          userItems={userItems}
          speakLogicItems={SPEAK_LOGIC_INFO_ITEMS}
          onSelect={handleInfoSelect}
          onClose={() => setShowSelectInfo(false)}
          onAddUserItem={handleAddUserItem}
          onRemoveUserItem={handleRemoveUserItem}
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
  const [hov,      setHov]      = useState(false);
  const [expanded, setExpanded] = useState(false);
  const isEmpty = !entry.html || !entry.html.trim();
  const title = summarize(entry.html, 60) || "(empty)";
  return (
    <li
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:        "flex",
        flexDirection:  "column",
        padding:        "6px 8px",
        border:         "1px solid",
        borderColor:    isEditing ? "#0078D4" : (hov ? "#C7C7C7" : "#E5E5E5"),
        background:     isEditing ? "#F1F8FE" : "#FFFFFF",
        borderRadius:   5,
        boxSizing:      "border-box",
        transition:     "background 0.1s, border-color 0.1s",
      }}
    >
      {/* Compact header: chevron + index + title + actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={() => !isEmpty && setExpanded((v) => !v)}
          title={expanded ? "Collapse" : "Expand"}
          aria-label={expanded ? "Collapse" : "Expand"}
          disabled={isEmpty}
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 16, height: 16, flexShrink: 0, border: "none", background: "transparent",
            cursor: isEmpty ? "default" : "pointer", padding: 0,
            transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.12s",
          }}
        >
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
            <path d="M4 2.5L8 6l-4 3.5" stroke={isEmpty ? "#C7C7C7" : "#5B5B5B"} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span style={{ flexShrink: 0, fontWeight: 700, fontSize: 10, color: "#5B5B5B", minWidth: 16 }}>
          #{index + 1}
        </span>
        <span
          onClick={() => !isEmpty && setExpanded((v) => !v)}
          style={{
            flex: 1, minWidth: 0, fontSize: 11.5, color: isEmpty ? "#9B9B9B" : "#1B1B1B",
            fontStyle: isEmpty ? "italic" : "normal",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            cursor: isEmpty ? "default" : "pointer",
          }}
          title={title}
        >
          {title}
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
      </div>
      {/* Expanded: rendered content — math typeset, diagrams drawn (read-only). */}
      {expanded && !isEmpty && (
        <HtmlContent
          html={entry.html}
          style={{ marginTop: 6, fontSize: 12, lineHeight: "18px", color: "#1B1B1B", maxHeight: 240, overflowY: "auto" }}
        />
      )}
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

// ─── Edit/Preview segmented toggle ─────────────────────────────────────────────

function ToggleSeg({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "3px 11px", border: "none", cursor: "pointer",
        background: active ? "#0078D4" : "transparent",
        color: active ? "#FFFFFF" : "#5B5B5B",
        fontFamily: "'Inter','Segoe UI',sans-serif", fontSize: 9.6, fontWeight: 700,
        transition: "background 0.1s",
      }}
    >
      {label}
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
