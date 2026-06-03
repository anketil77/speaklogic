// src/dialog/views/createarticle/TemplatePickerPanel.tsx
//
// Full-screen dialog view rendered at ?view=template-picker.
// Fills the Office.js dialog window edge-to-edge (no floating card).
// Native OS chrome provides the window X — no custom close button here.
// Messages: BACK · TEMPLATE_CONFIRMED.

import React, { useState, useCallback } from "react";
import { FooterBar, DismissBtn, PrimaryBtn } from "@/dialog/components/FooterButtons";
import { TplBackIcon, TplDocIcon } from "@/dialog/components/Icons";
import { useDialogComm } from "@/dialog/hooks/useDialogComm";
import {
  CATEGORY_DATA,
  TEMPLATES,
  type TemplateCategory,
  type TemplateItem,
  type CategoryDef,
} from "./templatePickerData";

export default function TemplatePickerPanel() {
  const { sendMessage } = useDialogComm();

  const [activeCat,   setActiveCat]   = useState<TemplateCategory>("non-sport");
  const [selectedTpl, setSelectedTpl] = useState("");

  const handleCatChange = useCallback((id: TemplateCategory) => {
    setActiveCat(id);
    setSelectedTpl("");
  }, []);

  const handleConfirm = useCallback(() => {
    if (!selectedTpl) return;
    sendMessage({ action: "TEMPLATE_CONFIRMED", templateName: selectedTpl, category: activeCat });
  }, [sendMessage, selectedTpl, activeCat]);

  const handleBack = useCallback(() => {
    sendMessage({ action: "BACK" });
  }, [sendMessage]);

  const handleCancel = useCallback(() => {
    sendMessage({ action: "CLOSE" });
  }, [sendMessage]);

  return (
    <div
      style={{
        width:         "100%",
        height:        "100vh",
        background:    "#FFFFFF",
        display:       "flex",
        flexDirection: "column",
        fontFamily:    "'Inter','Segoe UI',sans-serif",
        overflow:      "hidden",
        boxSizing:     "border-box",
      }}
    >
      <PanelHeader onBack={handleBack} />
      <CategoryStrip activeCat={activeCat} onChange={handleCatChange} />
      <TemplateList
        templates={TEMPLATES[activeCat]}
        selectedTpl={selectedTpl}
        onSelect={setSelectedTpl}
      />
      <PanelFooter onConfirm={handleConfirm} onCancel={handleCancel} disabled={!selectedTpl} />
    </div>
  );
}

function PanelHeader({ onBack }: { onBack: () => void }) {
  return (
    <div
      style={{
        display:        "flex",
        flexDirection:  "row",
        alignItems:     "center",
        padding:        "13px 16px 12px",
        height:         44,
        flexShrink:     0,
        boxSizing:      "border-box",
      }}
    >
      {/* Back button — 13px icon in 17px hit-area */}
      <button onClick={onBack} aria-label="Back" style={squareBtnStyle(17, 2, false)}>
        <TplBackIcon />
      </button>

      {/* Title — centred in remaining space */}
      <span
        style={{
          flex:       1,
          textAlign:  "center",
          fontWeight: 700,
          fontSize:   12.6,
          lineHeight: "15px",
          color:      "#1B1B1B",
        }}
      >
        Select Template
      </span>

      {/* Right spacer matches back button width so title stays centred */}
      <div style={{ width: 17, flexShrink: 0 }} />
    </div>
  );
}

function CategoryStrip({
  activeCat,
  onChange,
}: {
  activeCat: TemplateCategory;
  onChange:  (id: TemplateCategory) => void;
}) {
  return (
    <div
      style={{
        display:       "flex",
        flexDirection: "column",
        padding:       "12px 16px 11px",
        gap:           9,
        flexShrink:    0,
      }}
    >
      <span
        style={{
          fontWeight:    700,
          fontSize:      9,
          lineHeight:    "11px",
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color:         "#616161",
        }}
      >
        Article Category
      </span>

      <div style={{ display: "flex", flexDirection: "row", gap: 12 }}>
        {CATEGORY_DATA.map((cat) => (
          <CategoryBtn
            key={cat.id}
            def={cat}
            active={activeCat === cat.id}
            onClick={onChange}
          />
        ))}
      </div>
    </div>
  );
}

