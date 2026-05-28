// src/types/db.ts

export interface FlagEntityForAnalysis {
  id?: number;
  actualSelection: string;
  selectionType: "Selection" | "Paragraph";
  source: "Word Document" | "Outlook Mail" | "PowerPoint Document";
  applicationName: string;
  communicationFunction: string;
  communicationSignal: string;
  projectName: string;
  flagDate: string;
  flagTime: string;
  personName: string;
  personEmail: string;
  wasEntityAnalyzed?: string;
}

export interface FlaggedEntityHistory {
  id?: number;
  entityName: string;
  flaggedDate: string;
  flaggedTime: string;
  selectionAction: string;
  selectionType: "Selection" | "Paragraph";
  source: "Word Document" | "Outlook Mail" | "PowerPoint Document";
  applicationName: string;
  communicationFunction: string;
  communicationSignal: string;
  projectName: string;
  personName: string;
  personEmail: string;
  actualSelection: string;
  flagEntityForAnalysisId?: number;
}

export interface ProjectAnalysis {
  id?: number;
  entityUnderAnalysis: string;
  fromPerson?: string;
  analysisSubject?: string;
  actualAnalysis: string;
  whatToDoWithAnalysis:
    | "ApplyAnalysisAsFeedback"
    | "ProvideFeedbackWithAnalysis"
    | "RetainAnalysisAsNeed";
  source: "Word Document" | "Outlook Mail" | "PowerPoint Document";
  applicationName: string;
  communicationFunction: string;
  communicationSignal: string;
  projectName: string;
  analysisDate: string;
  analysisTime: string;
  personName: string;
  personEmail: string;
  selectionType: "Selection" | "Paragraph";
  errorCount: number;
  questionCount: number;
  compensatorCount: number;
  answerCount: number;
  problemCount: number;
  correctedItemCount: number;
  questions?: ProjectQuestion[];
  errors?: ProjectError[];
  compensators?: ProjectCompensator[];
  answers?: ProjectAnswer[];
  problems?: ProjectProblem[];
  files?: AttachFileToProject[];
}

export interface ProjectFeedback {
  id?: number;
  feedbackApplication: string;
  feedbackDate: string;
  feedbackTime: string;
  fromPerson: string;
  toPerson: string;
  feedbackSubject: string;
  internalFeedbackName: string;
  feedbackType: string;
  actualSelection: string;
  selectionType: string;
  actualErrorSubstituted: string;
  actualCompensatorReplaced: string;
  source: "Word Document" | "Outlook Mail" | "PowerPoint Document";
  applicationName: string;
  communicationFunction: string;
  communicationSignal: string;
  projectName: string;
  personName: string;
  personEmail: string;
  analysisId?: number;
  questions?: ProjectQuestion[];
  compensators?: ProjectCompensator[];
  answers?: ProjectAnswer[];
  files?: AttachFileToProject[];
}

export interface ProjectError {
  id?: number;
  errorNumber: number;
  actualError: string;
  fromActualCommunication: string;
  entityErrorPointTo: string;
  errorDescription: string;
  errorDate: string;
  errorTime: string;
  analysisId?: number;
}

export interface ProjectCompensator {
  id?: number;
  compensatorNumber: number;
  actualCompensator: string;
  actualErrorReplaced: string;
  inActualCommunication: string;
  compensatorDescription: string;
  compensatorDate: string;
  compensatorTime: string;
  analysisId?: number;
}

export interface ProjectQuestion {
  id?: number;
  questionNumber: number;
  actualQuestion: string;
  entityQuestionPointTo: string;
  responseStatus: string;
  questionDate: string;
  questionTime: string;
  analysisId?: number;
}

export interface ProjectAnswer {
  id?: number;
  answerNumber: number;
  actualQuestion: string;
  entityQuestionPointTo: string;
  informationAnswerPointTo: string;
  actualAnswer: string;
  answerDate: string;
  answerTime: string;
  questionId?: number;
  analysisId?: number;
}

export interface ProjectProblem {
  id?: number;
  problemNumber: number;
  problemName: string;
  actualProblem: string;
  fromActualError: string;
  problemDescription: string;
  problemDate: string;
  problemTime: string;
  analysisId?: number;
}

export interface ProjectProblemSolution {
  id?: number;
  solutionNumber: number;
  actualProblem: string;
  feedbackApplied: string;
  errorCorrected: string;
  compensatorReplaced: string;
  additionalExplanation: string;
  solutionDate: string;
  solutionTime: string;
  problemId?: number;
}

