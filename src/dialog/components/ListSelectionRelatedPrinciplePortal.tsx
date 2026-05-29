// C# ListSelectionRelatedPrinciple — Count, Selection Type, Principle Related To, From Actual Set

import React, { useState, useCallback } from "react";
import ReactDOM from "react-dom";
import { PanelTable, type PanelTableCol } from "@/dialog/components/PanelTable";
import { useDraggable } from "@/dialog/hooks/useDraggable";
import {
  ViewSelectedIcon,
  DeleteSelectedIcon,
  ViewReportIcon,
  PrincipleDropdownTriggerIcon,
} from "@/dialog/components/Icons";
import { colors } from "@/styles/tokens";
import type { SelectionWithPrinciple } from "@/types/db";

const SOURCE_LABEL: Record<string, string> = {
  "Word Document": "Word Document",
  "Outlook Mail": "Outlook Mail",
  "PowerPoint Document": "PowerPoint Presentation",
};

const COLUMNS: PanelTableCol<SelectionWithPrinciple>[] = [
  {
    header: "Count",
    width: "12%",
    render: (_p, idx) => <span style={{ textAlign: "center", display: "block" }}>{idx + 1}</span>,
  },
  { header: "Selection Type", width: "24%", render: (p) => SOURCE_LABEL[p.selectionType] ?? p.selectionType ?? "—", truncate: true },
  { header: "Principle Related To", width: "32%", render: (p) => p.principleName || "—", truncate: true },
  { header: "From Actual Set", width: "32%", render: (p) => p.setDerivedFrom || "—", truncate: true },
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
      <span style={{ fontWeight: 700, fontSize: 12.8, color: colors.grey38, lineHeight: "15px" }}>No related selections found</span>
      <span style={{ fontWeight: 400, fontSize: 11.1, color: colors.grey74, lineHeight: "18px", textAlign: "center", maxWidth: 230 }}>
        No selections have been related to a principle yet.
      </span>
    </div>
  );
}

interface Props {
  relations: SelectionWithPrinciple[];
  sendMessage: (msg: unknown) => void;
  onClose: () => void;
  /** Open the read-only view for a relation (C# ViewRelatedPrinciple). */
  onView?: (relation: SelectionWithPrinciple) => void;
}

