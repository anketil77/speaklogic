// src/dialog/views/feedback/ProvideFeedbackView.tsx

import React, { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { Spinner, makeStyles } from "@fluentui/react-components";
import { CheckmarkRegular } from "@fluentui/react-icons";
import { useDialogComm } from "@/dialog/hooks/useDialogComm";
import { RichTextToolbar } from "@/dialog/components/RichTextToolbar";
import { RichEditor } from "@/dialog/components/RichEditor";
import { HamburgerIcon, PfFeedbackListIcon, PfAnalysisListIcon, PfFileInfoIcon } from "@/dialog/components/Icons";
import { PanelTable, PanelTableCol } from "@/dialog/components/PanelTable";
import { nowDate, nowTime } from "@/db/db";
import { colors } from "@/styles/tokens";
import type { SaveFeedbackPayload } from "@/types/db";
import { sanitizeWordHtml } from "@/dialog/utils/sanitizeWordHtml";

const F = {
  borderInput: `1px solid #C7C7C7`,
  borderBox: `1px solid #E0E0E0`,
  bgCommandBar: "#F5F5F5",
  sepColor: "#E0E0E0",
} as const;

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
    background: colors.grey95,   // #EBF3FC
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
    minWidth: "143px",
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

type TabValue = "feedback" | "selection" | "questions" | "errors" | "compensators" | "answers" | "files";

const TABS: { value: TabValue; label: string }[] = [
  { value: "feedback", label: "About Feedback" },
  { value: "questions", label: "Analysis Question" },
  { value: "errors", label: "Errors" },
  { value: "compensators", label: "Compensators" },
  { value: "answers", label: "Answers" },
  { value: "files", label: "Attached Files" },
];

// "Selection" tab is inserted at position #2 only when feedback is provided
// from a selection/paragraph (i.e. raw selected text is present).
const SELECTION_TAB: { value: TabValue; label: string } = { value: "selection", label: "Selection" };

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
  width: "170px", minWidth: "170px", fontSize: "11.4px", fontWeight: "400",
  color: colors.grey11, lineHeight: "14px", flexShrink: 0,
};

const labelTopStyle: React.CSSProperties = { ...labelStyle, paddingTop: "9px" };

const btnStyle = (variant: "cancel" | "apply"): React.CSSProperties => ({
  height: "32px", borderRadius: "4px", fontSize: "12.3px", fontFamily: "inherit",
  cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
  whiteSpace: "nowrap", flexShrink: 0,
  ...(variant === "cancel"
    ? { padding: "0 18px", background: colors.white, border: "1px solid #C7C7C7", color: colors.grey11, fontWeight: "400" }
    : { padding: "0 20px", background: colors.azure42, border: "none", color: colors.white, fontWeight: "700" }),
});

