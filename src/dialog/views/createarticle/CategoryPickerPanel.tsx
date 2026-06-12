// src/dialog/views/createarticle/CategoryPickerPanel.tsx
//
// Floating, draggable, portal-rendered category picker.
// Figma panel.sm spec: 300px wide, draggable header, searchable scrollable list.

import React, {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import ReactDOM from "react-dom";
import { useDraggable } from "@/dialog/hooks/useDraggable";
import { ArticleCloseIcon } from "@/dialog/components/Icons";
import {
  AirplaneRegular,
  BeakerRegular,
  BriefcaseRegular,
  BuildingGovernmentRegular,
  FoodRegular,
  HatGraduationRegular,
  HeartPulseRegular,
  LaptopRegular,
  LeafOneRegular,
  MoneyRegular,
  MoviesAndTvRegular,
  PaintBrushRegular,
  ShoppingBagRegular,
  TrophyRegular,
} from "@fluentui/react-icons";
import type { FluentIcon } from "@fluentui/react-icons";

// ─── Category list ─────────────────────────────────────────────────────────────

export const ALL_ARTICLE_CATEGORIES = [
  "Art",
  "Business",
  "Technology",
  "Health",
  "Education",
  "Finance",
  "Entertainment",
  "Travel",
  "Food",
  "Fashion",
  "Sports",
  "Science",
  "Environment",
  "Politics",
] as const;

export type ArticleCategory = (typeof ALL_ARTICLE_CATEGORIES)[number] | "";

// ─── Category icons ────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<Exclude<ArticleCategory, "">, FluentIcon> = {
  Art:           PaintBrushRegular,
  Business:      BriefcaseRegular,
  Technology:    LaptopRegular,
  Health:        HeartPulseRegular,
  Education:     HatGraduationRegular,
  Finance:       MoneyRegular,
  Entertainment: MoviesAndTvRegular,
  Travel:        AirplaneRegular,
  Food:          FoodRegular,
  Fashion:       ShoppingBagRegular,
  Sports:        TrophyRegular,
  Science:       BeakerRegular,
  Environment:   LeafOneRegular,
  Politics:      BuildingGovernmentRegular,
};

export interface CategoryIconProps {
  /** Accepts any string so callers can pass DB-stored values without a cast. */
  category: string | null | undefined;
  size?:    number;
  color?:   string;
}

/** Renders the Fluent icon for a category. Returns null when the value isn't a known category. */
export function CategoryIcon({ category, size = 16, color }: CategoryIconProps) {
  if (!category) return null;
  const Icon = CATEGORY_ICONS[category as Exclude<ArticleCategory, "">];
  if (!Icon) return null;
  return (
    <Icon
      style={{
        fontSize:  size,
        width:     size,
        height:    size,
        color,
        flexShrink: 0,
      }}
    />
  );
}

// ─── Panel ─────────────────────────────────────────────────────────────────────

export interface CategoryPickerPanelProps {
  /** Bounding rect of the trigger button — used to set the initial position. */
  triggerRect: DOMRect;
  selectedCategory: ArticleCategory;
  onSelect: (cat: ArticleCategory) => void;
  onClose: () => void;
}

const PANEL_WIDTH      = 300;
const PANEL_MAX_HEIGHT = 480; // intentionally shorter than Figma's 630 spec

/** Clamp the initial top-left so the panel never starts off-screen. */
function computeInitialPos(rect: DOMRect) {
  const vh = window.innerHeight;
  const vw = window.innerWidth;

  let left = rect.right - PANEL_WIDTH;
  let top  = rect.bottom + 4;

  if (left < 8)                         left = 8;
  if (left + PANEL_WIDTH > vw - 8)      left = vw - PANEL_WIDTH - 8;
  if (top + PANEL_MAX_HEIGHT > vh - 8) {
    const topAbove = rect.top - PANEL_MAX_HEIGHT - 4;
    top = topAbove > 8 ? topAbove : Math.max(8, vh - PANEL_MAX_HEIGHT - 8);
  }

  return { x: left, y: top };
}

