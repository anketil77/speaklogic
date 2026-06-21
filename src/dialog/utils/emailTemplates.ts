// src/dialog/utils/emailTemplates.ts
// Builds fully-filled HTML email bodies from the client's template designs.
// Three variants per action:
//   "analysis"  — feedback sent after Analyze Paragraph/Email (includes full analysis context)
//   "selection" — feedback sent after Analyze/Flag Selection (includes the selected text)
//   "basic"     — standalone feedback with no prior context

import type {
  SaveFeedbackPayload,
  SaveRequestFeedbackPayload,
  ProjectAnalysis,
  ProjectError,
  ProjectCompensator,
  ProjectQuestion,
  ProjectAnswer,
  ProjectProblem,
  AnalysisDataForApply,
} from "@/types/db";
import { formatDisplayDate } from "@/db/db";

const GREEN = "#42b634";

// ── Embedded machine-readable payload (Point 11 — Apply Email extraction) ─────
// Every "with analysis" feedback email carries a hidden, base64 JSON copy of the
// analysis sub-collections. When the recipient runs "Apply Email", the parser
// (src/dialog/utils/parseFeedbackEmail.ts) reads this back into the Apply dialog —
// 100% reliable, independent of the visible HTML layout. Human-typed emails have
// no marker and therefore cannot be auto-extracted (documented limitation).
export const SL_FEEDBACK_MARKER = "data-sl-feedback";

function buildEmbeddedData(
  analysis: ProjectAnalysis,
  fb: SaveFeedbackPayload["feedback"],
): string {
  const data: AnalysisDataForApply = {
    id: analysis.id ?? 0,
    entityUnderAnalysis: analysis.entityUnderAnalysis ?? "",
    analysisSubject: analysis.analysisSubject ?? fb.feedbackSubject ?? "",
    actualAnalysis: analysis.actualAnalysis ?? "",
    fromPerson: analysis.fromPerson ?? fb.fromPerson ?? "",
    errors: (analysis.errors ?? []).map((e) => ({
      errorNumber: e.errorNumber, actualError: e.actualError, fromActualCommunication: e.fromActualCommunication,
      entityErrorPointTo: e.entityErrorPointTo, errorDescription: e.errorDescription, errorDate: e.errorDate, errorTime: e.errorTime,
    })),
    compensators: (analysis.compensators ?? []).map((c) => ({
      compensatorNumber: c.compensatorNumber, actualCompensator: c.actualCompensator, actualErrorReplaced: c.actualErrorReplaced,
      inActualCommunication: c.inActualCommunication, compensatorDescription: c.compensatorDescription, compensatorDate: c.compensatorDate, compensatorTime: c.compensatorTime,
    })),
    questions: (analysis.questions ?? []).map((q) => ({
      questionNumber: q.questionNumber, actualQuestion: q.actualQuestion, entityQuestionPointTo: q.entityQuestionPointTo,
      responseStatus: q.responseStatus, questionDate: q.questionDate, questionTime: q.questionTime,
    })),
    answers: (analysis.answers ?? []).map((a) => ({
      answerNumber: a.answerNumber, actualQuestion: a.actualQuestion, entityQuestionPointTo: a.entityQuestionPointTo,
      informationAnswerPointTo: a.informationAnswerPointTo, actualAnswer: a.actualAnswer, answerDate: a.answerDate, answerTime: a.answerTime,
    })),
    files: [],
    correctedItems: [],
    problems: (analysis.problems ?? []).map((p) => ({
      problemNumber: p.problemNumber, problemName: p.problemName, actualProblem: p.actualProblem,
      fromActualError: p.fromActualError, problemDescription: p.problemDescription, problemDate: p.problemDate, problemTime: p.problemTime,
    })),
  };
  // encodeURIComponent → base64 keeps it ASCII-safe inside the HTML attribute and
  // survives Outlook's HTML round-trip; ES5-safe (no btoa unicode pitfalls here).
  let encoded = "";
  try {
    encoded = typeof btoa === "function"
      ? btoa(encodeURIComponent(JSON.stringify(data)))
      : encodeURIComponent(JSON.stringify(data));
  } catch {
    encoded = encodeURIComponent(JSON.stringify(data));
  }
  return `<div ${SL_FEEDBACK_MARKER}="${encoded}" style="display:none;mso-hide:all;font-size:0;line-height:0;max-height:0;overflow:hidden;">&nbsp;</div>`;
}