export interface ProjectCorrectedItem {
  id?: number;
  correctedItemNumber: number;
  errorSelection: string;
  compensatorSelection: string;
  corrected: string;
  correctedDescription: string;
  analysisId?: number;
}

export interface Article {
  id?: number;
  articleTitle: string;
  articleContent: string;
  articleDate: string;
  articleTime: string;
  personName: string;
  personEmail: string;
  source: "Word Document" | "Outlook Mail" | "PowerPoint Document";
  articleNumber?: number;
  isProviderUseGivenSetOfInfo?: 0 | 1;
  category?: string;
  articleBasisReference?: string;
  isDraft?: 0 | 1;
  // Wizard-specific fields
  providerName?: string;
  personLocation?: string;
  isGivenSet?: 0 | 1;
  peopleLocation?: string;
  consideration?: string;
  eventName?: string;
  eventLocation?: string;
  eventDate?: string;
  eventTime?: string;
  infoBeforeEvent?: string;
  motherNatureConsiderations?: string;
  negativeFunction?: string;
  problemDetails?: string;
  relationshipDetails?: string;
  templateName?: string;
  wizardCategory?: string;
  funcExecuteFromEvent?: string;
  preEventObservation?: string;
  postEventObservation?: string;
  isProviderUseGivenSetOfInfo1?: 0 | 1;
  productName?: string;
  modelNumber?: string;
  productType?: string;
  productFunction?: string;
  problemSolved?: string;
  functionExecutedDuringReview?: string;
  isSolvedProblem?: 0 | 1;
  additionalInformation?: string;
  productURL?: string;
  reviewerName?: string;
}

export interface SaveArticlePayload {
  articleTitle: string;
  articleContent: string;
  category: string;
  articleBasisReference: string;
  isProviderUseGivenSetOfInfo: 0 | 1;
  isDraft: 0 | 1;
}

/** Payload sent by ArticleWizardView when the user finishes the wizard. */
export interface SaveArticleWizardPayload {
  articleTitle: string;
  category: string;
  providerName: string;
  personName: string;
  personLocation: string;
  isGivenSet: 0 | 1;
  peopleLocation: string;
  consideration: string;
  eventName: string;
  eventLocation: string;
  eventDate: string;
  eventTime: string;
  infoBeforeEvent: string;
  articleBasisReference: string;
  motherNatureConsiderations: string;
  negativeFunction: string;
  problemDetails: string;
  relationshipDetails: string;
  templateName: string;
  wizardCategory: string;
  // New fields for non-NS2 templates
  funcExecuteFromEvent: string;
  preEventObservation: string;
  postEventObservation: string;
  // Product Review fields
  isProviderUseGivenSetOfInfo1: 0 | 1;
  productName: string;
  modelNumber: string;
  productType: string;
  productFunction: string;
  problemSolved: string;
  functionExecutedDuringReview: string;
  isSolvedProblem: 0 | 1;
  additionalInformation: string;
  productURL: string;
  reviewerName: string;
}

export interface SaveProblemSolutionPayload {
  actualProblem:        string;
  feedbackApplied:      string;
  errorCorrected:       string;
  compensatorReplaced:  string;
  additionalExplanation: string;
  files: Omit<AttachFileToProject, "id" | "analysisId" | "feedbackId" | "flagId" | "articleId" | "principleInterpretationId" | "selectionWithPrincipleId" | "principleInSelectionId">[];
  removeProblem:        boolean;
  problemIdx:           number;
}

export interface AttachFileToProject {
  id?: number;
  fileName: string;
  fileType: string;
  fileSize: string;
  fileDirectory: string;
  fileDescription: string;
  fileDate: string;
  fileTime: string;
  storageId: string;
  fullFileName: string;
  analysisId?: number;
  feedbackId?: number;
  flagId?: number;
  articleId?: number;
  principleInterpretationId?: number;
  selectionWithPrincipleId?: number;
  principleInSelectionId?: number;
}

export interface CommSignalInfo {
  id?: number;
  nodeNumber?: number;
  fromPerson: string;
  toPerson: string;
  personAddress: string;
  communicationDate: string;
  communicationTime: string;
  communicationSignalType: string;
  communicationSubject: string;
  applicationName: string;
  commSignalInfoIdentification: string;
  communicationFunction: string;
  isCommunicationFeedbackRequested: 0 | 1;
  actualSelection: string;
  isCommunicationForReview: 0 | 1;
  selectionType: string;
  entitySelected: string;
  actualCommunication: string;
}

