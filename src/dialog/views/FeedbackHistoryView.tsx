// src/dialog/views/FeedbackHistoryView.tsx
// Read-only list of all ProjectFeedback records. No toolbar.

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useDialogComm } from "@/dialog/hooks/useDialogComm";
import { PanelTable, type PanelTableCol } from "@/dialog/components/PanelTable";
import { InfoMessageCard } from "@/dialog/components/InfoMessageCard";
import { ViewFeedbackDialog } from "@/dialog/components/ViewFeedbackDialog";
import {
  FeedbackHistoryHeaderIcon,
  ViewSelectedIcon,
  SmallCaretDownIcon,
  CmdDeleteFeedbackIcon,
  CmdEditFeedbackIcon,
  ProvideFeedbackAnalysisIcon,
  FlagAnalysisCommunicationIcon,
  FilterFunnelIcon,
  ViewReportIcon,
  ApplySelFbMenuIcon,
  ListFeedbackRequestedHeaderIcon,
  ListFeedbackAppliedCmdIcon,
  ListFeedbackProvidedCmdIcon,
} from "@/dialog/components/Icons";
import { colors } from "@/styles/tokens";
import type { ProjectFeedback } from "@/types/db";
import { openFeedbackReport } from "@/dialog/utils/feedbackReport";

const FEEDBACK_TYPE_FILTERS: { label: string; value: string | null }[] = [
  { label: "Show All", value: null },
  { label: "Applied", value: "Applied" },
  { label: "Provided", value: "Provided" },
  { label: "Requested", value: "Requested" },
];

const MAIN_LIST_INFO = {
  edit: {
    title: "Edit Feedback Message",
    text: "Whether or not it is possible to edit a given feedback, until that feedback is identified, it may not be possible to determine. By viewing the selected feedback, I can determine whether or not I can edit it.",
  },
  apply: {
    title: "Apply Feedback Message",
    text: "A feedback is used to enable the correction of an error. By identifying a feedback, we can determine if we can apply it to enable the correction of an error. Here by viewing the selected feedback, I can determine if I can apply it to correct an error.",
  },
  provide: {
    title: "Provide Feedback Message",
    text: "If it is possible to provide feedback with a feedback, then by identifying that feedback, we can determine that. By viewing the selected feedback, I can determine whether or not it is possible provide feedback with it.",
  },
  flag: {
    title: "Flag Feedback as Communication",
    text: "By identifying a feedback, we can determine if we can flag it as communication. By viewing the selected feedback, I can determine whether I can flag it as communication.",
  },
} as const;

function CmdSepBar() {
  return (
    <div style={{ width: 1, height: 20, background: colors.grey88, flexShrink: 0 }} />
  );
}

