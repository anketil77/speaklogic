import React from "react";
import { makeStyles } from "@fluentui/react-components";
import { RichEditor } from "@/dialog/components/RichEditor";
import { PanelTable } from "@/dialog/components/PanelTable";
import type { PanelTableCol } from "@/dialog/components/PanelTable";
import { formatDisplayDate } from "@/db/db";
import { colors } from "@/styles/tokens";
import type { DialogInitPayload, AnalysisDataForApply } from "@/types/db";
import type { QuestionDraft, AnswerDraft, ErrorDraft, CompensatorDraft, FileDraft, CorrectedItemDraft, TabValue, FeedbackForm } from "./applyFeedbackTypes";

// ── Column definitions (module-level — never inline) ──────────────────────────
const Q_COLS: PanelTableCol<string[]>[] = [
  { header: "#", width: "8%", render: (r) => r[0] },
  { header: "Question", width: "44%", render: (r) => r[1], truncate: true },
  { header: "Points To", width: "30%", render: (r) => r[2], truncate: true },
  { header: "Status", width: "18%", render: (r) => r[3], truncate: true },
];
const ERR_COLS: PanelTableCol<string[]>[] = [
  { header: "#", width: "8%", render: (r) => r[0] },
  { header: "Actual Error", width: "38%", render: (r) => r[1], truncate: true },
  { header: "From Communication", width: "30%", render: (r) => r[2], truncate: true },
  { header: "Points To", width: "24%", render: (r) => r[3], truncate: true },
];
const COMP_COLS: PanelTableCol<string[]>[] = [
  { header: "#", width: "8%", render: (r) => r[0] },
  { header: "Compensator", width: "36%", render: (r) => r[1], truncate: true },
  { header: "Error Replaced", width: "28%", render: (r) => r[2], truncate: true },
  { header: "In Communication", width: "28%", render: (r) => r[3], truncate: true },
];
const ANS_COLS: PanelTableCol<string[]>[] = [
  { header: "#", width: "8%", render: (r) => r[0] },
  { header: "Question", width: "30%", render: (r) => r[1], truncate: true },
  { header: "Answer", width: "40%", render: (r) => r[2], truncate: true },
  { header: "Points To", width: "22%", render: (r) => r[3], truncate: true },
];
const FILE_COLS: PanelTableCol<string[]>[] = [
  { header: "#", width: "8%", render: (r) => r[0] },
  { header: "File Name", width: "50%", render: (r) => r[1], truncate: true },
  { header: "Type", width: "20%", render: (r) => r[2], truncate: true },
  { header: "Date", width: "22%", render: (r) => formatDisplayDate(r[3]), truncate: true },
];
const CI_COLS: PanelTableCol<string[]>[] = [
  { header: "#", width: "8%", render: (r) => r[0] },
  { header: "Error Selection", width: "36%", render: (r) => r[1], truncate: true },
  { header: "Compensator", width: "36%", render: (r) => r[2], truncate: true },
  { header: "Corrected", width: "20%", render: (r) => r[3], truncate: true },
];

// ── Inline styles ─────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%", height: "32px", border: "1px solid #C7C7C7", borderRadius: "4px",
  padding: "0 11px", fontSize: "12.2px", fontFamily: "inherit", color: colors.grey11,
  background: colors.white, outline: "none", boxSizing: "border-box",
};
const selectStyle: React.CSSProperties = {
  ...inputStyle,
  padding: "0 32px 0 11px",
  appearance: "none" as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23616161' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat" as const,
  backgroundPosition: "right 11px center",
  cursor: "pointer",
};
const roStyle: React.CSSProperties = {
  flex: 1, height: "32px", border: "1px solid #E0E0E0", borderRadius: "4px",
  padding: "0 11px", fontSize: "12.2px", fontFamily: "inherit", color: colors.grey38,
  background: "#F9F9F9", display: "flex", alignItems: "center",
  overflow: "hidden", whiteSpace: "nowrap", boxSizing: "border-box",
};
const rowS: React.CSSProperties = { display: "flex", alignItems: "center", minHeight: "32px", marginBottom: "14px" };
const rowTopS: React.CSSProperties = { display: "flex", alignItems: "flex-start", marginBottom: "14px" };
const labelS: React.CSSProperties = { width: "170px", minWidth: "170px", fontSize: "11.8px", fontWeight: "700", color: colors.grey11, lineHeight: "14px", flexShrink: 0 };
const labelTopS: React.CSSProperties = { ...labelS, paddingTop: "9px" };

