import { useState, useCallback } from "react";
import type {
  ProjectQuestion,
  ProjectError,
  ProjectCompensator,
  ProjectProblem,
  ProjectAnswer,
  AttachFileToProject,
} from "@/types/db";
import { nowDate, nowTime } from "@/db/db";
import { loadSelectionConfig } from "@/dialog/views/SelectionConfigView";

export type QuestionDraft = Omit<ProjectQuestion, "id" | "analysisId" | "questionDate" | "questionTime">;
export type AnswerDraft = Omit<ProjectAnswer, "id" | "analysisId" | "questionId">;
export type ErrorDraft = Omit<ProjectError, "id" | "analysisId">;
export type CompensatorDraft = Omit<ProjectCompensator, "id" | "analysisId">;
export type ProblemDraft = Omit<ProjectProblem, "id" | "analysisId">;
export type FileDraft = Omit<
  AttachFileToProject,
  "id" | "analysisId" | "feedbackId" | "flagId" | "articleId"
>;

export interface AnalyzePanelsState {
  questions: QuestionDraft[];
  answers: AnswerDraft[];
  errors: ErrorDraft[];
  compensators: CompensatorDraft[];
  problems: ProblemDraft[];
  files: FileDraft[];

  addQuestion: (q: QuestionDraft) => void;
  removeQuestion: (i: number) => void;
  handleRespond: (info: { informationAnswerPointTo: string; actualAnswer: string }) => void;
  removeAnswer: (i: number) => void;
  addError: (e: ErrorDraft) => void;
  removeError: (i: number) => void;
  addCompensator: (c: CompensatorDraft) => void;
  removeCompensator: (i: number) => void;
  addProblem: (p: ProblemDraft) => void;
  removeProblem: (i: number) => void;
  addFile: (f: FileDraft) => void;
  removeFile: (i: number) => void;

  showAnswersTab: boolean;
  setShowAnswersTab: (v: boolean) => void;
  showAddQuestion: boolean;
  setShowAddQuestion: (v: boolean) => void;
  addQuestionInitial: string | null;
  setAddQuestionInitial: (v: string | null) => void;
  viewQuestion: QuestionDraft | null;
  setViewQuestion: (v: QuestionDraft | null) => void;
  respondQuestion: { q: QuestionDraft; idx: number } | null;
  setRespondQuestion: (v: { q: QuestionDraft; idx: number } | null) => void;

  showAddError: boolean;
  setShowAddError: (v: boolean) => void;
  clearErrorPrefills: () => void;
  viewError: ErrorDraft | null;
  setViewError: (v: ErrorDraft | null) => void;

  showAddCompensator: boolean;
  setShowAddCompensator: (v: boolean) => void;
  clearCompensatorPrefills: () => void;
  viewCompensator: CompensatorDraft | null;
  setViewCompensator: (v: CompensatorDraft | null) => void;

  showAddProblem: boolean;
  setShowAddProblem: (v: boolean) => void;
  viewProblem: ProblemDraft | null;
  setViewProblem: (v: ProblemDraft | null) => void;
  solveProblem: { problem: ProblemDraft; idx: number } | null;
  setSolveProblem: (v: { problem: ProblemDraft; idx: number } | null) => void;

  viewAnswer: AnswerDraft | null;
  setViewAnswer: (v: AnswerDraft | null) => void;

  showAddFile: boolean;
  setShowAddFile: (v: boolean) => void;
  viewFile: FileDraft | null;
  setViewFile: (v: FileDraft | null) => void;

  prefilledError: string | undefined;
  prefilledApplication: string | undefined;
  prefilledCompensatorDescription: string | undefined;
  prefilledActualCompensatorText: string | undefined;
  prefilledErrorText: string | undefined;
  prefilledErrorDescription: string | undefined;

  selectedQuestionIdx: number | null;
  setSelectedQuestionIdx: (v: number | null) => void;
  selectedAnswerIdx: number | null;
  setSelectedAnswerIdx: (v: number | null) => void;

  handleContextMenuError: (text: string) => void;
  handleIdentifyCompensator: (errorText: string, fromActualCommunication: string) => void;
  handleContextMenuCompensator: (text: string) => void;
  openAddQuestion: (prefilledText?: string | null) => void;
}

