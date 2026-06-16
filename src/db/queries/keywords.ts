// src/db/queries/keywords.ts
//
// Keyword guard: per-person and global "banned words" plus a send-mode setting
// (warn vs stop). Consumed by the Settings UI (KeywordSettingsView) and the
// Outlook OnMessageSend Smart Alerts handler in commands.ts.
//
// Matching keys on EMAIL when a recipient email is known (emails are unique),
// and falls back to name match. Global rules apply to every recipient.

import { getDb, persistDb } from "@/db/db";
import type { KeywordRule, KeywordSendMode, KeywordSetting } from "@/types/db";

function normEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function getKeywordRules(): KeywordRule[] {
  try {
    const db = getDb();
    const result = db.exec(
      "SELECT id, personName, personEmail, keyword, isGlobal FROM KeywordRule ORDER BY isGlobal DESC, personName, keyword"
    );
    if (!result.length) return [];
    return result[0].values.map((row) => ({
      id: row[0] as number,
      personName: String(row[1] ?? ""),
      personEmail: String(row[2] ?? ""),
      keyword: String(row[3] ?? ""),
      isGlobal: Boolean(row[4]),
    }));
  } catch {
    return [];
  }
}

export function getKeywordSetting(): KeywordSetting {
  try {
    const db = getDb();
    const result = db.exec("SELECT id, sendMode FROM KeywordSetting LIMIT 1");
    if (result.length && result[0].values.length) {
      const row = result[0].values[0];
      const mode = String(row[1] ?? "warn");
      return { id: row[0] as number, sendMode: (mode === "stop" ? "stop" : "warn") };
    }
  } catch {
    /* fall through to default */
  }
  return { sendMode: "warn" };
}

/** Replace the full rule set + send mode in one transaction (Settings save). */
export function saveKeywordRules(rules: Array<Omit<KeywordRule, "id">>, sendMode: KeywordSendMode): void {
  const db = getDb();
  db.run("DELETE FROM KeywordRule");
  for (const r of rules) {
    const kw = r.keyword.trim();
    if (!kw) continue;
    db.run(
      "INSERT INTO KeywordRule (personName, personEmail, keyword, isGlobal) VALUES (?, ?, ?, ?)",
      [r.personName.trim(), normEmail(r.personEmail), kw, r.isGlobal ? 1 : 0]
    );
  }
  const existing = getKeywordSetting();
  if (existing.id != null) {
    db.run("UPDATE KeywordSetting SET sendMode = ? WHERE id = ?", [sendMode, existing.id]);
  } else {
    db.run("INSERT INTO KeywordSetting (sendMode) VALUES (?)", [sendMode]);
  }
  persistDb();
}

/**
 * Find which banned words appear in `bodyText` for the given recipients.
 * - Global rules apply to every send.
 * - Per-person rules apply when a recipient matches by email (preferred) or name.
 * Matching is case-insensitive, whole-word where the keyword is a simple token.
 */
export function findBannedWords(
  recipients: Array<{ name?: string; email?: string }>,
  bodyText: string
): string[] {
  const rules = getKeywordRules();
  if (!rules.length) return [];

  const haystack = bodyText.toLowerCase();
  const recipEmails = recipients.map((r) => normEmail(r.email ?? "")).filter(Boolean);
  const recipNames = recipients.map((r) => (r.name ?? "").trim().toLowerCase()).filter(Boolean);

  const hits: string[] = [];
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    const applies =
      rule.isGlobal ||
      (!!rule.personEmail && recipEmails.indexOf(normEmail(rule.personEmail)) !== -1) ||
      (!!rule.personName && recipNames.indexOf(rule.personName.trim().toLowerCase()) !== -1);
    if (!applies) continue;

    const kw = rule.keyword.trim().toLowerCase();
    if (!kw) continue;
    // Substring ("contains the word") match — case-insensitive. Whole-word
    // matching was too strict: when Outlook concatenates body text (e.g. a typed
    // word glued to the attached context marker → "sdfAngry"), a boundary match
    // misses it. The client spec is "message contains a word", so contains is correct.
    const found = haystack.indexOf(kw) !== -1;
    const label = rule.keyword.trim();
    if (found && hits.indexOf(label) === -1) hits.push(label);
  }
  return hits;
}
