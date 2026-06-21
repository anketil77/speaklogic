// src/graph/mailFolders.ts
//
// Microsoft Graph helpers for the Outlook signal-folder feature:
//  - create the 3 signal folders (Good / Bad / Feedback, emoji-named)
//  - create server-side inbox rules that auto-file incoming mail by the
//    "Communication Signal [Red|Green|Blue]" stamp Speak Logic writes into the
//    subject (so sorting works even when Outlook is closed)
//  - move a single message to a folder on demand
//
// Auth via src/graph/auth.ts (NAA MSAL). All calls are delegated (signed-in user).

/* global fetch */

const GRAPH = "https://graph.microsoft.com/v1.0";

export type SignalKey = "green" | "red" | "blue";

export interface SignalFolderDef {
  key: SignalKey;
  /**
   * Folder display name. The numeric prefix forces the client-requested order
   * (Good → Feedback → Bad) — Outlook always sorts folders alphabetically by
   * name and exposes no API to set a custom order, so the order has to live in
   * the name. The emoji is the client-approved substitute for colored icons.
   */
  name: string;
  /** The value stamped in the subject: "Communication Signal [<signal>]". */
  signal: string;
  /**
   * Earlier names this folder may already exist under (no/old prefix). Used to
   * rename in place instead of creating a duplicate when re-running setup.
   */
  legacyNames: string[];
}

export const SIGNAL_FOLDERS: SignalFolderDef[] = [
  { key: "green", name: "1 🟢 Good Messages", signal: "Green", legacyNames: ["🟢 Good Messages"] },
  { key: "blue", name: "2 🔵 Feedback", signal: "Blue", legacyNames: ["🔵 Feedback"] },
  { key: "red", name: "3 🔴 Bad Messages", signal: "Red", legacyNames: ["🔴 Bad Messages"] },
];

interface GraphFolder { id: string; displayName: string }
interface GraphRule { id: string; displayName: string }

async function graphFetch<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${GRAPH}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let detail = "";
    try { detail = JSON.stringify(await res.json()); } catch { detail = await res.text().catch(() => ""); }
    throw new Error(`Graph ${init?.method ?? "GET"} ${path} failed (${res.status}): ${detail}`);
  }
  // 204 No Content (rare here) → return undefined-as-T
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

/** List the user's top-level mail folders (up to 200). */
async function listMailFolders(token: string): Promise<GraphFolder[]> {
  const data = await graphFetch<{ value: GraphFolder[] }>(token, "/me/mailFolders?$top=200");
  return data.value ?? [];
}

/**
 * Ensure the 3 signal folders exist (create any that are missing).
 * Returns a map of signal-name → folder id (e.g. { Green: "AAMk…", Red: "…", Blue: "…" }).
 */
export async function ensureSignalFolders(token: string): Promise<Record<string, string>> {
  const existing = await listMailFolders(token);
  const byName = new Map(existing.map((f) => [f.displayName, f.id]));
  const result: Record<string, string> = {};

  for (const def of SIGNAL_FOLDERS) {
    let id = byName.get(def.name);
    if (!id) {
      // Rename an existing legacy folder (old/no prefix) in place so the user's
      // already-filed mail is kept — only create from scratch if none is found.
      const legacyName = def.legacyNames.find((n) => byName.has(n));
      const legacyId = legacyName ? byName.get(legacyName) : undefined;
      if (legacyId) {
        const renamed = await graphFetch<GraphFolder>(token, `/me/mailFolders/${legacyId}`, {
          method: "PATCH",
          body: JSON.stringify({ displayName: def.name }),
        });
        id = renamed.id;
      } else {
        const created = await graphFetch<GraphFolder>(token, "/me/mailFolders", {
          method: "POST",
          body: JSON.stringify({ displayName: def.name }),
        });
        id = created.id;
      }
    }
    result[def.signal] = id;
  }
  return result;
}

/**
 * Create (or skip if already present) one inbox rule per signal that moves
 * incoming mail whose subject contains "Communication Signal [<signal>]" into
 * the matching folder. Idempotent by rule display name.
 */
export async function ensureSignalRules(token: string, folderIds: Record<string, string>): Promise<number> {
  const existing = await graphFetch<{ value: GraphRule[] }>(token, "/me/mailFolders/inbox/messageRules");
  const haveNames = new Set((existing.value ?? []).map((r) => r.displayName));

  let created = 0;
  let seq = 100;
  for (const def of SIGNAL_FOLDERS) {
    const ruleName = `Speak Logic — ${def.signal} Signal`;
    const folderId = folderIds[def.signal];
    if (!folderId || haveNames.has(ruleName)) continue;
    await graphFetch(token, "/me/mailFolders/inbox/messageRules", {
      method: "POST",
      body: JSON.stringify({
        displayName: ruleName,
        sequence: seq++,
        isEnabled: true,
        conditions: { subjectContains: [`Communication Signal [${def.signal}]`] },
        actions: { moveToFolder: folderId, stopProcessingRules: true },
      }),
    });
    created++;
  }
  return created;
}

/** Move a single message to a folder (on-demand filing). */
export async function moveMessage(token: string, messageId: string, destinationId: string): Promise<void> {
  await graphFetch(token, `/me/messages/${messageId}/move`, {
    method: "POST",
    body: JSON.stringify({ destinationId }),
  });
}

/** One-shot setup: sign-in token in, folders + rules created. Returns a summary. */
export async function setUpSignalFoldersAndRules(token: string): Promise<{ folders: number; rules: number }> {
  const folderIds = await ensureSignalFolders(token);
  const rules = await ensureSignalRules(token, folderIds);
  return { folders: Object.keys(folderIds).length, rules };
}
