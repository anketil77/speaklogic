import React from "react";
import { AnalysisQuestionDialog } from "@/dialog/components/AnalysisQuestionDialog";
import { ViewQuestionDialog } from "@/dialog/components/ViewQuestionDialog";
import { RespondQuestionDialog } from "@/dialog/components/RespondQuestionDialog";
import { ErrorIdentificationDialog } from "@/dialog/components/ErrorIdentificationDialog";
import { ViewErrorDialog } from "@/dialog/components/ViewErrorDialog";
import { ProblemIdentificationDialog } from "@/dialog/components/ProblemIdentificationDialog";
import { ViewProblemDialog } from "@/dialog/components/ViewProblemDialog";
import { SolveProblemDialog } from "@/dialog/components/SolveProblemDialog";
import { ViewAnswerDialog } from "@/dialog/components/ViewAnswerDialog";
import { CompensatorIdentificationDialog } from "@/dialog/components/CompensatorIdentificationDialog";
import { ViewCompensatorDialog } from "@/dialog/components/ViewCompensatorDialog";
import { AttachFileDialog } from "@/dialog/components/AttachFileDialog";
import { ViewFileInformationDialog } from "@/dialog/components/ViewFileInformationDialog";
import type { AnalyzePanelsState } from "@/dialog/views/analyze/useAnalyzePanels";

interface AnalyzeSubDialogsProps {
  panels: AnalyzePanelsState;
  applicationName?: string;
  sendMessage: (msg: { action: string; payload?: unknown }) => void;
  onAddError?: (text: string) => void;
  onAddCompensator?: (text: string) => void;
  onAddQuestion?: () => void;
}

export function AnalyzeSubDialogs({ panels, applicationName, sendMessage, onAddError, onAddCompensator, onAddQuestion }: AnalyzeSubDialogsProps) {
  const {
    showAddQuestion, setShowAddQuestion, addQuestionInitial, setAddQuestionInitial,
    questions, addQuestion, viewQuestion, setViewQuestion,
    respondQuestion, setRespondQuestion, handleRespond,
    showAddError, setShowAddError, clearErrorPrefills,
    errors, addError, viewError, setViewError,
    prefilledErrorText, prefilledErrorDescription,
    showAddProblem, setShowAddProblem, problems, addProblem, removeProblem,
    viewProblem, setViewProblem, solveProblem, setSolveProblem,
    viewAnswer, setViewAnswer,
    showAddCompensator, setShowAddCompensator, clearCompensatorPrefills,
    compensators, addCompensator, viewCompensator, setViewCompensator,
    prefilledError, prefilledApplication,
    prefilledCompensatorDescription, prefilledActualCompensatorText,
    showAddFile, setShowAddFile, addFile, viewFile, setViewFile,
  } = panels;

  return (
    <>
      {showAddQuestion && (
        <AnalysisQuestionDialog
          itemCount={questions.length}
          onAdd={(q) => { addQuestion(q); onAddQuestion?.(); }}
          onClose={() => { setShowAddQuestion(false); setAddQuestionInitial(null); }}
          initialQuestion={addQuestionInitial ?? undefined}
        />
      )}
      {viewQuestion && (
        <ViewQuestionDialog question={viewQuestion} onClose={() => setViewQuestion(null)} />
      )}
      {respondQuestion && (
        <RespondQuestionDialog
          question={respondQuestion.q}
          onRespond={handleRespond}
          onClose={() => setRespondQuestion(null)}
        />
      )}

      {showAddError && (
        <ErrorIdentificationDialog
          itemCount={errors.length}
          onAdd={(e) => { addError(e); onAddError?.(e.actualError); }}
          onClose={() => { setShowAddError(false); clearErrorPrefills(); }}
          prefilledActualError={prefilledErrorText}
          prefilledDescription={prefilledErrorDescription}
          prefilledFromApplication={applicationName}
        />
      )}
      {viewError && (
        <ViewErrorDialog error={viewError} onClose={() => setViewError(null)} />
      )}

      {showAddProblem && (
        <ProblemIdentificationDialog
          itemCount={problems.length}
          existingErrors={errors.map((e) => e.actualError)}
          onAdd={addProblem}
          onClose={() => setShowAddProblem(false)}
        />
      )}
      {viewProblem && (
        <ViewProblemDialog problem={viewProblem} onClose={() => setViewProblem(null)} />
      )}
      {solveProblem && (
        <SolveProblemDialog
          problem={solveProblem.problem}
          existingErrors={errors.map((e) => e.actualError)}
          existingCompensators={compensators.map((c) => c.actualCompensator)}
          onSolve={(solution) => {
            sendMessage({ action: "SAVE_PROBLEM_SOLUTION", payload: { ...solution, problemIdx: solveProblem.idx } });
            if (solution.removeProblem) removeProblem(solveProblem.idx);
          }}
          onClose={() => setSolveProblem(null)}
        />
      )}
      {viewAnswer && (
        <ViewAnswerDialog answer={viewAnswer} onClose={() => setViewAnswer(null)} />
      )}

      {showAddCompensator && (
        <CompensatorIdentificationDialog
          itemCount={compensators.length}
          existingErrors={errors.map((e) => e.actualError)}
          existingApplications={errors.map((e) => e.fromActualCommunication)}
          onAdd={(c) => { addCompensator(c); onAddCompensator?.(c.actualCompensator); }}
          onClose={() => { setShowAddCompensator(false); clearCompensatorPrefills(); }}
          prefilledError={prefilledError}
          prefilledApplication={prefilledApplication}
          prefilledDescription={prefilledCompensatorDescription}
          prefilledActualCompensator={prefilledActualCompensatorText}
        />
      )}
      {viewCompensator && (
        <ViewCompensatorDialog compensator={viewCompensator} onClose={() => setViewCompensator(null)} />
      )}

      {showAddFile && (
        <AttachFileDialog onAdd={addFile} onClose={() => setShowAddFile(false)} />
      )}
      {viewFile && (
        <ViewFileInformationDialog file={viewFile} onClose={() => setViewFile(null)} />
      )}
    </>
  );
}
