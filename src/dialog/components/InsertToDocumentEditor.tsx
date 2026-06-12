// src/dialog/components/InsertToDocumentEditor.tsx
//
// Wraps RichEditor with a single right-click menu item:
// "Insert Selected Text to Document". Used by Apply Feedback (Feedback Application)
// and Provide Feedback (Actual Feedback Provided) editors so the menu stays in
// sync across both surfaces.

import React, { useLayoutEffect, useRef, useState } from "react";
import { RichEditor } from "@/dialog/components/RichEditor";

const ctxItemStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "7px 14px",
  textAlign: "left",
  background: "transparent",
  border: "none",
  fontSize: "12.2px",
  fontFamily: "inherit",
  color: "#1B1B1B",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

export interface InsertToDocumentEditorProps {
  value: string;
  onChange: (html: string) => void;
  editorRef: React.RefObject<HTMLDivElement>;
  placeholder?: string;
  onInsertToDocument: (text: string, html: string) => void;
}

// Capture both plain text and the HTML fragment of the current selection. The
// HTML is what preserves the editor's formatting (bold, headings, lists) when
// the host calls Word.insertHtml on the document side.
function getSelectionHtml(sel: Selection | null): string {
  if (!sel || sel.rangeCount === 0) return "";
  const range = sel.getRangeAt(0);
  const fragment = range.cloneContents();
  const wrapper = document.createElement("div");
  wrapper.appendChild(fragment);
  return wrapper.innerHTML;
}

export function InsertToDocumentEditor({
  value,
  onChange,
  editorRef,
  placeholder,
  onInsertToDocument,
}: InsertToDocumentEditorProps) {
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; text: string; html: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    const sel = window.getSelection();
    const text = sel?.toString().trim() ?? "";
    const html = getSelectionHtml(sel);
    setCtxMenu({ x: e.clientX, y: e.clientY, text, html });
  }

  // Clamp menu position into the viewport (flip upward / left if it would overflow).
  useLayoutEffect(() => {
    if (!ctxMenu || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const margin = 8;
    let x = ctxMenu.x;
    let y = ctxMenu.y;
    if (x + rect.width + margin > window.innerWidth) {
      x = Math.max(margin, window.innerWidth - rect.width - margin);
    }
    if (y + rect.height + margin > window.innerHeight) {
      y = Math.max(margin, ctxMenu.y - rect.height);
    }
    if (x !== ctxMenu.x || y !== ctxMenu.y) setCtxMenu({ ...ctxMenu, x, y });
  }, [ctxMenu]);

  return (
    <div onContextMenu={handleContextMenu} style={{ position: "relative" }}>
      <RichEditor
        ref={editorRef}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        htmlContentStyling
        sanitizeOnPaste
      />
      {ctxMenu && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 9998 }}
            onClick={() => setCtxMenu(null)}
          />
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              left: ctxMenu.x,
              top: ctxMenu.y,
              zIndex: 9999,
              background: "#FFFFFF",
              border: "1px solid #E0E0E0",
              borderRadius: 4,
              boxShadow: "0 4px 16px rgba(0,0,0,0.14)",
              minWidth: 260,
              overflow: "hidden",
              fontFamily: "'Inter', 'Segoe UI', sans-serif",
            }}
          >
            <button
              disabled={!ctxMenu.text}
              style={{ ...ctxItemStyle, opacity: ctxMenu.text ? 1 : 0.4, cursor: ctxMenu.text ? "pointer" : "default" }}
              onMouseEnter={(e) => { if (ctxMenu.text) (e.currentTarget as HTMLButtonElement).style.background = "#F5F5F5"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              onClick={() => { onInsertToDocument(ctxMenu.text, ctxMenu.html); setCtxMenu(null); }}
            >
              Insert Selected Text to Document
            </button>
          </div>
        </>
      )}
    </div>
  );
}
