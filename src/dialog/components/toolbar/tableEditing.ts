// src/dialog/components/toolbar/tableEditing.ts
//
// Pure DOM helpers for editing tables inside a contentEditable RichEditor.
// execCommand has no table commands, so every structural operation is done by
// hand here. Column operations and merge build a logical grid (a matrix that
// accounts for colspan/rowspan) so they stay correct even on tables that
// already contain merged cells.
//
// All helpers operate on live DOM nodes; callers fire the editor's "input"
// event afterwards so React picks up the new innerHTML.

/* global HTMLTableCellElement HTMLTableElement HTMLTableRowElement HTMLTableColElement Element Node document window */

export type Cell = HTMLTableCellElement; // <td> or <th>

// ── Tree lookups ──────────────────────────────────────────────────────────────

export function closestWithin<T extends Element>(
  node: Node | null,
  selector: string,
  root: Element
): T | null {
  let el: Node | null = node;
  while (el && el !== root) {
    if (el.nodeType === Node.ELEMENT_NODE && (el as Element).matches(selector)) {
      return el as T;
    }
    el = el.parentNode;
  }
  return null;
}

export function getCell(node: Node | null, root: Element): Cell | null {
  return closestWithin<Cell>(node, "td,th", root);
}

export function getTable(node: Node | null, root: Element): HTMLTableElement | null {
  return closestWithin<HTMLTableElement>(node, "table", root);
}

// ── Logical grid model ────────────────────────────────────────────────────────
//
// Browsers expose rows/cells in DOM order, but a cell with rowspan/colspan
// occupies several logical (row, col) slots. We expand spans into a matrix so
// "column N" means the same thing visually across every row.

export interface GridSlot {
  cell: Cell;
  /** True for the slot that actually owns the cell (its top-left corner). */
  isAnchor: boolean;
}

export interface Grid {
  rows: HTMLTableRowElement[];
  /** matrix[r][c] → which cell covers logical position (r, c). */
  matrix: GridSlot[][];
  cols: number;
}

function getBodyRows(table: HTMLTableElement): HTMLTableRowElement[] {
  // Flatten thead/tbody/tfoot into a single visual row list.
  return Array.from(table.querySelectorAll("tr")).filter(
    (tr) => getTable(tr, table) === table // skip rows of nested tables
  );
}

export function buildGrid(table: HTMLTableElement): Grid {
  const rows = getBodyRows(table);
  const matrix: GridSlot[][] = rows.map(() => []);

  for (let r = 0; r < rows.length; r++) {
    let c = 0;
    const cells = Array.from(rows[r].children).filter(
      (n) => n.tagName === "TD" || n.tagName === "TH"
    ) as Cell[];
    for (const cell of cells) {
      // Skip columns already filled by a rowspan from an earlier row.
      while (matrix[r][c]) c++;
      const colSpan = Math.max(1, cell.colSpan || 1);
      const rowSpan = Math.max(1, cell.rowSpan || 1);
      for (let dr = 0; dr < rowSpan; dr++) {
        for (let dc = 0; dc < colSpan; dc++) {
          const rr = r + dr;
          if (rr >= matrix.length) continue;
          matrix[rr][c + dc] = { cell, isAnchor: dr === 0 && dc === 0 };
        }
      }
      c += colSpan;
    }
  }

  const cols = matrix.reduce((m, row) => Math.max(m, row.length), 0);
  return { rows, matrix, cols };
}

/** Logical column indices a cell spans, on the row it anchors. */
function cellColRange(grid: Grid, cell: Cell): { start: number; end: number; row: number } | null {
  for (let r = 0; r < grid.matrix.length; r++) {
    for (let c = 0; c < grid.matrix[r].length; c++) {
      const slot = grid.matrix[r][c];
      if (slot && slot.cell === cell && slot.isAnchor) {
        return { start: c, end: c + Math.max(1, cell.colSpan || 1) - 1, row: r };
      }
    }
  }
  return null;
}

function newCellLike(ref: Cell): Cell {
  const cell = document.createElement(ref.tagName.toLowerCase() === "th" ? "th" : "td") as Cell;
  // Carry the inline border/padding so a fresh cell matches its neighbours even
  // outside the .rte-field / .sl-html-content classes (e.g. once inserted to Word).
  cell.setAttribute("style", "border:1px solid #C7C7C7;padding:6px 9px;vertical-align:top;");
  cell.innerHTML = "<br>";
  return cell;
}

