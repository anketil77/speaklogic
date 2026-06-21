// src/db/queries/stats.ts
// Point 14 — "Stats Overview": aggregate counts for every tracked entity type.
// Read-only; computed on demand in the host and passed into the dialog INIT payload.

import { getDb } from "@/db/db";
import type { StatsOverview } from "@/types/db";

function count(sql: string): number {
  const db = getDb();
  const r = db.exec(sql);
  if (!r.length || !r[0].values.length) return 0;
  return (r[0].values[0][0] as number) ?? 0;
}

export function getStatsOverview(): StatsOverview {
  return {
    analyses:          count("SELECT COUNT(*) FROM ProjectAnalysis"),
    feedbackProvided:  count("SELECT COUNT(*) FROM ProjectFeedback WHERE feedbackType = 'Provided'"),
    feedbackRequested: count("SELECT COUNT(*) FROM CommSignalInfo WHERE isCommunicationFeedbackRequested = 1"),
    feedbackReceived:  count("SELECT COUNT(*) FROM ProjectFeedback WHERE feedbackType = 'Received'"),
    feedbackApplied:   count("SELECT COUNT(*) FROM ProjectFeedback WHERE feedbackType = 'Applied'"),
    errors:            count("SELECT COUNT(*) FROM ProjectError"),
    compensators:      count("SELECT COUNT(*) FROM ProjectCompensator"),
    problemsIdentified: count("SELECT COUNT(*) FROM ProjectProblem"),
    problemsSolved:    count("SELECT COUNT(*) FROM ProjectProblemSolution"),
    questions:         count("SELECT COUNT(*) FROM ProjectQuestion"),
    answeredQuestions: count("SELECT COUNT(*) FROM ProjectAnswer"),
    guidelines:        count("SELECT COUNT(*) FROM GuidelineReference"),
  };
}
