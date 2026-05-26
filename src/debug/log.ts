// src/debug/log.ts
//
// Shared localStorage debug log — readable from any browser console tab.
// Both the commands iframe and the dialog iframe write to the same key
// because they share the same origin (https://localhost:3000).
//
// Read the log from any console:
//   JSON.parse(localStorage.getItem('sl-debug') || '[]').forEach(l => console.log(l))
// Clear the log:
//   localStorage.removeItem('sl-debug')

const KEY = "sl-debug";
const MAX_ENTRIES = 300;

export function dbg(tag: string, msg: string, data?: unknown): void {
  const timestamp = new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
  const entry = data !== undefined
    ? `[SL][${tag}] ${msg} | ${JSON.stringify(data)}`
    : `[SL][${tag}] ${msg}`;
  // console.log so it appears in the Word Online browser console
  // eslint-disable-next-line no-console
  console.log(`[${timestamp}] ${entry}`);
  try {
    const raw = localStorage.getItem(KEY);
    const log: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    log.push(`[${timestamp}] ${entry}`);
    if (log.length > MAX_ENTRIES) log.splice(0, log.length - MAX_ENTRIES);
    localStorage.setItem(KEY, JSON.stringify(log));
  } catch {
    // ignore — storage quota or parse error
  }
}

export function clearLog(): void {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
