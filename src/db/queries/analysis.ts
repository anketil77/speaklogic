// src/db/queries/analysis.ts

import { getDb, persistDb, nowDate, nowTime } from "@/db/db";
import type {
  ProjectAnalysis,
  ProjectError,
  ProjectCompensator,
  ProjectQuestion,
  ProjectAnswer,
  ProjectProblem,
  AttachFileToProject,
  SaveAnalysisPayload,
} from "@/types/db";

export function saveFullAnalysis(payload: SaveAnalysisPayload): number {
  const db = getDb();
  const a = payload.analysis;

  db.run(
    `INSERT INTO ProjectAnalysis (
      entityUnderAnalysis, fromPerson, analysisSubject,
      actualAnalysis, whatToDoWithAnalysis,
      source, applicationName, communicationFunction, communicationSignal,
      projectName, analysisDate, analysisTime, personName, personEmail,
      selectionType, errorCount, questionCount, compensatorCount,
      answerCount, problemCount, correctedItemCount
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      a.entityUnderAnalysis,
      a.fromPerson ?? "",
      a.analysisSubject ?? "",
      a.actualAnalysis,
      a.whatToDoWithAnalysis,
      a.source,
      a.applicationName,
      a.communicationFunction,
      a.communicationSignal,
      a.projectName,
      a.analysisDate,
      a.analysisTime,
      a.personName,
      a.personEmail,
      a.selectionType,
      payload.errors.length,
      payload.questions.length,
      payload.compensators.length,
      payload.answers.length,
      payload.problems.length,
      0,
    ]
  );

  const result = db.exec("SELECT last_insert_rowid() AS id");
  const analysisId = result[0].values[0][0] as number;

  const date = nowDate();
  const time = nowTime();

  for (const e of payload.errors) {
    db.run(
      `INSERT INTO ProjectError
        (errorNumber, actualError, fromActualCommunication, entityErrorPointTo, errorDescription, errorDate, errorTime, analysisId)
       VALUES (?,?,?,?,?,?,?,?)`,
      [e.errorNumber, e.actualError, e.fromActualCommunication, e.entityErrorPointTo, e.errorDescription, date, time, analysisId]
    );
  }
  for (const q of payload.questions) {
    db.run(
      `INSERT INTO ProjectQuestion
        (questionNumber, actualQuestion, entityQuestionPointTo, responseStatus, questionDate, questionTime, analysisId)
       VALUES (?,?,?,?,?,?,?)`,
      [q.questionNumber, q.actualQuestion, q.entityQuestionPointTo, q.responseStatus, date, time, analysisId]
    );
  }
  for (const a of payload.answers) {
    db.run(
      `INSERT INTO ProjectAnswer
        (answerNumber, actualQuestion, entityQuestionPointTo, informationAnswerPointTo, actualAnswer, answerDate, answerTime, analysisId)
       VALUES (?,?,?,?,?,?,?,?)`,
      [a.answerNumber, a.actualQuestion, a.entityQuestionPointTo, a.informationAnswerPointTo, a.actualAnswer, date, time, analysisId]
    );
  }
  for (const c of payload.compensators) {
    db.run(
      `INSERT INTO ProjectCompensator
        (compensatorNumber, actualCompensator, actualErrorReplaced, inActualCommunication, compensatorDescription, compensatorDate, compensatorTime, analysisId)
       VALUES (?,?,?,?,?,?,?,?)`,
      [c.compensatorNumber, c.actualCompensator, c.actualErrorReplaced, c.inActualCommunication, c.compensatorDescription, date, time, analysisId]
    );
  }
  for (const p of payload.problems) {
    db.run(
      `INSERT INTO ProjectProblem
        (problemNumber, problemName, actualProblem, fromActualError, problemDescription, problemDate, problemTime, analysisId)
       VALUES (?,?,?,?,?,?,?,?)`,
      [p.problemNumber, p.problemName, p.actualProblem, p.fromActualError, p.problemDescription, date, time, analysisId]
    );
  }
  for (const f of payload.files) {
    db.run(
      `INSERT INTO AttachFileToProject (fileName, fileType, fileSize, fileDirectory, fileDescription, fileDate, fileTime, storageId, fullFileName, analysisId) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        f.fileName,
        f.fileType,
        f.fileSize,
        f.fileDirectory,
        f.fileDescription,
        f.fileDate || date,
        f.fileTime || time,
        f.storageId,
        f.fullFileName,
        analysisId,
      ]
    );
  }
  for (const g of payload.guidelineReferences ?? []) {
    db.run(
      `INSERT INTO GuidelineReference
        (guidelineText, guidelineNumber, guidelineLink, useLink, guidelineDate, guidelineTime, analysisId)
       VALUES (?,?,?,?,?,?,?)`,
      [g.guidelineText, g.guidelineNumber, g.guidelineLink, g.useLink, g.guidelineDate || date, g.guidelineTime || time, analysisId]
    );
  }

  persistDb();
  return analysisId;
}

