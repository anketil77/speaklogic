import React, { useState, useCallback } from "react";
import { PanelContextMenu, PanelMenuEntry } from "@/dialog/components/PanelContextMenu";
import { PanelTable, PanelTableCol } from "@/dialog/components/PanelTable";
import type { ProjectCompensator } from "@/types/db";

type CompensatorDraft = Omit<ProjectCompensator, "id" | "analysisId">;

const REMOVE_MSG =
  "A compensator is identified to enable the correction of an error. The compensator itself is linked to the " +
  "error it is meant to replace. Since the compensator is tied to the identified error and the analysis that " +
  "produced it, removing the compensator would undermine the correction process. Since this is a computer screen, " +
  "if I want to, I can remove the selected compensator from the list. Do I still want to continue to do that?";

const COLUMNS: PanelTableCol<CompensatorDraft>[] = [
  { header: "Compensator #", width: "14%", render: (_, idx) => idx + 1 },
  { header: "Actual Compensator", width: "30%", render: (item) => item.actualCompensator, truncate: true },
  { header: "Error Replaced", width: "30%", render: (item) => item.actualErrorReplaced, truncate: true },
  { header: "Compensator Date", width: "26%", render: (item) => <span style={{ color: "#999" }}>{item.compensatorDate || "—"}</span> },
];

interface CompensatorPanelProps {
  items: CompensatorDraft[];
  onOpenAdd: () => void;
  onOpenView: (comp: CompensatorDraft) => void;
  onRemove: (index: number) => void;
}

export function CompensatorPanel({ items, onOpenAdd, onOpenView, onRemove }: CompensatorPanelProps) {
  const [menu, setMenu] = useState<{ x: number; y: number; rowIdx: number | null } | null>(null);
  const [pendingRemove, setPendingRemove] = useState<number | null>(null);

  const openMenu = useCallback((e: React.MouseEvent, rowIdx: number | null) => {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY, rowIdx });
  }, []);
  const closeMenu = useCallback(() => setMenu(null), []);

  const menuItems: PanelMenuEntry[] = [
    { label: "Add Compensator", onClick: () => onOpenAdd() },
    {
      label: "Remove Compensator",
      disabled: menu?.rowIdx == null,
      onClick: () => { if (menu?.rowIdx != null) { setPendingRemove(menu.rowIdx); closeMenu(); } },
    },
    {
      label: "View Compensator",
      disabled: menu?.rowIdx == null,
      onClick: () => { if (menu?.rowIdx != null) onOpenView(items[menu.rowIdx]); },
    },
  ];

  return (
    <PanelTable<CompensatorDraft>
      columns={COLUMNS}
      rows={items}
      selectedIndex={menu?.rowIdx ?? null}
      onRowContextMenu={openMenu}
      selectionColor="#F3EEFF"
      emptyText="No compensators added yet. Right-click to add one."
    >
      {menu && <PanelContextMenu x={menu.x} y={menu.y} items={menuItems} onClose={closeMenu} />}

      {pendingRemove !== null && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.08)", zIndex: 100 }}>
          <div style={{ width: 440, background: "#FFFFFF", borderRadius: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.14)", padding: "22px 24px 18px", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#1B1B1B", marginBottom: 10 }}>Remove Compensator</div>
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
