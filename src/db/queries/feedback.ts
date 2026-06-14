// src/db/queries/feedback.ts

import { getDb, persistDb, nowDate, nowTime } from "@/db/db";
import type { ProjectFeedback, SaveFeedbackPayload, SaveRequestFeedbackPayload, CommSignalInfo } from "@/types/db";

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
