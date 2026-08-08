// src/dialog/utils/feedbackXml.ts
//
// Phase 1 foundation for XML feedback import/export (no UI/host wiring yet).
// feedbackToXml/feedbacksToXml serialize an assembled ProjectFeedback (+ optional
// ProjectAnalysis) into human-readable XML; parseFeedbackXml is the inverse.
//
// Problems and Files carry both an analysisId and a feedbackId FK in the DB, and
// a single feedback can legitimately have rows tagged either way even when it has
// an analysis (e.g. problems logged during Apply Feedback). So export buckets each
// problem/file by whichever FK is actually set on the record (not by which array
// the caller happened to pass it in), tags it source="analysis"|"feedback", and
// always emits the feedback-level <Problems>/<Files> containers when non-empty —
// a superset of "only when there's no analysis".

/* global DOMParser Element */

import type {
  ProjectFeedback,
  ProjectAnalysis,
  ProjectError,
  ProjectCompensator,
  ProjectQuestion,
  ProjectAnswer,
  ProjectProblem,
  ProjectCorrectedItem,
  GuidelineReference,
  AttachFileToProject,
} from "@/types/db";

// ProjectAnalysis (as read from the DB) doesn't carry correctedItems/guidelineReferences
// as array fields — those are written via saveFeedback/saveFullAnalysis and read via
// getGuidelinesByAnalysis separately. Callers assembling an analysis for export attach them here.
export type AnalysisWithChildren = ProjectAnalysis & {
  correctedItems?: ProjectCorrectedItem[];
  guidelineReferences?: GuidelineReference[];
};

type Scalars<T> = (keyof T)[];

const FEEDBACK_FIELDS: Scalars<ProjectFeedback> = [
  "feedbackApplication", "feedbackDate", "feedbackTime", "fromPerson", "toPerson",
  "feedbackSubject", "internalFeedbackName", "feedbackType", "actualSelection",
  "selectionType", "actualErrorSubstituted", "actualCompensatorReplaced",
  "source", "applicationName", "communicationFunction", "communicationSignal",
  "projectName", "personName", "personEmail",
];

const ANALYSIS_FIELDS: Scalars<ProjectAnalysis> = [
  "entityUnderAnalysis", "fromPerson", "analysisSubject", "actualAnalysis",
  "whatToDoWithAnalysis", "source", "applicationName", "communicationFunction",
  "communicationSignal", "projectName", "analysisDate", "analysisTime",
  "personName", "personEmail", "selectionType",
];

const ERROR_FIELDS: Scalars<ProjectError> = [
  "errorNumber", "actualError", "fromActualCommunication", "entityErrorPointTo",
  "errorDescription", "errorDate", "errorTime",
];

const COMPENSATOR_FIELDS: Scalars<ProjectCompensator> = [
  "compensatorNumber", "actualCompensator", "actualErrorReplaced",
  "inActualCommunication", "compensatorDescription", "compensatorDate", "compensatorTime",
];

const QUESTION_FIELDS: Scalars<ProjectQuestion> = [
  "questionNumber", "actualQuestion", "entityQuestionPointTo", "responseStatus",
  "questionDate", "questionTime",
];

const ANSWER_FIELDS: Scalars<ProjectAnswer> = [
  "answerNumber", "actualQuestion", "entityQuestionPointTo",
  "informationAnswerPointTo", "actualAnswer", "answerDate", "answerTime",
];

const PROBLEM_FIELDS: Scalars<ProjectProblem> = [
  "problemNumber", "problemName", "actualProblem", "fromActualError",
  "problemDescription", "problemDate", "problemTime",
];

const CORRECTED_ITEM_FIELDS: Scalars<ProjectCorrectedItem> = [
  "correctedItemNumber", "errorSelection", "compensatorSelection", "corrected", "correctedDescription",
];

const GUIDELINE_FIELDS: Scalars<GuidelineReference> = [
  "guidelineText", "guidelineNumber", "guidelineLink", "useLink", "guidelineDate", "guidelineTime",
];

const FILE_FIELDS: Scalars<AttachFileToProject> = [
  "fileName", "fileType", "fileSize", "fileDirectory", "fileDescription",
  "fileDate", "fileTime", "storageId", "fullFileName", "fileContent",
];

