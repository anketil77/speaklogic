// src/dialog/components/FeedbackModelDialog.tsx

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useDraggable } from "@/dialog/hooks/useDraggable";
import { CloseIcon, FeedbackModelIcon } from "@/dialog/components/Icons";
import { colors } from "@/styles/tokens";
import type { ProjectFeedback } from "@/types/db";

type ModelTab = "model1" | "model2";

// ─── Shared helpers ────────────────────────────────────────────────────────────

/** Circular avatar with first-letter initial */
function InitialAvatar({
  name,
  size = 36,
  bg = "#C8D9EC",
  color: fgColor = "#1B5E8A",
}: {
  name: string;
  size?: number;
  bg?: string;
  color?: string;
}) {
  const letter = (name?.trim()?.[0] ?? "?").toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.38,
        fontWeight: 700,
        color: fgColor,
        flexShrink: 0,
        border: `1.5px solid ${colors.green}`,
        boxSizing: "border-box",
      }}
    >
      {letter}
    </div>
  );
}

function ChatBubbleIcon({
  color: c = colors.grey38,
  size = 12,
}: { color?: string; size?: number } = {}) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path
        d="M1.5 2C1.5 1.45 1.95 1 2.5 1H11.5C12.05 1 12.5 1.45 12.5 2V8C12.5 8.55 12.05 9 11.5 9H5L2.5 11.5V9H2.5C1.95 9 1.5 8.55 1.5 8V2Z"
        stroke={c} strokeWidth="1.2" strokeLinejoin="round"
      />
      <rect x="4" y="3.5" width="6" height="1" rx="0.5" fill={c} />
      <rect x="4" y="5.5" width="4" height="1" rx="0.5" fill={c} />
    </svg>
  );
}

function PencilIcon({ color: c = colors.grey38 }: { color?: string } = {}) {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
      <path d="M7 1.5L8.5 3 3.5 8H2V6.5L7 1.5Z" stroke={c} strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  );
}

/** Small floating popup inside a relative container */
function InlinePopup({
  title,
  htmlContent,
  plainText,
  onClose,
}: {
  title: string;
  htmlContent?: string;
  plainText?: string;
  onClose: () => void;
}) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -58%)",
        zIndex: 230,
        background: colors.white,
        border: `1px solid ${colors.grey88}`,
        borderRadius: 6,
        boxShadow: "0 6px 24px rgba(0,0,0,0.18)",
        width: 300,
        maxHeight: 210,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Inter','Segoe UI',sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "8px 11px 7px",
          borderBottom: `1px solid ${colors.grey88}`,
          flexShrink: 0,
        }}
      >
        <span style={{ flex: 1, fontSize: "11.5px", fontWeight: 700, color: colors.grey11 }}>
          {title}
        </span>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }}
        >
          <CloseIcon />
        </button>
      </div>
      <div
        style={{
          padding: "9px 11px",
          fontSize: "11px",
          color: colors.grey11,
          lineHeight: "17px",
          overflowY: "auto",
          flex: 1,
        }}
      >
        {htmlContent ? (
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        ) : (
          plainText || "—"
        )}
      </div>
    </div>
  );
}

// ─── Model 1 ───────────────────────────────────────────────────────────────────
// Layout matches design spec: rounded green person boxes, smooth black curved
// paths converging on a green diamond (ECF), bottom path to Corrected Article.
// Canvas: 540×400.
//   Left person box : x=10,  y=14, w=196, h=66  (avatar on right)
//   Right person box: x=334, y=14, w=196, h=66  (avatar on right)
//   Red dot         : just outside right edge of left box, top area
//   Blue dots       : inside the U-curves, near the descending vertical lines
//   J badge         : top-right of ECF diamond, slightly overlapping
//   ECF diamond     : center=(270,240), half-w/h=48
//   Corrected Art.  : x=160, y=320, w=220, h=50

