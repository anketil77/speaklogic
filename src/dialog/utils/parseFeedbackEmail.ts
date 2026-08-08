// src/dialog/utils/parseFeedbackEmail.ts
//
// Point 11 — "Apply Email": parse a received Speak Logic feedback email back into
// an AnalysisDataForApply so the Apply Feedback dialog opens pre-filled.
//
// Two strategies, tried in order:
//   1. Embedded payload  — the hidden `data-sl-feedback` marker emailTemplates.ts
//      writes into every "with analysis" email. 100% reliable round-trip.
//   2. Label-based parse — walks the visible template's labelled rows. Fallback
//      for emails where the hidden marker was stripped by an intermediate client.
//
// Free-form / human-typed emails have neither structure → returns null (the
// documented limitation: only Speak-Logic-generated feedback can be extracted).

/* global DOMParser atob Document Element */

import type {
  AnalysisDataForApply,
  ProjectError,
  ProjectCompensator,
  ProjectQuestion,
  ProjectAnswer,
  ProjectProblem,
} from "@/types/db";
import { SL_FEEDBACK_MARKER } from "@/dialog/utils/emailTemplates";

type ErrorDraft = Omit<ProjectError, "id" | "analysisId">;
type CompDraft = Omit<ProjectCompensator, "id" | "analysisId">;
type QuestionDraft = Omit<ProjectQuestion, "id" | "analysisId">;
type AnswerDraft = Omit<ProjectAnswer, "id" | "analysisId" | "questionId">;
type ProblemDraft = Omit<ProjectProblem, "id" | "analysisId" | "feedbackId">;

function emptyData(): AnalysisDataForApply {
  return {
    id: 0,
    entityUnderAnalysis: "",
    analysisSubject: "",
    actualAnalysis: "",
    fromPerson: "",
    errors: [],
    compensators: [],
    questions: [],
    answers: [],
    files: [],
    correctedItems: [],
    problems: [],
  };
}

// ── Strategy 1: hidden embedded JSON ──────────────────────────────────────────

function decodePayload(encoded: string): AnalysisDataForApply | null {
  if (!encoded) return null;
  for (const decode of [
    (s: string) => decodeURIComponent(atob(s)), // base64(encodeURIComponent(json))
    (s: string) => decodeURIComponent(s), // encodeURIComponent(json) fallback
    (s: string) => atob(s), // plain base64(json)
    (s: string) => s, // raw json
  ]) {
    try {
      const json = decode(encoded);
      const obj = JSON.parse(json) as AnalysisDataForApply;
      if (obj && typeof obj === "object") {
        return {
          ...emptyData(),
          ...obj,
          errors: obj.errors ?? [],
          compensators: obj.compensators ?? [],
          questions: obj.questions ?? [],
          answers: obj.answers ?? [],
          files: [],
          correctedItems: [],
          problems: obj.problems ?? [],
        };
      }
    } catch {
      /* try next decoder */
    }
  }
  return null;
}

function fromEmbedded(doc: Document): AnalysisDataForApply | null {
  const el = doc.querySelector(`[${SL_FEEDBACK_MARKER}]`);
  if (!el) return null;
  return decodePayload(el.getAttribute(SL_FEEDBACK_MARKER) ?? "");
}

// ── Strategy 2: label-based parse of the visible template ─────────────────────

const txt = (el: Element | null | undefined): string =>
  (el?.textContent ?? "").replace(/\u00A0/g, " ").trim();

// Collapse a label so minor formatting differences still match
// ("Actual Error", "actual error :" → "actualerror").
const norm = (s: string): string => s.toLowerCase().replace(/[\s:]+/g, "");

interface FlatRow {
  label: string;
  value: string;
}

// Flatten the email into an ordered list of { label, value } rows. Handles both
// fieldRow (3 cells: label / ":" / value) and blockField (a <strong> row then a
// content row). Order is preserved so repeated entities (Error 1, Error 2 …) can
// be segmented sequentially.
function flatten(doc: Document): FlatRow[] {
  const rows: FlatRow[] = [];
  const trs = Array.from(doc.querySelectorAll("tr"));
  for (let i = 0; i < trs.length; i++) {
    const cells = Array.from(trs[i].children).filter(
      (c) => c.tagName === "TD" || c.tagName === "TH"
    );
    if (cells.length >= 3 && txt(cells[1]) === ":") {
      rows.push({ label: txt(cells[0]), value: txt(cells[2]) });
    } else if (cells.length === 1 && cells[0].querySelector("strong") && txt(cells[0])) {
      // blockField/richBlockField always emit a strict [label row, content row] pair —
      // pair unconditionally. (Previously this required the content row to be free of
      // <strong>, which silently dropped the whole field whenever the rich content itself
      // had bold text — e.g. an Actual Error/Analysis description with **bold** wording.)
      const next = trs[i + 1];
      const nextCell = next ? Array.from(next.children).find((c) => c.tagName === "TD") : null;
      if (nextCell) {
        rows.push({ label: txt(cells[0]), value: txt(nextCell) });
        i++;
      }
    }
  }
  return rows;
}

