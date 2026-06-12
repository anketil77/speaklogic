import React, { useState, useRef, useEffect, useMemo } from "react";
import type { ContactPerson } from "@/types/db";

const inputStyle: React.CSSProperties = {
  width: "100%", height: "32px", border: "1px solid #C7C7C7", borderRadius: "4px",
  padding: "0 11px", fontSize: "11.4px", fontFamily: "inherit", color: "#1B1B1B",
  background: "#FFFFFF", outline: "none", boxSizing: "border-box",
};

export interface PersonComboBoxProps {
  value: string;
  /** Called whenever the input changes. When the user picks an existing
   *  contact, both name and email are provided so the form can fill both at once.
   *  Free-text typing passes only the name (email left undefined → keep existing). */
  onChange: (name: string, email?: string) => void;
  /** Preferred: full contact records so duplicate names are distinguished by email. */
  contacts?: ContactPerson[];
  /** Legacy fallback when `contacts` is not provided. */
  suggestions?: string[];
  placeholder?: string;
}

export function PersonComboBox({ value, onChange, contacts, suggestions, placeholder }: PersonComboBoxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  const items: ContactPerson[] = useMemo(() => {
    if (contacts && contacts.length > 0) return contacts;
    if (suggestions && suggestions.length > 0) {
      return suggestions.map((name, i) => ({ id: -(i + 1), personName: name, emailAddress: "" }));
    }
    return [];
  }, [contacts, suggestions]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((c) =>
      c.personName.toLowerCase().includes(q) ||
      (c.emailAddress ?? "").toLowerCase().includes(q)
    );
  }, [query, items]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, []);

  const hasItems = items.length > 0;

  return (
    <div ref={wrapperRef} style={{ position: "relative", flex: 1 }}>
      <input
        style={{ ...inputStyle, paddingRight: "32px" }}
        value={query}
        placeholder={placeholder}
        onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => { if (hasItems) setOpen(true); }}
        onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
      />
      {hasItems && (
        <span style={{ position: "absolute", right: "11px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
            <path d="M1 1L5 5L9 1" stroke="#616161" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
      {open && filtered.length > 0 && (
        <div style={{ position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0, background: "#FFF", border: "1px solid #C7C7C7", borderRadius: "4px", boxShadow: "0px 4px 12px rgba(0,0,0,0.12)", zIndex: 300, maxHeight: "200px", overflowY: "auto" }}>
          {filtered.map((c) => {
            const selected = c.personName === value;
            return (
              <div
                key={c.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(c.personName, c.emailAddress);
                  setQuery(c.personName);
                  setOpen(false);
                }}
                style={{
                  padding: "6px 12px", fontSize: "11.4px", color: "#1B1B1B", cursor: "pointer",
                  background: selected ? "#EBF3FC" : undefined,
                  display: "flex", flexDirection: "column", gap: "1px",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#EBF3FC")}
                onMouseLeave={(e) => (e.currentTarget.style.background = selected ? "#EBF3FC" : "")}
                title={c.emailAddress ? `${c.personName} <${c.emailAddress}>` : c.personName}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.personName}
                </span>
                {c.emailAddress && (
                  <span style={{ fontSize: "10.4px", color: "#616161", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.emailAddress}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
