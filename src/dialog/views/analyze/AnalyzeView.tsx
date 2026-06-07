import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Spinner, makeStyles } from "@fluentui/react-components";
import { CheckmarkRegular } from "@fluentui/react-icons";
import { useDialogComm } from "@/dialog/hooks/useDialogComm";
import { QuestionPanel } from "@/dialog/views/analyze/panels/QuestionPanel";
import { AnalysisTabForm } from "@/dialog/views/analyze/AnalysisTabForm";
import { EntitySplitPanel } from "@/dialog/views/analyze/EntitySplitPanel";
import { AnswerPanel } from "@/dialog/views/analyze/panels/AnswerPanel";
import { ErrorPanel } from "@/dialog/views/analyze/panels/ErrorPanel";
import { CompensatorPanel } from "@/dialog/views/analyze/panels/CompensatorPanel";
import { ProblemPanel } from "@/dialog/views/analyze/panels/ProblemPanel";
import { AttachFilePanel } from "@/dialog/views/analyze/panels/AttachFilePanel";
import { RichTextToolbar } from "@/dialog/components/RichTextToolbar";
import { CommandDropdown } from "@/dialog/components/CommandDropdown";
import { HamburgerIcon } from "@/dialog/components/Icons";
import type { CmdDropdownDef } from "@/dialog/components/CommandDropdown";
import type { SaveAnalysisPayload } from "@/types/db";
import { nowDate, nowTime } from "@/db/db";
import { colors } from "@/styles/tokens";
import { useAnalyzePanels } from "@/dialog/views/analyze/useAnalyzePanels";
import { AnalyzeSubDialogs } from "@/dialog/views/analyze/AnalyzeSubDialogs";
import { SaveSplitButton } from "@/dialog/views/analyze/SaveSplitButton";

const F = {
  borderInput: `1px solid #C7C7C7`,
  borderBox: `1px solid #E0E0E0`,
  radiusInput: "4px",
  fontMd: "12.2px",
  fontSm: "11px",
  fontLg: "15.6px",
  fontXs: "10.3px",
  colorPlaceholder: "#BDBDBD",
  bgCommandBar: "#F5F5F5",
  bgApplyBtn: "#0078D4",
  bgApplyTypeBtn: "#EBEBEB",
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
    background: colors.grey95,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  titles: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },
  titleText: {
    fontSize: F.fontLg,
    fontWeight: "700",
    lineHeight: "21px",
    letterSpacing: "-0.1px",
    color: colors.grey11,
  },
  subtitleText: {
    fontSize: "11.1px",
    fontWeight: "400",
    lineHeight: "17px",
    color: colors.grey38,
  },
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
    minWidth: "105px",
    background: F.bgApplyBtn,
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
  applyMainBtnText: {
    fontSize: "11.6px",
    fontWeight: "700",
    color: colors.white,
    lineHeight: "14px",
  },
  cmdSep: {
    width: "1px",
    height: "20px",
    background: F.sepColor,
    margin: "0 8px",
    flexShrink: 0,
  },
  cmdIconBtn: {
    width: "28px",
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    background: "transparent",
    border: "none",
    borderRadius: "4px",
    padding: "0",
    flexShrink: 0,
    fontFamily: "inherit",
    ":hover": { background: "#EBEBEB" },
  },
  tabBar: {
    height: "36px",
    borderBottom: F.borderBox,
    display: "flex",
    alignItems: "flex-end",
    padding: "0 20px",
    flexShrink: 0,
    background: colors.white,
    gap: "0",
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
  tabBtnActive: {
    fontWeight: "700",
    fontSize: "12.7px",
    color: colors.grey11,
  },
  tabActiveUnderline: {
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
  footerHint: {
    flex: 1,
    fontSize: "10.3px",
    fontWeight: "400",
    color: colors.grey38,
    lineHeight: "15px",
  },
});

type TabValue = "analysis" | "questions" | "errors" | "compensators" | "files" | "problems" | "answers";
type DropdownId = "selection" | "question" | "compensator" | "entity";

