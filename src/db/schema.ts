// src/db/schema.ts

export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS FlagEntityForAnalysis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actualSelection TEXT,
  selectionType TEXT,
  source TEXT,
  applicationName TEXT,
  communicationFunction TEXT,
  communicationSignal TEXT,
  projectName TEXT,
  flagDate TEXT,
  flagTime TEXT,
  personName TEXT,
  personEmail TEXT,
  wasEntityAnalyzed TEXT
);

CREATE TABLE IF NOT EXISTS FlaggedEntityHistory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entityName TEXT,
  flaggedDate TEXT,
  flaggedTime TEXT,
  selectionAction TEXT,
  selectionType TEXT,
  source TEXT,
  applicationName TEXT,
  communicationFunction TEXT,
  communicationSignal TEXT,
  projectName TEXT,
  personName TEXT,
  personEmail TEXT,
  actualSelection TEXT,
  flagEntityForAnalysisId INTEGER REFERENCES FlagEntityForAnalysis(id)
);

CREATE TABLE IF NOT EXISTS ProjectAnalysis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entityUnderAnalysis TEXT,
  fromPerson TEXT,
  analysisSubject TEXT,
  actualAnalysis TEXT,
  whatToDoWithAnalysis TEXT,
  source TEXT,
  applicationName TEXT,
  communicationFunction TEXT,
  communicationSignal TEXT,
  projectName TEXT,
  analysisDate TEXT,
  analysisTime TEXT,
  personName TEXT,
  personEmail TEXT,
  selectionType TEXT,
  errorCount INTEGER DEFAULT 0,
  questionCount INTEGER DEFAULT 0,
  compensatorCount INTEGER DEFAULT 0,
  answerCount INTEGER DEFAULT 0,
  problemCount INTEGER DEFAULT 0,
  correctedItemCount INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ProjectFeedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feedbackApplication TEXT,
  feedbackDate TEXT,
  feedbackTime TEXT,
  fromPerson TEXT,
  toPerson TEXT,
  feedbackSubject TEXT,
  internalFeedbackName TEXT,
  feedbackType TEXT,
  actualSelection TEXT,
  selectionType TEXT,
  actualErrorSubstituted TEXT,
  actualCompensatorReplaced TEXT,
  source TEXT,
  applicationName TEXT,
  communicationFunction TEXT,
  communicationSignal TEXT,
  projectName TEXT,
  personName TEXT,
  personEmail TEXT,
  analysisId INTEGER REFERENCES ProjectAnalysis(id)
);

CREATE TABLE IF NOT EXISTS ProjectError (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  errorNumber INTEGER DEFAULT 0,
  actualError TEXT,
  fromActualCommunication TEXT,
  entityErrorPointTo TEXT,
  errorDescription TEXT,
  errorDate TEXT,
  errorTime TEXT,
  analysisId INTEGER REFERENCES ProjectAnalysis(id)
);

CREATE TABLE IF NOT EXISTS ProjectCompensator (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  compensatorNumber INTEGER DEFAULT 0,
  actualCompensator TEXT,
  actualErrorReplaced TEXT,
  inActualCommunication TEXT,
  compensatorDescription TEXT,
  compensatorDate TEXT,
  compensatorTime TEXT,
  analysisId INTEGER REFERENCES ProjectAnalysis(id)
);

CREATE TABLE IF NOT EXISTS ProjectQuestion (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  questionNumber INTEGER DEFAULT 0,
  actualQuestion TEXT,
  entityQuestionPointTo TEXT,
  responseStatus TEXT,
  questionDate TEXT,
  questionTime TEXT,
  analysisId INTEGER REFERENCES ProjectAnalysis(id)
);

CREATE TABLE IF NOT EXISTS ProjectAnswer (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  answerNumber INTEGER DEFAULT 0,
  actualQuestion TEXT,
  entityQuestionPointTo TEXT,
  informationAnswerPointTo TEXT,
  actualAnswer TEXT,
  answerDate TEXT,
  answerTime TEXT,
  questionId INTEGER REFERENCES ProjectQuestion(id),
  analysisId INTEGER REFERENCES ProjectAnalysis(id)
);

CREATE TABLE IF NOT EXISTS ProjectProblem (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  problemNumber INTEGER DEFAULT 0,
  problemName TEXT,
  actualProblem TEXT,
  fromActualError TEXT,
  problemDescription TEXT,
  problemDate TEXT,
  problemTime TEXT,
  analysisId INTEGER REFERENCES ProjectAnalysis(id)
);

CREATE TABLE IF NOT EXISTS ProjectProblemSolution (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  solutionNumber INTEGER DEFAULT 0,
  actualProblem TEXT,
  feedbackApplied TEXT,
  errorCorrected TEXT,
  compensatorReplaced TEXT,
  additionalExplanation TEXT,
  solutionDate TEXT,
  solutionTime TEXT,
  problemId INTEGER REFERENCES ProjectProblem(id)
);

