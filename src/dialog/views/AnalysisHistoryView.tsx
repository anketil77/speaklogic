// src/dialog/views/AnalysisHistoryView.tsx
// Read-only list of all ProjectAnalysis records. No toolbar.

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useDialogComm } from "@/dialog/hooks/useDialogComm";
import { PanelTable, type PanelTableCol } from "@/dialog/components/PanelTable";
import { InfoMessageCard } from "@/dialog/components/InfoMessageCard";
import { ViewAnalysisDialog } from "@/dialog/components/ViewAnalysisDialog";
import {
  AnalysisHistoryHeaderIcon,

  SmallCaretDownIcon,
  AnalysisDeleteIcon,
  AnalysisEditIcon,
  ProvideFeedbackAnalysisIcon,
  FlagAnalysisCommunicationIcon,
  ViewReportIcon,
  FilterFunnelIcon,
  FilterWordDocIcon,
  FilterOutlookMailIcon,
  FilterPowerPointIcon,
  FilterShowAllIcon,
} from "@/dialog/components/Icons";
import { colors } from "@/styles/tokens";
import type { ProjectAnalysis } from "@/types/db";
import { openAnalysisReport } from "@/dialog/utils/reportGenerator";

const MSG_EDIT = {
  title: "Edit Analysis Message",
  text: "By viewing the selected analysis, I can determine if it is possible to edit it. Simply choose view analysis to determine if the selected analysis can be edited.",
};
const MSG_APPLY = {
  title: "Apply Analysis as Feedback",
  text: "In order to apply an analysis as feedback, that analysis itself must be identified. It may not be possible to apply an analysis as feedback if that analysis cannot be identified. By viewing the selected analysis, I can determine whether or not I can apply it as feedback.",
};
const MSG_PROVIDE = {
  title: "Provide Feedback with Analysis",
  text: "If we can identify an analysis, then we can determine if we can provide feedback with that analysis. By viewing the selected analysis, I can determine if I can use it to provide feedback to someone.",
};
const MSG_FLAG = {
  title: "Flag Analysis as Communication",
  text: "By identifying an analysis, we can determine if we can flag it as communication. By viewing the selected analysis, I can determine if I can flag it as communication.",
};

const SOURCE_DISPLAY: Record<string, string> = {
  "Word Document": "Word Document",
  "Outlook Mail": "Outlook Mail",
  "PowerPoint Document": "Powerpoint Presentation",
};

const FILTER_OPTIONS: { label: string; value: string | null; icon: React.ReactNode }[] = [
  { label: "Word Document", value: "Word Document", icon: <FilterWordDocIcon /> },
  { label: "Outlook Mail", value: "Outlook Mail", icon: <FilterOutlookMailIcon /> },
  { label: "Powerpoint Presentation", value: "PowerPoint Document", icon: <FilterPowerPointIcon /> },
  { label: "Show All", value: null, icon: <FilterShowAllIcon /> },
];

function CmdSepBar() {
  return (
    <div style={{ width: 1, height: 20, background: colors.grey88, flexShrink: 0 }} />
  );
}

