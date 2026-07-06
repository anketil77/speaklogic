// src/dialog/views/ListEntitiesView.tsx
//
// Read-only list of PointToEntity records (More Selections → List of Entities).
// Each row's View button (or right-click) opens a detail modal showing the
// entities (image / image URL / YouTube / explanation) and a small model
// diagram. Delete removes the record via DELETE_POINT_TO_ENTITY.

import React, { useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { formatDisplayDate } from "@/db/db";
import { useDialogComm } from "@/dialog/hooks/useDialogComm";
import { PanelTable, type PanelTableCol } from "@/dialog/components/PanelTable";
import { HtmlContent } from "@/dialog/components/HtmlContent";
import { FooterBar, FooterStatusText, DismissBtn } from "@/dialog/components/FooterButtons";
import { colors } from "@/styles/tokens";
import type { PointToEntity, PointToEntityItem } from "@/types/db";

function parseEntities(json: string | undefined | null): PointToEntityItem[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? (parsed as PointToEntityItem[]) : [];
  } catch {
    return [];
  }
}

function truncate(s: string, n = 60): string {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n) + "…" : t;
}

const COLUMNS: PanelTableCol<PointToEntity>[] = [
  { header: "Selection",      width: "32%", render: (r) => truncate(r.actualSelection) || "—", truncate: true },
  { header: "Selection Type", width: "16%", render: (r) => r.selectionType || "—",             truncate: true },
  { header: "Document",       width: "26%", render: (r) => truncate(r.documentLocation, 40) || "—", truncate: true },
  { header: "Date",           width: "14%", render: (r) => formatDisplayDate(r.entityDate) || "—", truncate: true },
  { header: "Time",           width: "12%", render: (r) => r.entityTime || "—",                 truncate: true },
];

// Popup shown when the user clicks an "entity as explanation" box (client point:
// "click on the explanation box popup the text").
function ExplanationPopup({ html, onClose }: { html: string; onClose: () => void }) {
  return createPortal(
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 225 }} onClick={onClose} />
      <div
        style={{
          position: "fixed", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
          zIndex: 226, background: colors.white, borderRadius: 8,
          boxShadow: "0px 8px 32px rgba(0,0,0,0.16)", width: 460, maxWidth: "94vw",
          maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column",
          fontFamily: "Inter, Segoe UI, sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", padding: "14px 18px", borderBottom: `1px solid ${colors.grey88}` }}>
          <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: colors.grey11 }}>Explanation</div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: colors.grey38, lineHeight: 1 }}
            title="Close"
          >
            ×
          </button>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: 18 }}>
          <HtmlContent html={html} />
        </div>
      </div>
    </>,
    document.body
  );
}

// ─── Single entity preview inside the detail modal ──────────────────────────────
function EntityCard({ entity, index }: { entity: PointToEntityItem; index: number }) {
  const [showExplanation, setShowExplanation] = useState(false);
  return (
    <div style={{ border: `1px solid ${colors.grey88}`, borderRadius: 6, padding: 10, marginBottom: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: colors.grey11, marginBottom: 6 }}>
        {entity.name || `Entity ${index + 1}`}
      </div>
      {entity.isExplanation ? (
        entity.explanation
          ? (
            <>
              <button
                onClick={() => setShowExplanation(true)}
                style={{
                  width: "100%", textAlign: "left", cursor: "pointer",
                  border: `1px dashed ${colors.grey78}`, borderRadius: 6, background: colors.grey96,
                  padding: "10px 12px", fontFamily: "inherit", fontSize: 12, color: colors.azure42, fontWeight: 600,
                }}
                title="Click to view the explanation"
              >
                View explanation
              </button>
              {showExplanation && (
                <ExplanationPopup html={entity.explanation} onClose={() => setShowExplanation(false)} />
              )}
            </>
          )
          : <span style={{ color: colors.grey74, fontSize: 12 }}>No explanation</span>
      ) : !entity.imageValue ? (
        <span style={{ color: colors.grey74, fontSize: 12 }}>No image</span>
      ) : entity.imageSource === "youtube" ? (
        <a href={entity.imageValue} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: colors.azure42, wordBreak: "break-all" }}>
          {entity.imageValue}
        </a>
      ) : (
        <img src={entity.imageValue} alt={entity.name || "entity"} style={{ maxWidth: "100%", maxHeight: 180, borderRadius: 4 }} />
      )}
    </div>
  );
}

