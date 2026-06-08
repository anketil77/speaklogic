// src/db/queries/people.ts

import { getDb, persistDb } from "@/db/db";
import type { ContactPerson } from "@/types/db";

export function getPeopleEmailMap(): Record<string, string> {
  try {
    const db = getDb();
    const result = db.exec(
      "SELECT personName, emailAddress FROM PeopleInProject WHERE personName IS NOT NULL AND personName != ''"
    );
    if (!result.length) return {};
    const map: Record<string, string> = {};
    for (const row of result[0].values) {
      const name = String(row[0]);
      const email = row[1] ? String(row[1]) : "";
      if (name) map[name] = email;
    }
    return map;
  } catch {
    return {};
  }
}

export function getPeopleNames(): string[] {
  try {
    const db = getDb();
    const result = db.exec(
      "SELECT personName FROM PeopleInProject WHERE personName IS NOT NULL AND personName != '' ORDER BY personName"
    );
    if (!result.length) return [];
    return result[0].values.map((row) => String(row[0]));
  } catch {
    return [];
  }
}

export function upsertPersonName(name: string): void {
  if (!name.trim()) return;
  try {
    const db = getDb();
    db.run(
      "INSERT INTO PeopleInProject (personName) SELECT ? WHERE NOT EXISTS (SELECT 1 FROM PeopleInProject WHERE personName = ?)",
      [name.trim(), name.trim()]
    );
    persistDb();
  } catch {
    // non-critical — analysis already saved
  }
}

export function getAllPeople(): ContactPerson[] {
  try {
    const db = getDb();
    const result = db.exec(
      "SELECT id, personName, emailAddress FROM PeopleInProject WHERE personName IS NOT NULL AND personName != '' ORDER BY personName"
    );
    if (!result.length) return [];
    return result[0].values.map((row) => ({
      id: Number(row[0]),
      personName: String(row[1]),
      emailAddress: row[2] ? String(row[2]) : "",
    }));
  } catch {
    return [];
  }
}

export function updatePersonById(id: number, name: string, email: string): void {
  if (!name.trim()) return;
  try {
    const db = getDb();
    db.run(
      "UPDATE PeopleInProject SET personName = ?, emailAddress = ? WHERE id = ?",
      [name.trim(), email.trim(), id]
    );
    persistDb();
  } catch {
    // non-critical
  }
}

export function deletePersonById(id: number): void {
  try {
    const db = getDb();
    db.run("DELETE FROM PeopleInProject WHERE id = ?", [id]);
    persistDb();
  } catch {
    // non-critical
  }
}

export function upsertPersonWithEmail(name: string, email: string): void {
  if (!name.trim()) return;
  try {
    const db = getDb();
    const exists = db.exec(
      "SELECT id FROM PeopleInProject WHERE personName = ?",
      [name.trim()]
    );
    if (exists.length && exists[0].values.length) {
      if (email.trim()) {
        db.run(
          "UPDATE PeopleInProject SET emailAddress = ? WHERE personName = ?",
          [email.trim(), name.trim()]
        );
      }
    } else {
      db.run(
        "INSERT INTO PeopleInProject (personName, emailAddress) VALUES (?, ?)",
        [name.trim(), email.trim()]
      );
    }
    persistDb();
  } catch {
    // non-critical
  }
}
