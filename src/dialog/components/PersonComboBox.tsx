import React, { useState, useRef, useEffect, useMemo } from "react";

const inputStyle: React.CSSProperties = {
  width: "100%", height: "32px", border: "1px solid #C7C7C7", borderRadius: "4px",
  padding: "0 11px", fontSize: "11.4px", fontFamily: "inherit", color: "#1B1B1B",
  background: "#FFFFFF", outline: "none", boxSizing: "border-box",
};

export function PersonComboBox({ value, onChange, suggestions, placeholder }: {
  value: string;
  onChange: (name: string) => void;
  suggestions: string[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  const filtered = useMemo(() => {
    if (!query.trim()) return suggestions;
    const q = query.toLowerCase();
    return suggestions.filter((s) => s.toLowerCase().includes(q));
  }, [query, suggestions]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, []);

  return (
    <div ref={wrapperRef} style={{ position: "relative", flex: 1 }}>
      <input
        style={{ ...inputStyle, paddingRight: "32px" }}
        value={query}
        placeholder={placeholder}
        onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
        onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
      />
      {suggestions.length > 0 && (
        <span style={{ position: "absolute", right: "11px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
            <path d="M1 1L5 5L9 1" stroke="#616161" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
      {open && filtered.length > 0 && (
        <div style={{ position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0, background: "#FFF", border: "1px solid #C7C7C7", borderRadius: "4px", boxShadow: "0px 4px 12px rgba(0,0,0,0.12)", zIndex: 300, maxHeight: "180px", overflowY: "auto" }}>
          {filtered.map((name) => (
            <div
              key={name}
              onMouseDown={(e) => { e.preventDefault(); onChange(name); setQuery(name); setOpen(false); }}
              style={{ padding: "7px 12px", fontSize: "11.4px", color: "#1B1B1B", cursor: "pointer", background: name === value ? "#EBF3FC" : undefined }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#EBF3FC")}
              onMouseLeave={(e) => (e.currentTarget.style.background = name === value ? "#EBF3FC" : "")}
            >
              {name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
