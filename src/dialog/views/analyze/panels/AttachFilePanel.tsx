import React, { useState, useCallback } from "react";
import { PanelContextMenu, PanelMenuEntry } from "@/dialog/components/PanelContextMenu";
import { PanelTable, PanelTableCol } from "@/dialog/components/PanelTable";
import type { AttachFileToProject } from "@/types/db";

type FileDraft = Omit<AttachFileToProject, "id" | "analysisId" | "feedbackId" | "flagId" | "articleId">;

const REMOVE_MSG = "Are you sure you want to remove this file from the analysis? This action cannot be undone.";

const COLUMNS: PanelTableCol<FileDraft>[] = [
  { header: "File Name", width: "35%", render: (item) => item.fileName },
  { header: "File Type", width: "13%", render: (item) => item.fileType },
  { header: "File Date", width: "18%", render: (item) => <span style={{ color: "#999" }}>{item.fileDate || "—"}</span> },
  { header: "File Time", width: "15%", render: (item) => <span style={{ color: "#999" }}>{item.fileTime || "—"}</span> },
  { header: "File Size", width: "19%", render: (item) => item.fileSize },
];

interface AttachFilePanelProps {
  items: FileDraft[];
  onAdd: (item: FileDraft) => void;
  onRemove: (index: number) => void;
  onOpenAdd: () => void;
  onOpenView: (file: FileDraft) => void;
}

export function AttachFilePanel({ items, onRemove, onOpenAdd, onOpenView }: AttachFilePanelProps) {
  const [menu, setMenu] = useState<{ x: number; y: number; rowIdx: number | null } | null>(null);
  const [pendingRemove, setPendingRemove] = useState<number | null>(null);

  const openMenu = useCallback((e: React.MouseEvent, rowIdx: number | null) => {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY, rowIdx });
  }, []);
  const closeMenu = useCallback(() => setMenu(null), []);

  const menuItems: PanelMenuEntry[] = [
    {
      label: "Add File",
      onClick: () => { closeMenu(); onOpenAdd(); },
    },
    {
      label: "Remove File",
      disabled: menu?.rowIdx == null,
      onClick: () => { if (menu?.rowIdx != null) { setPendingRemove(menu.rowIdx); closeMenu(); } },
    },
    { isSep: true },
    {
      label: "View File Info",
      disabled: menu?.rowIdx == null,
      onClick: () => { if (menu?.rowIdx != null) { onOpenView(items[menu.rowIdx]); closeMenu(); } },
    },
  ];

  return (
    <PanelTable<FileDraft>
      columns={COLUMNS}
      rows={items}
      selectedIndex={menu?.rowIdx ?? null}
      onRowContextMenu={openMenu}
      selectionColor="#EBF3FC"
      emptyText="No files attached yet. Right-click to add one."
    >
      {menu && <PanelContextMenu x={menu.x} y={menu.y} items={menuItems} onClose={closeMenu} />}

      {pendingRemove !== null && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.08)", zIndex: 100 }}>
          <div style={{ width: 440, background: "#FFFFFF", borderRadius: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.14)", padding: "22px 24px 18px", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#1B1B1B", marginBottom: 10 }}>Remove File</div>
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
