import type { ProjectQuestion, ProjectError, ProjectCompensator, ProjectAnswer, AttachFileToProject } from "@/types/db";
import type { CorrectedItemDraft } from "@/dialog/components/CorrectedItemDialog";

export type QuestionDraft = Omit<ProjectQuestion, "id" | "analysisId" | "questionDate" | "questionTime">;
export type AnswerDraft = Omit<ProjectAnswer, "id" | "analysisId" | "questionId">;
export type ErrorDraft = Omit<ProjectError, "id" | "analysisId">;
export type CompensatorDraft = Omit<ProjectCompensator, "id" | "analysisId">;
export type FileDraft = Omit<AttachFileToProject, "id" | "analysisId" | "feedbackId" | "flagId" | "articleId">;
export type { CorrectedItemDraft };

export type TabValue = "feedback" | "analysis" | "selection" | "paragraph" | "questions" | "errors" | "compensators" | "answers" | "files" | "corrected";

export type CtxMenu = { tab: TabValue; idx: number | null; x: number; y: number };

export type OpenDialog =
  | { type: "addQuestion"; initialQuestion?: string }
  | { type: "viewQuestion"; item: QuestionDraft }
  | { type: "respondQuestion"; item: QuestionDraft; idx: number }
  | { type: "addError" }
  | { type: "viewError"; item: ErrorDraft }
  | { type: "compensatorForError"; error: string; app: string; description?: string }
  | { type: "viewCompensator"; item: CompensatorDraft }
  | { type: "viewAnswer"; item: AnswerDraft }
  | { type: "addFile" }
  | { type: "viewFile"; item: FileDraft }
  | { type: "addCorrectedItem" }
  | { type: "editCorrectedItem"; item: CorrectedItemDraft; idx: number }
  | { type: "viewCorrectedItem"; item: CorrectedItemDraft };

export interface FeedbackForm {
  applicationName: string;
  communicationFunction: string;
  feedbackSubject: string;
  errorSubstituted: string;
  compensatorReplaced: string;
  feedbackApplication: string;
  fromPerson: string;
  toPerson: string;
}
