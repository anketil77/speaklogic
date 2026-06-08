import { getDb, persistDb } from "@/db/db";
import type { Publisher } from "@/types/db";

export function getAllPublishers(): Publisher[] {
  const db = getDb();
  const result = db.exec(`SELECT id, name, logoBase64 FROM Publisher ORDER BY id ASC`);
  if (!result.length || !result[0].values.length) return [];
  const cols = result[0].columns;
  return result[0].values.map((row) => {
    const obj: Record<string, unknown> = {};
    cols.forEach((c, i) => { obj[c] = row[i]; });
    return obj as unknown as Publisher;
  });
}

export function savePublisher(name: string, logoBase64: string): number {
  const db = getDb();
  db.run(`INSERT INTO Publisher (name, logoBase64) VALUES (?, ?)`, [name, logoBase64]);
  const result = db.exec("SELECT last_insert_rowid() as id");
  const id = result[0]?.values[0]?.[0] as number;
  persistDb();
  return id;
}

export function deletePublisher(id: number): void {
  const db = getDb();
  db.run(`DELETE FROM Publisher WHERE id = ?`, [id]);
  persistDb();
}
