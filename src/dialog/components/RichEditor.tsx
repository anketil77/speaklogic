// src/dialog/components/RichEditor.tsx
import React, { useEffect, useRef, useImperativeHandle } from "react";

const STYLE_ID = "__rte_placeholder__";

function injectPlaceholderCSS() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent =
    ".rte-field[data-placeholder]:empty::before{" +
    "content:attr(data-placeholder);" +
    "color:#BDBDBD;" +
    "pointer-events:none;" +
    "display:block;" +
    "}" +
    ".rte-field ul,.rte-field ol{margin:0.25em 0;padding-left:1.8em;}" +
    ".rte-field li{margin:0;}" +
    ".rte-field ol.rte-outline>li{list-style-type:decimal;}" +
    ".rte-field ol.rte-outline ol>li{list-style-type:lower-alpha;}" +
    ".rte-field ol.rte-outline ol ol>li{list-style-type:lower-roman;}" +
    ".sl-find-match{background:#FFF176;border-radius:1px;}" +
    ".sl-find-active{background:#FFB300;}" +
    ".sl-spell-error{text-decoration:underline wavy #D13438;text-underline-offset:2px;}" +
    ".sl-spell-current{background:#FDE8E8;text-decoration:underline wavy #D13438;text-underline-offset:2px;outline:1px solid #D13438;border-radius:1px;}" +
    "@media print{" +
    "body *{visibility:hidden;}" +
    ".sl-print-region{visibility:visible;position:absolute;top:0;left:0;width:100%;border:none!important;padding:0!important;outline:none!important;box-shadow:none!important;}" +
    ".sl-print-region *{visibility:visible;}" +
    "}" +
    "@page{margin:0.75in;}";
  document.head.appendChild(s);
}

export interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
  style?: React.CSSProperties;
  placeholder?: string;
}

export const RichEditor = React.forwardRef<HTMLDivElement, RichEditorProps>(
  ({ value, onChange, style, placeholder }, ref) => {
    const innerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => innerRef.current!);

    useEffect(() => {
      injectPlaceholderCSS();
    }, []);

    // Sync DOM when value changes externally.
    // Setting innerHTML programmatically does NOT fire input events, so no loop risk.
    useEffect(() => {
      const el = innerRef.current;
      if (!el || el.innerHTML === value) return;
      el.innerHTML = value;
    }, [value]);

    function handleInput() {
      if (innerRef.current) {
        onChange(innerRef.current.innerHTML);
      }
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
      if (e.key !== "Tab") return;
      const sel = window.getSelection();
      if (!sel || !sel.anchorNode) return;
      let node: Node | null = sel.anchorNode;
      while (node && node !== innerRef.current) {
        if ((node as Element).tagName === "LI") {
          e.preventDefault();
          e.stopPropagation();
          // eslint-disable-next-line @typescript-eslint/no-deprecated
          document.execCommand(e.shiftKey ? "outdent" : "indent", false, undefined);
          innerRef.current?.focus();
          return;
        }
        node = node.parentNode;
      }
    }

    return (
      <div
        ref={innerRef}
        contentEditable
        suppressContentEditableWarning
        className="rte-field"
        data-placeholder={placeholder}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        style={{
          minHeight: "96px",
          width: "100%",
          border: "1px solid #C7C7C7",
          borderRadius: "4px",
          padding: "9px 11px",
          fontSize: "12.3px",
          fontFamily: "inherit",
          color: "#1B1B1B",
          background: "#FFFFFF",
          outline: "none",
          boxSizing: "border-box",
          overflowY: "auto",
          wordBreak: "break-word",
          ...style,
        }}
      />
    );
  }
);

RichEditor.displayName = "RichEditor";
