// src/dialog/views/FlaggedHistoryView.tsx
// Read-only list of all FlagEntityForAnalysis records. No RichTextToolbar.

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { formatDisplayDate } from "@/db/db";
import { FooterBar, FooterStatusText, DismissBtn } from "@/dialog/components/FooterButtons";
import { useDialogComm } from "@/dialog/hooks/useDialogComm";
import { PanelTable, type PanelTableCol } from "@/dialog/components/PanelTable";
import { PanelContextMenu, type PanelMenuEntry } from "@/dialog/components/PanelContextMenu";
import { ViewSelectionDialog } from "@/dialog/components/ViewSelectionDialog";
import { ListIdentifiedPrinciplePortal } from "@/dialog/components/ListIdentifiedPrinciplePortal";
import { ListInterpretedPrinciplePortal } from "@/dialog/components/ListInterpretedPrinciplePortal";
import { RelateSelectionWithPrincipleDialog } from "@/dialog/components/RelateSelectionWithPrincipleDialog";
import { IdentifyPrincipleInSelectionDialog } from "@/dialog/components/IdentifyPrincipleInSelectionDialog";
import { InterpretePrincipleDialog } from "@/dialog/components/InterpretePrincipleDialog";
import { ViewPrincipleDetailDialog } from "@/dialog/components/ViewPrincipleDetailDialog";
import { ListSelectionRelatedPrinciplePortal } from "@/dialog/components/ListSelectionRelatedPrinciplePortal";
import {
  FlaggedHistoryHeaderIcon,

  FlagAnalyzeIcon,
  FlagDeleteIcon,
  FlagApplyIcon,
  FlagProvideIcon,
  FlagListFbIcon,
  FlagListAnalysisIcon,
  FlagViewReportIcon,
  FilterFunnelIcon,
  SmallCaretDownIcon,
  FilterWordDocIcon,
  FilterOutlookMailIcon,
  FilterPowerPointIcon,
  FilterShowAllIcon,
} from "@/dialog/components/Icons";
import { colors } from "@/styles/tokens";
import type { FlagEntityForAnalysis } from "@/types/db";
import { openFlaggedReport } from "@/dialog/utils/reportGenerator";

const SOURCE_LABEL: Record<string, string> = {
  "Word Document": "Word Document",
  "Outlook Mail": "Outlook Mail",
  "PowerPoint Document": "PowerPoint Presentation",
};

const FILTER_OPTIONS: { label: string; value: string | null; icon: React.ReactNode }[] = [
  { label: "Word Document", value: "Word Document", icon: <FilterWordDocIcon /> },
  { label: "PowerPoint Presentation", value: "PowerPoint Document", icon: <FilterPowerPointIcon /> },
  { label: "Outlook Mail", value: "Outlook Mail", icon: <FilterOutlookMailIcon /> },
  { label: "Show All", value: null, icon: <FilterShowAllIcon /> },
];

// Info messages from C# — shown as inline banner when those buttons are clicked.
const MSG_ANALYZE = "To analyze this entity, view it first using View This Selection, then choose Analyze Selection from the view dialog.";
const MSG_APPLY = "To apply this selection as feedback, view it first using View This Selection, then choose Apply as Feedback from the view dialog.";
const MSG_PROVIDE = "To provide feedback with this selection, view it first using View This Selection, then choose Provide Feedback from the view dialog.";

function CmdSepBar() {
  return (
    <div style={{ width: 1, height: 20, background: colors.grey88, flexShrink: 0 }} />
  );
}

