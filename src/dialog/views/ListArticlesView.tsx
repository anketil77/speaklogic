// src/dialog/views/ListArticlesView.tsx
// Full-screen list view for saved articles — matches C# ListOfArticle.cs.
// No toolbar (read-only list). No custom close button (native OS window chrome).

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useDialogComm } from "@/dialog/hooks/useDialogComm";
import { PanelTable, type PanelTableCol } from "@/dialog/components/PanelTable";
import { ViewArticleDialog } from "@/dialog/components/ViewArticleDialog";
import {
  ListArticlesHeaderIcon,

  DeleteSelectedIcon,
  EditSelectedAnalysisIcon,
  PublishArticleIcon,
  FilterFunnelIcon,
  SmallCaretDownIcon,
  FilterWordDocIcon,
  FilterOutlookMailIcon,
  FilterPowerPointIcon,
  FilterShowAllIcon,
} from "@/dialog/components/Icons";
import { PublishArticleDialog } from "@/dialog/components/PublishArticleDialog";
import { colors } from "@/styles/tokens";
import type { Article } from "@/types/db";
import { FooterBar, FooterStatusText, DismissBtn } from "@/dialog/components/FooterButtons";

// ── Info messages (mirror C# messages verbatim) ───────────────────────────────
const INFO_MESSAGES = {
  edit: {
    title: "Edit Article Message",
    text: "An article that has already been saved may not be edited directly. By selecting the current article and viewing it, then I can determine whether or not it is possible to edit an article that has been saved already.",
  },
} as const;

// ── Source display map ────────────────────────────────────────────────────────
const SOURCE_DISPLAY: Record<string, string> = {
  "Word Document": "Word Document",
  "Outlook Mail": "Outlook Mail",
  "PowerPoint Document": "PowerPoint Presentation",
};

// ── Filter options (Word Doc / Outlook Mail / PowerPoint / Show All) ──────────
const FILTER_OPTIONS: { label: string; value: string | null; icon: React.ReactNode }[] = [
  { label: "Word Document",         value: "Word Document",       icon: <FilterWordDocIcon /> },
  { label: "Outlook Mail",          value: "Outlook Mail",        icon: <FilterOutlookMailIcon /> },
  { label: "PowerPoint Presentation", value: "PowerPoint Document", icon: <FilterPowerPointIcon /> },
  { label: "Show All",              value: null,                  icon: <FilterShowAllIcon /> },
];

