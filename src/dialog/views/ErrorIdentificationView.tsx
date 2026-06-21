// src/dialog/views/ErrorIdentificationView.tsx

/* global Office */

import React, { useRef, useState, useCallback, useEffect } from "react";
import { FooterBar, FooterHelperText, DismissBtn, PrimaryBtn } from "@/dialog/components/FooterButtons";
import { RichTextToolbar } from "@/dialog/components/RichTextToolbar";
import { RichEditor } from "@/dialog/components/RichEditor";
import { ErrorIcon } from "@/dialog/components/Icons";
import { FormRow, CmdSep } from "@/dialog/components/FormRow";
import { inputStyle, readonlyInputStyle } from "@/dialog/styles/formStyles";
import { useDialogComm } from "@/dialog/hooks/useDialogComm";
import { nowDate, nowTime, formatDisplayDate } from "@/db/db";
import type { ProjectError } from "@/types/db";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  red: "#D13438",
  blue: "#0078D4",
  grey11: "#1B1B1B",
  grey38: "#616161",
  grey78: "#C7C7C7",
  grey88: "#E0E0E0",
  grey96: "#F5F5F5",
  iconBg: "#FEF0F1",
  white: "#FFFFFF",
} as const;

const LABEL_W = 168;

// ─── Main component ───────────────────────────────────────────────────────────

