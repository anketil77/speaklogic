// src/dialog/views/createarticle/wizard/SelectInfoPanel.tsx
//
// Floating "Select Information" side panel for the Article Wizard (Point 14).
// Rendered via createPortal to document.body (position: fixed).
//
// Two tabs:
//   • "User Identified" — editable: user can ADD and REMOVE items (persisted
//     in the DB via the host round-trip).
//   • "Speak Logic"     — CONSTANT/built-in: read-only, no add, no remove.
//
// Each item holds rich `html` (text, inline SVG diagram, or LaTeX math).
// Selecting an item inserts its full html into the Step Info list, where the
// math-aware HtmlContent renders it.

import React, { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { CloseIcon, WizardSearchIcon } from "@/dialog/components/Icons";
import { useDraggable } from "@/dialog/hooks/useDraggable";
import { HtmlContent } from "@/dialog/components/HtmlContent";

export interface InfoItem {
  id:   string;   // "sl-…" for Speak Logic, "user-<dbId>" for user items
  name: string;
  html: string;
}

type MathFilter = "all" | "nonmath" | "math";

// The built-in items are tagged "(Math)" / "(Non-math)". Detect via the visible
// tag so the math filter and tag-stripping stay in sync with what the user sees.
const isMathItem    = (i: InfoItem) => i.name.includes("(Math)");
const isNonMathItem = (i: InfoItem) => i.name.includes("(Non-math)");

// Drop the trailing "(Math)" / "(Non-math)" tag — redundant once a math filter is
// active (the filter already tells the user which set they're looking at).
const stripMathTag = (name: string) => name.replace(/\s*\((?:Non-)?[Mm]ath\)\s*$/, "").trim();

interface Props {
  userItems:        InfoItem[];
  speakLogicItems:  InfoItem[];
  onSelect:         (item: InfoItem) => void;
  onClose:          () => void;
  onAddUserItem?:   (name: string, html: string) => void;
  onRemoveUserItem?: (id: string) => void;
}

type Tab = "user" | "sl";

function htmlToText(html: string, max = 80): string {
  if (typeof document === "undefined") return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  const text = (tmp.textContent || "").replace(/\s+/g, " ").trim();
  return text.length > max ? text.slice(0, max).trim() + "…" : text;
}

export function SelectInfoPanel({
  userItems,
  speakLogicItems,
  onSelect,
  onClose,
  onAddUserItem,
  onRemoveUserItem,
}: Props) {
  const [activeTab,  setActiveTab]  = useState<Tab>("user");
  const [search,     setSearch]     = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding,     setAdding]     = useState(false);
  const [mathFilter, setMathFilter] = useState<MathFilter>("all");
  const [preview,    setPreview]    = useState<InfoItem | null>(null);
  const { pos, onHeaderMouseDown } = useDraggable();

  // The math/non-math filter only applies to the tagged built-in Speak Logic list.
  const showMathFilter = activeTab === "sl";

  const items = activeTab === "user" ? userItems : speakLogicItems;

  const filtered = items.filter((i) => {
    if (showMathFilter && mathFilter === "math"    && !isMathItem(i))    return false;
    if (showMathFilter && mathFilter === "nonmath" && !isNonMathItem(i)) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return i.name.toLowerCase().includes(q) || htmlToText(i.html, 9999).toLowerCase().includes(q);
  });

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab);
    setSelectedId(null);
    setSearch("");
    setAdding(false);
    setMathFilter("all");
  }, []);

  const handleConfirm = useCallback(() => {
    const item = filtered.find((i) => i.id === selectedId);
    if (item) onSelect(item);
  }, [filtered, selectedId, onSelect]);

  const handleSaveNew = useCallback((name: string, html: string) => {
    onAddUserItem?.(name, html);
    setAdding(false);
  }, [onAddUserItem]);

  const panel = (
    <div
      style={{
        position:      "fixed",
        right:         12 - pos.x,
        top:           90 + pos.y,
        width:         300,
        // Cap to viewport so the footer button can't overflow the dialog on a long list.
        maxHeight:     `min(460px, calc(100vh - ${102 + pos.y}px))`,
        background:    "#FFFFFF",
        boxShadow:     "0px 8px 32px rgba(0,0,0,0.14), 0px 2px 8px rgba(0,0,0,0.06)",
        borderRadius:  8,
        display:       "flex",
        flexDirection: "column",
        zIndex:        200,
        fontFamily:    "'Inter','Segoe UI',sans-serif",
        overflow:      "hidden",
      }}
    >
      <PanelHeader onClose={onClose} onDragStart={onHeaderMouseDown} />
      <TabBar activeTab={activeTab} onChange={handleTabChange} />
      {adding && activeTab === "user" ? (
        <AddItemForm onSave={handleSaveNew} onCancel={() => setAdding(false)} />
      ) : (
        <>
          <SearchBar value={search} onChange={setSearch} />
          {showMathFilter && <MathFilterBar value={mathFilter} onChange={setMathFilter} />}
          {activeTab === "user" && onAddUserItem && (
            <AddItemButton onClick={() => setAdding(true)} />
          )}
          <ItemList
            items={filtered}
            selectedId={selectedId}
            onSelect={setSelectedId}
            removable={activeTab === "user" && !!onRemoveUserItem}
            onRemove={onRemoveUserItem}
            stripTag={showMathFilter && mathFilter !== "all"}
            onPreview={setPreview}
          />
          <ConfirmBtn disabled={selectedId === null} onClick={handleConfirm} />
        </>
      )}
      {preview && <PreviewPopup item={preview} onClose={() => setPreview(null)} />}
    </div>
  );

  return createPortal(panel, document.body);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PanelHeader({ onClose, onDragStart }: { onClose: () => void; onDragStart: (e: React.MouseEvent) => void }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseDown={onDragStart}
      style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "13px 14px 11px", height: 43, flexShrink: 0, boxSizing: "border-box",
        cursor: "grab", userSelect: "none",
      }}
    >
      <span style={{ fontWeight: 700, fontSize: 12.7, lineHeight: "15px", color: "#1B1B1B" }}>
        Select Information
      </span>
      <button
        onClick={onClose}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        aria-label="Close"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 17, height: 17, padding: 3, border: "none",
          background: hov ? "#F0F0F0" : "transparent", borderRadius: 3,
          cursor: "pointer", flexShrink: 0,
        }}
      >
        <CloseIcon />
      </button>
    </div>
  );
}