export interface CommHolderInfo {
  id?: number;
  personName: string;
  commHolderIdentification: string;
  functionRelated: string;
  functionDescription: string;
  commHolderId: string;
}

export interface PrincipleOfOperation {
  id?: number;
  actualPrinciple: string;
  principleName: string;
  principleAspect: string;
  principleIdentification: string;
  principleDescription: string;
  principleId: string;
}

export interface PrincipleAspect {
  id?: number;
  actualAspect: string;
  aspectName: string;
  aspectNumber?: number;
  aspectDescription: string;
  aspectId: string;
  principleId?: number;
}

export interface PrincipleInSelection {
  id?: number;
  actualSelection: string;
  actualPrinciple: string;
  principleName: string;
  setDerivedFrom: string;
  principleDescription: string;
  communicationPrinciple: string;
  commPrincipleDescription: string;
  selectionType: string;
  analysisId?: number;
}

export interface PrincipleInterpretation {
  id?: number;
  actualPrinciple: string;
  principleName: string;
  setDerivedFrom: string;
  personInterpreted: string;
  interpretationResult: string;
  communicationPrinciple: string;
  commPrincipleDescription: string;
  analysisId?: number;
}

export interface SelectionWithPrinciple {
  id?: number;
  actualSelection: string;
  actualPrinciple: string;
  principleName: string;
  setDerivedFrom: string;
  principleDescription: string;
  communicationPrinciple: string;
  commPrincipleDescription: string;
  actualRelationship: string;
  relationshipDescription: string;
  selectionType: string;
  analysisId?: number;
}

export interface PrincipleInsideReference {
  id?: number;
  actualPrinciple: string;
  principleName: string;
  principleDescription: string;
  actualAspect: string;
  aspectName: string;
  aspectDescription: string;
  principleId: string;
}

export interface ProjectInformation {
  id?: number;
  projectName: string;
  companyName: string;
  applicationName: string;
  communicationFunction: string;
  managerName: string;
  projectIdentification: string;
  projectStatus: string;
  partOfApplication: string;
  partOfFunction: string;
  partOfResult: string;
  groupOfFunction: string;
  groupOfApplication: string;
  groupOfResult: string;
  projectDescription: string;
}

export interface PeopleInProject {
  id?: number;
  personName: string;
  personFunction: string;
  personIdentification: string;
  systemEquivalent: string;
  functionEquivalent: string;
  personTitle: string;
  personFunctionIdentification: string;
  dateAddedToProject: string;
  personLocation: string;
  siteName: string;
  personExpertise: string;
  emailAddress: string;
  phoneNumber: string;
  personId: string;
  countryName: string;
  cityAndState: string;
  personAddress: string;
  personFunctionDescription: string;
  percentCompleted: number;
  completedDate: string;
  projectId?: number;
}

export interface GroupInfo {
  id?: number;
  groupName: string;
  groupFunction: string;
  groupInfoIdentification: string;
  groupFunctionIdentification: string;
  dateDefined: string;
  dateStarted: string;
  groupDescription: string;
  groupFunctionDescription: string;
  groupPercentCompleted: number;
  completedDate: string;
  groupId: string;
  projectId?: number;
}

export interface EntityUsageInProject {
  id?: number;
  actualEntity: string;
  entityName: string;
  entityFunction: string;
  entityNumber?: number;
  entityUsageIdentification: string;
  entityActualFunction: string;
  entityFunctionRelated: string;
  entityFunctionDescription: string;
  entityDescription: string;
  howEntityUsageInProject: string;
  projectId?: number;
}

export interface WhatWeDoProject {
  id?: number;
  whatWeDoName: string;
  whatWeDoIdentification: string;
  whatWeActuallyDo: string;
  whatWeDoCommunication: string;
  whatWeDoDescription: string;
  projectId?: number;
}

export interface ResultApplication {
  id?: number;
  actualApplicationResult: string;
  applicationResultName: string;
  applicationResultIdentification: string;
  applicationResultDescription: string;
  projectId?: number;
}

export interface ProblemStatement {
  id?: number;
  actualProblem: string;
  problemName: string;
  actualAction: string;
  actionName: string;
  actualReason: string;
  problemStatementIdentification: string;
  actionTakenSolvedProblem: 0 | 1;
  reasonName: string;
  problemDescription: string;
  problemAction: string;
  problemReason: string;
  projectId?: number;
}

export interface ProjectSchedule {
  id?: number;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  additionalScheduleInformation: string;
  projectId?: number;
}