export default function ErrorIdentificationView() {
  const { initData } = useDialogComm();
  const editorRef = useRef<HTMLDivElement>(null);
  const [toolbarCloseSignal, setToolbarCloseSignal] = useState(0);

  // Inline flow (Point 9): the selected document text is the actual error, and
  // the entity name ("File: … Page: …") is the source communication/application.
  const [actualError, setActualError] = useState("");
  const [fromActualCommunication, setFromActualCommunication] = useState("");
  const [entityErrorPointTo, setEntityErrorPointTo] = useState("");
  const [errorDescription, setErrorDescription] = useState("");

  // INIT arrives async after first render — prefill once when it lands.
  const prefilledRef = useRef(false);
  useEffect(() => {
    if (prefilledRef.current || !initData) return;
    prefilledRef.current = true;
    if (initData.selection) setActualError(initData.selection);
    if (initData.applicationName) setFromActualCommunication(initData.applicationName);
  }, [initData]);

  const errorDate = nowDate();
  const errorTime = nowTime();

  const close = useCallback(() => {
    try {
      Office.context.ui.messageParent(JSON.stringify({ action: "CLOSE" }));
    } catch {
      window.close();
    }
  }, []);

  const submit = useCallback(
    (isDraft: boolean) => {
      const payload: Omit<ProjectError, "id" | "analysisId"> = {
        errorNumber: 0,
        actualError,
        fromActualCommunication,
        entityErrorPointTo,
        errorDescription,
        errorDate,
        errorTime,
      };
      try {
        Office.context.ui.messageParent(
          JSON.stringify({ action: isDraft ? "SAVE_ERROR_DRAFT" : "ADD_ERROR", payload })
        );
      } catch {
        window.close();
      }
    },
    [actualError, fromActualCommunication, entityErrorPointTo, errorDescription, errorDate, errorTime]
  );

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        background: C.white,
        overflow: "hidden",
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        style={{
          height: 78,
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: 12,
          flexShrink: 0,
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
          <ErrorIcon />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "15.5px",
              fontWeight: 700,
              color: C.grey11,
              letterSpacing: "-0.1px",
              lineHeight: "21px",
            }}
          >
            Error Identification
          </div>
          <div style={{ fontSize: "11.1px", color: C.grey38, lineHeight: "17px", marginTop: 2 }}>
            Record and describe the error, link it to a communication or application, and submit for
            review.
          </div>
        </div>
      </div>

      {/* ── Command bar ─────────────────────────────────────────────────── */}
      <div
        style={{
          height: 44,
          background: C.grey96,
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          flexShrink: 0,
        }}
      >
        {/* Primary: Identify Error */}
        <button
          className="sl-icon-btn"
          onClick={() => submit(false)}
          style={{
            height: 28,
            padding: "0 14px",
            background: C.red,
            border: "none",
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
            flexShrink: 0,
            fontFamily: "inherit",
          }}
        >
          <ErrorIcon />
          <span
            style={{
              fontSize: "11.6px",
              fontWeight: 700,
              color: C.white,
              lineHeight: "14px",
              whiteSpace: "nowrap",
            }}
          >
            Identify Error
          </span>
        </button>

        <CmdSep />

        {/* Right: RichTextToolbar */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
          <RichTextToolbar
            editorRef={editorRef}
            closeSignal={toolbarCloseSignal}
            onOpen={() => setToolbarCloseSignal((s) => s + 1)}
          />
        </div>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <div
        style={{
          height: 36,
          background: C.white,
          display: "flex",
          alignItems: "flex-end",
          padding: "0 20px",
          borderBottom: `1px solid ${C.grey88}`,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "relative",
            height: 36,
            display: "flex",
            alignItems: "center",
            padding: "0 0 0 0",
            fontSize: "12.8px",
            fontWeight: 700,
            color: C.grey11,
            lineHeight: "15px",
          }}
        >
          About Error
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 2,
              background: C.red,
              borderRadius: "1px 1px 0 0",
            }}
          />
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}
      >
        {/* Section label */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: C.grey38,
            letterSpacing: "0.6px",
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          Error Details
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <FormRow label="Actual Error" labelWidth={LABEL_W}>
            <input
              style={inputStyle}
              placeholder="Enter actual error"
              value={actualError}
              onChange={(e) => setActualError(e.target.value)}
            />
          </FormRow>

          <FormRow label="From Actual Comm / App" labelWidth={LABEL_W}>
            <input
              style={inputStyle}
              placeholder="Enter communication or application source"
              value={fromActualCommunication}
              onChange={(e) => setFromActualCommunication(e.target.value)}
            />
          </FormRow>

          <FormRow label="Entity Error Point To" labelWidth={LABEL_W}>
            <input
              style={inputStyle}
              placeholder="Enter entity this error points to"
              value={entityErrorPointTo}
              onChange={(e) => setEntityErrorPointTo(e.target.value)}
            />
          </FormRow>
        </div>

        <div style={{ height: 1, background: C.grey88, margin: "16px 0" }} />

        {/* Date + Time row */}
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          {/* Error Date label */}
          <div
            style={{
              width: LABEL_W,
              minWidth: LABEL_W,
              fontSize: "11.8px",
              fontWeight: 700,
              color: C.grey11,
              flexShrink: 0,
            }}
          >
            Error Date
          </div>
          <input
            style={{ ...readonlyInputStyle, flex: 1 }}
            value={formatDisplayDate(errorDate)}
            readOnly
          />
          {/* Time label */}
          <div
            style={{
              width: 80,
              minWidth: 80,
              fontSize: "11.8px",
              fontWeight: 700,
              color: C.grey11,
              textAlign: "right",
              paddingRight: 12,
              flexShrink: 0,
            }}
          >
            Error Time
          </div>
          <input
            style={{ ...readonlyInputStyle, width: 120, flex: "0 0 120px" }}
            value={errorTime}
            readOnly
          />
        </div>

        <div style={{ height: 1, background: C.grey88, margin: "16px 0" }} />

        {/* Error Description */}
        <FormRow label="Error Description" alignTop labelWidth={LABEL_W}>
          <RichEditor
            ref={editorRef}
            value={errorDescription}
            onChange={setErrorDescription}
            placeholder="Describe the error in detail..."
            style={{ minHeight: 120 }}
          />
        </FormRow>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <FooterBar>
        <FooterHelperText>Error can be linked to a selection and submitted for review.</FooterHelperText>
        <DismissBtn label="Cancel" onClick={close} />
        <button
          className="sl-fr-btn"
          onClick={() => submit(true)}
          style={{
            height: 32,
            padding: "0 16px",
            background: C.white,
            border: `1px solid ${C.blue}`,
            borderRadius: 4,
            fontSize: "12.3px",
            fontFamily: "inherit",
            color: C.blue,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          Save Draft
        </button>
        <PrimaryBtn label="Submit Error" onClick={() => submit(false)} />
      </FooterBar>
    </div>
  );
}