function fromLabels(doc: Document): AnalysisDataForApply | null {
  const rows = flatten(doc);
  if (!rows.length) return null;
  const out = emptyData();

  let curError: ErrorDraft | null = null;
  let curComp: CompDraft | null = null;
  let curQ: QuestionDraft | null = null;
  let curA: AnswerDraft | null = null;
  let curP: ProblemDraft | null = null;
  const flush = () => {
    if (curError) {
      out.errors.push(curError);
      curError = null;
    }
    if (curComp) {
      out.compensators.push(curComp);
      curComp = null;
    }
    if (curQ) {
      out.questions.push(curQ);
      curQ = null;
    }
    if (curA) {
      out.answers.push(curA);
      curA = null;
    }
    if (curP) {
      out.problems!.push(curP);
      curP = null;
    }
  };

  for (const { label, value } of rows) {
    const k = norm(label);
    switch (k) {
      // ── header / analysis ──
      case "actualmessage":
      case "entityunderanalysis":
        if (!out.entityUnderAnalysis) out.entityUnderAnalysis = value;
        break;
      case "analysissubject":
        if (!out.analysisSubject) out.analysisSubject = value;
        break;
      case "actualanalysis":
        if (!out.actualAnalysis) out.actualAnalysis = value;
        break;
      case "fromperson":
        if (!out.fromPerson) out.fromPerson = value;
        break;

      // ── error ── ("Error Number" starts a new error; "Actual Error" is a fallback
      // trigger for hand-typed emails that skip the Number row)
      case "errornumber":
        flush();
        curError = {
          errorNumber: parseInt(value, 10) || out.errors.length + 1,
          actualError: "",
          fromActualCommunication: "",
          entityErrorPointTo: "",
          errorDescription: "",
          errorDate: "",
          errorTime: "",
        };
        break;
      case "actualerror":
        if (curError && !curError.actualError) {
          curError.actualError = value;
        } else {
          flush();
          curError = {
            errorNumber: out.errors.length + 1,
            actualError: value,
            fromActualCommunication: "",
            entityErrorPointTo: "",
            errorDescription: "",
            errorDate: "",
            errorTime: "",
          };
        }
        break;
      case "fromactualcomm/app":
      case "fromactualcommunication":
        if (curError) curError.fromActualCommunication = value;
        break;
      case "entityerrorpointto":
        if (curError) curError.entityErrorPointTo = value;
        break;
      case "errordescription":
        if (curError) curError.errorDescription = value;
        break;
      case "errordate":
        if (curError) curError.errorDate = value;
        break;
      case "errortime":
        if (curError) curError.errorTime = value;
        break;

      // ── compensator ── ("Compensator Number" starts a new compensator; "Actual
      // Compensator" is a fallback trigger)
      case "compensatornumber":
        flush();
        curComp = {
          compensatorNumber: parseInt(value, 10) || out.compensators.length + 1,
          actualCompensator: "",
          actualErrorReplaced: "",
          inActualCommunication: "",
          compensatorDescription: "",
          compensatorDate: "",
          compensatorTime: "",
        };
        break;
      case "actualcompensator":
        if (curComp && !curComp.actualCompensator) {
          curComp.actualCompensator = value;
        } else {
          flush();
          curComp = {
            compensatorNumber: out.compensators.length + 1,
            actualCompensator: value,
            actualErrorReplaced: "",
            inActualCommunication: "",
            compensatorDescription: "",
            compensatorDate: "",
            compensatorTime: "",
          };
        }
        break;
      case "actualerrorreplaced":
        if (curComp) curComp.actualErrorReplaced = value;
        break;
      case "inactualapp/comm":
      case "inactualcommunication":
        if (curComp) curComp.inActualCommunication = value;
        break;
      case "compensatordescription":
        if (curComp) curComp.compensatorDescription = value;
        break;
      case "compensatordate":
        if (curComp) curComp.compensatorDate = value;
        break;
      case "compensatortime":
        if (curComp) curComp.compensatorTime = value;
        break;

      // ── problem ── ("Problem Name" or "Actual Problem" starts a new problem)
      case "problemname":
        flush();
        curP = {
          problemNumber: out.problems!.length + 1,
          problemName: value,
          actualProblem: "",
          fromActualError: "",
          problemDescription: "",
          problemDate: "",
          problemTime: "",
        };
        break;
      case "actualproblem":
        if (!curP) {
          flush();
          curP = {
            problemNumber: out.problems!.length + 1,
            problemName: "",
            actualProblem: value,
            fromActualError: "",
            problemDescription: "",
            problemDate: "",
            problemTime: "",
          };
        } else curP.actualProblem = value;
        break;
      case "fromactualerror":
        if (curP) curP.fromActualError = value;
        break;
      case "problemdescription":
        if (curP) curP.problemDescription = value;
        break;

      // ── question ── ("Question Number" starts a new question; the template renders
      // "Entity Question Point to" BEFORE "Actual Question", so the Number row is the
      // only reliable trigger — "Actual Question" is a fallback for hand-typed emails)
      case "questionnumber":
        flush();
        curQ = {
          questionNumber: parseInt(value, 10) || out.questions.length + 1,
          actualQuestion: "",
          entityQuestionPointTo: "",
          responseStatus: "",
          questionDate: "",
          questionTime: "",
        };
        break;
      case "entityquestionpointto":
        if (curQ) curQ.entityQuestionPointTo = value;
        break;
      case "actualquestion":
        if (curQ && !curQ.actualQuestion) {
          curQ.actualQuestion = value;
        } else {
          flush();
          curQ = {
            questionNumber: out.questions.length + 1,
            actualQuestion: value,
            entityQuestionPointTo: "",
            responseStatus: "",
            questionDate: "",
            questionTime: "",
          };
        }
        break;

      // ── answer ── ("Answer Number" starts a new answer; the template renders
      // "Information Answer Point to" BEFORE "Actual Answer", so the Number row is the
      // only reliable trigger — "Actual Answer" is a fallback for hand-typed emails)
      case "answernumber":
        flush();
        curA = {
          answerNumber: parseInt(value, 10) || out.answers.length + 1,
          actualQuestion: "",
          entityQuestionPointTo: "",
          informationAnswerPointTo: "",
          actualAnswer: "",
          answerDate: "",
          answerTime: "",
        };
        break;
      case "informationanswerpointto":
        if (curA) curA.informationAnswerPointTo = value;
        break;
      case "actualanswer":
        if (curA && !curA.actualAnswer) {
          curA.actualAnswer = value;
        } else {
          flush();
          curA = {
            answerNumber: out.answers.length + 1,
            actualQuestion: "",
            entityQuestionPointTo: "",
            informationAnswerPointTo: "",
            actualAnswer: value,
            answerDate: "",
            answerTime: "",
          };
        }
        break;

      default:
        break;
    }
  }
  flush();

  const hasContent =
    out.errors.length ||
    out.compensators.length ||
    out.questions.length ||
    out.answers.length ||
    (out.problems?.length ?? 0) ||
    out.entityUnderAnalysis ||
    out.actualAnalysis;
  return hasContent ? out : null;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Parse a received feedback email's HTML body into AnalysisDataForApply.
 * Returns null when the email is not a Speak Logic feedback email (no marker and
 * no recognisable template structure).
 */
export function parseFeedbackEmail(html: string): AnalysisDataForApply | null {
  if (!html || !html.trim()) return null;
  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(html, "text/html");
  } catch {
    return null;
  }
  return fromEmbedded(doc) ?? fromLabels(doc);
}