export interface ProjectStatusInfo {
  id?: number;
  personName: string;
  personFunction: string;
  groupName: string;
  groupFunction: string;
  personPercentCompleted: number;
  groupFunctionStatus: string;
  personFunctionCompletedDate: string;
  groupFunctionCompletedDate: string;
  projectId?: number;
}

export interface LinkedDocument {
  id?: number;
  documentName: string;
  documentType: string;
  documentTitle: string;
  documentLink: string;
  analysisId?: number;
}

export interface NoteAtNode {
  id?: number;
  nodeNumber?: number;
  noteDate: string;
  noteTime: string;
  actualNote: string;
  analysisId?: number;
}

export interface TaskListItem {
  id?: number;
  taskName: string;
  taskDate: string;
  taskPriority: string;
  taskCompleted: 0 | 1;
  taskNote: string;
  projectId?: number;
}

export interface ErrorMessage {
  id?: number;
  errorType: "Delete" | "Copy" | "Rotate" | "Flip" | "Compose" | "Decompose" | "Edit" | "Other";
  errorMessage: string;
  errorDate: string;
  errorTime: string;
}

// ---- Message passing types between dialog and commands.ts ----

export interface CommunicationData {
  id?: number;
  personName: string;
  personEmail: string;
  outgoingServer: string;
  incomingServer: string;
  userName: string;
  personPassword: string;
  serverSecurity: string;
  incomingPort: number;
  outgoingPort: number;
  useAuthentication: boolean;
}

export interface SaveCommunicationConfigPayload {
  personName: string;
  personEmail: string;
}

export type SelectionMode = "selection" | "paragraph";
export type HostSource = "Word Document" | "Outlook Mail" | "PowerPoint Document";

export interface AnalysisDataForApply {
  id: number;
  entityUnderAnalysis: string;
  analysisSubject: string;
  actualAnalysis: string;
  fromPerson: string;
  errors: Array<Omit<ProjectError, "id" | "analysisId">>;
  compensators: Array<Omit<ProjectCompensator, "id" | "analysisId">>;
  questions: Array<Omit<ProjectQuestion, "id" | "analysisId">>;
  answers: Array<Omit<ProjectAnswer, "id" | "analysisId" | "questionId">>;
  files: Array<Omit<AttachFileToProject, "id" | "analysisId">>;
  correctedItems: Array<Omit<ProjectCorrectedItem, "id" | "analysisId">>;
}

export interface DialogInitPayload {
  selection: string;
  mode: SelectionMode;
  source: HostSource;
  personName: string;
  personEmail: string;
  applicationName: string;
  communicationFunction: string;
  communicationSignal: string;
  projectName: string;
  peopleList: string[];
  peopleEmailMap?: Record<string, string>;
  communicationPersonName?: string;
  communicationPersonEmail?: string;
  analysisData?: AnalysisDataForApply;
  analyses?: ProjectAnalysis[];
  feedbacks?: ProjectFeedback[];
  flaggedEntities?: FlagEntityForAnalysis[];
  principleInterpretations?: PrincipleInterpretation[];
  filesByInterpretationId?: Record<number, AttachFileToProject[]>;
  articles?: Article[];
  commSignalRequests?: CommSignalInfo[];
  /** Passed when opening the article wizard after template selection. */
  templateName?: string;
  wizardCategory?: string;
}

export interface SaveFeedbackPayload {
  feedback: Omit<ProjectFeedback, "id">;
  toPersonEmail?: string;
  files?: Omit<AttachFileToProject, "id" | "analysisId" | "feedbackId" | "flagId" | "articleId">[];
  newCorrectedItems?: Omit<ProjectCorrectedItem, "id" | "analysisId">[];
}

export interface SaveRequestFeedbackPayload {
  fromPerson: string;
  toPerson: string;
  toPersonEmail: string;
  applicationName: string;
  communicationFunction: string;
  communicationSignalType: string;
  communicationSubject: string;
  actualCommunication: string;
  actualSelection: string;
  selectionType: string;
  files?: Omit<AttachFileToProject, "id" | "analysisId" | "feedbackId" | "flagId" | "articleId">[];
}

export interface SaveRequestSLFeedbackPayload {
  fromPerson: string;
  applicationName: string;
  communicationFunction: string;
  communicationSignalType: string;
  communicationSubject: string;
  actualCommunication: string;
  files?: Omit<AttachFileToProject, "id" | "analysisId" | "feedbackId" | "flagId" | "articleId">[];
}

