// src/dialog/views/HelpView.tsx
// ?view=help — static help topics viewer.
// C# ref: HelpDocuments/analysis-communication-help/index.html + article-help/index.html

import React, { useState } from "react";

const ANALYSIS_TOPICS = [
  { title: "Analysis",                  desc: "How to create and manage analysis entries for document selections." },
  { title: "Analysis Question",         desc: "Adding questions to an analysis and tracking responses." },
  { title: "Answer Question",           desc: "Responding to and viewing answers for analysis questions." },
  { title: "Compensator",               desc: "Identifying compensators that replace errors in communication." },
  { title: "Correction of Error",       desc: "Documenting how identified errors were corrected." },
  { title: "Error Identification",      desc: "Identifying and classifying communication errors in a selection." },
  { title: "Feedback",                  desc: "Applying, providing, and requesting feedback on analyses." },
  { title: "Problem Solving",           desc: "Identifying problems and linking solutions to applied feedback." },
  { title: "Recommended Documentation", desc: "Additional documentation and references for the Speak Logic methodology." },
];

const ARTICLE_TOPICS = [
  { title: "Creating an Article",      desc: "How to create a new article using direct entry or the article wizard." },
  { title: "Article Templates",        desc: "Choosing a template (Non-Sport & Game, Sport & Game, or Product Reviews) and filling in wizard steps." },
  { title: "Listing Articles",         desc: "Viewing, filtering, and managing saved articles." },
  { title: "Article Examples",         desc: "Sample articles: Mississippi River Drought, Michigan State University Football Games, Will Smith Incident, Asia Womack Basketball Game." },
];

export default function HelpView() {
  const [activeSection, setActiveSection] = useState<"analysis" | "article">("analysis");

  return (
    <div
      style={{
        display:       "flex",
        flexDirection: "column",
        height:        "100vh",
        background:    "#FFFFFF",
        fontFamily:    "'Inter','Segoe UI',sans-serif",
        overflow:      "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display:      "flex",
          alignItems:   "center",
          padding:      "0 16px",
          height:       52,
          background:   "#0078D4",
          flexShrink:   0,
        }}
      >
        <HelpIcon />
        <div style={{ marginLeft: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 13.4, color: "#FFFFFF" }}>Speak Logic Help</div>
          <div style={{ fontWeight: 400, fontSize: 10.8, color: "#D0E8FA", marginTop: 1 }}>
            Reference guide for all add-in features
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div
        style={{
          display:       "flex",
          flexDirection: "row",
          borderBottom:  "2px solid #E0E0E0",
          flexShrink:    0,
          background:    "#FAFAFA",
        }}
      >
        {(["analysis", "article"] as const).map((sec) => {
          const label = sec === "analysis" ? "Analysis & Communication" : "Article";
          const active = activeSection === sec;
          return (
            <button
              key={sec}
              onClick={() => setActiveSection(sec)}
              style={{
                padding:       "9px 18px",
                border:        "none",
                background:    "transparent",
                cursor:        "pointer",
                fontFamily:    "'Inter','Segoe UI',sans-serif",
                fontWeight:    active ? 700 : 400,
                fontSize:      11.4,
                color:         active ? "#0078D4" : "#616161",
                borderBottom:  active ? "2px solid #0078D4" : "2px solid transparent",
                marginBottom:  -2,
                flexShrink:    0,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Topic list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
        <div style={{ fontWeight: 700, fontSize: 10.8, color: "#616161", letterSpacing: "0.05em", marginBottom: 8 }}>
          {activeSection === "analysis" ? "ANALYSIS AND COMMUNICATION HELP" : "ARTICLE HELP"}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {(activeSection === "analysis" ? ANALYSIS_TOPICS : ARTICLE_TOPICS).map((topic) => (
            <div
              key={topic.title}
              style={{
                display:      "flex",
                flexDirection: "row",
                alignItems:   "flex-start",
                gap:          10,
                padding:      "9px 12px",
                background:   "#F9F9F9",
                border:       "1px solid #E8E8E8",
                borderRadius: 5,
              }}
            >
              <ArrowIcon />
              <div>
                <div style={{ fontWeight: 700, fontSize: 11.6, color: "#1B1B1B", lineHeight: "16px" }}>
                  {topic.title}
                </div>
                <div style={{ fontWeight: 400, fontSize: 10.8, color: "#616161", lineHeight: "15px", marginTop: 2 }}>
                  {topic.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HelpIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="#FFFFFF" strokeWidth="1.6"/>
      <path d="M9.5 9.5C9.5 8.12 10.62 7 12 7s2.5 1.12 2.5 2.5c0 1.4-1 2-2 2.5V13" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round"/>
      <circle cx="12" cy="16" r="0.8" fill="#FFFFFF"/>
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
      <path d="M3 7h8M8 4l3 3-3 3" stroke="#0078D4" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