// ── Image base URL ────────────────────────────────────────────────────────────
// At runtime the add-in is served from the same origin in both dev and prod.
function imgUrl(name: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/assets/email-icons/${name}`;
}

// ── HTML helpers ──────────────────────────────────────────────────────────────
function esc(v: string | null | undefined): string {
  return (v ?? "—")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function stripHtml(v: string | undefined | null): string {
  if (!v) return "—";
  return v
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim() || "—";
}

function fieldRow(label: string, value: string): string {
  return `<tr>
    <td align="left" style="font-size:16px;font-family:Verdana;color:#000;line-height:30px;"><strong>${label}</strong></td>
    <td style="font-weight:700;line-height:30px;width:25px;">&nbsp;:</td>
    <td align="left" style="font-size:14px;font-family:Verdana;color:#000;line-height:30px;">${value}</td>
  </tr>`;
}

function blockField(label: string, content: string): string {
  return `<tr>
    <td align="left" style="font-size:16px;font-family:Verdana;color:#000;line-height:30px;" colspan="3"><strong>${label}</strong></td>
  </tr>
  <tr>
    <td align="left" style="font-size:14px;line-height:20px;font-family:Verdana;color:#000;" colspan="3"><p style="margin:0;padding-bottom:10px;">${content}</p></td>
  </tr>`;
}

function section(iconFile: string, title: string, rows: string): string {
  return `
  <table cellpadding="0" cellspacing="0" width="600" style="background:#f7f7f7;margin-bottom:4px;">
    <tr>
      <td style="background:${GREEN};padding:12px 0;text-align:center;font-size:22px;font-family:Verdana;color:#fff;">
        <table style="margin:0 auto;"><tr>
          <td><img src="${imgUrl(iconFile)}" alt="" width="28" style="width:28px;vertical-align:middle;"></td>
          <td>&nbsp;</td>
          <td style="vertical-align:middle;">${title}</td>
        </tr></table>
      </td>
    </tr>
    <tr><td style="height:20px;"></td></tr>
    <tr>
      <td style="padding:0 30px;">
        <table width="540" cellpadding="0" cellspacing="0"><tbody>${rows}</tbody></table>
      </td>
    </tr>
    <tr><td style="height:20px;"></td></tr>
  </table>`;
}

function wrapPage(title: string, body: string): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(title)}</title>
  <style>
    body,table,thead,tbody,tr,td{padding:0;margin:0;border:none;border-spacing:0;border-collapse:collapse;vertical-align:top;}
    body{background:#e0e0e0;font-family:Verdana,Arial,sans-serif;}
    p{margin:0;padding:0;padding-bottom:10px;line-height:1.6;font-family:Verdana,Arial,sans-serif;}
    img{display:inline-block;}
    @media only screen and (max-width:767px){.section{width:100%!important;}.column{width:100%!important;}}
  </style>
</head>
<body>
<table width="100%"><tbody><tr><td align="center" style="padding:20px 10px;">
  <table cellpadding="0" cellspacing="0" width="600">
    <tr><td style="background:${GREEN};height:10px;"></td></tr>
    <tr>
      <td style="background:#fdfdfd;padding:20px 0;text-align:center;">
        <a href="#"><img src="${imgUrl("logo.png")}" alt="Speak Logic" style="width:210px;" width="210"></a>
      </td>
    </tr>
    <tr><td style="background:${GREEN};height:10px;"></td></tr>
    <tr><td style="height:0;"></td></tr>
  </table>
  <table cellpadding="0" cellspacing="0" width="600" style="margin-bottom:4px;">
    <tr>
      <td>
        <img src="${imgUrl("feedback-banner.jpg")}" alt="Feedback" width="600" style="width:100%;display:block;">
      </td>
    </tr>
  </table>
  ${body}
  <table cellpadding="0" cellspacing="0" width="600">
    <tr>
      <td style="background:${GREEN};padding:12px 0;text-align:center;font-size:13px;font-family:Verdana;color:#fff;">
        The Speak Logic Project &copy; ${year}. All Rights Reserved.
      </td>
    </tr>
  </table>
</td></tr></tbody></table>
</body>
</html>`;
}

