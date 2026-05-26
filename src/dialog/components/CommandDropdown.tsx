// src/dialog/components/CommandDropdown.tsx
import React, { useRef, useEffect } from "react";
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

const panelStyle: React.CSSProperties = {
  position: "absolute",
  top: "100%",
  left: 0,
  zIndex: 200,
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

  useEffect(() => {
    if (!open) return undefined;
    const handleOutsideClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        onClose();
      }
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
      {open && (
        <div role="menu" style={panelStyle}>
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
      )}
    </div>
  );
}
