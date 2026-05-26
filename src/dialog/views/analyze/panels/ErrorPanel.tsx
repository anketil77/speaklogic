import React, { useState, useCallback } from "react";
import { PanelContextMenu, PanelMenuEntry } from "@/dialog/components/PanelContextMenu";
import { PanelTable, PanelTableCol } from "@/dialog/components/PanelTable";
import type { ProjectError } from "@/types/db";

type ErrorDraft = Omit<ProjectError, "id" | "analysisId">;

const REMOVE_MSG =
  "While analyzing an entity, it is possible for us to identify errors if there exist errors in the entity that is " +
  "being analyzed. While analyzing an entity, if we identify errors in that entity, it is not possible for us to " +
  "unidentify an error that we have identified already. The way to look at it, an entity exists, the communication " +
  "of that entity exists, so errors about that entity. Since errors about an entity always point to that entity and " +
  "that entity cannot be discarded, it is not possible for us to remove an error that has been identified during our " +
  "analysis. Since this is a computer screen, if I want to, I can remove the selected error from the list. Do I " +
  "still want to continue to do that?";

const COLUMNS: PanelTableCol<ErrorDraft>[] = [
  { header: "Error #", width: "12%", render: (_, idx) => idx + 1 },
  { header: "Actual Error", width: "36%", render: (item) => item.actualError, truncate: true },
  { header: "From Actual Communication", width: "36%", render: (item) => item.fromActualCommunication, truncate: true },
  { header: "Error Date", width: "16%", render: (item) => <span style={{ color: "#999" }}>{item.errorDate || "—"}</span> },
];

interface ErrorPanelProps {
  items: ErrorDraft[];
  onOpenAdd: () => void;
  onOpenView: (error: ErrorDraft) => void;
  onRemove: (index: number) => void;
  onIdentifyCompensator: (errorText: string, fromActualCommunication: string) => void;
}

export function ErrorPanel({ items, onOpenAdd, onOpenView, onRemove, onIdentifyCompensator }: ErrorPanelProps) {
  const [menu, setMenu] = useState<{ x: number; y: number; rowIdx: number | null } | null>(null);
  const [pendingRemove, setPendingRemove] = useState<number | null>(null);

  const openMenu = useCallback((e: React.MouseEvent, rowIdx: number | null) => {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY, rowIdx });
  }, []);
  const closeMenu = useCallback(() => setMenu(null), []);

  const menuItems: PanelMenuEntry[] = [
    { label: "Add Error", onClick: () => onOpenAdd() },
    {
      label: "Remove Error",
      disabled: menu?.rowIdx == null,
      onClick: () => { if (menu?.rowIdx != null) { setPendingRemove(menu.rowIdx); closeMenu(); } },
    },
    {
      label: "View Error",
      disabled: menu?.rowIdx == null,
      onClick: () => { if (menu?.rowIdx != null) onOpenView(items[menu.rowIdx]); },
    },
    { isSep: true },
    {
      label: "Identify Compensator For Error",
      disabled: menu?.rowIdx == null,
      onClick: () => { if (menu?.rowIdx != null) onIdentifyCompensator(items[menu.rowIdx].actualError, items[menu.rowIdx].fromActualCommunication); },
    },
  ];

  return (
    <PanelTable<ErrorDraft>
      columns={COLUMNS}
      rows={items}
      selectedIndex={menu?.rowIdx ?? null}
      onRowContextMenu={openMenu}
      selectionColor="#FFF0F0"
      emptyText="No errors identified yet. Right-click to add one."
    >
      {menu && <PanelContextMenu x={menu.x} y={menu.y} items={menuItems} onClose={closeMenu} />}

      {pendingRemove !== null && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.08)", zIndex: 100 }}>
          <div style={{ width: 440, background: "#FFFFFF", borderRadius: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.14)", padding: "22px 24px 18px", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#1B1B1B", marginBottom: 10 }}>Remove Error</div>
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
