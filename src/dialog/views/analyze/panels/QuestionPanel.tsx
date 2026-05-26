import React, { useState, useCallback } from "react";
import { PanelContextMenu, PanelMenuEntry } from "@/dialog/components/PanelContextMenu";
import { PanelTable, PanelTableCol } from "@/dialog/components/PanelTable";
import type { ProjectQuestion } from "@/types/db";

type QuestionDraft = Omit<ProjectQuestion, "id" | "analysisId" | "questionDate" | "questionTime">;

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();

const REMOVE_MSG =
  "The overall process of analysis an entity enable us to ask question about that entity and answer question " +
  "about that entity. During our analysis of an entity, if we ask a question about that entity, we expect to " +
  "have answer for that question. The way to look at it, an entity exists, the communication of that entity " +
  "exists, so questions about that entity. Since questions about an entity always point to that entity and that " +
  "entity cannot be discarded, it is not possible for us to remove a question that points to an actual entity " +
  "during our analysis. Since this is a computer screen, if I want to, I can remove the selected question from " +
  "my list. Do I still want to continue to do that?";

const COLUMNS: PanelTableCol<QuestionDraft>[] = [
  { header: "Question #", width: "12%", render: (_, idx) => idx + 1 },
  { header: "Actual Question", width: "33%", render: (item) => stripHtml(item.actualQuestion), truncate: true },
  { header: "Entity Question Points To", width: "33%", render: (item) => item.entityQuestionPointTo, truncate: true },
  {
    header: "Response Status", width: "22%",
    render: (item) => <span style={{ color: item.responseStatus ? "#222" : "#999" }}>{item.responseStatus || "Pending"}</span>,
  },
];

interface QuestionPanelProps {
  items: QuestionDraft[];
  onRemove: (index: number) => void;
  onOpenAdd: () => void;
  onOpenView: (question: QuestionDraft) => void;
  onOpenRespond: (question: QuestionDraft, idx: number) => void;
  onSelectionChange?: (idx: number | null) => void;
}

export function QuestionPanel({ items, onRemove, onOpenAdd, onOpenView, onOpenRespond, onSelectionChange }: QuestionPanelProps) {
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
    { label: "Add Analysis Question", onClick: () => onOpenAdd() },
    {
      label: "Respond To Analysis Question",
      disabled: menu?.rowIdx == null,
      onClick: () => { if (menu?.rowIdx != null) onOpenRespond(items[menu.rowIdx], menu.rowIdx); },
    },
    {
      label: "Remove Analysis Question",
      disabled: menu?.rowIdx == null,
      onClick: () => { if (menu?.rowIdx != null) { setPendingRemove(menu.rowIdx); closeMenu(); } },
    },
    {
      label: "View Analysis Question",
      disabled: menu?.rowIdx == null,
      onClick: () => { if (menu?.rowIdx != null) onOpenView(items[menu.rowIdx]); },
    },
  ];

  return (
    <PanelTable<QuestionDraft>
      columns={COLUMNS}
      rows={items}
      selectedIndex={selectedIdx}
      onRowClick={selectRow}
      onRowContextMenu={openMenu}
      emptyText="No questions added yet. Right-click to add one."
    >
      {menu && <PanelContextMenu x={menu.x} y={menu.y} items={menuItems} onClose={closeMenu} />}

      {pendingRemove !== null && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.08)", zIndex: 100 }}>
          <div style={{ width: 440, background: "#FFFFFF", borderRadius: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.14)", padding: "22px 24px 18px", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#1B1B1B", marginBottom: 10 }}>Remove Analysis Question</div>
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