export function CategoryPickerPanel({
  triggerRect,
  selectedCategory,
  onSelect,
  onClose,
}: CategoryPickerPanelProps) {
  // ── Drag (initialised from trigger rect so panel opens in-place) ────────────
  const initial = computeInitialPos(triggerRect);
  const { pos, onHeaderMouseDown } = useDraggable({
    initialX: initial.x,
    initialY: initial.y,
  });

  // ── Search ──────────────────────────────────────────────────────────────────
  const [search, setSearch]         = useState("");
  const searchRef                   = useRef<HTMLInputElement>(null);
  const panelRef                    = useRef<HTMLDivElement>(null);
  const listId                      = useId();
  const [, setFocusedIdx] = useState<number | null>(null);
  const itemRefs                    = useRef<(HTMLDivElement | null)[]>([]);

  const filtered = ALL_ARTICLE_CATEGORIES.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase()),
  );

  // Auto-focus search on open
  useEffect(() => { searchRef.current?.focus(); }, []);

  // Escape → close
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  // Outside mouse-down → close
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node))
        onClose();
    };
    document.addEventListener("mousedown", h, true);
    return () => document.removeEventListener("mousedown", h, true);
  }, [onClose]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSelect = useCallback(
    (cat: ArticleCategory) => { onSelect(cat); onClose(); },
    [onSelect, onClose],
  );

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIdx(0);
        itemRefs.current[0]?.focus();
      }
    },
    [],
  );

  const handleItemKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>, idx: number, cat: ArticleCategory) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleSelect(cat);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = Math.min(idx + 1, filtered.length - 1);
        setFocusedIdx(next);
        itemRefs.current[next]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (idx === 0) {
          setFocusedIdx(null);
          searchRef.current?.focus();
        } else {
          const prev = idx - 1;
          setFocusedIdx(prev);
          itemRefs.current[prev]?.focus();
        }
      }
    },
    [filtered.length, handleSelect],
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return ReactDOM.createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Select Category"
      aria-modal="false"
      style={{
        position:        "fixed",
        top:             pos.y,
        left:            pos.x,
        width:           PANEL_WIDTH,
        maxHeight:       PANEL_MAX_HEIGHT,
        display:         "flex",
        flexDirection:   "column",
        background:      "#FFFFFF",
        boxShadow:       "0px 8px 32px rgba(0,0,0,0.14), 0px 2px 8px rgba(0,0,0,0.06)",
        borderRadius:    8,
        zIndex:          9999,
        fontFamily:      "'Inter','Segoe UI',sans-serif",
        overflow:        "hidden",
        userSelect:      "none",
      }}
    >
      {/* ── Draggable header ──────────────────────────────────────────────── */}
      <div
        onMouseDown={onHeaderMouseDown}
        style={{
          display:         "flex",
          flexDirection:   "row",
          justifyContent:  "space-between",
          alignItems:      "center",
          padding:         "13px 16px 11px",
          height:          43,
          flexShrink:      0,
          boxSizing:       "border-box",
          cursor:          "move",
          borderBottom:    "1px solid #F0F0F0",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 12.6, lineHeight: "15px", color: "#1B1B1B", pointerEvents: "none" }}>
          Category
        </span>

        <button
          onClick={onClose}
          aria-label="Close category picker"
          style={{
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "center",
            width:           17,
            height:          17,
            borderRadius:    3,
            border:          "none",
            background:      "transparent",
            cursor:          "pointer",
            padding:         3,
            flexShrink:      0,
            boxSizing:       "border-box",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#F0F0F0"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
        >
          <ArticleCloseIcon />
        </button>
      </div>

      {/* ── Search ───────────────────────────────────────────────────────── */}
      <div style={{ padding: "12px 14px 4px", flexShrink: 0, boxSizing: "border-box", userSelect: "auto" }}>
        <div
          style={{
            display:      "flex",
            flexDirection: "row",
            alignItems:   "center",
            padding:      "6px 10px",
            gap:          8,
            background:   "#F5F5F5",
            border:       "1px solid #E0E0E0",
            borderRadius: 6,
            boxSizing:    "border-box",
            width:        "100%",
          }}
        >
          <CategorySearchIcon />
          <input
            ref={searchRef}
            type="text"
            role="searchbox"
            aria-label="Search categories"
            aria-controls={listId}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setFocusedIdx(null); }}
            onKeyDown={handleSearchKeyDown}
            placeholder="search category"
            style={{
              flex:        1,
              border:      "none",
              background:  "transparent",
              outline:     "none",
              fontSize:    11.3,
              lineHeight:  "14px",
              color:       "#1B1B1B",
              fontFamily:  "inherit",
              cursor:      "text",
              userSelect:  "text",
            }}
          />
        </div>
      </div>

      {/* ── Scrollable list ───────────────────────────────────────────────── */}
      <div
        id={listId}
        role="listbox"
        aria-label="Categories"
        style={{
          flex:           1,
          display:        "flex",
          flexDirection:  "column",
          padding:        "4px 14px 14px",
          overflowY:      "auto",
          boxSizing:      "border-box",
          userSelect:     "none",
        }}
      >
        {filtered.length === 0 ? (
          <div style={{ padding: "12px 0", fontSize: 11.3, color: "#ADADAD" }}>
            No categories found
          </div>
        ) : (
          filtered.map((cat, idx) => (
            <CategoryItem
              key={cat}
              category={cat}
              selected={cat === selectedCategory}
              onSelect={() => handleSelect(cat)}
              onKeyDown={(e) => handleItemKeyDown(e, idx, cat)}
              itemRef={(el) => { itemRefs.current[idx] = el; }}
            />
          ))
        )}
      </div>
    </div>,
    document.body,
  );
}

// ─── List item ─────────────────────────────────────────────────────────────────

interface CategoryItemProps {
  category: Exclude<ArticleCategory, "">;
  selected: boolean;
  onSelect: () => void;
  onKeyDown:(e: React.KeyboardEvent<HTMLDivElement>) => void;
  itemRef:  (el: HTMLDivElement | null) => void;
}

function CategoryItem({ category, selected, onSelect, onKeyDown, itemRef }: CategoryItemProps) {
  const [hovered, setHovered] = useState(false);
  const textColor = selected ? "#0078D4" : "#616161";

  return (
    <div
      ref={itemRef}
      role="option"
      aria-selected={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:       "flex",
        alignItems:    "center",
        gap:           10,
        padding:       "10px 6px 11px",
        cursor:        "pointer",
        background:    selected ? "#EBF3FC" : hovered ? "#F5F5F5" : "transparent",
        borderRadius:  4,
        boxSizing:     "border-box",
        outline:       "none",
        userSelect:    "none",
      }}
    >
      <CategoryIcon category={category} size={16} color={textColor} />
      <span
        style={{
          fontSize:   12.3,
          lineHeight: "15px",
          color:      textColor,
          fontWeight: selected ? 600 : 400,
        }}
      >
        {category}
      </span>
    </div>
  );
}

// ─── Search icon ───────────────────────────────────────────────────────────────

function CategorySearchIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <circle cx="4.9" cy="4.9" r="3.3" stroke="#ADADAD" strokeWidth="1.2" />
      <line x1="7.7" y1="7.7" x2="10.5" y2="10.5" stroke="#ADADAD" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
