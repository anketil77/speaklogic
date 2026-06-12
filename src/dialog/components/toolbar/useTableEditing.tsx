// src/dialog/components/toolbar/useTableEditing.tsx
//
// Table editing for the shared RichEditor: a right-click context menu
// (insert/delete rows & columns, merge/split, delete table) plus draggable
// column-resize handles. Self-contained — RichEditor mounts the returned
// elements and wires `onContextMenu`. The handler only acts when the click is
// inside a table, so it never collides with the "Insert to Document" right-click
// menu on surfaces that have one.

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Cell,
  buildGrid,
  deleteColumn,
  deleteRow,
  deleteTable,
  getCell,
  getSelectedCells,
  getTable,
  insertColumn,
  insertRow,
  mergeCells,
  resizeColumnBoundary,
  resizeRowHeight,
  splitCell,
} from "@/dialog/components/toolbar/tableEditing";

interface MenuState {
  x: number;
  y: number;
  cell: Cell;
  table: HTMLTableElement;
  selected: Cell[];
}

interface HandleGeom {
  table: HTMLTableElement;
  orient: "col" | "row";
  index: number; // col: boundary between column index/index+1; row: row whose bottom edge this is
  // Fixed-viewport geometry of the thin draggable strip.
  left: number;
  top: number;
  width: number;
  height: number;
}

const menuItemStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "6px 14px",
  textAlign: "left",
  background: "transparent",
  border: "none",
  fontSize: "12px",
  fontFamily: "inherit",
  color: "#1B1B1B",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

