// src/dialog/components/PublishArticleDialog.tsx
// Inline portal for publishing an article — publishers loaded from DB, with add/delete.

import React, { useState, useCallback, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { useDraggable } from "@/dialog/hooks/useDraggable";
import type { Article, Publisher } from "@/types/db";

// ── Props ─────────────────────────────────────────────────────────────────────
interface PublishArticleDialogProps {
  article: Article;
  publishers: Publisher[];
  onCancel: () => void;
  onPublish: (publishers: string[]) => void;
  onAddPublisher: (name: string, logoBase64: string) => void;
  onDeletePublisher: (id: number) => void;
}

// ── Publisher logo — image if available, color circle fallback ────────────────
const FALLBACK_COLORS = [
  "#0078D4", "#CC0000", "#107C10", "#6001D2", "#BB1919",
  "#1D5B76", "#C19C00", "#D13438", "#00B7C3", "#8764B8",
];

function PublisherLogo({ pub, size = 24 }: { pub: Publisher; size?: number }) {
  if (pub.logoBase64) {
    return (
      <img
        src={pub.logoBase64}
        alt={pub.name}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          border: "1px solid #E0E0E0",
        }}
      />
    );
  }
  const color = FALLBACK_COLORS[pub.id % FALLBACK_COLORS.length];
  const initial = pub.name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
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
      {initial}
    </div>
  );
}

// ── Resize image to 40×40 via canvas and return base64 PNG ───────────────────
function resizeImageTo40(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 40;
        canvas.height = 40;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("canvas")); return; }
        ctx.drawImage(img, 0, 0, 40, 40);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Component ─────────────────────────────────────────────────────────────────
