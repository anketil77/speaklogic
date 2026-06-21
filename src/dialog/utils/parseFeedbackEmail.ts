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
      // blockField label row → value is the next row's content cell
      const next = trs[i + 1];
      const nextCell = next ? Array.from(next.children).find((c) => c.tagName === "TD") : null;
      if (nextCell && !nextCell.querySelector("strong")) {
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

      // ── error ── ("Actual Error" starts a new error)
      case "actualerror":
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

      // ── compensator ── ("Actual Compensator" starts a new compensator)
      case "actualcompensator":
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

      // ── question ── ("Actual Question" starts a new question)
      case "actualquestion":
        flush();
        curQ = {
          questionNumber: out.questions.length + 1,
          actualQuestion: value,
          entityQuestionPointTo: "",
          responseStatus: "",
          questionDate: "",
          questionTime: "",
        };
        break;
      case "entityquestionpointto":
        if (curQ) curQ.entityQuestionPointTo = value;
        break;

      // ── answer ── ("Actual Answer" starts a new answer)
      case "actualanswer":
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
        break;
      case "informationanswerpointto":
        if (curA) curA.informationAnswerPointTo = value;
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