function DetailModal({ record, onClose }: { record: PointToEntity; onClose: () => void }) {
  const entities = parseEntities(record.entityImages);

  return createPortal(
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.12)", zIndex: 215 }} onClick={onClose} />
      <div
        style={{
          position: "fixed", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
          zIndex: 216, background: colors.white, borderRadius: 8,
          boxShadow: "0px 8px 32px rgba(0,0,0,0.14)", width: 560, maxWidth: "96vw",
          maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column",
          fontFamily: "Inter, Segoe UI, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", padding: "16px 20px", gap: 12, borderBottom: `1px solid ${colors.grey88}` }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: colors.grey11 }}>View Entity</div>
            <div style={{ fontSize: 11, color: colors.grey38, marginTop: 2 }}>{record.selectionType} points to entity</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: colors.grey38, lineHeight: 1 }}
            title="Close"
          >
            ×
          </button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
          {/* Model */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, minWidth: 0, border: `2px solid ${colors.azure42}`, borderRadius: 10, padding: 10, minHeight: 70 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: colors.grey38, textTransform: "uppercase" }}>{record.selectionType}</div>
              <div style={{ fontSize: 12, color: colors.grey11, whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 80, overflow: "auto" }}>
                {record.actualSelection || "—"}
              </div>
            </div>
            <div style={{ flexShrink: 0, textAlign: "center", color: colors.grey38, fontSize: 11, fontWeight: 600 }}>
              points to
              <div style={{ fontSize: 18, lineHeight: "14px" }}>→</div>
            </div>
            <div style={{ flex: 1, minWidth: 0, border: `2px solid ${colors.azure42}`, borderRadius: 10, padding: 10, minHeight: 70 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: colors.grey38, textTransform: "uppercase" }}>
                {entities.length > 1 ? "Entities" : "Entity"}
              </div>
              <div style={{ fontSize: 12, color: colors.grey11 }}>
                {entities.length} item{entities.length === 1 ? "" : "s"}
              </div>
            </div>
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, color: colors.grey38, textTransform: "uppercase", marginBottom: 8 }}>Entities</div>
          {entities.length === 0 ? (
            <span style={{ color: colors.grey74, fontSize: 12 }}>No entities recorded.</span>
          ) : (
            entities.map((e, i) => <EntityCard key={i} entity={e} index={i} />)
          )}
        </div>

        <FooterBar>
          <span style={{ flex: 1 }} />
          <DismissBtn label="Close" onClick={onClose} />
        </FooterBar>
      </div>
    </>,
    document.body
  );
}

