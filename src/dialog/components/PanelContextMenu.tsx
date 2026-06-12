// src/dialog/components/PanelContextMenu.tsx

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

export interface PanelMenuItem {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}
export interface PanelMenuSeparator {
  isSep: true;
}
export type PanelMenuEntry = PanelMenuItem | PanelMenuSeparator;

interface PanelContextMenuProps {
  x: number;
  y: number;
  items: PanelMenuEntry[];
  onClose: () => void;
  width?: number;
}

export function PanelContextMenu({ x, y, items, onClose, width }: PanelContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: x, top: y });

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDown, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [onClose]);

  // Measure the menu after first paint and clamp into the viewport. Flips
  // upward / leftward when the menu would otherwise overflow.
  useLayoutEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const margin = 8;
    let left = x;
    let top = y;
    if (left + rect.width + margin > window.innerWidth) {
      left = Math.max(margin, window.innerWidth - rect.width - margin);
    }
    if (top + rect.height + margin > window.innerHeight) {
      top = Math.max(margin, y - rect.height);
    }
    if (left !== pos.left || top !== pos.top) setPos({ left, top });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [x, y, items]);

  const menuW = width ?? 220;
  const { left, top } = pos;

  return (
    <div
      ref={ref}
      role="menu"
      style={{
        position: "fixed",
        left,
        top,
        width: menuW,
        background: "#FFFFFF",
        border: "1px solid #D0D0D0",
        borderRadius: 4,
        boxShadow: "0 4px 12px rgba(0,0,0,0.14)",
        zIndex: 9999,
        padding: "4px 0",
        fontFamily: "'Inter','Segoe UI',sans-serif",
      }}
    >
      {items.map((item, i) => {
        if ("isSep" in item) {
          return (
            <div
              key={i}
              style={{ height: 1, background: "#E8E8E8", margin: "3px 0" }}
            />
          );
        }
        return (
          <button
            key={i}
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              if (!item.disabled) {
                item.onClick();
                onClose();
              }
            }}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "6px 14px",
              fontSize: "12px",
              fontFamily: "inherit",
              background: "transparent",
              border: "none",
              color: item.disabled ? "#AAAAAA" : "#1B1B1B",
              cursor: item.disabled ? "default" : "pointer",
              lineHeight: "18px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            onMouseEnter={(e) => {
              if (!item.disabled)
                (e.currentTarget as HTMLButtonElement).style.background = "#EBF3FC";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
