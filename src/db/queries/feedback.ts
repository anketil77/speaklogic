// src/db/queries/feedback.ts

import { getDb, persistDb, nowDate, nowTime } from "@/db/db";
import type { ProjectFeedback, SaveFeedbackPayload, SaveRequestFeedbackPayload, CommSignalInfo, AttachFileToProject } from "@/types/db";
import type { ImportedFeedback } from "@/dialog/utils/feedbackXml";

export function getAllFeedbacks(): ProjectFeedback[] {
  const db = getDb();
  const result = db.exec("SELECT * FROM ProjectFeedback ORDER BY id DESC");
  if (!result.length) return [];
  return result[0].values.map((row) => {
    const cols = result[0].columns;
    const obj: Record<string, unknown> = {};
    cols.forEach((col, i) => { obj[col] = row[i]; });
    return obj as unknown as ProjectFeedback;
  });
}

export function getFilesByFeedback(feedbackId: number): AttachFileToProject[] {
  const db = getDb();
  const result = db.exec("SELECT * FROM AttachFileToProject WHERE feedbackId = ?", [feedbackId]);
  if (!result.length) return [];
  return result[0].values.map((row) => {
    const cols = result[0].columns;
    const obj: Record<string, unknown> = {};
    cols.forEach((col, i) => { obj[col] = row[i]; });
    return obj as unknown as AttachFileToProject;
  });
}

export function deleteFeedback(id: number): void {
  const db = getDb();
  db.run("DELETE FROM ProjectFeedback WHERE id = ?", [id]);
  persistDb();
}

