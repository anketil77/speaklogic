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
  articleId?: number;
}

export interface FlaggedArticle {
  id?: number;
  articleId: number;
  articleTitle: string;
  category?: string;
  flagDate: string;
  flagTime: string;
  personName: string;
  personEmail: string;
  source: "Word Document" | "Outlook Mail" | "PowerPoint Document";
  applicationName: string;
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
  errors?: ProjectError[];
  compensators?: ProjectCompensator[];
  answers?: ProjectAnswer[];
  files?: AttachFileToProject[];
  problems?: ProjectProblem[];
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
  feedbackId?: number;
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

// A guideline reference inserted into an analysis's Actual Analysis content
// (GuidelineReferenceDialog). Stored as a record so it can be counted (Point 14).
export interface GuidelineReference {
  id?: number;
  guidelineText: string;   // e.g. "refer to analysis guideline number 5"
  guidelineNumber: number; // 1–501
  guidelineLink: string;
  useLink: 0 | 1;
  guidelineDate?: string;
  guidelineTime?: string;
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
  isPublished?: 0 | 1;
  publishedTo?: string;
}

export interface Publisher {
  id: number;
  name: string;
  logoBase64: string;
}

export interface SaveArticlePayload {
  id?: number;
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
  providerPhone: string;
  providerEmail: string;
  reviewerName: string;
  reviewerPhone: string;
  reviewerEmail: string;
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

// ---- Keyword guard (banned-words per person + global) ----

export type KeywordSendMode = "warn" | "stop";

export interface KeywordRule {
  id?: number;
  personName: string;
  personEmail: string;
  keyword: string;
  isGlobal: boolean;
}

export interface KeywordSetting {
  id?: number;
  sendMode: KeywordSendMode;
}

export interface SaveKeywordRulesPayload {
  rules: Array<Omit<KeywordRule, "id">>;
  sendMode: KeywordSendMode;
}

/** One logged flagged-send event (Keywords / Bad Words History). */
export interface KeywordHistory {
  id?: number;
  sentDate: string;   // ISO YYYY-MM-DD (display via formatDisplayDate)
  sentTime: string;   // HH:MM:SS
  recipients: string; // comma-joined recipient list (display only)
  words: string;      // comma-joined flagged words
  action: KeywordSendMode; // "warn" | "stop"
  subject: string;
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
  /** Problems extracted from a received feedback email (Point 11 — Apply Email). */
  problems?: Array<Omit<ProjectProblem, "id" | "analysisId" | "feedbackId">>;
}

export interface ContactPerson {
  id: number;
  personName: string;
  emailAddress: string;
}

export interface DialogInitPayload {
  selection: string;
  selectionHtml?: string;
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
  principlesInSelection?: PrincipleInSelection[];
  filesByPrincipleInSelectionId?: Record<number, AttachFileToProject[]>;
  selectionsWithPrinciple?: SelectionWithPrinciple[];
  filesBySelectionWithPrincipleId?: Record<number, AttachFileToProject[]>;
  articles?: Article[];
  flaggedArticles?: FlaggedArticle[];
  publishers?: Publisher[];
  commSignalRequests?: CommSignalInfo[];
  selectionHistories?: FlaggedEntityHistory[];
  /** Passed when opening the article wizard after template selection. */
  templateName?: string;
  wizardCategory?: string;
  /** Passed when editing an existing article from the list view. */
  editArticleData?: Article;
  contacts?: ContactPerson[];
  /** User-defined "Select Information" items (Article Wizard Step Info). */
  userInfoItems?: UserInformationItem[];
  /** Keyword guard rules + send mode (KeywordSettingsView). */
  keywordRules?: KeywordRule[];
  keywordSendMode?: KeywordSendMode;
  /** Logged flagged-send events (KeywordHistoryView). */
  keywordHistory?: KeywordHistory[];
  /** Error texts from the CURRENT document, for the inline Compensator dialog
   *  dropdown (Point 9). Default shown; the "Only Error From Current Document"
   *  checkbox toggles to inlineErrorsAll. */
  inlineErrors?: string[];
  /** Error texts across ALL documents, shown when the current-document filter is
   *  unchecked in the inline Compensator dialog. */
  inlineErrorsAll?: string[];
  /**
   * Overrides the feedbackType the Apply dialog stores on save (default "Applied").
   * Set to "Received" by the Apply Email flow (Point 11) so applied-from-email
   * feedback appears under the "Received" filter / List of Feedback Received.
   */
  feedbackTypeOverride?: string;
  /** Aggregate counts for the Stats Overview dialog (Point 14). */
  stats?: StatsOverview;
  /** Initial feedback-type filter when feedback-history is opened pre-filtered. */
  feedbackFilter?: string;
}

// User-defined "information" item shown in the wizard's "Select Information"
// panel (User Identified tab). The Speak Logic tab is constant/built-in.
export interface UserInformationItem {
  id: number;
  name: string;
  html: string;       // rich content (text, inline SVG, or LaTeX math)
  createdDate?: string;
}

export interface SaveFeedbackPayload {
  feedback: Omit<ProjectFeedback, "id">;
  toPersonEmail?: string;
  files?: Omit<AttachFileToProject, "id" | "analysisId" | "feedbackId" | "flagId" | "articleId">[];
  newCorrectedItems?: Omit<ProjectCorrectedItem, "id" | "analysisId">[];
  problems?: Omit<ProjectProblem, "id" | "analysisId" | "feedbackId">[];
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
  /** true when From Person was typed by the user (Comm Config had no name) — host persists it back to Comm Config */
  persistName?: boolean;
}

export type DialogAction =
  | { action: "READY" }
  | { action: "CLOSE" }
  | { action: "SAVE_ANALYSIS"; payload: SaveAnalysisPayload }
  | { action: "ADD_ERROR"; payload: Omit<ProjectError, "id" | "analysisId"> }
  | { action: "SAVE_ERROR_DRAFT"; payload: Omit<ProjectError, "id" | "analysisId"> }
  | { action: "ADD_COMPENSATOR"; payload: Omit<ProjectCompensator, "id" | "analysisId"> }
  | { action: "SAVE_COMPENSATOR_DRAFT"; payload: Omit<ProjectCompensator, "id" | "analysisId"> }
  | { action: "SAVE_FEEDBACK"; payload: SaveFeedbackPayload }
  | { action: "SAVE_REQUEST_FEEDBACK"; payload: SaveRequestFeedbackPayload }
  | { action: "SAVE_REQUEST_SL_FEEDBACK"; payload: SaveRequestSLFeedbackPayload }
  | { action: "SAVE_COMMUNICATION_CONFIG"; payload: SaveCommunicationConfigPayload }
  | { action: "SAVE_KEYWORD_RULES"; payload: SaveKeywordRulesPayload }
  | { action: "DELETE_KEYWORD_HISTORY"; id: number }
  | { action: "CLEAR_KEYWORD_HISTORY" }
  | { action: "SAVE_FLAG"; payload: FlagEntityForAnalysis }
  | { action: "SAVE_USER_INFO_ITEM"; name: string; html: string }
  | { action: "DELETE_USER_INFO_ITEM"; id: number }
  | { action: "QUERY_ANALYSES" }
  | { action: "QUERY_FLAGS" }
  | { action: "QUERY_FEEDBACK" }
  | { action: "DELETE_FEEDBACK"; id: number }
  | { action: "DELETE_FLAG"; id: number }
  | { action: "DELETE_ANALYSIS"; id: number }
  | { action: "NAVIGATE_TO_APPLY"; analysisId: number }
  | { action: "NAVIGATE_TO_PROVIDE"; analysisId: number }
  | { action: "DELETE_INTERPRETED_PRINCIPLE"; id: number }
  | { action: "DELETE_PRINCIPLE"; id: number }
  | { action: "DELETE_RELATED_SELECTION"; id: number }
  | { action: "SAVE_INTERPRETATION"; payload: SaveInterpretationPayload }
  | {
      action: "REPORT_INTERPRETED_PRINCIPLE";
      interpretation: import("./db").PrincipleInterpretation;
    }
  | {
      action: "REPORT_IDENTIFIED_PRINCIPLE";
      principle: import("./db").PrincipleInSelection;
    }
  | {
      action: "REPORT_RELATED_SELECTION";
      relation: import("./db").SelectionWithPrinciple;
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
  | { action: "EDIT_ARTICLE"; id: number }
  | { action: "FLAG_ARTICLE"; id: number }
  | { action: "ANALYZE_ARTICLE"; id: number }
  | { action: "REQUEST_FEEDBACK_ARTICLE"; id: number }
  | { action: "DELETE_FLAGGED_ARTICLE"; id: number }
  | { action: "PUBLISH_ARTICLE"; id: number; publishers: string[] }
  | { action: "ADD_PUBLISHER"; name: string; logoBase64: string }
  | { action: "DELETE_PUBLISHER"; id: number }
  | { action: "DELETE_COMM_SIGNAL_REQUEST"; id: number }
  | { action: "DELETE_SELECTION_HISTORY"; id: number }
  | { action: "ANALYZE_FROM_HISTORY"; flag: FlagEntityForAnalysis }
  | { action: "APPLY_FROM_HISTORY"; flag: FlagEntityForAnalysis }
  | { action: "PROVIDE_FROM_HISTORY"; flag: FlagEntityForAnalysis }
  | { action: "INSERT_TEXT_AT_CURSOR"; text: string; html?: string }
  | { action: "LIST_FEEDBACK_REQUESTED" }
  | { action: "LIST_FEEDBACK_APPLIED" }
  | { action: "LIST_FEEDBACK_PROVIDED" }
  | { action: "BACK_TO_FEEDBACK_HISTORY" }
  | { action: "OPEN_MAILTO"; url: string }
  | { action: "ADD_CONTACT"; personName: string; emailAddress: string }
  | { action: "UPDATE_CONTACT"; id: number; personName: string; emailAddress: string }
  | { action: "DELETE_CONTACT"; id: number }
  | { action: "OPEN_STATS_LIST"; target: StatsListTarget; feedbackFilter?: string };

/** Aggregate entity counts shown in the Stats Overview dialog (Point 14). */
export interface StatsOverview {
  analyses: number;
  feedbackProvided: number;
  feedbackRequested: number;
  feedbackReceived: number;
  feedbackApplied: number;
  errors: number;
  compensators: number;
  problemsIdentified: number;
  problemsSolved: number;
  questions: number;
  answeredQuestions: number;
  guidelines: number;
}

/** Which list a Stats Overview card click should open (Point 14). */
export type StatsListTarget =
  | "analysis"        // List of Analysis
  | "feedback"        // List of Feedback (optionally pre-filtered via feedbackFilter)
  | "requested"       // List of Feedback Requested
  | "errors"          // Flat list of identified errors (StatsItemListView)
  | "compensators"    // Flat list of identified compensators (StatsItemListView)
  | "questions"       // Flat list of analysis questions (StatsItemListView)
  | "answers"         // Flat list of answered questions (StatsItemListView)
  | "problems";       // Flat list of identified problems (StatsItemListView)

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

export interface SaveInterpretationPayload {
  record: Omit<PrincipleInterpretation, "id">;
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
  /** Guideline references inserted into the analysis (Point 14 stats). Optional —
   *  inline/on-the-fly analyses (Point 9) don't carry any. */
  guidelineReferences?: Omit<GuidelineReference, "id" | "analysisId">[];
}

export type HostMessage =
  | { type: "INIT"; payload: DialogInitPayload }
  | { type: "QUERY_RESULT"; data: unknown[] }
  | { type: "SAVE_SUCCESS"; id: number }
  | { type: "ERROR"; message: string }
  | { type: "NAVIGATE"; view: string; payload: DialogInitPayload }
  | { type: "SAVED"; mailtoUrl: string }
  | { type: "RETAIN_SAVED" }
  | { type: "FILE_ADDED"; id: number }
  | { type: "COMPOSE_OPENING" };
