// src/dialog/views/FlagView.tsx

import React, { useState, useEffect, useCallback } from "react";
import { FooterBar, DismissBtn, PrimaryBtn } from "@/dialog/components/FooterButtons";
import { Spinner } from "@fluentui/react-components";
import { useDialogComm } from "@/dialog/hooks/useDialogComm";
import { nowDate, formatDisplayDate } from "@/db/db";
import type { FlagEntityForAnalysis } from "@/types/db";

function localTime(): string {
  const d = new Date();
  const h = d.getHours(), m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

// ── Figma design tokens ───────────────────────────────────────────────────────
const COD_GRAY = "#1B1B1B";
const DOVE_GRAY = "#616161";
const SILVER = "#C7C7C7";
const LOCHMARA = "#0078D4";
const NARVIK = "#F5F5F5";
const CINDERELLA = "#EBF3FC";

const HEADER_H = 77.59;
const BANNER_H = 61;

const fieldRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  height: 32,
  marginBottom: 12,
};

const fieldLabel: React.CSSProperties = {
  width: 138,
  minWidth: 138,
  fontFamily: "Inter, 'Segoe UI', sans-serif",
  fontWeight: 700,
  fontSize: 11.6,
  lineHeight: "14px",
  color: COD_GRAY,
  flexShrink: 0,
};

const fieldInput: React.CSSProperties = {
  flex: 1,
  height: 32,
  background: "#FFFFFF",
  border: `1px solid ${SILVER}`,
  borderRadius: 4,
  padding: "0 11px",
  fontFamily: "Inter, 'Segoe UI', sans-serif",
  color: COD_GRAY,
  outline: "none",
  boxSizing: "border-box",
  fontSize: 12,
};

const chevronSvg = `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23616161' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`;

// ── Icons ────────────────────────────────────────────────────────────────────

function FlagIconBlue() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3.5 2V16M3.5 2H14L11 7.5L14 13H3.5"
        stroke={LOCHMARA}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FlagPropertyIcon() {
  return (
    <svg width="36" height="30" viewBox="0 0 36 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16.9719 15.6025H3.57409C3.34954 15.6025 3.125 15.378 3.125 15.1534V1.75573C3.125 1.53118 3.34954 1.30664 3.57409 1.30664H16.9719C17.1965 1.30664 17.421 1.53118 17.421 1.75573V15.1534C17.421 15.4528 17.1965 15.6025 16.9719 15.6025Z" fill="#4259C3"/>
      <path d="M3.64886 16.9494L0.0561362 13.3567C-0.0187121 13.2818 -0.0187121 13.207 0.0561362 13.1322L1.10401 12.0843C1.17886 12.0094 1.25371 12.0094 1.32856 12.0843L3.57401 14.3297C3.64886 14.4046 3.7237 14.4046 3.79855 14.3297L8.88824 9.31492C8.96309 9.24008 9.03793 9.24008 9.11278 9.31492L10.1607 10.3628C10.2355 10.4376 10.2355 10.5125 10.1607 10.5873L3.79855 16.9494C3.79855 16.9494 3.7237 16.9494 3.64886 16.9494Z" fill="#0CBA58"/>
      <path d="M17.3461 12.6828C17.6455 14.4791 19.0676 16.7245 21.3879 17.473C22.3609 17.7724 23.4088 17.7724 24.3818 17.473C26.7021 16.6497 28.1243 14.4043 28.4236 12.6828C28.723 12.6828 29.1721 12.2337 29.5464 10.7367C30.1452 8.71584 29.5464 8.41645 28.9476 8.41645C29.0224 8.11706 29.0973 7.89252 29.1721 7.59313C30.0703 2.3538 27.3758 2.12926 27.3758 2.12926C27.3758 2.12926 27.0015 1.30593 25.804 0.707153C24.9806 0.258067 23.9327 -0.116171 22.4358 0.0335243C21.9867 0.0335243 21.5376 0.108372 21.0885 0.258067C20.5646 0.407762 20.0406 0.707153 19.5915 1.00654C19.0676 1.30593 18.5437 1.75502 18.0946 2.2041C17.3461 2.87773 16.7473 3.7759 16.4479 4.97346C16.2234 5.79679 16.2982 6.69496 16.4479 7.66798C16.5228 7.96737 16.5976 8.19191 16.6725 8.4913C16.1485 8.41645 15.4749 8.71584 16.0737 10.8116C16.6725 12.2337 17.0467 12.6079 17.3461 12.6828Z" fill="#D9D9D9"/>
      <path d="M33.5133 19.5689C30.22 18.7456 27.5254 16.9492 27.5254 16.9492L25.4297 23.3113L25.0554 24.5088L24.6812 25.5567L23.5585 22.5628C26.253 18.9701 23.0345 18.9701 22.81 18.9701C22.6603 18.9701 19.3669 18.9701 22.0615 22.5628L20.9388 25.5567L20.5645 24.5088L20.2651 23.3113L18.1694 16.9492C18.1694 16.9492 15.4748 18.7456 12.1815 19.5689C9.78637 20.1677 9.71152 22.8622 9.78636 24.2094C9.78636 24.2094 9.93606 26.0058 10.0858 26.8291C10.0858 26.8291 14.876 29.823 22.8848 29.823C30.8936 29.823 35.6839 26.8291 35.6839 26.8291C35.8336 26.0058 35.9833 24.2094 35.9833 24.2094C36.0581 22.8622 35.9833 20.1677 33.5133 19.5689Z" fill="#4259C3"/>
    </svg>
  );
}