// Fields that may carry multi-line/HTML content — wrapped in CDATA on write.
const CDATA_FIELDS = new Set<string>([
  "feedbackApplication", "actualSelection", "actualErrorSubstituted", "actualCompensatorReplaced",
  "entityUnderAnalysis", "actualAnalysis",
  "actualError", "fromActualCommunication", "entityErrorPointTo", "errorDescription",
  "actualCompensator", "actualErrorReplaced", "inActualCommunication", "compensatorDescription",
  "actualQuestion", "entityQuestionPointTo", "informationAnswerPointTo", "actualAnswer",
  "actualProblem", "fromActualError", "problemDescription",
  "errorSelection", "compensatorSelection", "corrected", "correctedDescription",
  "guidelineText", "guidelineLink",
  "fileDescription", "fileContent",
]);

function escapeXmlText(value: unknown): string {
  const s = value == null ? "" : String(value);
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// A CDATA section can't contain a literal "]]>" — split it into two adjoining sections.
function cdataWrap(value: unknown): string {
  const s = value == null ? "" : String(value);
  return `<![CDATA[${s.replace(/\]\]>/g, "]]]]><![CDATA[>")}]]>`;
}

function xmlElement(tag: string, value: unknown, indent: string): string {
  if (value === undefined || value === null) return `${indent}<${tag}/>`;
  const content = CDATA_FIELDS.has(tag) ? cdataWrap(value) : escapeXmlText(value);
  return `${indent}<${tag}>${content}</${tag}>`;
}

function xmlScalars<T>(obj: T, fields: Scalars<T>, indent: string): string[] {
  return fields.map((f) => xmlElement(String(f), obj[f], indent));
}

function xmlList<T>(tag: string, items: T[], toXml: (item: T, indent: string) => string, indent: string): string[] {
  if (!items.length) return [`${indent}<${tag}/>`];
  const inner = indent + "  ";
  return [`${indent}<${tag}>`, ...items.map((it) => toXml(it, inner)), `${indent}</${tag}>`];
}

function errorToXml(e: ProjectError, indent: string): string {
  return [`${indent}<Error>`, ...xmlScalars(e, ERROR_FIELDS, indent + "  "), `${indent}</Error>`].join("\n");
}
function compensatorToXml(c: ProjectCompensator, indent: string): string {
  return [`${indent}<Compensator>`, ...xmlScalars(c, COMPENSATOR_FIELDS, indent + "  "), `${indent}</Compensator>`].join("\n");
}
function questionToXml(q: ProjectQuestion, indent: string): string {
  return [`${indent}<Question>`, ...xmlScalars(q, QUESTION_FIELDS, indent + "  "), `${indent}</Question>`].join("\n");
}
function answerToXml(a: ProjectAnswer, indent: string): string {
  return [`${indent}<Answer>`, ...xmlScalars(a, ANSWER_FIELDS, indent + "  "), `${indent}</Answer>`].join("\n");
}
function correctedItemToXml(ci: ProjectCorrectedItem, indent: string): string {
  return [`${indent}<CorrectedItem>`, ...xmlScalars(ci, CORRECTED_ITEM_FIELDS, indent + "  "), `${indent}</CorrectedItem>`].join("\n");
}
function guidelineToXml(g: GuidelineReference, indent: string): string {
  return [`${indent}<GuidelineReference>`, ...xmlScalars(g, GUIDELINE_FIELDS, indent + "  "), `${indent}</GuidelineReference>`].join("\n");
}
function problemToXml(p: ProjectProblem, source: "analysis" | "feedback", indent: string): string {
  return [`${indent}<Problem source="${source}">`, ...xmlScalars(p, PROBLEM_FIELDS, indent + "  "), `${indent}</Problem>`].join("\n");
}
function fileToXml(f: AttachFileToProject, indent: string): string {
  return [`${indent}<File>`, ...xmlScalars(f, FILE_FIELDS, indent + "  "), `${indent}</File>`].join("\n");
}

function dedupeById<T extends { id?: number }>(...lists: T[][]): T[] {
  const out: T[] = [];
  const seenIds = new Set<number>();
  for (const list of lists) {
    for (const item of list) {
      if (item.id != null) {
        if (seenIds.has(item.id)) continue;
        seenIds.add(item.id);
      }
      out.push(item);
    }
  }
  return out;
}

// Stable across export/import — DB ids are re-minted on import, so id-based dedup
// alone can't catch a file re-included in both the analysis and feedback buckets
// once ids go missing. Shared with feedback.ts's importFeedback for the same reason.
export function fileContentKey(f: {
  fileName: string;
  fileType: string;
  fileDate: string;
  fileTime: string;
  fileSize: string;
  fileContent?: string;
}): string {
  return [f.fileName, f.fileType, f.fileDate, f.fileTime, f.fileSize, f.fileContent?.length ?? 0].join("|");
}

// Same as dedupeById, but falls back to fileContentKey when id is missing so files
// re-included in both the analysis and feedback buckets don't survive dedup twice.
function dedupeFiles(...lists: AttachFileToProject[][]): AttachFileToProject[] {
  const out: AttachFileToProject[] = [];
  const seenIds = new Set<number>();
  const seenKeys = new Set<string>();
  for (const list of lists) {
    for (const item of list) {
      if (item.id != null) {
        if (seenIds.has(item.id)) continue;
        seenIds.add(item.id);
      } else {
        const key = fileContentKey(item);
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);
      }
      out.push(item);
    }
  }
  return out;
}