export function useAnalyzePanels(opts: {
  applicationName?: string;
  onTabChange: (tab: string) => void;
  onCloseDd: () => void;
}): AnalyzePanelsState {
  const { applicationName, onTabChange, onCloseDd } = opts;

  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [answers, setAnswers] = useState<AnswerDraft[]>([]);
  const [errors, setErrors] = useState<ErrorDraft[]>([]);
  const [compensators, setCompensators] = useState<CompensatorDraft[]>([]);
  const [problems, setProblems] = useState<ProblemDraft[]>([]);
  const [files, setFiles] = useState<FileDraft[]>([]);

  const [showAnswersTab, setShowAnswersTab] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [addQuestionInitial, setAddQuestionInitial] = useState<string | null>(null);
  const [viewQuestion, setViewQuestion] = useState<QuestionDraft | null>(null);
  const [respondQuestion, setRespondQuestion] = useState<{ q: QuestionDraft; idx: number } | null>(null);
  const [showAddError, setShowAddError] = useState(false);
  const [viewError, setViewError] = useState<ErrorDraft | null>(null);
  const [showAddCompensator, setShowAddCompensator] = useState(false);
  const [viewCompensator, setViewCompensator] = useState<CompensatorDraft | null>(null);
  const [showAddProblem, setShowAddProblem] = useState(false);
  const [viewProblem, setViewProblem] = useState<ProblemDraft | null>(null);
  const [solveProblem, setSolveProblem] = useState<{ problem: ProblemDraft; idx: number } | null>(null);
  const [viewAnswer, setViewAnswer] = useState<AnswerDraft | null>(null);
  const [showAddFile, setShowAddFile] = useState(false);
  const [viewFile, setViewFile] = useState<FileDraft | null>(null);

  const [prefilledError, setPrefilledError] = useState<string | undefined>(undefined);
  const [prefilledApplication, setPrefilledApplication] = useState<string | undefined>(undefined);
  const [prefilledCompensatorDescription, setPrefilledCompensatorDescription] = useState<string | undefined>(undefined);
  const [prefilledActualCompensatorText, setPrefilledActualCompensatorText] = useState<string | undefined>(undefined);
  const [prefilledErrorText, setPrefilledErrorText] = useState<string | undefined>(undefined);
  const [prefilledErrorDescription, setPrefilledErrorDescription] = useState<string | undefined>(undefined);

  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState<number | null>(null);
  const [selectedAnswerIdx, setSelectedAnswerIdx] = useState<number | null>(null);

  const addQuestion = useCallback((q: QuestionDraft) => setQuestions((prev) => [...prev, q]), []);
  const removeQuestion = useCallback((i: number) => setQuestions((prev) => prev.filter((_, idx) => idx !== i)), []);

  const addAnswer = useCallback(
    (questionIdx: number, info: { informationAnswerPointTo: string; actualAnswer: string }) => {
      const q = questions[questionIdx];
      if (!q) return;
      const draft: AnswerDraft = {
        answerNumber: answers.length + 1,
        actualQuestion: q.actualQuestion,
        entityQuestionPointTo: q.entityQuestionPointTo,
        informationAnswerPointTo: info.informationAnswerPointTo,
        actualAnswer: info.actualAnswer,
        answerDate: nowDate(),
        answerTime: nowTime(),
      };
      setAnswers((prev) => [...prev, draft]);
      setQuestions((prev) =>
        prev.map((item, i) => (i === questionIdx ? { ...item, responseStatus: "Answered" } : item))
      );
    },
    [questions, answers.length]
  );

  const handleRespond = useCallback(
    (info: { informationAnswerPointTo: string; actualAnswer: string }) => {
      if (!respondQuestion) return;
      addAnswer(respondQuestion.idx, info);
      setRespondQuestion(null);
    },
    [respondQuestion, addAnswer]
  );

  const removeAnswer = useCallback((i: number) => setAnswers((prev) => prev.filter((_, idx) => idx !== i)), []);
  const addError = useCallback((e: ErrorDraft) => setErrors((prev) => [...prev, e]), []);
  const removeError = useCallback((i: number) => setErrors((prev) => prev.filter((_, idx) => idx !== i)), []);
  const addCompensator = useCallback((c: CompensatorDraft) => setCompensators((prev) => [...prev, c]), []);
  const removeCompensator = useCallback((i: number) => setCompensators((prev) => prev.filter((_, idx) => idx !== i)), []);
  const addProblem = useCallback((p: ProblemDraft) => setProblems((prev) => [...prev, p]), []);
  const removeProblem = useCallback((i: number) => setProblems((prev) => prev.filter((_, idx) => idx !== i)), []);
  const addFile = useCallback((f: FileDraft) => setFiles((prev) => [...prev, f]), []);
  const removeFile = useCallback((i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i)), []);

  const clearErrorPrefills = useCallback(() => {
    setPrefilledErrorText(undefined);
    setPrefilledErrorDescription(undefined);
  }, []);

  const clearCompensatorPrefills = useCallback(() => {
    setPrefilledError(undefined);
    setPrefilledApplication(undefined);
    setPrefilledCompensatorDescription(undefined);
    setPrefilledActualCompensatorText(undefined);
  }, []);

  const handleContextMenuError = useCallback((selectedText: string) => {
    const cfg = loadSelectionConfig();
    if (cfg.selectedErrorAsActualError) {
      setPrefilledErrorText(selectedText || undefined);
      setPrefilledErrorDescription(undefined);
    } else {
      setPrefilledErrorText(undefined);
      setPrefilledErrorDescription(selectedText || undefined);
    }
    setShowAddError(true);
  }, []);

  const handleIdentifyCompensator = useCallback(
    (errorText: string, fromActualCommunication: string) => {
      setPrefilledError(errorText);
      setPrefilledApplication(fromActualCommunication);
      setShowAddCompensator(true);
      onTabChange("compensators");
    },
    [onTabChange]
  );

  const handleContextMenuCompensator = useCallback(
    (selectedText: string) => {
      const cfg = loadSelectionConfig();
      setPrefilledError(undefined);
      setPrefilledApplication(applicationName);
      if (cfg.selectedCompensatorAsActual) {
        setPrefilledActualCompensatorText(selectedText || undefined);
        setPrefilledCompensatorDescription(undefined);
      } else {
        setPrefilledActualCompensatorText(undefined);
        setPrefilledCompensatorDescription(selectedText || undefined);
      }
      setShowAddCompensator(true);
    },
    [applicationName]
  );

  const openAddQuestion = useCallback(
    (prefilledText: string | null = null) => {
      setAddQuestionInitial(prefilledText);
      setShowAddQuestion(true);
      onTabChange("questions");
      onCloseDd();
    },
    [onTabChange, onCloseDd]
  );

  return {
    questions, answers, errors, compensators, problems, files,
    addQuestion, removeQuestion,
    handleRespond, removeAnswer,
    addError, removeError,
    addCompensator, removeCompensator,
    addProblem, removeProblem,
    addFile, removeFile,
    showAnswersTab, setShowAnswersTab,
    showAddQuestion, setShowAddQuestion,
    addQuestionInitial, setAddQuestionInitial,
    viewQuestion, setViewQuestion,
    respondQuestion, setRespondQuestion,
    showAddError, setShowAddError, clearErrorPrefills,
    viewError, setViewError,
    showAddCompensator, setShowAddCompensator, clearCompensatorPrefills,
    viewCompensator, setViewCompensator,
    showAddProblem, setShowAddProblem,
    viewProblem, setViewProblem,
    solveProblem, setSolveProblem,
    viewAnswer, setViewAnswer,
    showAddFile, setShowAddFile,
    viewFile, setViewFile,
    prefilledError, prefilledApplication,
    prefilledCompensatorDescription, prefilledActualCompensatorText,
    prefilledErrorText, prefilledErrorDescription,
    selectedQuestionIdx, setSelectedQuestionIdx,
    selectedAnswerIdx, setSelectedAnswerIdx,
    handleContextMenuError,
    handleIdentifyCompensator,
    handleContextMenuCompensator,
    openAddQuestion,
  };
}
