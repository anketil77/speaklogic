import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { formatDisplayDate } from "@/db/db";
import { useDialogComm } from "@/dialog/hooks/useDialogComm";
import { PanelTable, type PanelTableCol } from "@/dialog/components/PanelTable";
import { ViewArticleDialog } from "@/dialog/components/ViewArticleDialog";
import {
  ListArticlesHeaderIcon,
  FlagViewReportIcon,
  TrashCanIcon,
  SmallCaretDownIcon,
  FilterFunnelIcon,
  FilterWordDocIcon,
  FilterOutlookMailIcon,
  FilterPowerPointIcon,
  FilterShowAllIcon,
} from "@/dialog/components/Icons";
import { colors } from "@/styles/tokens";
import type { FlaggedArticle, Article } from "@/types/db";
import { FooterBar, FooterStatusText, DismissBtn } from "@/dialog/components/FooterButtons";
import { openFlaggedArticleReport } from "@/dialog/utils/reportGenerator";

const SOURCE_LABEL: Record<string, string> = {
  "Word Document": "Word Document",
  "Outlook Mail": "Outlook Mail",
  "PowerPoint Document": "PowerPoint Presentation",
};

const FILTER_OPTIONS: { label: string; value: string | null; icon: React.ReactNode }[] = [
  { label: "Word Document",           value: "Word Document",       icon: <FilterWordDocIcon /> },
  { label: "Outlook Mail",            value: "Outlook Mail",        icon: <FilterOutlookMailIcon /> },
  { label: "PowerPoint Presentation", value: "PowerPoint Document", icon: <FilterPowerPointIcon /> },
  { label: "Show All",                value: null,                  icon: <FilterShowAllIcon /> },
];

const COLUMNS: PanelTableCol<FlaggedArticle>[] = [
  { header: "Article Title", width: "38%", render: (r) => r.articleTitle || "—",                          truncate: true },
  { header: "Category",      width: "18%", render: (r) => r.category || "—",                              truncate: true },
  { header: "Source",        width: "22%", render: (r) => SOURCE_LABEL[r.source] ?? r.source ?? "—",      truncate: true },
  { header: "Date Flagged",  width: "12%", render: (r) => formatDisplayDate(r.flagDate) || "—",           truncate: true },
  { header: "Flagged By",    width: "10%", render: (r) => r.personName || "—",                            truncate: true },
];

function CmdSepBar() {
  return <div style={{ width: 1, height: 20, background: colors.grey88, flexShrink: 0 }} />;
}

