import React, { useState, useRef, useEffect } from "react";

type SaveAction = "RetainAnalysisAsNeed" | "ProvideFeedbackWithAnalysis" | "ApplyAnalysisAsFeedback";

interface SaveSplitButtonProps {
  onSave: (action: SaveAction) => void;
}

const ITEMS: { label: string; action: SaveAction }[] = [
  { label: "Provide Feedback", action: "ProvideFeedbackWithAnalysis" },
  { label: "Apply as Feedback", action: "ApplyAnalysisAsFeedback" },
  { label: "Retain Analysis",   action: "RetainAnalysisAsNeed" },
];

const BG_DEFAULT = "#0078D4";
const BG_HOVER   = "#106EBE";

export function SaveSplitButton({ onSave }: SaveSplitButtonProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  return (
    <div style={{ position: "relative", flexShrink: 0 }} ref={containerRef}>
      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            bottom: "calc(100% + 4px)",
            right: 0,
            background: "#FFFFFF",
            border: "1px solid #E0E0E0",
            borderRadius: 4,
            boxShadow: "0px 4px 16px rgba(0,0,0,0.12)",
            zIndex: 300,
            minWidth: 178,
          }}
        >
          {ITEMS.map(({ label, action }) => (
            <button
              key={action}
              role="menuitem"
              onClick={() => { setOpen(false); onSave(action); }}
              style={{ display: "block", width: "100%", padding: "9px 15px", background: "none", border: "none", textAlign: "left", fontSize: "12.3px", color: "#1B1B1B", cursor: "pointer", fontFamily: "inherit" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#F5F5F5")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", height: "32px", borderRadius: 4, overflow: "hidden" }}>
        <button
          style={{ padding: "0 16px", background: BG_DEFAULT, border: "none", color: "#FFFFFF", fontSize: "12.7px", fontWeight: 700, fontFamily: "inherit", cursor: "pointer", whiteSpace: "nowrap" }}
          onClick={() => onSave("RetainAnalysisAsNeed")}
          onMouseEnter={e => (e.currentTarget.style.background = BG_HOVER)}
          onMouseLeave={e => (e.currentTarget.style.background = BG_DEFAULT)}
        >
          Save
        </button>
        <div style={{ width: 1, background: "rgba(255,255,255,0.35)", alignSelf: "stretch", margin: "7px 0" }} />
        <button
          style={{ width: 26, background: BG_DEFAULT, border: "none", color: "#FFFFFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, fontSize: "10px" }}
          onClick={() => setOpen(o => !o)}
          onMouseEnter={e => (e.currentTarget.style.background = BG_HOVER)}
          onMouseLeave={e => (e.currentTarget.style.background = BG_DEFAULT)}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          ▾
        </button>
      </div>
    </div>
  );
}
