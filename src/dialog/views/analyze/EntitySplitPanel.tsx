import React, { useRef, useState } from "react";
import { colors } from "@/styles/tokens";
import { HtmlContent } from "@/dialog/components/HtmlContent";
import { CountBadge } from "@/dialog/views/analyze/CountBadge";

type EntityViewMode = "both" | "analysis-only" | "entity-only";

interface EntitySplitPanelProps {
  euaHtml: string;
  entityViewMode: EntityViewMode;
  onEntityViewModeChange: (mode: EntityViewMode) => void;
  entityOnlyMode: boolean;
  showEntityBox: boolean;
  onContextMenuError: (text: string) => void;
  /** Live count of identified errors — shown as a badge on the entity box. */
  errorCount?: number;
  children: React.ReactNode;
}

export function EntitySplitPanel({
  euaHtml,
  entityViewMode,
  onEntityViewModeChange,
  entityOnlyMode,
  showEntityBox,
  onContextMenuError,
  errorCount = 0,
  children,
}: EntitySplitPanelProps) {
  const [entityPanelHeight, setEntityPanelHeight] = useState(130);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; text: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef(entityViewMode);
  modeRef.current = entityViewMode;

  function handleSplitterMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    const startY = e.clientY;
    const startH = modeRef.current === "analysis-only" ? 0 : entityPanelHeight;
    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    function onMove(ev: MouseEvent) {
      const maxH = containerRef.current ? containerRef.current.clientHeight - 60 : 500;
      const delta = ev.clientY - startY;
      const newH = Math.min(startH + delta, maxH);
      if (newH < 30) {
        if (modeRef.current !== "analysis-only") {
          onEntityViewModeChange("analysis-only");
          setEntityPanelHeight(130);
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
        }
        return;
      }
      if (modeRef.current === "analysis-only") {
        onEntityViewModeChange("both");
      }
      setEntityPanelHeight(Math.max(40, newH));
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  function handleEntityContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    const text = window.getSelection()?.toString().trim() ?? "";
    setCtxMenu({ x: e.clientX, y: e.clientY, text });
  }

  return (
    <div ref={containerRef} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      {showEntityBox && (
        <div
          style={{
            position: "relative",
            height: entityOnlyMode ? undefined : entityPanelHeight,
            flex: entityOnlyMode ? 1 : undefined,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <CountBadge count={errorCount} color="#D13438" title={`${errorCount} identified error${errorCount === 1 ? "" : "s"}`} />
          <span style={{
            display: "block",
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "0.6px",
            textTransform: "uppercase",
            color: colors.grey38,
            lineHeight: "13px",
            padding: "12px 20px 8px",
          }}>
            Entity Under Analysis
          </span>
          <HtmlContent
            html={euaHtml}
            style={{
              flex: 1,
              margin: "0 20px",
              marginBottom: entityOnlyMode ? 12 : 0,
              border: "1px solid #E0E0E0",
              borderRadius: 4,
              padding: "10px 14px",
              overflowY: "auto",
              fontSize: "14px",
              lineHeight: 1.7,
              color: colors.grey11,
              wordBreak: "break-word",
              userSelect: "text",
              fontFamily: "inherit",
              background: colors.white,
            }}
            onContextMenu={handleEntityContextMenu}
          />
        </div>
      )}

      {/* Splitter — always visible on analysis tab so user can drag to restore a hidden entity panel */}
      {!entityOnlyMode && (
        <div
          style={{
            height: 6,
            background: "#E0E0E0",
            cursor: "row-resize",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            userSelect: "none",
          }}
          onMouseDown={handleSplitterMouseDown}
        >
          <div style={{ width: 32, height: 3, borderRadius: 2, background: "#B8B8B8" }} />
        </div>
      )}

      {!entityOnlyMode && (
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px 16px" }}>
          {children}
        </div>
      )}

      {ctxMenu && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onClick={() => setCtxMenu(null)} />
          <div style={{
            position: "fixed",
            left: ctxMenu.x,
            top: ctxMenu.y,
            zIndex: 9999,
            background: "#FFFFFF",
            border: "1px solid #E0E0E0",
            borderRadius: 4,
            boxShadow: "0 4px 16px rgba(0,0,0,0.14)",
            minWidth: 220,
            overflow: "hidden",
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
          }}>
            {[
              { label: "Identify Selection as Error", action: () => onContextMenuError(ctxMenu.text) },
            ].map(({ label, action }) => (
              <button
                key={label}
                disabled={!ctxMenu.text}
                style={{
                  display: "block", width: "100%", padding: "7px 14px", textAlign: "left",
                  background: "transparent", border: "none", fontSize: "12.2px", fontFamily: "inherit",
                  color: "#1B1B1B", cursor: ctxMenu.text ? "pointer" : "default",
                  whiteSpace: "nowrap", opacity: ctxMenu.text ? 1 : 0.4,
                }}
                onMouseEnter={(e) => { if (ctxMenu.text) (e.currentTarget as HTMLButtonElement).style.background = "#F5F5F5"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                onClick={() => { action(); setCtxMenu(null); }}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