export type DialogAction =
  | { action: "READY" }
  | { action: "CLOSE" }
  | { action: "SAVE_ANALYSIS"; payload: SaveAnalysisPayload }
  | { action: "SAVE_FEEDBACK"; payload: SaveFeedbackPayload }
  | { action: "SAVE_REQUEST_FEEDBACK"; payload: SaveRequestFeedbackPayload }
  | { action: "SAVE_REQUEST_SL_FEEDBACK"; payload: SaveRequestSLFeedbackPayload }
  | { action: "SAVE_COMMUNICATION_CONFIG"; payload: SaveCommunicationConfigPayload }
  | { action: "SAVE_FLAG"; payload: FlagEntityForAnalysis }
  | { action: "QUERY_ANALYSES" }
  | { action: "QUERY_FLAGS" }
  | { action: "QUERY_FEEDBACK" }
  | { action: "DELETE_FEEDBACK"; id: number }
  | { action: "DELETE_FLAG"; id: number }
  | { action: "DELETE_ANALYSIS"; id: number }
  | { action: "NAVIGATE_TO_APPLY"; analysisId: number }
  | { action: "NAVIGATE_TO_PROVIDE"; analysisId: number }
  | { action: "DELETE_INTERPRETED_PRINCIPLE"; id: number }
  | {
      action: "REPORT_INTERPRETED_PRINCIPLE";
      interpretation: import("./db").PrincipleInterpretation;
    }
  | { action: "ADD_ATTACHED_FILE"; file: Omit<AttachFileToProject, "id"> }
  | { action: "REMOVE_ATTACHED_FILE"; id: number }
  | { action: "SAVE_RELATED_SELECTION"; payload: SaveRelatedSelectionPayload }
  | { action: "SAVE_PRINCIPLE_IN_SELECTION"; payload: SavePrincipleInSelectionPayload }
  | { action: "SAVE_ARTICLE"; payload: SaveArticlePayload }
  | { action: "SAVE_ARTICLE_WIZARD"; payload: SaveArticleWizardPayload }
  | { action: "SAVE_PROBLEM_SOLUTION"; payload: SaveProblemSolutionPayload }
  | { action: "BLANK_SELECTED" }
  | { action: "TEMPLATE_SELECTED" }
  | { action: "TEMPLATE_CONFIRMED"; templateName: string; category: string }
  | { action: "BACK" }
  | { action: "BACK_TO_PICKER" }
  | { action: "DELETE_ARTICLE"; id: number }
  | { action: "DELETE_COMM_SIGNAL_REQUEST"; id: number }
  | { action: "LIST_FEEDBACK_REQUESTED" }
  | { action: "LIST_FEEDBACK_APPLIED" }
  | { action: "LIST_FEEDBACK_PROVIDED" }
  | { action: "BACK_TO_FEEDBACK_HISTORY" };

export interface SaveRelatedSelectionPayload {
  record: Omit<SelectionWithPrinciple, "id">;
  files: Omit<
    AttachFileToProject,
    | "id"
    | "analysisId"
    | "feedbackId"
    | "flagId"
    | "articleId"
    | "principleInterpretationId"
    | "selectionWithPrincipleId"
    | "principleInSelectionId"
  >[];
}

export interface SavePrincipleInSelectionPayload {
  record: Omit<PrincipleInSelection, "id">;
  files: Omit<
    AttachFileToProject,
    | "id"
    | "analysisId"
    | "feedbackId"
    | "flagId"
    | "articleId"
    | "principleInterpretationId"
    | "selectionWithPrincipleId"
    | "principleInSelectionId"
  >[];
}

export interface SaveAnalysisPayload {
  analysis: Omit<ProjectAnalysis, "id">;
  errors: Omit<ProjectError, "id" | "analysisId">[];
  questions: Omit<ProjectQuestion, "id" | "analysisId">[];
  answers: Omit<ProjectAnswer, "id" | "analysisId" | "questionId">[];
  compensators: Omit<ProjectCompensator, "id" | "analysisId">[];
  problems: Omit<ProjectProblem, "id" | "analysisId">[];
  files: Omit<AttachFileToProject, "id" | "analysisId">[];
}

export type HostMessage =
  | { type: "INIT"; payload: DialogInitPayload }
  | { type: "QUERY_RESULT"; data: unknown[] }
  | { type: "SAVE_SUCCESS"; id: number }
  | { type: "ERROR"; message: string }
  | { type: "NAVIGATE"; view: string; payload: DialogInitPayload }
  | { type: "SAVED"; mailtoUrl: string }
  | { type: "RETAIN_SAVED" }
  | { type: "FILE_ADDED"; id: number };