function splitProblems(problems: ProjectProblem[]): { analysisProblems: ProjectProblem[]; feedbackProblems: ProjectProblem[] } {
  const analysisProblems: ProjectProblem[] = [];
  const feedbackProblems: ProjectProblem[] = [];
  for (const p of problems) (p.feedbackId != null ? feedbackProblems : analysisProblems).push(p);
  return { analysisProblems, feedbackProblems };
}

function splitFiles(files: AttachFileToProject[]): { analysisFiles: AttachFileToProject[]; feedbackFiles: AttachFileToProject[] } {
  const analysisFiles: AttachFileToProject[] = [];
  const feedbackFiles: AttachFileToProject[] = [];
  for (const f of files) (f.feedbackId != null ? feedbackFiles : analysisFiles).push(f);
  return { analysisFiles, feedbackFiles };
}

function renderAnalysisElement(analysis: AnalysisWithChildren, problems: ProjectProblem[], files: AttachFileToProject[], indent: string): string[] {
  const inner = indent + "  ";
  return [
    `${indent}<Analysis>`,
    ...xmlScalars(analysis, ANALYSIS_FIELDS, inner),
    ...xmlList("Errors", analysis.errors ?? [], errorToXml, inner),
    ...xmlList("Compensators", analysis.compensators ?? [], compensatorToXml, inner),
    ...xmlList("Questions", analysis.questions ?? [], questionToXml, inner),
    ...xmlList("Answers", analysis.answers ?? [], answerToXml, inner),
    ...xmlList("Problems", problems, (p, ind) => problemToXml(p, "analysis", ind), inner),
    ...xmlList("CorrectedItems", analysis.correctedItems ?? [], correctedItemToXml, inner),
    ...xmlList("GuidelineReferences", analysis.guidelineReferences ?? [], guidelineToXml, inner),
    ...xmlList("Files", files, fileToXml, inner),
    `${indent}</Analysis>`,
  ];
}

function renderFeedbackElement(feedback: ProjectFeedback, analysis: AnalysisWithChildren | null | undefined, indent: string): string[] {
  const inner = indent + "  ";
  const lines = [`${indent}<Feedback>`, ...xmlScalars(feedback, FEEDBACK_FIELDS, inner)];

  const problemPool = dedupeById(analysis?.problems ?? [], feedback.problems ?? []);
  const filePool = dedupeFiles(analysis?.files ?? [], feedback.files ?? []);
  const { analysisProblems, feedbackProblems } = splitProblems(problemPool);
  const { analysisFiles, feedbackFiles } = splitFiles(filePool);

  if (analysis) lines.push(...renderAnalysisElement(analysis, analysisProblems, analysisFiles, inner));
  if (feedbackProblems.length) lines.push(...xmlList("Problems", feedbackProblems, (p, ind) => problemToXml(p, "feedback", ind), inner));
  if (feedbackFiles.length) lines.push(...xmlList("Files", feedbackFiles, fileToXml, inner));

  lines.push(`${indent}</Feedback>`);
  return lines;
}