export default function FeedbackHistoryView() {
  const { initData, sendMessage, closeDialog } = useDialogComm();

  const [deletedIds, setDeletedIds] = useState<Set<number>>(new Set());
  const feedbacks = useMemo(
    () =>
      ((initData?.feedbacks ?? []) as ProjectFeedback[]).filter(
        (f) => f.id === undefined || !deletedIds.has(f.id as number)
      ),
    [initData, deletedIds]
  );

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [viewFeedback, setViewFeedback] = useState<ProjectFeedback | null>(null);
  const [cancelHover, setCancelHover] = useState(false);
  const [infoMsg, setInfoMsg] = useState<{ title: string; text: string } | null>(null);
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
    () =>
      filterType ? feedbacks.filter((f) => f.feedbackType === filterType) : feedbacks,
    [feedbacks, filterType]
  );

  const handleFilterSelect = useCallback((value: string | null) => {
    setFilterType(value);
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
    sendMessage({ action: "DELETE_FEEDBACK", id: pendingDelete });
    setDeletedIds((prev) => new Set(prev).add(pendingDelete));
    setSelectedIndex(null);
    setPendingDelete(null);
  }, [pendingDelete, sendMessage]);

  const hasSelection = selectedIndex !== null;
  const showInfo = useCallback((title: string, text: string) => {
    setInfoMsg({ title, text });
  }, []);
  const activeFilterLabel =
    FEEDBACK_TYPE_FILTERS.find((f) => f.value === filterType)?.label ?? null;

  const COLUMNS = useMemo<PanelTableCol<ProjectFeedback>[]>(
    () => [
      {
        header: "From Person",
        width: "15%",
        render: (f) => f.fromPerson || "—",
        truncate: true,
      },
      {
        header: "To Person",
        width: "13%",
        render: (f) => f.toPerson || "—",
        truncate: true,
      },
      {
        header: "Feedback Subject",
        width: "19%",
        render: (f) => f.feedbackSubject || "—",
        truncate: true,
      },
      {
        header: "Feedback Date",
        width: "14%",
        render: (f) => f.feedbackDate || "—",
        truncate: true,
      },
      {
        header: "Application Name",
        width: "16%",
        render: (f) => f.applicationName || "—",
        truncate: true,
      },
      {
        header: "Communication Function",
        width: "23%",
        render: (f) => f.communicationFunction || "—",
        truncate: true,
      },
    ],
    []
  );

  return (
    <div
      style={{
        width: "100%",
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
          <FeedbackHistoryHeaderIcon />
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
            List of Feedback
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
            View, manage, and act on all feedback records.
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
        {/* Primary: View Selected Feedback */}
        <button
          disabled={!hasSelection}
          onClick={() => {
            if (selectedIndex !== null) setViewFeedback(displayRows[selectedIndex] ?? null);
          }}
          style={{
            height: 28,
            paddingLeft: 10,
            paddingRight: 12,
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
          View Selected Feedback
        </button>

        <CmdSepBar />

        {/* Delete */}
        <button
          title="Delete Selected Feedback"
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
          <CmdDeleteFeedbackIcon />
        </button>

        {/* Edit Selected Feedback (info-only) */}
        <button
          title="Edit Selected Feedback"
          disabled={!hasSelection}
          onClick={() => showInfo(MAIN_LIST_INFO.edit.title, MAIN_LIST_INFO.edit.text)}
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
          <CmdEditFeedbackIcon />
        </button>

        <CmdSepBar />

        {/* Apply Selected Feedback (info-only) */}
        <button
          title="Apply Selected Feedback"
          disabled={!hasSelection}
          onClick={() => showInfo(MAIN_LIST_INFO.apply.title, MAIN_LIST_INFO.apply.text)}
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
          <ApplySelFbMenuIcon />
        </button>

        {/* Provide Feedback With Feedback (info-only) */}
        <button
          title="Provide Feedback With Feedback"
          disabled={!hasSelection}
          onClick={() => showInfo(MAIN_LIST_INFO.provide.title, MAIN_LIST_INFO.provide.text)}
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

        {/* Flag Feedback as Communication (info-only) */}
        <button
          title="Flag Feedback as Communication"
          disabled={!hasSelection}
          onClick={() => showInfo(MAIN_LIST_INFO.flag.title, MAIN_LIST_INFO.flag.text)}
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

        {/* Filter by feedback type */}
        <div ref={filterRef} style={{ position: "relative" }}>
          <button
            onClick={() => setFilterOpen((o) => !o)}
            aria-expanded={filterOpen}
            aria-haspopup="menu"
            style={{
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              background: filterType ? colors.grey92 : "none",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              padding: "0 8px",
            }}
            title={activeFilterLabel ? `Filter: ${activeFilterLabel}` : "Filter by type"}
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
                border: `1px solid ${colors.grey88}`,
                boxShadow: "0 4px 16px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)",
                borderRadius: 4,
                minWidth: 160,
              }}
            >
              {FEEDBACK_TYPE_FILTERS.map((opt) => (
                <button
                  key={opt.label}
                  role="menuitem"
                  onClick={() => handleFilterSelect(opt.value)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "9px 12px",
                    background: filterType === opt.value ? colors.grey95 : "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 12.3,
                    color: colors.grey11,
                    fontFamily: "inherit",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* List of Feedback Applied / Provided / Requested — C# ribbonPageGroup3 */}
        <CmdSepBar />
        <button
          title="List of Feedback Applied"
          onClick={() => sendMessage({ action: "LIST_FEEDBACK_APPLIED" })}
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
          <ListFeedbackAppliedCmdIcon />
        </button>

        <button
          title="List of Feedback Provided"
          onClick={() => sendMessage({ action: "LIST_FEEDBACK_PROVIDED" })}
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
          <ListFeedbackProvidedCmdIcon />
        </button>

        <button
          title="List of Feedback Requested"
          onClick={() => sendMessage({ action: "LIST_FEEDBACK_REQUESTED" })}
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
          <ListFeedbackRequestedHeaderIcon />
        </button>

        <CmdSepBar />

        {/* View Applied Feedback Report — C# rpReport group, Applied before Provided */}
        <button
          title="View Applied Feedback Report"
          disabled={!hasSelection}
          onClick={() => {
            if (selectedIndex !== null) openFeedbackReport(displayRows[selectedIndex]);
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

        {/* View Provided Feedback Report */}
        <button
          title="View Provided Feedback Report"
          disabled={!hasSelection}
          onClick={() => {
            if (selectedIndex !== null) openFeedbackReport(displayRows[selectedIndex]);
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
          <EmptyState filtered={filterType !== null} />
        ) : (
          <PanelTable<ProjectFeedback>
            columns={COLUMNS}
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
                      fontSize: 12.4,
                      color: colors.grey11,
                      lineHeight: "20px",
                      margin: "0 0 20px",
                    }}
                  >
                    While it is not practical or possible to delete a given feedback, however if I
                    want to, I can hide the selected feedback from view. Do I still want to continue
                    to hide the selected feedback from view?
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
            style={{
              height: 32,
              minWidth: 125,
              padding: "0 12px",
              background: hasSelection ? colors.azure42 : "#C5C5C5",
              border: "none",
              borderRadius: 4,
              fontSize: 12.6,
              fontWeight: 700,
              fontFamily: "inherit",
              cursor: hasSelection ? "pointer" : "default",
              color: colors.white,
            }}
          >
            Apply Feedback
          </button>
        </div>
      </div>

      {/* ── View Feedback portal (fixed, draggable) ── */}
      {viewFeedback && (
        <ViewFeedbackDialog feedback={viewFeedback} onClose={() => setViewFeedback(null)} />
      )}

      {/* ── Info message card ── */}
      {infoMsg && (
        <InfoMessageCard title={infoMsg.title} text={infoMsg.text} onClose={() => setInfoMsg(null)} />
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
          <path
            d="M2 3C2 2.45 2.45 2 3 2H15C15.55 2 16 2.45 16 3V12C16 12.55 15.55 13 15 13H6L3 16V13H3C2.45 13 2 12.55 2 12V3Z"
            stroke={colors.grey74}
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path
            d="M5 6H13M5 9H9"
            stroke={colors.grey74}
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <span style={{ fontWeight: 700, fontSize: 12.7, color: colors.grey38, lineHeight: "15px" }}>
        No feedback records found
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
          ? "No feedback matches the selected filter."
          : "No feedback has been recorded yet."}
      </span>
    </div>
  );
}
