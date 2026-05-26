// src/dialog/views/RetainedHistoryView.tsx
// Read-only list of analyses saved with WhatToDoWithAnalysis = 'RetainAnalysisAsNeed'. No toolbar.

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useDialogComm } from "@/dialog/hooks/useDialogComm";
import { PanelTable, type PanelTableCol } from "@/dialog/components/PanelTable";
import { ViewAnalysisDialog } from "@/dialog/components/ViewAnalysisDialog";
import {
  AnalysisHistoryHeaderIcon,
  ViewSelectedIcon,
  SmallCaretDownIcon,
  DeleteSelectedIcon,
  EditSelectedAnalysisIcon,
  ApplySelectionFeedbackIcon,
  ProvideFeedbackAnalysisIcon,
  FlagAnalysisCommunicationIcon,
  FilterFunnelIcon,
  ViewReportIcon,
  FilterWordDocIcon,
  FilterOutlookMailIcon,
  FilterPowerPointIcon,
  FilterShowAllIcon,
} from "@/dialog/components/Icons";
import { colors } from "@/styles/tokens";
import type { ProjectAnalysis } from "@/types/db";
import { openAnalysisReport } from "@/dialog/utils/reportGenerator";

const SOURCE_DISPLAY: Record<string, string> = {
  "Word Document": "Word Document",
  "Outlook Mail": "Outlook Mail",
  "PowerPoint Document": "PowerPoint Presentation",
};

const FILTER_OPTIONS: { label: string; value: string | null; icon: React.ReactNode }[] = [
  { label: "Word Document", value: "Word Document", icon: <FilterWordDocIcon /> },
  { label: "Outlook Mail", value: "Outlook Mail", icon: <FilterOutlookMailIcon /> },
  { label: "PowerPoint Presentation", value: "PowerPoint Document", icon: <FilterPowerPointIcon /> },
  { label: "Show All", value: null, icon: <FilterShowAllIcon /> },
];

const INFO_MESSAGES = {
  edit: {
    title: "Edit Analysis Message",
    text: "An analysis that is already been performed on an entity may not be be edited. By selecting the current analysis and view it, then then I can determine whether or not it is possible to edit an an analysis that has been performed already.",
  },
  apply: {
    title: "Apply Analysis as Feedback",
    text: "It may be possible to applied a retained analysis as feedback. By viewing the selected analysis, then I will be able to apply it as feedback.",
  },
  provide: {
    title: "Provide Feedback With Analysis",
    text: "It may be possible to provide feedback with a retained analysis. By selecting the analysis and view it, I will be able to provide feedback with the analysis.",
  },
  flag: {
    title: "Flag Analysis as Communication",
    text: "In order to flag an analysis as communication, that analysis must be visible. In order for me to flag this analysis as communication, I have to select it and view it.",
  },
} as const;

function CmdSepBar() {
  return (
    <div style={{ width: 1, height: 20, background: colors.grey88, flexShrink: 0 }} />
  );
}

const DATA_COLUMNS: PanelTableCol<ProjectAnalysis>[] = [
  {
    header: "From Person",
    width: "21%",
    render: (a) => a.fromPerson || "—",
    truncate: true,
  },
  {
    header: "Analysis Date",
    width: "22%",
    render: (a) => a.analysisDate || "—",
    truncate: true,
  },
  {
    header: "Analysis Subject",
    width: "27%",
    render: (a) => a.analysisSubject || "—",
    truncate: true,
  },
  {
    header: "Entity Analyzed",
    width: "26%",
    render: (a) => SOURCE_DISPLAY[a.source] ?? a.source ?? "—",
    truncate: true,
  },
];


