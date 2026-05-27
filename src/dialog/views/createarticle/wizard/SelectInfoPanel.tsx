// src/dialog/views/createarticle/wizard/SelectInfoPanel.tsx
//
// Floating "Select Information" side panel for wizard Step 6.
// Rendered via createPortal to document.body (position: fixed).
// Tabs: "User Identified" | "Speak Logic"
// Spec: width 300px; box-shadow + border-radius: 8px

import React, { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { ArticleCloseIcon, WizardSearchIcon } from "@/dialog/components/Icons";

export interface InfoItem {
  id:      number;
  name:    string;
  formula: string;
}

interface Props {
  userItems:       InfoItem[];
  speakLogicItems: InfoItem[];
  onSelect:        (item: InfoItem) => void;
  onClose:         () => void;
}

type Tab = "user" | "sl";

export function SelectInfoPanel({ userItems, speakLogicItems, onSelect, onClose }: Props) {
  const [activeTab,    setActiveTab]    = useState<Tab>("user");
  const [search,       setSearch]       = useState("");
  const [selectedId,   setSelectedId]   = useState<number | null>(null);

  const items = activeTab === "user" ? userItems : speakLogicItems;

  const filtered = search
    ? items.filter(
        (i) =>
          i.name.toLowerCase().includes(search.toLowerCase()) ||
          i.formula.toLowerCase().includes(search.toLowerCase())
      )
    : items;

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab);
    setSelectedId(null);
    setSearch("");
  }, []);

  const handleConfirm = useCallback(() => {
    const item = filtered.find((i) => i.id === selectedId);
    if (item) onSelect(item);
  }, [filtered, selectedId, onSelect]);

  const panel = (
    <div
      style={{
        position:     "fixed",
        right:        12,
        top:          90,
        width:        300,
        maxHeight:    431,
        background:   "#FFFFFF",
        boxShadow:    "0px 8px 32px rgba(0,0,0,0.14), 0px 2px 8px rgba(0,0,0,0.06)",
        borderRadius: 8,
        display:      "flex",
        flexDirection: "column",
        zIndex:       200,
        fontFamily:   "'Inter','Segoe UI',sans-serif",
        overflow:     "hidden",
      }}
    >
      <PanelHeader onClose={onClose} />
      <TabBar activeTab={activeTab} onChange={handleTabChange} />
      <SearchBar value={search} onChange={setSearch} />
      <ItemList items={filtered} selectedId={selectedId} onSelect={setSelectedId} />
      <ConfirmBtn disabled={selectedId === null} onClick={handleConfirm} />
    </div>
  );

  return createPortal(panel, document.body);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PanelHeader({ onClose }: { onClose: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      style={{
        display:        "flex",
        flexDirection:  "row",
        justifyContent: "space-between",
        alignItems:     "center",
        padding:        "13px 14px 11px",
        height:         43,
        flexShrink:     0,
        boxSizing:      "border-box",
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
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          width:          17,
          height:         17,
          padding:        3,
          border:         "none",
          background:     hov ? "#F0F0F0" : "transparent",
          borderRadius:   3,
          cursor:         "pointer",
          flexShrink:     0,
        }}
      >
        <ArticleCloseIcon />
      </button>
    </div>
  );
}

function TabBar({ activeTab, onChange }: { activeTab: Tab; onChange: (t: Tab) => void }) {
  return (
    <div
      style={{
        display:      "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems:    "flex-start",
        margin:        "0 12px",
        padding:       2,
        height:        26,
        background:    "#F5F5F5",
        borderRadius:  5,
        flexShrink:    0,
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
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        flex:           1,
        height:         22,
        background:     active ? "#FFFFFF" : "transparent",
        boxShadow:      active ? "0px 1px 3px rgba(0,0,0,0.1)" : "none",
        borderRadius:   4,
        border:         "none",
        cursor:         "pointer",
        fontFamily:     "'Inter','Segoe UI',sans-serif",
        fontWeight:     700,
        fontSize:       9.8,
        lineHeight:     "12px",
        color:          active ? "#1B1B1B" : "#616161",
        transition:     "background 0.1s",
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
        display:      "flex",
        flexDirection: "row",
        alignItems:   "center",
        margin:       "8px 12px 0",
        padding:      "5px 9px",
        gap:          7,
        height:       25,
        background:   "#F5F5F5",
        border:       "1px solid #E0E0E0",
        borderRadius: 4,
        boxSizing:    "border-box",
        flexShrink:   0,
      }}
    >
      <WizardSearchIcon />
      <input
        type="text"
        placeholder="Search information"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex:       1,
          border:     "none",
          background: "transparent",
          outline:    "none",
          fontFamily: "'Inter','Segoe UI',sans-serif",
          fontWeight: 400,
          fontSize:   9.5,
          lineHeight: "11px",
          color:      "#1B1B1B",
        }}
      />
    </div>
  );
}

function ItemList({
  items,
  selectedId,
  onSelect,
}: {
  items:      InfoItem[];
  selectedId: number | null;
  onSelect:   (id: number) => void;
}) {
  return (
    <div
      style={{
        display:       "flex",
        flexDirection: "column",
        padding:       "4px 12px 4px",
        flex:          1,
        overflowY:     "auto",
        minHeight:     0,
        marginTop:     4,
      }}
    >
      {items.length === 0 && (
        <div
          style={{
            padding:    "16px 0",
            fontFamily: "'Inter','Segoe UI',sans-serif",
            fontSize:   10,
            color:      "#ADADAD",
            textAlign:  "center",
          }}
        >
          No items found
        </div>
      )}
      {items.map((item) => (
        <InfoItemRow
          key={item.id}
          item={item}
          selected={item.id === selectedId}
          onClick={() => onSelect(item.id)}
        />
      ))}
    </div>
  );
}

function InfoItemRow({
  item,
  selected,
  onClick,
}: {
  item:     InfoItem;
  selected: boolean;
  onClick:  () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display:       "flex",
        flexDirection: "column",
        alignItems:    "flex-start",
        padding:       "8px 0",
        gap:           2,
        width:         "100%",
        border:        "none",
        borderRadius:  4,
        background:    selected ? "#F0FFF4" : "transparent",
        cursor:        "pointer",
        textAlign:     "left",
        boxSizing:     "border-box",
      }}
    >
      <span
        style={{
          fontFamily: "'Inter','Segoe UI',sans-serif",
          fontWeight:  700,
          fontSize:    10.8,
          lineHeight:  "13px",
          color:       "#1B1B1B",
          alignSelf:   "stretch",
        }}
      >
        {item.name}
      </span>
      <span
        style={{
          fontFamily: "'Inter','Segoe UI',sans-serif",
          fontWeight:  400,
          fontSize:    9.2,
          lineHeight:  "11px",
          color:       "#616161",
          alignSelf:   "stretch",
        }}
      >
        {item.formula}
      </span>
    </button>
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
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          width:          "100%",
          height:         31,
          background:     disabled ? "#B0B0B0" : hov ? "#106EBE" : "#0078D4",
          borderRadius:   4,
          border:         "none",
          cursor:         disabled ? "default" : "pointer",
          fontFamily:     "'Inter','Segoe UI',sans-serif",
          fontWeight:     700,
          fontSize:       10.7,
          lineHeight:     "13px",
          color:          "#FFFFFF",
          transition:     "background 0.1s",
        }}
      >
        Select Information
      </button>
    </div>
  );
}
