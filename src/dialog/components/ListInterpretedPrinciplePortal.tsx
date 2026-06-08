import React, { useState, useCallback } from "react";
import { FooterBar, FooterStatusText, DismissBtn } from "@/dialog/components/FooterButtons";
import ReactDOM from "react-dom";
import { PanelTable, type PanelTableCol } from "@/dialog/components/PanelTable";
import { InfoMessageCard } from "@/dialog/components/InfoMessageCard";
import { useDraggable } from "@/dialog/hooks/useDraggable";
import {
  ViewSelectedIcon,
  DeleteSelectedIcon,
  ViewReportIcon,
  PrincipleDropdownTriggerIcon,
} from "@/dialog/components/Icons";
import { colors } from "@/styles/tokens";
import type { PrincipleInterpretation, AttachFileToProject } from "@/types/db";
import { ViewInterpretedPrincipleDialog } from "./ViewInterpretedPrincipleDialog";

const COLUMNS: PanelTableCol<PrincipleInterpretation>[] = [
  {
    header: "Count",
    width: "15%",
    render: (_p, idx) => <span style={{ textAlign: "center", display: "block" }}>{idx + 1}</span>,
  },
  { header: "Principle Name", width: "35%", render: (p) => p.principleName || "—", truncate: true },
  { header: "From Actual Set", width: "50%", render: (p) => p.setDerivedFrom || "—", truncate: true },
];

function CmdSepBar() {
  return <div style={{ width: 1, height: 20, background: colors.grey88, flexShrink: 0 }} />;
}

function EmptyState() {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 32 }}>
      <div style={{ width: 44, height: 44, borderRadius: 22, background: colors.grey92, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <PrincipleDropdownTriggerIcon />
      </div>
      <span style={{ fontWeight: 700, fontSize: 12.8, color: colors.grey38, lineHeight: "15px" }}>No interpreted principles found</span>
      <span style={{ fontWeight: 400, fontSize: 11.1, color: colors.grey74, lineHeight: "18px", textAlign: "center", maxWidth: 230 }}>
        No principles have been interpreted yet.
      </span>
    </div>
  );
}

interface ListInterpretedPrinciplePortalProps {
  interpretations: PrincipleInterpretation[];
  filesByInterpretationId?: Record<number, AttachFileToProject[]>;
  sendMessage: (msg: unknown) => void;
  onClose: () => void;
  /** When opened as its own `?view=` route (no parent view behind it), fills the
   *  whole dialog with no scrim instead of floating as a centered overlay card. */
  standalone?: boolean;
}

