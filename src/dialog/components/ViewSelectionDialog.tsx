// src/dialog/components/ViewSelectionDialog.tsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useDraggable } from "@/dialog/hooks/useDraggable";
import { RichTextToolbar } from "@/dialog/components/RichTextToolbar";
import {
  CloseIcon,
  FlaggedHistoryHeaderIcon,
  SmallCaretDownIcon,
  ViewSelAnalyzeIcon,
  FeedbackDropdownTriggerIcon,
  PrincipleDropdownTriggerIcon,
  ProvideSelFbMenuIcon,
  ApplySelFbMenuIcon,
  RequestSelFbMenuIcon,
} from "@/dialog/components/Icons";
import type { FlagEntityForAnalysis } from "@/types/db";

interface Props {
  flag: FlagEntityForAnalysis;
  onClose: () => void;
  onAnalyze?: () => void;
  onProvideFeedback?: () => void;
  onApplyFeedback?: () => void;
  onRequestFeedback?: () => void;
  onIdentifyPrinciple?: () => void;
  onRelateWithPrinciple?: () => void;
  onListIdentified?: () => void;
  onListInterpreted?: () => void;
}

const SOURCE_LABEL: Record<string, string> = {
  "Word Document": "Word Document",
  "Outlook Mail": "Outlook Mail",
  "PowerPoint Document": "PowerPoint Presentation",
};

const C = {
  blue: "#0078D4",
  blueHover: "#106EBE",
  grey11: "#1B1B1B",
  grey38: "#616161",
  grey78: "#C7C7C7",
  grey88: "#E0E0E0",
  grey96: "#F5F5F5",
  gallery: "#EBEBEB",
  iconBg: "#EBF3FC",
  white: "#FFFFFF",
  menuHover: "#F0F6FD",
} as const;

const LABEL_W = 178;

const readonlyInput: React.CSSProperties = {
  boxSizing: "border-box",
  height: 32,
  width: "100%",
  border: `1px solid ${C.grey78}`,
  borderRadius: 4,
  padding: "0 11px",
  fontSize: "12.2px",
  fontFamily: "inherit",
  color: C.grey11,
  background: C.white,
  outline: "none",
  cursor: "default",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

function CmdSep() {
  return <div style={{ width: 1, height: 20, background: C.grey88, flexShrink: 0 }} />;
}

function FbMenuItem({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      role="menuitem"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: "100%",
        height: 32,
        display: "flex",
        alignItems: "center",
        gap: 10,
        paddingLeft: 15,
        paddingRight: 15,
        background: hover ? C.menuHover : "transparent",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
        fontSize: "12.1px",
        color: C.grey11,
        flexShrink: 0,
      }}
    >
      {icon}
      {label}
    </button>
  );
}

