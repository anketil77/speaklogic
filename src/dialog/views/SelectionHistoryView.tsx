// src/dialog/views/SelectionHistoryView.tsx
// Read-only list of FlaggedEntityHistory records (selection audit trail). No toolbar.

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { formatDisplayDate } from "@/db/db";
import { useDialogComm } from "@/dialog/hooks/useDialogComm";
import { PanelTable, type PanelTableCol } from "@/dialog/components/PanelTable";
import { ViewSelectionDialog } from "@/dialog/components/ViewSelectionDialog";
import { ListIdentifiedPrinciplePortal } from "@/dialog/components/ListIdentifiedPrinciplePortal";
import { ListInterpretedPrinciplePortal } from "@/dialog/components/ListInterpretedPrinciplePortal";
import { ListSelectionRelatedPrinciplePortal } from "@/dialog/components/ListSelectionRelatedPrinciplePortal";
import { RelateSelectionWithPrincipleDialog } from "@/dialog/components/RelateSelectionWithPrincipleDialog";
import { IdentifyPrincipleInSelectionDialog } from "@/dialog/components/IdentifyPrincipleInSelectionDialog";
import { InterpretePrincipleDialog } from "@/dialog/components/InterpretePrincipleDialog";
import { ViewPrincipleDetailDialog } from "@/dialog/components/ViewPrincipleDetailDialog";
import {
  SelectionHistoryHeaderIcon,
  SmallCaretDownIcon,
  DeleteSelectedIcon,
  ViewSelectionCmdIcon,
  FlagAnalyzeIcon,
  FlagApplyIcon,
  FlagProvideIcon,
  FlagViewReportIcon,
  FilterFunnelIcon,
  FilterWordDocIcon,
  FilterOutlookMailIcon,
  FilterPowerPointIcon,
  FilterShowAllIcon,
} from "@/dialog/components/Icons";
import { colors } from "@/styles/tokens";
import type { FlaggedEntityHistory, FlagEntityForAnalysis } from "@/types/db";
import { FooterBar, FooterStatusText, DismissBtn } from "@/dialog/components/FooterButtons";
import { openSelectionHistoryReport } from "@/dialog/utils/reportGenerator";

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

const MSG_ANALYZE =
  "In order to analyze an entity, that entity must be identified. It is not possible " +
  "or practical to analyze an entity if that entity is not being identified. In order " +
  "to analyze the underlined selection, that selection would need to be identified. " +
  "To analyze the current selection, I would need to view it first, then select analyze " +
  "selection from the view selection dialog.";

const MSG_APPLY =
  "An entity is being applied as feedback to enable the correction of an error, the " +
  "actual entity is identified by the person who is applying that entity as feedback. " +
  "It is not possible to apply an entity as feedback, if that entity is not identified. " +
  "In order to apply the current selection as feedback, the current selection must be visible. " +
  "To enable me to apply the current selection as feedback, I will need to select it then view " +
  "it then I can choose the apply feedback command.";

const MSG_PROVIDE =
  "A feedback is provided to enable the correction of an error, an entity is provided " +
  "as feedback to enable the correction of an error. It is not possible to provide feedback " +
  "with an entity, if that entity does not exists. For instance, an entity is provided as " +
  "the existence of that entity is valid. In order to provide the selection as feedback, I " +
  "will need to view the actual selection, then choose provide selection as feedback from the " +
  "view selection dialog.";

