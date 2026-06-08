// src/dialog/views/createarticle/ArticleEditorPanel.tsx
//
// Floating rich-text editor panel — pixel-perfect Figma spec.
// All SVG icons are taken directly from the designer-provided SVG source.

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useDraggable } from "@/dialog/hooks/useDraggable";
import { ResizeHandles } from "@/dialog/components/ResizeHandles";

// ── Paragraph style options ───────────────────────────────────────────────────
const PARA_STYLES = [
  { label: "Paragraph", tag: "p" },
  { label: "Heading 1",  tag: "h1" },
  { label: "Heading 2",  tag: "h2" },
  { label: "Heading 3",  tag: "h3" },
  { label: "Preformat",  tag: "pre" },
];

// ── Colour palettes ───────────────────────────────────────────────────────────
const FONT_COLORS = [
  "#1B1B1B", "#D13438", "#0078D4", "#107C10",
  "#FFB900", "#E3008C", "#8764B8", "#FFFFFF",
];
const HIGHLIGHT_COLORS = [
  "#FFFF00", "#00FF00", "#00FFFF", "#FF00FF",
  "#FFB900", "#FFF4CE", "#EBF3FC", null,   // null = remove
];

// ─────────────────────────────────────────────────────────────────────────────
// ICONS — exact paths copied from the designer's SVG file.
// Each icon component uses viewBox to crop to its content area.
// ─────────────────────────────────────────────────────────────────────────────

/** Header left X — 11×11 (vector at 18.18% = 2px margin each side) */
const HdrXIcon = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
    <line x1="2" y1="2" x2="9" y2="9" stroke="#616161" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="9" y1="2" x2="2" y2="9" stroke="#616161" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