// ─── Inline Identify (Point 9) ──────────────────────────────────────────────
// Returns every error across all analyses (newest first). Used to populate the
// "Actual Error To Replace" dropdown in the inline Compensator dialog.
export function getAllErrors(): ProjectError[] {
  const db = getDb();
  const result = db.exec("SELECT * FROM ProjectError ORDER BY id DESC");
  if (!result.length) return [];
  return result[0].values.map((row) => {
    const cols = result[0].columns;
    const obj: Record<string, unknown> = {};
    cols.forEach((col, i) => { obj[col] = row[i]; });
    return obj as unknown as ProjectError;
  });
}

// Finds the analysis a given error text belongs to (most recent match), so an
// inline compensator can be attached to the same on-the-fly analysis.
export function findAnalysisIdByErrorText(actualError: string): number | null {
  const db = getDb();
  const result = db.exec(
    "SELECT analysisId FROM ProjectError WHERE actualError = ? AND analysisId IS NOT NULL ORDER BY id DESC LIMIT 1",
    [actualError]
  );
  if (!result.length || !result[0].values.length) return null;
  return result[0].values[0][0] as number;
}

// Inserts a single compensator into an existing analysis and bumps its count.
export function addCompensatorToAnalysis(
  analysisId: number,
  c: Omit<ProjectCompensator, "id" | "analysisId">
): void {
  const db = getDb();
  db.run(
    `INSERT INTO ProjectCompensator
      (compensatorNumber, actualCompensator, actualErrorReplaced, inActualCommunication, compensatorDescription, compensatorDate, compensatorTime, analysisId)
     VALUES (?,?,?,?,?,?,?,?)`,
    [c.compensatorNumber, c.actualCompensator, c.actualErrorReplaced, c.inActualCommunication, c.compensatorDescription, c.compensatorDate || nowDate(), c.compensatorTime || nowTime(), analysisId]
  );
  db.run(
    "UPDATE ProjectAnalysis SET compensatorCount = compensatorCount + 1 WHERE id = ?",
    [analysisId]
  );
  persistDb();
}

export function getAllAnalyses(): ProjectAnalysis[] {
  const db = getDb();
  const result = db.exec("SELECT * FROM ProjectAnalysis ORDER BY id DESC");
  if (!result.length) return [];
  return result[0].values.map((row) => {
    const cols = result[0].columns;
    const obj: Record<string, unknown> = {};
    cols.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as unknown as ProjectAnalysis;
  });
}

export function getAnalysisById(id: number): ProjectAnalysis | null {
  const db = getDb();
  const result = db.exec("SELECT * FROM ProjectAnalysis WHERE id = ?", [id]);
  if (!result.length || !result[0].values.length) return null;
  const cols = result[0].columns;
  const obj: Record<string, unknown> = {};
  cols.forEach((col, i) => { obj[col] = result[0].values[0][i]; });
  return obj as unknown as ProjectAnalysis;
}

