// src/dialog/views/feedback/RequestSLFeedbackView.tsx

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Spinner, makeStyles } from "@fluentui/react-components";
import { CheckmarkRegular } from "@fluentui/react-icons";
import { useDialogComm } from "@/dialog/hooks/useDialogComm";
import { RichTextToolbar } from "@/dialog/components/RichTextToolbar";
import { RichEditor } from "@/dialog/components/RichEditor";
import { AttachFilePanel } from "@/dialog/views/analyze/panels/AttachFilePanel";
import { AttachFileDialog } from "@/dialog/components/AttachFileDialog";
import { ViewFileInformationDialog } from "@/dialog/components/ViewFileInformationDialog";
import { HamburgerIcon, ViewListFeedbackIcon, ViewListAnalysisIcon } from "@/dialog/components/Icons";
import { colors } from "@/styles/tokens";
import type { AttachFileToProject, SaveRequestSLFeedbackPayload } from "@/types/db";

type FileDraft = Omit<AttachFileToProject, "id" | "analysisId" | "feedbackId" | "flagId" | "articleId">;
type TabValue = "feedback" | "files";

const F = {
  borderInput: `1px solid #C7C7C7`,
  borderBox: `1px solid #E0E0E0`,
  bgCommandBar: "#F5F5F5",
  sepColor: "#E0E0E0",
} as const;

const TABS: { value: TabValue; label: string }[] = [
  { value: "feedback", label: "About Feedback" },
  { value: "files", label: "Attach Files" },
];

const useStyles = makeStyles({
  root: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: colors.white,
    overflow: "hidden",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  titleSection: {
    height: "78px",
    display: "flex",
    alignItems: "center",
    padding: "0 20px",
    gap: "12px",
    flexShrink: 0,
  },
  headerIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    background: colors.grey95,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  titles: { flex: 1, display: "flex", flexDirection: "column", gap: "3px" },
  titleText: {
    fontSize: "15.6px", fontWeight: "700", lineHeight: "21px",
    letterSpacing: "-0.1px", color: colors.grey11,
  },
  subtitleText: { fontSize: "10.9px", fontWeight: "400", lineHeight: "17px", color: colors.grey38 },
  commandBar: {
    height: "44px",
    background: F.bgCommandBar,
    display: "flex",
    alignItems: "center",
    padding: "0 12px",
    flexShrink: 0,
    gap: "0",
  },
  applyMainBtn: {
    height: "28px",
    minWidth: "175px",
    background: "#0078D4",
    borderRadius: "4px",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
    cursor: "pointer",
    padding: "0 10px",
    flexShrink: 0,
    fontFamily: "inherit",
    ":hover": { background: "#106EBE" },
  },
  applyMainBtnText: { fontSize: "11.6px", fontWeight: "700", color: colors.white, lineHeight: "14px" },
  cmdSep: { width: "1px", height: "20px", background: F.sepColor, margin: "0 8px", flexShrink: 0 },
  cmdIconBtn: {
    width: "28px",
    height: "28px",
    borderRadius: "3px",
    border: "none",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    padding: "0",
  },
  tabBar: {
    height: "36px",
    borderBottom: F.borderBox,
    display: "flex",
    alignItems: "flex-end",
    padding: "0 20px",
    flexShrink: 0,
    background: colors.white,
  },
  tabBtn: {
    position: "relative",
    height: "36px",
    display: "flex",
    alignItems: "center",
    padding: "0 12px",
    cursor: "pointer",
    background: "transparent",
    border: "none",
    fontSize: "12.2px",
    fontWeight: "400",
    lineHeight: "15px",
    color: colors.grey38,
    flexShrink: 0,
    fontFamily: "inherit",
    whiteSpace: "nowrap",
  },
  tabBtnActive: { fontWeight: "700", fontSize: "12.6px", color: colors.grey11 },
  tabActiveUnderline: {
    position: "absolute",
    bottom: "0",
    left: "12px",
    right: "12px",
    height: "2px",
    background: colors.azure42,
    borderRadius: "1px 1px 0 0",
  },
  body: { flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column" },
  footer: {
    height: "57px",
    borderTop: F.borderBox,
    display: "flex",
    alignItems: "center",
    padding: "0 20px",
    gap: "8px",
    flexShrink: 0,
    background: colors.white,
  },
  footerHint: { flex: 1, fontSize: "10.3px", fontWeight: "400", color: colors.grey38, lineHeight: "15px" },
});

const inputStyle: React.CSSProperties = {
  width: "100%", height: "32px", border: "1px solid #C7C7C7", borderRadius: "4px",
  padding: "0 11px", fontSize: "11.4px", fontFamily: "inherit", color: colors.grey11,
  background: colors.white, outline: "none", boxSizing: "border-box",
};

// From Person is the account holder (Communication Config name) — locked read-only.
const readonlyDisplayStyle: React.CSSProperties = {
  ...inputStyle, display: "flex", alignItems: "center",
  background: colors.grey96, color: colors.grey38, cursor: "default",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  padding: "0 32px 0 11px",
  appearance: "none" as const,
  WebkitAppearance: "none" as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23616161' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat" as const,
  backgroundPosition: "right 11px center",
  cursor: "pointer",
};

const rowStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", minHeight: "32px", marginBottom: "14px",
};