// ── Row operations ─────────────────────────────────────────────────────────────

export function insertRow(table: HTMLTableElement, anchor: Cell, where: "above" | "below"): void {
  const grid = buildGrid(table);
  const range = cellColRange(grid, anchor);
  if (!range) return;
  // Logical row index where the new row lands (existing rows at/after shift down).
  const at = where === "above" ? range.row : range.row + 1;

  const tr = document.createElement("tr");
  const widened = new Set<Cell>();
  for (let c = 0; c < grid.cols; c++) {
    const upper = at > 0 ? grid.matrix[at - 1]?.[c] : undefined;
    const lower = grid.matrix[at]?.[c];
    // A cell that spans vertically across the new boundary just grows by one row.
    if (upper && lower && upper.cell === lower.cell) {
      if (!widened.has(upper.cell)) {
        upper.cell.rowSpan = Math.max(1, upper.cell.rowSpan || 1) + 1;
        widened.add(upper.cell);
      }
      continue;
    }
    tr.appendChild(newCellLike(lower?.cell ?? upper?.cell ?? anchor));
  }

  const refRow = grid.rows[at];
  if (refRow) refRow.parentNode?.insertBefore(tr, refRow);
  else {
    const last = grid.rows[grid.rows.length - 1];
    last.parentNode?.appendChild(tr);
  }
}

export function deleteRow(table: HTMLTableElement, anchor: Cell): void {
  const grid = buildGrid(table);
  const range = cellColRange(grid, anchor);
  if (!range || grid.rows.length <= 1) return;
  const r = range.row;

  // Shrink cells that span into this row from above; relocate cells anchored
  // here that span downward so their content/span survive.
  const handled = new Set<Cell>();
  for (let c = 0; c < grid.cols; c++) {
    const slot = grid.matrix[r][c];
    if (!slot || handled.has(slot.cell)) continue;
    handled.add(slot.cell);
    const span = Math.max(1, slot.cell.rowSpan || 1);
    if (span > 1) {
      slot.cell.rowSpan = span - 1;
      if (slot.isAnchor && grid.rows[r + 1]) {
        // Move the anchored cell down into the next row so it isn't lost.
        const next = grid.rows[r + 1];
        const cr = cellColRange(grid, slot.cell)!;
        let ref: Cell | null = null;
        for (let cc = cr.start; cc < grid.matrix[r + 1].length; cc++) {
          const s = grid.matrix[r + 1][cc];
          if (s && s.isAnchor && s.cell !== slot.cell) {
            ref = s.cell;
            break;
          }
        }
        if (ref) next.insertBefore(slot.cell, ref);
        else next.appendChild(slot.cell);
      }
    }
  }
  grid.rows[r].remove();
}

// ── Column operations ──────────────────────────────────────────────────────────

export function insertColumn(table: HTMLTableElement, anchor: Cell, where: "left" | "right"): void {
  const grid = buildGrid(table);
  const range = cellColRange(grid, anchor);
  if (!range) return;
  const at = where === "left" ? range.start : range.end + 1; // new logical column index
  const widened = new Set<Cell>();

  for (let r = 0; r < grid.rows.length; r++) {
    const row = grid.rows[r];
    const slotAt = grid.matrix[r][at];
    const slotLeft = at > 0 ? grid.matrix[r][at - 1] : undefined;

    // A cell spanning horizontally across the boundary grows by one column.
    if (slotLeft && slotAt && slotLeft.cell === slotAt.cell) {
      if (!widened.has(slotLeft.cell)) {
        slotLeft.cell.colSpan = Math.max(1, slotLeft.cell.colSpan || 1) + 1;
        widened.add(slotLeft.cell);
      }
      continue;
    }

    // Insert before the first cell anchored in this row at logical column >= at.
    let ref: Cell | null = null;
    for (let c = at; c < grid.matrix[r].length; c++) {
      const s = grid.matrix[r][c];
      if (s && s.isAnchor) {
        ref = s.cell;
        break;
      }
    }
    const fresh = newCellLike(slotAt?.cell ?? slotLeft?.cell ?? anchor);
    if (ref) ref.parentNode?.insertBefore(fresh, ref);
    else row.appendChild(fresh);
  }
}