/** Serializes one feedback (+ optional analysis) as a standalone `<Feedback>` fragment (no XML declaration). */
export function feedbackToXml(feedback: ProjectFeedback, analysis?: AnalysisWithChildren | null): string {
  return renderFeedbackElement(feedback, analysis, "").join("\n");
}

/** Serializes many feedbacks into one document: declaration + `<SpeakLogicFeedback version="1">` root. */
export function feedbacksToXml(items: { feedback: ProjectFeedback; analysis?: AnalysisWithChildren | null }[]): string {
  const body = items.map((it) => renderFeedbackElement(it.feedback, it.analysis, "  ").join("\n")).join("\n");
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<SpeakLogicFeedback version="1">',
    body,
    "</SpeakLogicFeedback>",
  ].join("\n");
}

// ── Parsing ──────────────────────────────────────────────────────────────────

export type ImportedFeedbackScalars = Omit<
  ProjectFeedback,
  "id" | "analysisId" | "questions" | "errors" | "compensators" | "answers" | "files" | "problems"
>;
export type ImportedAnalysisScalars = Omit<
  ProjectAnalysis,
  | "id" | "errorCount" | "questionCount" | "compensatorCount" | "answerCount"
  | "problemCount" | "correctedItemCount" | "questions" | "errors" | "compensators"
  | "answers" | "problems" | "files"
>;
export type ImportedErrorScalars = Omit<ProjectError, "id" | "analysisId">;
export type ImportedCompensatorScalars = Omit<ProjectCompensator, "id" | "analysisId">;
export type ImportedQuestionScalars = Omit<ProjectQuestion, "id" | "analysisId">;
export type ImportedAnswerScalars = Omit<ProjectAnswer, "id" | "analysisId" | "questionId">;
export type ImportedCorrectedItemScalars = Omit<ProjectCorrectedItem, "id" | "analysisId">;
export type ImportedGuidelineScalars = Omit<GuidelineReference, "id" | "analysisId">;
export type ImportedProblemScalars = Omit<ProjectProblem, "id" | "analysisId" | "feedbackId"> & {
  source: "analysis" | "feedback";
};
export type ImportedFileScalars = Omit<
  AttachFileToProject,
  | "id" | "analysisId" | "feedbackId" | "flagId" | "articleId"
  | "principleInterpretationId" | "selectionWithPrincipleId" | "principleInSelectionId"
>;

export interface ImportedFeedback {
  feedback: ImportedFeedbackScalars;
  analysis?: ImportedAnalysisScalars & {
    errors: ImportedErrorScalars[];
    compensators: ImportedCompensatorScalars[];
    questions: ImportedQuestionScalars[];
    answers: ImportedAnswerScalars[];
    correctedItems: ImportedCorrectedItemScalars[];
    guidelineReferences: ImportedGuidelineScalars[];
    problems: ImportedProblemScalars[];
    files: ImportedFileScalars[];
  };
  // Feedback-level extras (source="feedback") — present when there's no analysis, or
  // when there is one but some problems/files were tagged with feedbackId anyway.
  problems?: ImportedProblemScalars[];
  files?: ImportedFileScalars[];
}

function childElements(parent: Element, tag: string): Element[] {
  const out: Element[] = [];
  for (let i = 0; i < parent.children.length; i++) {
    if (parent.children[i].tagName === tag) out.push(parent.children[i]);
  }
  return out;
}
function firstChild(parent: Element, tag: string): Element | null {
  return childElements(parent, tag)[0] ?? null;
}
function textOf(parent: Element, tag: string): string {
  const el = firstChild(parent, tag);
  return el ? el.textContent ?? "" : "";
}
function numOf(parent: Element, tag: string): number {
  const n = Number(textOf(parent, tag));
  return Number.isFinite(n) ? n : 0;
}