/** Tick / save icon — shown in top-right corner of header */
const TickIcon = () => (
  <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
    <path d="M1.5 5.5L5.5 9.5L12.5 1.5" stroke="#107C10" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/** editor-mid Undo button (←↺) — from designer SVG, button at x=0–31 */
const UndoIcon = () => (
  <svg width="13" height="8" viewBox="10 8 10 6" fill="none">
    <path
      d="M11.5 13C11.5 11.9391 11.9214 10.9217 12.6716 10.1716C13.4217 9.42143 14.4391 9 15.5 9C16.6 9 17.6 9.44 18.33 10.17L19.5 9"
      stroke="#616161" strokeWidth="1.3" strokeLinecap="round"
    />
    <path d="M19.5 9V12H16.5" stroke="#616161" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/** editor-mid Redo button (↻→) — from designer SVG, button at x=34–65 (subtract 34 for local) */
const RedoIcon = () => (
  <svg width="13" height="8" viewBox="10 12 10 6" fill="none">
    <path
      d="M19.5 13C19.5 14.0609 19.0786 15.0783 18.3284 15.8284C17.5783 16.5786 16.5609 17 15.5 17C14.4 17 13.4 16.56 12.67 15.83L11.5 17"
      stroke="#616161" strokeWidth="1.3" strokeLinecap="round"
    />
    <path d="M11.5 17V14H14.5" stroke="#616161" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/** Paragraph caret — 8×8 viewBox */
const ParaCaret = () => (
  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
    <path d="M1.5 2.5L4 5L6.5 2.5" stroke="#1B1B1B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ── Row 1 button icons ────────────────────────────────────────────────────────

/** Row 1 btn 7 — three equal horizontal lines (alignment) */
const R1Btn7Icon = () => (
  <svg width="12" height="8" viewBox="213 9 12 8" fill="none">
    <path
      d="M214.5 10.5H223.5M214.5 13H223.5M214.5 15.5H223.5"
      stroke="#1B1B1B" strokeWidth="1.1" strokeLinecap="round"
    />
  </svg>
);

/** Row 1 btn 9 — checkmark (spell check toggle) */
const R1Btn9Icon = () => (
  <svg width="10" height="8" viewBox="249 9 10 7" fill="none">
    <path
      d="M250.5 12L253.5 15L257.5 10"
      stroke="#1B1B1B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
    />
  </svg>
);

// ── Row 2 button icons (exact paths from designer SVG) ────────────────────────

/** btn0 — bullet list — circles + horizontal lines */
const R2Btn0Icon = () => (
  <svg width="12" height="9" viewBox="8 42 11 8" fill="none">
    <path d="M9.5 45C10.0523 45 10.5 44.5523 10.5 44C10.5 43.4477 10.0523 43 9.5 43C8.94772 43 8.5 43.4477 8.5 44C8.5 44.5523 8.94772 45 9.5 45Z" fill="#1B1B1B"/>
    <path d="M9.5 49C10.0523 49 10.5 48.5523 10.5 48C10.5 47.4477 10.0523 47 9.5 47C8.94772 47 8.5 47.4477 8.5 48C8.5 48.5523 8.94772 49 9.5 49Z" fill="#1B1B1B"/>
    <path d="M12 44H18M12 48H18" stroke="#1B1B1B" strokeWidth="1.1" strokeLinecap="round"/>
  </svg>
);

/** btn1 — numbered list — "1" "2" labels + horizontal lines */
const R2Btn1Icon = () => (
  <svg width="12" height="11" viewBox="35 42 11 10" fill="none">
    <path d="M35.5 42.5H37V45.5M35.5 45.5H37.5" stroke="#1B1B1B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M39 44H45M39 48H45" stroke="#1B1B1B" strokeWidth="1.1" strokeLinecap="round"/>
    <path d="M35.5 48.5H37.5L35.5 51H37.5" stroke="#1B1B1B" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/** btn2 — two boxes + bottom line */
const R2Btn2Icon = () => (
  <svg width="12" height="11" viewBox="61 41 12 10" fill="none">
    <path d="M65.5 42H62.5C62.2239 42 62 42.2239 62 42.5V45.5C62 45.7761 62.2239 46 62.5 46H65.5C65.7761 46 66 45.7761 66 45.5V42.5C66 42.2239 65.7761 42 65.5 42Z" stroke="#1B1B1B"/>
    <path d="M71.5 42H68.5C68.2239 42 68 42.2239 68 42.5V45.5C68 45.7761 68.2239 46 68.5 46H71.5C71.7761 46 72 45.7761 72 45.5V42.5C72 42.2239 71.7761 42 71.5 42Z" stroke="#1B1B1B"/>
    <path d="M62.5 49.5H71.5" stroke="#1B1B1B" strokeWidth="1.1" strokeLinecap="round"/>
  </svg>
);

/** btn3 — font colour "A" with coloured underline */
const R2Btn3Icon = ({ color }: { color: string }) => (
  <svg width="11" height="12" viewBox="89 41 10 11" fill="none">
    <path d="M94 42L90 49.5H91.5L92.5 47.5H95.5L96.5 49.5H98L94 42Z" stroke="#1B1B1B" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M89.5 51H98.5" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

/** btn4 — pencil / highlight icon */
const R2Btn4Icon = ({ color }: { color: string }) => (
  <svg width="11" height="11" viewBox="116 41 10 10" fill="none">
    <path d="M117 49.5L118.5 47L123 42L125 44L120.5 48.5L117 49.5Z" stroke="#1B1B1B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M121 44.5L122.5 46" stroke="#1B1B1B" strokeLinecap="round"/>
    {/* colour indicator line at bottom of icon */}
    <line x1="117" y1="51" x2="125" y2="51" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

/** btn5 — chain link / hyperlink */
const R2Btn5Icon = () => (
  <svg width="12" height="12" viewBox="142 40 12 12" fill="none">
    <clipPath id="clip-link"><rect x="142" y="40" width="12" height="12"/></clipPath>
    <g clipPath="url(#clip-link)">
      <path
        d="M147 47.5C147.467 47.9581 148.096 48.2146 148.75 48.2146C149.404 48.2146 150.033 47.9581 150.5 47.5L152.5 45.5C152.861 45.0186 153.036 44.4231 152.994 43.8228C152.951 43.2225 152.693 42.6578 152.268 42.2322C151.842 41.8067 151.277 41.549 150.677 41.5063C150.077 41.4636 149.481 41.6389 149 42L148.5 43"
        stroke="#1B1B1B" strokeWidth="1.1" strokeLinecap="round"
      />
      <path
        d="M149 44.4998C148.533 44.0417 147.904 43.7852 147.25 43.7852C146.596 43.7852 145.967 44.0417 145.5 44.4998L143.5 46.4998C143.139 46.9812 142.964 47.5767 143.006 48.177C143.049 48.7773 143.307 49.342 143.732 49.7676C144.158 50.1931 144.723 50.4508 145.323 50.4935C145.923 50.5362 146.519 50.3609 147 49.9998L147.5 48.9998"
        stroke="#1B1B1B" strokeWidth="1.1" strokeLinecap="round"
      />
    </g>
  </svg>
);

/** btn6 — image (photo frame + mountain + sun circle) */
const R2Btn6Icon = () => (
  <svg width="12" height="10" viewBox="169 41 12 10" fill="none">
    <path d="M179 42.5H171C170.448 42.5 170 42.9477 170 43.5V48.5C170 49.0523 170.448 49.5 171 49.5H179C179.552 49.5 180 49.0523 180 48.5V43.5C180 42.9477 179.552 42.5 179 42.5Z" stroke="#1B1B1B"/>
    <path d="M170 47.5L173 45L175.5 47.5L177.5 45.5L180.5 49" stroke="#1B1B1B" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M173 46C173.552 46 174 45.5523 174 45C174 44.4477 173.552 44 173 44C172.448 44 172 44.4477 172 45C172 45.5523 172.448 46 173 46Z" stroke="#1B1B1B" strokeWidth="0.9"/>
  </svg>
);

/** btn7 — video / play (rectangle + play triangle) */
const R2Btn7Icon = () => (
  <svg width="12" height="11" viewBox="196 40 12 12" fill="none">
    <path d="M205.5 41.5H198.5C197.672 41.5 197 42.1716 197 43V49C197 49.8284 197.672 50.5 198.5 50.5H205.5C206.328 50.5 207 49.8284 207 49V43C207 42.1716 206.328 41.5 205.5 41.5Z" stroke="#1B1B1B"/>
    <path d="M200.5 44.5L204.5 46.5L200.5 48.5V44.5Z" stroke="#1B1B1B" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────
export interface ArticleEditorPanelProps {
  initialContent: string;
  onSave:  (html: string) => void;
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export function ArticleEditorPanel({
  initialContent,
  onSave,
  onClose,
}: ArticleEditorPanelProps) {
  const editorRef   = useRef<HTMLDivElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const savedRange  = useRef<Range | null>(null);

  // drag + resize — starts centred, clamped to the real viewport
  const initW = Math.min(520, Math.round(window.innerWidth  * 0.96));
  const initH = Math.min(354, Math.round(window.innerHeight * 0.92));
  const { pos, setPos, onHeaderMouseDown } = useDraggable({
    initialX: Math.max(0, Math.round((window.innerWidth  - initW) / 2)),
    initialY: Math.max(0, Math.round((window.innerHeight - initH) / 2)),
  });
  const [size, setSize] = useState({ width: initW, height: initH });

  // format active states
  const [bold,   setBold]   = useState(false);
  const [italic, setItalic] = useState(false);
  const [uline,  setUline]  = useState(false);
  const [strike, setStrike] = useState(false);

  // UI state
  const [isEmpty,     setIsEmpty]     = useState(!initialContent.trim());
  const [paraLabel,   setParaLabel]   = useState("Paragraph");
  const [paraOpen,    setParaOpen]    = useState(false);
  const [colorOpen,   setColorOpen]   = useState(false);
  const [hlOpen,      setHlOpen]      = useState(false);
  const [showLinkBar, setShowLinkBar] = useState(false);
  const [linkUrl,     setLinkUrl]     = useState("https://");
  const [fontColor,   setFontColor]   = useState("#0078D4");
  const [hlColor,     setHlColor]     = useState<string | null>(null);
  const [spellOn,     setSpellOn]     = useState(false);
  const [alignIdx,    setAlignIdx]    = useState(0);   // cycles 0-3

  const ALIGN_CMDS = ["justifyLeft", "justifyCenter", "justifyRight", "justifyFull"];

  // seed initial content
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = initialContent;
      setIsEmpty(!editorRef.current.innerText.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // close dropdowns on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest("[data-para-dd]"))  setParaOpen(false);
      if (!t.closest("[data-color-dd]")) setColorOpen(false);
      if (!t.closest("[data-hl-dd]"))    setHlOpen(false);
    };
    document.addEventListener("mousedown", h, true);
    return () => document.removeEventListener("mousedown", h, true);
  }, []);

  // close panel — always saves content
  const closeAndSave = useCallback(() => {
    onSave(editorRef.current?.innerHTML ?? "");
    onClose();
  }, [onSave, onClose]);

  // selection helpers
  const saveSelection = useCallback(() => {
    const s = window.getSelection();
    if (s && s.rangeCount > 0) savedRange.current = s.getRangeAt(0).cloneRange();
  }, []);

  const restoreSelection = useCallback(() => {
    const s = window.getSelection();
    if (s && savedRange.current) { s.removeAllRanges(); s.addRange(savedRange.current); }
    editorRef.current?.focus();
  }, []);

  const exec = useCallback((cmd: string, value?: string) => {
    restoreSelection();
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    document.execCommand(cmd, false, value ?? undefined);
    editorRef.current?.focus();
  }, [restoreSelection]);

  const updateState = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    setBold(document.queryCommandState("bold"));
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    setItalic(document.queryCommandState("italic"));
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    setUline(document.queryCommandState("underline"));
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    setStrike(document.queryCommandState("strikeThrough"));
    if (editorRef.current) setIsEmpty(!editorRef.current.innerText.trim());
  }, []);

  const handleParaStyle = useCallback((s: typeof PARA_STYLES[0]) => {
    restoreSelection();
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    document.execCommand("formatBlock", false, s.tag);
    setParaLabel(s.label);
    setParaOpen(false);
    editorRef.current?.focus();
  }, [restoreSelection]);

  const handleFontColor = useCallback((color: string) => {
    restoreSelection();
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    document.execCommand("styleWithCSS", false, "true");
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    document.execCommand("foreColor", false, color);
    setFontColor(color);
    setColorOpen(false);
    editorRef.current?.focus();
  }, [restoreSelection]);

  const handleHighlight = useCallback((color: string | null) => {
    restoreSelection();
    if (!color) {
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      document.execCommand("removeFormat", false, undefined);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      document.execCommand("styleWithCSS", false, "true");
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      document.execCommand("hiliteColor", false, color);
    }
    setHlColor(color);
    setHlOpen(false);
    editorRef.current?.focus();
  }, [restoreSelection]);

  const handleLinkApply = useCallback(() => {
    const url = linkUrl.trim();
    if (url && url !== "https://") {
      restoreSelection();
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      document.execCommand("createLink", false, url);
    }
    setShowLinkBar(false);
    editorRef.current?.focus();
  }, [linkUrl, restoreSelection]);

  const handleImgLoad = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      if (!dataUrl) return;
      restoreSelection();
      // Insert as HTML so we can constrain max-width — prevents horizontal scroll.
      // Use data URL (base64) not blob URL — blob URLs expire with the session.
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      document.execCommand("insertHTML", false, `<img src="${dataUrl}" style="max-width:100%;height:auto;display:block;" alt="" />`);
      editorRef.current?.focus();
    };
    reader.readAsDataURL(file);
  }, [restoreSelection]);

  // ── Button / separator helpers ────────────────────────────────────────────
  function iconBtn(
    active: boolean,
    onMD: () => void,
    onClick: () => void,
    icon: React.ReactNode,
    title?: string,
  ) {
    return (
      <button
        title={title}
        onMouseDown={(e) => { e.preventDefault(); onMD(); }}
        onClick={onClick}
        style={{
          display: "flex", flexDirection: "row", justifyContent: "center",
          alignItems: "center", padding: 0, width: 26, height: 26,
          borderRadius: 3, border: "none",
          background: active ? "#DCDCDC" : "transparent",
          cursor: "pointer", flexShrink: 0,
        }}
      >
        {icon}
      </button>
    );
  }

  const sep = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "0px 3px", width: 7, height: 14, flexShrink: 0 }}>
      <div style={{ width: 1, height: 14, background: "#C7C7C7" }} />
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return createPortal(
    <>
      {/* Scrim */}
      <div
        onClick={closeAndSave}
        style={{ position: "fixed", inset: 0, zIndex: 199, background: "rgba(0,0,0,0.18)" }}
      />

      {/* ── Panel: resizable, draggable ─────────────────────────────── */}
      <div
        style={{
          position: "fixed",
          left: pos.x,
          top:  pos.y,
          zIndex: 200,
          width: size.width, height: size.height,
          background: "#FFFFFF",
          boxShadow: "0px 8px 32px rgba(0,0,0,0.14), 0px 2px 8px rgba(0,0,0,0.06)",
          borderRadius: 8,
          display: "flex", flexDirection: "column", alignItems: "flex-start",
          padding: 0,
          fontFamily: "'Inter','Segoe UI',sans-serif",
          overflow: "hidden",
        }}
      >

        {/* ══ div.editor-hdr ═══════════════════════════════════════════ */}
        <div
          onMouseDown={onHeaderMouseDown}
          style={{
            display: "flex", flexDirection: "row", alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 14px",
            width: "100%", height: 47,
            boxSizing: "border-box",
            cursor: "move", flexShrink: 0, userSelect: "none",
          }}
        >
          {/* Left: X close button — 17×17 */}
          <button
            onClick={closeAndSave}
            title="Close"
            style={{
              display: "flex", flexDirection: "row", alignItems: "center",
              padding: 3, width: 17, height: 17,
              borderRadius: 3, border: "none", background: "transparent",
              cursor: "pointer", flexShrink: 0,
            }}
          >
            <HdrXIcon />
          </button>

          {/* Center: Undo + Redo — gap:3px */}
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 3, flexShrink: 0 }}>
            {/* Undo — 31×26, silver border */}
            <button
              title="Undo"
              onMouseDown={(e) => { e.preventDefault(); }}
              onClick={() => { exec("undo"); }}
              style={{
                boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0px 8px", width: 31, height: 26,
                border: "1px solid #C7C7C7", borderRadius: 4,
                background: "transparent", cursor: "pointer", flexShrink: 0,
              }}
            >
              <UndoIcon />
            </button>

            {/* Redo — 31×26, silver border */}
            <button
              title="Redo"
              onMouseDown={(e) => { e.preventDefault(); }}
              onClick={() => { exec("redo"); }}
              style={{
                boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0px 8px", width: 31, height: 26,
                border: "1px solid #C7C7C7", borderRadius: 4,
                background: "transparent", cursor: "pointer", flexShrink: 0,
              }}
            >
              <RedoIcon />
            </button>
          </div>

          {/* Right: ✓ save/confirm button — top-right corner */}
          <button
            onClick={closeAndSave}
            title="Save"
            style={{
              display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center",
              padding: 3, width: 24, height: 24,
              borderRadius: 4, border: "1px solid #C7C7C7", background: "transparent",
              cursor: "pointer", flexShrink: 0,
            }}
          >
            <TickIcon />
          </button>
        </div>

        {/* ══ div.editor-area — grows to fill remaining height ══════════ */}
        <div
          onClick={() => editorRef.current?.focus()}
          style={{
            display: "flex", flexDirection: "column", alignItems: "flex-start",
            padding: "14px 16px 0px",
            width: "100%", flex: 1,
            boxSizing: "border-box",
            position: "relative", cursor: "text", order: 1,
            overflow: "auto",
          }}
        >
          {/* span.editor-ph — placeholder */}
          {isEmpty && (
            <span
              style={{
                display: "flex", flexDirection: "column", alignItems: "flex-start",
                padding: "1px 0px 2px", width: "calc(100% - 32px)", height: 17,
                pointerEvents: "none", userSelect: "none",
                position: "absolute", left: 16, top: 14,
              }}
            >
              <span style={{
                width: "100%", height: 14,
                fontFamily: "'Inter',sans-serif", fontStyle: "normal",
                fontWeight: 400, fontSize: 11.8, lineHeight: "14px",
                display: "flex", alignItems: "center", color: "#ADADAD",
              }}>
                Start writing
              </span>
            </span>
          )}

          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            spellCheck={spellOn}
            onInput={updateState}
            onKeyUp={updateState}
            onMouseUp={updateState}
            onFocus={updateState}
            onBlur={saveSelection}
            style={{
              width: "100%", minHeight: 213,
              outline: "none", fontSize: 11.8, lineHeight: "17px",
              color: "#1B1B1B", fontFamily: "'Inter',sans-serif",
              wordBreak: "break-word", userSelect: "text",
              overflowY: "auto", overflowX: "hidden",
            }}
          />
        </div>

        {/* ── Inline link URL bar (no prompt()) ───────────────────────────── */}
        {showLinkBar && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "4px 14px", background: "#F5F5F5",
            borderTop: "1px solid #E0E0E0",
            width: "100%", boxSizing: "border-box", flexShrink: 0,
          }}>
            <span style={{ fontSize: 10, color: "#616161", flexShrink: 0, fontWeight: 700 }}>URL</span>
            <input
              autoFocus
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLinkApply();
                if (e.key === "Escape") { setShowLinkBar(false); editorRef.current?.focus(); }
              }}
              placeholder="https://example.com"
              style={{ flex: 1, height: 22, border: "1px solid #C7C7C7", borderRadius: 3, fontSize: 10.5, padding: "0 6px", fontFamily: "inherit", outline: "none" }}
            />
            <button onClick={handleLinkApply} style={{ padding: "2px 10px", height: 22, background: "#0078D4", color: "#FFFFFF", border: "none", borderRadius: 3, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>Apply</button>
            <button onClick={() => { setShowLinkBar(false); editorRef.current?.focus(); }} style={{ padding: "2px 10px", height: 22, background: "transparent", color: "#616161", border: "1px solid #C7C7C7", borderRadius: 3, fontSize: 10, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>✕</button>
          </div>
        )}

        {/* ══ div.ftbar — border-top, fixed 66px height ════════════════ */}
        <div style={{
          boxSizing: "border-box", display: "flex", flexDirection: "column",
          alignItems: "flex-start", padding: 0,
          width: "100%", height: 66,
          borderTop: "1px solid #E0E0E0",
          flexShrink: 0, order: 2,
        }}>

          {/* ── Row 1 — 33px, #F5F5F5 ──────────────────────────────────── */}
          <div style={{
            display: "flex", flexDirection: "row", alignItems: "center",
            padding: "3px 8px", gap: 1,
            width: "100%", height: 33,
            background: "#F5F5F5", boxSizing: "border-box",
            flexShrink: 0, order: 0, alignSelf: "stretch",
          }}>

            {/* div.para-dd — 81×22 */}
            <div data-para-dd="true" style={{ position: "relative", flexShrink: 0, order: 0 }}>
              <button
                data-para-dd="true"
                aria-expanded={paraOpen} aria-haspopup="menu"
                onMouseDown={(e) => { e.preventDefault(); saveSelection(); }}
                onClick={() => { setParaOpen((v) => !v); setColorOpen(false); setHlOpen(false); }}
                style={{
                  boxSizing: "border-box", display: "flex", flexDirection: "row",
                  alignItems: "center", padding: "0px 8px", gap: 4,
                  width: 81, height: 22,
                  background: "#FFFFFF", border: "1px solid #C7C7C7",
                  borderRadius: 3, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                <span style={{ fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: 10, lineHeight: "12px", color: "#1B1B1B", flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                  {paraLabel}
                </span>
                <ParaCaret />
              </button>

              {paraOpen && (
                <div data-para-dd="true" role="menu" style={{
                  position: "absolute", bottom: "calc(100% + 2px)", left: 0,
                  background: "#FFFFFF", border: "1px solid #E0E0E0", borderRadius: 4,
                  boxShadow: "0px 4px 12px rgba(0,0,0,0.12)", zIndex: 210,
                  minWidth: 120, padding: "2px 0",
                }}>
                  {PARA_STYLES.map((s) => (
                    <button key={s.tag} role="menuitem" data-para-dd="true"
                      onClick={() => handleParaStyle(s)}
                      className="sl-panel-item"
                      style={{ display: "block", width: "100%", padding: "5px 12px", textAlign: "left", background: "transparent", border: "none", cursor: "pointer", fontSize: 10.5, fontFamily: "inherit", color: "#1B1B1B", fontWeight: paraLabel === s.label ? 700 : 400 }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {sep}

            {/* B — Inter Bold 10px */}
            {iconBtn(bold, saveSelection, () => exec("bold"),
              <span style={{ width: 7, height: 12, fontFamily: "'Inter',sans-serif", fontStyle: "normal", fontWeight: 700, fontSize: 10, lineHeight: "12px", display: "flex", alignItems: "center", textAlign: "center", color: "#1B1B1B" }}>B</span>,
              "Bold"
            )}
            {/* I — Inter Bold Italic 10px */}
            {iconBtn(italic, saveSelection, () => exec("italic"),
              <span style={{ width: 3, height: 12, fontFamily: "'Inter',sans-serif", fontStyle: "italic", fontWeight: 700, fontSize: 10, lineHeight: "12px", display: "flex", alignItems: "center", textAlign: "center", color: "#1B1B1B" }}>I</span>,
              "Italic"
            )}
            {/* U — Inter Bold Underline 10px */}
            {iconBtn(uline, saveSelection, () => exec("underline"),
              <span style={{ width: 8, height: 12, fontFamily: "'Inter',sans-serif", fontStyle: "normal", fontWeight: 700, fontSize: 10, lineHeight: "12px", display: "flex", alignItems: "center", textAlign: "center", textDecorationLine: "underline", color: "#1B1B1B" }}>U</span>,
              "Underline"
            )}
            {/* S — Inter Bold Strikethrough 10px */}
            {iconBtn(strike, saveSelection, () => exec("strikeThrough"),
              <span style={{ width: 7, height: 12, fontFamily: "'Inter',sans-serif", fontStyle: "normal", fontWeight: 700, fontSize: 10, lineHeight: "12px", display: "flex", alignItems: "center", textAlign: "center", textDecorationLine: "line-through", color: "#1B1B1B" }}>S</span>,
              "Strikethrough"
            )}

            {sep}

            {/* btn7 — 3-line alignment icon */}
            {iconBtn(false, saveSelection,
              () => {
                saveSelection();
                const next = (alignIdx + 1) % 4;
                setAlignIdx(next);
                restoreSelection();
                // eslint-disable-next-line @typescript-eslint/no-deprecated
                document.execCommand(ALIGN_CMDS[next], false, undefined);
                editorRef.current?.focus();
              },
              <R1Btn7Icon />, "Align text"
            )}

            {sep}

            {/* btn9 — checkmark (spell check toggle) */}
            {iconBtn(spellOn, saveSelection,
              () => {
                const next = !spellOn;
                setSpellOn(next);
                if (editorRef.current) {
                  editorRef.current.setAttribute("spellcheck", next ? "true" : "false");
                  editorRef.current.focus();
                }
              },
              <R1Btn9Icon />, "Toggle spell check"
            )}
          </div>

          {/* ── Row 2 — 32px, #F5F5F5 ──────────────────────────────────── */}
          <div style={{
            display: "flex", flexDirection: "row", alignItems: "center",
            padding: "3px 8px", gap: 1,
            width: "100%", height: 32,
            background: "#F5F5F5", boxSizing: "border-box",
            flexShrink: 0, order: 1, alignSelf: "stretch",
          }}>

            {/* btn0 — bullet list */}
            {iconBtn(false, saveSelection,
              () => { restoreSelection(); /* eslint-disable-next-line @typescript-eslint/no-deprecated */ document.execCommand("insertUnorderedList", false, undefined); editorRef.current?.focus(); },
              <R2Btn0Icon />, "Bullet list"
            )}

            {/* btn1 — numbered list */}
            {iconBtn(false, saveSelection,
              () => { restoreSelection(); /* eslint-disable-next-line @typescript-eslint/no-deprecated */ document.execCommand("insertOrderedList", false, undefined); editorRef.current?.focus(); },
              <R2Btn1Icon />, "Numbered list"
            )}

            {/* btn2 — two boxes + line (indent) */}
            {iconBtn(false, saveSelection,
              () => { restoreSelection(); /* eslint-disable-next-line @typescript-eslint/no-deprecated */ document.execCommand("indent", false, undefined); editorRef.current?.focus(); },
              <R2Btn2Icon />, "Indent"
            )}

            {/* btn3 — font colour (A + coloured underline) */}
            <div data-color-dd="true" style={{ position: "relative", flexShrink: 0 }}>
              <button
                data-color-dd="true" title="Font colour"
                aria-expanded={colorOpen} aria-haspopup="menu"
                onMouseDown={(e) => { e.preventDefault(); saveSelection(); }}
                onClick={() => { setColorOpen((v) => !v); setHlOpen(false); setParaOpen(false); }}
                style={{ display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center", padding: 0, width: 26, height: 26, borderRadius: 3, border: "none", background: "transparent", cursor: "pointer", flexShrink: 0 }}
              >
                <R2Btn3Icon color={fontColor} />
              </button>
              {colorOpen && (
                <div data-color-dd="true" role="menu" style={{ position: "absolute", bottom: "calc(100% + 4px)", left: "50%", transform: "translateX(-50%)", background: "#FFFFFF", border: "1px solid #E0E0E0", borderRadius: 4, boxShadow: "0px 4px 12px rgba(0,0,0,0.12)", zIndex: 210, padding: 6, display: "flex", flexWrap: "wrap", gap: 3, width: 84 }}>
                  {FONT_COLORS.map((c) => (
                    <button key={c} role="menuitem" data-color-dd="true"
                      onClick={() => handleFontColor(c)} className="sl-color-swatch" title={c}
                      style={{ width: 16, height: 16, borderRadius: 2, border: "1px solid #E0E0E0", background: c, cursor: "pointer", padding: 0, outline: fontColor === c ? "2px solid #0078D4" : "none", outlineOffset: 1 }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* btn4 — pencil / highlight colour */}
            <div data-hl-dd="true" style={{ position: "relative", flexShrink: 0 }}>
              <button
                data-hl-dd="true" title="Highlight colour"
                aria-expanded={hlOpen} aria-haspopup="menu"
                onMouseDown={(e) => { e.preventDefault(); saveSelection(); }}
                onClick={() => { setHlOpen((v) => !v); setColorOpen(false); setParaOpen(false); }}
                style={{ display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center", padding: 0, width: 26, height: 26, borderRadius: 3, border: "none", background: "transparent", cursor: "pointer", flexShrink: 0 }}
              >
                <R2Btn4Icon color={hlColor ?? "#C7C7C7"} />
              </button>
              {hlOpen && (
                <div data-hl-dd="true" role="menu" style={{ position: "absolute", bottom: "calc(100% + 4px)", left: "50%", transform: "translateX(-50%)", background: "#FFFFFF", border: "1px solid #E0E0E0", borderRadius: 4, boxShadow: "0px 4px 12px rgba(0,0,0,0.12)", zIndex: 210, padding: 6, display: "flex", flexWrap: "wrap", gap: 3, width: 84 }}>
                  {HIGHLIGHT_COLORS.map((c, i) => (
                    <button key={i} role="menuitem" data-hl-dd="true"
                      onClick={() => handleHighlight(c)} className="sl-color-swatch" title={c ?? "Remove"}
                      style={{ width: 16, height: 16, borderRadius: 2, border: "1px solid #E0E0E0", background: c == null ? "linear-gradient(135deg,#fff 42%,#f44 42%,#f44 58%,#fff 58%)" : c, cursor: "pointer", padding: 0, outline: hlColor === c ? "2px solid #0078D4" : "none", outlineOffset: 1 }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* btn5 — chain link (hyperlink) */}
            {iconBtn(showLinkBar, saveSelection,
              () => { setLinkUrl("https://"); setShowLinkBar((v) => !v); },
              <R2Btn5Icon />, "Insert link"
            )}

            {/* btn6 — image */}
            {iconBtn(false, saveSelection,
              () => imgInputRef.current?.click(),
              <R2Btn6Icon />, "Insert image"
            )}

            {/* btn7 — video/play (insert video embed or media placeholder) */}
            {iconBtn(false, saveSelection,
              () => {
                restoreSelection();
                // eslint-disable-next-line @typescript-eslint/no-deprecated
                document.execCommand("insertHTML", false, '<div style="background:#f5f5f5;border:1px solid #e0e0e0;border-radius:4px;padding:8px 12px;font-size:11px;color:#616161;display:inline-block;">▶ Video placeholder</div>');
                editorRef.current?.focus();
              },
              <R2Btn7Icon />, "Insert video placeholder"
            )}
          </div>
        </div>
        {/* ── 8-way resize handles ──────────────────────────────────────── */}
        <ResizeHandles
          pos={pos}
          setPos={setPos}
          size={size}
          setSize={setSize}
          minWidth={400}
          minHeight={260}
          maxWidth={Math.round(window.innerWidth  * 0.99)}
          maxHeight={Math.round(window.innerHeight * 0.98)}
        />
      </div>

      {/* Hidden image file input */}
      <input ref={imgInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImgLoad} />
    </>,
    document.body,
  );
}
