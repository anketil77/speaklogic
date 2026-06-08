// src/dialog/components/ViewFeedbackRequestedDialog.tsx
// Read-only portal dialog showing a single CommSignalInfo (feedback request).
// Matches C# ViewFeedbackRequested.cs — no editing, no save, close only.

import React, { useCallback } from "react";
import { formatDisplayDate } from "@/db/db";
import { FooterBar, DismissBtn } from "@/dialog/components/FooterButtons";
import ReactDOM from "react-dom";
import { useDraggable } from "@/dialog/hooks/useDraggable";
import type { CommSignalInfo } from "@/types/db";
import { colors } from "@/styles/tokens";

interface Props {
  request: CommSignalInfo;
  onClose: () => void;
}

function FieldRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
      <span
        style={{
          fontWeight: 700,
          fontSize: 11.4,
          color: colors.grey38,
          minWidth: 172,
          flexShrink: 0,
          lineHeight: "18px",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 11.4,
          color: colors.grey11,
          lineHeight: "18px",
          wordBreak: "break-word",
        }}
      >
        {value || "—"}
      </span>
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 0.5,
        textTransform: "uppercase",
        color: colors.grey38,
        marginBottom: 8,
        marginTop: 14,
      }}
    >
      {text}
    </div>
  );
}

export function ViewFeedbackRequestedDialog({ request, onClose }: Props) {
  const { pos, onHeaderMouseDown } = useDraggable({ initialX: 80, initialY: 60 });

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const portal = (
    <>
      {/* Dim backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.25)",
          zIndex: 199,
        }}
        onClick={handleClose}
      />

      {/* Dialog */}
      <div
        style={{
          position: "fixed",
          left: pos.x,
          top: pos.y,
          width: 720,
          background: colors.white,
          borderRadius: 8,
          boxShadow: "0px 8px 32px rgba(0,0,0,0.14), 0px 2px 8px rgba(0,0,0,0.06)",
          zIndex: 200,
          display: "flex",
          flexDirection: "column",
          fontFamily: "Inter, Segoe UI, sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Header — draggable */}
        <div
          onMouseDown={onHeaderMouseDown}
          style={{
            height: 56,
            background: "#F5F5F5",
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            gap: 10,
            cursor: "move",
            userSelect: "none",
            borderBottom: `1px solid ${colors.grey88}`,
            flexShrink: 0,
          }}
        >
          {/* Icon badge */}
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 5,
              background: "#EBF3FC",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 2C1 1.45 1.45 1 2 1H12C12.55 1 13 1.45 13 2V9C13 9.55 12.55 10 12 10H4L1 13V10H2C1.45 10 1 9.55 1 9V2Z" stroke="#0078D4" strokeWidth="1.3" strokeLinejoin="round" />
              <line x1="3.5" y1="4"   x2="10.5" y2="4"   stroke="#0078D4" strokeWidth="1.1" strokeLinecap="round" />
              <line x1="3.5" y1="6.5" x2="10.5" y2="6.5" stroke="#0078D4" strokeWidth="1.1" strokeLinecap="round" />
            </svg>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13.4, color: colors.grey11, lineHeight: "18px" }}>
              View Feedback Request
            </div>
            <div style={{ fontSize: 10.6, color: colors.grey38, lineHeight: "15px" }}>
              Read-only view of a feedback request.
            </div>
          </div>

          {/* Close */}
          <button
            onClick={handleClose}
            style={{
              width: 24,
              height: 24,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 3,
              flexShrink: 0,
            }}
            title="Close"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L9 9M9 1L1 9" stroke="#616161" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 20px 20px", overflowY: "auto", maxHeight: 460 }}>
          {/* Request fields */}
          <SectionLabel text="Feedback Request Details" />
          <FieldRow label="From Person"            value={request.fromPerson} />
          <FieldRow label="To Person"              value={request.toPerson} />
          <FieldRow label="Person Address"         value={request.personAddress} />
          <FieldRow label="Application Name"       value={request.applicationName} />
          <FieldRow label="Communication Function" value={request.communicationFunction} />
          <FieldRow label="Communication Signal"   value={request.communicationSignalType} />
          <FieldRow label="Feedback Subject"       value={request.communicationSubject} />
          <FieldRow label="Feedback Date"          value={formatDisplayDate(request.communicationDate)} />
          <FieldRow label="Feedback Time"          value={request.communicationTime} />

          {/* Rich text fields */}
          {request.actualCommunication && (
            <>
              <SectionLabel text="Actual Request For Feedback" />
              <div
                style={{
                  border: `1px solid ${colors.grey88}`,
                  borderRadius: 4,
                  padding: "8px 10px",
                  fontSize: 11.4,
                  lineHeight: "18px",
                  color: colors.grey11,
                  background: "#FAFAFA",
                  minHeight: 40,
                }}
                dangerouslySetInnerHTML={{ __html: request.actualCommunication }}
              />
            </>
          )}

          {request.actualSelection && (
            <>
              <SectionLabel text="Actual Selection" />
              <div
                style={{
                  border: `1px solid ${colors.grey88}`,
                  borderRadius: 4,
                  padding: "8px 10px",
                  fontSize: 11.4,
                  lineHeight: "18px",
                  color: colors.grey11,
                  background: "#FAFAFA",
                  minHeight: 40,
                }}
                dangerouslySetInnerHTML={{ __html: request.actualSelection }}
              />
            </>
          )}
        </div>

        {/* Footer */}
        <FooterBar><DismissBtn label="Close" onClick={handleClose} /></FooterBar>
      </div>
    </>
  );

  return ReactDOM.createPortal(portal, document.body);
}