export default function ListEntitiesView() {
  const { initData, sendMessage, closeDialog } = useDialogComm();

  const allRows = useMemo(
    () => (initData?.pointToEntities ?? []) as PointToEntity[],
    [initData]
  );

  const [deletedIds, setDeletedIds] = useState<Set<number>>(new Set());
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [viewRecord, setViewRecord] = useState<PointToEntity | null>(null);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);

  const displayRows = useMemo(
    () => allRows.filter((r) => !deletedIds.has(r.id as number)),
    [allRows, deletedIds]
  );

  const hasSelection = selectedIndex !== null;

  const handleRowClick = useCallback((idx: number) => {
    setSelectedIndex((prev) => (prev === idx ? null : idx));
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (pendingDelete === null) return;
    const row = displayRows[pendingDelete];
    if (!row?.id) { setPendingDelete(null); return; }
    sendMessage({ action: "DELETE_POINT_TO_ENTITY", id: row.id as number });
    setDeletedIds((prev) => new Set(prev).add(row.id as number));
    setPendingDelete(null);
    setSelectedIndex(null);
  }, [pendingDelete, displayRows, sendMessage]);

  return (
    <div
      style={{
        width: "100vw", height: "100vh", display: "flex", flexDirection: "column",
        fontFamily: "Inter, Segoe UI, sans-serif", background: colors.white,
        overflow: "hidden", boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div style={{ padding: "18px 20px 12px" }}>
        <div style={{ fontWeight: 700, fontSize: 15.6, color: colors.grey11 }}>List of Entities</div>
        <div style={{ fontSize: 11.1, color: colors.grey38, marginTop: 3 }}>
          Selections that point to an entity.
        </div>
      </div>

      {/* Command bar */}
      <div
        style={{
          height: 44, minHeight: 44, background: colors.grey96, display: "flex",
          alignItems: "center", padding: "0 12px", gap: 8, boxSizing: "border-box",
          borderTop: `1px solid ${colors.grey88}`, borderBottom: `1px solid ${colors.grey88}`,
        }}
      >
        <button
          disabled={!hasSelection}
          onClick={() => { if (selectedIndex !== null) setViewRecord(displayRows[selectedIndex]); }}
          style={{
            height: 28, padding: "0 12px", border: `1px solid ${colors.grey78}`, borderRadius: 4,
            background: colors.white, cursor: hasSelection ? "pointer" : "default",
            opacity: hasSelection ? 1 : 0.4, fontSize: 12, fontFamily: "inherit", color: colors.grey11,
          }}
        >
          View
        </button>
        <button
          disabled={!hasSelection}
          onClick={() => { if (hasSelection) setPendingDelete(selectedIndex); }}
          style={{
            height: 28, padding: "0 12px", border: `1px solid ${colors.grey78}`, borderRadius: 4,
            background: colors.white, cursor: hasSelection ? "pointer" : "default",
            opacity: hasSelection ? 1 : 0.4, fontSize: 12, fontFamily: "inherit", color: colors.redDestructive,
          }}
        >
          Delete
        </button>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}>
        {displayRows.length === 0 ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.4, color: colors.grey38 }}>
            No entities yet.
          </div>
        ) : (
          <PanelTable<PointToEntity>
            columns={COLUMNS}
            rows={displayRows}
            selectedIndex={selectedIndex}
            onRowClick={handleRowClick}
            onRowContextMenu={(_e, idx) => { if (idx !== null) setViewRecord(displayRows[idx]); }}
            selectionColor={colors.grey95}
          >
            {pendingDelete !== null && (
              <div
                style={{
                  position: "absolute", inset: 0, background: "rgba(255,255,255,0.92)",
                  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10,
                }}
              >
                <div style={{ background: colors.white, border: `1px solid ${colors.grey88}`, borderRadius: 6, padding: "20px 24px", maxWidth: 420, boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}>
                  <p style={{ margin: "0 0 16px", fontSize: 12.4, color: colors.grey11, lineHeight: "18px" }}>
                    Do you want to remove this entity from your list?
                  </p>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button
                      onClick={() => setPendingDelete(null)}
                      style={{ height: 28, padding: "0 16px", background: colors.white, border: `1px solid ${colors.grey78}`, borderRadius: 4, fontSize: 12, fontFamily: "inherit", cursor: "pointer", color: colors.grey11 }}
                    >
                      No
                    </button>
                    <button
                      onClick={handleDeleteConfirm}
                      style={{ height: 28, padding: "0 16px", background: colors.redDestructive, border: "none", borderRadius: 4, fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", color: colors.white }}
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

      {/* Footer */}
      <FooterBar>
        <FooterStatusText>
          {displayRows.length} record{displayRows.length !== 1 ? "s" : ""}
        </FooterStatusText>
        <DismissBtn label="Close" onClick={closeDialog} />
      </FooterBar>

      {viewRecord && <DetailModal record={viewRecord} onClose={() => setViewRecord(null)} />}
    </div>
  );
}