export default function AnalysisHistoryView() {
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
  const [cancelHover, setCancelHover] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [infoMsg, setInfoMsg] = useState<{ title: string; text: string } | null>(null);
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
    if (row?.id !== undefined) setPendingDelete(row.id as number);
  }, [selectedIndex, displayRows]);

  const confirmDelete = useCallback(() => {
    if (pendingDelete === null) return;
    sendMessage({ action: "DELETE_ANALYSIS", id: pendingDelete });
    setDeletedIds((prev) => new Set(prev).add(pendingDelete));
    setSelectedIndex(null);
    setPendingDelete(null);
  }, [pendingDelete, sendMessage]);

  const handleViewReport = useCallback(() => {
    if (selectedIndex === null) return;
    openAnalysisReport(displayRows[selectedIndex]);
  }, [selectedIndex, displayRows]);

  const hasSelection = selectedIndex !== null;
  const activeFilterLabel = FILTER_OPTIONS.find((f) => f.value === filterSource)?.label ?? null;

  const COLUMNS = useMemo<PanelTableCol<ProjectAnalysis>[]>(
    () => [
      {
        header: "From Person",
        width: "27%",
        render: (a) => a.fromPerson || "—",
        truncate: true,
      },
      {
        header: "Analysis Date",
        width: "24%",
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
        width: "22%",
        render: (a) => SOURCE_DISPLAY[a.source] ?? a.source ?? "—",
        truncate: true,
      },
    ],
    []
  );

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
        <div
          style={{ marginLeft: 12, marginTop: 20, display: "flex", flexDirection: "column", flex: 1 }}
        >
          <span
            style={{
              fontWeight: 700,
              fontSize: 15.6,
              lineHeight: "21px",
              color: colors.grey11,
              letterSpacing: -0.1,
            }}
          >
            List of Analysis Performed
          </span>
          <span
            style={{
              fontWeight: 400,
              fontSize: 11.1,
              lineHeight: "17px",
              color: colors.grey38,
              marginTop: 3,
            }}
          >
            View, edit, and manage all analyses performed. Apply feedback or flag as communication.
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
          View Selected Analysis
          <SmallCaretDownIcon color="white" />
        </button>

        <CmdSepBar />

        {/* Delete */}
        <button
          title="Delete Selected Analysis"
          disabled={!hasSelection}
          onClick={() => hasSelection && handleDelete()}
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
          <AnalysisDeleteIcon />
        </button>

        {/* Edit */}
        <button
          title="Edit Selected Analysis"
          disabled={!hasSelection}
          onClick={() => hasSelection && setInfoMsg(MSG_EDIT)}
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
          <AnalysisEditIcon />
        </button>

        <CmdSepBar />

        {/* Provide Feedback */}
        <button
          title="Provide Feedback With Analysis"
          disabled={!hasSelection}
          onClick={() => hasSelection && setInfoMsg(MSG_PROVIDE)}
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
          <ProvideFeedbackAnalysisIcon />
        </button>

        {/* Flag */}
        <button
          title="Flag Analysis as Communication"
          disabled={!hasSelection}
          onClick={() => hasSelection && setInfoMsg(MSG_FLAG)}
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
          <FlagAnalysisCommunicationIcon />
        </button>

        <CmdSepBar />

        {/* Filter */}
        <div ref={filterRef} style={{ position: "relative" }}>
          <button
            onClick={() => setFilterOpen((o) => !o)}
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
              role="menu"
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
          onClick={() => hasSelection && handleViewReport()}
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
            columns={COLUMNS}
            rows={displayRows}
            selectedIndex={selectedIndex}
            onRowClick={handleRowClick}
            selectionColor={colors.grey95}
          />
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
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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
            Cancel
          </button>
          <button
            disabled={!hasSelection}
            onClick={() => hasSelection && setInfoMsg(MSG_APPLY)}
            style={{
              height: 32,
              minWidth: 125,
              padding: "0 12px",
              background: hasSelection ? colors.azure42 : "#C5C5C5",
              border: "none",
              borderRadius: 4,
              fontSize: 12.7,
              fontWeight: 700,
              fontFamily: "inherit",
              cursor: hasSelection ? "pointer" : "default",
              color: colors.white,
            }}
          >
            Apply Analysis
          </button>
        </div>
      </div>

      {pendingDelete !== null && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.25)",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: colors.white,
              border: `1px solid ${colors.grey88}`,
              borderRadius: 6,
              padding: "20px 24px",
              maxWidth: 420,
              boxShadow: "0px 4px 16px rgba(0,0,0,0.12)",
              fontFamily: "Inter, Segoe UI, sans-serif",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 13, color: "#1B1B1B", marginBottom: 10 }}>
              Delete Analysis Message
            </div>
            <div style={{ fontSize: 12, color: "#616161", lineHeight: "18px", marginBottom: 18 }}>
              While it is not possible to delete an analysis, however if we want to we can hide it from
              view. While I cannot delete the selected analysis however I can hide it from view. Do I
              still want to hide the selected analysis?
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setPendingDelete(null)}
                style={{
                  height: 28,
                  padding: "0 16px",
                  background: colors.white,
                  border: `1px solid ${colors.grey78}`,
                  borderRadius: 4,
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                No
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  height: 28,
                  padding: "0 16px",
                  background: colors.azure42,
                  border: "none",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  color: colors.white,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {infoMsg && (
        <InfoMessageCard
          title={infoMsg.title}
          text={infoMsg.text}
          onClose={() => setInfoMsg(null)}
        />
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
      <span
        style={{ fontWeight: 700, fontSize: 12.8, color: colors.grey38, lineHeight: "15px" }}
      >
        No analysis records found
      </span>
      <span
        style={{
          fontWeight: 400,
          fontSize: 11.1,
          color: colors.grey74,
          lineHeight: "18px",
          textAlign: "center",
          maxWidth: 230,
        }}
      >
        {filtered
          ? "No analyses match the selected filter."
          : "No analyses have been performed yet. Use Identify Analysis to begin."}
      </span>
    </div>
  );
}
