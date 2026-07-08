// src/db/db.ts

/* global localStorage console OfficeRuntime */

import initSqlJs, { Database } from "sql.js";
import { CREATE_TABLES_SQL } from "@/db/schema";

const DB_STORAGE_KEY = "speaklogic_db_v1";
let db: Database | null = null;
let SQL: Awaited<ReturnType<typeof initSqlJs>> | null = null;

// ── Durable persistence ───────────────────────────────────────────────────────
// The whole DB is serialized to storage. On Office DESKTOP (WebView2),
// window.localStorage is NOT durable — Office clears it on add-in reinstall/update
// and "Clear Office cache", wiping the user's data (Communication Config,
// analyses, articles). On the web it persists fine, which is why the same data
// survives there but not on Windows.
//
// OfficeRuntime.storage is Microsoft's durable, cross-session, cross-runtime add-in
// store — keyed by the add-in ID (not the web origin), so it survives cache clears
// AND deployment/URL changes. We use it as the primary store and keep localStorage
// as a synchronous mirror (fast same-session reads, web fallback, and auto-migration
// of any data already saved under localStorage).
function officeStorage(): { getItem(k: string): Promise<string | null>; setItem(k: string, v: string): Promise<void> } | null {
  try {
    const os = (globalThis as unknown as { OfficeRuntime?: { storage?: unknown } }).OfficeRuntime?.storage;
    return (os as ReturnType<typeof officeStorage>) ?? null;
  } catch {
    return null;
  }
}

async function durableGet(key: string): Promise<string | null> {
  const os = officeStorage();
  if (os) {
    try {
      const v = await os.getItem(key);
      if (v != null) return v;
    } catch { /* OfficeRuntime read failed — fall back to localStorage */ }
  }
  try { return localStorage.getItem(key); } catch { return null; }
}

function durableSet(key: string, value: string): void {
  // Synchronous mirror: instant same-session reads + web durability.
  try { localStorage.setItem(key, value); } catch { /* quota/unavailable */ }
  // Durable cross-session copy for Office desktop (best-effort, async).
  const os = officeStorage();
  if (os) { try { void os.setItem(key, value); } catch { /* ignore */ } }
}

export async function initDb(): Promise<Database> {
  if (db) return db;

  const wasmUrl = `${window.location.origin}/assets/sql-wasm.wasm`;
  console.log("[SL][DB] fetching wasm from", wasmUrl);
  const wasmResp = await fetch(wasmUrl);
  if (!wasmResp.ok) throw new Error(`Wasm fetch failed: ${wasmResp.status} from ${wasmUrl}`);
  const wasmBinary = await wasmResp.arrayBuffer();

  SQL = await initSqlJs({ wasmBinary });

  const saved = await durableGet(DB_STORAGE_KEY);
  if (saved) {
    const bytes = Uint8Array.from(atob(saved), (c) => c.charCodeAt(0));
    db = new SQL.Database(bytes);
  } else {
    db = new SQL.Database();
  }

  db.run(CREATE_TABLES_SQL);
  runMigrations(db);
  // Writes to BOTH stores — this also migrates any localStorage-only data (from a
  // previous build) into OfficeRuntime.storage on first load.
  persistDb();
  return db;
}

/**
 * Re-read the database from localStorage into the in-memory instance.
 *
 * Each Office runtime (dialog, taskpane, and the hidden OnMessageSend event
 * runtime) keeps its OWN cached `db`. A write in one runtime persists to
 * localStorage but does NOT update another runtime's in-memory copy. Long-lived
 * runtimes (notably the Smart Alerts send-checker) therefore read stale data.
 * Call this before any read that must reflect the very latest saved state.
 * Safe because every writer calls persistDb() immediately, so localStorage is
 * always the source of truth.
 */
export async function reloadDbFromStorage(): Promise<void> {
  if (!db || !SQL) { await initDb(); return; }
  const saved = await durableGet(DB_STORAGE_KEY);
  if (!saved) return;
  const bytes = Uint8Array.from(atob(saved), (c) => c.charCodeAt(0));
  const fresh = new SQL.Database(bytes);
  fresh.run(CREATE_TABLES_SQL);
  runMigrations(fresh);
  db = fresh;
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
  durableSet(DB_STORAGE_KEY, b64);
}

export function nowDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nowTime(): string {
  return new Date().toTimeString().slice(0, 8);
}

/**
 * Format any stored date string into USA display format MM-DD-YYYY (e.g. "06-05-2026").
 * Storage stays ISO (YYYY-MM-DD) so date columns still sort correctly — this is a
 * display-only converter. Handles legacy values too: ISO, m/d/yyyy (FlagView /
 * toLocaleDateString), and already-dashed MM-DD-YYYY. Unknown/empty values pass through
 * unchanged so callers can still do `formatDisplayDate(x) || "—"`.
 */
export function formatDisplayDate(d?: string | null): string {
  if (!d) return d ?? "";
  const s = d.trim();
  // ISO: YYYY-MM-DD (optionally followed by time)
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  if (m) return `${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}-${m[1]}`;
  // Slash: m/d/yyyy (en-US locale / FlagView legacy)
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s);
  if (m) return `${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}-${m[3]}`;
  // Already dashed M-D-YYYY → normalize zero-padding
  m = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(s);
  if (m) return `${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}-${m[3]}`;
  return s;
}
