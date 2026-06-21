// src/dialog/views/CompensatorView.tsx

/* global Office */

import React, { useRef, useState, useCallback, useEffect } from "react";
import { FooterBar, FooterHelperText, DismissBtn, PrimaryBtn } from "@/dialog/components/FooterButtons";
import { RichTextToolbar } from "@/dialog/components/RichTextToolbar";
import { RichEditor } from "@/dialog/components/RichEditor";
import { CompensatorIcon } from "@/dialog/components/Icons";
import { FormRow, CmdSep } from "@/dialog/components/FormRow";
import { inputStyle, readonlyInputStyle } from "@/dialog/styles/formStyles";
import { useDialogComm } from "@/dialog/hooks/useDialogComm";
import { nowDate, nowTime, formatDisplayDate } from "@/db/db";
import type { ProjectCompensator } from "@/types/db";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  blue: "#0078D4",
  grey11: "#1B1B1B",
  grey38: "#616161",
  grey78: "#C7C7C7",
  grey88: "#E0E0E0",
  grey96: "#F5F5F5",
  iconBg: "#EBF3FC",
  white: "#FFFFFF",
} as const;

const LABEL_W = 178;

function SelectArrow() {
  return (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ pointerEvents: "none" }}>
      <path d="M1 1L5 5L9 1" stroke={C.grey38} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StyledSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{ position: "relative", width: "100%" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...inputStyle,
          appearance: "none",
          paddingRight: 30,
          cursor: "pointer",
        }}
      >
        {children}
      </select>
      <div
        style={{
          position: "absolute",
          right: 10,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
        }}
      >
        <SelectArrow />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface CompensatorViewProps {
  /** List of existing error texts passed via URL param, used to populate the dropdown. */
  existingErrors?: string[];
}

export default function CompensatorView({ existingErrors }: CompensatorViewProps) {
  const { initData } = useDialogComm();
  const editorRef = useRef<HTMLDivElement>(null);
  const [toolbarCloseSignal, setToolbarCloseSignal] = useState(0);

  const [actualCompensator, setActualCompensator] = useState("");
  const [actualErrorReplaced, setActualErrorReplaced] = useState("");
  const [inActualCommunication, setInActualCommunication] = useState("");
  const [compensatorDescription, setCompensatorDescription] = useState("");

  // Inline flow (Point 9): the green-selected text is the actual compensator;
  // the error list comes from inlineErrors so "Actual Error To Replace" is a
  // dropdown of errors already identified in the document.
  const errorOptions = existingErrors ?? initData?.inlineErrors ?? [];
  const prefilledRef = useRef(false);
  useEffect(() => {
    if (prefilledRef.current || !initData) return;
    prefilledRef.current = true;
    if (initData.selection) setActualCompensator(initData.selection);
    if (initData.applicationName) setInActualCommunication(initData.applicationName);
  }, [initData]);

  const compensatorDate = nowDate();
  const compensatorTime = nowTime();

  const close = useCallback(() => {
    try {
      Office.context.ui.messageParent(JSON.stringify({ action: "CLOSE" }));
    } catch {
      window.close();
    }
  }, []);

  const submit = useCallback(
    (isDraft: boolean) => {
      const payload: Omit<ProjectCompensator, "id" | "analysisId"> = {
        compensatorNumber: 0,
        actualCompensator,
        actualErrorReplaced,
        inActualCommunication,
        compensatorDescription,
        compensatorDate,
        compensatorTime,
      };
      try {
        Office.context.ui.messageParent(
          JSON.stringify({ action: isDraft ? "SAVE_COMPENSATOR_DRAFT" : "ADD_COMPENSATOR", payload })
        );
      } catch {
        window.close();
      }
    },
    [
      actualCompensator,
      actualErrorReplaced,
      inActualCommunication,
      compensatorDescription,
      compensatorDate,
      compensatorTime,
    ]
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
          <CompensatorIcon />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "15.4px",
              fontWeight: 700,
              color: C.grey11,
              letterSpacing: "-0.1px",
              lineHeight: "21px",
            }}
          >
            Compensator
          </div>
          <div style={{ fontSize: "11.1px", color: C.grey38, lineHeight: "17px", marginTop: 2 }}>
            Identify and describe a compensator, link it to an actual error, and submit for review.
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
        {/* Primary: Identify Compensator */}
        <button
          className="sl-icon-btn"
          onClick={() => submit(false)}
          style={{
            height: 28,
            padding: "0 14px",
            background: C.blue,
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
          <CompensatorIcon color="#FFFFFF" />
          <span
            style={{
              fontSize: "11.4px",
              fontWeight: 700,
              color: C.white,
              lineHeight: "14px",
              whiteSpace: "nowrap",
            }}
          >
            Identify Compensator
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
            fontSize: "12.6px",
            fontWeight: 700,
            color: C.grey11,
            lineHeight: "15px",
          }}
        >
          About Compensator
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
          Compensator Details
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <FormRow label="Actual Compensator">
            <input
              style={inputStyle}
              placeholder="Enter actual compensator"
              value={actualCompensator}
              onChange={(e) => setActualCompensator(e.target.value)}
            />
          </FormRow>

          <FormRow label="Actual Error To Replace">
            {errorOptions.length > 0 ? (
              <StyledSelect value={actualErrorReplaced} onChange={setActualErrorReplaced}>
                <option value="">Select actual error</option>
                {errorOptions.map((err, i) => (
                  <option key={i} value={err}>
                    {err}
                  </option>
                ))}
              </StyledSelect>
            ) : (
              <input
                style={inputStyle}
                placeholder="Enter actual error to replace"
                value={actualErrorReplaced}
                onChange={(e) => setActualErrorReplaced(e.target.value)}
              />
            )}
          </FormRow>

          <FormRow label="In Actual App / Comm">
            <input
              style={inputStyle}
              placeholder="Enter application or communication"
              value={inActualCommunication}
              onChange={(e) => setInActualCommunication(e.target.value)}
            />
          </FormRow>
        </div>

        <div style={{ height: 1, background: C.grey88, margin: "16px 0" }} />

        {/* Date + Time row */}
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          <div
            style={{
              width: LABEL_W,
              minWidth: LABEL_W,
              fontSize: "11.6px",
              fontWeight: 700,
              color: C.grey11,
              flexShrink: 0,
            }}
          >
            Compensator Date
          </div>
          <input
            style={{ ...readonlyInputStyle, flex: 1 }}
            value={formatDisplayDate(compensatorDate)}
            readOnly
          />
          <div
            style={{
              width: 100,
              minWidth: 100,
              fontSize: "11.6px",
              fontWeight: 700,
              color: C.grey11,
              textAlign: "right",
              paddingRight: 12,
              flexShrink: 0,
            }}
          >
            Time
          </div>
          <input
            style={{ ...readonlyInputStyle, width: 120, flex: "0 0 120px" }}
            value={compensatorTime}
            readOnly
          />
        </div>

        <div style={{ height: 1, background: C.grey88, margin: "16px 0" }} />

        {/* Compensator Description */}
        <FormRow label="Compensator Description" alignTop>
          <RichEditor
            ref={editorRef}
            value={compensatorDescription}
            onChange={setCompensatorDescription}
            placeholder="Describe the compensator in detail..."
            style={{ minHeight: 140 }}
          />
        </FormRow>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <FooterBar>
        <FooterHelperText>Compensator can be linked to an actual error and submitted for review.</FooterHelperText>
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
        <PrimaryBtn label="Submit Compensator" onClick={() => submit(false)} />
      </FooterBar>
    </div>
  );
}
