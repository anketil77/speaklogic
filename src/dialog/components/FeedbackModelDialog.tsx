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

function ChatBubbleIcon({ color: c = colors.grey38 }: { color?: string } = {}) {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
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
// Layout (all px, canvas W=540 H=330):
//   Left person box : x=10,  y=12, w=188, h=68  → centerX=104, centerY=46, bottom=80
//   Right person box: x=342, y=12, w=188, h=68  → centerX=436, centerY=46, bottom=80
//   Red dot         : cx=202, cy=46  (right-outside edge of left box)
//   J avatar (decorative): cx=270, cy=110
//   Blue dot left   : cx=28, cy=148
//   Blue dot right  : cx=512, cy=148
//   Left Feedback   : centered at (104, 195) → 96×24, x=56, y=183
//   Right Feedback  : centered at (436, 195) → 96×24, x=388, y=183
//   ECF diamond     : center=(270,195), half-w=46, half-h=32
//   Corrected Article: x=160, y=262, w=220, h=38
//
// Lines:
//   L-person → L-Feedback  : (104,80)→(104,183)       [vertical down]
//   L-Feedback → ECF left  : (152,195)→(224,195)       [horizontal right]
//   R-person → R-Feedback  : (436,80)→(436,183)        [vertical down]
//   R-Feedback → ECF right : (388,195)→(316,195)       [horizontal left]
//   ECF → CorrectArticle   : (270,227)→(270,262)       [vertical down]
//   Return arrow            : (224,195)→(8,195)→(8,46)→(10,46) [→ arrowhead right into left box]

const M1_W = 540;
const M1_H = 330;

const LP_X = 10, LP_Y = 12, LP_W = 188, LP_H = 68;
const RP_X = 342, RP_Y = 12, RP_W = 188, RP_H = 68;
const LP_CX = LP_X + LP_W / 2;   // 104
const RP_CX = RP_X + RP_W / 2;   // 436
const LP_CY = LP_Y + LP_H / 2;   // 46
const LP_BOT = LP_Y + LP_H;      // 80
const RP_BOT = RP_Y + RP_H;      // 80

const ECF_CX = 270, ECF_CY = 195, ECF_RX = 46, ECF_RY = 32;
const ECF_LEFT  = ECF_CX - ECF_RX; // 224
const ECF_RIGHT = ECF_CX + ECF_RX; // 316
const ECF_BOT   = ECF_CY + ECF_RY; // 227

const FB_W = 96, FB_H = 24;
const LFB_CX = LP_CX, RFB_CX = RP_CX, FB_CY = ECF_CY; // 195

const CA_X = 160, CA_Y = 262, CA_W = 220, CA_H = 38;

const ACLR = "#ABABAB"; // arrow / line color

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

  // left/right Feedback button rects
  const lfbX = LFB_CX - FB_W / 2; // 56
  const rfbX = RFB_CX - FB_W / 2; // 388

  // horizontal line endpoints
  const lfbRight = LFB_CX + FB_W / 2; // 152
  const rfbLeft  = RFB_CX - FB_W / 2; // 388

  return (
    <div style={{ position: "relative", width: M1_W, height: M1_H, flexShrink: 0, userSelect: "none" }}>
      {/* ── SVG: lines & shapes ── */}
      <svg
        style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}
        width={M1_W}
        height={M1_H}
      >
        <defs>
          <marker id="arr" markerWidth="7" markerHeight="7" refX="5.5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L7,3 Z" fill={ACLR} />
          </marker>
        </defs>

        {/* Left: person → L-shape elbow at Feedback level → ECF left vertex (single arrowhead at ECF) */}
        {showLeft && (
          <polyline
            points={`${LP_CX},${LP_BOT} ${LP_CX},${FB_CY} ${ECF_LEFT},${ECF_CY}`}
            fill="none" stroke={ACLR} strokeWidth="1.2" markerEnd="url(#arr)"
          />
        )}

        {/* Right: person → L-shape elbow at Feedback level → ECF right vertex (single arrowhead at ECF) */}
        {showRight && (
          <polyline
            points={`${RP_CX},${RP_BOT} ${RP_CX},${FB_CY} ${ECF_RIGHT},${ECF_CY}`}
            fill="none" stroke={ACLR} strokeWidth="1.2" markerEnd="url(#arr)"
          />
        )}

        {/* ECF diamond polygon */}
        <polygon
          points={`${ECF_CX},${ECF_CY - ECF_RY} ${ECF_RIGHT},${ECF_CY} ${ECF_CX},${ECF_CY + ECF_RY} ${ECF_LEFT},${ECF_CY}`}
          fill={colors.white} stroke={colors.green} strokeWidth="1.3"
        />

        {/* ECF → Corrected Article (vertical down) */}
        {showCa && (
          <line x1={ECF_CX} y1={ECF_BOT} x2={ECF_CX} y2={CA_Y}
            stroke={ACLR} strokeWidth="1.2" markerEnd="url(#arr)" />
        )}

        {/* Return arrow: ECF left → go left → go up → arrowhead right into left person box */}
        {showLeft && isApplied && (
          <polyline
            points={`${ECF_LEFT},${ECF_CY} 8,${ECF_CY} 8,${LP_CY} ${LP_X},${LP_CY}`}
            fill="none" stroke={ACLR} strokeWidth="1.2" markerEnd="url(#arr)"
          />
        )}
      </svg>

      {/* ── Left person box ── */}
      {showLeft && (
        <div style={{
          position: "absolute", left: LP_X, top: LP_Y, width: LP_W, height: LP_H,
          border: `1.3px solid ${colors.green}`, borderRadius: 10, background: colors.white,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 10px", boxSizing: "border-box",
        }}>
          <div style={{
            flex: 1, fontSize: "9.8px", color: colors.grey11, lineHeight: "14px", fontWeight: 500,
            marginRight: 6, overflow: "hidden",
            display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
          }}>
            {feedback.toPerson || "—"}
          </div>
          <InitialAvatar name={feedback.toPerson || "?"} size={36} bg="#C8D9EC" color="#1B5E8A" />
        </div>
      )}

      {/* Red dot — top-right corner area of left person box */}
      {showLeft && (
        <div style={{
          position: "absolute",
          left: LP_X + LP_W + 2,
          top: LP_Y + Math.round(LP_H * 0.32) - 6,
          width: 12, height: 12, borderRadius: "50%", background: "#E00000",
          border: `1.5px solid ${colors.white}`, zIndex: 3,
        }} />
      )}

      {/* Message icon — just right of the red dot */}
      {showLeft && (
        <button
          onClick={() => open("Entity Under Analysis", {
            plainText: feedback.communicationFunction || feedback.feedbackSubject || "—",
          })}
          title="Entity Under Analysis"
          style={{
            position: "absolute",
            left: LP_X + LP_W + 17,
            top: LP_Y + Math.round(LP_H * 0.32) - 8,
            background: "none", border: "none", cursor: "pointer", padding: 0,
            display: "flex", alignItems: "center", zIndex: 3,
          }}
        >
          <ChatBubbleIcon color={colors.grey38} />
        </button>
      )}

      {/* ── Right person box ── */}
      {showRight && (
        <div style={{
          position: "absolute", left: RP_X, top: RP_Y, width: RP_W, height: RP_H,
          border: `1.3px solid ${colors.green}`, borderRadius: 10, background: colors.white,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 10px", boxSizing: "border-box",
        }}>
          <div style={{
            flex: 1, fontSize: "9.8px", color: colors.grey11, lineHeight: "14px", fontWeight: 500,
            marginRight: 6, overflow: "hidden",
            display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
          }}>
            {feedback.fromPerson || "—"}
          </div>
          <InitialAvatar name={feedback.fromPerson || "?"} size={36} bg="#D4EDD0" color="#2D6B28" />
        </div>
      )}

      {/* J avatar — center, midway between person boxes and ECF diamond */}
      <div style={{
        position: "absolute",
        left: ECF_CX - 16, top: Math.round((LP_BOT + (ECF_CY - ECF_RY)) / 2) - 16,
        width: 32, height: 32, borderRadius: "50%",
        background: "#F5C842", border: `1.5px solid #D4A800`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "12px", fontWeight: 700, color: "#5A3E00",
        zIndex: 2,
      }}>
        J
      </div>

      {/* Blue dot left — inside diagram, left of left vertical line */}
      {showLeft && (
        <div style={{
          position: "absolute",
          left: LP_CX - 38,
          top: Math.round((LP_BOT + FB_CY) / 2) - 5,
          width: 10, height: 10, borderRadius: "50%", background: colors.azure42,
        }} />
      )}

      {/* Blue dot right — inside diagram, right of right vertical line */}
      {showRight && (
        <div style={{
          position: "absolute",
          left: RP_CX + 28,
          top: Math.round((LP_BOT + FB_CY) / 2) - 5,
          width: 10, height: 10, borderRadius: "50%", background: colors.azure42,
        }} />
      )}

      {/* ── Left Feedback button ── */}
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
            gap: 4, color: colors.grey38, fontSize: "10.5px", fontFamily: "inherit",
            zIndex: 3,
          }}
        >
          <ChatBubbleIcon />
          <span>Feedback</span>
        </button>
      )}

      {/* ── Right Feedback button ── */}
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
            gap: 4, color: colors.grey38, fontSize: "10.5px", fontFamily: "inherit",
            zIndex: 3,
          }}
        >
          <ChatBubbleIcon />
          <span>Feedback</span>
        </button>
      )}

      {/* ── ECF clickable overlay ── */}
      <button
        onClick={() => {
          if (isApplied && feedback.feedbackApplication) {
            open("Feedback Application", { htmlContent: feedback.feedbackApplication });
          }
        }}
        title={isApplied ? "Click to view feedback application" : "ECF"}
        style={{
          position: "absolute",
          left: ECF_LEFT, top: ECF_CY - ECF_RY,
          width: ECF_RX * 2, height: ECF_RY * 2,
          background: "none", border: "none",
          cursor: isApplied ? "pointer" : "default",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 2,
          zIndex: 2, fontFamily: "inherit", padding: 0,
        }}
      >
        <span style={{ fontSize: "10.5px", color: colors.grey38, fontWeight: 600 }}>ECF</span>
        <PencilIcon />
      </button>

      {/* ── Corrected Article box ── */}
      {showCa && (
        <button
          onClick={() => open("Corrected Article", { plainText: feedback.actualErrorSubstituted || "—" })}
          title="Click to view correction"
          style={{
            position: "absolute", left: CA_X, top: CA_Y, width: CA_W, height: CA_H,
            background: colors.white, border: `1.3px solid ${colors.green}`, borderRadius: 7,
            cursor: "pointer", padding: "0 10px",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            zIndex: 2, fontFamily: "inherit",
          }}
        >
          <span style={{ fontSize: "10.5px", color: colors.grey11, fontWeight: 500 }}>
            Corrected Article
          </span>
          <PencilIcon />
        </button>
      )}

      {/* ── Inline popup ── */}
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
            <path d="M0,0 L0,6 L7,3 Z" fill={ACLR} />
          </marker>
        </defs>
        <line x1={cx} y1={0} x2={cx} y2={24} stroke={ACLR} strokeWidth="1.2" />
        {showProvider && (
          <>
            <line x1={cx} y1={24} x2={leftX} y2={24} stroke={ACLR} strokeWidth="1.2" />
            <line x1={leftX} y1={24} x2={leftX} y2={57}
              stroke={ACLR} strokeWidth="1.2" markerEnd="url(#m2arr)" />
          </>
        )}
        {showRequester && (
          <>
            <line x1={cx} y1={24} x2={rightX} y2={24} stroke={ACLR} strokeWidth="1.2" />
            <line x1={rightX} y1={24} x2={rightX} y2={57}
              stroke={ACLR} strokeWidth="1.2" markerEnd="url(#m2arr)" />
          </>
        )}
        {!showProvider && !showRequester && (
          <line x1={cx} y1={24} x2={cx} y2={57}
            stroke={ACLR} strokeWidth="1.2" markerEnd="url(#m2arr)" />
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
