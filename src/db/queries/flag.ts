// src/db/queries/flag.ts

import { getDb, persistDb, nowDate, nowTime } from "@/db/db";
import type { FlagEntityForAnalysis } from "@/types/db";

export function saveFlag(flag: Omit<FlagEntityForAnalysis, "id">): number {
  const db = getDb();
  db.run(
    `INSERT INTO FlagEntityForAnalysis (
      actualSelection, selectionType, source,
      applicationName, communicationFunction, communicationSignal, projectName,
      flagDate, flagTime, personName, personEmail, wasEntityAnalyzed
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      flag.actualSelection,
      flag.selectionType,
      flag.source,
      flag.applicationName,
      flag.communicationFunction,
      flag.communicationSignal,
      flag.projectName,
      flag.flagDate || nowDate(),
      flag.flagTime || nowTime(),
      flag.personName,
      flag.personEmail,
      flag.wasEntityAnalyzed ?? "No",
    ]
  );

  const result = db.exec("SELECT last_insert_rowid() as id");
  const id = result[0]?.values[0]?.[0] as number;

  try {
    db.run(
      `INSERT INTO FlaggedEntityHistory (
        entityName, flaggedDate, flaggedTime, selectionAction,
        selectionType, source, applicationName, communicationFunction,
        communicationSignal, projectName, personName, personEmail,
        actualSelection, flagEntityForAnalysisId
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        flag.applicationName || flag.actualSelection.slice(0, 100),
        nowDate(),
        nowTime(),
        "Flagged For Analysis",
        flag.selectionType,
        flag.source,
        flag.applicationName,
        flag.communicationFunction,
        flag.communicationSignal,
        flag.projectName,
        flag.personName,
        flag.personEmail,
        flag.actualSelection,
        id,
      ]
    );
  } catch {
    // non-critical audit record
  }

  persistDb();
  return id;
}

export function getAllFlaggedSelections(): FlagEntityForAnalysis[] {
  const db = getDb();
  const result = db.exec(
    `SELECT id, actualSelection, selectionType, source, applicationName,
            communicationFunction, communicationSignal, projectName,
            flagDate, flagTime, personName, personEmail, wasEntityAnalyzed
     FROM FlagEntityForAnalysis
     ORDER BY flagDate DESC, flagTime DESC`
  );
  if (!result.length || !result[0].values.length) return [];
  const cols = result[0].columns;
  return result[0].values.map((row) => {
    const obj: Record<string, unknown> = {};
    cols.forEach((c, i) => { obj[c] = row[i]; });
    return obj as unknown as FlagEntityForAnalysis;
  });
}

export function deleteFlag(id: number): void {
  const db = getDb();
  db.run(`DELETE FROM FlagEntityForAnalysis WHERE id = ?`, [id]);
  persistDb();
}

export function getAllSelectionHistories(): import("@/types/db").FlaggedEntityHistory[] {
  const db = getDb();
  const result = db.exec(
    `SELECT id, entityName, flaggedDate, flaggedTime, selectionAction,
            selectionType, source, applicationName, communicationFunction,
            communicationSignal, projectName, personName, personEmail,
            actualSelection, flagEntityForAnalysisId
     FROM FlaggedEntityHistory
     ORDER BY id DESC`
  );
  if (!result.length || !result[0].values.length) return [];
  const cols = result[0].columns;
  return result[0].values.map((row) => {
    const obj: Record<string, unknown> = {};
    cols.forEach((c, i) => { obj[c] = row[i]; });
    return obj as unknown as import("@/types/db").FlaggedEntityHistory;
  });
}

export function deleteSelectionHistory(id: number): void {
  const db = getDb();
  db.run(`DELETE FROM FlaggedEntityHistory WHERE id = ?`, [id]);
  persistDb();
}