export default function RetainedHistoryView() {
  const { initData, sendMessage, closeDialog } = useDialogComm();

  const [deletedIds, setDeletedIds] = useState<Set<number>>(new Set());
  const analyses = useMemo(
    () =>
      ((initData?.analyses ?? []) as ProjectAnalysis[]).filter(
        (a) => a.id === undefined || !deletedIds.has(a.id as number)
      ),
    [initData, deletedIds]
  );

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [filterSource, setFilterSource] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [infoMsg, setInfoMsg] = useState<{ title: string; text: string } | null>(null);
  const [cancelHover, setCancelHover] = useState(false);
  const [viewAnalysis, setViewAnalysis] = useState<ProjectAnalysis | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

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

  const displayRows = useMemo(
    () => (filterSource ? analyses.filter((a) => a.source === filterSource) : analyses),
    [analyses, filterSource]
  );

  const handleFilterSelect = useCallback((value: string | null) => {
    setFilterSource(value);
    setSelectedIndex(null);
    setFilterOpen(false);
  }, []);

  const handleRowClick = useCallback((idx: number) => {
    setSelectedIndex((prev) => (prev === idx ? null : idx));
  }, []);

  const handleDelete = useCallback(() => {
    if (selectedIndex === null) return;
    const row = displayRows[selectedIndex];
    if (row?.id !== undefined) {
      setPendingDelete(row.id as number);
    }
  }, [selectedIndex, displayRows]);

  const confirmDelete = useCallback(() => {
    if (pendingDelete === null) return;
    sendMessage({ action: "DELETE_ANALYSIS", id: pendingDelete });
    setDeletedIds((prev) => new Set(prev).add(pendingDelete));
    setSelectedIndex(null);
    setPendingDelete(null);
  }, [pendingDelete, sendMessage]);

  const showInfo = useCallback((key: keyof typeof INFO_MESSAGES) => {
    setInfoMsg(INFO_MESSAGES[key]);
  }, []);

  const hasSelection = selectedIndex !== null;
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
          <AnalysisHistoryHeaderIcon />
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
            List of Retained Analysis
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
            View and manage all retained analyses.
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
        }}
      >
        {/* Primary: View Selected Analysis */}
        <button
          disabled={!hasSelection}
          onClick={() => {
            if (selectedIndex !== null) setViewAnalysis(displayRows[selectedIndex]);
          }}
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
          <ViewSelectedIcon />
          View Selected Analysis
        </button>

        <CmdSepBar />

        {/* Delete */}
        <button
          title="Delete Selected Analysis"
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

        {/* Edit (info-only) */}
        <button
          title="Edit Selected Analysis"
          onClick={() => showInfo("edit")}
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
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <EditSelectedAnalysisIcon />
        </button>

        <CmdSepBar />

        {/* Apply Analysis as Feedback (info-only) */}
        <button
          title="Apply Analysis as Feedback"
          onClick={() => showInfo("apply")}
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
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <ApplySelectionFeedbackIcon />
        </button>

        {/* Provide Feedback With Analysis (info-only) */}
        <button
          title="Provide Feedback With Analysis"
          onClick={() => showInfo("provide")}
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
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <ProvideFeedbackAnalysisIcon />
        </button>

        {/* Flag Analysis as Communication (info-only) */}
        <button
          title="Flag Analysis as Communication"
          onClick={() => showInfo("flag")}
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
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <FlagAnalysisCommunicationIcon />
        </button>

        <CmdSepBar />

        {/* Filter */}
        <div ref={filterRef} style={{ position: "relative" }}>
          <button
            onClick={() => setFilterOpen((o) => !o)}
            aria-expanded={filterOpen}
            aria-haspopup="menu"
            style={{
              height: 28,
              width: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              background: filterSource ? colors.grey92 : "none",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              padding: "0 6px",
            }}
            title={activeFilterLabel ? `Filter: ${activeFilterLabel}` : "Filter by source"}
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
                width: 200,
              }}
            >
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  role="menuitem"
                  onClick={() => handleFilterSelect(opt.value)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    width: "100%",
                    textAlign: "left",
                    padding: "9px 15px",
                    background: filterSource === opt.value ? colors.grey95 : "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 12.3,
                    color: "#1B1B1B",
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
          title="View Analysis Report"
          disabled={!hasSelection}
          onClick={() => {
            if (selectedIndex === null) return;
            const analysis = displayRows[selectedIndex];
            if (!analysis) return;
            openAnalysisReport(analysis);
          }}
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
          <ViewReportIcon />
        </button>
      </div>

      {/* ── Table body ── */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {displayRows.length === 0 ? (
          <EmptyState filtered={filterSource !== null} />
        ) : (
          <PanelTable<ProjectAnalysis>
            columns={DATA_COLUMNS}
            rows={displayRows}
            selectedIndex={selectedIndex}
            onRowClick={handleRowClick}
            selectionColor={colors.grey95}
          >
            {pendingDelete !== null && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10,
                }}
              >
                <div
                  style={{
                    background: colors.white,
                    borderRadius: 8,
                    padding: "24px 28px",
                    maxWidth: 540,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                    fontFamily: "Inter, Segoe UI, sans-serif",
                  }}
                >
                  <p
                    style={{
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: colors.grey11,
                      margin: "0 0 14px",
                    }}
                  >
                    Delete Analysis Message
                  </p>
                  <p
                    style={{
                      fontSize: 12.4,
                      color: colors.grey11,
                      lineHeight: "20px",
                      margin: "0 0 20px",
                    }}
                  >
                    An analysis is performed to an entity, if for any reason that analysis cannot be
                    applied as feedback or provided as feedback at the time it is performed, then it is
                    possible for that analysis to be provided as feedback later or applied as feedback
                    later. Since it is not possible for us to delete execution of our function, it is
                    not possible for us to delete an analysis we have performed already to an entity.
                    Since this is a computer screen, if I want to I can hide the selected analysis
                    from my list. Do I still want to continue to do that?
                  </p>
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button
                      onClick={() => setPendingDelete(null)}
                      style={{
                        height: 30,
                        padding: "0 16px",
                        background: colors.white,
                        border: `1px solid ${colors.grey78}`,
                        borderRadius: 4,
                        fontSize: 12.4,
                        fontFamily: "inherit",
                        cursor: "pointer",
                        color: colors.grey11,
                      }}
                    >
                      No
                    </button>
                    <button
                      onClick={confirmDelete}
                      style={{
                        height: 30,
                        padding: "0 16px",
                        background: colors.redDestructive,
                        border: "none",
                        borderRadius: 4,
                        fontSize: 12.4,
                        fontWeight: 700,
                        fontFamily: "inherit",
                        cursor: "pointer",
                        color: colors.white,
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
      <div
        style={{
          height: 57,
          minHeight: 57,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          borderTop: `1px solid ${colors.grey88}`,
          background: colors.white,
          boxSizing: "border-box",
        }}
      >
        <span style={{ fontSize: 10.1, color: colors.grey38, fontFamily: "inherit" }}>
          {hasSelection
            ? "1 row selected."
            : "No selection active. Select a row to enable actions."}
        </span>
        <button
          onClick={closeDialog}
          onMouseEnter={() => setCancelHover(true)}
          onMouseLeave={() => setCancelHover(false)}
          style={{
            height: 32,
            minWidth: 74,
            padding: "0 12px",
            background: cancelHover ? "#F3F3F3" : colors.white,
            border: `1px solid ${colors.grey78}`,
            borderRadius: 4,
            fontSize: 12.4,
            fontFamily: "inherit",
            cursor: "pointer",
            color: colors.grey11,
          }}
        >
          Close
        </button>
      </div>

      {/* ── Info message overlay ── */}
      {infoMsg && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.18)",
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
              borderRadius: 8,
              padding: "24px 28px",
              maxWidth: 500,
              width: "90%",
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
              fontFamily: "Inter, Segoe UI, sans-serif",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: 13.6,
                color: colors.grey11,
                marginBottom: 12,
                lineHeight: "18px",
              }}
            >
              {infoMsg.title}
            </div>
            <p
              style={{
                fontSize: 12.4,
                color: colors.grey11,
                lineHeight: "20px",
                margin: "0 0 20px",
              }}
            >
              {infoMsg.text}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setInfoMsg(null)}
                style={{
                  height: 30,
                  padding: "0 20px",
                  background: colors.azure42,
                  border: "none",
                  borderRadius: 4,
                  fontSize: 12.4,
                  fontWeight: 700,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  color: colors.white,
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {viewAnalysis && (
        <ViewAnalysisDialog
          analysis={viewAnalysis}
          onClose={() => setViewAnalysis(null)}
          onApply={() => {
            const id = viewAnalysis.id;
            setViewAnalysis(null);
            if (id !== undefined) sendMessage({ action: "NAVIGATE_TO_APPLY", analysisId: id as number });
          }}
          onProvide={() => {
            const id = viewAnalysis.id;
            setViewAnalysis(null);
            if (id !== undefined) sendMessage({ action: "NAVIGATE_TO_PROVIDE", analysisId: id as number });
          }}
        />
      )}
    </div>
    </>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: 32,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          background: colors.grey92,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="2" width="14" height="16" rx="2" stroke={colors.grey74} strokeWidth="1.3" />
          <path d="M6 7H14M6 10H11" stroke={colors.grey74} strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>
      <span style={{ fontWeight: 700, fontSize: 12.8, color: colors.grey38, lineHeight: "15px" }}>
        No retained analyses found
      </span>
      <span
        style={{
          fontWeight: 400,
          fontSize: 11.1,
          color: colors.grey74,
          lineHeight: "18px",
          textAlign: "center",
          maxWidth: 260,
        }}
      >
        {filtered
          ? "No retained analyses match the selected filter."
          : "No analyses have been retained yet. Use the Analyze ribbon button and choose \"Retain Analysis as Need\" to save one here."}
      </span>
    </div>
  );
}
