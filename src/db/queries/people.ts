// src/db/queries/people.ts

import { getDb, persistDb } from "@/db/db";
import type { ContactPerson } from "@/types/db";

// Identity rule: a contact is uniquely identified by its **email address**, not its name.
// Names are allowed to repeat (two people can really both be "John Smith"), so any
// dedup/lookup that keys on `personName` will collapse distinct contacts together
// and silently drop data. Treat email as the unique key everywhere.

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

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
      // First write wins so we don't silently overwrite one contact's email
      // with another's when two contacts share a name.
      if (name && !(name in map)) map[name] = email;
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
      "INSERT INTO PeopleInProject (personName) SELECT ? WHERE NOT EXISTS (SELECT 1 FROM PeopleInProject WHERE personName = ? AND (emailAddress IS NULL OR emailAddress = ''))",
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

function emailExistsOnAnotherRow(email: string, excludeId: number | null): boolean {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) return false;
  try {
    const db = getDb();
    const result = excludeId === null
      ? db.exec(
          "SELECT 1 FROM PeopleInProject WHERE LOWER(TRIM(emailAddress)) = ? LIMIT 1",
          [cleanEmail]
        )
      : db.exec(
          "SELECT 1 FROM PeopleInProject WHERE LOWER(TRIM(emailAddress)) = ? AND id != ? LIMIT 1",
          [cleanEmail, excludeId]
        );
    return result.length > 0 && result[0].values.length > 0;
  } catch {
    return false;
  }
}

export function updatePersonById(id: number, name: string, email: string): void {
  if (!name.trim()) return;
  if (email.trim() && emailExistsOnAnotherRow(email, id)) {
    throw new Error("A contact with this email address already exists.");
  }
  try {
    const db = getDb();
    db.run(
      "UPDATE PeopleInProject SET personName = ?, emailAddress = ? WHERE id = ?",
      [name.trim(), email.trim(), id]
    );
    persistDb();
  } catch (err) {
    // Re-throw so the caller can surface it; the prior swallow-and-ignore
    // behavior masked real failures.
    if (err instanceof Error) throw err;
    throw new Error(String(err));
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

// Explicit "add a new contact" path used by the People dialog.
// Throws on duplicate email so the UI can show a meaningful error.
export function addPersonContact(name: string, email: string): void {
  const cleanName = name.trim();
  const cleanEmail = email.trim();
  if (!cleanName) throw new Error("Name is required.");
  if (cleanEmail && emailExistsOnAnotherRow(cleanEmail, null)) {
    throw new Error("A contact with this email address already exists.");
  }
  try {
    const db = getDb();
    db.run(
      "INSERT INTO PeopleInProject (personName, emailAddress) VALUES (?, ?)",
      [cleanName, cleanEmail]
    );
    persistDb();
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error(String(err));
  }
}

// Background upsert used by feedback-save flows. Dedupes by email.
// - empty email + non-empty name → insert (cannot dedupe without an email)
// - email matches an existing row → update that row's name if it changed
// - email is new → insert
// Never overwrites an existing email just because a name matches.
export function upsertPersonWithEmail(name: string, email: string): void {
  const cleanName = name.trim();
  const cleanEmail = email.trim();
  if (!cleanName && !cleanEmail) return;
  try {
    const db = getDb();

    if (!cleanEmail) {
      if (!cleanName) return;
      // No email → can't dedupe. Only insert if no nameless-and-emailless
      // duplicate of the same name already exists (keeps the table tidy when
      // analysis flows repeatedly upsert the same plain-name person).
      const existing = db.exec(
        "SELECT 1 FROM PeopleInProject WHERE personName = ? AND (emailAddress IS NULL OR emailAddress = '') LIMIT 1",
        [cleanName]
      );
      if (existing.length && existing[0].values.length) return;
      db.run(
        "INSERT INTO PeopleInProject (personName, emailAddress) VALUES (?, ?)",
        [cleanName, ""]
      );
      persistDb();
      return;
    }

    const normalized = normalizeEmail(cleanEmail);
    const exists = db.exec(
      "SELECT id, personName FROM PeopleInProject WHERE LOWER(TRIM(emailAddress)) = ? LIMIT 1",
      [normalized]
    );
    if (exists.length && exists[0].values.length) {
      const rowId = Number(exists[0].values[0][0]);
      const existingName = String(exists[0].values[0][1] ?? "");
      if (cleanName && cleanName !== existingName) {
        db.run(
          "UPDATE PeopleInProject SET personName = ? WHERE id = ?",
          [cleanName, rowId]
        );
        persistDb();
      }
    } else {
      db.run(
        "INSERT INTO PeopleInProject (personName, emailAddress) VALUES (?, ?)",
        [cleanName, cleanEmail]
      );
      persistDb();
    }
  } catch {
    // non-critical
  }
}