// ── Analysis sub-sections (used by "with analysis" variants) ─────────────────

function buildErrorRows(errors: ProjectError[]): string {
  if (!errors.length) return "";
  return errors.map((e, i) => [
    fieldRow("Error Number", esc(String(e.errorNumber ?? i + 1))),
    fieldRow("Actual Error", esc(e.actualError)),
    fieldRow("From Actual Comm/App", esc(e.fromActualCommunication)),
    fieldRow("Entity Error Point to", esc(e.entityErrorPointTo)),
    fieldRow("Error Date", esc(formatDisplayDate(e.errorDate))),
    fieldRow("Error Time", esc(e.errorTime)),
    blockField("Error Description", esc(stripHtml(e.errorDescription))),
  ].join("")).join("");
}

function buildCompensatorRows(comps: ProjectCompensator[]): string {
  if (!comps.length) return "";
  return comps.map((c, i) => [
    fieldRow("Compensator Number", esc(String(c.compensatorNumber ?? i + 1))),
    fieldRow("Actual Compensator", esc(c.actualCompensator)),
    fieldRow("Actual Error Replaced", esc(c.actualErrorReplaced)),
    fieldRow("In Actual App/Comm", esc(c.inActualCommunication)),
    fieldRow("Compensator Date", esc(formatDisplayDate(c.compensatorDate))),
    fieldRow("Compensator Time", esc(c.compensatorTime)),
    blockField("Compensator Description", esc(stripHtml(c.compensatorDescription))),
  ].join("")).join("");
}

function buildQuestionRows(questions: ProjectQuestion[]): string {
  if (!questions.length) return "";
  return questions.map((q, i) => [
    fieldRow("Question Number", esc(String(q.questionNumber ?? i + 1))),
    fieldRow("Entity Question Point to", esc(q.entityQuestionPointTo)),
    blockField("Actual Question", esc(stripHtml(q.actualQuestion))),
  ].join("")).join("");
}

function buildAnswerRows(answers: ProjectAnswer[]): string {
  if (!answers.length) return "";
  return answers.map((a, i) => [
    fieldRow("Answer Number", esc(String(a.answerNumber ?? i + 1))),
    fieldRow("Information Answer Point to", esc(a.informationAnswerPointTo)),
    blockField("Actual Answer", esc(stripHtml(a.actualAnswer))),
  ].join("")).join("");
}

function buildProblemRows(problems: ProjectProblem[]): string {
  if (!problems.length) return "";
  return problems.map((p, i) => [
    fieldRow("Problem Number", esc(String(p.problemNumber ?? i + 1))),
    fieldRow("Problem Name", esc(p.problemName)),
    fieldRow("Actual Problem", esc(p.actualProblem)),
    fieldRow("From Actual Error", esc(p.fromActualError)),
    blockField("Problem Description", esc(stripHtml(p.problemDescription))),
  ].join("")).join("");
}

// ── Provide Feedback ──────────────────────────────────────────────────────────