// ── Styles ────────────────────────────────────────────────────────────────────
const useStyles = makeStyles({
  tabBar: {
    height: "36px",
    borderBottom: "1px solid #E0E0E0",
    display: "flex",
    alignItems: "flex-end",
    padding: "0 20px",
    flexShrink: 0,
    background: colors.white,
    overflowX: "auto",
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
  tabBtnActive: { fontWeight: "700", fontSize: "12.7px", color: colors.grey11 },
  tabUnderline: {
    position: "absolute",
    bottom: "0",
    left: "12px",
    right: "12px",
    height: "2px",
    background: colors.azure42,
    borderRadius: "1px 1px 0 0",
  },
  body: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
  },
});

// ── Props ─────────────────────────────────────────────────────────────────────
export interface ApplyFeedbackTabsProps {
  activeTab: TabValue;
  setActiveTab: (t: TabValue) => void;
  tabs: { value: TabValue; label: string }[];
  validationError: string | null;
  initData: DialogInitPayload;
  analysisData: AnalysisDataForApply | null | undefined;
  selectionHtml: string;
  form: FeedbackForm;
  updateForm: (key: keyof FeedbackForm, value: string) => void;
  errorOptions: string[];
  compensatorOptions: string[];
  editorRef: React.RefObject<HTMLDivElement>;
  questions: QuestionDraft[];
  errors: ErrorDraft[];
  compensators: CompensatorDraft[];
  answers: AnswerDraft[];
  files: FileDraft[];
  correctedItems: CorrectedItemDraft[];
  selectedRow: { tab: TabValue; idx: number } | null;
  onRowClick: (tab: TabValue, idx: number) => void;
  onCtx: (tab: TabValue, idx: number | null, x: number, y: number) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function ApplyFeedbackTabs(p: ApplyFeedbackTabsProps) {
  const s = useStyles();
  const { activeTab, setActiveTab, tabs, validationError, initData, analysisData, selectionHtml, form, updateForm, errorOptions, compensatorOptions, editorRef, questions, errors, compensators, answers, files, correctedItems, selectedRow, onRowClick, onCtx } = p;

  return (
    <>
      {/* ── Validation banner ─────────────────────────────────────────────── */}
      {validationError && (
        <div style={{ background: "#FDE7E9", borderBottom: "1px solid #F1707B", padding: "8px 20px", fontSize: "12px", color: "#A4262C", flexShrink: 0 }}>
          ⚠ {validationError}
        </div>
      )}

      {/* ── Tab bar ───────────────────────────────────────────────────────── */}
      <div className={s.tabBar}>
        {tabs.map(({ value, label }) => {
          const isActive = activeTab === value;
          return (
            <button
              key={value}
              className={`${s.tabBtn}${isActive ? ` ${s.tabBtnActive}` : ""}`}
              onClick={() => setActiveTab(value)}
            >
              {label}
              {isActive && <span className={s.tabUnderline} />}
            </button>
          );
        })}
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className={s.body} style={activeTab !== "feedback" ? { padding: 0 } : undefined}>

        {activeTab === "feedback" && (
          <>
            {analysisData && (
              <>
                <span style={{ display: "block", fontSize: "11px", fontWeight: "700", letterSpacing: "0.6px", textTransform: "uppercase", color: colors.grey38, lineHeight: "13px", marginBottom: "8px" }}>
                  Entity Under Analysis
                </span>
                <div style={{ background: colors.white, border: "1px solid #E0E0E0", borderRadius: "4px", height: "72px", display: "flex", alignItems: "center", padding: "0 12px", overflow: "hidden", marginBottom: "16px" }}>
                  <span style={{ fontSize: "16.9px", fontWeight: "400", lineHeight: "25px", color: colors.grey11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {analysisData.entityUnderAnalysis}
                  </span>
                </div>
                {analysisData.fromPerson && (
                  <div style={rowS}><span style={labelS}>From Person</span><span style={roStyle}>{analysisData.fromPerson}</span></div>
                )}
                {analysisData.analysisSubject && (
                  <div style={rowS}><span style={labelS}>Analysis Subject</span><span style={roStyle}>{analysisData.analysisSubject}</span></div>
                )}
                {analysisData.actualAnalysis && (
                  <div style={rowTopS}>
                    <span style={labelTopS}>Actual Analysis</span>
                    <div style={{ flex: 1, border: "1px solid #E0E0E0", borderRadius: "4px", padding: "8px 11px", fontSize: "12.2px", color: colors.grey38, background: "#F9F9F9", minHeight: "60px", maxHeight: "120px", overflowY: "auto" }}
                      dangerouslySetInnerHTML={{ __html: analysisData.actualAnalysis }} />
                  </div>
                )}
                <div style={{ height: "1px", background: "#E0E0E0", margin: "0 0 16px 0" }} />
              </>
            )}

            <div style={rowS}><span style={labelS}>Application Name</span>
              <input style={inputStyle} value={form.applicationName} onChange={(e) => updateForm("applicationName", e.target.value)} placeholder="Enter application name" />
            </div>
            <div style={rowS}><span style={labelS}>Communication Function</span>
              <input style={inputStyle} value={form.communicationFunction} onChange={(e) => updateForm("communicationFunction", e.target.value)} placeholder="Enter communication function" />
            </div>
            <div style={rowS}><span style={labelS}>Feedback Subject</span>
              <input style={inputStyle} value={form.feedbackSubject} onChange={(e) => updateForm("feedbackSubject", e.target.value)} placeholder="Enter feedback subject" />
            </div>
            <div style={rowS}><span style={labelS}>Error Substituted</span>
              {errorOptions.length > 0 ? (
                <select style={selectStyle} value={form.errorSubstituted} onChange={(e) => updateForm("errorSubstituted", e.target.value)}>
                  <option value="">-- Select error --</option>
                  {errorOptions.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              ) : (
                <input style={inputStyle} value={form.errorSubstituted} onChange={(e) => updateForm("errorSubstituted", e.target.value)} placeholder="Enter error substituted" />
              )}
            </div>
            <div style={rowS}><span style={labelS}>Compensator Replaced</span>
              {compensatorOptions.length > 0 ? (
                <select style={selectStyle} value={form.compensatorReplaced} onChange={(e) => updateForm("compensatorReplaced", e.target.value)}>
                  <option value="">-- Select compensator --</option>
                  {compensatorOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <input style={inputStyle} value={form.compensatorReplaced} onChange={(e) => updateForm("compensatorReplaced", e.target.value)} placeholder="Enter compensator replaced" />
              )}
            </div>
            <div style={rowTopS}>
              <span style={labelTopS}>Feedback Application</span>
              <div style={{ flex: 1 }}>
                <RichEditor ref={editorRef} value={form.feedbackApplication} onChange={(v) => updateForm("feedbackApplication", v)} placeholder="Describe how the feedback was applied..." />
              </div>
            </div>
          </>
        )}

        {activeTab === "selection" && (
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column" }}>
            <div style={rowS}><span style={labelS}>Selection Type</span><span style={roStyle}>{initData.source}</span></div>
            <div style={rowS}><span style={labelS}>From Person</span><span style={roStyle}>{form.fromPerson}</span></div>
            <div style={rowS}><span style={labelS}>To Person</span>
              <input style={inputStyle} value={form.toPerson} onChange={(e) => updateForm("toPerson", e.target.value)} placeholder="To person" />
            </div>
            <div style={rowTopS}>
              <span style={labelTopS}>Actual Selection</span>
              {selectionHtml ? (
                <div style={{ flex: 1, border: "1px solid #E0E0E0", borderRadius: "4px", padding: "8px 11px", fontSize: "12.2px", color: colors.grey38, background: "#F9F9F9", minHeight: "80px", maxHeight: "220px", overflowY: "auto", wordBreak: "break-word", lineHeight: "18px" }}
                  dangerouslySetInnerHTML={{ __html: selectionHtml }} />
              ) : (
                <div style={{ flex: 1, border: "1px solid #E0E0E0", borderRadius: "4px", padding: "8px 11px", fontSize: "12.2px", color: colors.grey38, background: "#F9F9F9", minHeight: "80px", maxHeight: "220px", overflowY: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: "18px" }}>
                  {initData.selection || <em>No selection captured.</em>}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "paragraph" && (
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column" }}>
            <div style={rowS}><span style={labelS}>Selection Type</span><span style={roStyle}>Paragraph</span></div>
            <div style={rowS}><span style={labelS}>From Person</span><span style={roStyle}>{form.fromPerson}</span></div>
            <div style={rowS}><span style={labelS}>To Person</span>
              <input style={inputStyle} value={form.toPerson} onChange={(e) => updateForm("toPerson", e.target.value)} placeholder="To person" />
            </div>
            <div style={rowTopS}>
              <span style={labelTopS}>Actual Paragraph</span>
              {selectionHtml ? (
                <div style={{ flex: 1, border: "1px solid #E0E0E0", borderRadius: "4px", padding: "8px 11px", fontSize: "12.2px", color: colors.grey38, background: "#F9F9F9", minHeight: "80px", maxHeight: "220px", overflowY: "auto", wordBreak: "break-word", lineHeight: "18px" }}
                  dangerouslySetInnerHTML={{ __html: selectionHtml }} />
              ) : (
                <div style={{ flex: 1, border: "1px solid #E0E0E0", borderRadius: "4px", padding: "8px 11px", fontSize: "12.2px", color: colors.grey38, background: "#F9F9F9", minHeight: "80px", maxHeight: "220px", overflowY: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: "18px" }}>
                  {initData.selection || <em>No paragraph captured.</em>}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "analysis" && analysisData && (
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column" }}>
            {analysisData.fromPerson && (
              <div style={rowS}><span style={labelS}>From Person</span><span style={roStyle}>{analysisData.fromPerson}</span></div>
            )}
            {analysisData.analysisSubject && (
              <div style={rowS}><span style={labelS}>Analysis Subject</span><span style={roStyle}>{analysisData.analysisSubject}</span></div>
            )}
            {analysisData.actualAnalysis && (
              <div style={rowTopS}>
                <span style={labelTopS}>Actual Analysis</span>
                <div style={{ flex: 1, border: "1px solid #E0E0E0", borderRadius: "4px", padding: "8px 11px", fontSize: "12.2px", color: colors.grey38, background: "#F9F9F9", minHeight: "80px", maxHeight: "220px", overflowY: "auto" }}
                  dangerouslySetInnerHTML={{ __html: analysisData.actualAnalysis }} />
              </div>
            )}
          </div>
        )}

        {activeTab === "questions" && (
          <PanelTable<string[]> columns={Q_COLS}
            rows={questions.map((q) => [String(q.questionNumber), q.actualQuestion, q.entityQuestionPointTo, q.responseStatus])}
            selectedIndex={selectedRow?.tab === "questions" ? selectedRow.idx : null}
            onRowClick={(i) => onRowClick("questions", i)}
            onRowContextMenu={(e, i) => onCtx("questions", i, e.clientX, e.clientY)} />
        )}

        {activeTab === "errors" && (
          <PanelTable<string[]> columns={ERR_COLS}
            rows={errors.map((e) => [String(e.errorNumber), e.actualError, e.fromActualCommunication, e.entityErrorPointTo])}
            selectedIndex={selectedRow?.tab === "errors" ? selectedRow.idx : null}
            onRowClick={(i) => onRowClick("errors", i)}
            onRowContextMenu={(e, i) => onCtx("errors", i, e.clientX, e.clientY)} />
        )}

        {activeTab === "compensators" && (
          <PanelTable<string[]> columns={COMP_COLS}
            rows={compensators.map((c) => [String(c.compensatorNumber), c.actualCompensator, c.actualErrorReplaced, c.inActualCommunication])}
            selectedIndex={selectedRow?.tab === "compensators" ? selectedRow.idx : null}
            onRowClick={(i) => onRowClick("compensators", i)}
            onRowContextMenu={(e, i) => onCtx("compensators", i, e.clientX, e.clientY)} />
        )}

        {activeTab === "answers" && (
          <PanelTable<string[]> columns={ANS_COLS}
            rows={answers.map((a) => [String(a.answerNumber), a.actualQuestion, a.actualAnswer, a.informationAnswerPointTo])}
            selectedIndex={selectedRow?.tab === "answers" ? selectedRow.idx : null}
            onRowClick={(i) => onRowClick("answers", i)}
            onRowContextMenu={(e, i) => onCtx("answers", i, e.clientX, e.clientY)} />
        )}

        {activeTab === "files" && (
          <PanelTable<string[]> columns={FILE_COLS}
            rows={files.map((f, i) => [String(i + 1), f.fileName, f.fileType, f.fileDate])}
            selectedIndex={selectedRow?.tab === "files" ? selectedRow.idx : null}
            onRowClick={(i) => onRowClick("files", i)}
            onRowContextMenu={(e, i) => onCtx("files", i, e.clientX, e.clientY)} />
        )}

        {activeTab === "corrected" && (
          <PanelTable<string[]> columns={CI_COLS}
            rows={correctedItems.map((ci) => [String(ci.correctedItemNumber), ci.errorSelection, ci.compensatorSelection, ci.corrected])}
            selectedIndex={selectedRow?.tab === "corrected" ? selectedRow.idx : null}
            onRowClick={(i) => onRowClick("corrected", i)}
            onRowContextMenu={(e, i) => onCtx("corrected", i, e.clientX, e.clientY)} />
        )}
      </div>
    </>
  );
}
