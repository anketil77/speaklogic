// src/dialog/hooks/useDraggable.ts

import { useRef, useState, useCallback } from "react";

export function useDraggable({ initialX = 0, initialY = 0 } = {}) {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const dragRef = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);

  const onHeaderMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
    const onMove = (me: MouseEvent) => {
      if (!dragRef.current) return;
      setPos({
        x: dragRef.current.px + (me.clientX - dragRef.current.mx),
        y: dragRef.current.py + (me.clientY - dragRef.current.my),
      });
    };
    const onUp = () => {
      dragRef.current = null;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [pos]);

  return { pos, onHeaderMouseDown };
}