function buildProvideFeedbackWithAnalysis(
  fb: SaveFeedbackPayload["feedback"],
  analysis: ProjectAnalysis,
): string {
  const provideFbSection = section("icon-provide.png", "Provide Feedback", [
    fieldRow("Feedback Subject", esc(fb.feedbackSubject)),
    fieldRow("Actual Error Substituted", esc(fb.actualErrorSubstituted) || "—"),
    fieldRow("Actual Compensator Replaced", esc(fb.actualCompensatorReplaced) || "—"),
    blockField("Actual Feedback Provided", esc(stripHtml(fb.feedbackApplication))),
  ].join(""));

  const msgSection = section("icon-receive.png", "Message Under Analysis", [
    fieldRow("From Person", esc(analysis.fromPerson)),
    fieldRow("To Person", esc(fb.toPerson)),
    fieldRow("Application Name", esc(fb.applicationName)),
    fieldRow("Communication Function", esc(fb.communicationFunction)),
    fieldRow("Communication Signal", esc(fb.communicationSignal)),
    fieldRow("Communication Date", esc(formatDisplayDate(analysis.analysisDate))),
    fieldRow("Communication Time", esc(analysis.analysisTime)),
    fieldRow("Analysis Subject", esc(analysis.analysisSubject)),
    blockField("Actual Message", esc(stripHtml(analysis.entityUnderAnalysis))),
  ].join(""));

  const analysisSection = section("icon-analysis.png", "My Analysis", [
    fieldRow("From Person", esc(fb.fromPerson)),
    fieldRow("To Person", esc(fb.toPerson)),
    fieldRow("Application Name", esc(fb.applicationName)),
    blockField("Actual Analysis", esc(stripHtml(analysis.actualAnalysis))),
  ].join(""));

  const errorSection = (analysis.errors?.length)
    ? section("icon-error.png", "About Error", buildErrorRows(analysis.errors))
    : "";
  const compSection = (analysis.compensators?.length)
    ? section("icon-ompensator.png", "About Compensator", buildCompensatorRows(analysis.compensators))
    : "";
  const qSection = (analysis.questions?.length)
    ? section("icon-question.png", "About Question", buildQuestionRows(analysis.questions))
    : "";
  const aSection = (analysis.answers?.length)
    ? section("icon-answer.png", "About Answer", buildAnswerRows(analysis.answers))
    : "";
  const pSection = (analysis.problems?.length)
    ? section("icon-solved.png", "About Problem", buildProblemRows(analysis.problems))
    : "";

  return wrapPage("Provide Feedback", [
    provideFbSection, msgSection, analysisSection, errorSection, compSection, pSection, qSection, aSection,
    buildEmbeddedData(analysis, fb),
  ].join(""));
}

function buildProvideFeedbackWithSelection(fb: SaveFeedbackPayload["feedback"]): string {
  const rows = [
    fieldRow("Application Name", esc(fb.applicationName)),
    fieldRow("Communication Function", esc(fb.communicationFunction)),
    fieldRow("Feedback Subject", esc(fb.feedbackSubject)),
    fieldRow("Actual Error Substituted", esc(fb.actualErrorSubstituted) || "—"),
    fieldRow("Actual Compensator Replaced", esc(fb.actualCompensatorReplaced) || "—"),
    fieldRow("From Person", esc(fb.fromPerson)),
    fieldRow("To Person", esc(fb.toPerson)),
    fieldRow("Feedback Type", esc(fb.feedbackType)),
    fieldRow("Feedback Date", esc(formatDisplayDate(fb.feedbackDate))),
    fieldRow("Feedback Time", esc(fb.feedbackTime)),
    blockField("Feedback Selection", esc(stripHtml(fb.actualSelection))),
    blockField("Actual Feedback Provided", esc(stripHtml(fb.feedbackApplication))),
  ].join("");
  return wrapPage("Provide Feedback With Selection",
    section("icon-provide.png", "Provide Feedback With Selection", rows));
}

function buildProvideFeedbackBasic(fb: SaveFeedbackPayload["feedback"]): string {
  const rows = [
    fieldRow("Application Name", esc(fb.applicationName)),
    fieldRow("Communication Function", esc(fb.communicationFunction)),
    fieldRow("Feedback Subject", esc(fb.feedbackSubject)),
    fieldRow("From Person", esc(fb.fromPerson)),
    fieldRow("To Person", esc(fb.toPerson)),
    fieldRow("Feedback Type", esc(fb.feedbackType)),
    fieldRow("Feedback Date", esc(formatDisplayDate(fb.feedbackDate))),
    fieldRow("Feedback Time", esc(fb.feedbackTime)),
    blockField("Actual Feedback Provided", esc(stripHtml(fb.feedbackApplication))),
  ].join("");
  return wrapPage("Provide Feedback", section("icon-provide.png", "Provide Feedback", rows));
}

