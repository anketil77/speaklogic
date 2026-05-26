// src/dialog/components/toolbar/useSpellCheck.ts
import React, { useRef, useState } from "react";

export interface UseSpellCheckResult {
  show: boolean;
  startSpellCheck: () => Promise<void>;
  closeSpellCheck: () => void;
  hideSpellCheck: () => void;
  scLoading: boolean;
  scDone: boolean;
  scWord: string;
  scSuggestions: string[];
  scChangeTo: string;
  setScChangeTo: (v: string) => void;
  scPosState: { x: number; y: number } | null;
  setScPosState: (v: { x: number; y: number } | null) => void;
  scHistoryCount: number;
  scDragOrigin: React.MutableRefObject<{ mx: number; my: number; bx: number; by: number } | null>;
  scDoIgnore: () => void;
  scDoIgnoreAll: () => void;
  scDoChange: () => void;
  scDoChangeAll: () => void;
  scDoAdd: () => void;
  scDoUndoLast: () => void;
}

export function useSpellCheck(editorRef: React.RefObject<HTMLDivElement>): UseSpellCheckResult {
  const [showSpellCheck, setShowSpellCheck] = useState(false);
  const [scLoading, setScLoading] = useState(false);
  const [scDone, setScDone] = useState(false);
  const [scWord, setScWord] = useState("");
  const [scSuggestions, setScSuggestions] = useState<string[]>([]);
  const [scChangeTo, setScChangeTo] = useState("");
  const [scPosState, setScPosState] = useState<{ x: number; y: number } | null>(null);
  const [scHistoryCount, setScHistoryCount] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scChecker = useRef<any>(null);
  const scErrorSpans = useRef<HTMLElement[]>([]);
  const scCurrentIdx = useRef(0);
  const scHistory = useRef<{ span: HTMLElement; original: string; parent: Node; next: ChildNode | null }[]>([]);
  const scIgnoredAll = useRef(new Set<string>());
  const scDragOrigin = useRef<{ mx: number; my: number; bx: number; by: number } | null>(null);

  function clearSpellMarks() {
    const el = editorRef.current;
    if (!el) return;
    el.querySelectorAll(".sl-spell-error, .sl-spell-current").forEach((s) => {
      const p = s.parentNode;
      if (!p) return;
      p.replaceChild(document.createTextNode(s.textContent || ""), s);
      p.normalize();
    });
    scErrorSpans.current = [];
  }

  function scShouldCheck(word: string): boolean {
    if (word.length <= 1) return false;
    if (/[0-9]/.test(word)) return false;
    if (/^[A-Z]{2,}$/.test(word)) return false;
    return true;
  }

  function scMarkAllErrors() {
    const el = editorRef.current;
    const checker = scChecker.current;
    if (!el || !checker) return;

    clearSpellMarks();

    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    const textNodes: Text[] = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode as Text);

    const ignored = scIgnoredAll.current;

    for (const tn of textNodes) {
      const text = tn.textContent || "";
      const wordRe = /[a-zA-Z']+/g;
      let m: RegExpExecArray | null;
      const matches: { word: string; index: number; length: number }[] = [];

      wordRe.lastIndex = 0;
      while ((m = wordRe.exec(text)) !== null) {
        const raw = m[0];
        const word = raw.replace(/^'+|'+$/g, "");
        if (!scShouldCheck(word)) continue;
        if (ignored.has(word) || ignored.has(word.toLowerCase())) continue;
        if (!checker.correct(word) && !checker.correct(word.toLowerCase())) {
          matches.push({ word: raw, index: m.index, length: raw.length });
        }
      }

      if (matches.length === 0) continue;

      const parent = tn.parentNode;
      if (!parent) continue;

      const frag = document.createDocumentFragment();
      let lastIdx = 0;

      for (const match of matches) {
        if (match.index > lastIdx) {
          frag.appendChild(document.createTextNode(text.slice(lastIdx, match.index)));
        }
        const span = document.createElement("span");
        span.className = "sl-spell-error";
        span.textContent = match.word;
        frag.appendChild(span);
        lastIdx = match.index + match.length;
      }

      if (lastIdx < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIdx)));
      }

      parent.replaceChild(frag, tn);
    }

    scErrorSpans.current = Array.from(
      el.querySelectorAll(".sl-spell-error")
    ) as HTMLElement[];
  }

  function scNavigateTo(idx: number) {
    const spans = scErrorSpans.current;
    spans.forEach((s) => s.classList.remove("sl-spell-current"));

    if (idx < 0 || spans.length === 0 || idx >= spans.length) {
      setScDone(true);
      setScWord("");
      setScSuggestions([]);
      setScChangeTo("");
      return;
    }

    const span = spans[idx];
    span.classList.add("sl-spell-current");
    span.scrollIntoView({ block: "nearest" });

    const word = span.textContent || "";
    const clean = word.replace(/^'+|'+$/g, "");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const suggs: string[] = ((scChecker.current?.suggest(clean) || []) as any[]).slice(0, 8);

    scCurrentIdx.current = idx;
    setScDone(false);
    setScWord(word);
    setScSuggestions(suggs);
    setScChangeTo(suggs[0] ?? clean);
  }

  async function startSpellCheck() {
    setShowSpellCheck(true);
    setScDone(false);
    setScWord("");
    setScSuggestions([]);
    setScChangeTo("");
    setScHistoryCount(0);
    scIgnoredAll.current = new Set();
    scHistory.current = [];
    scCurrentIdx.current = 0;

    if (!scChecker.current) {
      setScLoading(true);
      try {
        const [aff, dic] = await Promise.all([
          fetch("/assets/en.aff").then((r) => { if (!r.ok) throw new Error("dict"); return r.text(); }),
          fetch("/assets/en.dic").then((r) => { if (!r.ok) throw new Error("dict"); return r.text(); }),
        ]);
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
        const NSpell = require("nspell") as any;
        scChecker.current = NSpell(aff, dic);
        try {
          const custom = JSON.parse(localStorage.getItem("sl-custom-words") || "[]") as string[];
          custom.forEach((w: string) => scChecker.current.add(w));
        } catch { /* ignore */ }
      } catch {
        setScLoading(false);
        setScDone(true);
        setScWord("Failed to load spell checker");
        return;
      }
      setScLoading(false);
    }

    scMarkAllErrors();
    scNavigateTo(0);
  }

  function scDoIgnore() {
    scNavigateTo(scCurrentIdx.current + 1);
  }

  function scDoIgnoreAll() {
    const word = (scWord || "").replace(/^'+|'+$/g, "").toLowerCase();
    scIgnoredAll.current.add(word);

    const spans = scErrorSpans.current;
    let removedBefore = 0;
    const remaining: HTMLElement[] = [];

    spans.forEach((span, i) => {
      if ((span.textContent || "").replace(/^'+|'+$/g, "").toLowerCase() === word) {
        const p = span.parentNode;
        if (p) { p.replaceChild(document.createTextNode(span.textContent || ""), span); p.normalize(); }
        if (i < scCurrentIdx.current) removedBefore++;
      } else {
        remaining.push(span);
      }
    });

    scErrorSpans.current = remaining;
    const newIdx = scCurrentIdx.current - removedBefore;
    scNavigateTo(remaining.length === 0 ? -1 : Math.min(newIdx, remaining.length - 1));
  }

  function scDoChange() {
    const spans = scErrorSpans.current;
    const idx = scCurrentIdx.current;
    if (idx >= spans.length) return;

    const span = spans[idx];
    scHistory.current.push({ span, original: span.textContent || "", parent: span.parentNode!, next: span.nextSibling as ChildNode | null });
    setScHistoryCount(scHistory.current.length);

    const tn = document.createTextNode(scChangeTo);
    span.parentNode?.replaceChild(tn, span);
    tn.parentElement?.normalize();

    spans.splice(idx, 1);
    scErrorSpans.current = spans;
    scNavigateTo(idx < spans.length ? idx : idx - 1 >= 0 ? idx - 1 : -1);
  }

  function scDoChangeAll() {
    const word = (scWord || "").replace(/^'+|'+$/g, "").toLowerCase();
    const spans = scErrorSpans.current;
    let removedBefore = 0;
    const remaining: HTMLElement[] = [];

    spans.forEach((span, i) => {
      if ((span.textContent || "").replace(/^'+|'+$/g, "").toLowerCase() === word) {
        scHistory.current.push({ span, original: span.textContent || "", parent: span.parentNode!, next: span.nextSibling as ChildNode | null });
        const tn = document.createTextNode(scChangeTo);
        span.parentNode?.replaceChild(tn, span);
        if (i < scCurrentIdx.current) removedBefore++;
      } else {
        remaining.push(span);
      }
    });

    editorRef.current?.normalize();
    setScHistoryCount(scHistory.current.length);
    scErrorSpans.current = remaining;
    const newIdx = scCurrentIdx.current - removedBefore;
    scNavigateTo(remaining.length === 0 ? -1 : Math.min(newIdx, remaining.length - 1));
  }

  function scDoAdd() {
    const word = (scWord || "").replace(/^'+|'+$/g, "");
    if (!word || !scChecker.current) return;
    scChecker.current.add(word);
    try {
      const existing = JSON.parse(localStorage.getItem("sl-custom-words") || "[]") as string[];
      if (!existing.includes(word)) { existing.push(word); localStorage.setItem("sl-custom-words", JSON.stringify(existing)); }
    } catch { /* ignore */ }
    scDoIgnoreAll();
  }

  function scDoUndoLast() {
    if (scHistory.current.length === 0) return;
    const { span, original, parent, next } = scHistory.current.pop()!;
    setScHistoryCount(scHistory.current.length);

    span.textContent = original;
    span.className = "sl-spell-error";

    if (next && next.parentNode === parent) { parent.insertBefore(span, next); }
    else { parent.appendChild(span); }

    const spans = scErrorSpans.current;
    let insertIdx = spans.length;
    for (let i = 0; i < spans.length; i++) {
      if (span.compareDocumentPosition(spans[i]) & Node.DOCUMENT_POSITION_FOLLOWING) { insertIdx = i; break; }
    }
    spans.splice(insertIdx, 0, span);
    scErrorSpans.current = spans;
    scNavigateTo(insertIdx);
  }

  function closeSpellCheck() {
    clearSpellMarks();
    setShowSpellCheck(false);
    setScDone(false);
    setScPosState(null);
    setScHistoryCount(0);
    scHistory.current = [];
    scIgnoredAll.current = new Set();
    scErrorSpans.current = [];
    scCurrentIdx.current = 0;
  }

  function hideSpellCheck() {
    setShowSpellCheck(false);
  }

  return {
    show: showSpellCheck,
    startSpellCheck,
    closeSpellCheck,
    hideSpellCheck,
    scLoading,
    scDone,
    scWord,
    scSuggestions,
    scChangeTo,
    setScChangeTo,
    scPosState,
    setScPosState,
    scHistoryCount,
    scDragOrigin,
    scDoIgnore,
    scDoIgnoreAll,
    scDoChange,
    scDoChangeAll,
    scDoAdd,
    scDoUndoLast,
  };
}
