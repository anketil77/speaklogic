// src/db/queries/information.ts
//
// User-defined "Select Information" items (Article Wizard, Point 14).
// The Speak Logic list is a built-in constant (speakLogicInfoData.ts);
// only these user-identified items live in the DB and are editable.

import { getDb, persistDb, nowDate } from "@/db/db";
import type { UserInformationItem } from "@/types/db";

export function getUserInformationItems(): UserInformationItem[] {
  try {
    const db = getDb();
    const result = db.exec(
      "SELECT id, name, html, createdDate FROM UserInformationItem ORDER BY id DESC"
    );
    if (!result.length) return [];
    return result[0].values.map((row) => ({
      id:          Number(row[0]),
      name:        String(row[1] ?? ""),
      html:        String(row[2] ?? ""),
      createdDate: row[3] ? String(row[3]) : "",
    }));
  } catch {
    return [];
  }
}

export function addUserInformationItem(name: string, html: string): void {
  const cleanName = name.trim();
  if (!cleanName) throw new Error("A title is required.");
  const db = getDb();
  db.run(
    "INSERT INTO UserInformationItem (name, html, createdDate) VALUES (?, ?, ?)",
    [cleanName, html ?? "", nowDate()]
  );
  persistDb();
}

export function deleteUserInformationItem(id: number): void {
  try {
    const db = getDb();
    db.run("DELETE FROM UserInformationItem WHERE id = ?", [id]);
    persistDb();
  } catch {
    // non-critical
  }
}