// ── Apply Feedback ────────────────────────────────────────────────────────────

function buildApplyFeedbackWithAnalysis(
  fb: SaveFeedbackPayload["feedback"],
  analysis: ProjectAnalysis,
): string {
  const applySection = section("icon-apply.png", "Apply Feedback", [
    fieldRow("Application Name", esc(fb.applicationName)),
    fieldRow("Communication Function", esc(fb.communicationFunction)),
    fieldRow("Feedback Subject", esc(fb.feedbackSubject)),
    fieldRow("Actual Error Substituted", esc(fb.actualErrorSubstituted) || "—"),
    fieldRow("Actual Compensator Replaced", esc(fb.actualCompensatorReplaced) || "—"),
    fieldRow("From Person", esc(fb.fromPerson)),
    fieldRow("To Person", esc(fb.toPerson)),
    fieldRow("Feedback Type", esc(fb.feedbackType)),
    fieldRow("Feedback Date", esc(formatDisplayDate(fb.feedbackDate))),
    fieldRow("Feedback Time", esc(fb.feedbackTime)),
    blockField("Feedback Application", esc(stripHtml(fb.feedbackApplication))),
  ].join(""));

  const msgSection = section("icon-receive.png", "Message Under Analysis", [
    fieldRow("From Person", esc(analysis.fromPerson)),
    fieldRow("To Person", esc(fb.toPerson)),
    fieldRow("Application Name", esc(fb.applicationName)),
    fieldRow("Communication Function", esc(fb.communicationFunction)),
    fieldRow("Communication Signal", esc(fb.communicationSignal)),
    fieldRow("Communication Date", esc(formatDisplayDate(analysis.analysisDate))),
    fieldRow("Communication Time", esc(analysis.analysisTime)),
    fieldRow("Analysis Subject", esc(analysis.analysisSubject)),
    blockField("Actual Message", esc(stripHtml(analysis.entityUnderAnalysis))),
  ].join(""));

  const analysisSection = section("icon-analysis.png", "My Analysis", [
    fieldRow("From Person", esc(fb.fromPerson)),
    fieldRow("To Person", esc(fb.toPerson)),
    fieldRow("Application Name", esc(fb.applicationName)),
    blockField("Actual Analysis", esc(stripHtml(analysis.actualAnalysis))),
  ].join(""));

  const errorSection = (analysis.errors?.length)
    ? section("icon-error.png", "About Error", buildErrorRows(analysis.errors))
    : "";
  const compSection = (analysis.compensators?.length)
    ? section("icon-ompensator.png", "About Compensator", buildCompensatorRows(analysis.compensators))
    : "";
  const qSection = (analysis.questions?.length)
    ? section("icon-question.png", "About Question", buildQuestionRows(analysis.questions))
    : "";
  const aSection = (analysis.answers?.length)
    ? section("icon-answer.png", "About Answer", buildAnswerRows(analysis.answers))
    : "";
  const pSection = (analysis.problems?.length)
    ? section("icon-solved.png", "About Problem", buildProblemRows(analysis.problems))
    : "";

  return wrapPage("Apply Feedback", [
    applySection, msgSection, analysisSection, errorSection, compSection, pSection, qSection, aSection,
    buildEmbeddedData(analysis, fb),
  ].join(""));
}