export default function FlaggedArticlesView() {
  const { initData, sendMessage, closeDialog } = useDialogComm();

  const allRows = useMemo(
    () => (initData?.flaggedArticles ?? []) as FlaggedArticle[],
    [initData]
  );
  const articles = useMemo(
    () => (initData?.articles ?? []) as Article[],
    [initData]
  );

  const [deletedIds, setDeletedIds] = useState<Set<number>>(new Set());
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [filterSource, setFilterSource] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [viewArticle, setViewArticle] = useState<Article | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const displayRows = useMemo(
    () =>
      allRows
        .filter((r) => !deletedIds.has(r.id as number))
        .filter((r) => filterSource === null || r.source === filterSource),
    [allRows, deletedIds, filterSource]
  );

  const hasSelection = selectedIndex !== null;
  const activeFilterLabel = FILTER_OPTIONS.find((f) => f.value === filterSource)?.label ?? null;

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

  const handleRowClick = useCallback((idx: number) => {
    setSelectedIndex((prev) => (prev === idx ? null : idx));
  }, []);

  const handleFilterSelect = useCallback((value: string | null) => {
    setFilterSource(value);
    setFilterOpen(false);
    setSelectedIndex(null);
  }, []);

  const handleViewArticle = useCallback(() => {
    if (selectedIndex === null) return;
    const row = displayRows[selectedIndex];
    const article = articles.find((a) => a.id === row.articleId);
    if (article) setViewArticle(article);
  }, [selectedIndex, displayRows, articles]);

  const handleDeleteConfirm = useCallback(() => {
    if (pendingDelete === null) return;
    const row = displayRows[pendingDelete];
    if (!row?.id) { setPendingDelete(null); return; }
    sendMessage({ action: "DELETE_FLAGGED_ARTICLE", id: row.id as number });
    setDeletedIds((prev) => new Set(prev).add(row.id as number));
    setPendingDelete(null);
    setSelectedIndex(null);
  }, [pendingDelete, displayRows, sendMessage]);

  return (
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
          <span style={{ fontWeight: 700, fontSize: 15.6, lineHeight: "21px", color: colors.grey11, letterSpacing: -0.1 }}>
            Flagged Articles
          </span>
          <span style={{ fontWeight: 400, fontSize: 11.1, lineHeight: "17px", color: colors.grey38, marginTop: 3 }}>
            Articles flagged for analysis.
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
          padding: "0 8px",
          gap: 4,
          boxSizing: "border-box",
          borderBottom: `1px solid ${colors.grey88}`,
        }}
      >
        {/* Primary: View Selected Article */}
        <button
          disabled={!hasSelection}
          onClick={handleViewArticle}
          title={hasSelection ? "View Selected Article" : "Select a row first"}
          style={{
            height: 28,
            paddingLeft: 10,
            paddingRight: 10,
            display: "flex",
            alignItems: "center",
            background: hasSelection ? "#0078D4" : "#C5C5C5",
            color: "#FFFFFF",
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
          title="Delete Selected"
          disabled={!hasSelection}
          onClick={() => { if (hasSelection) setPendingDelete(selectedIndex); }}
          className="sl-icon-btn"
          style={{
            width: 28, height: 28,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "none", border: "none", borderRadius: 4,
            cursor: hasSelection ? "pointer" : "default",
            opacity: hasSelection ? 1 : 0.35,
            flexShrink: 0,
          }}
        >
          <TrashCanIcon color="#D13438" />
        </button>

        <CmdSepBar />

        {/* Filter */}
        <div ref={filterRef} style={{ position: "relative" }}>
          <button
            title="Filter by source"
            onClick={() => setFilterOpen((o) => !o)}
            aria-expanded={filterOpen}
            aria-haspopup="menu"
            style={{
              height: 28,
              display: "flex", alignItems: "center", gap: 3,
              background: filterSource ? colors.grey92 : "none",
              border: "none", borderRadius: 4, cursor: "pointer", padding: "0 6px",
            }}
          >
            <FilterFunnelIcon />
            <SmallCaretDownIcon color={colors.grey38} />
          </button>
          {filterOpen && (
            <div
              role="menu"
              style={{
                position: "absolute",
                top: "calc(100% + 2px)",
                left: 0,
                zIndex: 200,
                background: colors.white,
                border: "1px solid #E0E0E0",
                boxShadow: "0px 4px 16px rgba(0,0,0,0.12), 0px 1px 4px rgba(0,0,0,0.06)",
                borderRadius: 4,
                width: 210,
              }}
            >
              <div
                style={{
                  padding: "8px 15px 4px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#616161",
                  textTransform: "uppercase",
                  letterSpacing: 0.3,
                }}
              >
                Filter Dropdown
              </div>
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  role="menuitem"
                  onClick={() => handleFilterSelect(opt.value)}
                  style={{
                    display: "flex", alignItems: "center", gap: 9,
                    width: "100%", textAlign: "left",
                    padding: "9px 15px",
                    background: filterSource === opt.value ? colors.grey95 : "none",
                    border: "none", cursor: "pointer",
                    fontSize: 12.3, color: "#1B1B1B",
                    fontFamily: "Inter, inherit",
                  }}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <CmdSepBar />

        {/* View Report */}
        <button
          title="View Report"
          disabled={!hasSelection}
          onClick={() => {
            if (selectedIndex === null) return;
            openFlaggedArticleReport(displayRows[selectedIndex]);
          }}
          className="sl-icon-btn"
          style={{
            width: 28, height: 28,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "none", border: "none", borderRadius: 4,
            cursor: hasSelection ? "pointer" : "default",
            opacity: hasSelection ? 1 : 0.35,
            flexShrink: 0,
          }}
        >
          <FlagViewReportIcon />
        </button>
      </div>

      {/* ── Table body ── */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}>
        {displayRows.length === 0 ? (
          <div
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12.4, color: colors.grey38,
            }}
          >
            {filterSource !== null ? "No flagged articles match the current filter." : "No articles have been flagged yet."}
          </div>
        ) : (
          <PanelTable<FlaggedArticle>
            columns={COLUMNS}
            rows={displayRows}
            selectedIndex={selectedIndex}
            onRowClick={handleRowClick}
            selectionColor={colors.grey95}
          >
            {pendingDelete !== null && (
              <div
                style={{
                  position: "absolute", inset: 0,
                  background: "rgba(255,255,255,0.92)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  zIndex: 10,
                }}
              >
                <div
                  style={{
                    background: colors.white,
                    border: `1px solid ${colors.grey88}`,
                    borderRadius: 6,
                    padding: "20px 24px",
                    maxWidth: 420,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                  }}
                >
                  <p style={{ margin: "0 0 16px", fontSize: 12.4, color: colors.grey11, lineHeight: "18px" }}>
                    Do you want to remove this article from the flagged articles list?
                  </p>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button
                      onClick={() => setPendingDelete(null)}
                      style={{
                        height: 28, padding: "0 16px",
                        background: colors.white,
                        border: `1px solid ${colors.grey78}`,
                        borderRadius: 4, fontSize: 12,
                        fontFamily: "inherit", cursor: "pointer", color: colors.grey11,
                      }}
                    >
                      No
                    </button>
                    <button
                      onClick={handleDeleteConfirm}
                      style={{
                        height: 28, padding: "0 16px",
                        background: "#D13438", border: "none",
                        borderRadius: 4, fontSize: 12, fontWeight: 700,
                        fontFamily: "inherit", cursor: "pointer", color: colors.white,
                      }}
                    >
                      Yes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </PanelTable>
        )}
      </div>

      {/* ── Footer ── */}
      <FooterBar>
        <FooterStatusText>
          {displayRows.length} record{displayRows.length !== 1 ? "s" : ""}
          {activeFilterLabel && activeFilterLabel !== "Show All"
            ? ` · Filtered: ${activeFilterLabel}`
            : ""}
        </FooterStatusText>
        <DismissBtn label="Close" onClick={closeDialog} />
      </FooterBar>

      {/* ── ViewArticleDialog portal ── */}
      {viewArticle && (
        <ViewArticleDialog
          article={viewArticle}
          onClose={() => setViewArticle(null)}
          onFlagForAnalysis={() => sendMessage({ action: "FLAG_ARTICLE", id: viewArticle.id as number })}
          onAnalyzeArticle={() => sendMessage({ action: "ANALYZE_ARTICLE", id: viewArticle.id as number })}
          onRequestFeedback={() => sendMessage({ action: "REQUEST_FEEDBACK_ARTICLE", id: viewArticle.id as number })}
        />
      )}
    </div>
  );
}
