// src/dialog/components/toolbar/useFindReplace.ts
import React, { useEffect, useRef, useState } from "react";

export interface UseFindReplaceResult {
  show: boolean;
  openFindReplace: () => void;
  closeFindReplace: () => void;
  frTab: "find" | "replace";
  setFrTab: (v: "find" | "replace") => void;
  frPos: { x: number; y: number } | null;
  setFrPos: (v: { x: number; y: number } | null) => void;
  findText: string;
  setFindText: (v: string) => void;
  replaceTextVal: string;
  setReplaceTextVal: (v: string) => void;
  matchCase: boolean;
  setMatchCase: (v: boolean) => void;
  wholeWord: boolean;
  setWholeWord: (v: boolean) => void;
  useRegex: boolean;
  setUseRegex: (v: boolean) => void;
  matchCount: number;
  activeIdx: number;
  hasSearched: boolean;
  findInputRef: React.RefObject<HTMLInputElement>;
  dragOrigin: React.MutableRefObject<{ mx: number; my: number; bx: number; by: number } | null>;
  navigateMatch: (dir: "prev" | "next") => void;
  replaceOne: () => void;
  replaceAll: () => void;
}

export function useFindReplace(editorRef: React.RefObject<HTMLDivElement>): UseFindReplaceResult {
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [frTab, setFrTab] = useState<"find" | "replace">("find");
  const [frPos, setFrPos] = useState<{ x: number; y: number } | null>(null);
  const [findText, setFindText] = useState("");
  const [replaceTextVal, setReplaceTextVal] = useState("");
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [hasSearched, setHasSearched] = useState(false);
  const matchEls = useRef<HTMLElement[]>([]);
  const findInputRef = useRef<HTMLInputElement>(null);
  const dragOrigin = useRef<{ mx: number; my: number; bx: number; by: number } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  function clearHighlights() {
    const el = editorRef.current;
    if (!el) return;
    const spans = el.querySelectorAll(".sl-find-match, .sl-find-active");
    spans.forEach((s) => {
      const p = s.parentNode;
      if (!p) return;
      p.replaceChild(document.createTextNode(s.textContent || ""), s);
      p.normalize();
    });
    matchEls.current = [];
    setMatchCount(0);
    setActiveIdx(-1);
    setHasSearched(false);
  }

  function buildSearchRegex(
    query: string,
    opts: { matchCase: boolean; wholeWord: boolean; useRegex: boolean }
  ): RegExp | null {
    if (!query) return null;
    try {
      const flags = opts.matchCase ? "g" : "gi";
      let pattern = opts.useRegex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (opts.wholeWord && !opts.useRegex) pattern = `\\b${pattern}\\b`;
      return new RegExp(pattern, flags);
    } catch {
      return null;
    }
  }

  function runSearch(
    query: string,
    opts?: { matchCase: boolean; wholeWord: boolean; useRegex: boolean }
  ) {
    const el = editorRef.current;
    if (!el) return;
    const old = el.querySelectorAll(".sl-find-match, .sl-find-active");
    old.forEach((s) => {
      const p = s.parentNode;
      if (!p) return;
      p.replaceChild(document.createTextNode(s.textContent || ""), s);
      p.normalize();
    });
    matchEls.current = [];

    if (!query.trim()) {
      setMatchCount(0);
      setActiveIdx(-1);
      setHasSearched(true);
      return;
    }

    const options = opts ?? { matchCase, wholeWord, useRegex };
    const re = buildSearchRegex(query, options);
    if (!re) {
      setMatchCount(0);
      setActiveIdx(-1);
      setHasSearched(true);
      return;
    }

    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    const textNodes: Text[] = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode as Text);

    const matches: HTMLElement[] = [];

    for (const tn of textNodes) {
      const text = tn.textContent || "";
      re.lastIndex = 0;
      let m = re.exec(text);
      if (!m) continue;

      const parent = tn.parentNode;
      if (!parent) continue;

      const frag = document.createDocumentFragment();
      let lastIdx = 0;

      while (m) {
        if (m.index > lastIdx) frag.appendChild(document.createTextNode(text.slice(lastIdx, m.index)));
        const span = document.createElement("span");
        span.className = "sl-find-match";
        span.textContent = text.slice(m.index, m.index + m[0].length);
        frag.appendChild(span);
        matches.push(span);
        lastIdx = m.index + (m[0].length || 1);
        re.lastIndex = lastIdx;
        m = re.exec(text);
      }

      if (lastIdx < text.length) frag.appendChild(document.createTextNode(text.slice(lastIdx)));
      parent.replaceChild(frag, tn);
    }

    matchEls.current = matches;
    setMatchCount(matches.length);
    setHasSearched(true);

    if (matches.length > 0) {
      matches[0].classList.add("sl-find-active");
      setActiveIdx(0);
      matches[0].scrollIntoView({ block: "nearest" });
    } else {
      setActiveIdx(-1);
    }
  }

  function navigateMatch(dir: "prev" | "next") {
    const ms = matchEls.current;
    if (ms.length === 0) return;
    if (activeIdx >= 0 && activeIdx < ms.length) ms[activeIdx].classList.remove("sl-find-active");
    let ni: number;
    if (dir === "next") ni = (activeIdx + 1) % ms.length;
    else ni = (activeIdx - 1 + ms.length) % ms.length;
    ms[ni].classList.add("sl-find-active");
    ms[ni].scrollIntoView({ block: "nearest" });
    setActiveIdx(ni);
  }

  function replaceOne() {
    const ms = matchEls.current;
    if (ms.length === 0 || activeIdx < 0 || activeIdx >= ms.length) return;
    const cur = ms[activeIdx];
    cur.textContent = replaceTextVal;
    cur.classList.remove("sl-find-match", "sl-find-active");
    const p = cur.parentNode;
    if (p) {
      p.replaceChild(document.createTextNode(cur.textContent || ""), cur);
      p.normalize();
    }
    ms.splice(activeIdx, 1);
    matchEls.current = ms;
    const newCount = ms.length;
    setMatchCount(newCount);
    if (newCount === 0) {
      setActiveIdx(-1);
      return;
    }
    const ni = activeIdx < newCount ? activeIdx : newCount - 1;
    ms[ni].classList.add("sl-find-active");
    setActiveIdx(ni);
  }

  function replaceAll() {
    const ms = matchEls.current;
    if (ms.length === 0) return;
    const el = editorRef.current;
    ms.forEach((s) => {
      s.textContent = replaceTextVal;
      s.classList.remove("sl-find-match", "sl-find-active");
      const p = s.parentNode;
      if (p) {
        p.replaceChild(document.createTextNode(s.textContent || ""), s);
        if (el && p !== el) p.normalize();
      }
    });
    if (el) el.normalize();
    matchEls.current = [];
    setMatchCount(0);
    setActiveIdx(-1);
  }

  useEffect(() => {
    if (!showFindReplace) clearHighlights();
  }, [showFindReplace]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!showFindReplace) return undefined;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(findText), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [findText, matchCase, wholeWord, useRegex, showFindReplace]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (showFindReplace) {
      setTimeout(() => findInputRef.current?.focus(), 50);
    }
  }, [showFindReplace]);

  function openFindReplace() {
    setShowFindReplace(true);
  }

  function closeFindReplace() {
    setShowFindReplace(false);
    setFrPos(null);
  }

  return {
    show: showFindReplace,
    openFindReplace,
    closeFindReplace,
    frTab,
    setFrTab,
    frPos,
    setFrPos,
    findText,
    setFindText,
    replaceTextVal,
    setReplaceTextVal,
    matchCase,
    setMatchCase,
    wholeWord,
    setWholeWord,
    useRegex,
    setUseRegex,
    matchCount,
    activeIdx,
    hasSearched,
    findInputRef,
    dragOrigin,
    navigateMatch,
    replaceOne,
    replaceAll,
  };
}