const btnStyle = (variant: "cancel" | "apply"): React.CSSProperties => {
  const base: React.CSSProperties = {
    height: "32px",
    borderRadius: "4px",
    fontSize: "12.3px",
    fontFamily: "inherit",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    whiteSpace: "nowrap",
    flexShrink: 0,
  };
  if (variant === "cancel")
    return {
      ...base,
      padding: "0 18px",
      background: colors.white,
      border: F.borderInput,
      color: colors.grey11,
      fontSize: "12.4px",
      fontWeight: "400",
    };
  return {
    ...base,
    padding: "0 20px",
    background: colors.azure42,
    border: "none",
    color: colors.white,
    fontSize: "12.7px",
    fontWeight: "700",
  };
};

function CmdSep({ styles }: { styles: ReturnType<typeof useStyles> }) {
  return <div className={styles.cmdSep} />;
}

interface AnalyzeViewProps {
  mode: "selection" | "paragraph";
}

const ALL_TABS: { value: TabValue; label: string }[] = [
  { value: "analysis", label: "Analysis" },
  { value: "questions", label: "Analysis Question" },
  { value: "errors", label: "Errors" },
  { value: "compensators", label: "Compensators" },
  { value: "answers", label: "Answers" },
  { value: "problems", label: "Problems" },
  { value: "files", label: "Attached Files" },
];

// Normalise a CSS color string to its luminance (0–1) using a temporary DOM element.
function colorLuminance(cssColor: string): number | null {
  const tmp = document.createElement("span");
  tmp.style.color = cssColor;
  document.body.appendChild(tmp);
  const computed = getComputedStyle(tmp).color;
  document.body.removeChild(tmp);
  const m = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return null;
  return (0.299 * +m[1] + 0.587 * +m[2] + 0.114 * +m[3]) / 255;
}

// Sanitize HTML exported by Word's getHtml() for display on a white background.
// Removes the <style> block (Word page/theme CSS) and all background-color inline
// styles so the EUA stays clean. Near-white text colors are replaced with dark text.
// Our own red/green error highlights are applied afterwards by applyEuaHighlight().
function sanitizeWordHtml(html: string): string {

  // Extract class→highlight-color from the <style> block BEFORE stripping it.
  // Dark theme Word may store mso-highlight in class rules rather than inline styles.
  const highlightByClass: Record<string, string> = {};
  const styleBlocks = html.match(/<style[\s\S]*?<\/style>/gi) ?? [];
  for (const block of styleBlocks) {
    const ruleRe = /\.([\w-]+)\s*\{([^}]*)\}/g;
    let m: RegExpExecArray | null;
    while ((m = ruleRe.exec(block)) !== null) {
      const hlMatch = m[2].match(/mso-highlight:\s*([^;}"'\s][^;}"']*)/i);
      if (hlMatch) highlightByClass[m[1]] = hlMatch[1];
    }
  }

  const noStyle = html.replace(/<style[\s\S]*?<\/style>/gi, "");
  // Convert inline mso-highlight and bgcolor attributes to standard background-color.
  const normalized = noStyle
    .replace(/mso-highlight:\s*([^;}"'\s][^;}"']*)/gi, "background-color:$1")
    .replace(/bgcolor="([^"]+)"/gi, 'style="background-color:$1"');

  // Parse as a proper HTML document so we get the real <body> to zero its margins.
  const doc = new DOMParser().parseFromString(normalized, "text/html");
  const body = doc.body;
  body.style.margin = "0";
  body.style.padding = "0";

  const fix = (el: HTMLElement) => {
    // Apply class-based highlights extracted from the style block (dark theme).
    if (el.className) {
      for (const cls of el.className.split(/\s+/)) {
        if (highlightByClass[cls]) { el.style.backgroundColor = highlightByClass[cls]; break; }
      }
    }
    // Fix near-white text so it's readable on the white EUA background.
    if (el.style.color) {
      const lum = colorLuminance(el.style.color);
      if (lum !== null && lum > 0.85) el.style.color = "#1B1B1B";
    }
    // Save background color BEFORE clearing — setting background="" also wipes backgroundColor.
    const bgColor = el.style.backgroundColor;
    el.style.background = "";
    el.style.backgroundColor = "";
    if (bgColor) {
      const bgLum = colorLuminance(bgColor);
      if (bgLum !== null && bgLum > 0.5) {
        // Light color — keep as-is (light theme highlight).
        el.style.backgroundColor = bgColor;
      } else if (el.classList.contains("Highlight") && bgLum !== null && bgLum > 0.01) {
        // Word Online dark theme adapts yellow (255,255,0) → rgb(57,57,0): same hue, ~11% lightness.
        // Recover the original hue by scaling each channel up so the max channel = 255.
        const tmp2 = document.createElement("span");
        tmp2.style.color = bgColor;
        document.body.appendChild(tmp2);
        const comp = getComputedStyle(tmp2).color;
        document.body.removeChild(tmp2);
        const hm = comp.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (hm) {
          const r = +hm[1], g = +hm[2], b = +hm[3];
          const mx = Math.max(r, g, b);
          if (mx > 0) {
            const sc = 255 / mx;
            el.style.backgroundColor = `rgb(${Math.min(255, Math.round(r * sc))},${Math.min(255, Math.round(g * sc))},${Math.min(255, Math.round(b * sc))})`;
          }
        }
      }
      // else: dark non-highlight background → stripped.
    }
    // Strip Word's page margins from direct children of body (outer wrapper divs).
    if (el.parentElement === body) { el.style.margin = "0"; el.style.padding = "0"; }
    for (const child of Array.from(el.children)) fix(child as HTMLElement);
  };
  fix(body);
  // Zero the first paragraph's default browser margin-top (1em) — Word Online doesn't set it inline.
  const firstP = body.querySelector("p") as HTMLElement | null;
  if (firstP) firstP.style.marginTop = "0";
  // Strip dangerous content: <script> tags, javascript: hrefs, and inline event handlers.
  body.querySelectorAll("script").forEach((s) => s.remove());
  body.querySelectorAll("[href]").forEach((el) => {
    const href = el.getAttribute("href") ?? "";
    if (/^javascript:/i.test(href.trim())) el.removeAttribute("href");
  });
  body.querySelectorAll("*").forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      if (/^on/i.test(attr.name)) el.removeAttribute(attr.name);
    });
  });
  return body.innerHTML;
}

