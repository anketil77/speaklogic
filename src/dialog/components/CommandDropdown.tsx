// src/dialog/components/CommandDropdown.tsx
import React, { useRef, useEffect, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDownRegular } from "@fluentui/react-icons";
import { colors } from "@/styles/tokens";

export interface CmdDropdownItem {
  label: string;
  iconSrc?: string;
  enabled: boolean;
  onClick?: () => void;
}

export interface CmdDropdownDef {
  id: string;
  iconSrc?: string;
  iconElement?: React.ReactNode;
  title: string;
  items: CmdDropdownItem[];
}

interface Props {
  def: CmdDropdownDef;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}

// Panel is portaled to document.body with position:fixed so it can never be
// clipped by an ancestor's overflow. The command bar uses overflowX:auto (for
// horizontal scroll on narrow dialogs) which the CSS spec promotes to
// overflow-y:auto as well — that previously clipped an absolutely-positioned
// panel and made these menus appear not to drop down. Same escape pattern as
// RichTextToolbar's dropdowns.
const panelStyle: React.CSSProperties = {
  position: "fixed",
  zIndex: 9999,
  background: "#FFFFFF",
  border: "1px solid #E0E0E0",
  boxShadow: "0px 4px 16px rgba(0,0,0,0.12), 0px 1px 4px rgba(0,0,0,0.06)",
  borderRadius: "4px",
  paddingTop: "4px",
  paddingBottom: "4px",
  minWidth: "220px",
};

export function CommandDropdown({ def, open, onToggle, onClose }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null);

  // Anchor the fixed panel just below the trigger button when it opens.
  useLayoutEffect(() => {
    if (open && rootRef.current) {
      const r = rootRef.current.getBoundingClientRect();
      setAnchor({ top: r.bottom, left: r.left });
    } else {
      setAnchor(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const handleOutsideClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      onClose();
    };
    document.addEventListener("mousedown", handleOutsideClick, true);
    return () => document.removeEventListener("mousedown", handleOutsideClick, true);
  }, [open, onClose]);

  return (
    <div
      ref={rootRef}
      style={{ position: "relative", height: "100%", display: "flex", alignItems: "center" }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <button
        className="sl-icon-btn"
        title={def.title}
        aria-expanded={open}
        aria-haspopup="menu"
        style={{
          height: "26px",
          minWidth: "38px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "3px",
          padding: "0 8px",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          flexShrink: 0,
          fontFamily: "inherit",
          background: open ? "#EBEBEB" : "transparent",
        }}
        onClick={onToggle}
      >
        {def.iconElement ?? (
          def.iconSrc ? (
            <img
              src={def.iconSrc}
              width={14}
              height={14}
              alt=""
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : null
        )}
        <ChevronDownRegular style={{ fontSize: "8px", color: colors.grey38 }} />
      </button>
      {open && anchor && createPortal(
        <div
          ref={(el) => { panelRef.current = el; }}
          role="menu"
          style={{ ...panelStyle, top: anchor.top, left: anchor.left }}
        >
          {def.items.map((item) => (
            <button
              key={item.label}
              className="sl-panel-item"
              role="menuitem"
              style={{
                height: "32px",
                display: "flex",
                alignItems: "center",
                width: "100%",
                border: "none",
                background: "transparent",
                cursor: item.enabled ? "pointer" : "default",
                padding: "0 16px 0 39px",
                position: "relative",
                fontSize: "12.2px",
                fontFamily: "inherit",
                color: item.enabled ? "#1B1B1B" : "#BDBDBD",
                textAlign: "left" as const,
                whiteSpace: "nowrap" as const,
                flexShrink: 0,
              }}
              onClick={item.enabled ? item.onClick : undefined}
            >
              {item.iconSrc && (
                <img
                  src={item.iconSrc}
                  width={15}
                  height={15}
                  alt=""
                  style={{
                    position: "absolute",
                    left: "17px",
                    opacity: item.enabled ? 1 : 0.35,
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
              {item.label}
            </button>
          ))}
        </div>
      , document.body)}
    </div>
  );
}