CREATE TABLE IF NOT EXISTS ProjectCorrectedItem (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  correctedItemNumber INTEGER DEFAULT 0,
  errorSelection TEXT,
  compensatorSelection TEXT,
  corrected TEXT,
  correctedDescription TEXT,
  analysisId INTEGER REFERENCES ProjectAnalysis(id)
);

CREATE TABLE IF NOT EXISTS Article (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  articleTitle TEXT,
  articleContent TEXT,
  articleDate TEXT,
  articleTime TEXT,
  personName TEXT,
  personEmail TEXT,
  source TEXT
);

CREATE TABLE IF NOT EXISTS AttachFileToProject (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fileName TEXT,
  fileType TEXT,
  fileSize TEXT,
  fileDirectory TEXT,
  fileDescription TEXT,
  fileDate TEXT,
  fileTime TEXT,
  storageId TEXT,
  fullFileName TEXT,
  analysisId INTEGER REFERENCES ProjectAnalysis(id),
  feedbackId INTEGER REFERENCES ProjectFeedback(id),
  flagId INTEGER REFERENCES FlagEntityForAnalysis(id),
  articleId INTEGER REFERENCES Article(id),
  principleInterpretationId INTEGER REFERENCES PrincipleInterpretation(id),
  selectionWithPrincipleId INTEGER REFERENCES SelectionWithPrinciple(id),
  principleInSelectionId INTEGER REFERENCES PrincipleInSelection(id)
);

CREATE TABLE IF NOT EXISTS CommSignalInfo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nodeNumber INTEGER,
  fromPerson TEXT,
  toPerson TEXT,
  personAddress TEXT,
  communicationDate TEXT,
  communicationTime TEXT,
  communicationSignalType TEXT,
  communicationSubject TEXT,
  applicationName TEXT,
  commSignalInfoIdentification TEXT,
  communicationFunction TEXT,
  isCommunicationFeedbackRequested INTEGER DEFAULT 0,
  actualSelection TEXT,
  isCommunicationForReview INTEGER DEFAULT 0,
  selectionType TEXT,
  entitySelected TEXT,
  actualCommunication TEXT
);

CREATE TABLE IF NOT EXISTS CommHolderInfo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  personName TEXT,
  commHolderIdentification TEXT,
  functionRelated TEXT,
  functionDescription TEXT,
  commHolderId TEXT
);

CREATE TABLE IF NOT EXISTS PrincipleOfOperation (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actualPrinciple TEXT,
  principleName TEXT,
  principleAspect TEXT,
  principleIdentification TEXT,
  principleDescription TEXT,
  principleId TEXT
);

CREATE TABLE IF NOT EXISTS PrincipleAspect (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actualAspect TEXT,
  aspectName TEXT,
  aspectNumber INTEGER,
  aspectDescription TEXT,
  aspectId TEXT,
  principleId INTEGER REFERENCES PrincipleOfOperation(id)
);

CREATE TABLE IF NOT EXISTS PrincipleInSelection (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actualSelection TEXT,
  actualPrinciple TEXT,
  principleName TEXT,
  setDerivedFrom TEXT,
  principleDescription TEXT,
  communicationPrinciple TEXT,
  commPrincipleDescription TEXT,
  selectionType TEXT,
  analysisId INTEGER REFERENCES ProjectAnalysis(id)
);

CREATE TABLE IF NOT EXISTS PrincipleInterpretation (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actualPrinciple TEXT,
  principleName TEXT,
  setDerivedFrom TEXT,
  personInterpreted TEXT,
  interpretationResult TEXT,
  communicationPrinciple TEXT,
  commPrincipleDescription TEXT,
  analysisId INTEGER REFERENCES ProjectAnalysis(id)
);

CREATE TABLE IF NOT EXISTS SelectionWithPrinciple (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actualSelection TEXT,
  actualPrinciple TEXT,
  principleName TEXT,
  setDerivedFrom TEXT,
  principleDescription TEXT,
  communicationPrinciple TEXT,
  commPrincipleDescription TEXT,
  actualRelationship TEXT,
  relationshipDescription TEXT,
  selectionType TEXT,
  analysisId INTEGER REFERENCES ProjectAnalysis(id)
);

CREATE TABLE IF NOT EXISTS PrincipleInsideReference (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actualPrinciple TEXT,
  principleName TEXT,
  principleDescription TEXT,
  actualAspect TEXT,
  aspectName TEXT,
  aspectDescription TEXT,
  principleId TEXT
);

CREATE TABLE IF NOT EXISTS ProjectInformation (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  projectName TEXT,
  companyName TEXT,
  applicationName TEXT,
  communicationFunction TEXT,
  managerName TEXT,
  projectIdentification TEXT,
  projectStatus TEXT,
  partOfApplication TEXT,
  partOfFunction TEXT,
  partOfResult TEXT,
  groupOfFunction TEXT,
  groupOfApplication TEXT,
  groupOfResult TEXT,
  projectDescription TEXT
);

