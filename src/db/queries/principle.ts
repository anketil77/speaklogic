// src/db/queries/principle.ts
// DB access for PrincipleInterpretation, PrincipleInSelection, and SelectionWithPrinciple tables.

import { getDb, persistDb } from "@/db/db";
import type {
  AttachFileToProject,
  PrincipleInterpretation,
  PrincipleInSelection,
  SelectionWithPrinciple,
} from "@/types/db";

export function getAllInterpretations(): PrincipleInterpretation[] {
  const db = getDb();
  const result = db.exec("SELECT * FROM PrincipleInterpretation");
  if (!result.length) return [];
  const cols = result[0].columns;
  return result[0].values.map((row) => {
    const obj: Record<string, unknown> = {};
    cols.forEach((col, i) => { obj[col] = row[i]; });
    return obj as unknown as PrincipleInterpretation;
  });
}

export function getInterpretationsByAnalysis(analysisId: number): PrincipleInterpretation[] {
  const db = getDb();
  const result = db.exec("SELECT * FROM PrincipleInterpretation WHERE analysisId = ?", [analysisId]);
  if (!result.length) return [];
  const cols = result[0].columns;
  return result[0].values.map((row) => {
    const obj: Record<string, unknown> = {};
    cols.forEach((col, i) => { obj[col] = row[i]; });
    return obj as unknown as PrincipleInterpretation;
  });
}

export function deleteInterpretation(id: number): void {
  const db = getDb();
  db.run("DELETE FROM PrincipleInterpretation WHERE id = ?", [id]);
  persistDb();
}

export function getFilesByPrincipleInterpretation(principleInterpretationId: number): AttachFileToProject[] {
  const db = getDb();
  const result = db.exec("SELECT * FROM AttachFileToProject WHERE principleInterpretationId = ?", [principleInterpretationId]);
  if (!result.length) return [];
  return result[0].values.map((row) => {
    const cols = result[0].columns;
    const obj: Record<string, unknown> = {};
    cols.forEach((col, i) => { obj[col] = row[i]; });
    return obj as unknown as AttachFileToProject;
  });
}

export function saveSelectionWithPrinciple(record: Omit<SelectionWithPrinciple, "id">): number {
  const db = getDb();
  db.run(
    `INSERT INTO SelectionWithPrinciple (actualSelection, actualPrinciple, principleName, setDerivedFrom, principleDescription, communicationPrinciple, commPrincipleDescription, actualRelationship, relationshipDescription, selectionType, analysisId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      record.actualSelection,
      record.actualPrinciple,
      record.principleName,
      record.setDerivedFrom,
      record.principleDescription,
      record.communicationPrinciple,
      record.commPrincipleDescription,
      record.actualRelationship,
      record.relationshipDescription,
      record.selectionType,
      record.analysisId ?? null,
    ]
  );
  persistDb();
  return Number(db.exec("SELECT last_insert_rowid()")[0].values[0][0]);
}

export function savePrincipleInSelection(record: Omit<PrincipleInSelection, "id">): number {
  const db = getDb();
  db.run(
    `INSERT INTO PrincipleInSelection (actualSelection, actualPrinciple, principleName, setDerivedFrom, principleDescription, communicationPrinciple, commPrincipleDescription, selectionType, analysisId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      record.actualSelection,
      record.actualPrinciple,
      record.principleName,
      record.setDerivedFrom,
      record.principleDescription,
      record.communicationPrinciple,
      record.commPrincipleDescription,
      record.selectionType,
      record.analysisId ?? null,
    ]
  );
  persistDb();
  return Number(db.exec("SELECT last_insert_rowid()")[0].values[0][0]);
}

export function addAttachedFile(file: Omit<AttachFileToProject, "id">): number {
  const db = getDb();
  const sql = `INSERT INTO AttachFileToProject (fileName, fileType, fileSize, fileDirectory, fileDescription, fileDate, fileTime, storageId, fullFileName, analysisId, feedbackId, flagId, articleId, principleInterpretationId, selectionWithPrincipleId, principleInSelectionId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.run(sql, [
    file.fileName, file.fileType, file.fileSize, file.fileDirectory,
    file.fileDescription, file.fileDate, file.fileTime,
    file.storageId, file.fullFileName,
    file.analysisId ?? null, file.feedbackId ?? null,
    file.flagId ?? null, file.articleId ?? null,
    file.principleInterpretationId ?? null,
    file.selectionWithPrincipleId ?? null,
    file.principleInSelectionId ?? null,
  ]);
  persistDb();
  return Number(db.exec("SELECT last_insert_rowid()")[0].values[0][0]);
}

export function removeAttachedFile(id: number): void {
  const db = getDb();
  db.run("DELETE FROM AttachFileToProject WHERE id = ?", [id]);
  persistDb();
}
