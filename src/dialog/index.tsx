// src/dialog/index.tsx
//
// DialogApp is the ONLY place that calls Office.js dialog APIs:
//   - addHandlerAsync (one registration, never repeated)
//   - messageParent / closeContainer
// All views consume initData/sendMessage/closeDialog via DialogCommContext.
// Registering these APIs more than once per dialog page causes Office error 715-123280.

/* global Office */

import React, { useState, useEffect, useCallback, Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { FluentProvider, Spinner, webLightTheme } from "@fluentui/react-components";
import { ErrorBoundary } from "@/dialog/components/ErrorBoundary";
import { DialogCommContext } from "@/dialog/hooks/useDialogComm";
import MessageDialog from "@/dialog/components/MessageDialog";
import AnalyzeView from "@/dialog/views/analyze/AnalyzeView";
import ErrorIdentificationView from "@/dialog/views/ErrorIdentificationView";
import AnalysisQuestionView from "@/dialog/views/AnalysisQuestionView";
import CompensatorView from "@/dialog/views/CompensatorView";
import IdentifyProblemView from "@/dialog/views/IdentifyProblemView";
import AnswerAnalysisQuestionView from "@/dialog/views/AnswerAnalysisQuestionView";
import AttachFileView from "@/dialog/views/AttachFileView";
import CommunicationConfigView from "@/dialog/views/CommunicationConfigView";
import FlagView from "@/dialog/views/FlagView";
import SelectionConfigView from "@/dialog/views/SelectionConfigView";
import RequestFeedbackView from "@/dialog/views/feedback/RequestFeedbackView";
import RequestSLFeedbackView from "@/dialog/views/feedback/RequestSLFeedbackView";
import AboutView from "@/dialog/views/AboutView";

// Lazy-loaded: heavy views that aren't on the critical path.
// WebView2 caches the chunks after first use, so subsequent opens are instant.
const CreateArticleView         = lazy(() => import("@/dialog/views/CreateArticleView"));
const CreateArticlePickerView   = lazy(() => import("@/dialog/views/CreateArticlePickerView"));
const TemplatePickerPanel       = lazy(() => import("@/dialog/views/createarticle/TemplatePickerPanel"));
const ListArticlesView        = lazy(() => import("@/dialog/views/ListArticlesView"));
const ArticleWizardView       = lazy(() => import("@/dialog/views/ArticleWizardView"));
const ApplyFeedbackView = lazy(() => import("@/dialog/views/feedback/ApplyFeedbackView"));
const ProvideFeedbackView = lazy(() => import("@/dialog/views/feedback/ProvideFeedbackView"));
const AnalysisHistoryView = lazy(() => import("@/dialog/views/AnalysisHistoryView"));
const FlaggedHistoryView = lazy(() => import("@/dialog/views/FlaggedHistoryView"));
const FeedbackHistoryView = lazy(() => import("@/dialog/views/FeedbackHistoryView"));
const RetainedHistoryView = lazy(() => import("@/dialog/views/RetainedHistoryView"));
import type { DialogInitPayload, HostMessage } from "@/types/db";
import { dbg } from "@/debug/log";

function DialogApp() {
  const params = new URLSearchParams(window.location.search);
  const [currentView, setCurrentView] = useState(params.get("view") ?? "");
  const [initData, setInitData] = useState<DialogInitPayload | null>(null);
  const [mailtoUrl, setMailtoUrl] = useState<string | null>(null);
  const [retainSaved, setRetainSaved] = useState(false);
  const mode = (params.get("mode") ?? "selection") as "selection" | "paragraph";

  useEffect(() => {
    Office.onReady(() => {
      if (!Office.context.ui) return;

      dbg("DIALOG", "Office.onReady in dialog — registering addHandlerAsync");

      // ONE handler registration for the entire dialog lifetime.
      // NAVIGATE carries the new view's payload directly — no second READY needed.
      Office.context.ui.addHandlerAsync(
        Office.EventType.DialogParentMessageReceived,
        (evt: Office.DialogParentMessageReceivedEventArgs) => {
          const msg = JSON.parse(evt.message) as HostMessage;
          dbg("DIALOG", "DialogParentMessageReceived", { type: msg.type });
          if (msg.type === "INIT") {
            dbg("DIALOG", "INIT received — setting initData");
            setInitData(msg.payload);
          } else if (msg.type === "NAVIGATE") {
            dbg("DIALOG", "NAVIGATE received — switching view", { view: msg.view });
            setInitData(msg.payload);   // swap payload before switching view
            setCurrentView(msg.view);
          } else if (msg.type === "SAVED") {
            dbg("DIALOG", "SAVED received — showing success state", { hasMailto: !!msg.mailtoUrl });
            setMailtoUrl(msg.mailtoUrl);
          } else if (msg.type === "RETAIN_SAVED") {
            dbg("DIALOG", "RETAIN_SAVED received — showing retain success state");
            setRetainSaved(true);
          } else if (msg.type === "ERROR") {
            dbg("DIALOG", "ERROR received from host", { message: (msg as { type: string; message: string }).message });
          }
        }
      );

      // ONE READY signal for the entire dialog lifetime.
      dbg("DIALOG", "sending READY to host");
      Office.context.ui.messageParent(JSON.stringify({ action: "READY" }));
    });
  }, []);

  const sendMessage = useCallback((action: object) => {
    dbg("DIALOG", "sendMessage (messageParent)", { action: (action as { action?: string }).action });
    Office.context.ui.messageParent(JSON.stringify(action));
  }, []);

  const closeDialog = useCallback(() => {
    dbg("DIALOG", "closeDialog called — attempting closeContainer");
    try {
      Office.context.ui.closeContainer();
    } catch (err) {
      dbg("DIALOG", "closeContainer threw — falling back to messageParent CLOSE", String(err));
      try {
        Office.context.ui.messageParent(JSON.stringify({ action: "CLOSE" }));
      } catch {
        // ignore
      }
    }
  }, []);

  const renderView = () => {
    dbg("DIALOG", "renderView called", { currentView, hasInitData: initData !== null });
    switch (currentView) {
      case "analyze":
        return <AnalyzeView mode={mode} />;
      case "apply":
        return <ApplyFeedbackView />;
      case "provide-feedback":
        return <ProvideFeedbackView />;
      case "request-feedback":
        return <RequestFeedbackView />;
      case "request-sl-feedback":
        return <RequestSLFeedbackView />;
      case "error-identification":
        return <ErrorIdentificationView />;
      case "analysis-question":
        return <AnalysisQuestionView />;
      case "compensator":
        return <CompensatorView />;
      case "identify-problem":
        return <IdentifyProblemView />;
      case "answer-question":
        return <AnswerAnalysisQuestionView />;
      case "attach-file":
        return <AttachFileView />;
      case "communication-config":
        return <CommunicationConfigView />;
      case "flag":
        return <FlagView />;
      case "selection-config":
        return <SelectionConfigView />;
      case "create-article-picker":
        return <CreateArticlePickerView />;
      case "template-picker":
        return <TemplatePickerPanel />;
      case "create-article":
        return <CreateArticleView />;
      case "list-articles":
        return <ListArticlesView />;
      case "article-wizard":
        return <ArticleWizardView />;
      case "about":
        return <AboutView />;
      case "analysis-history":
        return <AnalysisHistoryView />;
      case "flagged-history":
        return <FlaggedHistoryView />;
      case "feedback-history":
        return <FeedbackHistoryView />;
      case "retained-history":
        return <RetainedHistoryView />;
      case "message": {
        const title = params.get("title") ?? "";
        const text = params.get("text") ?? "";
        return <MessageDialog title={title} text={text} onClose={closeDialog} />;
      }
      default:
        return (
          <div style={{ padding: 24, fontFamily: "Segoe UI, sans-serif" }}>
            <p>View not yet implemented: <strong>{currentView}</strong></p>
          </div>
        );
    }
  };

  return (
    <DialogCommContext.Provider value={{ initData, sendMessage, closeDialog, mailtoUrl, retainSaved }}>
      <ErrorBoundary>
        <FluentProvider
          theme={webLightTheme}
          style={{ height: "100vh", display: "flex", flexDirection: "column" }}
        >
          <Suspense fallback={
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
              <Spinner />
            </div>
          }>
            {renderView()}
          </Suspense>
        </FluentProvider>
      </ErrorBoundary>
    </DialogCommContext.Provider>
  );
}

Office.onReady(() => {
  const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
  root.render(<DialogApp />);
});