CREATE TABLE IF NOT EXISTS PeopleInProject (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  personName TEXT,
  personFunction TEXT,
  personIdentification TEXT,
  systemEquivalent TEXT,
  functionEquivalent TEXT,
  personTitle TEXT,
  personFunctionIdentification TEXT,
  dateAddedToProject TEXT,
  personLocation TEXT,
  siteName TEXT,
  personExpertise TEXT,
  emailAddress TEXT,
  phoneNumber TEXT,
  personId TEXT,
  countryName TEXT,
  cityAndState TEXT,
  personAddress TEXT,
  personFunctionDescription TEXT,
  percentCompleted INTEGER DEFAULT 0,
  completedDate TEXT,
  projectId INTEGER REFERENCES ProjectInformation(id)
);

CREATE TABLE IF NOT EXISTS GroupInfo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  groupName TEXT,
  groupFunction TEXT,
  groupInfoIdentification TEXT,
  groupFunctionIdentification TEXT,
  dateDefined TEXT,
  dateStarted TEXT,
  groupDescription TEXT,
  groupFunctionDescription TEXT,
  groupPercentCompleted INTEGER DEFAULT 0,
  completedDate TEXT,
  groupId TEXT,
  projectId INTEGER REFERENCES ProjectInformation(id)
);

CREATE TABLE IF NOT EXISTS EntityUsageInProject (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actualEntity TEXT,
  entityName TEXT,
  entityFunction TEXT,
  entityNumber INTEGER,
  entityUsageIdentification TEXT,
  entityActualFunction TEXT,
  entityFunctionRelated TEXT,
  entityFunctionDescription TEXT,
  entityDescription TEXT,
  howEntityUsageInProject TEXT,
  projectId INTEGER REFERENCES ProjectInformation(id)
);

CREATE TABLE IF NOT EXISTS WhatWeDoProject (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  whatWeDoName TEXT,
  whatWeDoIdentification TEXT,
  whatWeActuallyDo TEXT,
  whatWeDoCommunication TEXT,
  whatWeDoDescription TEXT,
  projectId INTEGER REFERENCES ProjectInformation(id)
);

CREATE TABLE IF NOT EXISTS ResultApplication (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actualApplicationResult TEXT,
  applicationResultName TEXT,
  applicationResultIdentification TEXT,
  applicationResultDescription TEXT,
  projectId INTEGER REFERENCES ProjectInformation(id)
);

CREATE TABLE IF NOT EXISTS ProblemStatement (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actualProblem TEXT,
  problemName TEXT,
  actualAction TEXT,
  actionName TEXT,
  actualReason TEXT,
  problemStatementIdentification TEXT,
  actionTakenSolvedProblem INTEGER DEFAULT 0,
  reasonName TEXT,
  problemDescription TEXT,
  problemAction TEXT,
  problemReason TEXT,
  projectId INTEGER REFERENCES ProjectInformation(id)
);

CREATE TABLE IF NOT EXISTS ProjectSchedule (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  startDate TEXT,
  endDate TEXT,
  startTime TEXT,
  endTime TEXT,
  additionalScheduleInformation TEXT,
  projectId INTEGER REFERENCES ProjectInformation(id)
);

CREATE TABLE IF NOT EXISTS ProjectStatusInfo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  personName TEXT,
  personFunction TEXT,
  groupName TEXT,
  groupFunction TEXT,
  personPercentCompleted INTEGER DEFAULT 0,
  groupFunctionStatus TEXT,
  personFunctionCompletedDate TEXT,
  groupFunctionCompletedDate TEXT,
  projectId INTEGER REFERENCES ProjectInformation(id)
);

CREATE TABLE IF NOT EXISTS LinkedDocument (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  documentName TEXT,
  documentType TEXT,
  documentTitle TEXT,
  documentLink TEXT,
  analysisId INTEGER REFERENCES ProjectAnalysis(id)
);

CREATE TABLE IF NOT EXISTS NoteAtNode (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nodeNumber INTEGER,
  noteDate TEXT,
  noteTime TEXT,
  actualNote TEXT,
  analysisId INTEGER REFERENCES ProjectAnalysis(id)
);

CREATE TABLE IF NOT EXISTS TaskList (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  taskName TEXT,
  taskDate TEXT,
  taskPriority TEXT,
  taskCompleted INTEGER DEFAULT 0,
  taskNote TEXT,
  projectId INTEGER REFERENCES ProjectInformation(id)
);

CREATE TABLE IF NOT EXISTS ErrorMessages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  errorType TEXT,
  errorMessage TEXT,
  errorDate TEXT,
  errorTime TEXT
);

CREATE TABLE IF NOT EXISTS CommunicationData (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  personName TEXT NOT NULL DEFAULT '',
  personEmail TEXT NOT NULL DEFAULT '',
  outgoingServer TEXT DEFAULT '',
  incomingServer TEXT DEFAULT '',
  userName TEXT DEFAULT '',
  personPassword TEXT DEFAULT '',
  serverSecurity TEXT DEFAULT 'None',
  incomingPort INTEGER DEFAULT 995,
  outgoingPort INTEGER DEFAULT 25,
  useAuthentication INTEGER DEFAULT 0
);
`;
