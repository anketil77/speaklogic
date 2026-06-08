// src/dialog/components/PublishArticleDialog.tsx
// Inline portal for publishing an article to one or more channels.

import React, { useState, useCallback, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { useDraggable } from "@/dialog/hooks/useDraggable";
import type { Article } from "@/types/db";

// ── Publisher definitions ─────────────────────────────────────────────────────
interface Publisher {
  name: string;
  color: string;
  initial: string;
}

const PUBLISHERS: Publisher[] = [
  { name: "CNN",         color: "#CC0000", initial: "C" },
  { name: "Medium",      color: "#000000", initial: "M" },
  { name: "Yahoo News",  color: "#6001D2", initial: "Y" },
  { name: "BBC",         color: "#BB1919", initial: "B" },
  { name: "The Guardian",color: "#1D5B76", initial: "G" },
];

// ── Props ─────────────────────────────────────────────────────────────────────
interface PublishArticleDialogProps {
  article: Article;
  onCancel: () => void;
  onPublish: (publishers: string[]) => void;
}

// ── Publisher logo badge ──────────────────────────────────────────────────────
function PublisherLogo({ pub, size = 24 }: { pub: Publisher; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: pub.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        color: "#FFFFFF",
        fontSize: size * 0.45,
        fontWeight: 700,
        fontFamily: "Inter, Segoe UI, sans-serif",
      }}
    >
      {pub.initial}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export function PublishArticleDialog({ article, onCancel, onPublish }: PublishArticleDialogProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [publishHover, setPublishHover] = useState(false);
  const [cancelHover, setCancelHover] = useState(false);
  const { pos, onHeaderMouseDown } = useDraggable({ initialX: 0, initialY: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const filtered = PUBLISHERS.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const togglePublisher = useCallback((name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const removeChip = useCallback((name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
  }, []);

  const selectedList = Array.from(selected);
  const canPublish = selectedList.length > 0;

  const dialog = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onCancel}
    >
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          left: `calc(50% + ${pos.x}px)`,
          top: `calc(50% + ${pos.y}px)`,
          transform: "translate(-50%, -50%)",
          background: "#FFFFFF",
          border: "1px solid #E0E0E0",
          borderRadius: 8,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          width: 420,
          fontFamily: "Inter, Segoe UI, sans-serif",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          onMouseDown={onHeaderMouseDown}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px 12px",
            borderBottom: "1px solid #F0F0F0",
            cursor: "grab",
            userSelect: "none",
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 13.2, color: "#1B1B1B" }}>
            Publish Article
          </span>
          <button
            onClick={onCancel}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#616161",
              fontSize: 16,
              lineHeight: 1,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Article title preview */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            borderBottom: "1px solid #F0F0F0",
          }}
        >
          {/* Thumbnail placeholder */}
          <div
            style={{
              width: 48,
              height: 36,
              borderRadius: 4,
              background: "#EBF3FC",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              color: "#0078D4",
              fontWeight: 700,
            }}
          >
            ART
          </div>
          <span
            style={{
              fontSize: 11.8,
              color: "#1B1B1B",
              fontWeight: 500,
              lineHeight: "16px",
              flex: 1,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {article.articleTitle || "Untitled Article"}
          </span>
        </div>

        {/* Search input */}
        <div style={{ padding: "12px 16px 6px" }}>
          <span style={{ fontSize: 10.8, color: "#616161", fontWeight: 600, display: "block", marginBottom: 6 }}>
            Select Publication Channel
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="search channel"
            style={{
              width: "100%",
              boxSizing: "border-box",
              height: 30,
              border: "1px solid #E0E0E0",
              borderRadius: 4,
              padding: "0 10px",
              fontSize: 11.4,
              fontFamily: "inherit",
              color: "#1B1B1B",
              outline: "none",
              background: "#FAFAFA",
            }}
          />
        </div>

        {/* Selected chips */}
        {selectedList.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              padding: "6px 16px 4px",
            }}
          >
            {selectedList.map((name) => {
              const pub = PUBLISHERS.find((p) => p.name === name)!;
              return (
                <div
                  key={name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    background: "#F3F3F3",
                    border: "1px solid #E0E0E0",
                    borderRadius: 12,
                    padding: "3px 8px 3px 5px",
                    fontSize: 11,
                    color: "#1B1B1B",
                    fontFamily: "inherit",
                  }}
                >
                  <PublisherLogo pub={pub} size={16} />
                  {name}
                  <button
                    onClick={() => removeChip(name)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      marginLeft: 2,
                      color: "#616161",
                      fontSize: 13,
                      lineHeight: 1,
                      display: "flex",
                      alignItems: "center",
                    }}
                    aria-label={`Remove ${name}`}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Publisher list */}
        <div
          style={{
            maxHeight: 200,
            overflowY: "auto",
            padding: "4px 0 6px",
          }}
        >
          {filtered.map((pub) => {
            const isSelected = selected.has(pub.name);
            return (
              <div
                key={pub.name}
                role="menuitem"
                tabIndex={0}
                onClick={() => togglePublisher(pub.name)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") togglePublisher(pub.name); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 16px",
                  cursor: "pointer",
                  background: isSelected ? "#F0F7FF" : "none",
                }}
              >
                <PublisherLogo pub={pub} size={24} />
                <span style={{ fontSize: 12.2, color: "#1B1B1B", flex: 1 }}>
                  {pub.name}
                </span>
                {isSelected && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7L5.5 10.5L12 3.5" stroke="#0078D4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ padding: "10px 16px", fontSize: 11.4, color: "#ADADAD" }}>
              No channels match "{search}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            padding: "10px 16px 14px",
            borderTop: "1px solid #F0F0F0",
          }}
        >
          <button
            onClick={onCancel}
            onMouseEnter={() => setCancelHover(true)}
            onMouseLeave={() => setCancelHover(false)}
            style={{
              height: 28,
              padding: "0 14px",
              background: cancelHover ? "#F3F3F3" : "#FFFFFF",
              border: "1px solid #E0E0E0",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 11.8,
              fontWeight: 600,
              color: "#616161",
              fontFamily: "inherit",
            }}
          >
            Cancel
          </button>
          <button
            disabled={!canPublish}
            onClick={() => canPublish && onPublish(selectedList)}
            onMouseEnter={() => setPublishHover(true)}
            onMouseLeave={() => setPublishHover(false)}
            style={{
              height: 28,
              padding: "0 14px",
              background: !canPublish ? "#C5C5C5" : publishHover ? "#106EBE" : "#0078D4",
              border: "none",
              borderRadius: 4,
              cursor: canPublish ? "pointer" : "default",
              fontSize: 11.8,
              fontWeight: 700,
              color: "#FFFFFF",
              fontFamily: "inherit",
            }}
          >
            Publish Article
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(dialog, document.body);
}
