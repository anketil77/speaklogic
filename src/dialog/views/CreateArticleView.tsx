// src/dialog/views/CreateArticleView.tsx

import React, { useRef, useState, useCallback, useEffect } from "react";
import { FooterBar, DismissBtn, PrimaryBtn } from "@/dialog/components/FooterButtons";
import { useDialogComm } from "@/dialog/hooks/useDialogComm";
import { ArticleHeaderIcon, ArticleCaretDownIcon } from "@/dialog/components/Icons";
import {
  CategoryPickerPanel,
  type ArticleCategory,
} from "@/dialog/views/createarticle/CategoryPickerPanel";
import { ArticleEditorPanel } from "@/dialog/views/createarticle/ArticleEditorPanel";
import "@/dialog/components/HtmlContent"; // injects .sl-html-content CSS
import { SectionBox } from "@/dialog/views/createarticle/wizard/SectionBox";
import { GIVEN_SET_HELP_TEXT } from "@/dialog/views/createarticle/wizard/helpTexts";

export default function CreateArticleView() {
  const { initData, sendMessage, submitSave, saving } = useDialogComm();
  const editData = initData?.editArticleData;
  const isEditMode = !!editData;

  // ── Form state ──────────────────────────────────────────────────────────────
  const [title, setTitle]             = useState(editData?.articleTitle ?? "");
  const [category, setCategory]       = useState<ArticleCategory>((editData?.category ?? "") as ArticleCategory);
  const [givenSetOn, setGivenSetOn]   = useState((editData?.isProviderUseGivenSetOfInfo ?? 1) === 1);
  const [articleBasisReference, setArticleBasisReference] = useState(editData?.articleBasisReference ?? "");
  const [contentEmpty, setContentEmpty] = useState(!editData?.articleContent);
  const [error, setError]             = useState("");

  // ── Hover state ─────────────────────────────────────────────────────────────
  const [draftHover, setDraftHover] = useState(false);

  // ── Category picker ─────────────────────────────────────────────────────────
  const [categoryOpen, setCategoryOpen]     = useState(false);
  const [triggerRect, setTriggerRect]       = useState<DOMRect | null>(null);
  const categoryTriggerRef                  = useRef<HTMLButtonElement>(null);

  const openCategoryPicker = useCallback(() => {
    const rect = categoryTriggerRef.current?.getBoundingClientRect();
    if (rect) setTriggerRect(rect);
    setCategoryOpen(true);
  }, []);

  const closeCategoryPicker = useCallback(() => {
    setCategoryOpen(false);
  }, []);

  const handleCategorySelect = useCallback((cat: ArticleCategory) => {
    setCategory(cat);
  }, []);

  // ── Content area ────────────────────────────────────────────────────────────
  const contentRef = useRef<HTMLDivElement>(null);
  const contentInitialized = useRef(false);

  useEffect(() => {
    if (contentInitialized.current) return;
    if (editData?.articleContent && contentRef.current) {
      contentRef.current.innerHTML = editData.articleContent;
      setContentEmpty(false);
      contentInitialized.current = true;
    }
  });

  const isContentEmpty = useCallback((el: HTMLDivElement | null): boolean => {
    if (!el) return true;
    if (el.innerText.trim()) return false;
    if (el.querySelector("img, video")) return false;
    return true;
  }, []);

  const handleContentInput = useCallback(() => {
    setContentEmpty(isContentEmpty(contentRef.current ?? null));
    setError("");
  }, [isContentEmpty]);

  // ── Article Editor Panel ─────────────────────────────────────────────────
  const [showEditorPanel, setShowEditorPanel] = useState(false);

  const openEditorPanel = useCallback(() => setShowEditorPanel(true), []);

  const handlePanelSave = useCallback((html: string) => {
    if (contentRef.current) {
      contentRef.current.innerHTML = html;
      setContentEmpty(isContentEmpty(contentRef.current));
      if (error) setError("");
    }
    setShowEditorPanel(false);
  }, [error, isContentEmpty]);

  const handlePanelClose = useCallback(() => setShowEditorPanel(false), []);

  // ── Save / Draft ────────────────────────────────────────────────────────────
  const handleSave = useCallback(
    (isDraft: 0 | 1) => {
      const content = contentRef.current?.innerHTML ?? "";
      if (isDraft === 0) {
        if (!title.trim()) {
          setError("Article Title is required.");
          return;
        }
        if (isContentEmpty(contentRef.current ?? null)) {
          setError("Article Content is required.");
          return;
        }
      }
      setError("");
      submitSave({
        action: "SAVE_ARTICLE",
        payload: {
          ...(editData?.id !== undefined ? { id: editData.id as number } : {}),
          articleTitle: title.trim(),
          articleContent: content,
          category,
          articleBasisReference,
          isProviderUseGivenSetOfInfo: givenSetOn ? 1 : 0,
          isDraft,
        },
      });
    },
    [title, category, articleBasisReference, givenSetOn, submitSave, isContentEmpty],
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#FFFFFF",
        fontFamily: "'Inter','Segoe UI',sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "13px 16px 11px",
          height: 43,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 9,
          }}
        >
          <ArticleHeaderIcon />
          <span
            style={{
              fontWeight: 700,
              fontSize: 12.7,
              lineHeight: "15px",
              color: "#1B1B1B",
            }}
          >
            {isEditMode ? "Edit Article" : "Create Blank Article"}
          </span>
        </div>
      </div>

      {/* Scrollable body */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: 16,
          gap: 14,
          overflowY: "auto",
        }}
      >
        {/* ── Title + Category card ── */}
        <div
          style={{
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            padding: "13px 14px",
            gap: 10,
            border: "1px solid #E0E0E0",
            borderRadius: 6,
            flexShrink: 0,
          }}
        >
          {/* Title input */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              padding: "1px 0px 12px",
              width: "100%",
              borderBottom: error.includes("Title")
                ? "1.5px solid #D13438"
                : "1px solid #F0F0F0",
            }}
          >
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError("");
              }}
              placeholder="Article Title"
              style={{
                width: "100%",
                border: "none",
                outline: "none",
                fontSize: 13.1,
                lineHeight: "16px",
                color: "#1B1B1B",
                background: "transparent",
                padding: 0,
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Category row */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            <span
              style={{ fontSize: 10.3, lineHeight: "12px", color: "#616161" }}
            >
              Category
            </span>

            {/* Trigger button — captures its own rect on click */}
            <button
              ref={categoryTriggerRef}
              onClick={openCategoryPicker}
              aria-expanded={categoryOpen}
              aria-haspopup="listbox"
              aria-label="Select article category"
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 3,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 0,
                fontFamily: "inherit",
              }}
            >
              <span
                style={{
                  fontSize: 10.3,
                  lineHeight: "12px",
                  color: category ? "#1B1B1B" : "#ADADAD",
                }}
              >
                {category || "Select category"}
              </span>
              <ArticleCaretDownIcon
                color={categoryOpen ? "#0078D4" : "#ADADAD"}
              />
            </button>
          </div>
        </div>

        {/* ── About The Given Set card ── */}
        {/* SectionBox gives the "?" badge a working help popup, same copy as the wizard. */}
        <SectionBox
          title="About The Given Set"
          showHelp
          helpText={GIVEN_SET_HELP_TEXT}
          bodyPadding="11px"
          style={{ flexShrink: 0 }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 9, width: "100%" }}>
            {/* Toggle row */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span
                style={{
                  fontSize: 11.1,
                  lineHeight: "17px",
                  color: "#1B1B1B",
                  flex: 1,
                }}
              >
                Does provider use The Given Set to provide this information?
              </span>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 11,
                    lineHeight: "13px",
                    color: "#616161",
                  }}
                >
                  Yes
                </span>
                <div
                  role="switch"
                  aria-checked={givenSetOn}
                  onClick={() => setGivenSetOn((v) => !v)}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter")
                      setGivenSetOn((v) => !v);
                  }}
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
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      background: "#FFFFFF",
                      borderRadius: 7,
                      flexShrink: 0,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Article Basis Reference */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label
                style={{
                  fontWeight: 700,
                  fontSize: 9.8,
                  lineHeight: "12px",
                  color: "#1B1B1B",
                }}
              >
                Article Basis Reference
              </label>
              <input
                type="text"
                value={articleBasisReference}
                onChange={(e) => setArticleBasisReference(e.target.value)}
                placeholder="Enter reference number"
                style={{
                  boxSizing: "border-box",
                  padding: "7px 9px",
                  height: 30,
                  width: "100%",
                  background: "#FFFFFF",
                  border: "1px solid #C7C7C7",
                  borderRadius: 4,
                  fontSize: 11.1,
                  color: "#1B1B1B",
                  fontFamily: "inherit",
                  outline: "none",
                }}
              />
            </div>
          </div>
        </SectionBox>

        {/* ── Article Content ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span
            style={{
              fontWeight: 700,
              fontSize: 11.4,
              lineHeight: "14px",
              color: "#1B1B1B",
            }}
          >
            Article Content
          </span>
          {/* Clicking anywhere on the content area opens the editor panel */}
          <div
            style={{ position: "relative", cursor: "text" }}
            onClick={openEditorPanel}
          >
            {contentEmpty && (
              <span
                style={{
                  position: "absolute",
                  left: 11,
                  top: 12,
                  fontSize: 11.1,
                  color: "#ADADAD",
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              >
                Add article content here
              </span>
            )}
            {/* Read-only preview of saved content; editing happens in panel */}
            <div
              ref={contentRef}
              suppressContentEditableWarning
              onInput={handleContentInput}
              className="sl-html-content"
              style={{
                boxSizing: "border-box",
                padding: "12px 11px",
                minHeight: 121,
                border: error.includes("Content")
                  ? "1.5px solid #D13438"
                  : "1px solid #E0E0E0",
                borderRadius: 6,
                fontSize: 11.8,
                lineHeight: 1.7,
                color: "#1B1B1B",
                outline: "none",
                fontFamily: "inherit",
                wordBreak: "break-word",
                cursor: "text",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <FooterBar>
        {/* ── Error indicator (bottom-left) ── */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
          {error && (
            <>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
                <path d="M6.5 1.5L12 11.5H1L6.5 1.5Z" stroke="#D13438" strokeWidth="1.2" strokeLinejoin="round"/>
                <path d="M6.5 5.5V8" stroke="#D13438" strokeWidth="1.3" strokeLinecap="round"/>
                <circle cx="6.5" cy="10" r="0.7" fill="#D13438"/>
              </svg>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  lineHeight: "13px",
                  color: "#D13438",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {error}
              </span>
            </>
          )}
        </div>
        <DismissBtn label="Cancel" onClick={() => sendMessage({ action: "CLOSE" })} />
        {/* Save as draft — keep inline */}
        <button
          onClick={() => handleSave(1)}
          disabled={saving}
          onMouseEnter={() => setDraftHover(true)}
          onMouseLeave={() => setDraftHover(false)}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "0 14px",
            width: 99,
            height: 28,
            background: draftHover ? "#F5F5F5" : "#FFFFFF",
            border: "1px solid #C7C7C7",
            borderRadius: 4,
            fontWeight: 700,
            fontSize: 10.8,
            lineHeight: "13px",
            color: "#1B1B1B",
            cursor: saving ? "default" : "pointer",
            fontFamily: "inherit",
            opacity: saving ? 0.7 : 1,
          }}
        >
          Save as draft
        </button>
        <PrimaryBtn label={saving ? "Saving…" : "Save Article"} onClick={() => handleSave(0)} disabled={saving} />
      </FooterBar>

      {/* ── Category picker portal ── */}
      {categoryOpen && triggerRect && (
        <CategoryPickerPanel
          triggerRect={triggerRect}
          selectedCategory={category}
          onSelect={handleCategorySelect}
          onClose={closeCategoryPicker}
        />
      )}

      {/* ── Article Editor Panel portal ── */}
      {showEditorPanel && (
        <ArticleEditorPanel
          initialContent={contentRef.current?.innerHTML ?? ""}
          onSave={handlePanelSave}
          onClose={handlePanelClose}
        />
      )}
    </div>
  );
}
