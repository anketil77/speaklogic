// src/db/db.ts

/* global localStorage */

import initSqlJs, { Database } from "sql.js";
import { CREATE_TABLES_SQL } from "@/db/schema";

const DB_STORAGE_KEY = "speaklogic_db_v1";
let db: Database | null = null;

export async function initDb(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs({
    locateFile: (file: string) => `${window.location.origin}/assets/${file}`,
  });

  const saved = localStorage.getItem(DB_STORAGE_KEY);
  if (saved) {
    const bytes = Uint8Array.from(atob(saved), (c) => c.charCodeAt(0));
    db = new SQL.Database(bytes);
  } else {
    db = new SQL.Database();
  }

  db.run(CREATE_TABLES_SQL);
  runMigrations(db);
  persistDb();
  return db;
}

// Parses CREATE TABLE statements and returns a map of tableName → columns.
// Used by runMigrations to auto-detect which columns need to be added to
// existing databases without manually listing every column.
function parseSchemaColumns(sql: string): Map<string, Array<{ name: string; type: string }>> {
  const tables = new Map<string, Array<{ name: string; type: string }>>();
  const tableRe = /CREATE TABLE IF NOT EXISTS (\w+)\s*\(([\s\S]*?)\);/g;
  let m: RegExpExecArray | null;
  while ((m = tableRe.exec(sql)) !== null) {
    const cols: Array<{ name: string; type: string }> = [];
    for (const line of m[2].split("\n")) {
      const trimmed = line.trim().replace(/,$/, "");
      const col = trimmed.match(/^(\w+)\s+(TEXT|INTEGER|REAL|BLOB|NUMERIC)/i);
      if (col && col[1].toLowerCase() !== "id") {
        cols.push({ name: col[1], type: col[2].toUpperCase() });
      }
    }
    tables.set(m[1], cols);
  }
  return tables;
}

// Adds any column present in the schema but missing from an existing table.
// ALTER TABLE ... ADD COLUMN throws if the column already exists — we catch
// and ignore that so this is safe to run on every DB load.
function runMigrations(database: Database): void {
  const expected = parseSchemaColumns(CREATE_TABLES_SQL);
  expected.forEach((cols, table) => {
    cols.forEach(({ name, type }) => {
      try {
        database.run(`ALTER TABLE "${table}" ADD COLUMN "${name}" ${type}`);
      } catch {
        // column already exists — nothing to do
      }
    });
  });
}

export function getDb(): Database {
  if (!db) throw new Error("DB not initialized — call initDb() first");
  return db;
}

export function persistDb(): void {
  if (!db) return;
  const data = db.export() as Uint8Array;
  const b64 = btoa(Array.from(data, (b) => String.fromCharCode(b)).join(""));
  localStorage.setItem(DB_STORAGE_KEY, b64);
}

export function nowDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nowTime(): string {
  return new Date().toTimeString().slice(0, 8);
}
