// src/dialog/components/FeedbackListPortal.tsx
// Full-screen inline portal overlay for viewing/managing feedback list.
// Matches FeedbackHistoryView layout but as a self-contained portal.

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { PanelTable, type PanelTableCol } from "@/dialog/components/PanelTable";
import { InfoMessageCard } from "@/dialog/components/InfoMessageCard";
import { useDraggable } from "@/dialog/hooks/useDraggable";
import {
  FeedbackHistoryHeaderIcon,
  ViewSelectedIcon,
  SmallCaretDownIcon,
  DeleteSelectedIcon,
  EditSelectedAnalysisIcon,
  ApplySelFbMenuIcon,
  ProvideFeedbackAnalysisIcon,
  FlagAnalysisCommunicationIcon,
  ViewReportIcon,
  FilterFunnelIcon,
} from "@/dialog/components/Icons";
import { colors } from "@/styles/tokens";
import type { ProjectFeedback } from "@/types/db";
import { openFeedbackReport } from "@/dialog/utils/feedbackReport";

// ─── Constants ──────────────────────────────────────────────────────────────
const FEEDBACK_TYPE_FILTERS: { label: string; value: string | null }[] = [
  { label: "Show All", value: null },
  { label: "Applied", value: "Applied" },
  { label: "Provided", value: "Provided" },
  { label: "Requested", value: "Requested" },
];

const COLUMNS: PanelTableCol<ProjectFeedback>[] = [
  { header: "From Person", width: "15%", render: (f) => f.fromPerson || "—", truncate: true },
  { header: "To Person", width: "13%", render: (f) => f.toPerson || "—", truncate: true },
  { header: "Feedback Subject", width: "19%", render: (f) => f.feedbackSubject || "—", truncate: true },
  { header: "Feedback Date", width: "14%", render: (f) => f.feedbackDate || "—", truncate: true },
  { header: "Application Name", width: "16%", render: (f) => f.applicationName || "—", truncate: true },
  { header: "Communication Function", width: "23%", render: (f) => f.communicationFunction || "—", truncate: true },
];

// ─── Info messages ───────────────────────────────────────────────────────────
const MAIN_LIST_INFO = {
  edit: { title: "Edit Feedback Message", text: "Whether or not it is possible to edit a given feedback, until that feedback is identified, it may not be possible to determine. By viewing the selected feedback, I can determine whether or not I can edit it." },
  apply: { title: "Apply Feedback Message", text: "A feedback is used to enable the correction of an error. By identifying a feedback, we can determine if we can apply it to enable the correction of an error. Here by viewing the selected feedback, I can determine if I can apply it to correct an error." },
  provide: { title: "Provide Feedback Message", text: "If it is possible to provide feedback with a feedback, then by identifying that feedback, we can determine that. By viewing the selected feedback, I can determine whether or not it is possible provide feedback with it." },
  flag: { title: "Flag Feedback as Communication", text: "By identifying a feedback, we can determine if we can flag it as communication. By viewing the selected feedback, I can determine whether I can flag it as communication." },
} as const;

// ─── Sub-components ──────────────────────────────────────────────────────────
function CmdSepBar() {
  return <div style={{ width: 1, height: 20, background: colors.grey88, flexShrink: 0 }} />;
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 32 }}>
      <div style={{ width: 44, height: 44, borderRadius: 22, background: colors.grey92, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M2 3C2 2.45 2.45 2 3 2H15C15.55 2 16 2.45 16 3V12C16 12.55 15.55 13 15 13H6L3 16V13H3C2.45 13 2 12.55 2 12V3Z" stroke={colors.grey74} strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M5 6H13M5 9H9" stroke={colors.grey74} strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>
      <span style={{ fontWeight: 700, fontSize: 12.7, color: colors.grey38, lineHeight: "15px" }}>No feedback records found</span>
      <span style={{ fontWeight: 400, fontSize: 11.1, color: colors.grey74, lineHeight: "18px", textAlign: "center", maxWidth: 230 }}>
        {filtered ? "No feedback matches the selected filter." : "No feedback records have been created yet."}
      </span>
    </div>
  );
}

// ─── Props ──────────────────────────────────────────────────────────────────
interface FeedbackListPortalProps {
  feedbacks: ProjectFeedback[];
  sendMessage: (msg: unknown) => void;
  onClose: () => void;
  onViewFeedback: (f: ProjectFeedback) => void;
}

