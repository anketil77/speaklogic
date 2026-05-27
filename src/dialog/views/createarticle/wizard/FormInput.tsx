// src/dialog/views/createarticle/wizard/FormInput.tsx
//
// Shared styled input used across all wizard steps.
// Spec: border: 1px solid #C7C7C7; border-radius: 4px; padding: 7px 9px;
//       height: 30px; placeholder color: #757575; font-size 11.4px

import React from "react";

interface Props {
  placeholder: string;
  value:       string;
  onChange:    (v: string) => void;
  style?:      React.CSSProperties;
  type?:       string;
  /** Highlight red border on error. */
  error?:      boolean;
}

export function FormInput({
  placeholder,
  value,
  onChange,
  style,
  type = "text",
  error = false,
}: Props) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        boxSizing:    "border-box",
        display:      "flex",
        width:        "100%",
        height:       30,
        padding:      "7px 9px",
        background:   "#FFFFFF",
        border:       `1px solid ${error ? "#D13438" : "#C7C7C7"}`,
        borderRadius: 4,
        fontFamily:   "'Inter','Segoe UI',sans-serif",
        fontWeight:   400,
        fontSize:     11.4,
        lineHeight:   "14px",
        color:        "#1B1B1B",
        outline:      "none",
        ...style,
      }}
    />
  );
}