export function saveFeedbackHistory(params: {
  selectionAction: string;
  entityName: string;
  actualSelection: string;
  selectionType: string;
  source: string;
  applicationName: string;
  communicationFunction: string;
  communicationSignal: string;
  projectName: string;
  personName: string;
  personEmail: string;
}): void {
  try {
    const db = getDb();
    db.run(
      `INSERT INTO FlaggedEntityHistory (
        entityName, flaggedDate, flaggedTime, selectionAction,
        selectionType, source, applicationName, communicationFunction,
        communicationSignal, projectName, personName, personEmail, actualSelection
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        params.entityName,
        nowDate(),
        nowTime(),
        params.selectionAction,
        params.selectionType,
        params.source,
        params.applicationName,
        params.communicationFunction,
        params.communicationSignal,
        params.projectName,
        params.personName,
        params.personEmail,
        params.actualSelection,
      ]
    );
    persistDb();
  } catch {
    // non-critical audit record — do not block the main save
  }
}

export function saveFeedback(payload: SaveFeedbackPayload): number {
  const db = getDb();
  const f = payload.feedback;

  db.run(
    `INSERT INTO ProjectFeedback (
      feedbackApplication, feedbackDate, feedbackTime, fromPerson, toPerson,
      feedbackSubject, internalFeedbackName, feedbackType, actualSelection,
      selectionType, actualErrorSubstituted, actualCompensatorReplaced,
      source, applicationName, communicationFunction, communicationSignal,
      projectName, personName, personEmail, analysisId
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      f.feedbackApplication,
      f.feedbackDate || nowDate(),
      f.feedbackTime || nowTime(),
      f.fromPerson,
      f.toPerson,
      f.feedbackSubject,
      f.internalFeedbackName || "",
      f.feedbackType,
      f.actualSelection,
      f.selectionType,
      f.actualErrorSubstituted,
      f.actualCompensatorReplaced,
      f.source,
      f.applicationName,
      f.communicationFunction,
      f.communicationSignal,
      f.projectName,
      f.personName,
      f.personEmail,
      f.analysisId ?? null,
    ]
  );

  const result = db.exec("SELECT last_insert_rowid() as id");
  const id = result[0]?.values[0]?.[0] as number;

  if (payload.files?.length) {
    for (const file of payload.files) {
      db.run(
        `INSERT INTO AttachFileToProject (
          fileName, fileType, fileSize, fileDirectory, fileDescription,
          fileDate, fileTime, storageId, fullFileName, fileContent, feedbackId
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [
          file.fileName, file.fileType, file.fileSize, file.fileDirectory,
          file.fileDescription, file.fileDate, file.fileTime,
          file.storageId, file.fullFileName, file.fileContent ?? "", id,
        ]
      );
    }
  }

  if (payload.newCorrectedItems?.length && f.analysisId) {
    for (const ci of payload.newCorrectedItems) {
      db.run(
        `INSERT INTO ProjectCorrectedItem (
          correctedItemNumber, errorSelection, compensatorSelection,
          corrected, correctedDescription, analysisId
        ) VALUES (?,?,?,?,?,?)`,
        [ci.correctedItemNumber, ci.errorSelection, ci.compensatorSelection,
         ci.corrected, ci.correctedDescription, f.analysisId]
      );
    }
  }

  // Problems identified during the apply-feedback process — linked to this feedback.
  if (payload.problems?.length) {
    for (const pr of payload.problems) {
      db.run(
        `INSERT INTO ProjectProblem (
          problemNumber, problemName, actualProblem, fromActualError,
          problemDescription, problemDate, problemTime, feedbackId
        ) VALUES (?,?,?,?,?,?,?,?)`,
        [pr.problemNumber, pr.problemName, pr.actualProblem, pr.fromActualError,
         pr.problemDescription, pr.problemDate || nowDate(), pr.problemTime || nowTime(), id]
      );
    }
  }

  persistDb();
  return id;
}

export function saveCommSignalInfo(p: SaveRequestFeedbackPayload & { entitySelected: string }): number {
  const db = getDb();
  db.run(
    `INSERT INTO CommSignalInfo (
      fromPerson, toPerson, personAddress, applicationName, communicationFunction,
      communicationSignalType, communicationSubject, actualCommunication, actualSelection,
      selectionType, entitySelected, isCommunicationFeedbackRequested,
      communicationDate, communicationTime
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,1,?,?)`,
    [
      p.fromPerson, p.toPerson, p.toPersonEmail,
      p.applicationName, p.communicationFunction,
      p.communicationSignalType, p.communicationSubject,
      p.actualCommunication, p.actualSelection,
      p.selectionType, p.entitySelected,
      nowDate(), nowTime(),
    ]
  );
  const result = db.exec("SELECT last_insert_rowid() as id");
  const id = result[0]?.values[0]?.[0] as number;
  persistDb();
  return id;
}

// ── Feedback Requests (CommSignalInfo) ────────────────────────────────────────

/** Returns all CommSignalInfo rows where isCommunicationFeedbackRequested = 1. */
export function getCommSignalRequests(): CommSignalInfo[] {
  const db = getDb();
  const result = db.exec(
    `SELECT id, fromPerson, toPerson, personAddress, applicationName,
     communicationFunction, communicationSignalType, communicationSubject,
     communicationDate, communicationTime, actualCommunication, actualSelection,
     selectionType, entitySelected, isCommunicationFeedbackRequested,
     isCommunicationForReview, commSignalInfoIdentification
     FROM CommSignalInfo
     WHERE isCommunicationFeedbackRequested = 1
     ORDER BY id DESC`
  );
  if (!result[0]) return [];
  return result[0].values.map((row) => ({
    id:                              row[0]  as number,
    fromPerson:                      (row[1]  as string)  ?? "",
    toPerson:                        (row[2]  as string)  ?? "",
    personAddress:                   (row[3]  as string)  ?? "",
    applicationName:                 (row[4]  as string)  ?? "",
    communicationFunction:           (row[5]  as string)  ?? "",
    communicationSignalType:         (row[6]  as string)  ?? "",
    communicationSubject:            (row[7]  as string)  ?? "",
    communicationDate:               (row[8]  as string)  ?? "",
    communicationTime:               (row[9]  as string)  ?? "",
    actualCommunication:             (row[10] as string)  ?? "",
    actualSelection:                 (row[11] as string)  ?? "",
    selectionType:                   (row[12] as string)  ?? "",
    entitySelected:                  (row[13] as string)  ?? "",
    isCommunicationFeedbackRequested: 1 as 0 | 1,
    isCommunicationForReview:        (row[15] as 0 | 1)  ?? 0,
    commSignalInfoIdentification:    (row[16] as string)  ?? "",
  }));
}

/** Deletes a CommSignalInfo row (hides the feedback request from the list). */
export function deleteCommSignalRequest(id: number): void {
  const db = getDb();
  db.run("DELETE FROM CommSignalInfo WHERE id = ?", [id]);
  persistDb();
}

// ── XML import (Phase 1 foundation — no host wiring yet) ──────────────────────

/**
 * Collision-free import of one ImportedFeedback record: never writes an id from the
 * XML, mints fresh rows via AUTOINCREMENT and remaps every child FK to the new ids.
 * Mirrors saveFullAnalysis (analysis + children) and saveFeedback (feedback + extras).
 * Problem solutions are out of scope — ProjectProblemSolution.problemId is never
 * populated elsewhere in this app.
 */
export function importFeedback(data: ImportedFeedback): number {
  const db = getDb();
  const date = nowDate();
  const time = nowTime();

  let analysisId: number | undefined;

  if (data.analysis) {
    const a = data.analysis;
    const analysisProblems = a.problems.filter((p) => p.source === "analysis");

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
        a.analysisDate || date,
        a.analysisTime || time,
        a.personName,
        a.personEmail,
        a.selectionType,
        a.errors.length,
        a.questions.length,
        a.compensators.length,
        a.answers.length,
        analysisProblems.length,
        a.correctedItems.length,
      ]
    );
    const analysisResult = db.exec("SELECT last_insert_rowid() AS id");
    analysisId = analysisResult[0].values[0][0] as number;

    for (const e of a.errors) {
      db.run(
        `INSERT INTO ProjectError
          (errorNumber, actualError, fromActualCommunication, entityErrorPointTo, errorDescription, errorDate, errorTime, analysisId)
         VALUES (?,?,?,?,?,?,?,?)`,
        [e.errorNumber, e.actualError, e.fromActualCommunication, e.entityErrorPointTo, e.errorDescription, e.errorDate || date, e.errorTime || time, analysisId]
      );
    }
    for (const q of a.questions) {
      db.run(
        `INSERT INTO ProjectQuestion
          (questionNumber, actualQuestion, entityQuestionPointTo, responseStatus, questionDate, questionTime, analysisId)
         VALUES (?,?,?,?,?,?,?)`,
        [q.questionNumber, q.actualQuestion, q.entityQuestionPointTo, q.responseStatus, q.questionDate || date, q.questionTime || time, analysisId]
      );
    }
    for (const ans of a.answers) {
      db.run(
        `INSERT INTO ProjectAnswer
          (answerNumber, actualQuestion, entityQuestionPointTo, informationAnswerPointTo, actualAnswer, answerDate, answerTime, analysisId)
         VALUES (?,?,?,?,?,?,?,?)`,
        [ans.answerNumber, ans.actualQuestion, ans.entityQuestionPointTo, ans.informationAnswerPointTo, ans.actualAnswer, ans.answerDate || date, ans.answerTime || time, analysisId]
      );
    }
    for (const c of a.compensators) {
      db.run(
        `INSERT INTO ProjectCompensator
          (compensatorNumber, actualCompensator, actualErrorReplaced, inActualCommunication, compensatorDescription, compensatorDate, compensatorTime, analysisId)
         VALUES (?,?,?,?,?,?,?,?)`,
        [c.compensatorNumber, c.actualCompensator, c.actualErrorReplaced, c.inActualCommunication, c.compensatorDescription, c.compensatorDate || date, c.compensatorTime || time, analysisId]
      );
    }
    for (const ci of a.correctedItems) {
      db.run(
        `INSERT INTO ProjectCorrectedItem (
          correctedItemNumber, errorSelection, compensatorSelection, corrected, correctedDescription, analysisId
        ) VALUES (?,?,?,?,?,?)`,
        [ci.correctedItemNumber, ci.errorSelection, ci.compensatorSelection, ci.corrected, ci.correctedDescription, analysisId]
      );
    }
    for (const g of a.guidelineReferences) {
      db.run(
        `INSERT INTO GuidelineReference
          (guidelineText, guidelineNumber, guidelineLink, useLink, guidelineDate, guidelineTime, analysisId)
         VALUES (?,?,?,?,?,?,?)`,
        [g.guidelineText, g.guidelineNumber, g.guidelineLink, g.useLink, g.guidelineDate || date, g.guidelineTime || time, analysisId]
      );
    }
    for (const p of analysisProblems) {
      db.run(
        `INSERT INTO ProjectProblem
          (problemNumber, problemName, actualProblem, fromActualError, problemDescription, problemDate, problemTime, analysisId)
         VALUES (?,?,?,?,?,?,?,?)`,
        [p.problemNumber, p.problemName, p.actualProblem, p.fromActualError, p.problemDescription, p.problemDate || date, p.problemTime || time, analysisId]
      );
    }
    for (const f of a.files) {
      db.run(
        `INSERT INTO AttachFileToProject (fileName, fileType, fileSize, fileDirectory, fileDescription, fileDate, fileTime, storageId, fullFileName, fileContent, analysisId) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [f.fileName, f.fileType, f.fileSize, f.fileDirectory, f.fileDescription, f.fileDate || date, f.fileTime || time, f.storageId, f.fullFileName, f.fileContent ?? "", analysisId]
      );
    }
  }

  const fb = data.feedback;
  db.run(
    `INSERT INTO ProjectFeedback (
      feedbackApplication, feedbackDate, feedbackTime, fromPerson, toPerson,
      feedbackSubject, internalFeedbackName, feedbackType, actualSelection,
      selectionType, actualErrorSubstituted, actualCompensatorReplaced,
      source, applicationName, communicationFunction, communicationSignal,
      projectName, personName, personEmail, analysisId
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      fb.feedbackApplication,
      fb.feedbackDate || date,
      fb.feedbackTime || time,
      fb.fromPerson,
      fb.toPerson,
      fb.feedbackSubject,
      fb.internalFeedbackName || "",
      fb.feedbackType,
      fb.actualSelection,
      fb.selectionType,
      fb.actualErrorSubstituted,
      fb.actualCompensatorReplaced,
      fb.source,
      fb.applicationName,
      fb.communicationFunction,
      fb.communicationSignal,
      fb.projectName,
      fb.personName,
      fb.personEmail,
      analysisId ?? null,
    ]
  );
  const feedbackResult = db.exec("SELECT last_insert_rowid() AS id");
  const feedbackId = feedbackResult[0].values[0][0] as number;

  for (const p of data.problems ?? []) {
    db.run(
      `INSERT INTO ProjectProblem
        (problemNumber, problemName, actualProblem, fromActualError, problemDescription, problemDate, problemTime, feedbackId)
       VALUES (?,?,?,?,?,?,?,?)`,
      [p.problemNumber, p.problemName, p.actualProblem, p.fromActualError, p.problemDescription, p.problemDate || date, p.problemTime || time, feedbackId]
    );
  }
  for (const f of data.files ?? []) {
    db.run(
      `INSERT INTO AttachFileToProject (fileName, fileType, fileSize, fileDirectory, fileDescription, fileDate, fileTime, storageId, fullFileName, fileContent, feedbackId) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [f.fileName, f.fileType, f.fileSize, f.fileDirectory, f.fileDescription, f.fileDate || date, f.fileTime || time, f.storageId, f.fullFileName, f.fileContent ?? "", feedbackId]
    );
  }

  persistDb();
  return feedbackId;
}