// ─── Component ──────────────────────────────────────────────────────────────
export function FeedbackListPortal({ feedbacks, sendMessage, onClose, onViewFeedback }: FeedbackListPortalProps) {
  const { pos, onHeaderMouseDown } = useDraggable();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [cancelHover, setCancelHover] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
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
    () => (filterType ? feedbacks.filter((f) => f.feedbackType === filterType) : feedbacks),
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
    if (row?.id !== undefined) setPendingDelete(row.id as number);
  }, [selectedIndex, displayRows]);

  const confirmDelete = useCallback(() => {
    if (pendingDelete === null) return;
    sendMessage({ action: "DELETE_FEEDBACK", id: pendingDelete });
    setPendingDelete(null);
    setSelectedIndex(null);
  }, [pendingDelete, sendMessage]);

  const handleViewReport = useCallback(() => {
    if (selectedIndex === null) return;
    openFeedbackReport(displayRows[selectedIndex]);
  }, [selectedIndex, displayRows]);

  const hasSelection = selectedIndex !== null;
  const activeFilterLabel = FEEDBACK_TYPE_FILTERS.find((f) => f.value === filterType)?.label ?? null;

  return ReactDOM.createPortal(
    <>
      {/* ── Backdrop ── */}
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 199 }} onClick={onClose} />

      {/* ── Floating panel ── */}
      <div
        style={{
          position: "fixed",
          left: `calc(50% + ${pos.x}px)`,
          top: `calc(50% + ${pos.y}px)`,
          transform: "translate(-50%, -50%)",
          zIndex: 200,
          background: colors.white,
          borderRadius: 8,
          boxShadow: "0px 8px 32px rgba(0,0,0,0.14), 0px 2px 8px rgba(0,0,0,0.06)",
          width: 850,
          height: 550,
          maxWidth: "96vw",
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
        }}
      >
        {/* ── Header (drag handle) ── */}
        <div onMouseDown={onHeaderMouseDown} style={{ height: 78, display: "flex", alignItems: "center", padding: "0 20px", gap: 12, flexShrink: 0, cursor: "grab", userSelect: "none" }}>
          <div style={{ width: 32, height: 32, borderRadius: 6, background: "#EBF3FC", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FeedbackHistoryHeaderIcon />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15.6, lineHeight: "21px", color: colors.grey11, letterSpacing: -0.1 }}>
              List of Feedback
            </div>
            <div style={{ fontWeight: 400, fontSize: 11.1, lineHeight: "17px", color: colors.grey38, marginTop: 2 }}>
              View and manage all feedback records.
            </div>
          </div>
          <button className="sl-close-btn" onClick={onClose} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", borderRadius: 4, cursor: "pointer", flexShrink: 0, padding: 0 }} title="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="#616161" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* ── Command bar ── */}
        <div style={{ height: 44, minHeight: 44, background: colors.grey96, display: "flex", alignItems: "center", padding: "0 12px", gap: 8, boxSizing: "border-box" }}>
          <button
            disabled={!hasSelection}
            onClick={() => { if (selectedIndex !== null) { onViewFeedback(displayRows[selectedIndex]); } }}
            style={{ height: 28, paddingLeft: 10, paddingRight: 12, display: "flex", alignItems: "center", gap: 6, background: hasSelection ? colors.azure42 : "#C5C5C5", color: colors.white, border: "none", borderRadius: 4, cursor: hasSelection ? "pointer" : "default", fontSize: 11.4, fontWeight: 700, fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 }}
          >
            <ViewSelectedIcon />
            View Selected Feedback
          </button>

          <CmdSepBar />

          <button
            title="Delete Selected Feedback"
            disabled={!hasSelection}
            onClick={handleDelete}
            className="sl-icon-btn"
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", borderRadius: 4, cursor: hasSelection ? "pointer" : "default", opacity: hasSelection ? 1 : 0.35, flexShrink: 0 }}
          >
            <DeleteSelectedIcon />
          </button>

          {/* Edit */}
          <button
            title="Edit Selected Feedback"
            disabled={!hasSelection}
            onClick={() => { if (hasSelection) setInfoMsg(MAIN_LIST_INFO.edit); }}
            className="sl-icon-btn"
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", borderRadius: 4, cursor: hasSelection ? "pointer" : "default", opacity: hasSelection ? 1 : 0.35, flexShrink: 0 }}
          >
            <EditSelectedAnalysisIcon />
          </button>

          <CmdSepBar />

          {/* Apply */}
          <button
            title="Apply Selected Feedback"
            disabled={!hasSelection}
            onClick={() => { if (hasSelection) setInfoMsg(MAIN_LIST_INFO.apply); }}
            className="sl-icon-btn"
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", borderRadius: 4, cursor: hasSelection ? "pointer" : "default", opacity: hasSelection ? 1 : 0.35, flexShrink: 0 }}
          >
            <ApplySelFbMenuIcon />
          </button>

          {/* Provide Feedback */}
          <button
            title="Provide Feedback With Feedback"
            disabled={!hasSelection}
            onClick={() => { if (hasSelection) setInfoMsg(MAIN_LIST_INFO.provide); }}
            className="sl-icon-btn"
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", borderRadius: 4, cursor: hasSelection ? "pointer" : "default", opacity: hasSelection ? 1 : 0.35, flexShrink: 0 }}
          >
            <ProvideFeedbackAnalysisIcon />
          </button>

          {/* Flag */}
          <button
            title="Flag Feedback as Communication"
            disabled={!hasSelection}
            onClick={() => { if (hasSelection) setInfoMsg(MAIN_LIST_INFO.flag); }}
            className="sl-icon-btn"
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", borderRadius: 4, cursor: hasSelection ? "pointer" : "default", opacity: hasSelection ? 1 : 0.35, flexShrink: 0 }}
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
              style={{ height: 28, display: "flex", alignItems: "center", justifyContent: "center", gap: 3, background: filterType ? colors.grey92 : "none", border: "none", borderRadius: 4, cursor: "pointer", padding: "0 8px" }}
              title={activeFilterLabel ? `Filter: ${activeFilterLabel}` : "Filter by type"}
            >
              <FilterFunnelIcon />
              <SmallCaretDownIcon color={colors.grey38} />
            </button>
            {filterOpen && (
              <div role="menu" style={{ position: "absolute", top: "calc(100% + 2px)", left: 0, zIndex: 200, background: colors.white, border: `1px solid ${colors.grey88}`, boxShadow: "0 4px 16px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)", borderRadius: 4, minWidth: 160 }}>
                {FEEDBACK_TYPE_FILTERS.map((opt) => (
                  <button key={opt.label} role="menuitem" onClick={() => handleFilterSelect(opt.value)}
                    style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 12px", background: filterType === opt.value ? colors.grey95 : "none", border: "none", cursor: "pointer", fontSize: 12.3, color: colors.grey11, fontFamily: "inherit" }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <CmdSepBar />

          <button
            title="View Provided Feedback Report"
            disabled={!hasSelection}
            onClick={handleViewReport}
            className="sl-icon-btn"
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", borderRadius: 4, cursor: hasSelection ? "pointer" : "default", opacity: hasSelection ? 1 : 0.35, flexShrink: 0 }}
          >
            <ViewReportIcon />
          </button>

          <button
            title="View Applied Feedback Report"
            disabled={!hasSelection}
            onClick={handleViewReport}
            className="sl-icon-btn"
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", borderRadius: 4, cursor: hasSelection ? "pointer" : "default", opacity: hasSelection ? 1 : 0.35, flexShrink: 0 }}
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
            />
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ height: 57, minHeight: 57, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", borderTop: `1px solid ${colors.grey88}`, background: colors.white, boxSizing: "border-box" }}>
          <span style={{ fontSize: 10.1, color: colors.grey38, fontFamily: "inherit" }}>
            {hasSelection ? "1 row selected." : "No selection active. Select a row to enable actions."}
          </span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={onClose}
              onMouseEnter={() => setCancelHover(true)}
              onMouseLeave={() => setCancelHover(false)}
              style={{ height: 32, minWidth: 74, padding: "0 12px", background: cancelHover ? "#F3F3F3" : colors.white, border: `1px solid ${colors.grey78}`, borderRadius: 4, fontSize: 12.4, fontFamily: "inherit", cursor: "pointer", color: colors.grey11 }}
            >
              Cancel
            </button>
          </div>
        </div>

        {/* ── Delete confirmation overlay ── */}
        {pendingDelete !== null && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: colors.white, border: `1px solid ${colors.grey88}`, borderRadius: 6, padding: "20px 24px", maxWidth: 420, boxShadow: "0px 4px 16px rgba(0,0,0,0.12)" }}>
              <div style={{ fontSize: 12.5, color: colors.grey11, lineHeight: "20px", marginBottom: 18 }}>
                While it is not practical or possible to delete a given feedback, however if I want to, I can hide the selected feedback from view. Do I still want to continue to hide the selected feedback from view?
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => setPendingDelete(null)} style={{ height: 30, padding: "0 16px", background: colors.white, border: `1px solid ${colors.grey78}`, borderRadius: 4, fontSize: 12.4, fontFamily: "inherit", cursor: "pointer", color: colors.grey11 }}>No</button>
                <button onClick={confirmDelete} style={{ height: 30, padding: "0 16px", background: colors.redDestructive, border: "none", borderRadius: 4, fontSize: 12.4, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", color: colors.white }}>Yes</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Info message ── */}
        {infoMsg && (
          <InfoMessageCard title={infoMsg.title} text={infoMsg.text} onClose={() => setInfoMsg(null)} />
        )}
      </div>
    </>,
    document.body
  );
}
