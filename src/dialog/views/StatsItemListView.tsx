// src/dialog/views/StatsItemListView.tsx
// Point 29 (#7): flat list of every identified item of a given kind (Error,
// Compensator, Question, Answer, Problem) across all analyses, opened from the
// Stats Overview cards. Selecting a row opens the item's View dialog, which
// carries a "View Analysis" button to jump to the analysis the item belongs to.

import React, { useMemo, useState, useCallback } from "react";
import { formatDisplayDate } from "@/db/db";
import { FooterBar, FooterStatusText, DismissBtn } from "@/dialog/components/FooterButtons";
import { useDialogComm } from "@/dialog/hooks/useDialogComm";
import { PanelTable, type PanelTableCol } from "@/dialog/components/PanelTable";
import { ViewErrorDialog } from "@/dialog/components/ViewErrorDialog";
import { ViewCompensatorDialog } from "@/dialog/components/ViewCompensatorDialog";
import { ViewQuestionDialog } from "@/dialog/components/ViewQuestionDialog";
import { ViewAnswerDialog } from "@/dialog/components/ViewAnswerDialog";
import { ViewProblemDialog } from "@/dialog/components/ViewProblemDialog";
import { ViewAnalysisDialog } from "@/dialog/components/ViewAnalysisDialog";
import { ErrorIcon, CompensatorIcon, QuestionIcon, AnswerIcon, ProblemIcon, SmallCaretDownIcon } from "@/dialog/components/Icons";
import { colors } from "@/styles/tokens";
import type {
  ProjectAnalysis,
  ProjectError,
  ProjectCompensator,
  ProjectQuestion,
  ProjectAnswer,
  ProjectProblem,
} from "@/types/db";

export type StatsItemKind = "errors" | "compensators" | "questions" | "answers" | "problems";

type AnyItem = ProjectError | ProjectCompensator | ProjectQuestion | ProjectAnswer | ProjectProblem;

interface Row {
  item: AnyItem;
  analysis: ProjectAnalysis;
}

const META: Record<StatsItemKind, { title: string; subtitle: string; icon: React.ReactNode; primary: string; noun: string }> = {
  errors: {
    title: "List of Identified Errors",
    subtitle: "Every error identified across all analyses. Select one to view its details or its analysis.",
    icon: <ErrorIcon />, primary: "View Selected Error", noun: "errors",
  },
  compensators: {
    title: "List of Identified Compensators",
    subtitle: "Every compensator identified across all analyses. Select one to view its details or its analysis.",
    icon: <CompensatorIcon />, primary: "View Selected Compensator", noun: "compensators",
  },
  questions: {
    title: "List of Analysis Questions",
    subtitle: "Every analysis question across all analyses. Select one to view its details or its analysis.",
    icon: <QuestionIcon />, primary: "View Selected Question", noun: "questions",
  },
  answers: {
    title: "List of Answered Questions",
    subtitle: "Every answered question across all analyses. Select one to view its details or its analysis.",
    icon: <AnswerIcon />, primary: "View Selected Answer", noun: "answers",
  },
  problems: {
    title: "List of Identified Problems",
    subtitle: "Every problem identified across all analyses. Select one to view its details or its analysis.",
    icon: <ProblemIcon />, primary: "View Selected Problem", noun: "problems",
  },
};

function itemsOf(a: ProjectAnalysis, kind: StatsItemKind): AnyItem[] {
  switch (kind) {
    case "errors": return a.errors ?? [];
    case "compensators": return a.compensators ?? [];
    case "questions": return a.questions ?? [];
    case "answers": return a.answers ?? [];
    case "problems": return a.problems ?? [];
  }
}