// Legacy audit rows stored the raw Word-Online selection HTML (e.g.
// `<div class="OutlineGroup" …>`) in entityName before the write-side plainText
// guard existed. Strip tags at display time so those old records read cleanly too.
function stripHtmlText(v: string | undefined | null): string {
  if (!v) return "";
  return v
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

const COLUMNS: PanelTableCol<FlaggedEntityHistory>[] = [
  { header: "Entity Name",      width: "25%", render: (r) => stripHtmlText(r.entityName) || "—",         truncate: true },
  { header: "Selection Type",   width: "20%", render: (r) => SOURCE_LABEL[r.source] ?? r.source ?? "—", truncate: true },
  { header: "Date Flagged",     width: "18%", render: (r) => formatDisplayDate(r.flaggedDate) || "—",                      truncate: true },
  { header: "Time Flagged",     width: "17%", render: (r) => r.flaggedTime || "—",                      truncate: true },
  { header: "Selection Action", width: "20%", render: (r) => r.selectionAction || "—",                  truncate: true },
];

function CmdSepBar() {
  return (
    <div style={{ width: 1, height: 20, background: colors.grey88, flexShrink: 0 }} />
  );
}

function historyToFlagEntity(h: FlaggedEntityHistory): FlagEntityForAnalysis {
  return {
    id: h.id,
    actualSelection: h.actualSelection,
    selectionType: h.selectionType as "Selection" | "Paragraph",
    source: h.source,
    applicationName: h.applicationName,
    communicationFunction: h.communicationFunction,
    communicationSignal: h.communicationSignal,
    projectName: h.projectName,
    flagDate: h.flaggedDate,
    flagTime: h.flaggedTime,
    personName: h.personName,
    personEmail: h.personEmail,
    wasEntityAnalyzed: "No",
  };
}

export default function SelectionHistoryView() {
  const { initData, sendMessage, submitSave, closeDialog } = useDialogComm();

  const allRows = useMemo(
    () => (initData?.selectionHistories ?? []) as FlaggedEntityHistory[],
    [initData]
  );

  // ── Principle subsystem data (same pre-load pattern as FlaggedHistoryView) ──
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

  const [deletedIds, setDeletedIds] = useState<Set<number>>(new Set());
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [filterSource, setFilterSource] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [viewSelection, setViewSelection] = useState<FlagEntityForAnalysis | null>(null);
  const [infoMsg, setInfoMsg] = useState<{ title: string; text: string } | null>(null);
  // Principle subsystem state (mirrors FlaggedHistoryView)
  const [showIdentifiedList, setShowIdentifiedList] = useState(false);
  const [showInterpretedList, setShowInterpretedList] = useState(false);
  const [showRelatedList, setShowRelatedList] = useState(false);
  const [relateFlag, setRelateFlag] = useState<FlagEntityForAnalysis | null>(null);
  const [identifyFlag, setIdentifyFlag] = useState<FlagEntityForAnalysis | null>(null);
  const [interpretPrinciple, setInterpretPrinciple] = useState<import("@/types/db").PrincipleInSelection | null>(null);
  const [viewIdentified, setViewIdentified] = useState<import("@/types/db").PrincipleInSelection | null>(null);
  const [viewRelated, setViewRelated] = useState<import("@/types/db").SelectionWithPrinciple | null>(null);
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

  // Close filter on outside click
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

  const handleDeleteConfirm = useCallback(() => {
    if (pendingDelete === null) return;
    const row = displayRows[pendingDelete];
    if (!row?.id) { setPendingDelete(null); return; }
    sendMessage({ action: "DELETE_SELECTION_HISTORY", id: row.id as number });
    setDeletedIds((prev) => new Set(prev).add(row.id as number));
    setPendingDelete(null);
    setSelectedIndex(null);
  }, [pendingDelete, displayRows, sendMessage]);

  const showInfo = useCallback((title: string, text: string) => {
    setInfoMsg({ title, text });
  }, []);

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
          <SelectionHistoryHeaderIcon />
        </div>
        <div style={{ marginLeft: 12, marginTop: 20, display: "flex", flexDirection: "column", flex: 1 }}>
          <span style={{ fontWeight: 700, fontSize: 15.6, lineHeight: "21px", color: colors.grey11, letterSpacing: -0.1 }}>
            List of Selection
          </span>
          <span style={{ fontWeight: 400, fontSize: 11.1, lineHeight: "17px", color: colors.grey38, marginTop: 3 }}>
            View and manage the selection history audit trail.
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
        {/* View This Selection */}
        <button
          title="View This Selection"
          disabled={!hasSelection}
          onClick={() => {
            if (selectedIndex === null) return;
            setViewSelection(historyToFlagEntity(displayRows[selectedIndex]));
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
          <ViewSelectionCmdIcon />
        </button>

        {/* Analyze Selection */}
        <button
          title="Analyze Selection"
          disabled={!hasSelection}
          onClick={() => hasSelection && showInfo("Analyze Selection Message", MSG_ANALYZE)}
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
          <FlagAnalyzeIcon />
        </button>

        <CmdSepBar />

        {/* Apply Selection as Feedback */}
        <button
          title="Apply Selection as Feedback"
          disabled={!hasSelection}
          onClick={() => hasSelection && showInfo("Apply Feedback Message", MSG_APPLY)}
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
          <FlagApplyIcon />
        </button>

        {/* Provide Feedback with Selection */}
        <button
          title="Provide Feedback with Selection"
          disabled={!hasSelection}
          onClick={() => hasSelection && showInfo("Provide Feedback Message", MSG_PROVIDE)}
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
          <FlagProvideIcon />
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
          <DeleteSelectedIcon color="#D13438" />
        </button>

        <CmdSepBar />

        {/* Filter dropdown trigger */}
        <div ref={filterRef} style={{ position: "relative" }}>
          <button
            title="Filter by selection type"
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
            openSelectionHistoryReport(displayRows[selectedIndex]);
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

      {/* ── Info message card ── */}
      {infoMsg && (
        <div
          style={{
            background: "#EBF3FC",
            borderBottom: `1px solid #C5DEFA`,
            padding: "8px 16px",
            fontSize: 11.4,
            color: colors.grey11,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <div>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>{infoMsg.title}</div>
            <div style={{ lineHeight: "16px" }}>{infoMsg.text}</div>
          </div>
          <button
            onClick={() => setInfoMsg(null)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 14, color: colors.grey38, padding: "0 4px",
              lineHeight: 1, flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── Table body ── */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}>
        {displayRows.length === 0 ? (
          <div
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12.4, color: colors.grey38,
            }}
          >
            {filterSource !== null ? "No selections match the current filter." : "No selection history records yet."}
          </div>
        ) : (
          <PanelTable<FlaggedEntityHistory>
            columns={COLUMNS}
            rows={displayRows}
            selectedIndex={selectedIndex}
            onRowClick={handleRowClick}
            selectionColor={colors.grey95}
          >
            {/* Delete confirmation overlay */}
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
                    Since the existence of an entity enables the existence of information about that
                    entity, it is possible to hide the selected selection from your list. Do you want
                    to continue?
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
    </div>
  );
}
