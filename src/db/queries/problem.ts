// src/db/queries/problem.ts
import { getDb, persistDb, nowDate, nowTime } from "@/db/db";
import type { SaveProblemSolutionPayload } from "@/types/db";

export function saveProblemSolution(
  payload: Omit<SaveProblemSolutionPayload, "removeProblem" | "problemIdx">
): number {
  const db = getDb();
  const countResult = db.exec("SELECT MAX(solutionNumber) as mx FROM ProjectProblemSolution");
  const max = countResult[0]?.values[0]?.[0] as number | null;
  const solutionNumber = (max ?? 0) + 1;

  db.run(
    `INSERT INTO ProjectProblemSolution
       (solutionNumber, actualProblem, feedbackApplied, errorCorrected,
        compensatorReplaced, additionalExplanation, solutionDate, solutionTime)
     VALUES (?,?,?,?,?,?,?,?)`,
    [
      solutionNumber,
      payload.actualProblem,
      payload.feedbackApplied,
      payload.errorCorrected,
      payload.compensatorReplaced,
      payload.additionalExplanation,
      nowDate(),
      nowTime(),
    ]
  );

  const result = db.exec("SELECT last_insert_rowid() as id");
  const id = result[0]?.values[0]?.[0] as number;
  persistDb();
  return id;
}
