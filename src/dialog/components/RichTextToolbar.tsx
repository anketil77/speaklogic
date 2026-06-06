// src/dialog/components/RichTextToolbar.tsx
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FontPicker } from "@/dialog/components/FontPicker";
import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
  AlignmentIcon,
  BulletListIcon,
  ChevronDown,
  ClipboardIcon,
  CopyIconSvg,
  CutIconSvg,
  FindReplaceIcon,
  NumberedListIcon,
  OpenIconSvg,
  OutlineListIcon,
  PasteIconSvg,
  PrintIcon,
  SaveLayoutIcon,
  SearchIcon,
  SpellCheckIcon,
  SubscriptIcon,
  SuperscriptIcon,
} from "@/dialog/components/toolbar/ToolbarIcons";
import {
  FONT_COLORS,
  FR_FONT,
  HIGHLIGHT_COLORS,
  frBtnPrimary,
  frBtnSecondary,
  iconBtnBase,
  toolbarSep,
} from "@/dialog/components/toolbar/toolbarConstants";
import { useFindReplace } from "@/dialog/components/toolbar/useFindReplace";
import { useSpellCheck } from "@/dialog/components/toolbar/useSpellCheck";

// ─── Inject hover CSS once at module load ─────────────────────────────────────
(function injectHoverCSS() {
  if (typeof document === "undefined") return;
  if (document.getElementById("__rtt_hover__")) return;
  const s = document.createElement("style");
  s.id = "__rtt_hover__";
  s.textContent =
    ".sl-icon-btn:hover{background:#EBEBEB!important;}" +
    ".sl-apply-btn:hover{background:#106EBE!important;}" +
    ".sl-panel-item:hover{background:#F0F0F0!important;}" +
    ".sl-format-btn:hover{background:#DCDCDC!important;}" +
    ".sl-fr-btn:hover:not(:disabled){background:#EBEBEB!important;border-color:#A0A0A0!important;}" +
    ".sl-fr-btn-primary:hover:not(:disabled){background:#106EBE!important;}" +
    ".sl-close-btn:hover{background:#F0F0F0!important;color:#1B1B1B!important;}" +
    ".sl-fr-tab:hover{background:#E8E8E8!important;}" +
    ".sl-sc-suggestion:hover{background:#EBF3FC!important;}" +
    ".sl-color-swatch:hover{box-shadow:0 0 0 2px #A8A8A8;}";
  document.head.appendChild(s);
})();

// ─── Types ────────────────────────────────────────────────────────────────────

type DropdownId = "font" | "alignment" | "clipboard" | "list";
type Alignment = "left" | "center" | "right" | "justify";

// ─── Component ────────────────────────────────────────────────────────────────

export interface RichTextToolbarProps {
  editorRef: React.RefObject<HTMLDivElement>;
  /** Increment to force-close any open toolbar panel from the outside. */
  closeSignal?: number;
  /** Called when a toolbar panel is about to open, so the host can close its own dropdowns. */
  onOpen?: () => void;
}