const rowTopStyle: React.CSSProperties = {
  display: "flex", alignItems: "flex-start", marginBottom: "14px",
};

const labelStyle: React.CSSProperties = {
  width: "178px", minWidth: "178px", fontSize: "11.4px", fontWeight: "400",
  color: colors.grey11, lineHeight: "14px", flexShrink: 0,
};

const labelTopStyle: React.CSSProperties = { ...labelStyle, paddingTop: "9px" };

const sectionDivider: React.CSSProperties = {
  height: "1px", background: "#E0E0E0", margin: "2px 0 16px 0",
};

const btnStyle = (variant: "cancel" | "apply"): React.CSSProperties => ({
  height: "32px", borderRadius: "4px", fontSize: "12.3px", fontFamily: "inherit",
  cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
  whiteSpace: "nowrap", flexShrink: 0,
  ...(variant === "cancel"
    ? { padding: "0 18px", background: colors.white, border: "1px solid #C7C7C7", color: colors.grey11, fontWeight: "400" }
    : { padding: "0 20px", background: colors.azure42, border: "none", color: colors.white, fontWeight: "700" }),
});

const SIGNAL_OPTIONS = [
  "Request",
  "Instruction",
  "Question",
  "Statement",
  "Response",
  "Notification",
  "Acknowledgement",
];