function buildApplyFeedbackWithSelection(fb: SaveFeedbackPayload["feedback"]): string {
  const rows = [
    blockField("About Selection", esc(stripHtml(fb.actualSelection))),
    fieldRow("Application Name", esc(fb.applicationName)),
    fieldRow("Communication Function", esc(fb.communicationFunction)),
    fieldRow("Feedback Subject", esc(fb.feedbackSubject)),
    fieldRow("Actual Error Substituted", esc(fb.actualErrorSubstituted) || "—"),
    fieldRow("Actual Compensator Replaced", esc(fb.actualCompensatorReplaced) || "—"),
    fieldRow("From Person", esc(fb.fromPerson)),
    fieldRow("To Person", esc(fb.toPerson)),
    fieldRow("Feedback Type", esc(fb.feedbackType)),
    fieldRow("Feedback Date", esc(formatDisplayDate(fb.feedbackDate))),
    fieldRow("Feedback Time", esc(fb.feedbackTime)),
    blockField("Feedback Application", esc(stripHtml(fb.feedbackApplication))),
  ].join("");
  return wrapPage("Apply Selection as Feedback",
    section("icon-apply.png", "Apply Selection as Feedback", rows));
}

function buildApplyFeedbackBasic(fb: SaveFeedbackPayload["feedback"]): string {
  const rows = [
    fieldRow("Application Name", esc(fb.applicationName)),
    fieldRow("Communication Function", esc(fb.communicationFunction)),
    fieldRow("Feedback Subject", esc(fb.feedbackSubject)),
    fieldRow("Actual Error Substituted", esc(fb.actualErrorSubstituted) || "—"),
    fieldRow("Actual Compensator Replaced", esc(fb.actualCompensatorReplaced) || "—"),
    fieldRow("From Person", esc(fb.fromPerson)),
    fieldRow("To Person", esc(fb.toPerson)),
    fieldRow("Feedback Type", esc(fb.feedbackType)),
    fieldRow("Feedback Date", esc(formatDisplayDate(fb.feedbackDate))),
    fieldRow("Feedback Time", esc(fb.feedbackTime)),
    blockField("Feedback Application", esc(stripHtml(fb.feedbackApplication))),
  ].join("");
  return wrapPage("Apply Feedback", section("icon-apply.png", "Apply Feedback", rows));
}

// ── Request Feedback ──────────────────────────────────────────────────────────

function buildRequestFeedbackWithSelection(p: SaveRequestFeedbackPayload): string {
  const rows = [
    blockField("About Selection", esc(stripHtml(p.actualSelection))),
    fieldRow("Application Name", esc(p.applicationName)),
    fieldRow("Communication Function", esc(p.communicationFunction)),
    fieldRow("Feedback Subject", esc(p.communicationSubject)),
    fieldRow("From Person", esc(p.fromPerson)),
    fieldRow("To Person", esc(p.toPerson)),
    fieldRow("Feedback Type", esc(p.communicationSignalType)),
    blockField("Actual Request For Feedback", esc(stripHtml(p.actualCommunication))),
  ].join("");
  return wrapPage("Request Feedback — Selection",
    section("icon-request.png", "Request For Feedback — Selection", rows));
}

function buildRequestFeedbackBasic(p: SaveRequestFeedbackPayload): string {
  const rows = [
    fieldRow("Application Name", esc(p.applicationName)),
    fieldRow("Communication Function", esc(p.communicationFunction)),
    fieldRow("Feedback Subject", esc(p.communicationSubject)),
    fieldRow("From Person", esc(p.fromPerson)),
    fieldRow("To Person", esc(p.toPerson)),
    fieldRow("Feedback Type", esc(p.communicationSignalType)),
    blockField("Actual Request For Feedback", esc(stripHtml(p.actualCommunication))),
  ].join("");
  return wrapPage("Request Feedback", section("icon-request.png", "Request For Feedback", rows));
}

// ── Receive Feedback (mirrors Provide, from recipient's perspective) ───────────

function buildReceiveFeedbackBasic(fb: SaveFeedbackPayload["feedback"]): string {
  const rows = [
    fieldRow("From Person", esc(fb.fromPerson)),
    fieldRow("To Person", esc(fb.toPerson)),
    fieldRow("Application Name", esc(fb.applicationName)),
    fieldRow("Communication Function", esc(fb.communicationFunction)),
    fieldRow("Communication Signal", esc(fb.communicationSignal)),
    fieldRow("Feedback Subject", esc(fb.feedbackSubject)),
    blockField("Actual Request For Feedback", esc(stripHtml(fb.feedbackApplication))),
  ].join("");
  return wrapPage("Receive Feedback", section("icon-receive.png", "Receive Feedback", rows));
}

