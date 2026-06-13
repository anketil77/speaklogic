// src/dialog/components/RichEditor.tsx
import React, { useEffect, useRef, useImperativeHandle } from "react";
import { sanitizeWordHtml } from "@/dialog/utils/sanitizeWordHtml";
import "@/dialog/components/HtmlContent"; // injects .sl-html-content CSS so htmlContentStyling works
import { useTableEditing } from "@/dialog/components/toolbar/useTableEditing";

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
    // table-layout:fixed + width:100% keeps tables inside the narrow editor: columns
    // share the available width and cell text wraps, instead of auto-layout expanding
    // the table (and the whole horizontally-scrollable editor) to fit its content.
    ".rte-field table{border-collapse:collapse;table-layout:fixed;width:100%;margin:0 0 0.85em;}" +
    ".rte-field th,.rte-field td{border:1px solid #C7C7C7;padding:6px 9px;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;}" +
    ".rte-field th{background:#F3F4F6;font-weight:600;text-align:left;}" +
    ".sl-find-match{background:#FFF176;border-radius:1px;}" +
    ".sl-find-active{background:#FFB300;}" +
    ".sl-spell-error{text-decoration:underline wavy #D13438;text-underline-offset:2px;}" +
    ".sl-spell-current{background:#FDE8E8;text-decoration:underline wavy #D13438;text-underline-offset:2px;outline:1px solid #D13438;border-radius:1px;}" +
    ".rte-field.rte-mod-down a{cursor:pointer;}" +
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
  /**
   * Opt in to the shared .sl-html-content CSS (paragraph margins, em-based
   * heading sizes, list/blockquote/image styling). Use this for editors that
   * accept pasted article content so headings and lists stay constrained to
   * the editor width instead of rendering at raw browser default sizes.
   */
  htmlContentStyling?: boolean;
  /**
   * Strip Word/Office boilerplate from pasted HTML before it enters the
   * editor (uses sanitizeWordHtml). Recommended whenever users may paste
   * formatted content from a Word document or web article.
   */
  sanitizeOnPaste?: boolean;
}

export const RichEditor = React.forwardRef<HTMLDivElement, RichEditorProps>(
  ({ value, onChange, style, placeholder, htmlContentStyling, sanitizeOnPaste }, ref) => {
    const innerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => innerRef.current!);

    const { onContextMenu, onMouseDown, menuElement, overlayElement, selectionElement } =
      useTableEditing(innerRef);

    useEffect(() => {
      injectPlaceholderCSS();
    }, []);

    useEffect(() => {
      function isMod(e: KeyboardEvent) {
        return e.ctrlKey || e.metaKey || e.key === "Control" || e.key === "Meta";
      }
      function onKeyDown(e: KeyboardEvent) {
        if (isMod(e)) innerRef.current?.classList.add("rte-mod-down");
      }
      function onKeyUp(e: KeyboardEvent) {
        if (!e.ctrlKey && !e.metaKey) innerRef.current?.classList.remove("rte-mod-down");
      }
      function onBlur() {
        innerRef.current?.classList.remove("rte-mod-down");
      }
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
      window.addEventListener("blur", onBlur);
      return () => {
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
        window.removeEventListener("blur", onBlur);
      };
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

    function handleClick(e: React.MouseEvent<HTMLDivElement>) {
      let node: HTMLElement | null = e.target as HTMLElement;
      while (node && node !== innerRef.current) {
        if (node.tagName === "A") {
          const href = (node as HTMLAnchorElement).getAttribute("href");
          if (href) {
            e.preventDefault();
            e.stopPropagation();
            window.open(href, "_blank", "noopener,noreferrer");
          }
          return;
        }
        node = node.parentElement;
      }
    }

    function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
      if (!sanitizeOnPaste) return;
      const html = e.clipboardData.getData("text/html");
      const text = e.clipboardData.getData("text/plain");
      if (!html && !text) return;
      e.preventDefault();
      const cleaned = html
        ? sanitizeWordHtml(html)
        : (text || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\n/g, "<br>");
      // execCommand("insertHTML") is deprecated but is the only reliable cross-browser
      // way to insert HTML into a contentEditable at the current caret position.
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      document.execCommand("insertHTML", false, cleaned);
      if (innerRef.current) onChange(innerRef.current.innerHTML);
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
      <>
        <div
          ref={innerRef}
          contentEditable
          suppressContentEditableWarning
          className={htmlContentStyling ? "rte-field sl-html-content" : "rte-field"}
          data-placeholder={placeholder}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onClick={handleClick}
          onMouseDown={onMouseDown}
          onContextMenu={onContextMenu}
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
        {menuElement}
        {overlayElement}
        {selectionElement}
      </>
    );
  }
);

RichEditor.displayName = "RichEditor";