export function ListInterpretedPrinciplePortal({
  interpretations: initialInterpretations,
  filesByInterpretationId = {},
  sendMessage,
  onClose,
  standalone = false,
}: ListInterpretedPrinciplePortalProps) {
  const { pos, onHeaderMouseDown } = useDraggable();
  const [interpretations, setInterpretations] = useState<PrincipleInterpretation[]>(initialInterpretations);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [infoMsg, setInfoMsg] = useState<{ title: string; text: string } | null>(null);
  const [viewDetail, setViewDetail] = useState<PrincipleInterpretation | null>(null);

  const handleRowClick = useCallback((idx: number) => {
    setSelectedIndex((prev) => (prev === idx ? null : idx));
  }, []);

  const handleViewDetail = useCallback(() => {
    if (selectedIndex === null) return;
    setViewDetail(interpretations[selectedIndex]);
  }, [selectedIndex, interpretations]);

  const handleDelete = useCallback(() => {
    if (selectedIndex === null) return;
    const row = interpretations[selectedIndex];
    if (row?.id !== undefined) setPendingDelete(row.id as number);
  }, [selectedIndex, interpretations]);

  const confirmDelete = useCallback(() => {
    if (pendingDelete === null) return;
    sendMessage({ action: "DELETE_INTERPRETED_PRINCIPLE", id: pendingDelete });
    setInterpretations((prev) => prev.filter((r) => r.id !== pendingDelete));
    setPendingDelete(null);
    setSelectedIndex(null);
  }, [pendingDelete, sendMessage]);

  const handleViewReport = useCallback(() => {
    if (selectedIndex === null) return;
    const row = interpretations[selectedIndex];
    sendMessage({ action: "REPORT_INTERPRETED_PRINCIPLE", interpretation: row });
  }, [selectedIndex, interpretations, sendMessage]);

  const hasSelection = selectedIndex !== null;

  return ReactDOM.createPortal(
    <>
      {!standalone && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 199 }} onClick={onClose} />
      )}
      <div
        style={
          standalone
            ? {
                position: "fixed",
                inset: 0,
                zIndex: 200,
                background: colors.white,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                fontFamily: "'Inter', 'Segoe UI', sans-serif",
              }
            : {
                position: "fixed",
                left: `calc(50% + ${pos.x}px)`,
                top: `calc(50% + ${pos.y}px)`,
                transform: "translate(-50%, -50%)",
                zIndex: 200,
                background: colors.white,
                borderRadius: 8,
                boxShadow: "0px 8px 32px rgba(0,0,0,0.14), 0px 2px 8px rgba(0,0,0,0.06)",
                width: 860,
                height: 540,
                maxWidth: "96vw",
                maxHeight: "90vh",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                fontFamily: "'Inter', 'Segoe UI', sans-serif",
              }
        }
      >
        {/* Header */}
        <div
          onMouseDown={onHeaderMouseDown}
          style={{ height: 78, display: "flex", alignItems: "center", padding: "0 20px", gap: 12, flexShrink: 0, cursor: "grab", userSelect: "none" }}
        >
          <div style={{ width: 32, height: 32, borderRadius: 6, background: "#EBF3FC", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <PrincipleDropdownTriggerIcon />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15.6, lineHeight: "21px", color: colors.grey11, letterSpacing: -0.1 }}>
              List of Interpreted Principle
            </div>
            <div style={{ fontWeight: 400, fontSize: 11.1, lineHeight: "17px", color: colors.grey38, marginTop: 2 }}>
              View and manage interpreted principles.
            </div>
          </div>
          {!standalone && (
            <button
              onClick={onClose}
              style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", borderRadius: 4, cursor: "pointer", flexShrink: 0, padding: 0 }}
              title="Close"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="#616161" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>
          )}
        </div>

        {/* Command bar */}
        <div style={{ height: 44, minHeight: 44, background: colors.grey96, display: "flex", alignItems: "center", padding: "0 12px", gap: 8, boxSizing: "border-box" }}>
          <button
            disabled={!hasSelection}
            onClick={handleViewDetail}
            style={{
              height: 28, paddingLeft: 10, paddingRight: 12, display: "flex", alignItems: "center", gap: 6,
              background: hasSelection ? colors.azure42 : "#C5C5C5", color: colors.white, border: "none", borderRadius: 4,
              cursor: hasSelection ? "pointer" : "default", fontSize: 11.4, fontWeight: 700, fontFamily: "inherit",
              whiteSpace: "nowrap", flexShrink: 0,
            }}
          >
            <ViewSelectedIcon />
            View Interpreted Principle
          </button>
          <CmdSepBar />
          <button
            title="Delete Interpreted Principle"
            disabled={!hasSelection}
            onClick={handleDelete}
            className="sl-icon-btn"
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", borderRadius: 4, cursor: hasSelection ? "pointer" : "default", opacity: hasSelection ? 1 : 0.35, flexShrink: 0 }}
          >
            <DeleteSelectedIcon />
          </button>
          <CmdSepBar />
          <button
            title="View Principle Report"
            disabled={!hasSelection}
            onClick={handleViewReport}
            className="sl-icon-btn"
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", borderRadius: 4, cursor: hasSelection ? "pointer" : "default", opacity: hasSelection ? 1 : 0.35, flexShrink: 0 }}
          >
            <ViewReportIcon />
          </button>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {interpretations.length === 0 ? (
            <EmptyState />
          ) : (
            <PanelTable<PrincipleInterpretation>
              columns={COLUMNS}
              rows={interpretations}
              selectedIndex={selectedIndex}
              onRowClick={handleRowClick}
              selectionColor={colors.grey95}
            />
          )}
        </div>

        {/* Footer */}
        <FooterBar>
          <FooterStatusText>{hasSelection ? "1 row selected." : "No selection active. Select a row to enable actions."}</FooterStatusText>
          <DismissBtn label="Close" onClick={onClose} />
        </FooterBar>

        {/* Delete confirmation overlay */}
        {pendingDelete !== null && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: colors.white, border: `1px solid ${colors.grey88}`, borderRadius: 6, padding: "20px 24px", maxWidth: 420, boxShadow: "0px 4px 16px rgba(0,0,0,0.12)" }}>
              <div style={{ fontSize: 12.5, color: colors.grey11, lineHeight: "20px", marginBottom: 18 }}>
                Given that a principle cannot be deleted, so does the interpretation of a principle. As well as, the principle of communication which enables the interpretation of a principle cannot be deleted as well. Because the principle of communication attaches to a principle that is being interpreted, the interpretation of that principle cannot be deleted. Here the removal of the interpretation from the list is being viewed as hidden. Do I still want to continue to do that?
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => setPendingDelete(null)} style={{ height: 30, padding: "0 16px", background: colors.white, border: `1px solid ${colors.grey78}`, borderRadius: 4, fontSize: 12.4, fontFamily: "inherit", cursor: "pointer", color: colors.grey11 }}>No</button>
                <button onClick={confirmDelete} style={{ height: 30, padding: "0 16px", background: colors.azure42, border: "none", borderRadius: 4, fontSize: 12.4, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", color: colors.white }}>Yes</button>
              </div>
            </div>
          </div>
        )}

        {/* View Detail dialog */}
{viewDetail && (
  <ViewInterpretedPrincipleDialog
    interpretation={viewDetail}
    initialFiles={filesByInterpretationId[viewDetail.id as number] ?? []}
    sendMessage={sendMessage}
    onClose={() => setViewDetail(null)}
  />
)}

        {infoMsg && (
          <InfoMessageCard title={infoMsg.title} text={infoMsg.text} onClose={() => setInfoMsg(null)} />
        )}
      </div>
    </>,
    document.body,
  );
}