function TabBar({ activeTab, onChange }: { activeTab: Tab; onChange: (t: Tab) => void }) {
  return (
    <div
      style={{
        display: "flex", justifyContent: "center", alignItems: "flex-start",
        margin: "0 12px", padding: 2, height: 26, background: "#F5F5F5",
        borderRadius: 5, flexShrink: 0,
      }}
    >
      <TabButton label="User Identified" active={activeTab === "user"} onClick={() => onChange("user")} />
      <TabButton label="Speak Logic"     active={activeTab === "sl"}   onClick={() => onChange("sl")}   />
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", flex: 1, height: 22,
        background: active ? "#FFFFFF" : "transparent",
        boxShadow: active ? "0px 1px 3px rgba(0,0,0,0.1)" : "none",
        borderRadius: 4, border: "none", cursor: "pointer",
        fontFamily: "'Inter','Segoe UI',sans-serif", fontWeight: 700, fontSize: 9.8,
        lineHeight: "12px", color: active ? "#1B1B1B" : "#616161", transition: "background 0.1s",
      }}
    >
      {label}
    </button>
  );
}

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", margin: "8px 12px 0", padding: "5px 9px",
        gap: 7, height: 25, background: "#F5F5F5", border: "1px solid #E0E0E0",
        borderRadius: 4, boxSizing: "border-box", flexShrink: 0,
      }}
    >
      <WizardSearchIcon />
      <input
        type="text"
        placeholder="Search information"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1, border: "none", background: "transparent", outline: "none",
          fontFamily: "'Inter','Segoe UI',sans-serif", fontWeight: 400, fontSize: 9.5,
          lineHeight: "11px", color: "#1B1B1B",
        }}
      />
    </div>
  );
}

