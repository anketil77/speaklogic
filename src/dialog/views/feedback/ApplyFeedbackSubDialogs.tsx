import React from "react";
import ReactDOM from "react-dom";
import { AnalysisQuestionDialog } from "@/dialog/components/AnalysisQuestionDialog";
import { ViewQuestionDialog } from "@/dialog/components/ViewQuestionDialog";
import { RespondQuestionDialog } from "@/dialog/components/RespondQuestionDialog";
import type { AnswerInfo } from "@/dialog/components/RespondQuestionDialog";
import { ErrorIdentificationDialog } from "@/dialog/components/ErrorIdentificationDialog";
import { ViewErrorDialog } from "@/dialog/components/ViewErrorDialog";
import { CompensatorIdentificationDialog } from "@/dialog/components/CompensatorIdentificationDialog";
import { ViewCompensatorDialog } from "@/dialog/components/ViewCompensatorDialog";
import { ViewAnswerDialog } from "@/dialog/components/ViewAnswerDialog";
import { AttachFileDialog } from "@/dialog/components/AttachFileDialog";
import { ViewFileInformationDialog } from "@/dialog/components/ViewFileInformationDialog";
import { CorrectedItemDialog } from "@/dialog/components/CorrectedItemDialog";
import { ProblemIdentificationDialog } from "@/dialog/components/ProblemIdentificationDialog";
import { ViewProblemDialog } from "@/dialog/components/ViewProblemDialog";
import { SolveProblemDialog } from "@/dialog/components/SolveProblemDialog";
import { AnalysisListPortal } from "@/dialog/components/AnalysisListPortal";
import { FeedbackListPortal } from "@/dialog/components/FeedbackListPortal";
import { ViewAnalysisDialog } from "@/dialog/components/ViewAnalysisDialog";
import { ViewFeedbackDialog } from "@/dialog/components/ViewFeedbackDialog";
import { PanelContextMenu } from "@/dialog/components/PanelContextMenu";
import type { PanelMenuEntry } from "@/dialog/components/PanelContextMenu";
import { nowDate, nowTime } from "@/db/db";
import { colors } from "@/styles/tokens";
import type { SaveFeedbackPayload, ProjectAnalysis, ProjectFeedback, DialogAction } from "@/types/db";
import type { QuestionDraft, AnswerDraft, ErrorDraft, CompensatorDraft, ProblemDraft, FileDraft, CorrectedItemDraft, OpenDialog, CtxMenu, TabValue } from "./applyFeedbackTypes";

