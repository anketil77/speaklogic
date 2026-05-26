// src/dialog/views/CreateArticleView.tsx

import React, { useRef, useState, useCallback, useEffect } from "react";
import { useDialogComm } from "@/dialog/hooks/useDialogComm";
import { ArticleHeaderIcon, ArticleCaretDownIcon } from "@/dialog/components/Icons";

const CATEGORIES = ["Non-Sport", "Sport", "Product Review"] as const;
type Category = (typeof CATEGORIES)[number] | "";

export default function CreateArticleView() {
  const { sendMessage } = useDialogComm();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [givenSetOn, setGivenSetOn] = useState(true);
  const [articleBasisReference, setArticleBasisReference] = useState("");
  const [contentEmpty, setContentEmpty] = useState(true);
  const [error, setError] = useState("");
  const [saveHover, setSaveHover] = useState(false);
  const [draftHover, setDraftHover] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const categoryPanelRef = useRef<HTMLDivElement>(null);

  // Close category dropdown on outside click
  useEffect(() => {
    if (!categoryOpen) return undefined;
    const handler = (e: MouseEvent) => {
      if (categoryPanelRef.current && !categoryPanelRef.current.contains(e.target as Node)) {
        setCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [categoryOpen]);

  const handleContentInput = useCallback(() => {
    const text = contentRef.current?.innerText ?? "";
    setContentEmpty(!text.trim());
    setError("");
  }, []);

  const handleSave = useCallback((isDraft: 0 | 1) => {
    const content = contentRef.current?.innerHTML ?? "";
    if (isDraft === 0) {
      if (!title.trim()) { setError("Article Title is required."); return; }
      const plainText = contentRef.current?.innerText?.trim() ?? "";
      if (!plainText) { setError("Article Content is required."); return; }
    }
    setError("");
    sendMessage({
      action: "SAVE_ARTICLE",
      payload: {
        articleTitle: title.trim(),
        articleContent: content,
        category,
        articleBasisReference,
        isProviderUseGivenSetOfInfo: givenSetOn ? 1 : 0,
        isDraft,
      },
    });
  }, [title, category, articleBasisReference, givenSetOn, sendMessage]);

  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", background: "#FFFFFF", fontFamily: "'Inter','Segoe UI',sans-serif", overflow: "hidden" }}>

      {/* Header */}
      <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: "13px 16px 11px", height: 43, flexShrink: 0 }}>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 9 }}>
          <ArticleHeaderIcon />
          <span style={{ fontWeight: 700, fontSize: 12.7, lineHeight: "15px", color: "#1B1B1B" }}>Create Blank Article</span>
        </div>
      </div>

      {/* Scrollable content area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 16, gap: 14, overflowY: "auto" }}>

        {/* Error bar */}
        {error && (
          <div style={{ background: "#FFF4CE", border: "1px solid #F0C808", borderRadius: 4, padding: "6px 10px", fontSize: 11, color: "#1B1B1B", flexShrink: 0 }}>
            {error}
          </div>
        )}

        {/* Article Title + Category box */}
        <div style={{ boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "13px 14px", gap: 10, border: "1px solid #E0E0E0", borderRadius: 6, flexShrink: 0 }}>
          {/* Title input */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "1px 0px 12px", width: "100%" }}>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); if (error) setError(""); }}
              placeholder="Article Title"
              style={{ width: "100%", border: "none", outline: "none", fontSize: 13.1, lineHeight: "16px", color: "#1B1B1B", background: "transparent", padding: 0, fontFamily: "inherit" }}
            />
          </div>
          {/* Category row */}
          <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <span style={{ fontSize: 10.3, lineHeight: "12px", color: "#616161" }}>Category</span>
            <div style={{ position: "relative" }} ref={categoryPanelRef}>
              <button
                onClick={() => setCategoryOpen((o) => !o)}
                aria-expanded={categoryOpen}
                aria-haspopup="menu"
                style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 3, background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
              >
                <span style={{ fontSize: 10.3, lineHeight: "12px", color: category ? "#1B1B1B" : "#ADADAD" }}>
                  {category || "Select category"}
                </span>
                <ArticleCaretDownIcon />
              </button>
              {categoryOpen && (
                <div role="menu" style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, background: "#FFFFFF", border: "1px solid #E0E0E0", borderRadius: 4, boxShadow: "0 4px 12px rgba(0,0,0,0.12)", zIndex: 10, minWidth: 130 }}>
                  {CATEGORIES.map((cat) => (
                    <div
                      key={cat}
                      role="menuitem"
                      onClick={() => { setCategory(cat); setCategoryOpen(false); }}
                      onKeyDown={(e) => { if (e.key === "Enter") { setCategory(cat); setCategoryOpen(false); } }}
                      tabIndex={0}
                      style={{ padding: "6px 12px", fontSize: 10.3, color: "#1B1B1B", cursor: "pointer" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "#F5F5F5"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                    >
                      {cat}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* About The Given Set box */}
        <div style={{ boxSizing: "border-box", border: "1px solid #E0E0E0", borderRadius: 6, flexShrink: 0 }}>
          {/* Section header bar */}
          <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: "7px 11px", background: "#F5F5F5" }}>
            <span style={{ fontWeight: 700, fontSize: 10.7, lineHeight: "13px", color: "#1B1B1B" }}>About The Given Set</span>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 13, height: 13, background: "#0078D4", borderRadius: 6.5, fontWeight: 700, fontSize: 8, lineHeight: "10px", color: "#FFFFFF" }}>?</span>
          </div>
          {/* Section body */}
          <div style={{ display: "flex", flexDirection: "column", padding: 11, gap: 9 }}>
            {/* Toggle row */}
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11.1, lineHeight: "17px", color: "#1B1B1B", flex: 1 }}>
                Does provider use The Given Set to provide this information?
              </span>
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <span style={{ fontWeight: 700, fontSize: 11, lineHeight: "13px", color: "#616161" }}>Yes</span>
                <div
                  role="switch"
                  aria-checked={givenSetOn}
                  onClick={() => setGivenSetOn((v) => !v)}
                  onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") setGivenSetOn((v) => !v); }}
                  tabIndex={0}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: givenSetOn ? "flex-end" : "flex-start",
                    padding: 3,
                    width: 40,
                    height: 20,
                    borderRadius: 20,
                    background: givenSetOn ? "#0078D4" : "#C7C7C7",
                    cursor: "pointer",
                    boxSizing: "border-box",
                    border: "none",
                    outline: "none",
                    transition: "background 0.15s",
                  }}
                >
                  <div style={{ width: 14, height: 14, background: "#FFFFFF", borderRadius: 7, flexShrink: 0 }} />
                </div>
              </div>
            </div>
            {/* Article Basis Reference */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontWeight: 700, fontSize: 9.8, lineHeight: "12px", color: "#1B1B1B" }}>Article Basis Reference</label>
              <input
                type="text"
                value={articleBasisReference}
                onChange={(e) => setArticleBasisReference(e.target.value)}
                placeholder="Enter reference number"
                style={{ boxSizing: "border-box", padding: "7px 9px", height: 30, width: "100%", background: "#FFFFFF", border: "1px solid #C7C7C7", borderRadius: 4, fontSize: 11.1, color: "#1B1B1B", fontFamily: "inherit", outline: "none" }}
              />
            </div>
          </div>
        </div>

        {/* Article Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 11.4, lineHeight: "14px", color: "#1B1B1B" }}>Article Content</span>
          <div style={{ position: "relative" }}>
            {contentEmpty && (
              <span style={{ position: "absolute", left: 11, top: 12, fontSize: 11.1, color: "#ADADAD", pointerEvents: "none", userSelect: "none" }}>
                Add article content here
              </span>
            )}
            <div
              ref={contentRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleContentInput}
              style={{ boxSizing: "border-box", padding: "12px 11px", minHeight: 121, border: "1px solid #E0E0E0", borderRadius: 6, fontSize: 11.1, lineHeight: "15px", color: "#1B1B1B", outline: "none", fontFamily: "inherit", wordBreak: "break-word" }}
            />
          </div>
        </div>

      </div>

      {/* Footer */}
      <div style={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", padding: "10px 16px", gap: 8, borderTop: "1px solid #E0E0E0", flexShrink: 0 }}>
        <button
          onClick={() => handleSave(1)}
          onMouseEnter={() => setDraftHover(true)}
          onMouseLeave={() => setDraftHover(false)}
          style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "0 14px", width: 99, height: 28, background: draftHover ? "#F5F5F5" : "#FFFFFF", border: "1px solid #C7C7C7", borderRadius: 4, fontWeight: 700, fontSize: 10.8, lineHeight: "13px", color: "#1B1B1B", cursor: "pointer", fontFamily: "inherit" }}
        >
          Save as draft
        </button>
        <button
          onClick={() => handleSave(0)}
          onMouseEnter={() => setSaveHover(true)}
          onMouseLeave={() => setSaveHover(false)}
          style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "0 14px", width: 94, height: 28, background: saveHover ? "#106EBE" : "#0078D4", border: `1px solid ${saveHover ? "#106EBE" : "#0078D4"}`, borderRadius: 4, fontWeight: 700, fontSize: 10.7, lineHeight: "13px", color: "#FFFFFF", cursor: "pointer", fontFamily: "inherit" }}
        >
          Save Article
        </button>
      </div>
    </div>
  );
}