export default function AnalyzeView({ mode: _mode }: AnalyzeViewProps) {
  const styles = useStyles();
  const { initData, sendMessage, closeDialog, retainSaved } = useDialogComm();
  const editorRef = useRef<HTMLDivElement>(null);
  const lastAnalysisSelectionRef = useRef<string>("");
  const cmdBarRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<TabValue>("analysis");
  const [openDropdown, setOpenDropdown] = useState<DropdownId | null>(null);
  type EntityViewMode = "both" | "analysis-only" | "entity-only";
  const [entityViewMode, setEntityViewMode] = useState<EntityViewMode>("both");
  const showEntityBox = entityViewMode !== "analysis-only";
  const entityOnlyMode = entityViewMode === "entity-only";
  const [toolbarCloseSignal, setToolbarCloseSignal] = useState(0);
  const toggleDd = useCallback((id: DropdownId) => {
    setOpenDropdown((prev) => {
      const next = prev === id ? null : id;
      if (next !== null) setToolbarCloseSignal((s) => s + 1);
      return next;
    });
  }, []);
  const closeDd = useCallback(() => setOpenDropdown(null), []);

  const handleTabChange = useCallback((tab: string) => setActiveTab(tab as TabValue), []);

  const panels = useAnalyzePanels({
    applicationName: initData?.applicationName,
    onTabChange: handleTabChange,
    onCloseDd: closeDd,
  });

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (cmdBarRef.current && !cmdBarRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);


  useEffect(() => {
    function onSelChange() {
      const sel = window.getSelection();
      const text = sel?.toString().trim() ?? "";
      if (text && editorRef.current && sel?.anchorNode && editorRef.current.contains(sel.anchorNode)) {
        lastAnalysisSelectionRef.current = text;
      }
    }
    document.addEventListener("selectionchange", onSelChange);
    return () => document.removeEventListener("selectionchange", onSelChange);
  }, []);

  const [form, setForm] = useState({ fromPerson: "", analysisSubject: "", actualAnalysis: "" });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [euaHtml, setEuaHtml] = useState("");

  useEffect(() => {
    if (initData?.selectionHtml) {
      setEuaHtml(sanitizeWordHtml(initData.selectionHtml));
    } else if (initData?.selection) {
      setEuaHtml(
        initData.selection
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
      );
    }
  }, [initData?.selection, initData?.selectionHtml]);

  const applyEuaHighlight = useCallback((text: string, bg: string) => {
    const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const span = `<span style="background-color:${bg};color:#fff">${escaped}</span>`;
    setEuaHtml((prev) => prev.replace(escaped, span));
  }, []);

  const analysisCompensatorRangeRef = useRef<Range | null>(null);

  const applyAnalysisHighlight = useCallback(() => {
    const range = analysisCompensatorRangeRef.current;
    const editor = editorRef.current;
    if (!range || !editor) return;
    const span = document.createElement("span");
    span.style.backgroundColor = "#00C800";
    span.style.color = "#fff";
    const fragment = range.extractContents();
    span.appendChild(fragment);
    range.insertNode(span);
    updateForm("actualAnalysis", editor.innerHTML);
    analysisCompensatorRangeRef.current = null;
  }, []);

  useEffect(() => {
    if (initData?.communicationPersonName) {
      setForm((prev) => prev.fromPerson ? prev : { ...prev, fromPerson: initData.communicationPersonName! });
    }
  }, [initData]);

  function updateForm<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setValidationError(null);
  }

  const cmdDropdowns: CmdDropdownDef[] = [
    {
      id: "selection",
      iconSrc: "assets/icons/selection.svg",
      title: "Selection",
      items: [
        { label: "Identify Selection as Error", iconSrc: "assets/icons/compensator-error.svg", enabled: true, onClick: () => { setActiveTab("errors"); closeDd(); } },
        { label: "Identify Selection as Analysis Question", iconSrc: "assets/icons/analysis-question.svg", enabled: true, onClick: () => panels.openAddQuestion(lastAnalysisSelectionRef.current || null) },
        { label: "Identify Selection as Compensator", iconSrc: "assets/icons/selection.svg", enabled: true, onClick: () => { setActiveTab("compensators"); closeDd(); } },
      ],
    },
    {
      id: "question",
      iconSrc: "assets/icons/question.svg",
      title: "Question",
      items: [
        { label: "Add Analysis Question", iconSrc: "assets/icons/add-analysis-question.svg", enabled: true, onClick: () => panels.openAddQuestion(null) },
        {
          label: "Respond Analysis Question",
          iconSrc: "assets/icons/analysis-question.svg",
          enabled: panels.selectedQuestionIdx !== null,
          onClick: () => {
            if (panels.selectedQuestionIdx !== null && panels.questions[panels.selectedQuestionIdx]) {
              panels.setRespondQuestion({ q: panels.questions[panels.selectedQuestionIdx], idx: panels.selectedQuestionIdx });
              closeDd();
            }
          },
        },
        { label: "Show List Answered Question", iconSrc: "assets/icons/list-answered-question.svg", enabled: !panels.showAnswersTab, onClick: () => { panels.setShowAnswersTab(true); setActiveTab("answers"); closeDd(); } },
        { label: "Hide List Answered Question", iconSrc: "assets/icons/hide-list-answered-question.svg", enabled: panels.showAnswersTab, onClick: () => { panels.setShowAnswersTab(false); setActiveTab((prev) => prev === "answers" ? "questions" : prev); closeDd(); } },
        {
          label: "View Selected Answer",
          iconSrc: "assets/icons/view-selected-answer.svg",
          enabled: panels.selectedAnswerIdx !== null,
          onClick: () => {
            if (panels.selectedAnswerIdx !== null && panels.answers[panels.selectedAnswerIdx]) {
              panels.setViewAnswer(panels.answers[panels.selectedAnswerIdx]);
              closeDd();
            }
          },
        },
      ],
    },
    {
      id: "compensator",
      iconSrc: "assets/icons/compensator-error.svg",
      title: "Compensator and Error",
      items: [
        { label: "Identify Error", iconSrc: "assets/icons/identify-error.svg", enabled: true, onClick: () => { setActiveTab("errors"); closeDd(); } },
        { label: "Identify Compensator", iconSrc: "assets/icons/selection.svg", enabled: true, onClick: () => { setActiveTab("compensators"); closeDd(); } },
        { label: "Identify Problem", iconSrc: "assets/icons/identify-problem.svg", enabled: true, onClick: () => { setActiveTab("problems"); closeDd(); } },
      ],
    },
    {
      id: "entity",
      iconSrc: "assets/icons/entity-under-analysis.svg",
      title: "Entity Under Analysis",
      items: [
        { label: "Hide Entity Under Analysis", iconSrc: "assets/icons/hide-entity-under-analysis.svg", enabled: entityViewMode !== "analysis-only", onClick: () => { setEntityViewMode("analysis-only"); closeDd(); } },
        { label: "Show Entity Under Analysis", iconSrc: "assets/icons/entity-under-analysis.svg", enabled: entityViewMode !== "both", onClick: () => { setEntityViewMode("both"); closeDd(); } },
        { label: "Show Analysis Only", iconSrc: "assets/icons/analysis.svg", enabled: entityViewMode !== "analysis-only", onClick: () => { setEntityViewMode("analysis-only"); setActiveTab("analysis"); closeDd(); } },
        { label: "Show Entity Under Analysis Only", iconSrc: "assets/icons/show-entity-under-analysis-only.svg", enabled: entityViewMode !== "entity-only", onClick: () => { setEntityViewMode("entity-only"); closeDd(); } },
      ],
    },
  ];

  const save = useCallback(
    (action: "ApplyAnalysisAsFeedback" | "ProvideFeedbackWithAnalysis" | "RetainAnalysisAsNeed") => {
      if (!initData) return;

      const missing: string[] = [];
      if (!form.fromPerson.trim()) missing.push("From Person");
      if (!form.analysisSubject.trim()) missing.push("Analysis Subject");
      const plainAnalysis = form.actualAnalysis.replace(/<[^>]*>/g, "").trim();
      if (!plainAnalysis) missing.push("Actual Analysis");
      if (missing.length > 0) {
        setValidationError(`Required: ${missing.join(", ")}`);
        setActiveTab("analysis");
        return;
      }
      setValidationError(null);

      sendMessage({
        action: "SAVE_ANALYSIS",
        payload: {
          analysis: {
            entityUnderAnalysis: euaHtml,
            fromPerson: form.fromPerson,
            analysisSubject: form.analysisSubject,
            actualAnalysis: form.actualAnalysis,
            whatToDoWithAnalysis: action,
            source: initData.source,
            applicationName: initData.applicationName,
            communicationFunction: initData.communicationFunction,
            communicationSignal: initData.communicationSignal,
            projectName: initData.projectName,
            analysisDate: nowDate(),
            analysisTime: nowTime(),
            personName: initData.personName,
            personEmail: initData.personEmail,
            selectionType: initData.mode === "selection" ? "Selection" : "Paragraph",
            errorCount: panels.errors.length,
            questionCount: panels.questions.length,
            compensatorCount: panels.compensators.length,
            answerCount: panels.answers.length,
            problemCount: panels.problems.length,
            correctedItemCount: 0,
          },
          errors: panels.errors.map((e) => ({ ...e, errorDate: nowDate(), errorTime: nowTime() })),
          questions: panels.questions.map((q) => ({ ...q, questionDate: nowDate(), questionTime: nowTime() })),
          answers: panels.answers,
          compensators: panels.compensators.map((c) => ({
            ...c,
            compensatorDate: nowDate(),
            compensatorTime: nowTime(),
          })),
          problems: panels.problems,
          files: panels.files.map((f) => ({ ...f, fileDate: f.fileDate || nowDate(), fileTime: f.fileTime || nowTime() })),
        } satisfies SaveAnalysisPayload,
      });
    },
    [form, panels.questions, panels.answers, panels.errors, panels.compensators, panels.problems, panels.files, initData, sendMessage]
  );

  const tabCount = useMemo(
    () => ({
      questions: panels.questions.length,
      errors: panels.errors.length,
      compensators: panels.compensators.length,
      files: panels.files.length,
      problems: panels.problems.length,
      answers: panels.answers.length,
    }),
    [panels.questions.length, panels.errors.length, panels.compensators.length, panels.files.length, panels.problems.length, panels.answers.length]
  );

  const visibleTabs = useMemo(
    () => ALL_TABS.filter((t) => t.value !== "answers" || panels.showAnswersTab),
    [panels.showAnswersTab]
  );

  if (!initData) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <Spinner label="Loading..." />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.titleSection}>
        <div className={styles.headerIcon}>
          <HamburgerIcon />
        </div>
        <div className={styles.titles}>
          <span className={styles.titleText}>Analysis</span>
          <span className={styles.subtitleText}>
            Review selected content, define the analysis subject, and prepare structured feedback.
          </span>
        </div>
      </div>

      <div className={styles.commandBar} ref={cmdBarRef}>
        <button className={styles.applyMainBtn} onClick={() => save("ApplyAnalysisAsFeedback")}>
          <CheckmarkRegular style={{ fontSize: "13px", color: colors.white }} />
          <span className={styles.applyMainBtnText}>Apply</span>
        </button>

        <CmdSep styles={styles} />

        <button
          className={styles.cmdIconBtn}
          title="Provide Feedback"
          onClick={() => save("ProvideFeedbackWithAnalysis")}
        >
          <img
            src="assets/icons/provide-feedback.svg"
            width={16}
            height={15}
            alt="Provide Feedback"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </button>
        <button
          className={styles.cmdIconBtn}
          title="Retain Analysis as Need"
          onClick={() => save("RetainAnalysisAsNeed")}
        >
          <img
            src="assets/icons/retain-analysis.svg"
            width={14}
            height={14}
            alt="Retain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </button>

        <CmdSep styles={styles} />

        {cmdDropdowns.map((dd) => (
          <CommandDropdown
            key={dd.id}
            def={dd}
            open={openDropdown === dd.id}
            onToggle={() => toggleDd(dd.id as DropdownId)}
            onClose={closeDd}
          />
        ))}

        <CmdSep styles={styles} />

        <CmdSep styles={styles} />

        <RichTextToolbar
          editorRef={editorRef}
          closeSignal={toolbarCloseSignal}
          onOpen={closeDd}
        />
      </div>

      <div className={styles.tabBar} style={entityOnlyMode ? { display: "none" } : undefined}>
        {visibleTabs.map(({ value, label }) => {
          const count = tabCount[value] ?? 0;
          const isActive = activeTab === value;
          return (
            <button
              key={value}
              className={`${styles.tabBtn}${isActive ? ` ${styles.tabBtnActive}` : ""}`}
              onClick={() => setActiveTab(value)}
            >
              {count > 0 ? `${label} (${count})` : label}
              {isActive && <span className={styles.tabActiveUnderline} />}
            </button>
          );
        })}
      </div>

      <div
        className={styles.body}
        style={{
          padding: 0,
          ...((activeTab === "analysis" || entityOnlyMode) ? { overflow: "hidden" } : {}),
        }}
      >
        {(activeTab === "analysis" || entityOnlyMode) && (
          <EntitySplitPanel
            euaHtml={euaHtml}
            entityViewMode={entityViewMode}
            onEntityViewModeChange={setEntityViewMode}
            entityOnlyMode={entityOnlyMode}
            showEntityBox={showEntityBox}
            onContextMenuError={panels.handleContextMenuError}
          >
            <AnalysisTabForm
              peopleList={initData.peopleList ?? []}
              fromPerson={form.fromPerson}
              onFromPersonChange={(v) => updateForm("fromPerson", v)}
              analysisSubject={form.analysisSubject}
              onAnalysisSubjectChange={(v) => updateForm("analysisSubject", v)}
              actualAnalysis={form.actualAnalysis}
              onActualAnalysisChange={(v) => updateForm("actualAnalysis", v)}
              editorRef={editorRef}
              onContextMenuQuestion={(text) => {
                panels.setAddQuestionInitial(text || null);
                panels.setShowAddQuestion(true);
              }}
              onContextMenuCompensator={(text, range) => {
                analysisCompensatorRangeRef.current = range;
                panels.handleContextMenuCompensator(text);
              }}
            />
          </EntitySplitPanel>
        )}

        {!entityOnlyMode && activeTab === "questions" && (
          <QuestionPanel
            items={panels.questions}
            onRemove={panels.removeQuestion}
            onOpenAdd={() => panels.setShowAddQuestion(true)}
            onOpenView={(q) => panels.setViewQuestion(q)}
            onOpenRespond={(q, idx) => panels.setRespondQuestion({ q, idx })}
            onSelectionChange={panels.setSelectedQuestionIdx}
          />
        )}
        {!entityOnlyMode && activeTab === "errors" && (
          <ErrorPanel
            items={panels.errors}
            onOpenAdd={() => panels.setShowAddError(true)}
            onOpenView={(e) => panels.setViewError(e)}
            onRemove={panels.removeError}
            onIdentifyCompensator={panels.handleIdentifyCompensator}
          />
        )}
        {!entityOnlyMode && activeTab === "compensators" && (
          <CompensatorPanel
            items={panels.compensators}
            onOpenAdd={() => panels.setShowAddCompensator(true)}
            onOpenView={(c) => panels.setViewCompensator(c)}
            onRemove={panels.removeCompensator}
          />
        )}
        {!entityOnlyMode && activeTab === "files" && (
          <AttachFilePanel
            items={panels.files}
            onAdd={panels.addFile}
            onRemove={panels.removeFile}
            onOpenAdd={() => panels.setShowAddFile(true)}
            onOpenView={(f) => panels.setViewFile(f)}
          />
        )}
        {!entityOnlyMode && activeTab === "problems" && (
          <ProblemPanel
            items={panels.problems}
            onOpenAdd={() => panels.setShowAddProblem(true)}
            onOpenView={(p) => panels.setViewProblem(p)}
            onOpenSolve={(p, idx) => panels.setSolveProblem({ problem: p, idx })}
            onRemove={panels.removeProblem}
          />
        )}
        {!entityOnlyMode && activeTab === "answers" && (
          <AnswerPanel
            items={panels.answers}
            onOpenView={(a) => panels.setViewAnswer(a)}
            onRemove={panels.removeAnswer}
            onSelectionChange={panels.setSelectedAnswerIdx}
          />
        )}

      </div>

      <div className={styles.footer}>
        {validationError ? (
          <span style={{ flex: 1, fontSize: "10.3px", color: "#D13438", lineHeight: "15px" }}>
            {validationError}
          </span>
        ) : (
          <span className={styles.footerHint}>Analysis can be applied as feedback after review.</span>
        )}
        <button style={btnStyle("cancel")} onClick={closeDialog}>
          Cancel
        </button>

        <SaveSplitButton onSave={save} />
      </div>

      <AnalyzeSubDialogs
        panels={panels}
        applicationName={initData?.applicationName}
        sendMessage={sendMessage}
        onAddError={(text) => applyEuaHighlight(text, "#FF0000")}
        onAddCompensator={() => applyAnalysisHighlight()}
      />

      {retainSaved && (
        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.18)", zIndex: 300 }}>
          <div style={{ width: 380, background: "#FFFFFF", borderRadius: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", padding: "28px 28px 20px", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#1B1B1B", marginBottom: 10 }}>Analysis Saved</div>
            <div style={{ fontSize: "12.5px", color: "#444", lineHeight: "19px", marginBottom: 22 }}>
              Your analysis has been saved.
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => sendMessage({ action: "CLOSE" })}
                style={{ height: 30, padding: "0 20px", background: "#0078D4", border: "none", borderRadius: 4, fontSize: "12.3px", fontWeight: 700, fontFamily: "inherit", color: "#FFFFFF", cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