// ── Remove confirmation overlay ───────────────────────────────────────────────
export function RemoveOverlay({ message, onYes, onNo }: { message: string; onYes: () => void; onNo: () => void }) {
  return ReactDOM.createPortal(
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: colors.white, borderRadius: 6, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", width: 360, padding: "24px 24px 18px" }}>
        <div style={{ fontSize: 12.5, color: colors.grey11, lineHeight: "19px", marginBottom: 18 }}>{message}</div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onNo} className="sl-fr-btn" style={{ height: 32, padding: "0 18px", borderRadius: 4, border: "1px solid #C7C7C7", background: colors.white, fontSize: 12.3, cursor: "pointer", fontFamily: "inherit" }}>No</button>
          <button onClick={onYes} style={{ height: 32, padding: "0 18px", borderRadius: 4, border: "none", background: colors.azure42, color: colors.white, fontSize: 12.3, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Yes</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
export interface ApplyFeedbackSubDialogsProps {
  openDialog: OpenDialog | null;
  closePortal: () => void;
  questions: QuestionDraft[];
  setQuestions: React.Dispatch<React.SetStateAction<QuestionDraft[]>>;
  setAnswers: React.Dispatch<React.SetStateAction<AnswerDraft[]>>;
  setErrors: React.Dispatch<React.SetStateAction<ErrorDraft[]>>;
  setCompensators: React.Dispatch<React.SetStateAction<CompensatorDraft[]>>;
  setFiles: React.Dispatch<React.SetStateAction<FileDraft[]>>;
  setCorrectedItems: React.Dispatch<React.SetStateAction<CorrectedItemDraft[]>>;
  errorOptions: string[];
  compensatorOptions: string[];
  errors: ErrorDraft[];
  correctedItems: CorrectedItemDraft[];
  problems: ProblemDraft[];
  setProblems: React.Dispatch<React.SetStateAction<ProblemDraft[]>>;
  feedbackSubject: string;
  solvePreselectedErrors: string[];
  solvePreselectedCompensators: string[];
  pendingRemove: { tab: TabValue; idx: number; message: string } | null;
  setPendingRemove: React.Dispatch<React.SetStateAction<{ tab: TabValue; idx: number; message: string } | null>>;
  confirmRemove: () => void;
  showConfirm: boolean;
  setShowConfirm: React.Dispatch<React.SetStateAction<boolean>>;
  setPendingPayload: React.Dispatch<React.SetStateAction<SaveFeedbackPayload | null>>;
  saving: boolean;
  confirmSave: () => void;
  ctxMenu: CtxMenu | null;
  setCtxMenu: React.Dispatch<React.SetStateAction<CtxMenu | null>>;
  ctxItems: PanelMenuEntry[];
  showAnalysisList: boolean;
  setShowAnalysisList: React.Dispatch<React.SetStateAction<boolean>>;
  showFeedbackList: boolean;
  setShowFeedbackList: React.Dispatch<React.SetStateAction<boolean>>;
  viewAnalysis: ProjectAnalysis | null;
  setViewAnalysis: React.Dispatch<React.SetStateAction<ProjectAnalysis | null>>;
  viewFeedback: ProjectFeedback | null;
  setViewFeedback: React.Dispatch<React.SetStateAction<ProjectFeedback | null>>;
  availableAnalyses: ProjectAnalysis[];
  availableFeedbacks: ProjectFeedback[];
  sendMessage: (msg: DialogAction) => void;
}

const cancelBtnStyle: React.CSSProperties = { height: "32px", padding: "0 18px", borderRadius: "4px", fontSize: "12px", fontFamily: "inherit", cursor: "pointer", background: colors.white, border: "1px solid #C7C7C7", color: colors.grey11, fontWeight: "400" };
const applyBtnStyle: React.CSSProperties = { height: "32px", padding: "0 18px", borderRadius: "4px", fontSize: "12px", fontFamily: "inherit", cursor: "pointer", background: colors.azure42, border: "none", color: colors.white, fontWeight: "700" };

// ── Component ─────────────────────────────────────────────────────────────────
export function ApplyFeedbackSubDialogs(p: ApplyFeedbackSubDialogsProps) {
  const { openDialog, closePortal, questions, setQuestions, setAnswers, setErrors, setCompensators, setFiles, setCorrectedItems, errorOptions, compensatorOptions, errors, correctedItems, problems, setProblems, feedbackSubject, solvePreselectedErrors, solvePreselectedCompensators, pendingRemove, setPendingRemove, confirmRemove, showConfirm, setShowConfirm, setPendingPayload, saving, confirmSave, ctxMenu, setCtxMenu, ctxItems, showAnalysisList, setShowAnalysisList, showFeedbackList, setShowFeedbackList, viewAnalysis, setViewAnalysis, viewFeedback, setViewFeedback, availableAnalyses, availableFeedbacks, sendMessage } = p;

  return (
    <>
      {/* ── Context menu ───────────────────────────────────────────────────── */}
      {ctxMenu && <PanelContextMenu x={ctxMenu.x} y={ctxMenu.y} items={ctxItems} onClose={() => setCtxMenu(null)} />}

      {/* ── Apply confirmation overlay ──────────────────────────────────────── */}
      {showConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: colors.white, borderRadius: "6px", boxShadow: "0 8px 32px rgba(0,0,0,0.18)", width: "360px", padding: "28px 24px 20px" }}>
            <div style={{ fontSize: "14px", fontWeight: "700", color: colors.grey11, marginBottom: "10px" }}>Apply Feedback</div>
            <div style={{ fontSize: "12.5px", color: colors.grey11, lineHeight: "19px", marginBottom: "20px" }}>
              Does the application of the feedback correct the error?
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button style={cancelBtnStyle} onClick={() => { setShowConfirm(false); setPendingPayload(null); }}>No — Continue Editing</button>
              <button disabled={saving} style={{ ...applyBtnStyle, ...(saving ? { background: "#C5C5C5", cursor: "default" } : {}) }} onClick={confirmSave}>
                {saving ? "Saving…" : "Yes — Save Feedback"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Remove confirmation ─────────────────────────────────────────────── */}
      {pendingRemove && <RemoveOverlay message={pendingRemove.message} onYes={confirmRemove} onNo={() => setPendingRemove(null)} />}

      {/* ── Portal dialogs ──────────────────────────────────────────────────── */}
      {openDialog?.type === "addQuestion" && (
        <AnalysisQuestionDialog itemCount={questions.length}
          onAdd={(q) => { setQuestions((prev) => [...prev, q]); closePortal(); }}
          onClose={closePortal} initialQuestion={openDialog.initialQuestion} />
      )}
      {openDialog?.type === "viewQuestion" && (
        <ViewQuestionDialog question={openDialog.item} onClose={closePortal} />
      )}
      {openDialog?.type === "respondQuestion" && (
        <RespondQuestionDialog question={openDialog.item}
          onRespond={(info: AnswerInfo) => {
            const q = openDialog.item;
            setAnswers((prev) => [...prev, { answerNumber: prev.length + 1, actualQuestion: q.actualQuestion, entityQuestionPointTo: q.entityQuestionPointTo, informationAnswerPointTo: info.informationAnswerPointTo, actualAnswer: info.actualAnswer, answerDate: nowDate(), answerTime: nowTime() }]);
            setQuestions((prev) => prev.map((x, i) => i === openDialog.idx ? { ...x, responseStatus: "Answered" } : x));
            closePortal();
          }}
          onClose={closePortal} />
      )}
      {openDialog?.type === "addError" && (
        <ErrorIdentificationDialog itemCount={errors.length}
          onAdd={(e) => { setErrors((prev) => [...prev, e]); closePortal(); }} onClose={closePortal} />
      )}
      {openDialog?.type === "viewError" && (
        <ViewErrorDialog error={openDialog.item} onClose={closePortal} />
      )}
      {openDialog?.type === "compensatorForError" && (
        <CompensatorIdentificationDialog itemCount={p.correctedItems.length}
          existingErrors={errorOptions}
          existingApplications={errors.map((e) => e.fromActualCommunication).filter(Boolean)}
          prefilledError={openDialog.error} prefilledApplication={openDialog.app} prefilledDescription={openDialog.description}
          onAdd={(c) => { setCompensators((prev) => [...prev, c]); closePortal(); }} onClose={closePortal} />
      )}
      {openDialog?.type === "viewCompensator" && (
        <ViewCompensatorDialog compensator={openDialog.item} onClose={closePortal} />
      )}
      {openDialog?.type === "viewAnswer" && (
        <ViewAnswerDialog answer={openDialog.item} onClose={closePortal} />
      )}
      {openDialog?.type === "addFile" && (
        <AttachFileDialog onAdd={(f) => { setFiles((prev) => [...prev, f]); closePortal(); }} onClose={closePortal} />
      )}
      {openDialog?.type === "viewFile" && (
        <ViewFileInformationDialog file={openDialog.item} onClose={closePortal} />
      )}
      {openDialog?.type === "addCorrectedItem" && (
        <CorrectedItemDialog itemCount={correctedItems.length} existingErrors={errorOptions} existingCompensators={compensatorOptions}
          onAdd={(ci) => { setCorrectedItems((prev) => [...prev, ci]); closePortal(); }} onClose={closePortal} />
      )}
      {openDialog?.type === "editCorrectedItem" && (
        <CorrectedItemDialog itemCount={correctedItems.length} existingErrors={errorOptions} existingCompensators={compensatorOptions}
          initialItem={openDialog.item}
          onAdd={(ci) => { setCorrectedItems((prev) => prev.map((x, i) => i === openDialog.idx ? ci : x)); closePortal(); }}
          onClose={closePortal} />
      )}
      {openDialog?.type === "viewCorrectedItem" && (
        <CorrectedItemDialog itemCount={correctedItems.length} existingErrors={errorOptions} existingCompensators={compensatorOptions}
          initialItem={openDialog.item} readOnly onAdd={closePortal} onClose={closePortal} />
      )}

      {/* ── Problem identify / view / solve ──────────────────────────────────── */}
      {openDialog?.type === "addProblem" && (
        <ProblemIdentificationDialog itemCount={problems.length} existingErrors={errorOptions}
          onAdd={(pr) => { setProblems((prev) => [...prev, pr]); closePortal(); }} onClose={closePortal} />
      )}
      {openDialog?.type === "viewProblem" && (
        <ViewProblemDialog problem={openDialog.item} onClose={closePortal} />
      )}
      {openDialog?.type === "solveProblem" && (
        <SolveProblemDialog
          problem={openDialog.item}
          existingErrors={errorOptions}
          existingCompensators={compensatorOptions}
          prefilledFeedback={feedbackSubject}
          preselectedErrors={solvePreselectedErrors}
          preselectedCompensators={solvePreselectedCompensators}
          onSolve={(solution) => {
            sendMessage({ action: "SAVE_PROBLEM_SOLUTION", payload: { ...solution, actualProblem: openDialog.item.actualProblem, problemIdx: openDialog.idx } });
            if (solution.removeProblem) setProblems((prev) => prev.filter((_, i) => i !== openDialog.idx));
            closePortal();
          }}
          onClose={closePortal}
        />
      )}

      {/* ── List portals ────────────────────────────────────────────────────── */}
      {showAnalysisList && (
        <AnalysisListPortal analyses={availableAnalyses} sendMessage={sendMessage}
          feedbacks={availableFeedbacks}
          onClose={() => setShowAnalysisList(false)}
          onViewAnalysis={(a) => { setViewAnalysis(a); setShowAnalysisList(false); }} />
      )}
      {showFeedbackList && (
        <FeedbackListPortal feedbacks={availableFeedbacks} sendMessage={sendMessage}
          onClose={() => setShowFeedbackList(false)}
          onViewFeedback={(f) => { setViewFeedback(f); setShowFeedbackList(false); }} />
      )}
      {viewAnalysis && <ViewAnalysisDialog analysis={viewAnalysis} onClose={() => setViewAnalysis(null)} />}
      {viewFeedback && <ViewFeedbackDialog feedback={viewFeedback} onClose={() => setViewFeedback(null)} />}
    </>
  );
}