function buildReceiveFeedbackWithAnalysis(
  fb: SaveFeedbackPayload["feedback"],
  analysis: ProjectAnalysis,
): string {
  const receiveSection = section("icon-receive.png", "Receive Feedback", [
    fieldRow("From Person", esc(fb.fromPerson)),
    fieldRow("To Person", esc(fb.toPerson)),
    fieldRow("Application Name", esc(fb.applicationName)),
    fieldRow("Communication Function", esc(fb.communicationFunction)),
    fieldRow("Communication Signal", esc(fb.communicationSignal)),
    fieldRow("Feedback Subject", esc(fb.feedbackSubject)),
    blockField("Actual Request For Feedback", esc(stripHtml(fb.feedbackApplication))),
  ].join(""));

  const msgSection = section("icon-receive.png", "Message Under Analysis", [
    fieldRow("From Person", esc(analysis.fromPerson)),
    fieldRow("To Person", esc(fb.toPerson)),
    fieldRow("Application Name", esc(fb.applicationName)),
    fieldRow("Communication Function", esc(fb.communicationFunction)),
    fieldRow("Communication Signal", esc(fb.communicationSignal)),
    fieldRow("Communication Date", esc(formatDisplayDate(analysis.analysisDate))),
    fieldRow("Communication Time", esc(analysis.analysisTime)),
    fieldRow("Analysis Subject", esc(analysis.analysisSubject)),
    blockField("Actual Message", esc(stripHtml(analysis.entityUnderAnalysis))),
  ].join(""));

  const errorSection = (analysis.errors?.length)
    ? section("icon-error.png", "About Error", buildErrorRows(analysis.errors))
    : "";
  const compSection = (analysis.compensators?.length)
    ? section("icon-ompensator.png", "About Compensator", buildCompensatorRows(analysis.compensators))
    : "";
  const qSection = (analysis.questions?.length)
    ? section("icon-question.png", "About Question", buildQuestionRows(analysis.questions))
    : "";
  const aSection = (analysis.answers?.length)
    ? section("icon-answer.png", "About Answer", buildAnswerRows(analysis.answers))
    : "";
  const pSection = (analysis.problems?.length)
    ? section("icon-solved.png", "About Problem", buildProblemRows(analysis.problems))
    : "";

  return wrapPage("Receive Feedback", [
    receiveSection, msgSection, errorSection, compSection, pSection, qSection, aSection,
    buildEmbeddedData(analysis, fb),
  ].join(""));
}

// ── Solve Problem ─────────────────────────────────────────────────────────────

export interface SolveProblemData {
  actualProblem: string;
  feedbackApplied: string;
  errorCorrected: string;
  compensatorReplaced: string;
  additionalExplanation: string;
  applicationName?: string;
  communicationFunction?: string;
  fromPerson?: string;
  toPerson?: string;
  feedbackDate?: string;
  feedbackTime?: string;
  feedbackSubject?: string;
  analysis?: ProjectAnalysis;
}