export function deleteColumn(table: HTMLTableElement, anchor: Cell): void {
  const grid = buildGrid(table);
  const range = cellColRange(grid, anchor);
  const span = range ? range.end - range.start + 1 : 0;
  if (!range || grid.cols <= span) return; // never delete the last remaining column

  const seen = new Set<Cell>();
  for (let r = 0; r < grid.rows.length; r++) {
    for (let c = range.start; c <= range.end; c++) {
      const slot = grid.matrix[r][c];
      if (!slot || seen.has(slot.cell)) continue;
      seen.add(slot.cell);
      const cr = cellColRange(grid, slot.cell)!;
      const overlap = Math.min(cr.end, range.end) - Math.max(cr.start, range.start) + 1;
      const cspan = Math.max(1, slot.cell.colSpan || 1);
      if (overlap >= cspan) slot.cell.remove();
      else slot.cell.colSpan = cspan - overlap;
    }
  }

  for (const row of grid.rows) {
    if (!row.querySelector("td,th")) row.remove();
  }
}

export function deleteTable(table: HTMLTableElement): void {
  table.remove();
}

// ── Selection / merge / split ──────────────────────────────────────────────────

export function getSelectedCells(root: Element): Cell[] {
  const sel = window.getSelection();
  // sel is a DOM Selection, not an Office proxy — the office-addins sync/load
  // rules misfire on the rangeCount read here.
  // eslint-disable-next-line office-addins/call-sync-before-read, office-addins/load-object-before-read
  if (!sel || sel.rangeCount === 0) return [];
  const range = sel.getRangeAt(0);
  const table = getTable(range.commonAncestorContainer, root);
  if (!table) return [];
  const cells = Array.from(table.querySelectorAll<Cell>("td,th")).filter(
    (c) => getTable(c, table) === table
  );
  return cells.filter((c) => range.intersectsNode(c));
}

/**
 * Merge a rectangular block of selected cells into the top-left one.
 * Returns false if the selection is not a clean rectangle (we refuse rather
 * than produce a broken table).
 */
export function mergeCells(table: HTMLTableElement, cells: Cell[]): boolean {
  if (cells.length < 2) return false;
  const grid = buildGrid(table);

  let minR = Infinity,
    minC = Infinity,
    maxR = -1,
    maxC = -1;
  const set = new Set(cells);
  for (let r = 0; r < grid.matrix.length; r++) {
    for (let c = 0; c < grid.matrix[r].length; c++) {
      const slot = grid.matrix[r][c];
      if (slot && set.has(slot.cell)) {
        minR = Math.min(minR, r);
        minC = Math.min(minC, c);
        maxR = Math.max(maxR, r);
        maxC = Math.max(maxC, c);
      }
    }
  }
  if (maxR < 0) return false;

  // Every slot inside the bounding rectangle must belong to a selected cell,
  // otherwise the selection is L-shaped / non-rectangular.
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      const slot = grid.matrix[r][c];
      if (!slot || !set.has(slot.cell)) return false;
    }
  }

  const anchor = grid.matrix[minR][minC].cell;
  const merged = new Set<Cell>();
  const parts: string[] = [];
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      const cell = grid.matrix[r][c].cell;
      if (merged.has(cell)) continue;
      merged.add(cell);
      if (cell !== anchor) {
        const html = cell.innerHTML.trim();
        if (html && html !== "<br>") parts.push(html);
        cell.remove();
      }
    }
  }
  if (parts.length) {
    const anchorHtml = anchor.innerHTML.trim();
    anchor.innerHTML =
      (anchorHtml && anchorHtml !== "<br>" ? anchorHtml + " " : "") + parts.join(" ");
  }
  anchor.colSpan = maxC - minC + 1;
  anchor.rowSpan = maxR - minR + 1;
  return true;
}