export function ListSelectionRelatedPrinciplePortal({ relations, sendMessage, onClose, onView }: Props) {
  const { pos, onHeaderMouseDown } = useDraggable();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [cancelHover, setCancelHover] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);

  const handleRowClick = useCallback((idx: number) => {
    setSelectedIndex((prev) => (prev === idx ? null : idx));
  }, []);

  const handleDelete = useCallback(() => {
    if (selectedIndex === null) return;
    const row = relations[selectedIndex];
    if (row?.id !== undefined) setPendingDelete(row.id as number);
  }, [selectedIndex, relations]);

  const confirmDelete = useCallback(() => {
    if (pendingDelete === null) return;
    sendMessage({ action: "DELETE_RELATED_SELECTION", id: pendingDelete });
    setPendingDelete(null);
    setSelectedIndex(null);
  }, [pendingDelete, sendMessage]);

  const handleView = useCallback(() => {
    if (selectedIndex === null) return;
    const row = relations[selectedIndex];
    if (row && onView) onView(row);
  }, [selectedIndex, relations, onView]);

  const handleViewReport = useCallback(() => {
    if (selectedIndex === null) return;
    const row = relations[selectedIndex];
    if (row) sendMessage({ action: "REPORT_RELATED_SELECTION", relation: row });
  }, [selectedIndex, relations, sendMessage]);

  const hasSelection = selectedIndex !== null;

  return ReactDOM.createPortal(
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 199 }} onClick={onClose} />
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
          width: 860,
          height: 540,
          maxWidth: "96vw",
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
        }}
      >
        <div
          onMouseDown={onHeaderMouseDown}
          style={{ height: 78, display: "flex", alignItems: "center", padding: "0 20px", gap: 12, flexShrink: 0, cursor: "grab", userSelect: "none" }}
        >
          <div style={{ width: 32, height: 32, borderRadius: 6, background: "#EBF3FC", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <PrincipleDropdownTriggerIcon />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15.6, lineHeight: "21px", color: colors.grey11, letterSpacing: -0.1 }}>
              List of Selection Related Principle
            </div>
            <div style={{ fontWeight: 400, fontSize: 11.1, lineHeight: "17px", color: colors.grey38, marginTop: 2 }}>
              View and manage selections related to a principle.
            </div>
          </div>
          <button
            className="sl-close-btn"
            onClick={onClose}
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", borderRadius: 4, cursor: "pointer", flexShrink: 0, padding: 0 }}
            title="Close"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="#616161" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div style={{ height: 44, minHeight: 44, background: colors.grey96, display: "flex", alignItems: "center", padding: "0 12px", gap: 8, boxSizing: "border-box" }}>
          <button
            disabled={!hasSelection}
            onClick={handleView}
            style={{
              height: 28, paddingLeft: 10, paddingRight: 12, display: "flex", alignItems: "center", gap: 6,
              background: hasSelection ? colors.azure42 : "#C5C5C5", color: colors.white, border: "none", borderRadius: 4,
              cursor: hasSelection ? "pointer" : "default", fontSize: 11.4, fontWeight: 700, fontFamily: "inherit",
              whiteSpace: "nowrap", flexShrink: 0,
            }}
          >
            <ViewSelectedIcon />
            View Related Selection
          </button>
          <CmdSepBar />
          <button
            title="Delete Related Selection"
            disabled={!hasSelection}
            onClick={handleDelete}
            className="sl-icon-btn"
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", borderRadius: 4, cursor: hasSelection ? "pointer" : "default", opacity: hasSelection ? 1 : 0.35, flexShrink: 0 }}
          >
            <DeleteSelectedIcon />
          </button>
          <CmdSepBar />
          <button
            title="View Selection Report"
            disabled={!hasSelection}
            onClick={handleViewReport}
            className="sl-icon-btn"
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", borderRadius: 4, cursor: hasSelection ? "pointer" : "default", opacity: hasSelection ? 1 : 0.35, flexShrink: 0 }}
          >
            <ViewReportIcon />
          </button>
        </div>

        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {relations.length === 0 ? (
            <EmptyState />
          ) : (
            <PanelTable<SelectionWithPrinciple>
              columns={COLUMNS}
              rows={relations}
              selectedIndex={selectedIndex}
              onRowClick={handleRowClick}
              selectionColor={colors.grey95}
            />
          )}
        </div>

        <div style={{ height: 57, minHeight: 57, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", borderTop: `1px solid ${colors.grey88}`, background: colors.white, boxSizing: "border-box" }}>
          <span style={{ fontSize: 10.1, color: colors.grey38, fontFamily: "inherit" }}>
            {hasSelection ? "1 row selected." : "No selection active. Select a row to enable actions."}
          </span>
          <button
            onClick={onClose}
            onMouseEnter={() => setCancelHover(true)}
            onMouseLeave={() => setCancelHover(false)}
            style={{ height: 32, minWidth: 74, padding: "0 12px", background: cancelHover ? "#F3F3F3" : colors.white, border: `1px solid ${colors.grey78}`, borderRadius: 4, fontSize: 12.4, fontFamily: "inherit", cursor: "pointer", color: colors.grey11 }}
          >
            Cancel
          </button>
        </div>

        {pendingDelete !== null && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: colors.white, border: `1px solid ${colors.grey88}`, borderRadius: 6, padding: "20px 24px", maxWidth: 420, boxShadow: "0px 4px 16px rgba(0,0,0,0.12)" }}>
              <div style={{ fontSize: 12.5, color: colors.grey11, lineHeight: "20px", marginBottom: 18 }}>
                If an entity exists and that entity is related to a principle, then that relationship is also an entity. It is not possible for us to delete or discard that relationship. Here the deletion of the relationship is being viewed as hiding it from the list. Do I still want to continue to do that?
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => setPendingDelete(null)} style={{ height: 30, padding: "0 16px", background: colors.white, border: `1px solid ${colors.grey78}`, borderRadius: 4, fontSize: 12.4, fontFamily: "inherit", cursor: "pointer", color: colors.grey11 }}>No</button>
                <button onClick={confirmDelete} style={{ height: 30, padding: "0 16px", background: colors.azure42, border: "none", borderRadius: 4, fontSize: 12.4, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", color: colors.white }}>Yes</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>,
    document.body
  );
}
