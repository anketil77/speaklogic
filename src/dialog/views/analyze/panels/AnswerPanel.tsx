import React, { useState, useCallback } from "react";
import { PanelContextMenu, PanelMenuEntry } from "@/dialog/components/PanelContextMenu";
import { PanelTable, PanelTableCol } from "@/dialog/components/PanelTable";
import type { ProjectAnswer } from "@/types/db";

type AnswerDraft = Omit<ProjectAnswer, "id" | "analysisId" | "questionId">;

const REMOVE_MSG =
  "Within an analysis, questions can be asked, where those questions can be answered. For instance, if an " +
  "identified entity is under analysis, it is possible to ask questions in that analysis. In this case, a " +
  "question is asked about an entity, where that question points to an actual entity. Since the existence of " +
  "that entity enables the existence of information about that entity, the answer of that question points to " +
  "that information. Since it is not possible for us to remove that information from that entity, it is not " +
  "possible for us as well to remove the answer of a question that points to that information. Since this is " +
  "a computer screen, if I want to, I can remove the selected answer from the list. Do I still want to " +
  "continue to remove the selected answer from the list?";

const COLUMNS: PanelTableCol<AnswerDraft>[] = [
  { header: "Answer #", width: "10%", render: (item) => item.answerNumber },
  { header: "Actual Question", width: "25%", render: (item) => item.actualQuestion, truncate: true },
  { header: "Actual Answer", width: "25%", render: (item) => item.actualAnswer, truncate: true },
  { header: "Information Answer Point To", width: "25%", render: (item) => item.informationAnswerPointTo, truncate: true },
  { header: "Answer Date", width: "15%", render: (item) => <span style={{ color: "#999" }}>{item.answerDate || "—"}</span> },
];

interface AnswerPanelProps {
  items: AnswerDraft[];
  onOpenView: (answer: AnswerDraft) => void;
  onRemove: (index: number) => void;
  onSelectionChange?: (idx: number | null) => void;
}

export function AnswerPanel({ items, onOpenView, onRemove, onSelectionChange }: AnswerPanelProps) {
  const [menu, setMenu] = useState<{ x: number; y: number; rowIdx: number | null } | null>(null);
  const [pendingRemove, setPendingRemove] = useState<number | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const selectRow = useCallback((idx: number | null) => {
    setSelectedIdx(idx);
    onSelectionChange?.(idx);
  }, [onSelectionChange]);

  const openMenu = useCallback((e: React.MouseEvent, rowIdx: number | null) => {
    e.preventDefault();
    if (rowIdx !== null) selectRow(rowIdx);
    setMenu({ x: e.clientX, y: e.clientY, rowIdx });
  }, [selectRow]);
  const closeMenu = useCallback(() => setMenu(null), []);

  const menuItems: PanelMenuEntry[] = [
    {
      label: "View Answer",
      disabled: menu?.rowIdx == null,
      onClick: () => { if (menu?.rowIdx != null) { onOpenView(items[menu.rowIdx]); closeMenu(); } },
    },
    { isSep: true },
    {
      label: "Remove Selected Answer",
      disabled: menu?.rowIdx == null,
      onClick: () => { if (menu?.rowIdx != null) { setPendingRemove(menu.rowIdx); closeMenu(); } },
    },
  ];

  return (
    <PanelTable<AnswerDraft>
      columns={COLUMNS}
      rows={items}
      selectedIndex={selectedIdx}
      onRowClick={selectRow}
      onRowContextMenu={openMenu}
      emptyText="No answers added yet."
    >
      {menu && <PanelContextMenu x={menu.x} y={menu.y} items={menuItems} onClose={closeMenu} />}

      {pendingRemove !== null && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.08)", zIndex: 100 }}>
          <div style={{ width: 440, background: "#FFFFFF", borderRadius: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.14)", padding: "22px 24px 18px", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#1B1B1B", marginBottom: 10 }}>Remove Answer Message</div>
            <div style={{ fontSize: "12px", color: "#444", lineHeight: "18px", marginBottom: 20 }}>{REMOVE_MSG}</div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setPendingRemove(null)} style={{ height: 30, padding: "0 18px", background: "#FFFFFF", border: "1px solid #C7C7C7", borderRadius: 4, fontSize: "12.3px", fontFamily: "inherit", color: "#1B1B1B", cursor: "pointer" }}>No</button>
              <button onClick={() => { onRemove(pendingRemove); setPendingRemove(null); }} style={{ height: 30, padding: "0 18px", background: "#D13438", border: "none", borderRadius: 4, fontSize: "12.3px", fontWeight: 700, fontFamily: "inherit", color: "#FFFFFF", cursor: "pointer" }}>Yes</button>
            </div>
          </div>
        </div>
      )}
    </PanelTable>
  );
}