function buildSolveProblemWithAnalysis(d: SolveProblemData): string {
  const solveSection = section("icon-solved.png", "Solve Problem", [
    fieldRow("Application Name", esc(d.applicationName)),
    fieldRow("Communication Function", esc(d.communicationFunction)),
    fieldRow("Feedback Subject", esc(d.feedbackSubject)),
    fieldRow("From Person", esc(d.fromPerson)),
    fieldRow("To Person", esc(d.toPerson)),
    fieldRow("Feedback Date", esc(d.feedbackDate ? formatDisplayDate(d.feedbackDate) : "")),
    fieldRow("Feedback Time", esc(d.feedbackTime)),
    fieldRow("Actual Problem", esc(d.actualProblem)),
    fieldRow("Feedback Applied", esc(d.feedbackApplied)),
    fieldRow("Error Corrected", esc(d.errorCorrected)),
    fieldRow("Compensator Replaced", esc(d.compensatorReplaced)),
    blockField("Additional Explanation", esc(stripHtml(d.additionalExplanation))),
  ].join(""));

  const analysis = d.analysis;
  if (!analysis) return wrapPage("Solve Problem", solveSection);

  const msgSection = section("icon-receive.png", "Message Under Analysis", [
    fieldRow("From Person", esc(analysis.fromPerson)),
    fieldRow("Application Name", esc(d.applicationName)),
    fieldRow("Communication Function", esc(d.communicationFunction)),
    fieldRow("Communication Signal", esc(analysis.communicationSignal)),
    fieldRow("Communication Date", esc(formatDisplayDate(analysis.analysisDate))),
    fieldRow("Communication Time", esc(analysis.analysisTime)),
    fieldRow("Analysis Subject", esc(analysis.analysisSubject)),
    blockField("Actual Message", esc(stripHtml(analysis.entityUnderAnalysis))),
  ].join(""));

  const errorSection = (analysis.errors?.length)
    ? section("icon-error.png", "About Error", buildErrorRows(analysis.errors))
    : "";
  const compSection = (analysis.compensators?.length)
    ? section("icon-ompensator.png", "About Compensator", buildCompensatorRows(analysis.compensators))
    : "";

  return wrapPage("Solve Problem", [solveSection, msgSection, errorSection, compSection].join(""));
}

function buildSolveProblemBasic(d: SolveProblemData): string {
  const rows = [
    fieldRow("Actual Problem", esc(d.actualProblem)),
    fieldRow("Feedback Applied", esc(d.feedbackApplied)),
    fieldRow("Error Corrected", esc(d.errorCorrected)),
    fieldRow("Compensator Replaced", esc(d.compensatorReplaced)),
    blockField("Additional Explanation", esc(stripHtml(d.additionalExplanation))),
  ].join("");
  return wrapPage("Solve Problem", section("icon-solved.png", "Solve Problem", rows));
}

// ── Public API ────────────────────────────────────────────────────────────────

export type FeedbackEmailVariant = "analysis" | "selection" | "basic";

export function detectVariant(
  fb: SaveFeedbackPayload["feedback"],
  analysis: ProjectAnalysis | null | undefined,
): FeedbackEmailVariant {
  if (analysis && analysis.id) return "analysis";
  if (fb.actualSelection && fb.actualSelection.trim().length > 0) return "selection";
  return "basic";
}

export function buildProvideFeedbackEmail(
  fb: SaveFeedbackPayload["feedback"],
  analysis?: ProjectAnalysis | null,
): string {
  const variant = detectVariant(fb, analysis);
  if (variant === "analysis" && analysis) return buildProvideFeedbackWithAnalysis(fb, analysis);
  if (variant === "selection") return buildProvideFeedbackWithSelection(fb);
  return buildProvideFeedbackBasic(fb);
}

export function buildApplyFeedbackEmail(
  fb: SaveFeedbackPayload["feedback"],
  analysis?: ProjectAnalysis | null,
): string {
  const variant = detectVariant(fb, analysis);
  if (variant === "analysis" && analysis) return buildApplyFeedbackWithAnalysis(fb, analysis);
  if (variant === "selection") return buildApplyFeedbackWithSelection(fb);
  return buildApplyFeedbackBasic(fb);
}

export function buildRequestFeedbackEmail(p: SaveRequestFeedbackPayload): string {
  if (p.actualSelection && p.actualSelection.trim().length > 0) {
    return buildRequestFeedbackWithSelection(p);
  }
  return buildRequestFeedbackBasic(p);
}

export function buildReceiveFeedbackEmail(
  fb: SaveFeedbackPayload["feedback"],
  analysis?: ProjectAnalysis | null,
): string {
  if (analysis && analysis.id) return buildReceiveFeedbackWithAnalysis(fb, analysis);
  return buildReceiveFeedbackBasic(fb);
}

export function buildSolveProblemEmail(d: SolveProblemData): string {
  if (d.analysis) return buildSolveProblemWithAnalysis(d);
  return buildSolveProblemBasic(d);
}