export function getRetainedAnalyses(): ProjectAnalysis[] {
  const db = getDb();
  const result = db.exec(
    "SELECT * FROM ProjectAnalysis WHERE whatToDoWithAnalysis = 'RetainAnalysisAsNeed' ORDER BY id DESC"
  );
  if (!result.length) return [];
  return result[0].values.map((row) => {
    const cols = result[0].columns;
    const obj: Record<string, unknown> = {};
    cols.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as unknown as ProjectAnalysis;
  });
}

export function deleteAnalysis(id: number): void {
  const db = getDb();
  db.run("DELETE FROM ProjectAnalysis WHERE id = ?", [id]);
  persistDb();
}

export function getErrorsByAnalysis(analysisId: number): ProjectError[] {
  const db = getDb();
  const result = db.exec("SELECT * FROM ProjectError WHERE analysisId = ?", [analysisId]);
  if (!result.length) return [];
  return result[0].values.map((row) => {
    const cols = result[0].columns;
    const obj: Record<string, unknown> = {};
    cols.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as unknown as ProjectError;
  });
}

export function getQuestionsByAnalysis(analysisId: number): ProjectQuestion[] {
  const db = getDb();
  const result = db.exec("SELECT * FROM ProjectQuestion WHERE analysisId = ?", [analysisId]);
  if (!result.length) return [];
  return result[0].values.map((row) => {
    const cols = result[0].columns;
    const obj: Record<string, unknown> = {};
    cols.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as unknown as ProjectQuestion;
  });
}

export function getCompensatorsByAnalysis(analysisId: number): ProjectCompensator[] {
  const db = getDb();
  const result = db.exec("SELECT * FROM ProjectCompensator WHERE analysisId = ?", [analysisId]);
  if (!result.length) return [];
  return result[0].values.map((row) => {
    const cols = result[0].columns;
    const obj: Record<string, unknown> = {};
    cols.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as unknown as ProjectCompensator;
  });
}

export function getProblemsByAnalysis(analysisId: number): ProjectProblem[] {
  const db = getDb();
  const result = db.exec("SELECT * FROM ProjectProblem WHERE analysisId = ?", [analysisId]);
  if (!result.length) return [];
  return result[0].values.map((row) => {
    const cols = result[0].columns;
    const obj: Record<string, unknown> = {};
    cols.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as unknown as ProjectProblem;
  });
}

export function getProblemsByFeedback(feedbackId: number): ProjectProblem[] {
  const db = getDb();
  const result = db.exec("SELECT * FROM ProjectProblem WHERE feedbackId = ?", [feedbackId]);
  if (!result.length) return [];
  return result[0].values.map((row) => {
    const cols = result[0].columns;
    const obj: Record<string, unknown> = {};
    cols.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as unknown as ProjectProblem;
  });
}

export function getAnswersByAnalysis(analysisId: number): ProjectAnswer[] {
  const db = getDb();
  const result = db.exec("SELECT * FROM ProjectAnswer WHERE analysisId = ?", [analysisId]);
  if (!result.length) return [];
  return result[0].values.map((row) => {
    const cols = result[0].columns;
    const obj: Record<string, unknown> = {};
    cols.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as unknown as ProjectAnswer;
  });
}

export function getGuidelinesByAnalysis(analysisId: number): import("@/types/db").GuidelineReference[] {
  const db = getDb();
  const result = db.exec("SELECT * FROM GuidelineReference WHERE analysisId = ?", [analysisId]);
  if (!result.length) return [];
  return result[0].values.map((row) => {
    const cols = result[0].columns;
    const obj: Record<string, unknown> = {};
    cols.forEach((col, i) => { obj[col] = row[i]; });
    return obj as unknown as import("@/types/db").GuidelineReference;
  });
}

export function getFilesByAnalysis(analysisId: number): AttachFileToProject[] {
  const db = getDb();
  const result = db.exec("SELECT * FROM AttachFileToProject WHERE analysisId = ?", [analysisId]);
  if (!result.length) return [];
  return result[0].values.map((row) => {
    const cols = result[0].columns;
    const obj: Record<string, unknown> = {};
    cols.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as unknown as AttachFileToProject;
  });
}