/**
 * All visible "Label : value" rows of a Speak Logic email, keyed by collapsed label
 * (e.g. "feedbacksubject", "toperson"). Captures the feedback header fields the
 * analysis payload doesn't carry, so Email→XML can mirror the email faithfully.
 */
export function parseEmailLabelMap(html: string): Record<string, string> {
  if (!html || !html.trim()) return {};
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const map: Record<string, string> = {};
    for (const row of flatten(doc)) {
      const key = row.label.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (key && !(key in map)) map[key] = row.value; // first occurrence wins
    }
    return map;
  } catch {
    return {};
  }
}

// ── Strategy 3: plain-text parse (Word → mailto → Outlook-coerced text) ───────
//
// Word has no mailbox API, so "Provide Feedback" there hands off via a plain-text
// mailto: URL (see plainTextMailtoUrl/walkForText in src/shared/emailDraft.ts).
// Outlook coerces that into <div>/<br> HTML with no <table> markup, so
// parseEmailLabelMap (which requires table rows) always returns {} for it. This
// mirrors the same label set for the shape walkForText actually produces:
// fieldRow becomes one line "Label : value"; blockField/richBlockField becomes a
// bare label line (no colon) followed by its content on the following line(s).

export interface PlainTextFeedbackFields {
  feedbackSubject: string;
  actualFeedbackProvided: string;
  fromPerson: string;
  toPerson: string;
  applicationName: string;
  communicationFunction: string;
  communicationSignal: string;
  feedbackDate: string;
  feedbackTime: string;
}

