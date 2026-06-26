// src/dialog/components/FeedbackModelDialog.tsx

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useDraggable } from "@/dialog/hooks/useDraggable";
import { CloseIcon, FeedbackModelIcon } from "@/dialog/components/Icons";
import { colors } from "@/styles/tokens";
import type { ProjectFeedback } from "@/types/db";
import {
  InitialAvatar,
  ChatBubbleIcon,
  PencilIcon,
  InlinePopup,
  LINE_COLOR,
  BORDER_COLOR,
  NOT_APPLICABLE,
} from "@/dialog/components/modelShared";

type ModelTab = "model1" | "model2" | "model3";

// ─── State messages (client spec) ───────────────────────────────────────────────
const FB_PROVIDED_MSG =
  "The feedback is provided and has not been applied; there is no result for that feedback to show a correction was made";
const FB_REQUESTED_MSG =
  "The feedback is requested and has not been provided and applied; there is no result for that feedback to show a correction was made";

// ─── Request variant empty-state messages (client spec) ─────────────────────────
const REQ_FEEDBACK_EMPTY = "This is a feedback request, there is no feedback provided";
const REQ_ECF_EMPTY      = "No feedback is provided to apply";
const REQ_RESULT_EMPTY   = "No feedback application result, because no feedback is applied";
// ─── Received variant empty-state messages (client spec) ────────────────────────
const RCV_ENTITY_EMPTY = "No entity under analysis";
const RCV_RESULT_EMPTY = "No feedback application";

// Renders the ECF popup body: the bad word substituted out and the good word
// replaced in, each under its own label. Missing sides are simply omitted.
function buildEcfHtml(errorSubstituted: string, compensatorReplaced: string): string {
  const block = (label: string, value: string) =>
    value
      ? `<div style="margin-bottom:10px"><div style="font-size:11px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:2px">${label}</div><div>${value}</div></div>`
      : "";
  return block("Actual Error Substituted", errorSubstituted) + block("Actual Compensator Replaced", compensatorReplaced);
}

// ─── Derived feedback model (maps a ProjectFeedback to the diagram) ──────────────
function deriveModel(feedback: ProjectFeedback) {
  const ft = feedback.feedbackType;
  const isApplied = ft === "Applied";
  const isRequested = ft === "Requested";
  const isReceived = ft === "Received";

  // Recipient (left box) — the person the feedback is given TO.
  const recipient = feedback.toPerson?.trim() || "";
  // Provider (right box) — the person who GIVES the feedback. None yet when requested.
  const provider = (isRequested ? "" : feedback.fromPerson?.trim()) || "";

  // Entity Under Analysis = the text that contains the bad word (the selection).
  const entityText =
    feedback.actualSelection?.trim() ||
    feedback.communicationFunction?.trim() ||
    feedback.feedbackSubject?.trim() ||
    "";

  // Feedback Item = what is shared as feedback.
  //   selection / paragraph / analysis  → the selection / analysis text
  //   requested                          → the request message
  const feedbackItem = isRequested
    ? feedback.feedbackApplication?.trim() ||
      feedback.feedbackSubject?.trim() ||
      feedback.actualSelection?.trim() ||
      ""
    : feedback.actualSelection?.trim() ||
      feedback.feedbackSubject?.trim() ||
      "";

  // ECF = the error→compensator FUNCTION: it removes the bad word (error) and
  // replaces it with the good word (compensator). (Client correction 06-22: the
  // ECF node shows the substitution — Actual Error Substituted / Actual
  // Compensator Replaced — NOT the feedback application.)
  const ecfErrorSubstituted = feedback.actualErrorSubstituted?.trim() || "";
  const ecfCompensatorReplaced = feedback.actualCompensatorReplaced?.trim() || "";
  const hasEcf = !!(ecfErrorSubstituted || ecfCompensatorReplaced);

  // Feedback Application Result = the feedback application itself (the corrected
  // text/paragraph). (Client correction 06-22: the result always shows the
  // feedback application, e.g. the resulting paragraph after the correction.)
  const resultText = feedback.feedbackApplication?.trim() || "";
  const hasResult = isApplied && !!resultText;

  // Message shown when there is no result to display.
  const resultMessage = isRequested
    ? REQ_RESULT_EMPTY
    : isReceived
      ? RCV_RESULT_EMPTY
      : !isApplied
        ? FB_PROVIDED_MSG
        : "";

  return {
    ft,
    isApplied,
    isRequested,
    isReceived,
    recipient,
    provider,
    entityText,
    feedbackItem,
    ecfErrorSubstituted,
    ecfCompensatorReplaced,
    hasEcf,
    resultText,
    hasResult,
    resultMessage,
  };
}