function parseError(el: Element): ImportedErrorScalars {
  return {
    errorNumber: numOf(el, "errorNumber"),
    actualError: textOf(el, "actualError"),
    fromActualCommunication: textOf(el, "fromActualCommunication"),
    entityErrorPointTo: textOf(el, "entityErrorPointTo"),
    errorDescription: textOf(el, "errorDescription"),
    errorDate: textOf(el, "errorDate"),
    errorTime: textOf(el, "errorTime"),
  };
}
function parseCompensator(el: Element): ImportedCompensatorScalars {
  return {
    compensatorNumber: numOf(el, "compensatorNumber"),
    actualCompensator: textOf(el, "actualCompensator"),
    actualErrorReplaced: textOf(el, "actualErrorReplaced"),
    inActualCommunication: textOf(el, "inActualCommunication"),
    compensatorDescription: textOf(el, "compensatorDescription"),
    compensatorDate: textOf(el, "compensatorDate"),
    compensatorTime: textOf(el, "compensatorTime"),
  };
}
function parseQuestion(el: Element): ImportedQuestionScalars {
  return {
    questionNumber: numOf(el, "questionNumber"),
    actualQuestion: textOf(el, "actualQuestion"),
    entityQuestionPointTo: textOf(el, "entityQuestionPointTo"),
    responseStatus: textOf(el, "responseStatus"),
    questionDate: textOf(el, "questionDate"),
    questionTime: textOf(el, "questionTime"),
  };
}
function parseAnswer(el: Element): ImportedAnswerScalars {
  return {
    answerNumber: numOf(el, "answerNumber"),
    actualQuestion: textOf(el, "actualQuestion"),
    entityQuestionPointTo: textOf(el, "entityQuestionPointTo"),
    informationAnswerPointTo: textOf(el, "informationAnswerPointTo"),
    actualAnswer: textOf(el, "actualAnswer"),
    answerDate: textOf(el, "answerDate"),
    answerTime: textOf(el, "answerTime"),
  };
}
function parseCorrectedItem(el: Element): ImportedCorrectedItemScalars {
  return {
    correctedItemNumber: numOf(el, "correctedItemNumber"),
    errorSelection: textOf(el, "errorSelection"),
    compensatorSelection: textOf(el, "compensatorSelection"),
    corrected: textOf(el, "corrected"),
    correctedDescription: textOf(el, "correctedDescription"),
  };
}
function parseGuideline(el: Element): ImportedGuidelineScalars {
  return {
    guidelineText: textOf(el, "guidelineText"),
    guidelineNumber: numOf(el, "guidelineNumber"),
    guidelineLink: textOf(el, "guidelineLink"),
    useLink: (numOf(el, "useLink") ? 1 : 0) as 0 | 1,
    guidelineDate: textOf(el, "guidelineDate"),
    guidelineTime: textOf(el, "guidelineTime"),
  };
}
function parseProblem(el: Element): ImportedProblemScalars {
  return {
    problemNumber: numOf(el, "problemNumber"),
    problemName: textOf(el, "problemName"),
    actualProblem: textOf(el, "actualProblem"),
    fromActualError: textOf(el, "fromActualError"),
    problemDescription: textOf(el, "problemDescription"),
    problemDate: textOf(el, "problemDate"),
    problemTime: textOf(el, "problemTime"),
    source: el.getAttribute("source") === "feedback" ? "feedback" : "analysis",
  };
}
function parseFile(el: Element): ImportedFileScalars {
  return {
    fileName: textOf(el, "fileName"),
    fileType: textOf(el, "fileType"),
    fileSize: textOf(el, "fileSize"),
    fileDirectory: textOf(el, "fileDirectory"),
    fileDescription: textOf(el, "fileDescription"),
    fileDate: textOf(el, "fileDate"),
    fileTime: textOf(el, "fileTime"),
    storageId: textOf(el, "storageId"),
    fullFileName: textOf(el, "fullFileName"),
    fileContent: textOf(el, "fileContent"),
  };
}