// ─── Read-only tab column definitions ────────────────────────────────────────
const PFV_Q_COLS: PanelTableCol<string[]>[] = [
  { header: "#", width: "8%", render: (r) => r[0] },
  { header: "Question", width: "44%", render: (r) => r[1], truncate: true },
  { header: "Points To", width: "30%", render: (r) => r[2], truncate: true },
  { header: "Status", width: "18%", render: (r) => r[3], truncate: true },
];
const PFV_ERR_COLS: PanelTableCol<string[]>[] = [
  { header: "#", width: "8%", render: (r) => r[0] },
  { header: "Actual Error", width: "38%", render: (r) => r[1], truncate: true },
  { header: "From Communication", width: "30%", render: (r) => r[2], truncate: true },
  { header: "Points To", width: "24%", render: (r) => r[3], truncate: true },
];
const PFV_COMP_COLS: PanelTableCol<string[]>[] = [
  { header: "#", width: "8%", render: (r) => r[0] },
  { header: "Compensator", width: "36%", render: (r) => r[1], truncate: true },
  { header: "Error Replaced", width: "28%", render: (r) => r[2], truncate: true },
  { header: "In Communication", width: "28%", render: (r) => r[3], truncate: true },
];
const PFV_ANS_COLS: PanelTableCol<string[]>[] = [
  { header: "#", width: "8%", render: (r) => r[0] },
  { header: "Question", width: "30%", render: (r) => r[1], truncate: true },
  { header: "Answer", width: "40%", render: (r) => r[2], truncate: true },
  { header: "Points To", width: "22%", render: (r) => r[3], truncate: true },
];
const PFV_FILE_COLS: PanelTableCol<string[]>[] = [
  { header: "#", width: "8%", render: (r) => r[0] },
  { header: "File Name", width: "50%", render: (r) => r[1], truncate: true },
  { header: "Type", width: "20%", render: (r) => r[2], truncate: true },
  { header: "Date", width: "22%", render: (r) => r[3], truncate: true },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function ProvideFeedbackView() {
  const styles = useStyles();
  const { initData, sendMessage, closeDialog, mailtoUrl } = useDialogComm();
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<TabValue>("feedback");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [footerBtnHover, setFooterBtnHover] = useState(false);

  const [form, setForm] = useState({
    fromPerson: "",
    toPerson: "",
    toPersonEmail: "",
    applicationName: "",
    communicationFunction: "",
    feedbackSubject: "",
    actualFeedbackProvided: "",
  });

  const analysisData = initData?.analysisData;

  // Selection tab + formatted selection (only when feedback is from a selection/paragraph).
  const hasSelection = !!initData?.selection;
  const selectionHtml = useMemo(
    () => (initData?.selectionHtml ? sanitizeWordHtml(initData.selectionHtml) : ""),
    [initData?.selectionHtml],
  );
  const visibleTabs = useMemo(
    () => (hasSelection ? [TABS[0], SELECTION_TAB, ...TABS.slice(1)] : TABS),
    [hasSelection],
  );

  // Pre-fill from init data on first load
  useEffect(() => {
    if (!initData) return;
    setForm((prev) => ({
      ...prev,
      fromPerson: prev.fromPerson || analysisData?.fromPerson || initData.communicationPersonName || "",
      applicationName: prev.applicationName || initData.applicationName || "",
      communicationFunction: prev.communicationFunction || initData.communicationFunction || "",
      actualFeedbackProvided: prev.actualFeedbackProvided || analysisData?.actualAnalysis || "",
    }));
  // intentionally run once on initData arrival
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initData]);

  const peopleEmailMap = initData?.peopleEmailMap ?? {};

  const updateForm = useCallback(<K extends keyof typeof form>(key: K, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // auto-fill email when a known person is picked from the dropdown
      if (key === "toPerson" && value && peopleEmailMap[value] !== undefined) {
        next.toPersonEmail = peopleEmailMap[value];
      }
      return next;
    });
    setValidationError(null);
  }, [peopleEmailMap]);

  const save = useCallback(() => {
    if (!initData) return;

    const feedbackText = form.actualFeedbackProvided.replace(/<[^>]*>/g, "").trim();

    const missing: string[] = [];
    if (!form.toPerson.trim()) missing.push("To Person");
    if (!form.applicationName.trim()) missing.push("Application Name");
    if (!form.communicationFunction.trim()) missing.push("Communication Function");
    if (!form.feedbackSubject.trim()) missing.push("Feedback Subject");
    if (!feedbackText) missing.push("Actual Feedback Provided");

    if (missing.length > 0) {
      setValidationError(`Required: ${missing.join(", ")}`);
      setActiveTab("feedback");
      return;
    }

    const payload: SaveFeedbackPayload = {
      feedback: {
        feedbackApplication: form.actualFeedbackProvided,
        feedbackDate: nowDate(),
        feedbackTime: nowTime(),
        fromPerson: form.fromPerson,
        toPerson: form.toPerson,
        feedbackSubject: form.feedbackSubject,
        internalFeedbackName: `Text selected from ${initData.source} on ${nowDate()}`,
        feedbackType: "Provided",
        // Persist the formatted (HTML) selection so View Feedback keeps the
        // original Word formatting; fall back to plain text when no HTML.
        actualSelection: selectionHtml || initData.selection,
        selectionType: initData.source,
        actualErrorSubstituted: "",
        actualCompensatorReplaced: "",
        source: initData.source,
        applicationName: form.applicationName,
        communicationFunction: form.communicationFunction,
        communicationSignal: initData.communicationSignal,
        projectName: initData.projectName,
        personName: initData.personName,
        personEmail: initData.personEmail,
        analysisId: analysisData?.id,
      },
    };

    sendMessage({ action: "SAVE_FEEDBACK", payload: { ...payload, toPersonEmail: form.toPersonEmail.trim(), files: analysisData?.files ?? [] } });
    // Host will save and respond with SAVED (+ mailtoUrl). Dialog stays open until user clicks Close.
  }, [form, initData, analysisData, selectionHtml, sendMessage]);

  if (!initData) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <Spinner label="Loading..." />
      </div>
    );
  }

  // ── Success state — shown after host confirms SAVED ──────────────────────────
  if (mailtoUrl !== null) {
    return (
      <div className={styles.root}>
        <div className={styles.titleSection}>
          <div className={styles.headerIcon}><HamburgerIcon /></div>
          <div className={styles.titles}>
            <span className={styles.titleText}>Provide Feedback</span>
            <span className={styles.subtitleText}>Feedback saved successfully.</span>
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", padding: "32px 20px" }}>
          <div style={{ background: "#DFF6DD", border: "1px solid #107C10", borderRadius: "6px", padding: "16px 24px", fontSize: "13px", color: "#107C10", fontWeight: "600", textAlign: "center", maxWidth: "480px", width: "100%" }}>
            Feedback saved successfully.
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

  const peopleList = initData.peopleList ?? [];

  return (
    <div className={styles.root}>
      {/* ── Title ─────────────────────────────────────────────────────────── */}
      <div className={styles.titleSection}>
        <div className={styles.headerIcon}><HamburgerIcon /></div>
        <div className={styles.titles}>
          <span className={styles.titleText}>Provide Feedback</span>
          <span className={styles.subtitleText}>Provide feedback and link it to the relevant entity.</span>
        </div>
      </div>

      {/* ── Command bar ───────────────────────────────────────────────────── */}
      <div className={styles.commandBar}>
        {/* Primary action button */}
        <button className={styles.applyMainBtn} onClick={save}>
          <CheckmarkRegular style={{ fontSize: "13px", color: colors.white }} />
          <span className={styles.applyMainBtnText}>Provide Feedback</span>
        </button>

        <div className={styles.cmdSep} />

        {/* View List of Feedback — opens from ribbon; cannot open nested dialog in Office.js */}
        <button
          className={`${styles.cmdIconBtn} sl-icon-btn`}
          title="View List of Feedback (use Feedback History from the ribbon)"
          disabled
          style={{ opacity: 0.4, cursor: "default" }}
        >
          <PfFeedbackListIcon />
        </button>

        {/* View List of Analysis — opens from ribbon; cannot open nested dialog in Office.js */}
        <button
          className={`${styles.cmdIconBtn} sl-icon-btn`}
          title="View List of Analysis (use Analysis History from the ribbon)"
          disabled
          style={{ opacity: 0.4, cursor: "default" }}
        >
          <PfAnalysisListIcon />
        </button>

        <div className={styles.cmdSep} />

        {/* File Information — no file attached in this view */}
        <button
          className={`${styles.cmdIconBtn} sl-icon-btn`}
          title="File Information (no file context in this view)"
          disabled
          style={{ opacity: 0.4, cursor: "default" }}
        >
          <PfFileInfoIcon />
        </button>

        <div className={styles.cmdSep} />

        {/* Formatting toolbar */}
        <RichTextToolbar editorRef={editorRef} />
      </div>

      {/* ── Tab bar ───────────────────────────────────────────────────────── */}
      <div className={styles.tabBar}>
        {visibleTabs.map(({ value, label }) => {
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
      <div className={styles.body} style={activeTab !== "feedback" && activeTab !== "selection" ? { padding: 0 } : undefined}>

        {/* ── About Feedback tab ──────────────────────────────────────────── */}
        {activeTab === "feedback" && (
          <>
            {/* From Person — account holder, locked read-only */}
            <div style={rowStyle}>
              <span style={labelStyle}>From Person</span>
              <div style={readonlyDisplayStyle}>{form.fromPerson}</div>
            </div>

            {/* To Person — select from people list or free-text */}
            <div style={rowStyle}>
              <span style={labelStyle}>To Person</span>
              {peopleList.length > 0 ? (
                <select
                  style={selectStyle}
                  value={form.toPerson}
                  onChange={(e) => updateForm("toPerson", e.target.value)}
                >
                  <option value="">-- Select person --</option>
                  {peopleList.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              ) : (
                <input
                  style={inputStyle}
                  value={form.toPerson}
                  onChange={(e) => updateForm("toPerson", e.target.value)}
                  placeholder="Enter recipient name"
                />
              )}
            </div>

            {/* Person Email */}
            <div style={rowStyle}>
              <span style={labelStyle}>Person Email</span>
              <input
                style={inputStyle}
                type="email"
                value={form.toPersonEmail}
                onChange={(e) => updateForm("toPersonEmail", e.target.value)}
                placeholder="Enter recipient email address"
              />
            </div>

            <div style={{ height: "1px", background: "#E0E0E0", margin: "2px 0 16px 0" }} />

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

            {/* Feedback Subject */}
            <div style={rowStyle}>
              <span style={labelStyle}>Feedback Subject</span>
              <input
                style={inputStyle}
                value={form.feedbackSubject}
                onChange={(e) => updateForm("feedbackSubject", e.target.value)}
                placeholder="Enter feedback subject"
              />
            </div>

            {/* Actual Feedback Provided — RichEditor, pre-filled from analysis */}
            <div style={rowTopStyle}>
              <span style={labelTopStyle}>Actual Feedback Provided</span>
              <div style={{ flex: 1 }}>
                <RichEditor
                  ref={editorRef}
                  value={form.actualFeedbackProvided}
                  onChange={(v) => updateForm("actualFeedbackProvided", v)}
                  placeholder="Enter the feedback to be provided..."
                />
              </div>
            </div>
          </>
        )}

        {/* ── Selection tab — read-only (selection/paragraph feedback) ─────── */}
        {activeTab === "selection" && (
          <>
            <div style={rowStyle}>
              <span style={labelStyle}>Selection Type</span>
              <div style={readonlyDisplayStyle}>{initData?.source}</div>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>From Person</span>
              <div style={readonlyDisplayStyle}>{form.fromPerson}</div>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>To Person</span>
              <div style={readonlyDisplayStyle}>{form.toPerson}</div>
            </div>
            <div style={rowTopStyle}>
              <span style={labelTopStyle}>Actual Selection</span>
              {selectionHtml ? (
                <div
                  style={{ flex: 1, border: "1px solid #E0E0E0", borderRadius: "4px", padding: "8px 11px", fontSize: "12.2px", color: colors.grey38, background: "#F9F9F9", minHeight: "80px", maxHeight: "220px", overflowY: "auto", wordBreak: "break-word", lineHeight: "18px" }}
                  dangerouslySetInnerHTML={{ __html: selectionHtml }}
                />
              ) : (
                <div style={{ flex: 1, border: "1px solid #E0E0E0", borderRadius: "4px", padding: "8px 11px", fontSize: "12.2px", color: colors.grey38, background: "#F9F9F9", minHeight: "80px", maxHeight: "220px", overflowY: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: "18px" }}>
                  {initData?.selection || <em>No selection captured.</em>}
                </div>
              )}
            </div>
          </>
        )}

        {/* Analysis Question tab — read-only ──────────────────────────────── */}
        {activeTab === "questions" && (
          <PanelTable<string[]>
            columns={PFV_Q_COLS}
            rows={analysisData?.questions.map((q) => [String(q.questionNumber), q.actualQuestion, q.entityQuestionPointTo, q.responseStatus]) ?? []}
            emptyText="No items"
          />
        )}

        {/* Errors tab — read-only ─────────────────────────────────────────── */}
        {activeTab === "errors" && (
          <PanelTable<string[]>
            columns={PFV_ERR_COLS}
            rows={analysisData?.errors.map((e) => [String(e.errorNumber), e.actualError, e.fromActualCommunication, e.entityErrorPointTo]) ?? []}
            emptyText="No items"
          />
        )}

        {/* Compensators tab — read-only ───────────────────────────────────── */}
        {activeTab === "compensators" && (
          <PanelTable<string[]>
            columns={PFV_COMP_COLS}
            rows={analysisData?.compensators.map((c) => [String(c.compensatorNumber), c.actualCompensator, c.actualErrorReplaced, c.inActualCommunication]) ?? []}
            emptyText="No items"
          />
        )}

        {/* Answers tab — read-only ────────────────────────────────────────── */}
        {activeTab === "answers" && (
          <PanelTable<string[]>
            columns={PFV_ANS_COLS}
            rows={analysisData?.answers.map((a) => [String(a.answerNumber), a.actualQuestion, a.actualAnswer, a.informationAnswerPointTo]) ?? []}
            emptyText="No items"
          />
        )}

        {/* Attached Files tab — read-only ─────────────────────────────────── */}
        {activeTab === "files" && (
          <PanelTable<string[]>
            columns={PFV_FILE_COLS}
            rows={analysisData?.files.map((f, i) => [String(i + 1), f.fileName, f.fileType, f.fileDate]) ?? []}
            emptyText="No items"
          />
        )}
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div className={styles.footer}>
        <span className={styles.footerHint}>Fill in all required fields, then click Provide Feedback to save and send.</span>
        <button style={btnStyle("cancel")} onClick={closeDialog}>Cancel</button>
        <button
          style={{ ...btnStyle("apply"), background: footerBtnHover ? "#106EBE" : colors.azure42 }}
          onMouseEnter={() => setFooterBtnHover(true)}
          onMouseLeave={() => setFooterBtnHover(false)}
          onClick={save}
        >
          Provide Feedback
        </button>
      </div>
    </div>
  );
}