// ─── Model 1 ───────────────────────────────────────────────────────────────────
// Straight orthogonal connectors (no curves) — items just touch the lines.
// A complete model always renders: any missing piece shows "Not Applicable".
//   Recipient box (left)  ← ECF        : "return feedback"
//   Provider box (right)  → ECF        : feedback given
//   ECF                   → Result box : Feedback Application Result
const M1_W = 540;
const M1_H = 400;

const LP_X = 14,  LP_Y = 16, LP_W = 190, LP_H = 64;   // recipient (left)
const RP_X = 336, RP_Y = 16, RP_W = 190, RP_H = 64;   // provider  (right)
const LP_CX = LP_X + LP_W / 2;   // 109
const RP_CX = RP_X + RP_W / 2;   // 431
const LP_BOT = LP_Y + LP_H;      // 80
const RP_BOT = RP_Y + RP_H;      // 80

const ECF_CX = 270, ECF_CY = 238, ECF_RX = 46, ECF_RY = 46;
const ECF_LEFT  = ECF_CX - ECF_RX; // 224
const ECF_RIGHT = ECF_CX + ECF_RX; // 316
const ECF_TOP   = ECF_CY - ECF_RY; // 192
const ECF_BOT   = ECF_CY + ECF_RY; // 284

const FB_W = 92, FB_H = 22;
const FB_CY = ECF_CY;              // 238

const CA_X = 165, CA_Y = 322, CA_W = 210, CA_H = 58;