export function ViewSelectionDialog({
  flag,
  onClose,
  onAnalyze,
  onProvideFeedback,
  onApplyFeedback,
  onRequestFeedback,
  onIdentifyPrinciple,
  onRelateWithPrinciple,
  onListIdentified,
  onListInterpreted,
}: Props) {
  const { pos, onHeaderMouseDown } = useDraggable();
  const [openDropdown, setOpenDropdown] = useState<"feedback" | "principle" | null>(null);
  const [analyzeHover, setAnalyzeHover] = useState(false);
  const [fbHover, setFbHover] = useState(false);
  const [prHover, setPrHover] = useState(false);
  const cmdBarRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    el.innerHTML = flag.actualSelection || "";
  }, [flag.actualSelection]);

  useEffect(() => {
    if (!openDropdown) return undefined;
    const handler = (e: MouseEvent) => {
      if (cmdBarRef.current && !cmdBarRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [openDropdown]);

  const handleFeedbackItem = useCallback((cb?: () => void) => {
    setOpenDropdown(null);
    cb?.();
  }, []);

  const feedbackItems = [
    { label: "Provide Feedback with Selection", icon: <ProvideSelFbMenuIcon />, cb: onProvideFeedback },
    { label: "Apply Selection as Feedback", icon: <ApplySelFbMenuIcon />, cb: onApplyFeedback },
    { label: "Request Feedback with Selection", icon: <RequestSelFbMenuIcon />, cb: onRequestFeedback },
  ];

  const principleItems: { label: string; cb?: () => void; separator?: boolean }[] = [
    { label: "Identify Principle in Selection", cb: onIdentifyPrinciple },
    { label: "Relate Selection with Principle", cb: onRelateWithPrinciple },
    { label: "List Identified Principle", cb: onListIdentified, separator: true },
    { label: "List Interpreted Principle", cb: onListInterpreted },
  ];

  return createPortal(
    <>
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 199 }}
        onClick={onClose}
      />
      <div
        style={{
          position: "fixed",
          left: `calc(50% + ${pos.x}px)`,
          top: `calc(50% + ${pos.y}px)`,
          transform: "translate(-50%, -50%)",
          width: 900,
          height: 600,
          maxWidth: "96vw",
          maxHeight: "90vh",
          zIndex: 200,
          display: "flex",
          flexDirection: "column",
          background: C.white,
          boxShadow: "0px 8px 32px rgba(0,0,0,0.14), 0px 2px 8px rgba(0,0,0,0.06)",
          borderRadius: 8,
          overflow: "hidden",
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
        }}
      >
        {/* ── Header (77.59px) ── */}
        <div
          onMouseDown={onHeaderMouseDown}
          style={{
            height: 77.59,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            paddingLeft: 20,
            paddingRight: 20,
            gap: 12,
            cursor: "grab",
            userSelect: "none",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: C.iconBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <FlaggedHistoryHeaderIcon />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: "15.3px",
                fontWeight: 700,
                color: C.grey11,
                letterSpacing: "-0.1px",
                lineHeight: "21px",
              }}
            >
              View Selection
            </div>
            <div style={{ fontSize: "11.1px", color: C.grey38, lineHeight: "17px", marginTop: 2 }}>
              View the current selection and access analysis, feedback and principle options.
            </div>
          </div>
          <button
            className="sl-close-btn"
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              flexShrink: 0,
              padding: 0,
            }}
            title="Close"
          >
            <CloseIcon />
          </button>
        </div>

        {/* ── Command bar (44px, #F5F5F5) ── */}
        <div
          ref={cmdBarRef}
          style={{
            height: 44,
            flexShrink: 0,
            background: C.grey96,
            display: "flex",
            alignItems: "center",
            paddingLeft: 12,
            paddingRight: 12,
            gap: 8,
            position: "relative",
          }}
        >
          {/* Analyze Selection primary button */}
          <button
            onClick={onAnalyze}
            onMouseEnter={() => setAnalyzeHover(true)}
            onMouseLeave={() => setAnalyzeHover(false)}
            style={{
              width: 143,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              background: analyzeHover ? C.blueHover : C.blue,
              color: C.white,
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: "11.6px",
              fontWeight: 700,
              fontFamily: "inherit",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <ViewSelAnalyzeIcon />
            Analyze Selection
          </button>

          <CmdSep />

          {/* Feedback Options dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setOpenDropdown(openDropdown === "feedback" ? null : "feedback")}
              onMouseEnter={() => setFbHover(true)}
              onMouseLeave={() => setFbHover(false)}
              aria-expanded={openDropdown === "feedback"}
              aria-haspopup="menu"
              style={{
                width: 48,
                height: 28,
                display: "flex",
                alignItems: "center",
                paddingLeft: 7,
                paddingRight: 4,
                gap: 2,
                background: openDropdown === "feedback" || fbHover ? C.gallery : C.grey96,
                border: "none",
                borderRadius: 3,
                cursor: "pointer",
                flexShrink: 0,
              }}
              title="Feedback Options"
            >
              <FeedbackDropdownTriggerIcon />
              <SmallCaretDownIcon color={C.grey11} />
            </button>

            {openDropdown === "feedback" && (
              <div
                role="menu"
                style={{
                  position: "absolute",
                  top: 32,
                  left: 0,
                  width: 246,
                  background: C.white,
                  border: `1px solid ${C.grey88}`,
                  boxShadow: "0px 4px 16px rgba(0,0,0,0.12)",
                  borderRadius: 4,
                  zIndex: 10,
                  padding: "8px 0",
                }}
              >
                {feedbackItems.map(({ label, icon, cb }) => (
                  <FbMenuItem
                    key={label}
                    label={label}
                    icon={icon}
                    onClick={() => handleFeedbackItem(cb)}
                  />
                ))}
              </div>
            )}
          </div>

          <CmdSep />

          {/* Principle Options dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setOpenDropdown(openDropdown === "principle" ? null : "principle")}
              onMouseEnter={() => setPrHover(true)}
              onMouseLeave={() => setPrHover(false)}
              aria-expanded={openDropdown === "principle"}
              aria-haspopup="menu"
              style={{
                width: 48,
                height: 28,
                display: "flex",
                alignItems: "center",
                paddingLeft: 7,
                paddingRight: 4,
                gap: 2,
                background: openDropdown === "principle" || prHover ? C.gallery : C.grey96,
                border: "none",
                borderRadius: 3,
                cursor: "pointer",
                flexShrink: 0,
              }}
              title="Principle Options"
            >
              <PrincipleDropdownTriggerIcon />
              <SmallCaretDownIcon color={C.grey11} />
            </button>

            {openDropdown === "principle" && (
              <div
                role="menu"
                style={{
                  position: "absolute",
                  top: 32,
                  left: 0,
                  width: 226,
                  background: C.white,
                  border: `1px solid ${C.grey88}`,
                  boxShadow: "0px 4px 16px rgba(0,0,0,0.12)",
                  borderRadius: 4,
                  zIndex: 10,
                  padding: "8px 0",
                }}
              >
                {principleItems.map(({ label, cb, separator }) => (
                  <React.Fragment key={label}>
                    {separator && (
                      <div style={{ height: 1, background: C.grey88, margin: "4px 0" }} />
                    )}
                    <FbMenuItem
                      label={label}
                      onClick={() => { setOpenDropdown(null); cb?.(); }}
                    />
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          <CmdSep />

          <RichTextToolbar editorRef={editorRef} />
        </div>

        {/* ── Tab bar (36px) ── */}
        <div
          style={{
            height: 36,
            flexShrink: 0,
            background: C.white,
            display: "flex",
            alignItems: "flex-end",
            paddingLeft: 32,
            borderBottom: `1px solid ${C.grey88}`,
          }}
        >
          <div style={{ position: "relative", height: 36, display: "flex", alignItems: "center" }}>
            <span
              style={{
                fontSize: "12.6px",
                fontWeight: 700,
                color: C.grey11,
                lineHeight: "15px",
              }}
            >
              About Selection
            </span>
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 2,
                background: C.blue,
                borderRadius: "1px 1px 0 0",
              }}
            />
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          {/* Selection fields (93px) */}
          <div style={{ position: "relative", height: 93, flexShrink: 0 }}>
            {/* Selection Type row */}
            <div
              style={{
                position: "absolute",
                left: 20,
                right: 20,
                top: 10,
                display: "flex",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: LABEL_W,
                  minWidth: LABEL_W,
                  fontSize: "11.1px",
                  color: C.grey11,
                  flexShrink: 0,
                }}
              >
                Selection Type
              </div>
              <div style={{ flex: 1 }}>
                <input
                  style={readonlyInput}
                  value={SOURCE_LABEL[flag.source] ?? flag.source ?? "—"}
                  readOnly
                />
              </div>
            </div>

            {/* Entity Name row */}
            <div
              style={{
                position: "absolute",
                left: 20,
                right: 20,
                top: 50,
                display: "flex",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: LABEL_W,
                  minWidth: LABEL_W,
                  fontSize: "11.4px",
                  color: C.grey11,
                  flexShrink: 0,
                }}
              >
                Entity Name
              </div>
              <div style={{ flex: 1 }}>
                <input
                  style={readonlyInput}
                  value={flag.applicationName || "—"}
                  readOnly
                />
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: C.grey88, marginLeft: 20, marginRight: 20 }} />

          {/* Actual Selection */}
          <div style={{ padding: "14px 20px 24px" }}>
            <div
              style={{
                fontSize: "11.1px",
                color: C.grey11,
                lineHeight: "13px",
                marginBottom: 32,
              }}
            >
              Actual Selection
            </div>
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              className="rte-field"
              style={{
                fontSize: "24.4px",
                color: C.grey11,
                lineHeight: "36px",
                fontFamily: "inherit",
                wordBreak: "break-word",
                outline: "none",
                minHeight: 36,
              }}
            />
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