export function PublishArticleDialog({
  article,
  publishers,
  onCancel,
  onPublish,
  onAddPublisher,
  onDeletePublisher,
}: PublishArticleDialogProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  // "Add Publisher" form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLogo, setNewLogo] = useState<string>("");
  const [newLogoError, setNewLogoError] = useState("");
  const [addNameError, setAddNameError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hover states
  const [publishHover, setPublishHover] = useState(false);
  const [cancelHover, setCancelHover] = useState(false);
  const [addBtnHover, setAddBtnHover] = useState(false);
  const [confirmAddHover, setConfirmAddHover] = useState(false);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const { pos, onHeaderMouseDown } = useDraggable({ initialX: 0, initialY: 0 });

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showAddForm) { setShowAddForm(false); resetAddForm(); }
        else onCancel();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel, showAddForm]);

  const resetAddForm = () => {
    setNewName("");
    setNewLogo("");
    setNewLogoError("");
    setAddNameError("");
  };

  const filtered = publishers.filter((p) =>
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
    setSelected((prev) => { const next = new Set(prev); next.delete(name); return next; });
  }, []);

  const selectedList = Array.from(selected);
  const canPublish = selectedList.length > 0;

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setNewLogoError("Please select an image file.");
      return;
    }
    try {
      const base64 = await resizeImageTo40(file);
      setNewLogo(base64);
      setNewLogoError("");
    } catch {
      setNewLogoError("Could not load image.");
    }
    e.target.value = "";
  };

  const handleConfirmAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) { setAddNameError("Publisher name is required."); return; }
    onAddPublisher(trimmed, newLogo);
    setShowAddForm(false);
    resetAddForm();
  };

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
            style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#616161", fontSize: 16, lineHeight: 1, display: "flex", alignItems: "center" }}
            aria-label="Close"
          >×</button>
        </div>

        {/* Article title preview */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid #F0F0F0" }}>
          <div style={{ width: 48, height: 36, borderRadius: 4, background: "#EBF3FC", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#0078D4", fontWeight: 700 }}>
            ART
          </div>
          <span style={{ fontSize: 11.8, color: "#1B1B1B", fontWeight: 500, lineHeight: "16px", flex: 1, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {article.articleTitle || "Untitled Article"}
          </span>
        </div>

        {/* Search + Add Publisher row */}
        <div style={{ padding: "12px 16px 6px", display: "flex", alignItems: "flex-end", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 10.8, color: "#616161", fontWeight: 600, display: "block", marginBottom: 6 }}>
              Select Publication Channel
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="search channel"
              style={{
                width: "100%", boxSizing: "border-box", height: 30,
                border: "1px solid #E0E0E0", borderRadius: 4, padding: "0 10px",
                fontSize: 11.4, fontFamily: "inherit", color: "#1B1B1B", outline: "none", background: "#FAFAFA",
              }}
            />
          </div>
          <button
            onClick={() => { setShowAddForm((v) => !v); if (showAddForm) resetAddForm(); }}
            onMouseEnter={() => setAddBtnHover(true)}
            onMouseLeave={() => setAddBtnHover(false)}
            title="Add new publisher"
            style={{
              height: 30, padding: "0 10px", flexShrink: 0,
              background: addBtnHover ? "#F0F7FF" : "#FFFFFF",
              border: `1px solid ${showAddForm ? "#0078D4" : "#E0E0E0"}`,
              borderRadius: 4, cursor: "pointer",
              fontSize: 11.4, fontWeight: 600,
              color: showAddForm ? "#0078D4" : "#616161",
              fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Add
          </button>
        </div>

        {/* Add Publisher inline form */}
        {showAddForm && (
          <div style={{ margin: "0 16px 8px", padding: "10px 12px", background: "#F7F9FC", border: "1px solid #D6E4F0", borderRadius: 6 }}>
            <span style={{ fontSize: 10.8, fontWeight: 700, color: "#1B1B1B", display: "block", marginBottom: 8 }}>
              New Publisher
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              {/* Logo preview / pick button */}
              <div
                onClick={() => fileInputRef.current?.click()}
                title="Click to pick a logo image"
                style={{
                  width: 36, height: 36, borderRadius: "50%",
                  border: "1.5px dashed #0078D4", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, overflow: "hidden", background: newLogo ? "transparent" : "#EBF3FC",
                }}
              >
                {newLogo
                  ? <img src={newLogo} alt="logo" style={{ width: 36, height: 36, objectFit: "cover" }} />
                  : <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="1" y="3" width="12" height="8" rx="1.5" stroke="#0078D4" strokeWidth="1.2" />
                      <circle cx="5" cy="6.5" r="1.2" fill="#0078D4" />
                      <path d="M1 9.5l3-2.5 2.5 2 2-1.5 3.5 3" stroke="#0078D4" strokeWidth="1" strokeLinecap="round" />
                    </svg>
                }
              </div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFilePick}
                style={{ display: "none" }}
              />
              {/* Name input */}
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => { setNewName(e.target.value); setAddNameError(""); }}
                  placeholder="Publisher name"
                  style={{
                    width: "100%", boxSizing: "border-box", height: 30,
                    border: `1px solid ${addNameError ? "#D13438" : "#C7C7C7"}`, borderRadius: 4,
                    padding: "0 10px", fontSize: 11.4, fontFamily: "inherit",
                    color: "#1B1B1B", outline: "none",
                  }}
                />
                {addNameError && <span style={{ fontSize: 10.4, color: "#D13438" }}>{addNameError}</span>}
              </div>
            </div>
            {newLogoError && <span style={{ fontSize: 10.4, color: "#D13438", display: "block", marginBottom: 6 }}>{newLogoError}</span>}
            <div style={{ fontSize: 10.2, color: "#616161", marginBottom: 8 }}>
              {newLogo ? "Logo selected (40×40px)" : "Logo optional — click the circle to pick an image"}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
              <button
                onClick={() => { setShowAddForm(false); resetAddForm(); }}
                style={{ height: 26, padding: "0 12px", background: "#FFFFFF", border: "1px solid #E0E0E0", borderRadius: 4, cursor: "pointer", fontSize: 11.2, color: "#616161", fontFamily: "inherit" }}
              >Cancel</button>
              <button
                onClick={handleConfirmAdd}
                onMouseEnter={() => setConfirmAddHover(true)}
                onMouseLeave={() => setConfirmAddHover(false)}
                style={{ height: 26, padding: "0 12px", background: confirmAddHover ? "#106EBE" : "#0078D4", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11.2, fontWeight: 700, color: "#FFFFFF", fontFamily: "inherit" }}
              >Add Publisher</button>
            </div>
          </div>
        )}

        {/* Selected chips */}
        {selectedList.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "6px 16px 4px" }}>
            {selectedList.map((name) => {
              const pub = publishers.find((p) => p.name === name);
              if (!pub) return null;
              return (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: 5, background: "#F3F3F3", border: "1px solid #E0E0E0", borderRadius: 12, padding: "3px 8px 3px 5px", fontSize: 11, color: "#1B1B1B", fontFamily: "inherit" }}>
                  <PublisherLogo pub={pub} size={16} />
                  {name}
                  <button onClick={() => removeChip(name)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginLeft: 2, color: "#616161", fontSize: 13, lineHeight: 1, display: "flex", alignItems: "center" }} aria-label={`Remove ${name}`}>×</button>
                </div>
              );
            })}
          </div>
        )}

        {/* Publisher list */}
        <div style={{ maxHeight: 200, overflowY: "auto", padding: "4px 0 6px" }}>
          {filtered.map((pub) => {
            const isSelected = selected.has(pub.name);
            const isConfirmingDelete = deleteConfirmId === pub.id;
            return (
              <div
                key={pub.id}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", cursor: "pointer", background: isSelected ? "#F0F7FF" : "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }} role="menuitem" tabIndex={0}
                  onClick={() => { if (!isConfirmingDelete) togglePublisher(pub.name); }}
                  onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !isConfirmingDelete) togglePublisher(pub.name); }}
                >
                  <PublisherLogo pub={pub} size={24} />
                  <span style={{ fontSize: 12.2, color: "#1B1B1B", flex: 1 }}>{pub.name}</span>
                  {isSelected && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7L5.5 10.5L12 3.5" stroke="#0078D4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>

                {/* Delete */}
                {isConfirmingDelete ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                    <span style={{ fontSize: 10.4, color: "#D13438" }}>Remove?</span>
                    <button
                      onClick={() => { onDeletePublisher(pub.id); setDeleteConfirmId(null); setSelected((prev) => { const n = new Set(prev); n.delete(pub.name); return n; }); }}
                      style={{ height: 20, padding: "0 6px", background: "#D13438", border: "none", borderRadius: 3, cursor: "pointer", fontSize: 10.4, fontWeight: 700, color: "#FFF", fontFamily: "inherit" }}
                    >Yes</button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      style={{ height: 20, padding: "0 6px", background: "#FFFFFF", border: "1px solid #E0E0E0", borderRadius: 3, cursor: "pointer", fontSize: 10.4, color: "#616161", fontFamily: "inherit" }}
                    >No</button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(pub.id); }}
                    title="Remove publisher"
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#ADADAD", display: "flex", alignItems: "center", flexShrink: 0 }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M1.5 3h9M4.5 3V1.5h3V3M5 5v4M7 5v4M2.5 3l.5 7h6l.5-7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && publishers.length === 0 && (
            <div style={{ padding: "10px 16px", fontSize: 11.4, color: "#ADADAD" }}>
              No publishers yet — click Add to create one.
            </div>
          )}
          {filtered.length === 0 && publishers.length > 0 && (
            <div style={{ padding: "10px 16px", fontSize: 11.4, color: "#ADADAD" }}>
              No channels match "{search}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "10px 16px 14px", borderTop: "1px solid #F0F0F0" }}>
          <button
            onClick={onCancel}
            onMouseEnter={() => setCancelHover(true)}
            onMouseLeave={() => setCancelHover(false)}
            style={{ height: 28, padding: "0 14px", background: cancelHover ? "#F3F3F3" : "#FFFFFF", border: "1px solid #E0E0E0", borderRadius: 4, cursor: "pointer", fontSize: 11.8, fontWeight: 600, color: "#616161", fontFamily: "inherit" }}
          >Cancel</button>
          <button
            disabled={!canPublish}
            onClick={() => canPublish && onPublish(selectedList)}
            onMouseEnter={() => setPublishHover(true)}
            onMouseLeave={() => setPublishHover(false)}
            style={{ height: 28, padding: "0 14px", background: !canPublish ? "#C5C5C5" : publishHover ? "#106EBE" : "#0078D4", border: "none", borderRadius: 4, cursor: canPublish ? "pointer" : "default", fontSize: 11.8, fontWeight: 700, color: "#FFFFFF", fontFamily: "inherit" }}
          >Publish Article</button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(dialog, document.body);
}