const PLAIN_TEXT_INLINE_LABELS: Record<string, keyof PlainTextFeedbackFields> = {
  feedbacksubject: "feedbackSubject",
  fromperson: "fromPerson",
  toperson: "toPerson",
  applicationname: "applicationName",
  communicationfunction: "communicationFunction",
  communicationsignal: "communicationSignal",
  feedbackdate: "feedbackDate",
  feedbacktime: "feedbackTime",
};

const normPlainLine = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// "Actual Feedback Provided" is the LAST field only in the basic/selection templates.
// In buildProvideFeedbackWithAnalysis it's followed by the Message-Under-Analysis /
// My-Analysis / error / compensator sections, so the feedback body has to stop at
// the first of those boundaries instead of running to end-of-text.
const PLAIN_TEXT_BLOCK_END_SECTIONS = new Set([
  "messageunderanalysis", "myanalysis", "abouterror", "aboutcompensator",
  "aboutquestion", "aboutanswer", "aboutproblem",
]);
const PLAIN_TEXT_BLOCK_END_LABELS = new Set([
  "fromperson", "toperson", "applicationname", "communicationfunction",
  "communicationsignal", "communicationdate", "communicationtime", "analysissubject",
  "errornumber", "compensatornumber", "questionnumber", "answernumber",
]);

/**
 * Parse the plain-text body Outlook produces from Word's mailto handoff into the
 * same fields parseEmailLabelMap extracts from real Speak Logic HTML. Returns null
 * unless both "Feedback Subject" and "Actual Feedback Provided" are recognisable —
 * the one label combo unique to the Provide Feedback templates (kept in step with
 * tryLogProvidedFeedbackFromSend's HTML detection so this stays narrow and never
 * misfires on ordinary outgoing mail).
 */
export function parsePlainTextFeedback(text: string): PlainTextFeedbackFields | null {
  if (!text || !text.trim()) return null;
  const lines = text.replace(/\u00A0/g, " ").split(/\r?\n/).map((l) => l.trim());

  const fields: Partial<PlainTextFeedbackFields> = {};
  let blockContentStart = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const colonIdx = line.indexOf(":");
    if (colonIdx > -1) {
      const key = normPlainLine(line.slice(0, colonIdx));
      const field = PLAIN_TEXT_INLINE_LABELS[key];
      if (field && !fields[field]) {
        fields[field] = line.slice(colonIdx + 1).trim();
      }
      continue;
    }

    // richBlockField/blockField labels never carry a colon; the content follows on
    // the next line(s), bounded below by the next section/label (or end-of-text).
    if (normPlainLine(line) === "actualfeedbackprovided") {
      blockContentStart = i + 1;
      break;
    }
  }

  const feedbackSubject = fields.feedbackSubject ?? "";
  const contentLines: string[] = [];
  if (blockContentStart > -1) {
    for (let j = blockContentStart; j < lines.length; j++) {
      const l = lines[j];
      const norm = normPlainLine(l);
      // Stop at the wrapPage footer ("… All Rights Reserved.") too, else it trails
      // into the body for the basic/selection templates where AFP is the last field.
      if (norm.includes("allrightsreserved")) break;
      const cIdx = l.indexOf(":");
      const beforeColon = cIdx > -1 ? normPlainLine(l.slice(0, cIdx)) : "";
      if (PLAIN_TEXT_BLOCK_END_SECTIONS.has(norm) || (cIdx > -1 && PLAIN_TEXT_BLOCK_END_LABELS.has(beforeColon))) break;
      contentLines.push(l);
    }
  }
  const actualFeedbackProvided = contentLines.join("\n").trim();
  if (!feedbackSubject || !actualFeedbackProvided) return null;

  return {
    feedbackSubject,
    actualFeedbackProvided,
    fromPerson: fields.fromPerson ?? "",
    toPerson: fields.toPerson ?? "",
    applicationName: fields.applicationName ?? "",
    communicationFunction: fields.communicationFunction ?? "",
    communicationSignal: fields.communicationSignal ?? "",
    feedbackDate: fields.feedbackDate ?? "",
    feedbackTime: fields.feedbackTime ?? "",
  };
}
