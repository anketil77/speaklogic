import React, { useState, useCallback } from "react";
import { PanelContextMenu, PanelMenuEntry } from "@/dialog/components/PanelContextMenu";
import { PanelTable, PanelTableCol } from "@/dialog/components/PanelTable";
import type { ProjectProblem } from "@/types/db";
import { formatDisplayDate } from "@/db/db";

type ProblemDraft = Omit<ProjectProblem, "id" | "analysisId">;

const REMOVE_MSG =
  "The overall process of analysis an entity enable us to identify problem about that entity and solve the problem " +
  "about that entity. During our analysis of an entity, if we identify a problem about that entity, we expect to " +
  "have solution for that problem. The way to look at it, an entity exists, the communication of that entity exists, " +
  "so problem about that entity. Since identified problem about an entity always point to that entity and that entity " +
  "cannot be discarded, it is not possible for us to remove a problem that points to an actual entity during our " +
  "analysis. Since this is a computer screen, if I want to, I can remove the selected problem from my list. Do I " +
  "still want to continue to do that?";

const COLUMNS: PanelTableCol<ProblemDraft>[] = [
  { header: "Problem #", width: "8%", render: (item) => item.problemNumber },
  { header: "Actual Problem", width: "24%", render: (item) => item.actualProblem, truncate: true },
  { header: "Problem Name", width: "22%", render: (item) => item.problemName, truncate: true },
  { header: "From Actual Error", width: "26%", render: (item) => item.fromActualError, truncate: true },
  {
    header: "Problem Date", width: "20%",
    render: (item) => <span style={{ color: item.problemDate ? "#222" : "#999" }}>{formatDisplayDate(item.problemDate) || "—"}</span>,
  },
];

interface ProblemPanelProps {
  items: ProblemDraft[];
  onOpenAdd: () => void;
  onOpenView: (problem: ProblemDraft) => void;
  onOpenSolve: (problem: ProblemDraft, idx: number) => void;
  onRemove: (index: number) => void;
}

export function ProblemPanel({ items, onOpenAdd, onOpenView, onOpenSolve, onRemove }: ProblemPanelProps) {
  const [menu, setMenu] = useState<{ x: number; y: number; rowIdx: number | null } | null>(null);
  const [pendingRemove, setPendingRemove] = useState<number | null>(null);

  const openMenu = useCallback((e: React.MouseEvent, rowIdx: number | null) => {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY, rowIdx });
  }, []);
  const closeMenu = useCallback(() => setMenu(null), []);

  const menuItems: PanelMenuEntry[] = [
    { label: "Add Identify Problem", onClick: () => onOpenAdd() },
    {
      label: "Response To Identify Problem",
      disabled: menu?.rowIdx == null,
      onClick: () => { if (menu?.rowIdx != null) { onOpenSolve(items[menu.rowIdx], menu.rowIdx); closeMenu(); } },
    },
    {
      label: "Remove Identify Problem",
      disabled: menu?.rowIdx == null,
      onClick: () => { if (menu?.rowIdx != null) { setPendingRemove(menu.rowIdx); closeMenu(); } },
    },
    {
      label: "View Identify Problem",
      disabled: menu?.rowIdx == null,
      onClick: () => { if (menu?.rowIdx != null) onOpenView(items[menu.rowIdx]); },
    },
  ];

  return (
    <PanelTable<ProblemDraft>
      columns={COLUMNS}
      rows={items}
      selectedIndex={menu?.rowIdx ?? null}
      onRowContextMenu={openMenu}
      selectionColor="#FFFBEE"
      emptyText="No problems identified yet. Right-click to add one."
    >
      {menu && <PanelContextMenu x={menu.x} y={menu.y} items={menuItems} onClose={closeMenu} />}

      {pendingRemove !== null && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.08)", zIndex: 100 }}>
          <div style={{ width: 440, background: "#FFFFFF", borderRadius: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.14)", padding: "22px 24px 18px", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#1B1B1B", marginBottom: 10 }}>Remove Identify Problem</div>
            <div style={{ fontSize: "12px", color: "#444", lineHeight: "18px", marginBottom: 20 }}>{REMOVE_MSG}</div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setPendingRemove(null)} style={{ height: 30, padding: "0 18px", background: "#FFFFFF", border: "1px solid #C7C7C7", borderRadius: 4, fontSize: "12.3px", fontFamily: "inherit", color: "#1B1B1B", cursor: "pointer" }}>No</button>
              <button onClick={() => { onRemove(pendingRemove); setPendingRemove(null); }} style={{ height: 30, padding: "0 18px", background: "#0078D4", border: "none", borderRadius: 4, fontSize: "12.3px", fontWeight: 700, fontFamily: "inherit", color: "#FFFFFF", cursor: "pointer" }}>Yes</button>
            </div>
          </div>
        </div>
      )}
    </PanelTable>
  );
}
