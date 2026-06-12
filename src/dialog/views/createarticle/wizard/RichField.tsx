// src/dialog/views/createarticle/wizard/RichField.tsx
//
// Shared rich-text field for the Article Wizard. Pairs RichTextToolbar with a
// RichEditor that opts in to .sl-html-content styling and paste sanitization,
// and always renders full-width so it fits flush inside a SectionBox body.
// Use this for every long-form text field in the wizard so the editing
// experience stays consistent across steps.

import React, { useRef } from "react";
import { RichTextToolbar } from "@/dialog/components/RichTextToolbar";
import { RichEditor }      from "@/dialog/components/RichEditor";

interface RichFieldProps {
  placeholder: string;
  value:       string;
  onChange:    (html: string) => void;
  /** Editor min-height in pixels. Default 78 (textarea-equivalent). */
  minHeight?:  number;
}

export function RichField({ placeholder, value, onChange, minHeight = 78 }: RichFieldProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  return (
    <div
      style={{
        width:        "100%",
        boxSizing:    "border-box",
        border:       "1px solid #C7C7C7",
        borderRadius: 6,
        background:   "#FFFFFF",
      }}
    >
      <div
        style={{
          borderBottom: "1px solid #E0E0E0",
          padding:      "4px 8px",
          boxSizing:    "border-box",
        }}
      >
        <RichTextToolbar editorRef={editorRef} />
      </div>
      <div style={{ width: "100%", padding: "8px 11px", boxSizing: "border-box" }}>
        <RichEditor
          ref={editorRef}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          htmlContentStyling
          sanitizeOnPaste
          style={{
            width:      "100%",
            minHeight,
            fontSize:   12,
            lineHeight: "18px",
            outline:    "none",
            border:     "none",
            padding:    0,
          }}
        />
      </div>
    </div>
  );
}
