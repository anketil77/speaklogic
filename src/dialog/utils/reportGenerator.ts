import type {
  ProjectAnalysis,
  ProjectError,
  ProjectCompensator,
  ProjectQuestion,
  ProjectAnswer,
  ProjectProblem,
  ProjectFeedback,
  FlagEntityForAnalysis,
  FlaggedEntityHistory,
  FlaggedArticle,
  PrincipleInterpretation,
  PrincipleInSelection,
  SelectionWithPrinciple,
  CommSignalInfo,
} from "@/types/db";
import { formatDisplayDate } from "@/db/db";

const GREEN = "#42b634";

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

function esc(v: string | null | undefined): string {
  return (v ?? "—")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
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
    <td align="left" style="font-size:14px;line-height:20px;font-family:Verdana;color:#000;line-height:30px;" colspan="3"><p>${content}</p></td>
  </tr>`;
}

function sectionBlock(title: string, rows: string): string {
  return `<table cellpadding="0" cellspacing="0" width="600" style="background:#f7f7f7;margin-bottom:4px;">
  <tr>
    <td style="background:${GREEN};padding:12px 0;text-align:center;font-size:22px;font-family:Verdana;color:#fff;">
      <table style="margin:0 auto;"><tr><td style="vertical-align:middle;">${title}</td></tr></table>
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
    body,table,thead,tbody,tr,td { padding:0; margin:0; border:none; border-spacing:0; border-collapse:collapse; vertical-align:top; }
    body { background:#e0e0e0; font-family:Verdana,Arial,sans-serif; }
    h1,h2,h3,h4,h5,h6,p { margin:0; padding:0; padding-bottom:20px; line-height:1.6; }
    p { font-family:Verdana,Arial,sans-serif; }
  </style>
</head>
<body>
<table width="100%"><tbody><tr><td align="center" style="padding:20px 10px;">
  <table cellpadding="0" cellspacing="0" width="600">
    <tr><td style="background:${GREEN};height:10px;"></td></tr>
    <tr>
      <td style="background:#fdfdfd;padding:20px 30px;text-align:center;">
        <span style="font-size:26px;font-weight:bold;color:${GREEN};font-family:Verdana,sans-serif;">Speak Logic</span>
      </td>
    </tr>
    <tr><td style="background:${GREEN};height:10px;"></td></tr>
    <tr><td style="height:8px;"></td></tr>
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

function openBlob(html: string): void {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.addEventListener("load", () => URL.revokeObjectURL(url), { once: true });
  } else {
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
}

// ── Error sub-section ──────────────────────────────────────────────────────

function buildErrorSection(errors: ProjectError[]): string {
  if (!errors.length) return "";
  const rows = errors
    .map((e, i) =>
      [
        fieldRow("Error Number", esc(String(e.errorNumber ?? i + 1))),
        fieldRow("From Actual Comm/App", esc(e.actualError)),
        fieldRow("Entity Error Point to", esc(e.entityErrorPointTo)),
        fieldRow("Error Date", esc(formatDisplayDate(e.errorDate))),
        fieldRow("Error Time", esc(e.errorTime)),
        blockField("Error Description", esc(stripHtml(e.errorDescription))),
      ].join("")
    )
    .join("");
  return sectionBlock("About Error", rows);
}

// ── Compensator sub-section ────────────────────────────────────────────────

function buildCompensatorSection(comps: ProjectCompensator[]): string {
  if (!comps.length) return "";
  const rows = comps
    .map((c, i) =>
      [
        fieldRow("Compensator Number", esc(String(c.compensatorNumber ?? i + 1))),
        fieldRow("Actual Compensator", esc(c.actualErrorReplaced)),
        fieldRow("In Actual App/Comm", esc(c.inActualCommunication)),
        fieldRow("Compensator Date", esc(formatDisplayDate(c.compensatorDate))),
        fieldRow("Compensator Time", esc(c.compensatorTime)),
        blockField("Compensator Description", esc(stripHtml(c.compensatorDescription))),
      ].join("")
    )
    .join("");
  return sectionBlock("About Compensator", rows);
}

// ── Question sub-section ───────────────────────────────────────────────────

function buildQuestionSection(questions: ProjectQuestion[]): string {
  if (!questions.length) return "";
  const rows = questions
    .map((q, i) =>
      [
        fieldRow("Question Number", esc(String(q.questionNumber ?? i + 1))),
        fieldRow("Entity Question Point to", esc(q.entityQuestionPointTo)),
        blockField("Actual Question", esc(stripHtml(q.actualQuestion))),
      ].join("")
    )
    .join("");
  return sectionBlock("About Question", rows);
}

// ── Answer sub-section ─────────────────────────────────────────────────────

function buildAnswerSection(answers: ProjectAnswer[]): string {
  if (!answers.length) return "";
  const rows = answers
    .map((a, i) =>
      [
        fieldRow("Answer Number", esc(String(a.answerNumber ?? i + 1))),
        fieldRow("Information Answer Point to", esc(a.informationAnswerPointTo)),
        blockField("Actual Answer", esc(stripHtml(a.actualAnswer))),
      ].join("")
    )
    .join("");
  return sectionBlock("About Answer", rows);
}

// ── Problem sub-section ────────────────────────────────────────────────────

function buildProblemSection(problems: ProjectProblem[]): string {
  if (!problems.length) return "";
  const rows = problems
    .map((p, i) =>
      [
        fieldRow("Problem Number", esc(String(p.problemNumber ?? i + 1))),
        fieldRow("Problem Name", esc(p.problemName)),
        fieldRow("Problem Date", esc(formatDisplayDate(p.problemDate))),
        fieldRow("Problem Time", esc(p.problemTime)),
        blockField("Problem Description", esc(stripHtml(p.problemDescription))),
      ].join("")
    )
    .join("");
  return sectionBlock("About Problem", rows);
}

// ── Analysis report (used by both Analysis History and Retained History) ───

export function openAnalysisReport(a: ProjectAnalysis): void {
  const paraRows = [
    fieldRow("From Person", esc(a.fromPerson)),
    fieldRow("Communication Signal", "Red"),
    fieldRow("Communication Date", esc(formatDisplayDate(a.analysisDate))),
    fieldRow("Communication Time", esc(a.analysisTime)),
    fieldRow("Analysis Subject", esc(a.analysisSubject)),
    // The paragraph under analysis IS the entity under analysis — not the analysis
    // text (which is shown separately in "My Analysis" below).
    blockField("Actual Paragraph", esc(stripHtml(a.entityUnderAnalysis))),
  ].join("");

  const analysisRows = [
    fieldRow("From Person", esc(a.fromPerson)),
    fieldRow("Communication Signal", "Blue"),
    fieldRow("Analysis Subject", esc(a.analysisSubject)),
    blockField("Actual Analysis", esc(stripHtml(a.actualAnalysis))),
  ].join("");

  const body = [
    sectionBlock("Paragraph Under Analysis", paraRows),
    sectionBlock("My Analysis", analysisRows),
    buildErrorSection(a.errors ?? []),
    buildCompensatorSection(a.compensators ?? []),
    buildQuestionSection(a.questions ?? []),
    buildAnswerSection(a.answers ?? []),
    buildProblemSection(a.problems ?? []),
  ].join("\n");

  openBlob(wrapPage("Analysis Report", body));
}

// ── Flagged selection report ───────────────────────────────────────────────

export function openSelectionHistoryReport(h: FlaggedEntityHistory): void {
  const rows = [
    fieldRow("Entity Name", esc(stripHtml(h.entityName))),
    fieldRow("Selection Type", esc(h.source)),
    blockField("Actual Selection", esc(stripHtml(h.actualSelection))),
  ].join("");

  const body = sectionBlock("About Selection", rows);
  openBlob(wrapPage("Selection History Report", body));
}

export function openFlaggedReport(flag: FlagEntityForAnalysis): void {
  const rows = [
    fieldRow("Entity Type", esc(flag.selectionType)),
    fieldRow("Entity Name", esc(flag.personName)),
    blockField("Actual Selection", esc(stripHtml(flag.actualSelection))),
  ].join("");

  const body = sectionBlock("About Selection", rows);
  openBlob(wrapPage("Selection Report", body));
}

export function openFlaggedArticleReport(fa: FlaggedArticle): void {
  const rows = [
    fieldRow("Article Title", esc(fa.articleTitle)),
    fieldRow("Category", esc(fa.category ?? "—")),
    fieldRow("Source", esc(fa.source)),
    fieldRow("Date Flagged", esc(formatDisplayDate(fa.flagDate))),
    fieldRow("Flagged By", esc(fa.personName)),
  ].join("");

  const body = sectionBlock("About Flagged Article", rows);
  openBlob(wrapPage("Flagged Article Report", body));
}

// ── Feedback reports ───────────────────────────────────────────────────────

function buildFeedbackAnalysisReport(fb: ProjectFeedback): string {
  const mainRows = [
    fieldRow("From Person", esc(fb.fromPerson)),
    fieldRow("Feedback Date", esc(formatDisplayDate(fb.feedbackDate))),
    fieldRow("Feedback Time", esc(fb.feedbackTime)),
    fieldRow("Feedback Subject", esc(fb.feedbackSubject)),
    blockField("Feedback Application", esc(stripHtml(fb.feedbackApplication))),
  ].join("");

  const body = [
    sectionBlock("Analysis Feedback", mainRows),
    buildCompensatorSection(fb.compensators ?? []),
    buildQuestionSection(fb.questions ?? []),
    buildAnswerSection(fb.answers ?? []),
  ].join("\n");

  const title =
    fb.feedbackType === "Provided"
      ? "Provided Analysis Feedback Report"
      : "Applied Analysis Feedback Report";
  return wrapPage(title, body);
}

function buildProvidedFeedbackReport(fb: ProjectFeedback): string {
  const rows = [
    fieldRow("Application Name", esc(fb.applicationName)),
    fieldRow("Communication Function", esc(fb.communicationFunction)),
    fieldRow("Feedback Subject", esc(fb.feedbackSubject)),
    fieldRow("Actual Error Substituted", esc(fb.actualErrorSubstituted)),
    fieldRow("Actual Compensator Replaced", esc(fb.actualCompensatorReplaced)),
    fieldRow("From Person", esc(fb.fromPerson)),
    fieldRow("To Person", esc(fb.toPerson)),
    fieldRow("Feedback Type", esc(fb.feedbackType)),
    fieldRow("Feedback Date", esc(formatDisplayDate(fb.feedbackDate))),
    fieldRow("Feedback Time", esc(fb.feedbackTime)),
    blockField("Feedback Application", esc(stripHtml(fb.feedbackApplication))),
  ].join("");

  return wrapPage(
    "Provided Feedback Report",
    sectionBlock("Provide Feedback With Selection", rows),
  );
}

function buildAppliedFeedbackReport(fb: ProjectFeedback): string {
  const rows = [
    blockField("About Selection", esc(stripHtml(fb.actualSelection))),
    fieldRow("Application Name", esc(fb.applicationName)),
    fieldRow("Communication Function", esc(fb.communicationFunction)),
    fieldRow("Feedback Subject", esc(fb.feedbackSubject)),
    fieldRow("Actual Error Substituted", esc(fb.actualErrorSubstituted)),
    fieldRow("Actual Compensator Replaced", esc(fb.actualCompensatorReplaced)),
    fieldRow("From Person", esc(fb.fromPerson)),
    fieldRow("To Person", esc(fb.toPerson)),
    fieldRow("Feedback Type", esc(fb.feedbackType)),
    fieldRow("Feedback Date", esc(formatDisplayDate(fb.feedbackDate))),
    fieldRow("Feedback Time", esc(fb.feedbackTime)),
    blockField("Feedback Application", esc(stripHtml(fb.feedbackApplication))),
  ].join("");

  return wrapPage(
    "Applied Feedback Report",
    sectionBlock("Apply Selection as Feedback", rows),
  );
}

export function openFeedbackReport(fb: ProjectFeedback): void {
  const hasSubCollections =
    (fb.compensators?.length ?? 0) > 0 ||
    (fb.questions?.length ?? 0) > 0 ||
    (fb.answers?.length ?? 0) > 0;

  let html: string;
  if (hasSubCollections) {
    html = buildFeedbackAnalysisReport(fb);
  } else if (fb.feedbackType === "Provided") {
    html = buildProvidedFeedbackReport(fb);
  } else {
    html = buildAppliedFeedbackReport(fb);
  }

  openBlob(html);
}

function buildInterpretedPrincipleReport(item: PrincipleInterpretation): string {
  const rows = [
    fieldRow("Actual Principle", esc(item.actualPrinciple)),
    fieldRow("Principle Name", esc(item.principleName)),
    fieldRow("Set Derived From", esc(item.setDerivedFrom)),
    fieldRow("Person Interpreted", esc(item.personInterpreted)),
    fieldRow("Interpretation Result", esc(stripHtml(item.interpretationResult))),
    fieldRow("Communication Principle", esc(item.communicationPrinciple)),
    fieldRow("Comm Principle Description", esc(item.commPrincipleDescription)),
  ].join("");
  return wrapPage("Interpreted Principle Report", sectionBlock("Interpreted Principle", rows));
}

export function openInterpretedPrincipleReport(item: PrincipleInterpretation): void {
  openBlob(buildInterpretedPrincipleReport(item));
}

// C# ref: ListIdentifiedPrinciple.cs barBtnReport_ItemClick (principle-report.html)
function buildIdentifiedPrincipleReport(item: PrincipleInSelection): string {
  const rows = [
    blockField("About Selection", esc(stripHtml(item.actualSelection))),
    fieldRow("Actual Principle", esc(item.actualPrinciple)),
    fieldRow("Principle Name", esc(item.principleName)),
    fieldRow("Set Derived From", esc(item.setDerivedFrom)),
    blockField("Principle Description", esc(stripHtml(item.principleDescription))),
    fieldRow("Communication Principle", esc(item.communicationPrinciple)),
    blockField("Comm Principle Description", esc(stripHtml(item.commPrincipleDescription))),
  ].join("");
  return wrapPage("Identified Principle Report", sectionBlock("Identified Principle", rows));
}

export function openIdentifiedPrincipleReport(item: PrincipleInSelection): void {
  openBlob(buildIdentifiedPrincipleReport(item));
}

// C# ref: ListSelectionRelatedPrinciple.cs barBtnReport_ItemClick (selection-related-principle.html)
function buildRelatedPrincipleReport(item: SelectionWithPrinciple): string {
  const rows = [
    blockField("About Selection", esc(stripHtml(item.actualSelection))),
    fieldRow("Actual Principle", esc(item.actualPrinciple)),
    fieldRow("Principle Name", esc(item.principleName)),
    fieldRow("Set Derived From", esc(item.setDerivedFrom)),
    blockField("Principle Description", esc(stripHtml(item.principleDescription))),
    fieldRow("Communication Principle", esc(item.communicationPrinciple)),
    blockField("Comm Principle Description", esc(stripHtml(item.commPrincipleDescription))),
    fieldRow("Actual Relationship", esc(item.actualRelationship)),
    blockField("Relationship Description", esc(stripHtml(item.relationshipDescription))),
  ].join("");
  return wrapPage("Selection Related Principle Report", sectionBlock("Selection Related Principle", rows));
}

export function openRelatedPrincipleReport(item: SelectionWithPrinciple): void {
  openBlob(buildRelatedPrincipleReport(item));
}

// ── Feedback Request reports ───────────────────────────────────────────────

/** "View Request Feedback Selection Report" — shows selection + request details. */
export function openRequestFeedbackSelectionReport(req: CommSignalInfo): void {
  const rows = [
    fieldRow("From Person",            esc(req.fromPerson)),
    fieldRow("To Person",              esc(req.toPerson)),
    fieldRow("Feedback Date",          esc(formatDisplayDate(req.communicationDate))),
    fieldRow("Feedback Time",          esc(req.communicationTime)),
    fieldRow("Application Name",       esc(req.applicationName)),
    fieldRow("Communication Function", esc(req.communicationFunction)),
    fieldRow("Feedback Subject",       esc(req.communicationSubject)),
    fieldRow("Feedback Type",          esc(req.communicationSignalType)),
    blockField("Actual Request For Feedback", esc(stripHtml(req.actualCommunication))),
    blockField("About Selection",             esc(stripHtml(req.actualSelection))),
  ].join("");
  openBlob(wrapPage("Request Feedback Selection Report", sectionBlock("Request For Feedback — Selection", rows)));
}

/** "View Request Feedback Report" — shows the core feedback request. */
export function openRequestFeedbackReport(req: CommSignalInfo): void {
  const rows = [
    fieldRow("From Person",            esc(req.fromPerson)),
    fieldRow("To Person",              esc(req.toPerson)),
    fieldRow("Feedback Date",          esc(formatDisplayDate(req.communicationDate))),
    fieldRow("Feedback Time",          esc(req.communicationTime)),
    fieldRow("Application Name",       esc(req.applicationName)),
    fieldRow("Communication Function", esc(req.communicationFunction)),
    fieldRow("Communication Signal",   esc(req.communicationSignalType)),
    fieldRow("Feedback Subject",       esc(req.communicationSubject)),
    blockField("Actual Request For Feedback", esc(stripHtml(req.actualCommunication))),
  ].join("");
  openBlob(wrapPage("Request Feedback Report", sectionBlock("Request For Feedback", rows)));
}
