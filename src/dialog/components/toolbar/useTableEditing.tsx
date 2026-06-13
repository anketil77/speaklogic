// src/dialog/components/toolbar/useTableEditing.tsx
//
// Table editing for the shared RichEditor:
//  • a compact icon-only right-click context menu (insert/delete rows & cols,
//    merge/split, delete table),
//  • rectangular cell selection by dragging across cells (drives Merge) — drawn
//    as an overlay so it NEVER mutates the editor's innerHTML / saved value,
//  • draggable column/row resize handles.
//
// Self-contained — RichEditor mounts the returned elements and wires
// `onContextMenu` + `onMouseDown`. Handlers only act inside a table, so they
// never collide with the editor's normal text editing or other menus.

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Cell,
  Grid,
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
import {
  DeleteColIcon,
  DeleteRowIcon,
  DeleteTableIcon,
  InsertColLeftIcon,
  InsertColRightIcon,
  InsertRowAboveIcon,
  InsertRowBelowIcon,
  MergeCellsIcon,
  SplitCellIcon,
} from "@/dialog/components/toolbar/tableIcons";

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

interface SelRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

// ── Rectangular cell-selection geometry ──────────────────────────────────────

/** Logical bounds (rows/cols a cell occupies) within a grid, or null. */
function cellBounds(
  grid: Grid,
  cell: Cell
): { r0: number; c0: number; r1: number; c1: number } | null {
  let r0 = Infinity,
    c0 = Infinity,
    r1 = -1,
    c1 = -1;
  for (let r = 0; r < grid.matrix.length; r++) {
    for (let c = 0; c < grid.matrix[r].length; c++) {
      const slot = grid.matrix[r][c];
      if (slot && slot.cell === cell) {
        r0 = Math.min(r0, r);
        c0 = Math.min(c0, c);
        r1 = Math.max(r1, r);
        c1 = Math.max(c1, c);
      }
    }
  }
  return r1 < 0 ? null : { r0, c0, r1, c1 };
}

/**
 * Every cell inside the rectangle spanned by anchor↔focus, expanded so that any
 * merged cell straddling the edge is fully included (keeps the block a clean
 * rectangle that `mergeCells` will accept).
 */
function rectCells(grid: Grid, anchor: Cell, focus: Cell): Cell[] {
  const a = cellBounds(grid, anchor);
  const b = cellBounds(grid, focus);
  if (!a || !b) return [];
  let minR = Math.min(a.r0, b.r0),
    maxR = Math.max(a.r1, b.r1),
    minC = Math.min(a.c0, b.c0),
    maxC = Math.max(a.c1, b.c1);

  let changed = true;
  while (changed) {
    changed = false;
    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        const slot = grid.matrix[r]?.[c];
        if (!slot) continue;
        const bb = cellBounds(grid, slot.cell);
        if (!bb) continue;
        if (bb.r0 < minR) ((minR = bb.r0), (changed = true));
        if (bb.r1 > maxR) ((maxR = bb.r1), (changed = true));
        if (bb.c0 < minC) ((minC = bb.c0), (changed = true));
        if (bb.c1 > maxC) ((maxC = bb.c1), (changed = true));
      }
    }
  }

  const seen = new Set<Cell>();
  const out: Cell[] = [];
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      const slot = grid.matrix[r]?.[c];
      if (slot && !seen.has(slot.cell)) {
        seen.add(slot.cell);
        out.push(slot.cell);
      }
    }
  }
  return out;
}

// ── Context-menu icon button ─────────────────────────────────────────────────

