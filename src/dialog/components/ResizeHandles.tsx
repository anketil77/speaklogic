// src/dialog/components/ResizeHandles.tsx
// Reusable 8-direction resize handles for portal dialogs (4 edges + 4 corners).
//
// Drop inside any `position: fixed`/`absolute` dialog box (it renders `position: absolute`
// children, so the dialog must be the containing block). Pairs with `useDraggable`: pass its
// `pos` + `setPos` so resizing from the top/left edges re-anchors the dialog position
// correctly (the opposite edge stays put).
//
// Usage:
//   const { pos, setPos, onHeaderMouseDown } = useDraggable({ ... });
//   const [size, setSize] = useState({ width: 760, height: 600 });
//   ...
//   <div style={{ position: "fixed", left: pos.x, top: pos.y, width: size.width, height: size.height }}>
//     ...dialog content...
//     <ResizeHandles pos={pos} setPos={setPos} size={size} setSize={setSize}
//                    minWidth={500} minHeight={360} />
//   </div>

import React, { useCallback } from "react";

export type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

interface Pos { x: number; y: number; }
interface Size { width: number; height: number; }

interface Props {
  pos: Pos;
  setPos: (p: Pos) => void;
  size: Size;
  setSize: (s: Size) => void;
  minWidth?: number;
  minHeight?: number;
  /** Defaults to viewport width. */
  maxWidth?: number;
  /** Defaults to viewport height. */
  maxHeight?: number;
  /** Edge strip thickness in px. */
  edge?: number;
  /** Corner square size in px. */
  corner?: number;
  /** Show the diagonal grip dots in the bottom-right corner. */
  showGrip?: boolean;
}

const CURSORS: Record<ResizeDir, string> = {
  n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize",
  ne: "nesw-resize", sw: "nesw-resize", nw: "nwse-resize", se: "nwse-resize",
};

export function ResizeHandles({
  pos, setPos, size, setSize,
  minWidth = 360, minHeight = 280,
  maxWidth, maxHeight,
  edge = 6, corner = 14,
  showGrip = true,
}: Props) {
  const start = useCallback(
    (dir: ResizeDir) => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const sMouseX = e.clientX;
      const sMouseY = e.clientY;
      const sx = pos.x, sy = pos.y, sw = size.width, sh = size.height;
      const right = sx + sw;
      const bottom = sy + sh;
      const maxW = maxWidth ?? document.documentElement.clientWidth;
      const maxH = maxHeight ?? document.documentElement.clientHeight;

      const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - sMouseX;
        const dy = ev.clientY - sMouseY;
        let w = sw, h = sh, x = sx, y = sy;

        if (dir.includes("e")) w = sw + dx;
        if (dir.includes("w")) w = sw - dx;
        if (dir.includes("s")) h = sh + dy;
        if (dir.includes("n")) h = sh - dy;

        w = Math.max(minWidth, Math.min(w, maxW));
        h = Math.max(minHeight, Math.min(h, maxH));

        // Re-anchor the opposite edge when dragging from west/north.
        if (dir.includes("w")) x = right - w;
        if (dir.includes("n")) y = bottom - h;
        x = Math.max(0, x);
        y = Math.max(0, y);

        setSize({ width: w, height: h });
        setPos({ x, y });
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [pos.x, pos.y, size.width, size.height, minWidth, minHeight, maxWidth, maxHeight, setPos, setSize]
  );

  const base: React.CSSProperties = { position: "absolute", zIndex: 50 };
  const cnr: React.CSSProperties = { ...base, width: corner, height: corner, zIndex: 51 };

  return (
    <>
      {/* Edges — inset by `corner` at each end so they never overlap the corner squares */}
      <div onMouseDown={start("n")} style={{ ...base, top: 0,    left: corner, right: corner, height: edge, cursor: CURSORS.n }} />
      <div onMouseDown={start("s")} style={{ ...base, bottom: 0, left: corner, right: corner, height: edge, cursor: CURSORS.s }} />
      <div onMouseDown={start("e")} style={{ ...base, right: 0,  top: corner,  bottom: corner, width: edge, cursor: CURSORS.e }} />
      <div onMouseDown={start("w")} style={{ ...base, left: 0,   top: corner,  bottom: corner, width: edge, cursor: CURSORS.w }} />

      {/* Corners — above edges */}
      <div onMouseDown={start("nw")} style={{ ...cnr, top: 0,    left: 0,  cursor: CURSORS.nw }} />
      <div onMouseDown={start("ne")} style={{ ...cnr, top: 0,    right: 0, cursor: CURSORS.ne }} />
      <div onMouseDown={start("sw")} style={{ ...cnr, bottom: 0, left: 0,  cursor: CURSORS.sw }} />
      <div onMouseDown={start("se")} style={{ ...cnr, bottom: 0, right: 0, cursor: CURSORS.se }}>
        {showGrip && (
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ position: "absolute", bottom: 3, right: 3 }}>
            <circle cx="9" cy="9" r="1.2" fill="#9CA3AF" />
            <circle cx="5.5" cy="9" r="1.2" fill="#9CA3AF" />
            <circle cx="9" cy="5.5" r="1.2" fill="#9CA3AF" />
            <circle cx="5.5" cy="5.5" r="1.2" fill="#C4CAC7" />
          </svg>
        )}
      </div>
    </>
  );
}