// ── Component ────────────────────────────────────────────────────────────────

export default function FlagView() {
  const { initData, submitSave, saving, closeDialog } = useDialogComm();

  const [entityName, setEntityName] = useState("");
  const [personFlagged, setPersonFlagged] = useState("");
  const [flagDate] = useState(() => nowDate());
  const [flagTime] = useState(() => localTime());
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (initData) {
      setPersonFlagged(initData.communicationPersonName ?? "");
      setEntityName(initData.applicationName ?? "");
    }
  }, [initData]);

  const save = useCallback(() => {
    if (!personFlagged.trim()) {
      setValidationError(
        "An entity is flagged to be analyzed at a given time, that entity is flagged by a person " +
        "to be analyzed at a time when it is appropriate. Since there is a relationship between " +
        "the person entity and the principle entity and the principle entity enables the analysis " +
        "of another entity, only the person entity possesses the ability to analyze another entity. " +
        "Another entity cannot be analyzed with the absence of the person entity. " +
        "Here I will need to identify the person who flags the entity for analysis."
      );
      return;
    }

    const payload: Omit<FlagEntityForAnalysis, "id"> = {
      actualSelection: initData?.selection ?? "",
      selectionType: (initData?.mode === "paragraph" ? "Paragraph" : "Selection") as "Selection" | "Paragraph",
      source: initData?.source ?? "Word Document",
      applicationName: entityName.trim(),
      communicationFunction: initData?.communicationFunction ?? "",
      communicationSignal: initData?.communicationSignal ?? "",
      projectName: initData?.projectName ?? "",
      flagDate,
      flagTime,
      personName: personFlagged.trim(),
      personEmail: initData?.personEmail ?? "",
      wasEntityAnalyzed: "No",
    };

    submitSave({ action: "SAVE_FLAG", payload });
    setSaved(true);
  }, [personFlagged, entityName, initData, flagDate, flagTime, submitSave]);

  if (!initData) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <Spinner size="medium" label="Loading…" />
      </div>
    );
  }

  const source = initData.source ?? "Word Document";
  const peopleList = initData.peopleList ?? [];

  const modalShell: React.CSSProperties = {
    width: "100%",
    height: "100vh",
    background: "#FFFFFF",
    fontFamily: "Inter, 'Segoe UI', sans-serif",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    position: "relative",
  };

  // ── Success state ────────────────────────────────────────────────────────
  if (saved) {
    return (
      <div style={modalShell}>
        {/* Header */}
        <div style={{ position: "relative", height: HEADER_H, flexShrink: 0 }}>
          <div style={{ position: "absolute", width: 32, height: 32, left: 20, top: 21, background: CINDERELLA, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FlagIconBlue />
          </div>
          <span style={{ position: "absolute", left: 64, top: 20, fontWeight: 700, fontSize: 15.9, lineHeight: "21px", letterSpacing: "-0.1px", color: COD_GRAY }}>
            Flag Entity For Analysis
          </span>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 40 }}>
          <div style={{ fontSize: 32, color: LOCHMARA }}>✓</div>
          <p style={{ fontSize: 13, color: COD_GRAY, textAlign: "center", maxWidth: 360, margin: 0, lineHeight: "20px" }}>
            The identified entity has been flagged for analysis. The window will now close.
          </p>
          <button
            onClick={closeDialog}
            style={{ height: 32, padding: "0 20px", background: LOCHMARA, border: "none", borderRadius: 4, color: "#FFFFFF", fontSize: 12.6, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", marginTop: 8 }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // ── Main form ────────────────────────────────────────────────────────────
  return (
    <div style={modalShell}>

      {/* HEADER — h: 77.59px */}
      <div style={{ position: "relative", height: HEADER_H, flexShrink: 0 }}>
        {/* Icon box: 32×32 at left:20, top:21 */}
        <div style={{ position: "absolute", width: 32, height: 32, left: 20, top: 21, background: CINDERELLA, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <FlagIconBlue />
        </div>
        {/* Title */}
        <span style={{ position: "absolute", left: 64, top: 20, fontWeight: 700, fontSize: 15.9, lineHeight: "21px", letterSpacing: "-0.1px", color: COD_GRAY }}>
          Flag Entity For Analysis
        </span>
        {/* Subtitle */}
        <span style={{ position: "absolute", left: 64, top: 43.8, fontWeight: 400, fontSize: 11.1, lineHeight: "17px", color: DOVE_GRAY }}>
          Review and confirm the flagged entity details before applying.
        </span>
      </div>

      {/* FLAG PROPERTY BANNER — h: 61px */}
      <div style={{ position: "relative", height: BANNER_H, background: NARVIK, flexShrink: 0, display: "flex", alignItems: "center" }}>
        <div style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)" }}>
          <FlagPropertyIcon />
        </div>
        <span style={{ position: "absolute", left: 68, fontWeight: 700, fontSize: 13.7, lineHeight: "17px", color: COD_GRAY }}>
          Flag Property
        </span>
      </div>

      {/* BODY */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 8px" }}>

        {validationError && (
          <div style={{ marginBottom: 12, background: "#FDE7E9", border: "1px solid #F1707B", borderRadius: 4, padding: "8px 12px", fontSize: 11.5, color: "#A4262C", lineHeight: "17px" }}>
            {validationError}
          </div>
        )}

        <div style={fieldRow}>
          <span style={fieldLabel}>Entity Name</span>
          <input
            style={fieldInput}
            value={entityName}
            onChange={(e) => { setEntityName(e.target.value); setValidationError(null); }}
            placeholder="Enter entity name…"
          />
        </div>

        <div style={fieldRow}>
          <span style={fieldLabel}>Date Flagged</span>
          <div style={{ ...fieldInput, display: "flex", alignItems: "center", pointerEvents: "none" }}>{formatDisplayDate(flagDate)}</div>
        </div>

        <div style={fieldRow}>
          <span style={fieldLabel}>Time Flagged</span>
          <div style={{ ...fieldInput, display: "flex", alignItems: "center", pointerEvents: "none" }}>{flagTime}</div>
        </div>

        <div style={fieldRow}>
          <span style={fieldLabel}>Entity Analyzed</span>
          <div style={{ ...fieldInput, display: "flex", alignItems: "center", pointerEvents: "none" }}>No</div>
        </div>

        <div style={fieldRow}>
          <span style={fieldLabel}>Entity Type</span>
          <div style={{ ...fieldInput, display: "flex", alignItems: "center", pointerEvents: "none" }}>{source}</div>
        </div>

        <div style={fieldRow}>
          <span style={fieldLabel}>
            Person Flagged <span style={{ color: "#C50F1F" }}>*</span>
          </span>
          {peopleList.length > 0 ? (
            <select
              style={{
                ...fieldInput,
                paddingRight: 28,
                appearance: "none",
                backgroundImage: chevronSvg,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 10px center",
                cursor: "pointer",
                color: personFlagged ? COD_GRAY : DOVE_GRAY,
              }}
              value={personFlagged}
              onChange={(e) => { setPersonFlagged(e.target.value); setValidationError(null); }}
            >
              <option value="">-- Select person --</option>
              {peopleList.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          ) : (
            <input
              style={fieldInput}
              value={personFlagged}
              onChange={(e) => { setPersonFlagged(e.target.value); setValidationError(null); }}
              placeholder="Enter person name…"
            />
          )}
        </div>

      </div>

      {/* FOOTER — h: 57px */}
      <FooterBar>
        <DismissBtn label="Cancel" onClick={closeDialog} />
        <PrimaryBtn label={saving ? "Saving…" : "Apply"} onClick={save} disabled={saving} />
      </FooterBar>

    </div>
  );
}