export default function RequestSLFeedbackView() {
  const styles = useStyles();
  const { initData, sendMessage, closeDialog, mailtoUrl } = useDialogComm();
  const editorRef = useRef<HTMLDivElement>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [footerBtnHover, setFooterBtnHover] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>("feedback");
  const [attachedFiles, setAttachedFiles] = useState<FileDraft[]>([]);
  const [showAddFile, setShowAddFile] = useState(false);
  const [viewFile, setViewFile] = useState<FileDraft | null>(null);

  const [form, setForm] = useState({
    fromPerson: "",
    applicationName: "",
    communicationFunction: "",
    communicationSignalType: "",
    communicationSubject: "",
    actualCommunication: "",
  });

  useEffect(() => {
    if (!initData) return;
    setForm((prev) => ({
      ...prev,
      fromPerson: prev.fromPerson || initData.communicationPersonName || "",
      applicationName: prev.applicationName || initData.applicationName || "",
      communicationFunction: prev.communicationFunction || initData.communicationFunction || "",
    }));
  // intentionally run once on initData arrival
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initData]);

  const updateForm = useCallback(<K extends keyof typeof form>(key: K, value: typeof form[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setValidationError(null);
  }, []);

  const save = useCallback(() => {
    if (!initData) return;

    const missing: string[] = [];
    if (!form.fromPerson.trim()) missing.push("From Person");
    if (!form.applicationName.trim()) missing.push("Application Name");
    if (!form.communicationFunction.trim()) missing.push("Communication Function");
    if (!form.communicationSignalType.trim()) missing.push("Communication Signal");
    if (!form.communicationSubject.trim()) missing.push("Feedback Subject");

    if (missing.length > 0) {
      setValidationError(`Required: ${missing.join(", ")}`);
      return;
    }

    const requestText = form.actualCommunication.replace(/<[^>]*>/g, "").trim();

    const payload: SaveRequestSLFeedbackPayload = {
      fromPerson: form.fromPerson,
      applicationName: form.applicationName,
      communicationFunction: form.communicationFunction,
      communicationSignalType: form.communicationSignalType,
      communicationSubject: form.communicationSubject,
      actualCommunication: requestText ? form.actualCommunication : "",
      files: attachedFiles.length > 0 ? attachedFiles : undefined,
    };

    sendMessage({ action: "SAVE_REQUEST_SL_FEEDBACK", payload });
  }, [form, attachedFiles, initData, sendMessage]);

  if (!initData) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <Spinner label="Loading..." />
      </div>
    );
  }

  // ── Success state ─────────────────────────────────────────────────────────────
  if (mailtoUrl !== null) {
    return (
      <div className={styles.root}>
        <div className={styles.titleSection}>
          <div className={styles.headerIcon}><HamburgerIcon /></div>
          <div className={styles.titles}>
            <span className={styles.titleText}>Request Feedback From Speak Logic</span>
            <span className={styles.subtitleText}>Feedback request saved successfully.</span>
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", padding: "32px 20px" }}>
          <div style={{ background: "#DFF6DD", border: "1px solid #107C10", borderRadius: "6px", padding: "16px 24px", fontSize: "13px", color: "#107C10", fontWeight: "600", textAlign: "center", maxWidth: "480px", width: "100%" }}>
            Feedback request saved successfully.
          </div>
          {mailtoUrl && (
            <a
              href={mailtoUrl}
              style={{ fontSize: "13px", color: colors.azure42, textDecoration: "underline", cursor: "pointer" }}
            >
              Open email draft in Outlook
            </a>
          )}
          <button style={btnStyle("apply")} onClick={closeDialog}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {/* ── Title ─────────────────────────────────────────────────────────── */}
      <div className={styles.titleSection}>
        <div className={styles.headerIcon}><HamburgerIcon /></div>
        <div className={styles.titles}>
          <span className={styles.titleText}>Request Feedback From Speak Logic</span>
          <span className={styles.subtitleText}>Request feedback from the Speak Logic team at support@speaklogic.org.</span>
        </div>
      </div>

      {/* ── Command bar ───────────────────────────────────────────────────── */}
      <div className={styles.commandBar}>
        <button
          className={styles.applyMainBtn}
          onClick={save}
        >
          <CheckmarkRegular style={{ fontSize: "13px", color: colors.white }} />
          <span className={styles.applyMainBtnText}>Request SL Feedback</span>
        </button>

        <div className={styles.cmdSep} />

        <button
          className={`${styles.cmdIconBtn} sl-icon-btn`}
          title="View List of Feedback (use Feedback History from the ribbon)"
          disabled
          style={{ opacity: 0.4, cursor: "default" }}
        >
          <ViewListFeedbackIcon />
        </button>

        <button
          className={`${styles.cmdIconBtn} sl-icon-btn`}
          title="View List of Analysis (use Analysis History from the ribbon)"
          disabled
          style={{ opacity: 0.4, cursor: "default" }}
        >
          <ViewListAnalysisIcon />
        </button>

        <div className={styles.cmdSep} />

        <RichTextToolbar editorRef={editorRef} />
      </div>

      {/* ── Tab bar ───────────────────────────────────────────────────────── */}
      <div className={styles.tabBar}>
        {TABS.map(({ value, label }) => {
          const isActive = activeTab === value;
          return (
            <button
              key={value}
              className={`${styles.tabBtn}${isActive ? ` ${styles.tabBtnActive}` : ""}`}
              onClick={() => setActiveTab(value)}
            >
              {label}
              {isActive && <span className={styles.tabActiveUnderline} />}
            </button>
          );
        })}
      </div>

      {/* ── Validation banner ─────────────────────────────────────────────── */}
      {validationError && (
        <div style={{ background: "#FDE7E9", borderBottom: "1px solid #F1707B", padding: "8px 20px", fontSize: "12px", color: "#A4262C", flexShrink: 0 }}>
          ⚠ {validationError}
        </div>
      )}

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div
        className={styles.body}
        style={activeTab === "files" ? { padding: 0 } : undefined}
      >

        {/* ── About Feedback tab ──────────────────────────────────────────── */}
        {activeTab === "feedback" && (
          <>
            {/* From Person — account holder, locked read-only */}
            <div style={rowStyle}>
              <span style={labelStyle}>From Person</span>
              <div style={readonlyDisplayStyle}>{form.fromPerson}</div>
            </div>

            <div style={sectionDivider} />

            {/* Application Name */}
            <div style={rowStyle}>
              <span style={labelStyle}>Application Name</span>
              <input
                style={inputStyle}
                value={form.applicationName}
                onChange={(e) => updateForm("applicationName", e.target.value)}
                placeholder="Enter application name"
              />
            </div>

            {/* Communication Function */}
            <div style={rowStyle}>
              <span style={labelStyle}>Communication Function</span>
              <input
                style={inputStyle}
                value={form.communicationFunction}
                onChange={(e) => updateForm("communicationFunction", e.target.value)}
                placeholder="Enter communication function"
              />
            </div>

            {/* Communication Signal */}
            <div style={rowStyle}>
              <span style={labelStyle}>Communication Signal</span>
              <select
                style={selectStyle}
                value={form.communicationSignalType}
                onChange={(e) => updateForm("communicationSignalType", e.target.value)}
              >
                <option value="">-- Select signal type --</option>
                {SIGNAL_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            {/* Feedback Subject */}
            <div style={rowStyle}>
              <span style={labelStyle}>Feedback Subject</span>
              <input
                style={inputStyle}
                value={form.communicationSubject}
                onChange={(e) => updateForm("communicationSubject", e.target.value)}
                placeholder="Enter feedback subject"
              />
            </div>

            <div style={sectionDivider} />

            {/* Actual Request For Feedback — RichEditor */}
            <div style={rowTopStyle}>
              <span style={labelTopStyle}>Actual Request For Feedback</span>
              <div style={{ flex: 1 }}>
                <RichEditor
                  ref={editorRef}
                  value={form.actualCommunication}
                  onChange={(v) => updateForm("actualCommunication", v)}
                  placeholder="Enter your feedback request to the Speak Logic team..."
                />
              </div>
            </div>
          </>
        )}

        {/* ── Attach Files tab ────────────────────────────────────────────── */}
        {activeTab === "files" && (
          <AttachFilePanel
            items={attachedFiles}
            onAdd={(item) => setAttachedFiles((prev) => [...prev, item])}
            onRemove={(idx) => setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))}
            onOpenAdd={() => setShowAddFile(true)}
            onOpenView={(f) => setViewFile(f)}
          />
        )}
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div className={styles.footer}>
        <span className={styles.footerHint}>Fill in all required fields, then click Request SL Feedback to save and send.</span>
        <button style={btnStyle("cancel")} onClick={closeDialog}>Cancel</button>
        <button
          style={{ ...btnStyle("apply"), background: footerBtnHover ? "#106EBE" : colors.azure42 }}
          onMouseEnter={() => setFooterBtnHover(true)}
          onMouseLeave={() => setFooterBtnHover(false)}
          onClick={save}
        >
          Request SL Feedback
        </button>
      </div>

      {/* ── Portals ───────────────────────────────────────────────────────── */}
      {showAddFile && (
        <AttachFileDialog
          onAdd={(item) => { setAttachedFiles((prev) => [...prev, item]); setShowAddFile(false); }}
          onClose={() => setShowAddFile(false)}
        />
      )}
      {viewFile && (
        <ViewFileInformationDialog
          file={viewFile}
          onClose={() => setViewFile(null)}
        />
      )}
    </div>
  );
}
