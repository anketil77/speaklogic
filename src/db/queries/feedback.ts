// src/db/queries/feedback.ts

import { getDb, persistDb, nowDate, nowTime } from "@/db/db";
import type { ProjectFeedback, SaveFeedbackPayload, SaveRequestFeedbackPayload } from "@/types/db";

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
          fileDate, fileTime, storageId, fullFileName, feedbackId
        ) VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [
          file.fileName, file.fileType, file.fileSize, file.fileDirectory,
          file.fileDescription, file.fileDate, file.fileTime,
          file.storageId, file.fullFileName, id,
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