export function RichTextToolbar({ editorRef, closeSignal, onOpen }: RichTextToolbarProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  // Captures the selection at the moment the font panel opens so repeated size
  // changes always re-select the same text (savedRange drifts after each apply).
  const fontPanelRangeRef = useRef<Range | null>(null);
  const sizeInputRef = useRef<HTMLInputElement>(null);
  // Guards against onBlur re-entering applyFontSize while el.focus() is in progress.
  const applyingFontSize = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fontGroupRef = useRef<HTMLDivElement>(null);
  const alignGroupRef = useRef<HTMLDivElement>(null);
  const clipboardGroupRef = useRef<HTMLDivElement>(null);
  const listGroupRef = useRef<HTMLDivElement>(null);
  const portalPanelRef = useRef<HTMLDivElement | null>(null);
  const [panelAnchor, setPanelAnchor] = useState<{ top: number; left: number } | null>(null);

  const [openDropdown, setOpenDropdown] = useState<DropdownId | null>(null);
  const [fontName, setFontName] = useState("Calibri");
  const [fontSizeVal, setFontSizeVal] = useState("11");
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [strike, setStrike] = useState(false);
  const [sup, setSup] = useState(false);
  const [sub, setSub] = useState(false);
  const [fontColor, setFontColor] = useState("#1B1B1B");
  const [highlight, setHighlight] = useState<string | null>(null);
  const [alignment, setAlignment] = useState<Alignment>("left");
  const [saveStatus, setSaveStatus] = useState<"" | "empty" | "saved" | "copied" | "error">("");

  const {
    show: showFindReplace,
    openFindReplace,
    closeFindReplace,
    frTab, setFrTab,
    frPos, setFrPos,
    findText, setFindText,
    replaceTextVal, setReplaceTextVal,
    matchCase, setMatchCase,
    wholeWord, setWholeWord,
    useRegex, setUseRegex,
    matchCount,
    activeIdx,
    hasSearched,
    findInputRef,
    dragOrigin,
    navigateMatch,
    replaceOne,
    replaceAll,
  } = useFindReplace(editorRef);

  const {
    show: showSpellCheck,
    startSpellCheck,
    closeSpellCheck,
    hideSpellCheck,
    scLoading,
    scDone,
    scWord,
    scSuggestions,
    scChangeTo, setScChangeTo,
    scPosState, setScPosState,
    scHistoryCount,
    scDragOrigin,
    scDoIgnore,
    scDoIgnoreAll,
    scDoChange,
    scDoChangeAll,
    scDoAdd,
    scDoUndoLast,
  } = useSpellCheck(editorRef);

  // Walk up from anchor node to (but not including) the editor root, accumulating
  // format states. This handles nested tags like <u><s>text</s></u> where checking
  // only the innermost element misses decorations applied on ancestor elements.
  function syncFormatState() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      setBold(false); setItalic(false); setUnderline(false); setStrike(false);
      return;
    }
    const node = sel.anchorNode;
    const editorEl = editorRef.current;
    let el: HTMLElement | null = node
      ? (node.nodeType === Node.TEXT_NODE ? (node as Text).parentElement : (node as HTMLElement))
      : null;

    let isBold = false, isItalic = false, isUnderline = false, isStrike = false;
    let isSup = false, isSub = false;

    while (el && editorEl && el !== editorEl && editorEl.contains(el)) {
      const tag = el.tagName;
      if (!isSup && tag === "SUP") isSup = true;
      if (!isSub && tag === "SUB") isSub = true;
      const cs = window.getComputedStyle(el);
      if (!isBold && parseInt(cs.fontWeight, 10) >= 600) isBold = true;
      if (!isItalic && (cs.fontStyle === "italic" || cs.fontStyle === "oblique")) isItalic = true;
      const tdl = cs.textDecorationLine || cs.textDecoration || "";
      if (!isUnderline && tdl.includes("underline")) isUnderline = true;
      if (!isStrike && tdl.includes("line-through")) isStrike = true;
      el = el.parentElement;
    }

    setBold(isBold);
    setItalic(isItalic);
    setUnderline(isUnderline);
    setStrike(isStrike);
    setSup(isSup);
    setSub(isSub);
  }

  // Attach selection-save + format-state listeners to the editor element.
  // RichEditor is always mounted (kept alive behind display:none when other tabs active),
  // so editorRef.current is stable after the first render.
  useEffect(() => {
    const el = editorRef.current;

    function saveSelection() {
      if (!el) return;
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
        savedRange.current = sel.getRangeAt(0).cloneRange();
        syncFormatState();
      }
    }

    if (el) {
      el.addEventListener("blur", saveSelection);
      document.addEventListener("selectionchange", saveSelection);
    }

    return () => {
      if (el) {
        el.removeEventListener("blur", saveSelection);
        document.removeEventListener("selectionchange", saveSelection);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdowns when user clicks outside the toolbar wrapper or any portaled panel.
  // Uses capture phase so it fires before any child stopPropagation.
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      const inWrapper = wrapperRef.current?.contains(e.target as Node) ?? false;
      const inPortal = portalPanelRef.current?.contains(e.target as Node) ?? false;
      if (!inWrapper && !inPortal) {
        setOpenDropdown(null);
        setPanelAnchor(null);
      }
    }
    document.addEventListener("mousedown", onOutside, true);
    return () => document.removeEventListener("mousedown", onOutside, true);
  }, []);

  // Close our panel when the host signals (e.g. a command-bar dropdown just opened).
  useEffect(() => {
    if (closeSignal !== undefined) {
      setOpenDropdown(null);
      setPanelAnchor(null);
      closeFindReplace();
      hideSpellCheck();
    }
  }, [closeSignal]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Selection helpers ─────────────────────────────────────────────────────

  function restoreSelection() {
    const el = editorRef.current;
    if (!el || !savedRange.current) return;
    el.focus();
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current.cloneRange());
    }
  }

  // ── execCommand wrappers ──────────────────────────────────────────────────

  function exec(cmd: string, value?: string) {
    restoreSelection();
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    document.execCommand(cmd, false, value ?? undefined);
    syncFormatState();
  }

  function applyFontName(name: string) {
    if (!name.trim()) return;
    restoreSelection();
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    document.execCommand("fontName", false, name);
  }

  function applyFontSize(pxStr: string) {
    // el.focus() below fires blur on the size input synchronously, which re-enters
    // this function via onBlur. The guard prevents that recursive call from running
    // so execCommand always fires with the editor focused.
    if (applyingFontSize.current) return;
    applyingFontSize.current = true;

    try {
      const px = parseInt(pxStr, 10);
      if (!px || px <= 0) return;
      const el = editorRef.current;
      if (!el) return;

      // Always restore the range saved when the font panel opened, not savedRange —
      // savedRange collapses to a cursor after the first apply, making subsequent
      // changes appear to do nothing.
      const range = fontPanelRangeRef.current ?? savedRange.current;
      if (!range) return;

      el.focus();
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        try { sel.addRange(range.cloneRange()); } catch { return; }
      }

      // styleWithCSS must be false so execCommand produces <font size="7"> (HTML attribute),
      // not <span style="font-size: x-large"> (CSS name). With styleWithCSS=true the
      // querySelectorAll below finds nothing and the px value is never applied.
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      document.execCommand("styleWithCSS", false, "false");
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      document.execCommand("fontSize", false, "7");
      // Fix up the legacy <font size="7"> tags to real px values
      el.querySelectorAll('font[size="7"]').forEach((node) => {
        (node as HTMLElement).style.fontSize = `${px}px`;
        node.removeAttribute("size");
      });
      el.dispatchEvent(new Event("input", { bubbles: true }));
    } finally {
      applyingFontSize.current = false;
    }

    // Defer refocus so blur/focus events from el.focus() fully settle before
    // we move focus back to the size input.
    setTimeout(() => sizeInputRef.current?.focus(), 0);
  }

  function applyColor(color: string) {
    restoreSelection();
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    document.execCommand("styleWithCSS", false, "true");
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    document.execCommand("foreColor", false, color);
    setFontColor(color);
    // Keep the dropdown open so the user can pick multiple colors without reopening.
  }

  function applyHighlight(color: string) {
    restoreSelection();
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    document.execCommand("styleWithCSS", false, "true");
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    document.execCommand("hiliteColor", false, color);
    setHighlight(color);
    // Keep the dropdown open so the user can pick multiple highlights without reopening.
  }

  function applyAlignment(align: Alignment) {
    const cmds: Record<Alignment, string> = {
      left: "justifyLeft",
      center: "justifyCenter",
      right: "justifyRight",
      justify: "justifyFull",
    };
    restoreSelection();
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    document.execCommand(cmds[align], false, undefined);
    setAlignment(align);
    setOpenDropdown(null);
  }

  function applyList(type: "bullet" | "numbered" | "outline") {
    restoreSelection();
    if (type === "outline") {
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      document.execCommand("insertOrderedList", false, undefined);
      // Mark the top-level <ol> so CSS applies multi-level numbering (1 → a → i)
      const sel = window.getSelection();
      if (sel && sel.anchorNode) {
        let el: HTMLElement | null =
          sel.anchorNode.nodeType === Node.TEXT_NODE
            ? (sel.anchorNode as Text).parentElement
            : (sel.anchorNode as HTMLElement);
        while (el && el !== editorRef.current) {
          if (el.tagName === "OL") {
            el.classList.add("rte-outline");
            break;
          }
          el = el.parentElement;
        }
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      document.execCommand(
        type === "bullet" ? "insertUnorderedList" : "insertOrderedList",
        false,
        undefined
      );
    }
    setOpenDropdown(null);
  }

  // Paste button strategy:
  // 1. Try execCommand("paste") synchronously — must happen before any await so
  //    the browser's trusted-event-gesture context is still active. WebView2
  //    (Office.js desktop) often allows this; Chrome standalone blocks it.
  // 2. Async fallback via Clipboard API: build a DataTransfer and dispatch a
  //    native ClipboardEvent so contentEditable handles it like Ctrl+V.
  function applyPaste() {
    restoreSelection();
    setOpenDropdown(null);

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const pasted = document.execCommand("paste", false, undefined);
    if (pasted) return;

    // Trusted event context is now lost — try Clipboard API asynchronously.
    void (async () => {
      let html: string | null = null;
      let plainText: string | null = null;
      try {
        if (navigator.clipboard?.read) {
          const items = await navigator.clipboard.read();
          for (const item of items) {
            if (item.types.includes("text/html")) {
              html = await (await item.getType("text/html")).text();
              break;
            }
            if (item.types.includes("text/plain")) {
              plainText = await (await item.getType("text/plain")).text();
            }
          }
        }
        if (!html && !plainText) {
          plainText = await navigator.clipboard.readText();
        }
      } catch {
        // Clipboard API permission denied without prompt in this WebView context.
      }

      const el = editorRef.current;
      if ((html || plainText) && el) {
        restoreSelection();
        const dt = new DataTransfer();
        if (html) dt.setData("text/html", html);
        if (plainText) dt.setData("text/plain", plainText);
        el.dispatchEvent(
          new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true })
        );
      }
    })();
  }

  function toggleDd(id: DropdownId, groupRef: React.RefObject<HTMLDivElement | null>) {
    setOpenDropdown((prev) => {
      const next = prev === id ? null : id;
      if (next !== null) {
        onOpen?.();
        if (groupRef.current) {
          const r = groupRef.current.getBoundingClientRect();
          setPanelAnchor({ top: r.bottom, left: r.left });
        }
      } else {
        setPanelAnchor(null);
      }
      return next;
    });
  }

  // ── Save: download editor content as .html file ──────────────────────────
  function showSaveStatus(s: "empty" | "saved" | "copied" | "error") {
    setSaveStatus(s);
    setTimeout(() => setSaveStatus(""), 3000);
  }

  function handleSave() {
    const el = editorRef.current;
    if (!el || !el.innerHTML.trim()) {
      showSaveStatus("empty");
      return;
    }

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Calibri', sans-serif; font-size: 11pt; margin: 1in; line-height: 1.4; }
  </style>
</head>
<body>${el.innerHTML}</body>
</html>`;

    const now = new Date();
    const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const fileName = `speak-logic-analysis-${ts}.html`;

    // Try native OS Save dialog (File System Access API) — blocked in iframes, harmless to try
    const fsApi = (window as any).showSaveFilePicker;
    if (typeof fsApi === "function") {
      (fsApi as (opts: unknown) => Promise<any>)({
        suggestedName: fileName,
        types: [{ description: "HTML Document", accept: { "text/html": [".html"] } }],
      })
        .then(async (handle: any) => {
          const writable = await handle.createWritable();
          await writable.write(htmlContent);
          await writable.close();
          showSaveStatus("saved");
        })
        .catch((e: any) => {
          if (e?.name === "AbortError") return;
          // Blocked in iframe (SecurityError) or other — fall through to blob/clipboard
          tryBlobThenClipboard(htmlContent, fileName);
        });
      return;
    }

    tryBlobThenClipboard(htmlContent, fileName);
  }

  function tryBlobThenClipboard(content: string, fileName: string) {
    // Try blob URL download first
    try {
      const blob = new Blob([content], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.style.cssText = "position:fixed;top:0;left:0;opacity:0;";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 500);
      // Show "saved" optimistically — blob click is fire-and-forget
      showSaveStatus("saved");
    } catch {
      // Blob creation failed — copy to clipboard as last resort
      copyToClipboard(content);
    }
  }

  function copyToClipboard(content: string) {
    // Strip tags for plain-text clipboard; preserves readability
    const plain = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    navigator.clipboard.writeText(plain).then(
      () => showSaveStatus("copied"),
      () => showSaveStatus("error"),
    );
  }

  // ── Print: stamp sl-print-region only on the toolbar's bound editor, then remove ──
  // Matches original: richEditBarController1 was bound to richEditControlActualAnalysis only.
  // All other RichEditor instances (Entity Under Analysis, etc.) are excluded from printing.
  function handlePrint() {
    const el = editorRef.current;
    if (!el) return;
    el.classList.add("sl-print-region");
    window.print();
    el.classList.remove("sl-print-region");
  }

  // ── Open: file picker → read HTML → set editor content ──────────────────
  // Uses a <label> trigger instead of .click() — programmatic file input clicks
  // are blocked in some Office.js WebView2 iframe contexts.

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string | null;
      if (!text) return;

      // Try to extract <body> content for full HTML files; use raw text otherwise
      const bodyMatch = text.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      const content = bodyMatch ? bodyMatch[1].trim() : text;

      if (editorRef.current) {
        editorRef.current.innerHTML = content;
        // Dispatch input event so RichEditor's onChange fires and parent state updates.
        // Without this, the next React render wipes the loaded content back to the old value.
        editorRef.current.dispatchEvent(new Event("input", { bubbles: true }));
      }
    };
    reader.readAsText(file);

    // Reset so the same file can be re-chosen
    e.target.value = "";
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
  <>
    <div ref={wrapperRef} style={{ display: "flex", alignItems: "center" }}>
      {/* ── Font button + chevron ──────────────────────────────────────────── */}
      <div ref={fontGroupRef} style={{ position: "relative", height: "100%", display: "flex", alignItems: "center" }}>
        <button
          className="sl-icon-btn"
          style={{ ...iconBtnBase, flexDirection: "column", gap: "2px" }}
          title="Font"
          onClick={() => { fontPanelRangeRef.current = savedRange.current?.cloneRange() ?? null; toggleDd("font", fontGroupRef); }}
        >
          <span style={{ fontSize: "13px", fontWeight: "700", color: "#1B1B1B", lineHeight: "13px" }}>
            A
          </span>
          <span
            style={{
              width: "14px",
              height: "3px",
              background: fontColor,
              borderRadius: "1px",
            }}
          />
        </button>
        <button
          className="sl-icon-btn"
          style={{ ...iconBtnBase, width: "10px", padding: 0, minWidth: 0 }}
          title="Font dropdown"
          onClick={() => { fontPanelRangeRef.current = savedRange.current?.cloneRange() ?? null; toggleDd("font", fontGroupRef); }}
        >
          <ChevronDown />
        </button>

        {openDropdown === "font" && panelAnchor && createPortal(
          <div ref={(el) => { portalPanelRef.current = el; }} style={{ position: "fixed", top: panelAnchor.top, left: panelAnchor.left, zIndex: 9999, width: "260px", background: "#FFFFFF", border: "1px solid #E0E0E0", boxShadow: "0px 4px 16px rgba(0,0,0,0.12), 0px 1px 4px rgba(0,0,0,0.06)", borderRadius: "4px" }}>
            {/* Row 1: font picker (floating dropdown) + size input */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "6px",
                padding: "8px 10px 6px",
              }}
            >
              <FontPicker
                value={fontName}
                onChange={(name) => {
                  setFontName(name);
                  applyFontName(name);
                  // Does NOT close the outer panel — only the font list collapses.
                }}
                onClose={() => setOpenDropdown(null)}
              />
              <input
                ref={sizeInputRef}
                value={fontSizeVal}
                onChange={(e) => {
                  const v = e.target.value;
                  setFontSizeVal(v);
                  // Live update: apply immediately when value is a plausible size (>=6)
                  // to avoid applying single-digit intermediates like "1" while typing "16".
                  if (parseInt(v, 10) >= 6) applyFontSize(v);
                }}
                onBlur={() => applyFontSize(fontSizeVal)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); applyFontSize(fontSizeVal); }
                }}
                style={{
                  width: "44px",
                  height: "28px",
                  flexShrink: 0,
                  background: "#FFFFFF",
                  border: "1px solid #C7C7C7",
                  borderRadius: "3px",
                  padding: "0 7px",
                  fontSize: "12px",
                  fontFamily: "inherit",
                  color: "#1B1B1B",
                  outline: "none",
                  boxSizing: "border-box",
                  textAlign: "center",
                }}
              />
            </div>

            {/* Divider */}
            <div
              style={{
                height: "1px",
                background: "#E0E0E0",
                margin: "6px 0 0",
              }}
            />

            {/* B / I / U / S + superscript + subscript */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                paddingLeft: "6px",
                paddingTop: "4px",
                paddingBottom: "4px",
                gap: "1px",
              }}
            >
              {(
                [
                  { label: "B", cmd: "bold", active: bold, style: { fontWeight: "700" } as React.CSSProperties },
                  { label: "I", cmd: "italic", active: italic, style: { fontStyle: "italic" } as React.CSSProperties },
                  { label: "U", cmd: "underline", active: underline, style: { textDecoration: "underline" } as React.CSSProperties },
                  { label: "S", cmd: "strikeThrough", active: strike, style: { textDecoration: "line-through" } as React.CSSProperties },
                ] as { label: string; cmd: string; active: boolean; style: React.CSSProperties }[]
              ).map(({ label, cmd, active, style: textStyle }) => (
                <button
                  key={label}
                  className="sl-format-btn"
                  onClick={() => exec(cmd)}
                  style={{
                    width: "30px",
                    height: "30px",
                    background: active ? "#EBEBEB" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "3px",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: "13px", color: "#1B1B1B", ...textStyle }}>{label}</span>
                </button>
              ))}

              {/* Separator before sub/superscript */}
              <div
                style={{
                  width: "1px",
                  height: "18px",
                  background: "#E0E0E0",
                  margin: "0 6px",
                  flexShrink: 0,
                }}
              />

              <button
                className="sl-format-btn"
                onClick={() => exec("superscript")}
                style={{
                  width: "28px",
                  height: "30px",
                  background: sup ? "#EBEBEB" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "3px",
                  flexShrink: 0,
                }}
              >
                <SuperscriptIcon />
              </button>
              <button
                className="sl-format-btn"
                onClick={() => exec("subscript")}
                style={{
                  width: "28px",
                  height: "30px",
                  background: sub ? "#EBEBEB" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "3px",
                  flexShrink: 0,
                }}
              >
                <SubscriptIcon />
              </button>
            </div>

            {/* Divider */}
            <div style={{ height: "1px", background: "#E0E0E0" }} />

            {/* Colour label + swatches */}
            <div style={{ padding: "6px 11px 4px" }}>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  color: "#616161",
                  marginBottom: "6px",
                }}
              >
                Colour
              </div>
              <div style={{ display: "flex", gap: "4px" }}>
                {FONT_COLORS.map((c) => (
                  <div
                    key={c}
                    className="sl-color-swatch"
                    onClick={() => applyColor(c)}
                    style={{
                      width: "16px",
                      height: "16px",
                      background: c,
                      border: c === "#FFFFFF" ? "1px solid #C7C7C7" : "1px solid rgba(0,0,0,0.1)",
                      borderRadius: "2px",
                      cursor: "pointer",
                      outline: fontColor === c ? "2px solid #0078D4" : "none",
                      outlineOffset: "1px",
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Highlight label + swatches */}
            <div style={{ padding: "4px 11px 8px" }}>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  color: "#616161",
                  marginBottom: "6px",
                }}
              >
                Highlight
              </div>
              <div style={{ display: "flex", gap: "4px" }}>
                {HIGHLIGHT_COLORS.map((c) => (
                  <div
                    key={c}
                    className="sl-color-swatch"
                    onClick={() => applyHighlight(c)}
                    style={{
                      width: "16px",
                      height: "16px",
                      background: c,
                      border: c === "#FFFFFF" ? "1px solid #C7C7C7" : "1px solid rgba(0,0,0,0.1)",
                      borderRadius: "2px",
                      cursor: "pointer",
                      outline: highlight === c ? "2px solid #0078D4" : "none",
                      outlineOffset: "1px",
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        , document.body)}
      </div>

      <div style={toolbarSep} />

      {/* ── Alignment button ───────────────────────────────────────────────── */}
      <div ref={alignGroupRef} style={{ position: "relative", height: "100%", display: "flex", alignItems: "center" }}>
        <button
          className="sl-icon-btn"
          style={iconBtnBase}
          title="Paragraph Alignment"
          onClick={() => toggleDd("alignment", alignGroupRef)}
        >
          <AlignmentIcon />
        </button>

        {openDropdown === "alignment" && panelAnchor && createPortal(
          <div
            ref={(el) => { portalPanelRef.current = el; }}
            style={{ position: "fixed", top: panelAnchor.top, left: panelAnchor.left, zIndex: 9999, minWidth: "108px", paddingTop: "4px", paddingBottom: "4px", background: "#FFFFFF", border: "1px solid #E0E0E0", boxShadow: "0px 4px 16px rgba(0,0,0,0.12), 0px 1px 4px rgba(0,0,0,0.06)", borderRadius: "4px" }}
          >
            {(["left", "center", "right", "justify"] as Alignment[]).map((align) => (
              <button
                key={align}
                className="sl-panel-item"
                onClick={() => applyAlignment(align)}
                style={{
                  height: "31px",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "0 14px",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  background: alignment === align ? "#EBF3FC" : "transparent",
                  fontSize: "12px",
                  color: "#1B1B1B",
                  textAlign: "left",
                }}
              >
                {align === "left" && <AlignLeftIcon />}
                {align === "center" && <AlignCenterIcon />}
                {align === "right" && <AlignRightIcon />}
                {align === "justify" && <AlignJustifyIcon />}
                <span style={{ textTransform: "capitalize" }}>{align}</span>
              </button>
            ))}
          </div>
        , document.body)}
      </div>

      <div style={toolbarSep} />

      {/* ── Clipboard button ───────────────────────────────────────────────── */}
      <div ref={clipboardGroupRef} style={{ position: "relative", height: "100%", display: "flex", alignItems: "center" }}>
        <button
          className="sl-icon-btn"
          style={iconBtnBase}
          title="Clipboard"
          onClick={() => toggleDd("clipboard", clipboardGroupRef)}
        >
          <ClipboardIcon />
        </button>

        {openDropdown === "clipboard" && panelAnchor && createPortal(
          <div
            ref={(el) => { portalPanelRef.current = el; }}
            style={{ position: "fixed", top: panelAnchor.top, left: panelAnchor.left, zIndex: 9999, width: "110px", paddingTop: "4px", paddingBottom: "4px", background: "#FFFFFF", border: "1px solid #E0E0E0", boxShadow: "0px 4px 16px rgba(0,0,0,0.12), 0px 1px 4px rgba(0,0,0,0.06)", borderRadius: "4px" }}
          >
            {(
              [
                {
                  label: "Cut",
                  Icon: CutIconSvg,
                  onClick: () => { restoreSelection(); document.execCommand("cut", false, undefined); setOpenDropdown(null); }, // eslint-disable-line @typescript-eslint/no-deprecated
                },
                {
                  label: "Copy",
                  Icon: CopyIconSvg,
                  onClick: () => { restoreSelection(); document.execCommand("copy", false, undefined); setOpenDropdown(null); }, // eslint-disable-line @typescript-eslint/no-deprecated
                },
                {
                  label: "Paste",
                  Icon: PasteIconSvg,
                  onClick: () => { applyPaste(); },
                },
              ] as { label: string; Icon: () => React.ReactElement; onClick: () => void }[]
            ).map(({ label, Icon, onClick }) => (
              <button
                key={label}
                className="sl-panel-item"
                onClick={onClick}
                style={{
                  height: "32px",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 15px",
                  gap: "10px",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  background: "transparent",
                  fontSize: "12.2px",
                  color: "#1B1B1B",
                  textAlign: "left",
                }}
              >
                <Icon />
                <span>{label}</span>
              </button>
            ))}
          </div>
        , document.body)}
      </div>

      {/* ── List button ────────────────────────────────────────────────────── */}
      <div ref={listGroupRef} style={{ position: "relative", height: "100%", display: "flex", alignItems: "center" }}>
        <button className="sl-icon-btn" style={iconBtnBase} title="List" onClick={() => toggleDd("list", listGroupRef)}>
          <FindReplaceIcon />
        </button>

        {openDropdown === "list" && panelAnchor && createPortal(
          <div
            ref={(el) => { portalPanelRef.current = el; }}
            style={{ position: "fixed", top: panelAnchor.top, left: panelAnchor.left, zIndex: 9999, minWidth: "140px", paddingTop: "4px", paddingBottom: "4px", background: "#FFFFFF", border: "1px solid #E0E0E0", boxShadow: "0px 4px 16px rgba(0,0,0,0.12), 0px 1px 4px rgba(0,0,0,0.06)", borderRadius: "4px" }}
          >
            {(
              [
                { label: "Bullet List", Icon: BulletListIcon, type: "bullet" as const },
                { label: "Numbered List", Icon: NumberedListIcon, type: "numbered" as const },
                { label: "Outline List", Icon: OutlineListIcon, type: "outline" as const },
              ] as { label: string; Icon: () => React.ReactElement; type: "bullet" | "numbered" | "outline" }[]
            ).map(({ label, Icon, type }) => (
              <button
                key={label}
                className="sl-panel-item"
                onClick={() => applyList(type)}
                style={{
                  height: "31px",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 14px",
                  gap: "10px",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  background: "transparent",
                  fontSize: "12px",
                  color: "#1B1B1B",
                  textAlign: "left",
                }}
              >
                <Icon />
                <span>{label}</span>
              </button>
            ))}
          </div>
        , document.body)}
      </div>

      {/* Save */}
      <button className="sl-icon-btn" style={iconBtnBase} title="Save" onClick={handleSave}>
        <SaveLayoutIcon />
      </button>
      {saveStatus && (
        <span style={{
          fontSize: 11, color:
            saveStatus === "error" ? "#D13438" :
            saveStatus === "empty" ? "#D13438" : "#107C10",
          marginLeft: 4, whiteSpace: "nowrap",
        }}>
          {saveStatus === "saved" && "Saved"}
          {saveStatus === "copied" && "Copied to clipboard"}
          {saveStatus === "empty" && "Nothing to save"}
            {saveStatus === "error" && "Save failed"}
        </span>
      )}

      <div style={toolbarSep} />

      {/* Open — label wraps the hidden input so user click directly activates the file picker */}
      <label
        htmlFor="sl-rtt-file-open"
        className="sl-icon-btn"
        style={{ ...iconBtnBase, cursor: "pointer" }}
        title="Open"
      >
        <OpenIconSvg />
      </label>

      {/* Print */}
      <button className="sl-icon-btn" style={iconBtnBase} title="Print" onClick={handlePrint}>
        <PrintIcon />
      </button>

      {/* Find & Replace button — opens floating modal */}
      <button
        className="sl-icon-btn"
        style={iconBtnBase}
        title="Find & Replace"
        onClick={() => { setOpenDropdown(null); openFindReplace(); }}
      >
        <SearchIcon />
      </button>

      {/* Spell Check button */}
      <button
        className="sl-icon-btn"
        style={iconBtnBase}
        title="Spelling (F7)"
        onClick={() => { setOpenDropdown(null); void startSpellCheck(); }}
      >
        <SpellCheckIcon />
      </button>

      {/* Hidden file input for Open — activated directly by the <label> above */}
      <input
        id="sl-rtt-file-open"
        ref={fileInputRef}
        type="file"
        accept=".html,.htm"
        style={{ position: "absolute", width: 0, height: 0, opacity: 0, overflow: "hidden" }}
        onChange={handleFileSelected}
      />
    </div>

    {/* ── Find and Replace floating modal ─────────────────────────────────── */}
    {showFindReplace && createPortal(
      <div
        style={{
          position: "fixed",
          top: frPos ? `${frPos.y}px` : "140px",
          left: frPos ? `${frPos.x}px` : "50%",
          transform: frPos ? "none" : "translateX(-50%)",
          zIndex: 2000,
          width: "380px",
          background: "#FFFFFF",
          borderRadius: "8px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)",
          fontFamily: FR_FONT,
          fontSize: "11px",
          color: "#1B1B1B",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header — white, drag handle */}
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
            dragOrigin.current = { mx: e.clientX, my: e.clientY, bx: rect.left, by: rect.top };
            function onMove(ev: MouseEvent) {
              if (!dragOrigin.current) return;
              setFrPos({
                x: dragOrigin.current.bx + (ev.clientX - dragOrigin.current.mx),
                y: dragOrigin.current.by + (ev.clientY - dragOrigin.current.my),
              });
            }
            function onUp() {
              dragOrigin.current = null;
              window.removeEventListener("mousemove", onMove);
              window.removeEventListener("mouseup", onUp);
            }
            window.addEventListener("mousemove", onMove);
            window.addEventListener("mouseup", onUp);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 14px 10px",
            borderBottom: "1px solid #E0E0E0",
            cursor: "move",
            userSelect: "none",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: "#0078D4", flexShrink: 0 }}>
              <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#1B1B1B" }}>Find and Replace</span>
          </div>
          <button
            className="sl-close-btn"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={closeFindReplace}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "3px", borderRadius: "3px", color: "#616161", display: "flex", alignItems: "center" }}
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M2 2l7 7M9 2L2 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #E0E0E0", background: "#F5F5F5", flexShrink: 0 }}>
          {(["find", "replace"] as const).map((tab) => (
            <button
              key={tab}
              className="sl-fr-tab"
              onClick={() => setFrTab(tab)}
              style={{
                padding: "7px 18px 6px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: "11px",
                fontFamily: "inherit",
                fontWeight: frTab === tab ? 700 : 500,
                color: frTab === tab ? "#0078D4" : "#616161",
                borderBottom: frTab === tab ? "2px solid #0078D4" : "2px solid transparent",
                marginBottom: "-1px",
              }}
            >
              {tab === "find" ? "Find" : "Replace"}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: "14px 14px 10px", display: "flex", flexDirection: "column", gap: "10px" }}>

          {/* Find what */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ width: "96px", flexShrink: 0, fontSize: "11px", color: "#616161" }}>Find what:</label>
            <input
              ref={findInputRef}
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); navigateMatch("next"); }
                if (e.key === "Escape") { e.preventDefault(); closeFindReplace(); }
              }}
              style={{ flex: 1, height: "28px", border: "1px solid #C7C7C7", borderRadius: "4px", padding: "0 8px", fontSize: "11px", fontFamily: "inherit", color: "#1B1B1B", outline: "none", boxSizing: "border-box" as const, background: "#FFFFFF" }}
            />
          </div>

          {/* Replace with */}
          {frTab === "replace" && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label style={{ width: "96px", flexShrink: 0, fontSize: "11px", color: "#616161" }}>Replace with:</label>
              <input
                value={replaceTextVal}
                onChange={(e) => setReplaceTextVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); replaceOne(); }
                  if (e.key === "Escape") { e.preventDefault(); closeFindReplace(); }
                }}
                style={{ flex: 1, height: "28px", border: "1px solid #C7C7C7", borderRadius: "4px", padding: "0 8px", fontSize: "11px", fontFamily: "inherit", color: "#1B1B1B", outline: "none", boxSizing: "border-box" as const, background: "#FFFFFF" }}
              />
            </div>
          )}

          {/* Match counter — aligned under input */}
          {hasSearched && (
            <div style={{ fontSize: "10px", color: matchCount === 0 ? "#D13438" : "#616161", minHeight: "15px", paddingLeft: "104px" }}>
              {matchCount > 0 ? `${activeIdx + 1} of ${matchCount} matches` : "The search text was not found."}
            </div>
          )}

          {/* Options */}
          <div style={{ border: "1px solid #E0E0E0", borderRadius: "6px", padding: "8px 12px 6px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {([
              { label: "Match case",          val: matchCase, set: setMatchCase },
              { label: "Find whole words only", val: wholeWord, set: setWholeWord },
              { label: "Regular expression",   val: useRegex,  set: setUseRegex  },
            ] as const).map(({ label, val, set }) => (
              <label key={label} style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "11px", color: "#1B1B1B", cursor: "pointer" }}>
                <input type="checkbox" checked={val} onChange={(e) => set(e.target.checked)}
                  style={{ margin: 0, cursor: "pointer", accentColor: "#0078D4", width: "12px", height: "12px", flexShrink: 0 }} />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px", padding: "9px 14px 12px", borderTop: "1px solid #E0E0E0", background: "#F5F5F5", flexShrink: 0 }}>
          {frTab === "find" ? (
            <>
              <button className="sl-fr-btn" onClick={() => navigateMatch("prev")} style={frBtnSecondary}>Find Prev</button>
              <button className="sl-fr-btn-primary" onClick={() => navigateMatch("next")} style={frBtnPrimary}>Find Next</button>
            </>
          ) : (
            <>
              <button className="sl-fr-btn" onClick={() => navigateMatch("next")} style={frBtnSecondary}>Find Next</button>
              <button className="sl-fr-btn" onClick={replaceOne} disabled={matchCount === 0} style={{ ...frBtnSecondary, opacity: matchCount === 0 ? 0.4 : 1 }}>Replace</button>
              <button className="sl-fr-btn-primary" onClick={replaceAll} disabled={matchCount === 0} style={{ ...frBtnPrimary, opacity: matchCount === 0 ? 0.4 : 1 }}>Replace All</button>
            </>
          )}
          <button className="sl-fr-btn" onClick={closeFindReplace} style={frBtnSecondary}>Cancel</button>
        </div>
      </div>
    , document.body)}

    {/* ── Spell Check floating modal ───────────────────────────────────────── */}
    {showSpellCheck && createPortal(
      <div
        style={{
          position: "fixed",
          top: scPosState ? `${scPosState.y}px` : "120px",
          left: scPosState ? `${scPosState.x}px` : "50%",
          transform: scPosState ? "none" : "translateX(-50%)",
          zIndex: 2000,
          width: "420px",
          background: "#FFFFFF",
          borderRadius: "8px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)",
          fontFamily: FR_FONT,
          fontSize: "11px",
          color: "#1B1B1B",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header — drag handle */}
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
            scDragOrigin.current = { mx: e.clientX, my: e.clientY, bx: rect.left, by: rect.top };
            function onMove(ev: MouseEvent) {
              if (!scDragOrigin.current) return;
              setScPosState({ x: scDragOrigin.current.bx + (ev.clientX - scDragOrigin.current.mx), y: scDragOrigin.current.by + (ev.clientY - scDragOrigin.current.my) });
            }
            function onUp() { scDragOrigin.current = null; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); }
            window.addEventListener("mousemove", onMove);
            window.addEventListener("mouseup", onUp);
          }}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px 10px", borderBottom: "1px solid #E0E0E0", cursor: "move", userSelect: "none", flexShrink: 0 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <SpellCheckIcon />
            <span style={{ fontSize: "13px", fontWeight: 600 }}>Spelling</span>
          </div>
          <button className="sl-close-btn" onMouseDown={(e) => e.stopPropagation()} onClick={closeSpellCheck}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "3px", borderRadius: "3px", color: "#616161", display: "flex", alignItems: "center" }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M2 2l7 7M9 2L2 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        {scLoading ? (
          <div style={{ padding: "36px 20px", textAlign: "center", color: "#616161", fontSize: "12px" }}>Loading spell checker…</div>
        ) : scDone ? (
          <div style={{ padding: "36px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <div style={{ fontSize: "12px", color: scWord.startsWith("Failed") ? "#D13438" : "#107C10" }}>
              {scWord.startsWith("Failed") ? scWord : "Spelling check complete. No errors found."}
            </div>
            <button className="sl-fr-btn-primary" onClick={closeSpellCheck} style={{ ...frBtnPrimary, padding: "0 24px" }}>OK</button>
          </div>
        ) : (
          <>
            <div style={{ padding: "14px 14px 10px" }}>
              {/* Not in Dictionary */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <label style={{ width: "128px", flexShrink: 0, fontSize: "11px", color: "#616161" }}>Not in Dictionary:</label>
                <div style={{ flex: 1, height: "26px", border: "1px solid #C7C7C7", borderRadius: "3px", padding: "0 8px", fontSize: "11px", color: "#D13438", background: "#FFF8F8", display: "flex", alignItems: "center", overflow: "hidden", whiteSpace: "nowrap" as const }}>
                  {scWord}
                </div>
              </div>

              {/* Change to */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <label style={{ width: "128px", flexShrink: 0, fontSize: "11px", color: "#616161" }}>Change to:</label>
                <input
                  value={scChangeTo}
                  onChange={(e) => setScChangeTo(e.target.value)}
                  style={{ flex: 1, height: "26px", border: "1px solid #C7C7C7", borderRadius: "3px", padding: "0 8px", fontSize: "11px", fontFamily: "inherit", color: "#1B1B1B", outline: "none", boxSizing: "border-box" as const, background: "#FFFFFF" }}
                />
              </div>

              {/* Suggestions list + action buttons side-by-side */}
              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "11px", color: "#616161", marginBottom: "4px" }}>Suggestions:</div>
                  <div style={{ border: "1px solid #C7C7C7", borderRadius: "3px", height: "126px", overflowY: "auto", background: "#FFFFFF" }}>
                    {scSuggestions.length === 0 ? (
                      <div style={{ padding: "8px", color: "#BDBDBD", fontSize: "11px" }}>No suggestions</div>
                    ) : (
                      scSuggestions.map((s, i) => (
                        <div
                          key={i}
                          className="sl-sc-suggestion"
                          onClick={() => setScChangeTo(s)}
                          style={{ padding: "4px 8px", cursor: "pointer", fontSize: "11px", background: scChangeTo === s ? "#EBF3FC" : "transparent", color: "#1B1B1B" }}
                        >
                          {s}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Right-side action buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "90px", paddingTop: "18px" }}>
                  <button className="sl-fr-btn" onClick={scDoIgnore} style={frBtnSecondary}>Ignore</button>
                  <button className="sl-fr-btn" onClick={scDoIgnoreAll} style={frBtnSecondary}>Ignore All</button>
                  <button className="sl-fr-btn-primary" onClick={scDoChange} disabled={!scChangeTo} style={{ ...frBtnPrimary, opacity: scChangeTo ? 1 : 0.5 }}>Change</button>
                  <button className="sl-fr-btn" onClick={scDoChangeAll} disabled={!scChangeTo} style={{ ...frBtnSecondary, opacity: scChangeTo ? 1 : 0.5 }}>Change All</button>
                  <div style={{ flex: 1 }} />
                  <button className="sl-fr-btn" onClick={scDoAdd} style={frBtnSecondary}>Add</button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px 12px", borderTop: "1px solid #E0E0E0", background: "#F5F5F5", flexShrink: 0 }}>
              <div style={{ display: "flex", gap: "6px" }}>
                <button style={{ ...frBtnSecondary, opacity: 0.45, cursor: "default" }}>Options…</button>
                <button className="sl-fr-btn" onClick={scDoUndoLast} disabled={scHistoryCount === 0} style={{ ...frBtnSecondary, opacity: scHistoryCount === 0 ? 0.4 : 1 }}>Undo Last</button>
              </div>
              <button className="sl-fr-btn" onClick={closeSpellCheck} style={frBtnSecondary}>Cancel</button>
            </div>
          </>
        )}
      </div>
    , document.body)}
  </>
  );
}
