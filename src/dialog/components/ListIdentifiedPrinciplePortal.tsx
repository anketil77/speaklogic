// C# ListIdentifiedPrinciple (742×544) — Count, Principle Name, Actual Principle, From Actual Set

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
import type { PrincipleInSelection } from "@/types/db";

const COLUMNS: PanelTableCol<PrincipleInSelection>[] = [
  {
    header: "Count",
    width: "15%",
    render: (_p, idx) => <span style={{ textAlign: "center", display: "block" }}>{idx + 1}</span>,
  },
  { header: "Principle Name", width: "28%", render: (p) => p.principleName || "—", truncate: true },
  { header: "Actual Principle", width: "28%", render: (p) => p.actualPrinciple || "—", truncate: true },
  { header: "From Actual Set", width: "29%", render: (p) => p.setDerivedFrom || "—", truncate: true },
];

const MSG_INTERPRET = {
  title: "Interpret Principle",
  text: "To interpret a principle, simply view the identified principle and then determine if the principle can be interpreted. By viewing the selected principle, I can determine if I can interpret it.",
};

function CmdSepBar() {
  return <div style={{ width: 1, height: 20, background: colors.grey88, flexShrink: 0 }} />;
}

function EmptyState() {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 32 }}>
      <div style={{ width: 44, height: 44, borderRadius: 22, background: colors.grey92, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <PrincipleDropdownTriggerIcon />
      </div>
      <span style={{ fontWeight: 700, fontSize: 12.8, color: colors.grey38, lineHeight: "15px" }}>No identified principles found</span>
      <span style={{ fontWeight: 400, fontSize: 11.1, color: colors.grey74, lineHeight: "18px", textAlign: "center", maxWidth: 230 }}>
        No principles have been identified yet.
      </span>
    </div>
  );
}

interface ListIdentifiedPrinciplePortalProps {
  principles: PrincipleInSelection[];
  sendMessage: (msg: unknown) => void;
  onClose: () => void;
  /** Open the read-only view for a principle (C# ViewIdentifyPrinciple). */
  onView?: (principle: PrincipleInSelection) => void;
  /** Open the Interpret dialog for a principle (C# InterpretePrinciple). */
  onInterpret?: (principle: PrincipleInSelection) => void;
}