const M1_W = 540;
const M1_H = 400;

const LP_X = 10,  LP_Y = 14, LP_W = 196, LP_H = 66;
const RP_X = 334, RP_Y = 14, RP_W = 196, RP_H = 66;
const LP_CX = LP_X + LP_W / 2;   // 108
const RP_CX = RP_X + RP_W / 2;   // 432
const LP_BOT = LP_Y + LP_H;      // 80
const RP_BOT = RP_Y + RP_H;      // 80

const ECF_CX = 270, ECF_CY = 240, ECF_RX = 48, ECF_RY = 48;
const ECF_LEFT  = ECF_CX - ECF_RX; // 222
const ECF_RIGHT = ECF_CX + ECF_RX; // 318
const ECF_TOP   = ECF_CY - ECF_RY; // 192
const ECF_BOT   = ECF_CY + ECF_RY; // 288

const FB_W = 100, FB_H = 24;
const FB_CY = ECF_CY;              // 240

const CA_X = 160, CA_Y = 320, CA_W = 220, CA_H = 50;

const LINE_COLOR   = "#2d2d2d";    // dark, near-black arrow/line color
const BORDER_COLOR = "#5aa06d";    // sage-green border (matches spec)

function Model1({ feedback }: { feedback: ProjectFeedback }) {
  const [popup, setPopup] = useState<{
    title: string;
    htmlContent?: string;
    plainText?: string;
  } | null>(null);

  const ft = feedback.feedbackType;
  const isApplied = ft === "Applied";
  const showLeft  = !!(feedback.toPerson?.trim());
  const showRight = ft !== "Requested" && !!(feedback.fromPerson?.trim());
  const showCa    = isApplied && !!(feedback.actualErrorSubstituted?.trim());

  const open = (title: string, opts: { htmlContent?: string; plainText?: string }) =>
    setPopup({ title, ...opts });

  const R = 18;                      // rounded-elbow corner radius
  const TOP_ARC_Y = LP_BOT + 36;     // horizontal level of the top loop

  // Feedback button positions — centered on the horizontal portion of each side path
  const lfbCX = (LP_CX + R + ECF_LEFT) / 2;   // mid of left horizontal segment
  const rfbCX = (RP_CX - R + ECF_RIGHT) / 2;  // mid of right horizontal segment
  const lfbX = Math.round(lfbCX) - FB_W / 2;
  const rfbX = Math.round(rfbCX) - FB_W / 2;

  return (
    <div style={{ position: "relative", width: M1_W, height: M1_H, flexShrink: 0, userSelect: "none" }}>
      <svg
        style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}
        width={M1_W}
        height={M1_H}
      >
        <defs>
          <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3.5" orient="auto">
            <path d="M0,0 L0,7 L7,3.5 Z" fill={LINE_COLOR} />
          </marker>
        </defs>

        {/* Left path: down from left box → rounded elbow right → into ECF left vertex */}
        {showLeft && (
          <path
            d={`M ${LP_CX} ${LP_BOT}
                L ${LP_CX} ${FB_CY - R}
                Q ${LP_CX} ${FB_CY} ${LP_CX + R} ${FB_CY}
                L ${ECF_LEFT - 4} ${FB_CY}`}
            fill="none" stroke={LINE_COLOR} strokeWidth="1.8"
            strokeLinecap="round" markerEnd="url(#arr)"
          />
        )}

        {/* Top arc: from below-right of left box, rounded elbow right, rounded elbow down into ECF top */}
        {showLeft && (
          <path
            d={`M ${LP_X + LP_W - 18} ${LP_BOT}
                L ${LP_X + LP_W - 18} ${TOP_ARC_Y - R}
                Q ${LP_X + LP_W - 18} ${TOP_ARC_Y} ${LP_X + LP_W - 18 + R} ${TOP_ARC_Y}
                L ${ECF_CX - R} ${TOP_ARC_Y}
                Q ${ECF_CX} ${TOP_ARC_Y} ${ECF_CX} ${TOP_ARC_Y + R}
                L ${ECF_CX} ${ECF_TOP - 4}`}
            fill="none" stroke={LINE_COLOR} strokeWidth="1.8"
            strokeLinecap="round" markerEnd="url(#arr)"
          />
        )}

        {/* Right path: down from right box → rounded elbow left → into ECF right vertex */}
        {showRight && (
          <path
            d={`M ${RP_CX} ${RP_BOT}
                L ${RP_CX} ${FB_CY - R}
                Q ${RP_CX} ${FB_CY} ${RP_CX - R} ${FB_CY}
                L ${ECF_RIGHT + 4} ${FB_CY}`}
            fill="none" stroke={LINE_COLOR} strokeWidth="1.8"
            strokeLinecap="round" markerEnd="url(#arr)"
          />
        )}

        {/* ECF diamond */}
        <polygon
          points={`${ECF_CX},${ECF_TOP} ${ECF_RIGHT},${ECF_CY} ${ECF_CX},${ECF_BOT} ${ECF_LEFT},${ECF_CY}`}
          fill={colors.white} stroke={BORDER_COLOR} strokeWidth="2"
        />

        {/* ECF → Corrected Article */}
        {showCa && (
          <line
            x1={ECF_CX} y1={ECF_BOT}
            x2={ECF_CX} y2={CA_Y - 4}
            stroke={LINE_COLOR} strokeWidth="1.8"
            strokeLinecap="round" markerEnd="url(#arr)"
          />
        )}
      </svg>

      {/* ── Left person box ── */}
      {showLeft && (
        <div style={{
          position: "absolute", left: LP_X, top: LP_Y, width: LP_W, height: LP_H,
          border: `2px solid ${BORDER_COLOR}`, borderRadius: 12, background: colors.white,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 12px", boxSizing: "border-box", zIndex: 5,
        }}>
          <div style={{
            flex: 1, fontSize: "11px", color: "#4b524e", lineHeight: "14px", fontWeight: 600,
            marginRight: 8, overflow: "hidden",
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          }}>
            {feedback.toPerson || "—"}
          </div>
          <InitialAvatar name={feedback.toPerson || "?"} size={42} bg="#C8B5DC" color="#5C3B7A" />
        </div>
      )}

      {/* ── Right person box ── */}
      {showRight && (
        <div style={{
          position: "absolute", left: RP_X, top: RP_Y, width: RP_W, height: RP_H,
          border: `2px solid ${BORDER_COLOR}`, borderRadius: 12, background: colors.white,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 12px", boxSizing: "border-box", zIndex: 5,
        }}>
          <div style={{
            flex: 1, fontSize: "11px", color: "#4b524e", lineHeight: "14px", fontWeight: 600,
            marginRight: 8, overflow: "hidden",
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          }}>
            {feedback.fromPerson || "—"}
          </div>
          <InitialAvatar name={feedback.fromPerson || "?"} size={42} bg="#86c6e9" color="#1B5E8A" />
        </div>
      )}

      {/* Red dot — outside right edge of left box, clickable for entity-under-analysis */}
      {showLeft && (
        <button
          onClick={() => open("Entity Under Analysis", {
            plainText: feedback.communicationFunction || feedback.feedbackSubject || "—",
          })}
          title="Entity Under Analysis"
          style={{
            position: "absolute",
            left: LP_X + LP_W + 8,
            top: LP_Y + 14,
            width: 14, height: 14, borderRadius: "50%", background: "#df4d75",
            border: "none", padding: 0, cursor: "pointer", zIndex: 6,
          }}
        />
      )}

      {/* Blue dot left — inside the U-curve, just inside the left vertical line */}
      {showLeft && (
        <div style={{
          position: "absolute",
          left: LP_CX + 14,
          top: Math.round((LP_BOT + FB_CY) / 2) - 7,
          width: 14, height: 14, borderRadius: "50%", background: "#3769df",
          zIndex: 4,
        }} />
      )}

      {/* Blue dot right — inside the U-curve, just inside the right vertical line */}
      {showRight && (
        <div style={{
          position: "absolute",
          left: RP_CX - 28,
          top: Math.round((RP_BOT + FB_CY) / 2) - 7,
          width: 14, height: 14, borderRadius: "50%", background: "#3769df",
          zIndex: 4,
        }} />
      )}

      {/* J badge — top-right of ECF diamond, slightly overlapping its top vertex */}
      <div style={{
        position: "absolute",
        left: ECF_CX + 6,
        top: ECF_TOP - 26,
        width: 34, height: 34, borderRadius: "50%",
        background: "#ffd340",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "15px", fontWeight: 700, color: "#3a2a00",
        boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
        zIndex: 7,
      }}>
        J
      </div>

      {/* Left Feedback button (white bg masks the line where it sits) */}
      {showLeft && (
        <button
          onClick={() => open("Feedback", {
            htmlContent: feedback.feedbackApplication || undefined,
            plainText: feedback.feedbackApplication ? undefined : (feedback.feedbackSubject || "—"),
          })}
          title="Click to view feedback"
          style={{
            position: "absolute", left: lfbX, top: FB_CY - FB_H / 2,
            width: FB_W, height: FB_H,
            background: colors.white, border: "none", cursor: "pointer", padding: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 6, color: "#a4aaa6", fontSize: "12px", fontFamily: "inherit",
            fontWeight: 600, zIndex: 3,
          }}
        >
          <ChatBubbleIcon color="#a4aaa6" size={14} />
          <span>Feedback</span>
        </button>
      )}

      {/* Right Feedback button */}
      {showRight && (
        <button
          onClick={() => open("Feedback", {
            htmlContent: feedback.feedbackApplication || undefined,
            plainText: feedback.feedbackApplication ? undefined : (feedback.feedbackSubject || "—"),
          })}
          title="Click to view feedback"
          style={{
            position: "absolute", left: rfbX, top: FB_CY - FB_H / 2,
            width: FB_W, height: FB_H,
            background: colors.white, border: "none", cursor: "pointer", padding: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 6, color: "#a4aaa6", fontSize: "12px", fontFamily: "inherit",
            fontWeight: 600, zIndex: 3,
          }}
        >
          <ChatBubbleIcon color="#a4aaa6" size={14} />
          <span>Feedback</span>
        </button>
      )}

      {/* ECF clickable overlay */}
      <button
        onClick={() => {
          if (isApplied && feedback.feedbackApplication) {
            open("Feedback Application", { htmlContent: feedback.feedbackApplication });
          }
        }}
        title={isApplied ? "Click to view feedback application" : "ECF"}
        style={{
          position: "absolute",
          left: ECF_LEFT, top: ECF_TOP,
          width: ECF_RX * 2, height: ECF_RY * 2,
          background: "none", border: "none",
          cursor: isApplied ? "pointer" : "default",
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 6, zIndex: 2, fontFamily: "inherit", padding: 0,
        }}
      >
        <span style={{ fontSize: "13px", color: "#4d5550", fontWeight: 700 }}>ECF</span>
        <PencilIcon color="#a8a8a8" />
      </button>

      {/* Corrected Article box */}
      {showCa && (
        <button
          onClick={() => open("Corrected Article", { plainText: feedback.actualErrorSubstituted || "—" })}
          title="Click to view correction"
          style={{
            position: "absolute", left: CA_X, top: CA_Y, width: CA_W, height: CA_H,
            background: colors.white, border: `2px solid ${BORDER_COLOR}`, borderRadius: 12,
            cursor: "pointer", padding: "0 14px",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            zIndex: 2, fontFamily: "inherit",
          }}
        >
          <span style={{ fontSize: "12px", color: "#4b524e", fontWeight: 600 }}>
            Corrected Article
          </span>
          <PencilIcon color="#a8a8a8" />
        </button>
      )}

      {/* Inline popup */}
      {popup && (
        <InlinePopup
          title={popup.title}
          htmlContent={popup.htmlContent}
          plainText={popup.plainText}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  );
}

// ─── Model 2 ───────────────────────────────────────────────────────────────────

function Model2({ feedback }: { feedback: ProjectFeedback }) {
  const ft = feedback.feedbackType;
  const providerName  = feedback.fromPerson?.trim() || "";
  const requesterName = feedback.toPerson?.trim()   || "";

  const showProvider  = ft !== "Requested" && !!providerName;
  const showRequester = !!requesterName;

  const feedbackText = feedback.feedbackApplication || feedback.feedbackSubject || "";
  const textPreview  = feedbackText.length > 160 ? feedbackText.slice(0, 160) + "…" : feedbackText;

  const cx = 230;
  const leftX = 75;
  const rightX = 385;

  return (
    <div style={{ padding: "20px 28px 28px" }}>
      <div style={{
        textAlign: "center", fontSize: "12.5px", fontWeight: 700,
        color: colors.azure42, marginBottom: 14,
      }}>
        The Given Set
      </div>

      {/* Feedback text box */}
      <div style={{
        border: `1px solid ${colors.grey78}`, borderRadius: 4,
        padding: "10px 14px", fontSize: "11.5px", color: colors.grey11,
        lineHeight: "18px", background: colors.grey96, minHeight: 52,
      }}>
        <div dangerouslySetInnerHTML={{ __html: textPreview || "—" }} />
      </div>

      {/* Connector SVG */}
      <svg
        style={{ display: "block", width: "100%", overflow: "visible" }}
        height={62}
        viewBox="0 0 460 62"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <marker id="m2arr" markerWidth="7" markerHeight="7" refX="5.5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L7,3 Z" fill={LINE_COLOR} />
          </marker>
        </defs>
        <line x1={cx} y1={0} x2={cx} y2={24} stroke={LINE_COLOR} strokeWidth="1.2" />
        {showProvider && (
          <>
            <line x1={cx} y1={24} x2={leftX} y2={24} stroke={LINE_COLOR} strokeWidth="1.2" />
            <line x1={leftX} y1={24} x2={leftX} y2={57}
              stroke={LINE_COLOR} strokeWidth="1.2" markerEnd="url(#m2arr)" />
          </>
        )}
        {showRequester && (
          <>
            <line x1={cx} y1={24} x2={rightX} y2={24} stroke={LINE_COLOR} strokeWidth="1.2" />
            <line x1={rightX} y1={24} x2={rightX} y2={57}
              stroke={LINE_COLOR} strokeWidth="1.2" markerEnd="url(#m2arr)" />
          </>
        )}
        {!showProvider && !showRequester && (
          <line x1={cx} y1={24} x2={cx} y2={57}
            stroke={LINE_COLOR} strokeWidth="1.2" markerEnd="url(#m2arr)" />
        )}
      </svg>

      {/* Person icons row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        {showProvider ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 120 }}>
            <InitialAvatar name={providerName} size={44} bg="#C8D9EC" color="#1B5E8A" />
            <div style={{
              marginTop: 6, fontSize: "10.5px", color: colors.grey11, textAlign: "center",
              border: `1px solid ${colors.grey88}`, borderRadius: 4, padding: "2px 8px",
              background: colors.grey96, maxWidth: 112, wordBreak: "break-word", lineHeight: "15px",
            }}>
              {providerName}
            </div>
          </div>
        ) : <div style={{ width: 120 }} />}

        {showRequester ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 120 }}>
            <InitialAvatar name={requesterName} size={44} bg="#D4EDD0" color="#2D6B28" />
            <div style={{
              marginTop: 6, fontSize: "10.5px", color: colors.grey11, textAlign: "center",
              border: `1px solid ${colors.grey88}`, borderRadius: 4, padding: "2px 8px",
              background: colors.grey96, maxWidth: 112, wordBreak: "break-word", lineHeight: "15px",
            }}>
              {requesterName}
            </div>
          </div>
        ) : <div style={{ width: 120 }} />}
      </div>
    </div>
  );
}

// ─── Main dialog ───────────────────────────────────────────────────────────────

interface Props {
  feedback: ProjectFeedback;
  onClose: () => void;
}

export function FeedbackModelDialog({ feedback, onClose }: Props) {
  const { pos, onHeaderMouseDown } = useDraggable();
  const [activeTab, setActiveTab] = useState<ModelTab>("model1");

  const tabs: { value: ModelTab; label: string }[] = [
    { value: "model1", label: "Model 1" },
    { value: "model2", label: "Model 2" },
  ];

  return createPortal(
    <>
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.12)", zIndex: 205 }}
        onClick={onClose}
      />
      <div
        style={{
          position: "fixed",
          left: `calc(50% + ${pos.x}px)`,
          top: `calc(50% + ${pos.y}px)`,
          transform: "translate(-50%, -50%)",
          zIndex: 206,
          background: colors.white,
          borderRadius: 8,
          boxShadow: "0px 8px 32px rgba(0,0,0,0.14), 0px 2px 8px rgba(0,0,0,0.06)",
          width: 620,
          maxWidth: "96vw",
          maxHeight: "92vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Inter','Segoe UI',sans-serif",
        }}
      >
        {/* Header */}
        <div
          onMouseDown={onHeaderMouseDown}
          style={{
            height: 72, display: "flex", alignItems: "center",
            padding: "0 20px", gap: 12, flexShrink: 0,
            cursor: "grab", userSelect: "none",
          }}
        >
          <div style={{
            width: 32, height: 32, borderRadius: 6, background: "#EBF3FC",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <FeedbackModelIcon color={colors.azure42} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: "15.6px", fontWeight: 700, color: colors.grey11,
              letterSpacing: "-0.1px", lineHeight: "21px",
            }}>
              Feedback Model
            </div>
            <div style={{ fontSize: "11.1px", color: colors.grey38, lineHeight: "17px", marginTop: 2 }}>
              View the feedback model representation.
            </div>
          </div>
          <button
            className="sl-close-btn"
            onClick={onClose}
            style={{
              width: 28, height: 28, display: "flex", alignItems: "center",
              justifyContent: "center", background: "transparent", border: "none",
              borderRadius: 4, cursor: "pointer", flexShrink: 0, padding: 0,
            }}
            title="Close"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Tab bar */}
        <div style={{
          height: 36, background: colors.white, display: "flex", alignItems: "flex-end",
          padding: "0 20px", borderBottom: `1px solid ${colors.grey88}`, flexShrink: 0,
        }}>
          {tabs.map(({ value, label }) => {
            const isActive = activeTab === value;
            return (
              <button
                key={value}
                onClick={() => setActiveTab(value)}
                style={{
                  height: 36, padding: "0 14px", border: "none", background: "none",
                  cursor: "pointer", fontSize: "12px",
                  fontWeight: isActive ? 700 : 400,
                  color: isActive ? colors.grey11 : colors.grey38,
                  borderBottom: isActive ? `2px solid ${colors.azure42}` : "2px solid transparent",
                  fontFamily: "inherit", whiteSpace: "nowrap",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflow: "auto" }}>
          {activeTab === "model1" && (
            <div style={{ padding: "24px 30px", overflowX: "auto" }}>
              <Model1 feedback={feedback} />
            </div>
          )}
          {activeTab === "model2" && <Model2 feedback={feedback} />}
        </div>
      </div>
    </>,
    document.body
  );
}