function parseFeedbackScalars(el: Element): ImportedFeedbackScalars {
  return {
    feedbackApplication: textOf(el, "feedbackApplication"),
    feedbackDate: textOf(el, "feedbackDate"),
    feedbackTime: textOf(el, "feedbackTime"),
    fromPerson: textOf(el, "fromPerson"),
    toPerson: textOf(el, "toPerson"),
    feedbackSubject: textOf(el, "feedbackSubject"),
    internalFeedbackName: textOf(el, "internalFeedbackName"),
    feedbackType: textOf(el, "feedbackType"),
    actualSelection: textOf(el, "actualSelection"),
    selectionType: textOf(el, "selectionType"),
    actualErrorSubstituted: textOf(el, "actualErrorSubstituted"),
    actualCompensatorReplaced: textOf(el, "actualCompensatorReplaced"),
    source: textOf(el, "source") as ProjectFeedback["source"],
    applicationName: textOf(el, "applicationName"),
    communicationFunction: textOf(el, "communicationFunction"),
    communicationSignal: textOf(el, "communicationSignal"),
    projectName: textOf(el, "projectName"),
    personName: textOf(el, "personName"),
    personEmail: textOf(el, "personEmail"),
  };
}
function parseAnalysisScalars(el: Element): ImportedAnalysisScalars {
  return {
    entityUnderAnalysis: textOf(el, "entityUnderAnalysis"),
    fromPerson: textOf(el, "fromPerson"),
    analysisSubject: textOf(el, "analysisSubject"),
    actualAnalysis: textOf(el, "actualAnalysis"),
    whatToDoWithAnalysis: textOf(el, "whatToDoWithAnalysis") as ProjectAnalysis["whatToDoWithAnalysis"],
    source: textOf(el, "source") as ProjectAnalysis["source"],
    applicationName: textOf(el, "applicationName"),
    communicationFunction: textOf(el, "communicationFunction"),
    communicationSignal: textOf(el, "communicationSignal"),
    projectName: textOf(el, "projectName"),
    analysisDate: textOf(el, "analysisDate"),
    analysisTime: textOf(el, "analysisTime"),
    personName: textOf(el, "personName"),
    personEmail: textOf(el, "personEmail"),
    selectionType: textOf(el, "selectionType") as ProjectAnalysis["selectionType"],
  };
}

function parseFeedbackElement(el: Element): ImportedFeedback {
  const result: ImportedFeedback = { feedback: parseFeedbackScalars(el) };

  const analysisEl = firstChild(el, "Analysis");
  if (analysisEl) {
    const errorsEl = firstChild(analysisEl, "Errors");
    const compensatorsEl = firstChild(analysisEl, "Compensators");
    const questionsEl = firstChild(analysisEl, "Questions");
    const answersEl = firstChild(analysisEl, "Answers");
    const correctedItemsEl = firstChild(analysisEl, "CorrectedItems");
    const guidelinesEl = firstChild(analysisEl, "GuidelineReferences");
    const problemsEl = firstChild(analysisEl, "Problems");
    const filesEl = firstChild(analysisEl, "Files");

    result.analysis = {
      ...parseAnalysisScalars(analysisEl),
      errors: errorsEl ? childElements(errorsEl, "Error").map(parseError) : [],
      compensators: compensatorsEl ? childElements(compensatorsEl, "Compensator").map(parseCompensator) : [],
      questions: questionsEl ? childElements(questionsEl, "Question").map(parseQuestion) : [],
      answers: answersEl ? childElements(answersEl, "Answer").map(parseAnswer) : [],
      correctedItems: correctedItemsEl ? childElements(correctedItemsEl, "CorrectedItem").map(parseCorrectedItem) : [],
      guidelineReferences: guidelinesEl ? childElements(guidelinesEl, "GuidelineReference").map(parseGuideline) : [],
      problems: problemsEl ? childElements(problemsEl, "Problem").map(parseProblem) : [],
      files: filesEl ? childElements(filesEl, "File").map(parseFile) : [],
    };
  }

  const fbProblemsEl = firstChild(el, "Problems");
  const feedbackProblems = fbProblemsEl ? childElements(fbProblemsEl, "Problem").map(parseProblem) : [];
  if (feedbackProblems.length) result.problems = feedbackProblems;

  const fbFilesEl = firstChild(el, "Files");
  const feedbackFiles = fbFilesEl ? childElements(fbFilesEl, "File").map(parseFile) : [];
  if (feedbackFiles.length) result.files = feedbackFiles;

  return result;
}

/** Parses XML produced by feedbackToXml/feedbacksToXml back into ImportedFeedback records. */
export function parseFeedbackXml(xml: string): ImportedFeedback[] {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const parserError = doc.getElementsByTagName("parsererror")[0];
  if (parserError) throw new Error(`Invalid feedback XML: ${parserError.textContent ?? "parse error"}`);

  const root = doc.documentElement;
  if (!root) throw new Error("Invalid feedback XML: no root element");

  if (root.tagName === "SpeakLogicFeedback") return childElements(root, "Feedback").map(parseFeedbackElement);
  if (root.tagName === "Feedback") return [parseFeedbackElement(root)];
  throw new Error(`Invalid feedback XML: unexpected root element <${root.tagName}>`);
}