function Model1({ feedback }: { feedback: ProjectFeedback }) {
  const [popup, setPopup] = useState<{
    title: string;
    htmlContent?: string;
    plainText?: string;
  } | null>(null);

  const m = deriveModel(feedback);

  const open = (title: string, opts: { htmlContent?: string; plainText?: string }) =>
    setPopup({ title, ...opts });

  // Feedback-label centers on the horizontal segment of each side path.
  const lfbCX = Math.round((ECF_LEFT + LP_CX) / 2);
  const rfbCX = Math.round((ECF_RIGHT + RP_CX) / 2);

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

        {/* Return path: ECF left → straight left → up into recipient box bottom */}
        <path
          d={`M ${ECF_LEFT - 2} ${FB_CY} L ${LP_CX} ${FB_CY} L ${LP_CX} ${LP_BOT + 4}`}
          fill="none" stroke={LINE_COLOR} strokeWidth="1.7"
          strokeLinecap="round" strokeLinejoin="round" markerEnd="url(#arr)"
        />

        {/* Provider path: provider box bottom → straight down → left into ECF right */}
        <path
          d={`M ${RP_CX} ${RP_BOT} L ${RP_CX} ${FB_CY} L ${ECF_RIGHT + 2} ${FB_CY}`}
          fill="none" stroke={LINE_COLOR} strokeWidth="1.7"
          strokeLinecap="round" strokeLinejoin="round" markerEnd="url(#arr)"
        />

        {/* Entity under analysis (contains the error) → ECF top.
            Starts from the left box right-edge center → right → straight down into ECF. */}
        <path
          d={`M ${LP_X + LP_W} ${LP_Y + LP_H / 2} L ${ECF_CX} ${LP_Y + LP_H / 2} L ${ECF_CX} ${ECF_TOP - 2}`}
          fill="none" stroke={LINE_COLOR} strokeWidth="1.7"
          strokeLinecap="round" strokeLinejoin="round" markerEnd="url(#arr)"
        />

        {/* ECF diamond */}
        <polygon
          points={`${ECF_CX},${ECF_TOP} ${ECF_RIGHT},${ECF_CY} ${ECF_CX},${ECF_BOT} ${ECF_LEFT},${ECF_CY}`}
          fill={colors.white} stroke={BORDER_COLOR} strokeWidth="2"
        />

        {/* ECF → Result box (straight down) */}
        <line
          x1={ECF_CX} y1={ECF_BOT}
          x2={ECF_CX} y2={CA_Y - 4}
          stroke={LINE_COLOR} strokeWidth="1.7"
          strokeLinecap="round" markerEnd="url(#arr)"
        />
      </svg>

      {/* ── Recipient box (left) ── */}
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
          {m.recipient || NOT_APPLICABLE}
        </div>
        <InitialAvatar name={m.recipient || "?"} size={42} bg="#C8B5DC" color="#5C3B7A" />
      </div>

      {/* ── Provider box (right) ── */}
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
          {m.provider || NOT_APPLICABLE}
        </div>
        <InitialAvatar name={m.provider || "?"} size={42} bg="#86c6e9" color="#1B5E8A" />
      </div>

      {/* Red dot (decorative) — outside right edge of recipient box, top */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: LP_X + LP_W + 8,
          top: LP_Y + 12,
          width: 14, height: 14, borderRadius: "50%", background: "#df4d75",
          zIndex: 6,
        }}
      />

      {/* Message icon — click to view entity under analysis */}
      <button
        onClick={() =>
          open("Entity Under Analysis", { htmlContent: m.entityText || undefined, plainText: m.entityText ? undefined : (m.isReceived ? RCV_ENTITY_EMPTY : NOT_APPLICABLE) })
        }
        title="Entity Under Analysis"
        style={{
          position: "absolute",
          left: LP_X + LP_W + 28,
          top: LP_Y + 8,
          background: "none", border: "none", cursor: "pointer", padding: 0,
          display: "flex", alignItems: "center", zIndex: 6,
        }}
      >
        <ChatBubbleIcon color="#7a807c" size={18} />
      </button>

      {/* J badge — top-right of ECF diamond */}
      <div style={{
        position: "absolute",
        left: ECF_CX + 6,
        top: ECF_TOP - 24,
        width: 32, height: 32, borderRadius: "50%",
        background: "#ffd340",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "14px", fontWeight: 700, color: "#3a2a00",
        boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
        zIndex: 7,
      }}>
        {(m.provider || m.recipient || "?").trim()[0]?.toUpperCase() ?? "?"}
      </div>

      {/* Left Feedback label (return feedback) — white bg masks the line */}
      <button
        onClick={() =>
          open("Feedback", { htmlContent: m.feedbackItem || undefined, plainText: m.feedbackItem ? undefined : (m.isRequested ? REQ_FEEDBACK_EMPTY : NOT_APPLICABLE) })
        }
        title="Click to view feedback"
        style={{
          position: "absolute", left: lfbCX - FB_W / 2, top: FB_CY - FB_H - 4,
          width: FB_W, height: FB_H,
          background: "none", border: "none", cursor: "pointer", padding: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 6, color: "#a4aaa6", fontSize: "12px", fontFamily: "inherit",
          fontWeight: 600, zIndex: 3,
        }}
      >
        <ChatBubbleIcon color="#a4aaa6" size={14} />
        <span>Feedback</span>
      </button>

      {/* Right Feedback label */}
      <button
        onClick={() =>
          open("Feedback", { htmlContent: m.feedbackItem || undefined, plainText: m.feedbackItem ? undefined : (m.isRequested ? REQ_FEEDBACK_EMPTY : NOT_APPLICABLE) })
        }
        title="Click to view feedback"
        style={{
          position: "absolute", left: rfbCX - FB_W / 2, top: FB_CY - FB_H - 4,
          width: FB_W, height: FB_H,
          background: "none", border: "none", cursor: "pointer", padding: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 6, color: "#a4aaa6", fontSize: "12px", fontFamily: "inherit",
          fontWeight: 600, zIndex: 3,
        }}
      >
        <ChatBubbleIcon color="#a4aaa6" size={14} />
        <span>Feedback</span>
      </button>

      {/* ECF clickable overlay — the error→compensator function (bad word out, good word in) */}
      <button
        onClick={() =>
          open("ECF — Error / Compensator Function", m.hasEcf
            ? { htmlContent: buildEcfHtml(m.ecfErrorSubstituted, m.ecfCompensatorReplaced) }
            : { plainText: m.isRequested ? REQ_ECF_EMPTY : NOT_APPLICABLE })
        }
        title="Click to view the error/compensator function"
        style={{
          position: "absolute",
          left: ECF_LEFT, top: ECF_TOP,
          width: ECF_RX * 2, height: ECF_RY * 2,
          background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 6, zIndex: 2, fontFamily: "inherit", padding: 0,
        }}
      >
        <span style={{ fontSize: "13px", color: "#4d5550", fontWeight: 700 }}>ECF</span>
        <PencilIcon color="#a8a8a8" />
      </button>

      {/* Feedback Application Result box (always rendered; N/A + message when no result) */}
      <button
        onClick={() => {
          if (m.hasResult) {
            open("Feedback Application Result", { htmlContent: m.resultText });
          } else {
            open("Feedback Application Result", { plainText: m.resultMessage || NOT_APPLICABLE });
          }
        }}
        title="Click to view the feedback application result"
        style={{
          position: "absolute", left: CA_X, top: CA_Y, width: CA_W, height: CA_H,
          background: colors.white, border: `2px solid ${BORDER_COLOR}`, borderRadius: 12,
          cursor: "pointer", padding: "0 14px",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
          zIndex: 2, fontFamily: "inherit",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: "12px", color: "#4b524e", fontWeight: 600 }}>
            Feedback Application Result
          </span>
          <PencilIcon color="#a8a8a8" />
        </span>
        {!m.hasResult && (
          <span style={{ fontSize: "9.5px", color: "#9aa09c", fontWeight: 600 }}>
            {NOT_APPLICABLE}
          </span>
        )}
      </button>

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
  const m = deriveModel(feedback);

  const providerName = m.provider || NOT_APPLICABLE;
  const recipientName = m.recipient || NOT_APPLICABLE;

  const givenSetText =
    feedback.feedbackApplication?.trim() ||
    feedback.actualSelection?.trim() ||
    feedback.feedbackSubject?.trim() ||
    "";
  const textPreview =
    givenSetText.length > 200 ? givenSetText.slice(0, 200) + "…" : givenSetText;

  // Connector viewBox 564×70 — both branches always rendered (complete model),
  // each ending in an arrowhead pointing down at its person.
  const cx = 282;     // mid of 564
  const leftX = 70;   // provider column center
  const rightX = 494; // recipient column center

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
        {textPreview
          ? <div dangerouslySetInnerHTML={{ __html: textPreview }} />
          : <em style={{ color: colors.grey38 }}>{NOT_APPLICABLE}</em>}
      </div>

      {/* Connector SVG — central stem + two arrowed branches (always present) */}
      <svg
        style={{ display: "block", width: "100%", overflow: "visible" }}
        height={70}
        viewBox="0 0 564 70"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <marker id="m2arr" markerWidth="7" markerHeight="7" refX="5.5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L7,3 Z" fill={LINE_COLOR} />
          </marker>
        </defs>
        {/* central stem — downward arrow into the split junction */}
        <line x1={cx} y1={0} x2={cx} y2={26} stroke={LINE_COLOR} strokeWidth="1.2"
          markerEnd="url(#m2arr)" />
        {/* provider branch (left) */}
        <line x1={cx} y1={26} x2={leftX} y2={26} stroke={LINE_COLOR} strokeWidth="1.2" />
        <line x1={leftX} y1={26} x2={leftX} y2={64}
          stroke={LINE_COLOR} strokeWidth="1.2" markerEnd="url(#m2arr)" />
        {/* recipient branch (right) */}
        <line x1={cx} y1={26} x2={rightX} y2={26} stroke={LINE_COLOR} strokeWidth="1.2" />
        <line x1={rightX} y1={26} x2={rightX} y2={64}
          stroke={LINE_COLOR} strokeWidth="1.2" markerEnd="url(#m2arr)" />
      </svg>

      {/* Person row — provider (LEFT), recipient (RIGHT) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 140 }}>
          <InitialAvatar name={providerName} size={56} bg="#C8B5DC" color="#5C3B7A" />
          <div style={{
            marginTop: 8, fontSize: "12px", fontWeight: 600,
            color: colors.grey11, textAlign: "center",
            maxWidth: 132, wordBreak: "break-word", lineHeight: "16px",
          }}>
            {providerName}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 140 }}>
          <InitialAvatar name={recipientName} size={56} bg="#86c6e9" color="#1B5E8A" />
          <div style={{
            marginTop: 8, fontSize: "12px", fontWeight: 600,
            color: colors.grey11, textAlign: "center",
            maxWidth: 132, wordBreak: "break-word", lineHeight: "16px",
          }}>
            {recipientName}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Model 3 ───────────────────────────────────────────────────────────────────
// Client spec (point 20): a horizontal box-flow whose shape depends on feedbackType.
//   Provided / Requested / Received → 3 boxes: From Person → Feedback → To Person
//   Applied                         → 2 boxes: Feedback → Feedback Application Result
// The Feedback box carries a text/chat icon → click → popup the per-state text:
//   Provided  → the feedback text
//   Applied   → the ECF text (same as the pen icon inside the ECF)
//   Requested → the request text (e.g. the selected text requested)
//   Received  → the received feedback text (e.g. Outlook blue-signal / template content)

const M3_BOX_W = 158;
const M3_BOX_H = 104;
const M3_ARROW = 44;

function M3Arrow() {
  return (
    <svg width={M3_ARROW} height={20} style={{ flexShrink: 0, overflow: "visible" }}>
      <defs>
        <marker id="m3arr" markerWidth="9" markerHeight="9" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L0,7 L7.5,3.5 Z" fill={LINE_COLOR} />
        </marker>
      </defs>
      <line
        x1={2} y1={10} x2={M3_ARROW - 4} y2={10}
        stroke={LINE_COLOR} strokeWidth="1.8" strokeLinecap="round" markerEnd="url(#m3arr)"
      />
    </svg>
  );
}

function M3PersonBox({ name, bg, color }: { name: string; bg: string; color: string }) {
  const display = name?.trim() || NOT_APPLICABLE;
  return (
    <div style={{
      width: M3_BOX_W, height: M3_BOX_H, flexShrink: 0,
      border: `2px solid ${BORDER_COLOR}`, borderRadius: 12, background: colors.white,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 8, padding: "0 10px", boxSizing: "border-box",
    }}>
      <InitialAvatar name={display} size={44} bg={bg} color={color} />
      <div style={{
        fontSize: "11px", fontWeight: 600, color: colors.grey11, textAlign: "center",
        lineHeight: "14px", maxWidth: M3_BOX_W - 18, overflow: "hidden",
        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
      }}>
        {display}
      </div>
    </div>
  );
}

function M3FeedbackBox({
  label, text, onOpen,
}: {
  label: string; text: string; onOpen: (title: string, text: string) => void;
}) {
  return (
    <button
      onClick={() => onOpen(label, text)}
      title="Click to view the feedback text"
      style={{
        width: M3_BOX_W, height: M3_BOX_H, flexShrink: 0,
        border: `2px solid ${BORDER_COLOR}`, borderRadius: 12, background: colors.white,
        cursor: "pointer", padding: "10px 12px", boxSizing: "border-box",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 8, fontFamily: "inherit",
      }}
    >
      <ChatBubbleIcon color="#7a807c" size={22} />
      <span style={{ fontSize: "11.5px", fontWeight: 700, color: colors.grey11, textAlign: "center" }}>
        {label}
      </span>
    </button>
  );
}

function M3ResultBox({
  label, text, onOpen,
}: {
  label: string; text: string; onOpen: (title: string, text: string) => void;
}) {
  return (
    <button
      onClick={() => onOpen(label, text)}
      title="Click to view the feedback application result"
      style={{
        width: M3_BOX_W, height: M3_BOX_H, flexShrink: 0,
        border: `2px solid ${BORDER_COLOR}`, borderRadius: 12, background: colors.white,
        cursor: "pointer", padding: "10px 12px", boxSizing: "border-box",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 6, fontFamily: "inherit",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: "11px", fontWeight: 700, color: colors.grey11, textAlign: "center" }}>
          {label}
        </span>
        <PencilIcon color="#a8a8a8" />
      </span>
      {!text.trim() && (
        <span style={{ fontSize: "9.5px", color: "#9aa09c", fontWeight: 600 }}>{NOT_APPLICABLE}</span>
      )}
    </button>
  );
}

function Model3({ feedback }: { feedback: ProjectFeedback }) {
  const [popup, setPopup] = useState<{ title: string; htmlContent?: string; plainText?: string } | null>(null);
  const m = deriveModel(feedback);
  const isReceived = m.ft === "Received";

  const onOpen = (title: string, text: string) =>
    setPopup({
      title,
      htmlContent: text.trim() ? text : undefined,
      plainText: text.trim() ? undefined : NOT_APPLICABLE,
    });

  // Per-state feedback-box text. For applied feedback this is the feedback
  // application (the corrected text), carried on resultText.
  const fbText = m.isApplied ? m.resultText : m.feedbackItem;
  // Per-state feedback-box label.
  const fbLabel = m.isRequested ? "Request" : isReceived ? "Received Feedback" : "Feedback";

  return (
    <div style={{ position: "relative", padding: "8px 4px 4px" }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 0, flexWrap: "nowrap", minWidth: "min-content",
      }}>
        {m.isApplied ? (
          <>
            <M3FeedbackBox label={fbLabel} text={fbText} onOpen={onOpen} />
            <M3Arrow />
            <M3ResultBox
              label="Feedback Application Result"
              text={m.hasResult ? m.resultText : ""}
              onOpen={onOpen}
            />
          </>
        ) : (
          <>
            <M3PersonBox name={m.provider} bg="#C8B5DC" color="#5C3B7A" />
            <M3Arrow />
            <M3FeedbackBox label={fbLabel} text={fbText} onOpen={onOpen} />
            <M3Arrow />
            <M3PersonBox name={m.recipient} bg="#86c6e9" color="#1B5E8A" />
          </>
        )}
      </div>

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
    { value: "model3", label: "Model 3" },
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
          {activeTab === "model3" && (
            <div style={{ padding: "24px 30px", overflowX: "auto" }}>
              <Model3 feedback={feedback} />
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
