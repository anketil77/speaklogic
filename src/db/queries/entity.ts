// src/db/queries/entity.ts
//
// Point Selection to Entity (More Selections menu). A selected Word / Sentence /
// Paragraph "points to" one or more entities (images, image URLs, YouTube links,
// or rich-text explanations). The entity list is serialized into the
// entityImages column as JSON; the primary entity's explanation flag/text is
// also mirrored onto isExplanation / entityExplanation for quick display.

import { getDb, persistDb, nowDate, nowTime } from "@/db/db";
import type {
  PointToEntity,
  PointToEntityItem,
  SavePointToEntityPayload,
} from "@/types/db";

export function saveEntity(payload: SavePointToEntityPayload): number {
  const db = getDb();

  const entities: PointToEntityItem[] = payload.entities ?? [];
  const primary = entities[0];
  const isExplanation = primary?.isExplanation ? 1 : 0;
  const entityExplanation = primary?.isExplanation ? (primary.explanation ?? "") : "";

  db.run(
    `INSERT INTO PointToEntity (
      selectionType, actualSelection, documentLocation, entityName,
      isExplanation, entityExplanation, entityImages, source,
      personName, personEmail, entityDate, entityTime
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      payload.selectionType,
      payload.actualSelection,
      payload.documentLocation,
      payload.entityName,
      isExplanation,
      entityExplanation,
      JSON.stringify(entities),
      payload.source,
      payload.personName ?? "",
      payload.personEmail ?? "",
      nowDate(),
      nowTime(),
    ]
  );

  const result = db.exec("SELECT last_insert_rowid() AS id");
  const id = result[0].values[0][0] as number;

  persistDb();
  return id;
}

export function getAllEntities(): PointToEntity[] {
  const db = getDb();
  const result = db.exec("SELECT * FROM PointToEntity ORDER BY id DESC");
  if (!result.length) return [];
  return result[0].values.map((row) => {
    const cols = result[0].columns;
    const obj: Record<string, unknown> = {};
    cols.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as unknown as PointToEntity;
  });
}

export function getEntityById(id: number): PointToEntity | null {
  const db = getDb();
  const result = db.exec("SELECT * FROM PointToEntity WHERE id = ?", [id]);
  if (!result.length || !result[0].values.length) return null;
  const cols = result[0].columns;
  const obj: Record<string, unknown> = {};
  cols.forEach((col, i) => {
    obj[col] = result[0].values[0][i];
  });
  return obj as unknown as PointToEntity;
}

export function deleteEntity(id: number): void {
  const db = getDb();
  db.run("DELETE FROM PointToEntity WHERE id = ?", [id]);
  persistDb();
}
