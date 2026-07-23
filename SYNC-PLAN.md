# Cross-Host Data Sync — Plan & Status

Goal: let one user's data (analyses, feedback, articles, flags, etc.) stay in
sync across **Word, Outlook, and PowerPoint**, on both Office **desktop and web**,
and eventually across devices. This document records the plan, what has been
proven, and what remains.

Status as of 2026-07-24: **Phase 0 (identity) proven. Build not started.**

---

## 1. Why data doesn't sync today

- The entire database is **sql.js (SQLite in WebAssembly)**, serialized to
  `localStorage["speaklogic_db_v1"]` and `OfficeRuntime.storage` (`src/db/db.ts`).
- There is **no backend** — all data is local to the device/webview.
- `localStorage` is **partitioned per host**, so Word and Outlook each keep their
  own private copy. Neither can see the other's data.
- `OfficeRuntime.storage` *may* bridge hosts on desktop (same add-in `<Id>`), but
  it is unverified and does **not** exist on the web. It is also whole-file
  last-write-wins, so it can silently lose data.
- The only real cross-boundary transfer today is the **Provide/Apply Feedback
  email round-trip** (`emailTemplates.ts` embeds JSON, `parseFeedbackEmail.ts`
  reads it back) — manual, one record at a time, Outlook-only.

## 2. Chosen solution

**Supabase (managed Postgres) as the cloud source of truth + keep sql.js as a
local offline cache + hand-rolled per-row sync, behind an `IDatabase` abstraction.**

Two findings from adversarial research fix the approach:

- **Microsoft Entra is not a native Supabase auth provider** (only Clerk /
  Firebase / Auth0 / Cognito / WorkOS are). So we reuse the existing Microsoft
  login via a small **Supabase Edge Function** that verifies the Entra/MSA token
  and mints a Supabase JWT (`sub = oid`). Keeps a single sign-in.
- **No off-the-shelf sync engine** (PowerSync / ElectricSQL / RxDB) cleanly fits
  the Office add-in + sql.js environment → **hand-roll** the sync loop.

### Sync protocol (per table)
- `id` becomes a **UUIDv7** (sortable) text key — client-generated so offline
  inserts never collide across devices.
- Add `user_id`, `updated_at`, `deleted_at` (tombstone), and `server_seq`
  (a monotonic cursor — not a timestamp).
- **Push:** batch upsert via PostgREST `on_conflict=id` (idempotent retries).
- **Pull:** `where server_seq > cursor order by server_seq limit N`; upsert by
  PK; apply tombstones; advance the cursor.
- Realtime is a "wake up and pull" nudge only, never the delivery path.
- Conflict resolution: row-level last-write-wins (no per-field merge in v1).

## 3. Multi-user model

- Identity = the Microsoft account's **`oid`** — belongs to the person, not the
  machine. `ssoSilent` returns whoever is signed into Office right now.
- Every row is stamped `user_id = oid`; **Row-Level Security** enforces
  `auth.uid() = user_id`, so users can never see each other's data.
- The **local cache must be keyed by `oid`**: when the signed-in user changes,
  clear/reload from that user's cloud data so nothing leaks on a shared machine.

## 4. Identity spike — RESULT: PASSED (2026-07-22)

A throwaway "Identity Check" taskpane (`src/identity/`, on branch
`identity-sso-spike`) confirmed the keystone:

- The same personal account returned an **identical `oid`
  (`00000000-0000-0000-1335-cdb4677df3eb`)** in **both Outlook and Word**.
- Personal `@outlook.com` accounts are supported (app registration is set to
  "All Microsoft account users"; `Files.ReadWrite` is already granted).

### Auth reality per host (important)
- **Outlook** — silent SSO works (NAA broker delivers the token).
- **Word on the web** — silent SSO does **not** work: the broker doesn't deliver
  and Word's sandbox CSP blocks the network fallback. Needs a **one-time popup
  sign-in** (which succeeds). This is a Microsoft platform limitation, not a bug.
- **Word/PowerPoint desktop** — **untested**; likely behaves like Outlook, since
  the blocks are specific to the web sandbox.

## 5. Migration surface (scoping the work)

- All **42 tables** use `INTEGER PRIMARY KEY AUTOINCREMENT` (`src/db/schema.ts`).
- **34 FK columns across 20 tables** must be remapped to UUIDs, parents first;
  `AttachFileToProject` (7-way FK) last.
- 13 `last_insert_rowid()` read sites, ~30 interfaces and ~25 message payloads
  carry numeric ids to widen to string.
- `ORDER BY id` used as "newest" in 11 places — UUIDv7 sorts correctly, so handled.
- Business counters (`articleNumber`, `solutionNumber`) collide across devices —
  separate fix.
- sql.js does not enforce FKs today, so orphan rows likely exist — audit before
  the first Postgres push.
- `crypto.randomUUID` isn't safe (browserslist targets IE11) — feature-detect.

## 6. Roadmap

- **Phase 1 — Abstraction seam:** put `IDatabase` in front of the DB. No
  behavior change; ships safely.
- **Phase 2 — UUID migration:** 42 tables → UUID keys, remap FKs. No cloud needed.
- **Phase 3 — Supabase backend:** port schema + `user_id`/`updated_at`/`deleted_at`/`server_seq` + RLS.
- **Phase 4 — Auth (NAA):** silent where it works (Outlook/desktop), one-time
  sign-in in Word-web; Edge Function token exchange; local cache keyed by `oid`.
- **Phase 5 — Sync loop:** per-row push/pull, offline queue, LWW.

Phases 1–2 are the foundation and can ship before any cloud exists.

## 7. Open items / risks to verify before building

- [ ] Test **Word/PowerPoint desktop** identity (likely silent, unconfirmed).
- [ ] Verify the add-in can reach **`supabase.co` from Word on the web** — the
      CSP `connect-src` block observed during the spike is a yellow flag that
      could change the architecture.
- [ ] This is a **substantial net-new feature** — scope and quote it on its own
      (see the scope/billing notes).

## 8. Where the code lives

- Identity spike (diagnostic taskpane + `ssoSilent` + Word/PPT manifest schema
  fix): branch **`identity-sso-spike`** — not merged to `main`, does not deploy.
- Everything else described here is design, not yet implemented.