const COLUMNS: PanelTableCol<FlagEntityForAnalysis>[] = [
  {
    header: "Person Flagged",
    width: "22%",
    render: (f) => f.personName || "—",
    truncate: true,
  },
  {
    header: "Date Flagged",
    width: "18%",
    render: (f) => formatDisplayDate(f.flagDate) || "—",
    truncate: true,
  },
  {
    header: "Time Flagged",
    width: "18%",
    render: (f) => f.flagTime || "—",
    truncate: true,
  },
  {
    header: "Entity Type",
    width: "22%",
    render: (f) => SOURCE_LABEL[f.source] ?? f.source ?? "—",
    truncate: true,
  },
  {
    header: "Entity Analyzed",
    width: "20%",
    render: (f) => f.wasEntityAnalyzed ?? "No",
    truncate: true,
  },
];

export default function FlaggedHistoryView() {
  const { initData, sendMessage, submitSave, closeDialog } = useDialogComm();

  const allRows = useMemo(
    () => (initData?.flaggedEntities ?? []) as FlagEntityForAnalysis[],
    [initData]
  );

  const principleInterpretations = useMemo(
    () => (initData?.principleInterpretations ?? []) as import("@/types/db").PrincipleInterpretation[],
    [initData]
  );

  const filesByInterpretationId = useMemo(
    () => (initData?.filesByInterpretationId ?? {}) as Record<number, import("@/types/db").AttachFileToProject[]>,
    [initData]
  );

  const principlesInSelection = useMemo(
    () => (initData?.principlesInSelection ?? []) as import("@/types/db").PrincipleInSelection[],
    [initData]
  );

  const filesByPrincipleInSelectionId = useMemo(
    () => (initData?.filesByPrincipleInSelectionId ?? {}) as Record<number, import("@/types/db").AttachFileToProject[]>,
    [initData]
  );

  const selectionsWithPrinciple = useMemo(
    () => (initData?.selectionsWithPrinciple ?? []) as import("@/types/db").SelectionWithPrinciple[],
    [initData]
  );

  const filesBySelectionWithPrincipleId = useMemo(
    () => (initData?.filesBySelectionWithPrincipleId ?? {}) as Record<number, import("@/types/db").AttachFileToProject[]>,
    [initData]
  );

  const [rows, setRows] = useState<FlagEntityForAnalysis[]>([]);
  useEffect(() => { setRows(allRows); }, [allRows]);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [filterSource, setFilterSource] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null); // index in displayRows
  const [viewSelection, setViewSelection] = useState<FlagEntityForAnalysis | null>(null);
  const [showIdentifiedList, setShowIdentifiedList] = useState(false);
  const [showInterpretedList, setShowInterpretedList] = useState(false);
  const [relateFlag, setRelateFlag] = useState<FlagEntityForAnalysis | null>(null);
  const [identifyFlag, setIdentifyFlag] = useState<FlagEntityForAnalysis | null>(null);
  const [interpretPrinciple, setInterpretPrinciple] = useState<import("@/types/db").PrincipleInSelection | null>(null);
  const [viewIdentified, setViewIdentified] = useState<import("@/types/db").PrincipleInSelection | null>(null);
  const [showRelatedList, setShowRelatedList] = useState(false);
  const [viewRelated, setViewRelated] = useState<import("@/types/db").SelectionWithPrinciple | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; rowIdx: number | null } | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const infoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    () => (filterSource ? rows.filter((r) => r.source === filterSource) : rows),
    [rows, filterSource]
  );

  const handleFilterSelect = useCallback((value: string | null) => {
    setFilterSource(value);
    setSelectedIndex(null);
    setFilterOpen(false);
  }, []);

  const handleRowClick = useCallback((idx: number) => {
    setSelectedIndex((prev) => (prev === idx ? null : idx));
    setPendingDelete(null);
  }, []);

  const handleRowContextMenu = useCallback((e: React.MouseEvent, rowIdx: number | null) => {
    if (rowIdx !== null) {
      setSelectedIndex(rowIdx);
      setPendingDelete(null);
    }
    setContextMenu({ x: e.clientX, y: e.clientY, rowIdx });
  }, []);

  const showInfo = useCallback((msg: string) => {
    if (infoTimerRef.current) clearTimeout(infoTimerRef.current);
    setInfoMessage(msg);
    infoTimerRef.current = setTimeout(() => setInfoMessage(null), 5000);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (pendingDelete === null) return;
    const target = displayRows[pendingDelete];
    if (!target?.id) return;
    sendMessage({ action: "DELETE_FLAG", id: target.id });
    setRows((prev) => prev.filter((r) => r.id !== target.id));
    setPendingDelete(null);
    setSelectedIndex(null);
  }, [pendingDelete, displayRows, sendMessage]);

  const hasSelection = selectedIndex !== null;
  const activeFilterLabel = FILTER_OPTIONS.find((f) => f.value === filterSource)?.label ?? null;

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
          <FlaggedHistoryHeaderIcon />
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
            List of Flagged Selection
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
            View and manage all flagged selections.
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
          gap: 6,
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        {/* Primary: View This Selection */}
        <button
          disabled={!hasSelection}
          onClick={() => {
            if (selectedIndex !== null) setViewSelection(displayRows[selectedIndex]);
          }}
          title={hasSelection ? "View This Selection" : "Select a row first"}
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
          View This Selection
        </button>

        <CmdSepBar />

        {/* Analyze Selection */}
        <button
          title="Analyze Selection"
          disabled={!hasSelection}
          onClick={() => showInfo(MSG_ANALYZE)}
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
          <FlagAnalyzeIcon />
        </button>

        {/* Delete Selection */}
        <button
          title="Delete Selection"
          disabled={!hasSelection}
          onClick={() => { if (hasSelection) setPendingDelete(selectedIndex); }}
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
          <FlagDeleteIcon />
        </button>

        {/* Apply Selection as Feedback */}
        <button
          title="Apply Selection as Feedback"
          disabled={!hasSelection}
          onClick={() => showInfo(MSG_APPLY)}
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
          <FlagApplyIcon />
        </button>

        <CmdSepBar />

        {/* Provide Feedback with Selection */}
        <button
          title="Provide Feedback with Selection"
          disabled={!hasSelection}
          onClick={() => showInfo(MSG_PROVIDE)}
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
          <FlagProvideIcon />
        </button>

        {/* List of Feedback — always disabled (Office.js one-dialog constraint) */}
        <button
          title="List of Feedback (open from ribbon)"
          disabled
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
            cursor: "default",
            opacity: 0.35,
            flexShrink: 0,
          }}
        >
          <FlagListFbIcon />
        </button>

        {/* List of Analysis — always disabled (Office.js one-dialog constraint) */}
        <button
          title="List of Analysis (open from ribbon)"
          disabled
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
            cursor: "default",
            opacity: 0.35,
            flexShrink: 0,
          }}
        >
          <FlagListAnalysisIcon />
        </button>

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
            title={activeFilterLabel ? `Filter: ${activeFilterLabel}` : "Filter by entity type"}
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
          title="View Report"
          disabled={!hasSelection}
          className="sl-icon-btn"
          onClick={() => {
            if (selectedIndex === null) return;
            openFlaggedReport(displayRows[selectedIndex]);
          }}
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
          <FlagViewReportIcon />
        </button>
      </div>

      {/* ── Info message banner ── */}
      {infoMessage && (
        <div
          style={{
            background: "#EBF3FC",
            borderBottom: `1px solid #C5DEFA`,
            padding: "8px 16px",
            fontSize: 11.4,
            color: colors.grey11,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <span>{infoMessage}</span>
          <button
            onClick={() => setInfoMessage(null)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              color: colors.grey38,
              padding: "0 4px",
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── Table body ── */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}>
        {displayRows.length === 0 ? (
          <EmptyState filtered={filterSource !== null} />
        ) : (
          <PanelTable<FlagEntityForAnalysis>
            columns={COLUMNS}
            rows={displayRows}
            selectedIndex={selectedIndex}
            onRowClick={handleRowClick}
            onRowContextMenu={handleRowContextMenu}
            selectionColor={colors.grey95}
          >
            {/* Right-click context menu */}
            {contextMenu && (() => {
              const items: PanelMenuEntry[] = [
                {
                  label: "View This Selection",
                  disabled: contextMenu.rowIdx == null,
                  onClick: () => {
                    if (contextMenu.rowIdx != null) setViewSelection(displayRows[contextMenu.rowIdx]);
                    setContextMenu(null);
                  },
                },
                { isSep: true },
                {
                  label: "Remove This Selection",
                  disabled: contextMenu.rowIdx == null,
                  onClick: () => {
                    if (contextMenu.rowIdx != null) setPendingDelete(contextMenu.rowIdx);
                    setContextMenu(null);
                  },
                },
              ];
              return (
                <PanelContextMenu
                  x={contextMenu.x}
                  y={contextMenu.y}
                  items={items}
                  onClose={() => setContextMenu(null)}
                />
              );
            })()}
            {/* Delete confirmation overlay */}
            {pendingDelete !== null && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(255,255,255,0.92)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
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
                  <p
                    style={{
                      margin: "0 0 16px",
                      fontSize: 12.4,
                      color: colors.grey11,
                      lineHeight: "18px",
                    }}
                  >
                    Since the existence of an entity enables the existence of information about that
                    entity, it is possible to hide the selected selection from your list. Do you want
                    to continue?
                  </p>
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
                        fontFamily: "inherit",
                        cursor: "pointer",
                        color: colors.grey11,
                      }}
                    >
                      No
                    </button>
                    <button
                      onClick={handleDeleteConfirm}
                      style={{
                        height: 28,
                        padding: "0 16px",
                        background: "#D13438",
                        border: "none",
                        borderRadius: 4,
                        fontSize: 12,
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

      {/* ── ViewSelectionDialog portal ── */}
      {viewSelection && (
        <ViewSelectionDialog
          flag={viewSelection}
          onClose={() => setViewSelection(null)}
          onAnalyze={() => { sendMessage({ action: "ANALYZE_FROM_HISTORY", flag: viewSelection }); setViewSelection(null); }}
          onProvideFeedback={() => { sendMessage({ action: "PROVIDE_FROM_HISTORY", flag: viewSelection }); setViewSelection(null); }}
          onApplyFeedback={() => { sendMessage({ action: "APPLY_FROM_HISTORY", flag: viewSelection }); setViewSelection(null); }}
          onRequestFeedback={() => { sendMessage({ action: "PROVIDE_FROM_HISTORY", flag: viewSelection }); setViewSelection(null); }}
          onIdentifyPrinciple={() => { setIdentifyFlag(viewSelection); setViewSelection(null); }}
          onRelateWithPrinciple={() => { setRelateFlag(viewSelection); setViewSelection(null); }}
          onListIdentified={() => { setViewSelection(null); setShowIdentifiedList(true); }}
          onListInterpreted={() => { setViewSelection(null); setShowInterpretedList(true); }}
          onListRelated={() => { setViewSelection(null); setShowRelatedList(true); }}
        />
      )}

      {showIdentifiedList && (
        <ListIdentifiedPrinciplePortal
          principles={principlesInSelection}
          sendMessage={sendMessage}
          onClose={() => setShowIdentifiedList(false)}
          onInterpret={(p) => setInterpretPrinciple(p)}
          onView={(p) => setViewIdentified(p)}
        />
      )}

      {viewIdentified && (
        <ViewPrincipleDetailDialog
          title="View Identified Principle"
          subtitle="View details of the identified principle."
          aboutSelection={viewIdentified.actualSelection}
          actualPrinciple={viewIdentified.actualPrinciple}
          principleName={viewIdentified.principleName}
          setDerivedFrom={viewIdentified.setDerivedFrom}
          principleDescription={viewIdentified.principleDescription}
          communicationPrinciple={viewIdentified.communicationPrinciple}
          commPrincipleDescription={viewIdentified.commPrincipleDescription}
          files={viewIdentified.id !== undefined ? filesByPrincipleInSelectionId[viewIdentified.id] : []}
          onClose={() => setViewIdentified(null)}
        />
      )}

      {showRelatedList && (
        <ListSelectionRelatedPrinciplePortal
          relations={selectionsWithPrinciple}
          sendMessage={sendMessage}
          onClose={() => setShowRelatedList(false)}
          onView={(r) => setViewRelated(r)}
        />
      )}

      {viewRelated && (
        <ViewPrincipleDetailDialog
          title="View Related Principle"
          subtitle="View details of the selection related to a principle."
          aboutSelection={viewRelated.actualSelection}
          actualPrinciple={viewRelated.actualPrinciple}
          principleName={viewRelated.principleName}
          setDerivedFrom={viewRelated.setDerivedFrom}
          principleDescription={viewRelated.principleDescription}
          communicationPrinciple={viewRelated.communicationPrinciple}
          commPrincipleDescription={viewRelated.commPrincipleDescription}
          actualRelationship={viewRelated.actualRelationship}
          relationshipDescription={viewRelated.relationshipDescription}
          files={viewRelated.id !== undefined ? filesBySelectionWithPrincipleId[viewRelated.id] : []}
          onClose={() => setViewRelated(null)}
        />
      )}

      {interpretPrinciple && (
        <InterpretePrincipleDialog
          principle={interpretPrinciple}
          defaultPerson={initData?.communicationPersonName || initData?.personName}
          sendMessage={submitSave}
          onClose={() => setInterpretPrinciple(null)}
          onListIdentified={() => { setInterpretPrinciple(null); setShowIdentifiedList(true); }}
          onListInterpreted={() => { setInterpretPrinciple(null); setShowInterpretedList(true); }}
        />
      )}

      {showInterpretedList && (
        <ListInterpretedPrinciplePortal
          interpretations={principleInterpretations}
          filesByInterpretationId={filesByInterpretationId}
          sendMessage={sendMessage}
          onClose={() => setShowInterpretedList(false)}
        />
      )}

      {relateFlag && (
        <RelateSelectionWithPrincipleDialog
          flag={relateFlag}
          sendMessage={submitSave}
          onClose={() => setRelateFlag(null)}
          onListIdentified={() => { setRelateFlag(null); setShowIdentifiedList(true); }}
          onListInterpreted={() => { setRelateFlag(null); setShowInterpretedList(true); }}
        />
      )}

      {identifyFlag && (
        <IdentifyPrincipleInSelectionDialog
          flag={identifyFlag}
          sendMessage={submitSave}
          onClose={() => setIdentifyFlag(null)}
          onListIdentified={() => { setIdentifyFlag(null); setShowIdentifiedList(true); }}
          onListInterpreted={() => { setIdentifyFlag(null); setShowInterpretedList(true); }}
        />
      )}

      {/* ── Footer ── */}
      <FooterBar>
        <FooterStatusText>
          {hasSelection
            ? "1 row selected."
            : "No selection active. Select a row to enable actions."}
        </FooterStatusText>
        <DismissBtn label="Close" onClick={closeDialog} />
      </FooterBar>
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
          <path d="M4 3V17" stroke={colors.grey74} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M4 3H14L11.5 8L14 13H4" stroke={colors.grey74} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <span style={{ fontWeight: 700, fontSize: 12.8, color: colors.grey38 }}>
        No flagged selections found
      </span>
      <span
        style={{
          fontWeight: 400,
          fontSize: 11.1,
          color: colors.grey74,
          lineHeight: "18px",
          textAlign: "center",
          maxWidth: 240,
        }}
      >
        {filtered
          ? "No selections match the selected filter."
          : "No selections have been flagged yet. Use Flag Selection or Flag Paragraph to begin."}
      </span>
    </div>
  );
}