function MathFilterBar({ value, onChange }: { value: MathFilter; onChange: (v: MathFilter) => void }) {
  const opts: { key: MathFilter; label: string }[] = [
    { key: "all",     label: "All" },
    { key: "nonmath", label: "Non-math" },
    { key: "math",    label: "Math" },
  ];
  return (
    <div style={{
      display: "flex", gap: 2, margin: "8px 12px 0", padding: 2, height: 24,
      background: "#F5F5F5", borderRadius: 5, flexShrink: 0,
    }}>
      {opts.map((o) => {
        const active = value === o.key;
        return (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            style={{
              flex: 1, height: 20, border: "none", borderRadius: 4, cursor: "pointer",
              background: active ? "#FFFFFF" : "transparent",
              boxShadow: active ? "0px 1px 3px rgba(0,0,0,0.1)" : "none",
              fontFamily: "'Inter','Segoe UI',sans-serif", fontWeight: 700, fontSize: 9.3,
              color: active ? "#1B1B1B" : "#616161",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// Read-only preview of an item's full content (typeset math / drawn diagram),
// so the user can look before selecting. Portals over the panel with a backdrop.
function PreviewPopup({ item, onClose }: { item: InfoItem; onClose: () => void }) {
  return createPortal(
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 320 }} onClick={onClose} />
      <div style={{
        position: "fixed", left: "50%", top: "50%", transform: "translate(-50%,-50%)", zIndex: 321,
        width: "min(560px, 92vw)", maxHeight: "86vh", background: "#FFFFFF", borderRadius: 8,
        boxShadow: "0px 12px 40px rgba(0,0,0,0.22)", display: "flex", flexDirection: "column",
        overflow: "hidden", fontFamily: "'Inter','Segoe UI',sans-serif",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "13px 16px", borderBottom: "1px solid #EEE", flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: "#1B1B1B" }}>{item.name}</span>
          <button onClick={onClose} aria-label="Close" style={{
            display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22,
            border: "none", background: "transparent", borderRadius: 4, cursor: "pointer", flexShrink: 0,
          }}>
            <CloseIcon />
          </button>
        </div>
        <div style={{ padding: "12px 18px 18px", overflowY: "auto" }}>
          <HtmlContent html={item.html} style={{ fontSize: 14, lineHeight: 1.6, color: "#1B1B1B" }} />
        </div>
      </div>
    </>,
    document.body
  );
}

function AddItemButton({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
        margin: "8px 12px 0", height: 28, flexShrink: 0,
        background: hov ? "#F0F6FF" : "#FFFFFF", border: "1px dashed #0078D4",
        borderRadius: 4, cursor: "pointer", color: "#0078D4",
        fontFamily: "'Inter','Segoe UI',sans-serif", fontWeight: 700, fontSize: 10,
      }}
    >
      + Add information
    </button>
  );
}

function AddItemForm({ onSave, onCancel }: { onSave: (name: string, html: string) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const canSave = name.trim().length > 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "10px 12px 12px", flex: 1, minHeight: 0 }}>
      <label style={{ fontSize: 10, fontWeight: 700, color: "#5B5B5B" }}>Title</label>
      <input
        type="text"
        value={name}
        autoFocus
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Prior weather report"
        style={{
          height: 28, padding: "0 9px", border: "1px solid #C7C7C7", borderRadius: 4,
          fontSize: 11, fontFamily: "'Inter','Segoe UI',sans-serif", outline: "none",
        }}
      />
      <label style={{ fontSize: 10, fontWeight: 700, color: "#5B5B5B" }}>Content (text, HTML, or LaTeX math)</label>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={"Type or paste content.\nMath example: \\[ a^2 + b^2 = c^2 \\]"}
        style={{
          flex: 1, minHeight: 90, padding: "7px 9px", border: "1px solid #C7C7C7", borderRadius: 4,
          fontSize: 11, fontFamily: "'Inter','Segoe UI',sans-serif", resize: "none", outline: "none",
        }}
      />
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          onClick={onCancel}
          style={{
            height: 28, padding: "0 12px", border: "1px solid #C7C7C7", borderRadius: 4,
            background: "#FFFFFF", cursor: "pointer", fontSize: 10.5, fontWeight: 700, color: "#1B1B1B",
          }}
        >
          Cancel
        </button>
        <button
          onClick={canSave ? () => onSave(name.trim(), body) : undefined}
          disabled={!canSave}
          style={{
            height: 28, padding: "0 14px", border: "none", borderRadius: 4,
            background: canSave ? "#0078D4" : "#B0B0B0", color: "#FFFFFF",
            cursor: canSave ? "pointer" : "default", fontSize: 10.5, fontWeight: 700,
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}

function ItemList({
  items, selectedId, onSelect, removable, onRemove, stripTag, onPreview,
}: {
  items: InfoItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  removable: boolean;
  onRemove?: (id: string) => void;
  stripTag: boolean;
  onPreview: (item: InfoItem) => void;
}) {
  return (
    <div
      style={{
        display: "flex", flexDirection: "column", padding: "4px 12px 4px",
        flex: 1, overflowY: "auto", minHeight: 0, marginTop: 4,
      }}
    >
      {items.length === 0 && (
        <div style={{ padding: "16px 0", fontSize: 10, color: "#ADADAD", textAlign: "center" }}>
          No items found
        </div>
      )}
      {items.map((item, i) => (
        <InfoItemRow
          key={item.id}
          item={item}
          index={i + 1}
          displayName={stripTag ? stripMathTag(item.name) : item.name}
          selected={item.id === selectedId}
          onClick={() => onSelect(item.id)}
          onPreview={() => onPreview(item)}
          removable={removable}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

function InfoItemRow({
  item, index, displayName, selected, onClick, onPreview, removable, onRemove,
}: {
  item: InfoItem;
  index: number;
  displayName: string;
  selected: boolean;
  onClick: () => void;
  onPreview: () => void;
  removable: boolean;
  onRemove?: (id: string) => void;
}) {
  const [hov, setHov] = useState(false);
  // One clean text line for EVERY item (math, diagram, text alike). LaTeX
  // delimiters are stripped so math reads as "a^2" not "\[a^2\]". The full
  // content (typeset math / drawn diagram) renders in the preview popup.
  const preview = htmlToText(item.html).replace(/\\\(|\\\)|\\\[|\\\]/g, "").trim();
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 6, padding: "7px 8px",
        borderRadius: 5, cursor: "pointer", boxSizing: "border-box",
        border: `1px solid ${selected ? "#0078D4" : "transparent"}`,
        background: selected ? "#F2F9F4" : (hov ? "#F7F7F7" : "transparent"),
        transition: "background 0.1s, border-color 0.1s",
      }}
    >
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{
          fontWeight: 700, fontSize: 10.8, lineHeight: "13px", color: "#1B1B1B",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          <span style={{ color: "#0078D4" }}>{index}.</span> {displayName}
        </span>
        <span style={{
          fontWeight: 400, fontSize: 9.2, lineHeight: "12px", color: preview ? "#616161" : "#ADADAD",
          fontStyle: preview ? "normal" : "italic",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {preview || "(no content)"}
        </span>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onPreview(); }}
        title="Preview"
        aria-label="Preview"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 20, height: 20, flexShrink: 0, border: "1px solid transparent",
          background: "transparent", borderRadius: 4, cursor: "pointer", padding: 0,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#E0E0E0"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "transparent"; }}
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
          <path d="M1 8s2.5-4.5 7-4.5S15 8 15 8s-2.5 4.5-7 4.5S1 8 1 8Z" stroke="#0078D4" strokeWidth="1.1"/>
          <circle cx="8" cy="8" r="1.9" stroke="#0078D4" strokeWidth="1.1"/>
        </svg>
      </button>
      {removable && onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
          title="Remove"
          aria-label="Remove"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 20, height: 20, flexShrink: 0, border: "1px solid transparent",
            background: "transparent", borderRadius: 4, cursor: "pointer", padding: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#E0E0E0"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "transparent"; }}
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M2 3h8M4.5 3V2h3v1M3.5 3l.5 7h4l.5-7" stroke="#D13438" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </div>
  );
}

function ConfirmBtn({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <div style={{ margin: "8px 12px 12px" }}>
      <button
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        onMouseEnter={() => !disabled && setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: 31,
          background: disabled ? "#B0B0B0" : hov ? "#106EBE" : "#0078D4",
          borderRadius: 4, border: "none", cursor: disabled ? "default" : "pointer",
          fontFamily: "'Inter','Segoe UI',sans-serif", fontWeight: 700, fontSize: 10.7,
          lineHeight: "13px", color: "#FFFFFF", transition: "background 0.1s",
        }}
      >
        Select Information
      </button>
    </div>
  );
}