function CategoryBtn({
  def,
  active,
  onClick,
}: {
  def:    CategoryDef;
  active: boolean;
  onClick:(id: TemplateCategory) => void;
}) {
  const { id, label, Icon } = def;
  const color = active ? "#0078D4" : "#616161";

  return (
    <button
      onClick={() => onClick(id)}
      aria-pressed={active}
      aria-label={label}
      style={{
        display:       "flex",
        flexDirection: "column",
        alignItems:    "center",
        gap:           5.34,
        width:         76,
        padding:       0,
        border:        "none",
        background:    "transparent",
        cursor:        "pointer",
        flexShrink:    0,
      }}
    >
      {/* Icon box */}
      <div
        style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          width:          72,
          height:         58,
          background:     active ? "#EBF3FC" : "#FFFFFF",
          border:         `2px solid ${active ? "#0078D4" : "#E0E0E0"}`,
          borderRadius:   8,
          boxSizing:      "border-box",
        }}
      >
        <Icon color={color} />
      </div>

      {/* Label */}
      <span
        style={{
          fontWeight: 700,
          fontSize:   8.9,
          lineHeight: "12px",
          textAlign:  "center",
          color:      color,
          maxWidth:   76,
          padding:    "0 11.3px",
          boxSizing:  "border-box",
        }}
      >
        {label}
      </span>
    </button>
  );
}

function TemplateList({
  templates,
  selectedTpl,
  onSelect,
}: {
  templates:   TemplateItem[];
  selectedTpl: string;
  onSelect:    (name: string) => void;
}) {
  return (
    <div
      style={{
        display:       "flex",
        flexDirection: "column",
        padding:       "8px 16px",
        flex:          1,
        overflowY:     "auto",
        minHeight:     0,
      }}
    >
      {templates.map((tpl) => (
        <TemplateRow
          key={tpl.name}
          template={tpl}
          selected={selectedTpl === tpl.name}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function TemplateRow({
  template,
  selected,
  onSelect,
}: {
  template: TemplateItem;
  selected: boolean;
  onSelect: (name: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={() => onSelect(template.name)}
      aria-pressed={selected}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:       "flex",
        flexDirection: "row",
        alignItems:    "flex-start",
        padding:       "10px 6px",
        gap:           11,
        width:         "100%",
        border:        "none",
        borderRadius:  4,
        background:    selected ? "#EBF3FC" : hovered ? "#F5F5F5" : "transparent",
        cursor:        "pointer",
        textAlign:     "left",
        boxSizing:     "border-box",
        flexShrink:    0,
      }}
    >
      {/* Icon — 1px top nudge aligns icon cap-height with text baseline */}
      <div style={{ paddingTop: 1, flexShrink: 0 }}>
        <div
          style={{
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            width:          28,
            height:         28,
            background:     "#EBF3FC",
            borderRadius:   5,
          }}
        >
          <TplDocIcon />
        </div>
      </div>

      {/* Name + description */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
        <span style={{ fontWeight: 700, fontSize: 12, lineHeight: "16px", color: "#1B1B1B" }}>
          {template.name}
        </span>
        <span style={{ fontWeight: 400, fontSize: 9.2, lineHeight: "15px", color: "#616161" }}>
          {template.desc}
        </span>
      </div>
    </button>
  );
}

function PanelFooter({
  onConfirm,
  onCancel,
  disabled,
}: {
  onConfirm: () => void;
  onCancel:  () => void;
  disabled:  boolean;
}) {
  return (
    <FooterBar>
      <DismissBtn label="Cancel" onClick={onCancel} />
      <PrimaryBtn label="Select Template" onClick={onConfirm} disabled={disabled} />
    </FooterBar>
  );
}

function squareBtnStyle(
  size:    number,
  padding: number,
  hovered: boolean,
): React.CSSProperties {
  return {
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    width:          size,
    height:         size,
    padding:        padding,
    border:         "none",
    background:     hovered ? "#F0F0F0" : "transparent",
    borderRadius:   3,
    cursor:         "pointer",
    flexShrink:     0,
    boxSizing:      "border-box",
    transition:     "background 0.1s",
  };
}
