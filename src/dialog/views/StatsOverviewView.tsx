// src/dialog/views/StatsOverviewView.tsx
// Point 14 — "Stats Overview": read-only dashboard of entity counts.
// Each card click opens the relevant list (analysis / feedback pre-filtered /
// feedback requested). Item-type cards (error, compensator, problem, question,
// guideline) open the List of Analysis they belong to, per the client spec.

import React, { useMemo, useCallback } from "react";
import { FooterBar, FooterStatusText, DismissBtn } from "@/dialog/components/FooterButtons";
import { useDialogComm } from "@/dialog/hooks/useDialogComm";
import {
  AnalysisHistoryHeaderIcon,
  FbHistoryListProvidedIcon,
  FbHistoryListRequestedIcon,
  FbHistoryListReceivedIcon,
  FbHistoryListAppliedIcon,
  ErrorIcon,
  CompensatorIcon,
  ProblemIcon,
  QuestionIcon,
  AnswerIcon,
  GuidelineReferenceIcon,
} from "@/dialog/components/Icons";
import { colors } from "@/styles/tokens";
import type { StatsOverview, StatsListTarget } from "@/types/db";

interface CardDef {
  label: string;
  value: number;
  target: StatsListTarget;
  feedbackFilter?: string;
  icon: React.ReactNode;
}

const EMPTY_STATS: StatsOverview = {
  analyses: 0, feedbackProvided: 0, feedbackRequested: 0, feedbackReceived: 0,
  feedbackApplied: 0, errors: 0, compensators: 0, problemsIdentified: 0,
  problemsSolved: 0, questions: 0, answeredQuestions: 0, guidelines: 0,
};

export default function StatsOverviewView(): React.ReactElement {
  const { initData, sendMessage, closeDialog } = useDialogComm();
  const stats = initData?.stats ?? EMPTY_STATS;

  const cards: CardDef[] = useMemo(
    () => [
      { label: "Analysis",          value: stats.analyses,          target: "analysis", icon: <AnalysisHistoryHeaderIcon /> },
      { label: "Feedback Provided", value: stats.feedbackProvided,  target: "feedback", feedbackFilter: "Provided", icon: <FbHistoryListProvidedIcon /> },
      { label: "Feedback Requested", value: stats.feedbackRequested, target: "requested", icon: <FbHistoryListRequestedIcon /> },
      { label: "Feedback Received", value: stats.feedbackReceived,   target: "feedback", feedbackFilter: "Received", icon: <FbHistoryListReceivedIcon /> },
      { label: "Feedback Applied",  value: stats.feedbackApplied,    target: "feedback", feedbackFilter: "Applied", icon: <FbHistoryListAppliedIcon /> },
      { label: "Errors Identified", value: stats.errors,            target: "errors", icon: <ErrorIcon /> },
      { label: "Compensator",       value: stats.compensators,      target: "compensators", icon: <CompensatorIcon /> },
      { label: "Problem Identified", value: stats.problemsIdentified, target: "analysis", icon: <ProblemIcon /> },
      { label: "Problem Solved",    value: stats.problemsSolved,    target: "analysis", icon: <ProblemIcon /> },
      { label: "Analysis Question", value: stats.questions,         target: "analysis", icon: <QuestionIcon /> },
      { label: "Answered Question", value: stats.answeredQuestions, target: "analysis", icon: <AnswerIcon /> },
      { label: "Guideline",         value: stats.guidelines,        target: "analysis", icon: <GuidelineReferenceIcon /> },
    ],
    [stats]
  );

  const total = useMemo(() => cards.reduce((s, c) => s + c.value, 0), [cards]);

  const openList = useCallback(
    (c: CardDef) => {
      sendMessage({ action: "OPEN_STATS_LIST", target: c.target, feedbackFilter: c.feedbackFilter });
    },
    [sendMessage]
  );

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
        <div
          style={{
            width: 32, height: 32, borderRadius: 6, background: "#EBF3FC",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginTop: 21, flexShrink: 0,
          }}
        >
          <AnalysisHistoryHeaderIcon />
        </div>
        <div style={{ marginLeft: 12, marginTop: 20, display: "flex", flexDirection: "column", flex: 1 }}>
          <span style={{ fontWeight: 700, fontSize: 15.6, lineHeight: "21px", color: colors.grey11, letterSpacing: -0.1 }}>
            Stats Overview
          </span>
          <span style={{ fontWeight: 400, fontSize: 11.3, lineHeight: "17px", color: colors.grey38, marginTop: 3 }}>
            Counts across all analyses, feedback and identified items. Click a card to open its list.
          </span>
        </div>
      </div>

      {/* ── Cards grid ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 20px 16px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          {cards.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => openList(c)}
              aria-label={`${c.label}: ${c.value}. Open list.`}
              style={{
                textAlign: "left",
                background: colors.white,
                border: `1px solid ${colors.grey88}`,
                borderRadius: 10,
                padding: "16px 16px 14px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                transition: "border-color 0.12s, box-shadow 0.12s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.azure42;
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.grey88;
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  aria-hidden
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 7,
                    background: "#EBF3FC",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {c.icon}
                </span>
                <span style={{ fontWeight: 700, fontSize: 22, lineHeight: "26px", color: colors.grey11 }}>
                  {c.value}
                </span>
              </div>
              <span style={{ fontSize: 12.5, lineHeight: "16px", color: colors.grey38 }}>
                {c.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <FooterBar>
        <FooterStatusText>{total} items tracked</FooterStatusText>
        <DismissBtn label="Close" onClick={closeDialog} />
      </FooterBar>
    </div>
  );
}
