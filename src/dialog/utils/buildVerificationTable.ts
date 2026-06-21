// src/dialog/utils/buildVerificationTable.ts
//
// Builds a static 2-column HTML <table> pairing each "Information Before Event"
// entry with its "Mother Nature Consideration" (the verification authored on
// wizard Step 7). Stored as plain HTML so it renders identically in the View
// Article dialog, generated reports, and when inserted into the Word document
// (no JS required — unlike an interactive accordion).
//
// The table carries a `data-sl-vtable="1"` marker so readers (ViewArticleDialog)
// can detect it and suppress the now-redundant standalone "Information Before
// Event" block (the info already appears in the table's left column).

import type { InfoEntry } from "@/dialog/views/createarticle/wizard/wizardTypes";

export const VTABLE_MARKER = 'data-sl-vtable="1"';

const cell = (html: string): string =>
  `<td style="border:1px solid #C7C7C7;padding:8px 10px;vertical-align:top;font-size:13px;line-height:18px;">${
    html && html.trim() ? html.trim() : "&nbsp;"
  }</td>`;

/**
 * @param entries Step-6 info entries, each `{ html, verification }`.
 * @returns HTML <table> string, or "" when there is nothing to pair.
 */
export function buildVerificationTable(entries: InfoEntry[]): string {
  const rows = entries.filter((e) => (e.html && e.html.trim()) || (e.verification && e.verification.trim()));
  if (rows.length === 0) return "";

  const head =
    `<tr>` +
    `<th style="border:1px solid #C7C7C7;padding:8px 10px;text-align:left;background:#EFEFEF;font-size:13px;font-weight:700;width:50%;">Information Before Event</th>` +
    `<th style="border:1px solid #C7C7C7;padding:8px 10px;text-align:left;background:#EFEFEF;font-size:13px;font-weight:700;width:50%;">Mother Nature Consideration</th>` +
    `</tr>`;

  const body = rows
    .map((e) => `<tr>${cell(e.html)}${cell(e.verification)}</tr>`)
    .join("");

  return (
    `<table ${VTABLE_MARKER} style="border-collapse:collapse;width:100%;table-layout:fixed;">` +
    `<thead>${head}</thead><tbody>${body}</tbody></table>`
  );
}