export function ListIdentifiedPrinciplePortal({
  principles,
  sendMessage,
  onClose,
  onView,
  onInterpret,
}: ListIdentifiedPrinciplePortalProps) {
  const { pos, onHeaderMouseDown } = useDraggable();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [infoMsg, setInfoMsg] = useState<{ title: string; text: string } | null>(null);

  const handleRowClick = useCallback((idx: number) => {
    setSelectedIndex((prev) => (prev === idx ? null : idx));
  }, []);

  const handleDelete = useCallback(() => {
    if (selectedIndex === null) return;
    const row = principles[selectedIndex];
    if (row?.id !== undefined) setPendingDelete(row.id as number);
  }, [selectedIndex, principles]);

  const confirmDelete = useCallback(() => {
    if (pendingDelete === null) return;
    sendMessage({ action: "DELETE_PRINCIPLE", id: pendingDelete });
    setPendingDelete(null);
    setSelectedIndex(null);
  }, [pendingDelete, sendMessage]);

  const handleViewReport = useCallback(() => {
    if (selectedIndex === null) return;
    const row = principles[selectedIndex];
    if (row) sendMessage({ action: "REPORT_IDENTIFIED_PRINCIPLE", principle: row });
  }, [selectedIndex, principles, sendMessage]);

  const handleView = useCallback(() => {
    if (selectedIndex === null) return;
    const row = principles[selectedIndex];
    if (!row) return;
    if (onView) onView(row);
    else setInfoMsg({ title: "View Principle", text: "Principle detail view is not yet implemented." });
  }, [selectedIndex, principles, onView]);

  const handleInterpret = useCallback(() => {
    if (selectedIndex === null) return;
    const row = principles[selectedIndex];
    if (!row) return;
    if (onInterpret) onInterpret(row);
    else setInfoMsg(MSG_INTERPRET);
  }, [selectedIndex, principles, onInterpret]);

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
              List of Identified Principle
            </div>
            <div style={{ fontWeight: 400, fontSize: 11.1, lineHeight: "17px", color: colors.grey38, marginTop: 2 }}>
              View and manage identified principles.
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
            View Principle
          </button>
          <CmdSepBar />
          <button
            title="Delete Principle"
            disabled={!hasSelection}
            onClick={handleDelete}
            className="sl-icon-btn"
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", borderRadius: 4, cursor: hasSelection ? "pointer" : "default", opacity: hasSelection ? 1 : 0.35, flexShrink: 0 }}
          >
            <DeleteSelectedIcon />
          </button>
          <button
            title="Interpret Principle"
            disabled={!hasSelection}
            onClick={handleInterpret}
            className="sl-icon-btn"
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", borderRadius: 4, cursor: hasSelection ? "pointer" : "default", opacity: hasSelection ? 1 : 0.35, flexShrink: 0 }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1C4.14 1 1 4.14 1 8C1 11.86 4.14 15 8 15C11.86 15 15 11.86 15 8C15 4.14 11.86 1 8 1ZM8 14C4.69 14 2 11.31 2 8C2 4.69 4.69 2 8 2C11.31 2 14 4.69 14 8C14 11.31 11.31 14 8 14Z" fill="#616161"/>
              <path d="M8 4.5C7.72 4.5 7.5 4.72 7.5 5V8C7.5 8.28 7.72 8.5 8 8.5C8.28 8.5 8.5 8.28 8.5 8V5C8.5 4.72 8.28 4.5 8 4.5Z" fill="#616161"/>
              <circle cx="8" cy="11" r="0.75" fill="#616161"/>
            </svg>
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

        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {principles.length === 0 ? (
            <EmptyState />
          ) : (
            <PanelTable<PrincipleInSelection>
              columns={COLUMNS}
              rows={principles}
              selectedIndex={selectedIndex}
              onRowClick={handleRowClick}
              selectionColor={colors.grey95}
            />
          )}
        </div>

        <FooterBar>
          <FooterStatusText>{hasSelection ? "1 row selected." : "No selection active. Select a row to enable actions."}</FooterStatusText>
          <DismissBtn label="Close" onClick={onClose} />
        </FooterBar>

        {pendingDelete !== null && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: colors.white, border: `1px solid ${colors.grey88}`, borderRadius: 6, padding: "20px 24px", maxWidth: 420, boxShadow: "0px 4px 16px rgba(0,0,0,0.12)" }}>
              <div style={{ fontSize: 12.5, color: colors.grey11, lineHeight: "20px", marginBottom: 18 }}>
                A principle is identified in a given set of principle; that principle belongs to that set of principle. A principle is identified in a given set of principle; that principle is a part of a given set of principle. While we can identify principles from a set, however we cannot remove them. Here the removal of the selected principle is simply hiding it from the list. Do I still want to continue to do that?
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => setPendingDelete(null)} style={{ height: 30, padding: "0 16px", background: colors.white, border: `1px solid ${colors.grey78}`, borderRadius: 4, fontSize: 12.4, fontFamily: "inherit", cursor: "pointer", color: colors.grey11 }}>No</button>
                <button onClick={confirmDelete} style={{ height: 30, padding: "0 16px", background: colors.azure42, border: "none", borderRadius: 4, fontSize: 12.4, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", color: colors.white }}>Yes</button>
              </div>
            </div>
          </div>
        )}

        {infoMsg && (
          <InfoMessageCard title={infoMsg.title} text={infoMsg.text} onClose={() => setInfoMsg(null)} />
        )}
      </div>
    </>,
    document.body
  );
}
