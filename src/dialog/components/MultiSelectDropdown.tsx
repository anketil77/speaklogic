// src/dialog/components/MultiSelectDropdown.tsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { colors } from "@/styles/tokens";

export interface MultiSelectItem {
  /** Unique identifier — used for selection so duplicate labels stay distinct. */
  id: number;
  label: string;
  /** Optional secondary line (e.g., email under a person's name). */
  sublabel?: string;
}

interface MultiSelectDropdownProps {
  options: MultiSelectItem[];
  /** Selected item ids. */
  value: number[];
  onChange: (value: number[]) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

const CHEVRON = `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23616161' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`;

export function MultiSelectDropdown({
  options,
  value,
  onChange,
  placeholder = "-- Select person(s) --",
  style,
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const toggle = useCallback(() => setOpen((o) => !o), []);

  const handleCheck = useCallback(
    (id: number, checked: boolean) => {
      onChange(checked ? [...value, id] : value.filter((v) => v !== id));
    },
    [value, onChange],
  );

  // Close on outside click (capture phase)
  useEffect(() => {
    if (!open) return undefined;
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [open]);

  const selectedLabels = useMemo(() => {
    const byId = new Map(options.map((o) => [o.id, o.label]));
    return value.map((id) => byId.get(id) ?? "").filter(Boolean);
  }, [value, options]);

  const label =
    selectedLabels.length === 0
      ? placeholder
      : selectedLabels.length === 1
        ? selectedLabels[0]
        : `${selectedLabels[0]} (+${selectedLabels.length - 1} more)`;

  const triggerStyle: React.CSSProperties = {
    width: "100%",
    height: "32px",
    border: "1px solid #C7C7C7",
    borderRadius: open ? "4px 4px 0 0" : "4px",
    padding: "0 32px 0 11px",
    fontSize: "11.4px",
    fontFamily: "inherit",
    color: selectedLabels.length === 0 ? colors.grey38 : colors.grey11,
    background: `${colors.white} ${CHEVRON} no-repeat right 11px center`,
    outline: "none",
    boxSizing: "border-box",
    cursor: "pointer",
    textAlign: "left",
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    ...style,
  };

  const panelStyle: React.CSSProperties = {
    position: "absolute",
    top: "32px",
    left: 0,
    right: 0,
    background: colors.white,
    border: "1px solid #C7C7C7",
    borderTop: "none",
    borderRadius: "0 0 4px 4px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.10)",
    zIndex: 300,
    maxHeight: "200px",
    overflowY: "auto",
  };

  const emptyStyle: React.CSSProperties = {
    padding: "10px 12px",
    fontSize: "11.4px",
    color: colors.grey38,
    fontFamily: "inherit",
  };

  const itemStyle = (checked: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 12px",
    fontSize: "11.4px",
    color: colors.grey11,
    fontFamily: "inherit",
    cursor: "pointer",
    background: checked ? "#EBF3FC" : "transparent",
    userSelect: "none",
  });

  return (
    <div ref={rootRef} style={{ position: "relative", flex: 1 }}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="listbox"
        style={triggerStyle}
        title={selectedLabels.join(", ") || placeholder}
      >
        {label}
      </button>

      {open && (
        <div style={panelStyle} role="listbox" aria-multiselectable="true">
          {options.length === 0 ? (
            <div style={emptyStyle}>No people configured. Add via Communication Config.</div>
          ) : (
            options.map((opt) => {
              const checked = value.includes(opt.id);
              return (
                <div
                  key={opt.id}
                  role="option"
                  aria-selected={checked}
                  style={itemStyle(checked)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleCheck(opt.id, !checked);
                  }}
                  title={opt.sublabel ? `${opt.label} <${opt.sublabel}>` : opt.label}
                >
                  <input
                    type="checkbox"
                    readOnly
                    checked={checked}
                    tabIndex={-1}
                    style={{ accentColor: colors.azure42, cursor: "pointer", margin: 0 }}
                  />
                  <span style={{ display: "flex", flexDirection: "column", gap: "1px", minWidth: 0, flex: 1 }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{opt.label}</span>
                    {opt.sublabel && (
                      <span style={{ fontSize: "10.4px", color: colors.grey38, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {opt.sublabel}
                      </span>
                    )}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