export default function StatsItemListView({ kind }: { kind: StatsItemKind }) {
  const { initData, closeDialog } = useDialogComm();
  const meta = META[kind];

  const rows = useMemo<Row[]>(() => {
    const analyses = (initData?.analyses ?? []) as ProjectAnalysis[];
    const out: Row[] = [];
    for (const a of analyses) for (const item of itemsOf(a, kind)) out.push({ item, analysis: a });
    return out;
  }, [initData, kind]);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [viewRow, setViewRow] = useState<Row | null>(null);
  const [viewAnalysis, setViewAnalysis] = useState<ProjectAnalysis | null>(null);

  const hasSelection = selectedIndex !== null;
  const handleRowClick = useCallback((idx: number) => {
    setSelectedIndex((prev) => (prev === idx ? null : idx));
  }, []);

  const openSelected = useCallback(() => {
    if (selectedIndex !== null) setViewRow(rows[selectedIndex]);
  }, [selectedIndex, rows]);

  const goToAnalysis = useCallback(() => {
    if (!viewRow) return;
    const a = viewRow.analysis;
    setViewRow(null);
    setViewAnalysis(a);
  }, [viewRow]);

  const COLUMNS = useMemo<PanelTableCol<Row>[]>(() => {
    switch (kind) {
      case "errors":
        return [
          { header: "Actual Error", width: "40%", render: (r) => (r.item as ProjectError).actualError || "—", truncate: true },
          { header: "From Comm / App", width: "33%", render: (r) => (r.item as ProjectError).fromActualCommunication || "—", truncate: true },
          { header: "Error Date", width: "27%", render: (r) => formatDisplayDate((r.item as ProjectError).errorDate) || "—", truncate: true },
        ];
      case "compensators":
        return [
          { header: "Actual Compensator", width: "40%", render: (r) => (r.item as ProjectCompensator).actualCompensator || "—", truncate: true },
          { header: "Actual Error", width: "33%", render: (r) => (r.item as ProjectCompensator).actualErrorReplaced || "—", truncate: true },
          { header: "Compensator Date", width: "27%", render: (r) => formatDisplayDate((r.item as ProjectCompensator).compensatorDate) || "—", truncate: true },
        ];
      case "questions":
        return [
          { header: "Actual Question", width: "40%", render: (r) => (r.item as ProjectQuestion).actualQuestion || "—", truncate: true },
          { header: "Entity Points To", width: "33%", render: (r) => (r.item as ProjectQuestion).entityQuestionPointTo || "—", truncate: true },
          { header: "Question Date", width: "27%", render: (r) => formatDisplayDate((r.item as ProjectQuestion).questionDate) || "—", truncate: true },
        ];
      case "answers":
        return [
          { header: "Actual Question", width: "40%", render: (r) => (r.item as ProjectAnswer).actualQuestion || "—", truncate: true },
          { header: "Actual Answer", width: "33%", render: (r) => (r.item as ProjectAnswer).actualAnswer || "—", truncate: true },
          { header: "Answer Date", width: "27%", render: (r) => formatDisplayDate((r.item as ProjectAnswer).answerDate) || "—", truncate: true },
        ];
      case "problems":
        return [
          { header: "Actual Problem", width: "40%", render: (r) => (r.item as ProjectProblem).actualProblem || "—", truncate: true },
          { header: "From Actual Error", width: "33%", render: (r) => (r.item as ProjectProblem).fromActualError || "—", truncate: true },
          { header: "Problem Date", width: "27%", render: (r) => formatDisplayDate((r.item as ProjectProblem).problemDate) || "—", truncate: true },
        ];
    }
  }, [kind]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Inter, Segoe UI, sans-serif",
        background: colors.white,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* ── Header ── */}
      <div style={{ height: 78, minHeight: 78, display: "flex", alignItems: "flex-start", padding: "0 20px", boxSizing: "border-box" }}>
        <div style={{ width: 32, height: 32, borderRadius: 6, background: "#EBF3FC", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 21, flexShrink: 0 }}>
          {meta.icon}
        </div>
        <div style={{ marginLeft: 12, marginTop: 20, display: "flex", flexDirection: "column", flex: 1 }}>
          <span style={{ fontWeight: 700, fontSize: 15.6, lineHeight: "21px", color: colors.grey11, letterSpacing: -0.1 }}>{meta.title}</span>
          <span style={{ fontWeight: 400, fontSize: 11.1, lineHeight: "17px", color: colors.grey38, marginTop: 3 }}>{meta.subtitle}</span>
        </div>
      </div>

      {/* ── Command bar ── */}
      <div style={{ height: 44, minHeight: 44, background: colors.grey96, display: "flex", alignItems: "center", padding: "0 12px", gap: 8, boxSizing: "border-box" }}>
        <button
          disabled={!hasSelection}
          onClick={openSelected}
          style={{
            height: 28, paddingLeft: 10, paddingRight: 8, display: "flex", alignItems: "center", gap: 6,
            background: hasSelection ? colors.azure42 : "#C5C5C5", color: colors.white, border: "none",
            borderRadius: 4, cursor: hasSelection ? "pointer" : "default", fontSize: 11.4, fontWeight: 700,
            fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0,
          }}
        >
          {meta.primary}
          <SmallCaretDownIcon color="white" />
        </button>
      </div>

      {/* ── Table body ── */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {rows.length === 0 ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: colors.grey38 }}>
            <span style={{ fontWeight: 700, fontSize: 12.8 }}>No {meta.noun} identified yet</span>
            <span style={{ fontSize: 11.1, color: colors.grey74 }}>Identify one from the ribbon to see it here.</span>
          </div>
        ) : (
          <PanelTable<Row>
            columns={COLUMNS}
            rows={rows}
            selectedIndex={selectedIndex}
            onRowClick={handleRowClick}
            selectionColor={colors.grey95}
          />
        )}
      </div>

      {/* ── Footer ── */}
      <FooterBar>
        <FooterStatusText>
          {hasSelection ? "1 row selected." : `${rows.length} ${rows.length === 1 ? "item" : "items"}.`}
        </FooterStatusText>
        <DismissBtn label="Close" onClick={closeDialog} />
      </FooterBar>

      {/* ── Item View dialog (with View Analysis) ── */}
      {viewRow && kind === "errors" && (
        <ViewErrorDialog error={viewRow.item as ProjectError} onClose={() => setViewRow(null)} onViewAnalysis={goToAnalysis} />
      )}
      {viewRow && kind === "compensators" && (
        <ViewCompensatorDialog compensator={viewRow.item as ProjectCompensator} onClose={() => setViewRow(null)} onViewAnalysis={goToAnalysis} />
      )}
      {viewRow && kind === "questions" && (
        <ViewQuestionDialog question={viewRow.item as ProjectQuestion} onClose={() => setViewRow(null)} onViewAnalysis={goToAnalysis} />
      )}
      {viewRow && kind === "answers" && (
        <ViewAnswerDialog answer={viewRow.item as ProjectAnswer} onClose={() => setViewRow(null)} onViewAnalysis={goToAnalysis} />
      )}
      {viewRow && kind === "problems" && (
        <ViewProblemDialog problem={viewRow.item as ProjectProblem} onClose={() => setViewRow(null)} onViewAnalysis={goToAnalysis} />
      )}

      {/* ── Analysis dialog (opened via "View Analysis") ── */}
      {viewAnalysis && (
        <ViewAnalysisDialog analysis={viewAnalysis} onClose={() => setViewAnalysis(null)} />
      )}
    </div>
  );
}