// ── Table columns — defined at module level to avoid re-creation ──────────────
const DATA_COLUMNS: PanelTableCol<Article>[] = [
  {
    header: "Title",
    width: "44%",
    render: (a) => (
      <span style={{ display: "flex", alignItems: "center", gap: 5, overflow: "hidden" }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
          {a.articleTitle || "—"}
        </span>
        {a.isPublished === 1 && (
          <span
            style={{
              flexShrink: 0,
              fontSize: 9.5,
              fontWeight: 700,
              color: "#FFFFFF",
              background: "#107C10",
              borderRadius: 3,
              padding: "1px 5px",
              letterSpacing: "0.3px",
              lineHeight: "14px",
            }}
          >
            Published
          </span>
        )}
      </span>
    ),
  },
  {
    header: "Article Number",
    width: "16%",
    render: (a) =>
      a.articleNumber !== undefined && a.articleNumber !== null
        ? String(a.articleNumber)
        : "—",
    truncate: true,
  },
  {
    header: "Category",
    width: "20%",
    render: (a) => a.category || "—",
    truncate: true,
  },
  {
    header: "Source",
    width: "20%",
    render: (a) => SOURCE_DISPLAY[a.source] ?? a.source ?? "—",
    truncate: true,
  },
];

function CmdSepBar() {
  return (
    <div style={{ width: 1, height: 20, background: colors.grey88, flexShrink: 0 }} />
  );
}

export default function ListArticlesView() {
  const { initData, sendMessage, closeDialog } = useDialogComm();

  // ── Local delete-tracking (optimistic removal) ────────────────────────────
  const [deletedIds, setDeletedIds] = useState<Set<number>>(new Set());
  const articles = useMemo(
    () =>
      ((initData?.articles ?? []) as Article[]).filter(
        (a) => a.id === undefined || !deletedIds.has(a.id as number)
      ),
    [initData, deletedIds]
  );

  // ── Selection & filter ────────────────────────────────────────────────────
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [filterSource, setFilterSource] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // ── Delete confirmation overlay ───────────────────────────────────────────
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [cancelDeleteHover, setCancelDeleteHover] = useState(false);
  const [confirmDeleteHover, setConfirmDeleteHover] = useState(false);

  // ── Info message (published-article edit warning) ────────────────────────
  const [infoMsg, setInfoMsg] = useState<{ title: string; text: string } | null>(null);

  // ── View article portal ───────────────────────────────────────────────────
  const [viewArticle, setViewArticle] = useState<Article | null>(null);

  // ── Publish article dialog ────────────────────────────────────────────────
  const [publishTarget, setPublishTarget] = useState<Article | null>(null);


  // ── Article action callbacks (sent to host) ───────────────────────────────
  const handleFlagArticle = useCallback(() => {
    if (!viewArticle) return;
    sendMessage({ action: "FLAG_ARTICLE", id: viewArticle.id });
  }, [viewArticle, sendMessage]);

  const handleAnalyzeArticle = useCallback(() => {
    if (!viewArticle) return;
    sendMessage({ action: "ANALYZE_ARTICLE", id: viewArticle.id });
  }, [viewArticle, sendMessage]);

  const handleRequestFeedbackArticle = useCallback(() => {
    if (!viewArticle) return;
    sendMessage({ action: "REQUEST_FEEDBACK_ARTICLE", id: viewArticle.id });
  }, [viewArticle, sendMessage]);

  // ── Outside-click closes filter dropdown ─────────────────────────────────
  useEffect(() => {
    if (!filterOpen) return undefined;
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [filterOpen]);

  // ── Derived display rows (after filter) ──────────────────────────────────
  const displayRows = useMemo(
    () =>
      filterSource
        ? articles.filter((a) => a.source === filterSource)
        : articles,
    [articles, filterSource]
  );

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleFilterSelect = useCallback((value: string | null) => {
    setFilterSource(value);
    setSelectedIndex(null);
    setFilterOpen(false);
  }, []);

  const handleRowClick = useCallback((idx: number) => {
    setSelectedIndex((prev) => (prev === idx ? null : idx));
  }, []);

  const handleView = useCallback(() => {
    if (selectedIndex === null) return;
    const row = displayRows[selectedIndex];
    if (row) setViewArticle(row);
  }, [selectedIndex, displayRows]);

  const handleDelete = useCallback(() => {
    if (selectedIndex === null) return;
    const row = displayRows[selectedIndex];
    if (row?.id !== undefined) {
      setPendingDelete(row.id as number);
    }
  }, [selectedIndex, displayRows]);

  const confirmDelete = useCallback(() => {
    if (pendingDelete === null) return;
    sendMessage({ action: "DELETE_ARTICLE", id: pendingDelete });
    setDeletedIds((prev) => new Set(prev).add(pendingDelete));
    setSelectedIndex(null);
    setPendingDelete(null);
  }, [pendingDelete, sendMessage]);

  const cancelDelete = useCallback(() => {
    setPendingDelete(null);
  }, []);

  const showInfo = useCallback((key: keyof typeof INFO_MESSAGES) => {
    setInfoMsg(INFO_MESSAGES[key]);
  }, []);

  const handleEdit = useCallback(() => {
    if (selectedIndex === null) return;
    const row = displayRows[selectedIndex];
    if (!row) return;
    if (row.isPublished === 1) {
      showInfo("edit");
    } else {
      sendMessage({ action: "EDIT_ARTICLE", id: row.id as number });
    }
  }, [selectedIndex, displayRows, showInfo, sendMessage]);

  const handlePublish = useCallback(() => {
    if (selectedIndex === null) return;
    const row = displayRows[selectedIndex];
    if (row) setPublishTarget(row);
  }, [selectedIndex, displayRows]);

  const handlePublishConfirm = useCallback((publishers: string[]) => {
    if (!publishTarget?.id) return;
    sendMessage({ action: "PUBLISH_ARTICLE", id: publishTarget.id as number, publishers });
    setPublishTarget(null);
  }, [publishTarget, sendMessage]);

  const handlePublishCancel = useCallback(() => {
    setPublishTarget(null);
  }, []);

  const handleAddPublisher = useCallback((name: string, logoBase64: string) => {
    sendMessage({ action: "ADD_PUBLISHER", name, logoBase64 });
  }, [sendMessage]);

  const handleDeletePublisher = useCallback((id: number) => {
    sendMessage({ action: "DELETE_PUBLISHER", id });
  }, [sendMessage]);

  const selectedRow = selectedIndex !== null ? displayRows[selectedIndex] ?? null : null;
  const hasSelection = selectedIndex !== null;
  const isSelectedPublished = selectedRow?.isPublished === 1;
  const activeFilterLabel = FILTER_OPTIONS.find((f) => f.value === filterSource)?.label ?? null;

  return (
    <>
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Inter, Segoe UI, sans-serif",
        background: colors.white,
        overflow: "hidden",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          height: 78,
          minHeight: 78,
          position: "relative",
          display: "flex",
          alignItems: "flex-start",
          padding: "0 20px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            background: "#EBF3FC",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 21,
            flexShrink: 0,
          }}
        >
          <ListArticlesHeaderIcon />
        </div>
        <div style={{ marginLeft: 12, marginTop: 20, display: "flex", flexDirection: "column", flex: 1 }}>
          <span
            style={{
              fontWeight: 700,
              fontSize: 15.6,
              lineHeight: "21px",
              color: colors.grey11,
              letterSpacing: -0.1,
            }}
          >
            List of Articles
          </span>
          <span
            style={{
              fontWeight: 400,
              fontSize: 11.3,
              lineHeight: "17px",
              color: colors.grey38,
              marginTop: 3,
            }}
          >
            View and manage all saved articles.
          </span>
        </div>
      </div>

      {/* ── Command bar ── */}
      <div
        style={{
          height: 44,
          minHeight: 44,
          background: colors.grey96,
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          gap: 8,
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        {/* Primary: View Selected Article */}
        <button
          disabled={!hasSelection}
          onClick={handleView}
          style={{
            height: 28,
            paddingLeft: 10,
            paddingRight: 8,
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: hasSelection ? colors.azure42 : "#C5C5C5",
            color: colors.white,
            border: "none",
            borderRadius: 4,
            cursor: hasSelection ? "pointer" : "default",
            fontSize: 11.4,
            fontWeight: 700,
            fontFamily: "inherit",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          View Selected Article
        </button>

        <CmdSepBar />

        {/* Delete */}
        <button
          title="Delete Selected Article"
          disabled={!hasSelection}
          onClick={handleDelete}
          className="sl-icon-btn"
          style={{
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "none",
            border: "none",
            borderRadius: 4,
            cursor: hasSelection ? "pointer" : "default",
            opacity: hasSelection ? 1 : 0.35,
            flexShrink: 0,
          }}
        >
          <DeleteSelectedIcon />
        </button>

        {/* Edit — opens editor if unpublished, shows message if published */}
        <button
          title="Edit Selected Article"
          disabled={!hasSelection}
          onClick={handleEdit}
          className="sl-icon-btn"
          style={{
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "none",
            border: "none",
            borderRadius: 4,
            cursor: hasSelection ? "pointer" : "default",
            opacity: hasSelection ? 1 : 0.35,
            flexShrink: 0,
          }}
        >
          <EditSelectedAnalysisIcon />
        </button>

        {/* Publish — disabled when nothing selected or already published */}
        <button
          title={isSelectedPublished ? "Article already published" : "Publish Selected Article"}
          disabled={!hasSelection || isSelectedPublished}
          onClick={handlePublish}
          className="sl-icon-btn"
          style={{
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "none",
            border: "none",
            borderRadius: 4,
            cursor: (hasSelection && !isSelectedPublished) ? "pointer" : "default",
            opacity: (hasSelection && !isSelectedPublished) ? 1 : 0.35,
            flexShrink: 0,
          }}
        >
          <PublishArticleIcon />
        </button>

        <CmdSepBar />

        {/* Filter dropdown */}
        <div ref={filterRef} style={{ position: "relative" }}>
          <button
            title="Filter articles by source"
            aria-expanded={filterOpen}
            aria-haspopup="menu"
            onClick={() => setFilterOpen((prev) => !prev)}
            className="sl-icon-btn"
            style={{
              height: 28,
              paddingLeft: 7,
              paddingRight: 6,
              display: "flex",
              alignItems: "center",
              gap: 3,
              background: "none",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 11.4,
              fontWeight: 500,
              color: colors.grey38,
              fontFamily: "inherit",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <FilterFunnelIcon />
            {activeFilterLabel ? (
              <span style={{ fontSize: 11, color: colors.grey11 }}>{activeFilterLabel}</span>
            ) : null}
            <SmallCaretDownIcon />
          </button>

          {filterOpen && (
            <div
              role="menu"
              style={{
                position: "absolute",
                top: 32,
                left: 0,
                width: 200,
                background: colors.white,
                border: `1px solid ${colors.grey88}`,
                boxShadow: "0px 4px 16px rgba(0,0,0,0.12), 0px 1px 4px rgba(0,0,0,0.06)",
                borderRadius: 4,
                zIndex: 50,
                paddingBottom: 6,
              }}
            >
              <div
                style={{
                  textTransform: "uppercase",
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: "0.5px",
                  color: "#616161",
                  padding: "8px 15px 4px",
                }}
              >
                Filter Dropdown
              </div>
              {FILTER_OPTIONS.map((opt) => (
                <div
                  key={opt.label}
                  role="menuitem"
                  tabIndex={0}
                  onClick={() => handleFilterSelect(opt.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") handleFilterSelect(opt.value);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "9px 15px",
                    cursor: "pointer",
                    fontSize: 12.3,
                    color: filterSource === opt.value ? "#0078D4" : "#1B1B1B",
                    fontWeight: filterSource === opt.value ? 600 : 400,
                    background: "none",
                  }}
                >
                  {opt.icon}
                  {opt.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: 1, background: colors.grey96, flexShrink: 0 }} />

      {/* ── Table area ── */}
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          position: "relative",
          padding: "0 0 0 0",
          boxSizing: "border-box",
        }}
      >
        <PanelTable<Article>
          columns={DATA_COLUMNS}
          rows={displayRows}
          selectedIndex={selectedIndex}
          onRowClick={handleRowClick}
          selectionColor="#EBF3FC"
          emptyText="No articles saved yet."
        >
          {/* Delete confirmation overlay */}
          {pendingDelete !== null && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(255,255,255,0.96)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 20,
                gap: 12,
              }}
            >
              <span
                style={{
                  fontSize: 13.2,
                  fontWeight: 600,
                  color: colors.grey11,
                  textAlign: "center",
                  maxWidth: 320,
                  lineHeight: "20px",
                }}
              >
                Are you sure you want to delete this article?
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={cancelDelete}
                  onMouseEnter={() => setCancelDeleteHover(true)}
                  onMouseLeave={() => setCancelDeleteHover(false)}
                  style={{
                    height: 28,
                    padding: "0 14px",
                    background: cancelDeleteHover ? "#F3F3F3" : colors.white,
                    border: `1px solid ${colors.grey88}`,
                    borderRadius: 4,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    color: colors.grey38,
                    fontFamily: "inherit",
                  }}
                >
                  No
                </button>
                <button
                  onClick={confirmDelete}
                  onMouseEnter={() => setConfirmDeleteHover(true)}
                  onMouseLeave={() => setConfirmDeleteHover(false)}
                  style={{
                    height: 28,
                    padding: "0 14px",
                    background: confirmDeleteHover ? "#C50F1F" : "#D13438",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    color: colors.white,
                    fontFamily: "inherit",
                  }}
                >
                  Yes
                </button>
              </div>
            </div>
          )}
        </PanelTable>
      </div>

      {/* ── Footer ── */}
      <FooterBar>
        <FooterStatusText>
          {displayRows.length} article{displayRows.length !== 1 ? "s" : ""}
          {filterSource ? ` (filtered by ${SOURCE_DISPLAY[filterSource] ?? filterSource})` : ""}
        </FooterStatusText>
        <DismissBtn label="Close" onClick={closeDialog} />
      </FooterBar>
    </div>

    {/* ── Info message card ── */}
    {infoMsg && (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.3)",
          zIndex: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={() => setInfoMsg(null)}
      >
        <div
          style={{
            background: colors.white,
            border: `1px solid ${colors.grey88}`,
            borderRadius: 6,
            boxShadow: "0 8px 24px rgba(0,0,0,0.16)",
            padding: "20px 24px",
            maxWidth: 440,
            width: "90vw",
            fontFamily: "Inter, Segoe UI, sans-serif",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: colors.grey11,
              marginBottom: 10,
            }}
          >
            {infoMsg.title}
          </div>
          <div
            style={{
              fontSize: 13,
              color: colors.grey38,
              lineHeight: "1.55",
            }}
          >
            {infoMsg.text}
          </div>
          <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => setInfoMsg(null)}
              style={{
                height: 28,
                padding: "0 16px",
                background: colors.azure42,
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 12.4,
                fontWeight: 600,
                color: colors.white,
                fontFamily: "inherit",
              }}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── View Article portal ── */}
    {viewArticle && (
      <ViewArticleDialog
        article={viewArticle}
        onClose={() => setViewArticle(null)}
        onFlagForAnalysis={handleFlagArticle}
        onAnalyzeArticle={handleAnalyzeArticle}
        onRequestFeedback={handleRequestFeedbackArticle}
      />
    )}

    {/* ── Publish Article dialog ── */}
    {publishTarget && (
      <PublishArticleDialog
        article={publishTarget}
        publishers={initData.publishers ?? []}
        onCancel={handlePublishCancel}
        onPublish={handlePublishConfirm}
        onAddPublisher={handleAddPublisher}
        onDeletePublisher={handleDeletePublisher}
      />
    )}

    </>
  );
}