function MenuItem({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      disabled={disabled}
      style={{
        ...menuItemStyle,
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "default" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = "#F0F0F0";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
      onMouseDown={(e) => e.preventDefault()} // keep editor selection alive
      onClick={onClick}
    >
      {label}
    </button>
  );
}

// Thickness (px) of the draggable strip centred on each grid line.
const GRIP = 7;

// Build the column- and row-resize handles for one table.
function getTableHandles(table: HTMLTableElement): HandleGeom[] {
  const grid = buildGrid(table);
  const rect = table.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return []; // hidden table
  const out: HandleGeom[] = [];

  // ── Column boundaries (vertical strips) ──
  const row0 = grid.rows[0];
  if (row0 && grid.cols >= 2) {
    const widths: number[] = new Array(grid.cols).fill(0);
    let c = 0;
    for (const child of Array.from(row0.children)) {
      if (child.tagName !== "TD" && child.tagName !== "TH") continue;
      const span = Math.max(1, (child as Cell).colSpan || 1);
      const w = (child as HTMLElement).getBoundingClientRect().width / span;
      for (let i = 0; i < span && c + i < grid.cols; i++) widths[c + i] = w;
      c += span;
    }
    let x = rect.left;
    for (let i = 0; i < grid.cols - 1; i++) {
      x += widths[i];
      out.push({
        table,
        orient: "col",
        index: i,
        left: x - GRIP / 2,
        top: rect.top,
        width: GRIP,
        height: rect.height,
      });
    }
  }

  // ── Row boundaries (horizontal strips) ──
  if (grid.rows.length >= 2) {
    for (let r = 0; r < grid.rows.length - 1; r++) {
      const rr = grid.rows[r].getBoundingClientRect();
      out.push({
        table,
        orient: "row",
        index: r,
        left: rect.left,
        top: rr.bottom - GRIP / 2,
        width: rect.width,
        height: GRIP,
      });
    }
  }

  return out;
}

export function useTableEditing(editorRef: React.RefObject<HTMLDivElement>) {
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [handles, setHandles] = useState<HandleGeom[]>([]);
  const dragRef = useRef<{
    orient: "col" | "row";
    table: HTMLTableElement;
    index: number;
    lastX: number;
    lastY: number;
  } | null>(null);
  // Last multi-cell selection inside a table — kept so a right-click (which can
  // collapse the selection before the menu reads it) doesn't lose the cells to merge.
  const lastSelRef = useRef<{ table: HTMLTableElement; cells: Cell[] } | null>(null);

  const fireInput = useCallback(() => {
    editorRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
  }, [editorRef]);

  // ── Recompute resize handles ────────────────────────────────────────────────
  const refreshHandles = useCallback(() => {
    const root = editorRef.current;
    if (!root) return;
    const next: HandleGeom[] = [];
    for (const table of Array.from(root.querySelectorAll<HTMLTableElement>("table"))) {
      next.push(...getTableHandles(table));
    }
    setHandles(next);
  }, [editorRef]);

  // Keep handles in sync with content/scroll/resize while the editor is mounted.
  useEffect(() => {
    const root = editorRef.current;
    if (!root) return undefined;
    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(refreshHandles);
    };
    schedule();
    root.addEventListener("input", schedule);
    root.addEventListener("scroll", schedule, true);
    // Re-measure when the pointer enters the editor: covers the case where the
    // editor was first mounted hidden (kept alive behind display:none on other
    // tabs), so rect measurements were 0 until it became visible.
    root.addEventListener("mouseenter", schedule);
    root.addEventListener("focusin", schedule);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    const mo = new MutationObserver(schedule);
    mo.observe(root, { childList: true, subtree: true, attributes: true });
    return () => {
      cancelAnimationFrame(raf);
      root.removeEventListener("input", schedule);
      root.removeEventListener("scroll", schedule, true);
      root.removeEventListener("mouseenter", schedule);
      root.removeEventListener("focusin", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
      mo.disconnect();
    };
  }, [editorRef, refreshHandles]);

  // Track the most recent ≥2-cell selection so merge survives the right-click.
  useEffect(() => {
    const root = editorRef.current;
    if (!root) return undefined;
    const onSel = () => {
      const cells = getSelectedCells(root);
      if (cells.length >= 2) {
        const table = getTable(cells[0], root);
        if (table) lastSelRef.current = { table, cells };
      }
    };
    document.addEventListener("selectionchange", onSel);
    return () => document.removeEventListener("selectionchange", onSel);
  }, [editorRef]);

  // ── Context menu ────────────────────────────────────────────────────────────
  const onContextMenu = useCallback(
    (e: React.MouseEvent) => {
      const root = editorRef.current;
      if (!root) return;
      const cell = getCell(e.target as Node, root);
      const table = getTable(e.target as Node, root);
      if (!cell || !table) return; // not in a table — let other handlers run
      e.preventDefault();
      e.stopPropagation();

      let selected = getSelectedCells(root);
      if (selected.length < 2 && lastSelRef.current && lastSelRef.current.table === table) {
        // Right-click collapsed the drag-selection — fall back to the last one.
        selected = lastSelRef.current.cells.filter((c) => table.contains(c));
      }
      setMenu({ x: e.clientX, y: e.clientY, cell, table, selected });
    },
    [editorRef]
  );

  const closeMenu = useCallback(() => setMenu(null), []);

  const run = useCallback(
    (fn: () => void) => {
      fn();
      fireInput();
      setMenu(null);
      requestAnimationFrame(refreshHandles);
    },
    [fireInput, refreshHandles]
  );

  // ── Column / row drag-resize ────────────────────────────────────────────────
  const startDrag = useCallback(
    (geom: HandleGeom, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragRef.current = {
        orient: geom.orient,
        table: geom.table,
        index: geom.index,
        lastX: e.clientX,
        lastY: e.clientY,
      };

      const onMove = (ev: MouseEvent) => {
        const d = dragRef.current;
        if (!d) return;
        if (d.orient === "col") {
          const delta = ev.clientX - d.lastX;
          if (delta === 0) return;
          d.lastX = ev.clientX;
          resizeColumnBoundary(d.table, d.index, delta);
        } else {
          const delta = ev.clientY - d.lastY;
          if (delta === 0) return;
          d.lastY = ev.clientY;
          resizeRowHeight(d.table, d.index, delta);
        }
        refreshHandles();
      };
      const onUp = () => {
        dragRef.current = null;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
        fireInput();
      };
      document.body.style.cursor = geom.orient === "col" ? "col-resize" : "row-resize";
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [fireInput, refreshHandles]
  );

  // ── Rendered elements ───────────────────────────────────────────────────────
  const currentCanSplit =
    !!menu && (Math.max(1, menu.cell.colSpan || 1) > 1 || Math.max(1, menu.cell.rowSpan || 1) > 1);
  const currentCanMerge = !!menu && menu.selected.length >= 2;

  const menuElement = menu
    ? createPortal(
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 10000 }}
            onMouseDown={closeMenu}
            onContextMenu={(e) => {
              e.preventDefault();
              closeMenu();
            }}
          />
          <div
            style={{
              position: "fixed",
              left: Math.min(menu.x, window.innerWidth - 220),
              top: Math.min(menu.y, window.innerHeight - 320),
              zIndex: 10001,
              background: "#FFFFFF",
              border: "1px solid #E0E0E0",
              borderRadius: 4,
              boxShadow: "0 4px 16px rgba(0,0,0,0.14)",
              minWidth: 200,
              paddingTop: 4,
              paddingBottom: 4,
              overflow: "hidden",
              fontFamily: "'Inter','Segoe UI',sans-serif",
            }}
          >
            <MenuItem
              label="Insert row above"
              onClick={() => run(() => insertRow(menu.table, menu.cell, "above"))}
            />
            <MenuItem
              label="Insert row below"
              onClick={() => run(() => insertRow(menu.table, menu.cell, "below"))}
            />
            <MenuItem
              label="Insert column left"
              onClick={() => run(() => insertColumn(menu.table, menu.cell, "left"))}
            />
            <MenuItem
              label="Insert column right"
              onClick={() => run(() => insertColumn(menu.table, menu.cell, "right"))}
            />
            <div style={{ height: 1, background: "#ECECEC", margin: "4px 0" }} />
            <MenuItem
              label="Merge cells"
              disabled={!currentCanMerge}
              onClick={() =>
                run(() => {
                  mergeCells(menu.table, menu.selected);
                })
              }
            />
            <MenuItem
              label="Split cell"
              disabled={!currentCanSplit}
              onClick={() =>
                run(() => {
                  splitCell(menu.table, menu.cell);
                })
              }
            />
            <div style={{ height: 1, background: "#ECECEC", margin: "4px 0" }} />
            <MenuItem
              label="Delete row"
              onClick={() => run(() => deleteRow(menu.table, menu.cell))}
            />
            <MenuItem
              label="Delete column"
              onClick={() => run(() => deleteColumn(menu.table, menu.cell))}
            />
            <MenuItem label="Delete table" onClick={() => run(() => deleteTable(menu.table))} />
          </div>
        </>,
        document.body
      )
    : null;

  const overlayElement =
    handles.length > 0
      ? createPortal(
          // High z-index so the strips sit above the editor content (which can be
          // inside a positioned/stacking-context ancestor); below the toolbar
          // panels (9999) and the context menu (10001).
          <div style={{ position: "fixed", inset: 0, zIndex: 9000, pointerEvents: "none" }}>
            {handles.map((h, i) => (
              <div
                key={i}
                onMouseDown={(e) => startDrag(h, e)}
                title={h.orient === "col" ? "Drag to resize column" : "Drag to resize row"}
                style={{
                  position: "fixed",
                  left: h.left,
                  top: h.top,
                  width: h.width,
                  height: h.height,
                  cursor: h.orient === "col" ? "col-resize" : "row-resize",
                  pointerEvents: "auto",
                  background: "transparent",
                  // Centre a faint guide line inside the grip so the boundary is
                  // discoverable; it brightens on hover.
                  backgroundImage:
                    h.orient === "col"
                      ? "linear-gradient(to right, transparent 45%, rgba(0,120,212,0.35) 45%, rgba(0,120,212,0.35) 55%, transparent 55%)"
                      : "linear-gradient(to bottom, transparent 45%, rgba(0,120,212,0.35) 45%, rgba(0,120,212,0.35) 55%, transparent 55%)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundImage =
                    h.orient === "col"
                      ? "linear-gradient(to right, transparent 35%, rgba(0,120,212,0.9) 35%, rgba(0,120,212,0.9) 65%, transparent 65%)"
                      : "linear-gradient(to bottom, transparent 35%, rgba(0,120,212,0.9) 35%, rgba(0,120,212,0.9) 65%, transparent 65%)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundImage =
                    h.orient === "col"
                      ? "linear-gradient(to right, transparent 45%, rgba(0,120,212,0.35) 45%, rgba(0,120,212,0.35) 55%, transparent 55%)"
                      : "linear-gradient(to bottom, transparent 45%, rgba(0,120,212,0.35) 45%, rgba(0,120,212,0.35) 55%, transparent 55%)";
                }}
              />
            ))}
          </div>,
          document.body
        )
      : null;

  return { onContextMenu, menuElement, overlayElement };
}