function IconBtn({
  title,
  icon,
  danger,
  disabled,
  onClick,
}: {
  title: string;
  icon: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      style={{
        width: 28,
        height: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        border: "none",
        borderRadius: 4,
        background: "transparent",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.35 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled)
          (e.currentTarget as HTMLButtonElement).style.background = danger ? "#FDECEA" : "#F0F0F0";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
      // NOTE: do NOT preventDefault on mousedown here — in WebView2 (Word
      // desktop) that suppresses the button's click. The action only needs
      // `menu.cell`/`menu.table`/`menu.selected`, which were already captured
      // at right-click time, so losing the live editor selection is harmless.
      onClick={onClick}
    >
      {icon}
    </button>
  );
}

function MenuSep() {
  return (
    <div
      style={{ width: 1, height: 22, background: "#E4E4E4", margin: "0 3px", flex: "0 0 auto" }}
    />
  );
}

// Thickness (px) of the draggable strip centred on each grid line.
const GRIP = 9;

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
  const [selCells, setSelCells] = useState<Cell[]>([]);
  const dragRef = useRef<{
    orient: "col" | "row";
    table: HTMLTableElement;
    index: number;
    lastX: number;
    lastY: number;
  } | null>(null);
  // Live mirror of the rectangular cell selection so a right-click (which fires
  // before React re-renders) reads the latest cells synchronously.
  const selCellsRef = useRef<Cell[]>([]);
  // Active cell-drag (rectangular selection) state.
  const cellDragRef = useRef<{ anchor: Cell; table: HTMLTableElement; moved: boolean } | null>(
    null
  );
  const menuRef = useRef<HTMLDivElement>(null);

  const setSelection = useCallback((cells: Cell[]) => {
    selCellsRef.current = cells;
    setSelCells(cells);
  }, []);

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
      raf = requestAnimationFrame(() => {
        refreshHandles();
        // Re-render selection overlay too (its rects are read live from the DOM).
        if (selCellsRef.current.length) setSelCells((c) => [...c]);
      });
    };
    schedule();
    root.addEventListener("input", schedule);
    // Re-measure as the pointer moves inside the editor so handles are always
    // fresh by the time the user reaches a column/row boundary (covers the case
    // where the editor was measured while its tab/container was still hidden).
    root.addEventListener("mousemove", schedule);
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

  // ── Rectangular cell selection (drag across cells) ──────────────────────────
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return; // ignore right/middle — right-click keeps selection
      const root = editorRef.current;
      if (!root) return;
      const cell = getCell(e.target as Node, root);
      const table = cell && getTable(cell, root);
      // Any fresh left-press clears a previous block selection.
      if (selCellsRef.current.length) setSelection([]);
      if (!cell || !table) return; // not in a table — normal editing
      cellDragRef.current = { anchor: cell, table, moved: false };

      const onMove = (ev: MouseEvent) => {
        const d = cellDragRef.current;
        if (!d) return;
        const overEl = document.elementFromPoint(ev.clientX, ev.clientY);
        const overCell = overEl && getCell(overEl as Node, root);
        if (!overCell || getTable(overCell, root) !== d.table) return;
        if (overCell === d.anchor && !d.moved) return; // still in the anchor cell — let text-select run
        // Cross-cell drag → block selection mode.
        if (!d.moved) {
          d.moved = true;
          root.style.userSelect = "none";
          window.getSelection()?.removeAllRanges();
        }
        const grid = buildGrid(d.table);
        const cells = rectCells(grid, d.anchor, overCell);
        if (cells.length <= 1) {
          if (selCellsRef.current.length) setSelection([]);
        } else {
          setSelection(cells);
        }
      };
      const onUp = () => {
        const root2 = editorRef.current;
        if (root2) root2.style.userSelect = "";
        cellDragRef.current = null;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [editorRef, setSelection]
  );

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

      // Prefer the rectangular cell selection; fall back to a native text
      // selection that happens to span ≥2 cells.
      let selected = selCellsRef.current.filter((c) => table.contains(c));
      if (selected.length < 2) {
        const native = getSelectedCells(root);
        if (native.length >= 2) selected = native;
      }
      setMenu({ x: e.clientX, y: e.clientY, cell, table, selected });
    },
    [editorRef]
  );

  const closeMenu = useCallback(() => setMenu(null), []);

  // Close on outside click / Escape (capture phase, like PanelContextMenu) —
  // no full-screen backdrop, which can interfere with the menu's own clicks.
  useEffect(() => {
    if (!menu) return undefined;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) closeMenu();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    document.addEventListener("mousedown", onDown, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [menu, closeMenu]);

  const run = useCallback(
    (fn: () => void) => {
      fn();
      fireInput();
      setMenu(null);
      setSelection([]);
      requestAnimationFrame(refreshHandles);
    },
    [fireInput, refreshHandles, setSelection]
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

  // Compact icon-only menu: ~one row. Width estimate for viewport clamping.
  const MENU_W = 300;
  const MENU_H = 46;

  const menuElement = menu
    ? createPortal(
        <div
          ref={menuRef}
          role="menu"
          style={{
            position: "fixed",
            left: Math.max(4, Math.min(menu.x, window.innerWidth - MENU_W)),
            top: Math.max(4, Math.min(menu.y, window.innerHeight - MENU_H)),
            zIndex: 10001,
            display: "flex",
            alignItems: "center",
            gap: 1,
            background: "#FFFFFF",
            border: "1px solid #E0E0E0",
            borderRadius: 6,
            boxShadow: "0 4px 16px rgba(0,0,0,0.14)",
            padding: "5px 6px",
            fontFamily: "'Inter','Segoe UI',sans-serif",
          }}
        >
          <IconBtn
            title="Insert row above"
            icon={<InsertRowAboveIcon />}
            onClick={() => run(() => insertRow(menu.table, menu.cell, "above"))}
          />
          <IconBtn
            title="Insert row below"
            icon={<InsertRowBelowIcon />}
            onClick={() => run(() => insertRow(menu.table, menu.cell, "below"))}
          />
          <IconBtn
            title="Insert column left"
            icon={<InsertColLeftIcon />}
            onClick={() => run(() => insertColumn(menu.table, menu.cell, "left"))}
          />
          <IconBtn
            title="Insert column right"
            icon={<InsertColRightIcon />}
            onClick={() => run(() => insertColumn(menu.table, menu.cell, "right"))}
          />
          <MenuSep />
          <IconBtn
            title={currentCanMerge ? "Merge cells" : "Select 2+ cells to merge"}
            icon={<MergeCellsIcon />}
            disabled={!currentCanMerge}
            onClick={() => run(() => mergeCells(menu.table, menu.selected))}
          />
          <IconBtn
            title={currentCanSplit ? "Split cell" : "Split a merged cell"}
            icon={<SplitCellIcon />}
            disabled={!currentCanSplit}
            onClick={() => run(() => splitCell(menu.table, menu.cell))}
          />
          <MenuSep />
          <IconBtn
            title="Delete row"
            icon={<DeleteRowIcon />}
            onClick={() => run(() => deleteRow(menu.table, menu.cell))}
          />
          <IconBtn
            title="Delete column"
            icon={<DeleteColIcon />}
            onClick={() => run(() => deleteColumn(menu.table, menu.cell))}
          />
          <IconBtn
            title="Delete table"
            icon={<DeleteTableIcon />}
            danger
            onClick={() => run(() => deleteTable(menu.table))}
          />
        </div>,
        document.body
      )
    : null;

  // Selection highlight overlay (rects read live from the DOM each render).
  const selRects: SelRect[] = selCells.map((c) => {
    const r = c.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  });
  const selectionElement =
    selRects.length > 0
      ? createPortal(
          <div style={{ position: "fixed", inset: 0, zIndex: 8990, pointerEvents: "none" }}>
            {selRects.map((s, i) => (
              <div
                key={i}
                style={{
                  position: "fixed",
                  left: s.left,
                  top: s.top,
                  width: s.width,
                  height: s.height,
                  background: "rgba(0,120,212,0.18)",
                  outline: "1px solid rgba(0,120,212,0.55)",
                  outlineOffset: -1,
                  boxSizing: "border-box",
                }}
              />
            ))}
          </div>,
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
                  // Invisible by default — the resize cursor on hover is the
                  // discoverability cue. A blue guide line shows only while the
                  // pointer is over the boundary, so the table stays clean.
                  background: "transparent",
                  backgroundImage: "none",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundImage =
                    h.orient === "col"
                      ? "linear-gradient(to right, transparent 35%, rgba(0,120,212,0.9) 35%, rgba(0,120,212,0.9) 65%, transparent 65%)"
                      : "linear-gradient(to bottom, transparent 35%, rgba(0,120,212,0.9) 35%, rgba(0,120,212,0.9) 65%, transparent 65%)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundImage = "none";
                }}
              />
            ))}
          </div>,
          document.body
        )
      : null;

  return { onContextMenu, onMouseDown, menuElement, overlayElement, selectionElement };
}