/** Expand a merged cell back into individual 1×1 cells. */
export function splitCell(table: HTMLTableElement, cell: Cell): boolean {
  const colSpan = Math.max(1, cell.colSpan || 1);
  const rowSpan = Math.max(1, cell.rowSpan || 1);
  if (colSpan === 1 && rowSpan === 1) return false;

  const grid = buildGrid(table);
  const range = cellColRange(grid, cell);
  if (!range) return false;
  const startRow = range.row;
  const startCol = range.start;

  cell.colSpan = 1;
  cell.rowSpan = 1;

  // Fill the freed slots with fresh cells, inserting each at the right DOM spot.
  for (let dr = 0; dr < rowSpan; dr++) {
    const r = startRow + dr;
    if (r >= grid.rows.length) break;
    for (let dc = 0; dc < colSpan; dc++) {
      if (dr === 0 && dc === 0) continue; // the anchor stays
      const c = startCol + dc;
      const fresh = newCellLike(cell);
      // Find the next anchored cell to the right of column c on row r to insert before.
      let ref: Cell | null = null;
      for (let cc = c; cc < grid.matrix[r].length; cc++) {
        const slot = grid.matrix[r][cc];
        if (slot && slot.isAnchor && slot.cell !== cell) {
          ref = slot.cell;
          break;
        }
      }
      if (ref) ref.parentNode?.insertBefore(fresh, ref);
      else grid.rows[r].appendChild(fresh);
    }
  }
  return true;
}

// ── Column widths (drag resize) ────────────────────────────────────────────────
//
// With table-layout:fixed, a <colgroup> of <col> widths controls column sizes.
// We synthesize one on first resize, measuring current widths from the DOM.

export function ensureColgroup(table: HTMLTableElement): HTMLTableColElement[] {
  const grid = buildGrid(table);
  let colgroup = table.querySelector("colgroup");
  if (colgroup && colgroup.children.length === grid.cols) {
    return Array.from(colgroup.querySelectorAll("col"));
  }
  colgroup?.remove();
  colgroup = document.createElement("colgroup");

  // Measure current pixel widths from the first row's anchored cells.
  const widths: number[] = new Array(grid.cols).fill(0);
  const firstRow = grid.matrix[0] ?? [];
  for (let c = 0; c < grid.cols; c++) {
    const slot = firstRow[c];
    widths[c] = slot
      ? slot.cell.getBoundingClientRect().width / Math.max(1, slot.cell.colSpan || 1)
      : 0;
  }
  const total = widths.reduce((a, b) => a + b, 0) || 1;

  const cols: HTMLTableColElement[] = [];
  for (let c = 0; c < grid.cols; c++) {
    const col = document.createElement("col");
    col.style.width = `${((widths[c] / total) * 100).toFixed(3)}%`;
    colgroup.appendChild(col);
    cols.push(col);
  }
  table.insertBefore(colgroup, table.firstChild);
  return cols;
}

/** Resize the boundary between column `index` and `index+1` by `deltaPx`. */
export function resizeColumnBoundary(
  table: HTMLTableElement,
  index: number,
  deltaPx: number
): void {
  const cols = ensureColgroup(table);
  if (index < 0 || index + 1 >= cols.length) return;

  const tableWidth = table.getBoundingClientRect().width || 1;
  const deltaPct = (deltaPx / tableWidth) * 100;

  const leftPct = parseFloat(cols[index].style.width) || 0;
  const rightPct = parseFloat(cols[index + 1].style.width) || 0;
  const minPct = (24 / tableWidth) * 100; // don't let a column collapse below ~24px

  let nextLeft = leftPct + deltaPct;
  let nextRight = rightPct - deltaPct;
  if (nextLeft < minPct) {
    nextRight -= minPct - nextLeft;
    nextLeft = minPct;
  }
  if (nextRight < minPct) {
    nextLeft -= minPct - nextRight;
    nextRight = minPct;
  }

  cols[index].style.width = `${nextLeft.toFixed(3)}%`;
  cols[index + 1].style.width = `${nextRight.toFixed(3)}%`;
}

/** Resize a single row's height by `deltaPx` (the boundary below logical row `index`). */
export function resizeRowHeight(table: HTMLTableElement, index: number, deltaPx: number): void {
  const grid = buildGrid(table);
  const row = grid.rows[index];
  if (!row) return;
  const current = row.getBoundingClientRect().height;
  const next = Math.max(20, current + deltaPx);
  row.style.height = `${Math.round(next)}px`;
}
