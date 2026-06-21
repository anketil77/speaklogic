// src/dialog/index.tsx
//
// DialogApp is the ONLY place that calls Office.js dialog APIs:
//   - addHandlerAsync (one registration, never repeated)
//   - messageParent / closeContainer
// All views consume initData/sendMessage/closeDialog via DialogCommContext.
// Registering these APIs more than once per dialog page causes Office error 715-123280.

/* global Office */

import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { FluentProvider, Spinner, webLightTheme } from "@fluentui/react-components";
import { MathJaxContext } from "better-react-mathjax";
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
import KeywordSettingsView from "@/dialog/views/KeywordSettingsView";
import KeywordHistoryView from "@/dialog/views/KeywordHistoryView";
import FlagView from "@/dialog/views/FlagView";
import SelectionConfigView from "@/dialog/views/SelectionConfigView";
import RequestFeedbackView from "@/dialog/views/feedback/RequestFeedbackView";
import RequestSLFeedbackView from "@/dialog/views/feedback/RequestSLFeedbackView";
import AboutView from "@/dialog/views/AboutView";
import HelpView from "@/dialog/views/HelpView";

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
const ListFeedbackRequestedView = lazy(() => import("@/dialog/views/ListFeedbackRequestedView"));
const SelectionHistoryView = lazy(() => import("@/dialog/views/SelectionHistoryView"));
const FlaggedArticlesView = lazy(() => import("@/dialog/views/FlaggedArticlesView"));
const ListIdentifiedPrincipleView = lazy(() => import("@/dialog/views/ListIdentifiedPrincipleView"));
const ListInterpretedPrincipleView = lazy(() => import("@/dialog/views/ListInterpretedPrincipleView"));
const ListSelectionRelatedPrincipleView = lazy(() => import("@/dialog/views/ListSelectionRelatedPrincipleView"));
const PeopleView = lazy(() => import("@/dialog/views/PeopleView"));
import type { DialogInitPayload, HostMessage } from "@/types/db";
import { dbg } from "@/debug/log";

// MathJax v3, loaded from our OWN origin (never a CDN — keeps the add-in offline-safe).
// webpack copies node_modules/mathjax/es5 → dist/mathjax, so this resolves to
// <origin>/mathjax/tex-mml-chtml.js and its fonts load relative to it.
const MATHJAX_SRC =
  typeof window !== "undefined"
    ? `${window.location.origin}/mathjax/tex-mml-chtml.js`
    : "/mathjax/tex-mml-chtml.js";

const MATHJAX_CONFIG = {
  tex: {
    // Only backslash delimiters (\( \) inline, \[ \] display) — the form the
    // client's files use. We deliberately do NOT enable "$…$" so plain prices
    // like "$5" are never mistaken for math (MathJax's own safe default).
    inlineMath: [["\\(", "\\)"]],
    displayMath: [["\\[", "\\]"]],
  },
  // Left-align display equations (MathJax centers them by default) so they sit
  // with the surrounding text — matches the client's left-bordered .eq cards.
  chtml: { displayAlign: "left", displayIndent: "0" },
  options: {
    // Don't typeset inside editors / code blocks.
    skipHtmlTags: ["script", "noscript", "style", "textarea", "pre", "code"],
  },
};

function DialogApp() {
  const params = new URLSearchParams(window.location.search);
  const [currentView, setCurrentView] = useState(params.get("view") ?? "");
  const [initData, setInitData] = useState<DialogInitPayload | null>(null);
  const [mailtoUrl, setMailtoUrl] = useState<string | null>(null);
  const [retainSaved, setRetainSaved] = useState(false);
  // Double-submit guard shared by every save-capable view. savingRef blocks
  // re-entrant sends synchronously (state updates are async); `saving` drives
  // the disabled/"Saving…" UI. Reset when the host responds (or a 20s safety net).
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mode = (params.get("mode") ?? "selection") as "selection" | "paragraph";

  const resetSaving = useCallback(() => {
    if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); saveTimerRef.current = null; }
    savingRef.current = false;
    setSaving(false);
  }, []);

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
            // Some openers (e.g. FlaggedHistory principle saves) acknowledge a completed
            // save by re-sending INIT rather than SAVED/NAVIGATE. Clear the double-submit
            // lock here too, or the next save is silently ignored for 20s (the "frozen" bug).
            resetSaving();
          } else if (msg.type === "NAVIGATE") {
            dbg("DIALOG", "NAVIGATE received — switching view", { view: msg.view });
            setInitData(msg.payload);   // swap payload before switching view
            setCurrentView(msg.view);
            resetSaving();              // new view → allow its own save
          } else if (msg.type === "SAVED") {
            dbg("DIALOG", "SAVED received — showing success state", { hasMailto: !!msg.mailtoUrl });
            setMailtoUrl(msg.mailtoUrl);
            resetSaving();
          } else if (msg.type === "COMPOSE_OPENING") {
            dbg("DIALOG", "COMPOSE_OPENING received — host confirmed OPEN_MAILTO and is closing dialog");
          } else if (msg.type === "RETAIN_SAVED") {
            dbg("DIALOG", "RETAIN_SAVED received — showing retain success state");
            setRetainSaved(true);
            resetSaving();
          } else if (msg.type === "ERROR") {
            dbg("DIALOG", "ERROR received from host", { message: (msg as { type: string; message: string }).message });
            resetSaving();             // let the user retry after a host error
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

  // Save-action wrapper: ignores repeat clicks while a save is in flight, so a
  // slow host round-trip (esp. Word on the web) can't create duplicate records.
  // Stays locked until the host replies (SAVED/RETAIN_SAVED/NAVIGATE/ERROR),
  // the dialog closes, or the 20s safety timeout fires.
  const submitSave = useCallback((action: object) => {
    if (savingRef.current) {
      dbg("DIALOG", "submitSave ignored — save already in flight", { action: (action as { action?: string }).action });
      return;
    }
    savingRef.current = true;
    setSaving(true);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => { resetSaving(); }, 20000);
    Office.context.ui.messageParent(JSON.stringify(action));
  }, [resetSaving]);

  const closeDialog = useCallback(() => {
    dbg("DIALOG", "closeDialog — messageParent CLOSE (primary)");
    // messageParent("CLOSE") is the PRIMARY close path — it reaches the host, which calls
    // dialog.close() + event.completed(). This is the ONLY path that releases Word's event
    // state in a displayDialogAsync dialog. It must run first.
    // closeContainer() is a task-pane API: on Word Desktop it silently does nothing inside a
    // displayDialogAsync dialog, and on Word Online it tears down the iframe synchronously —
    // if it runs first it can prevent messageParent from ever reaching the host, so
    // event.completed() never fires and Word editing locks up. Only use it as a fallback.
    try {
      Office.context.ui.messageParent(JSON.stringify({ action: "CLOSE" }));
    } catch (err) {
      dbg("DIALOG", "messageParent CLOSE threw — falling back to closeContainer", String(err));
      try { Office.context.ui.closeContainer(); } catch { }
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
      case "keyword-settings":
        return <KeywordSettingsView />;
      case "keyword-history":
        return <KeywordHistoryView />;
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
      case "people":
        return <PeopleView />;
      case "about":
        return <AboutView />;
      case "help":
        return <HelpView />;
      case "analysis-history":
        return <AnalysisHistoryView />;
      case "flagged-history":
        return <FlaggedHistoryView />;
      case "feedback-history":
        return <FeedbackHistoryView />;
      case "selection-history":
        return <SelectionHistoryView />;
      case "flagged-articles":
        return <FlaggedArticlesView />;
      case "list-identified-principle":
        return <ListIdentifiedPrincipleView />;
      case "list-interpreted-principle":
        return <ListInterpretedPrincipleView />;
      case "list-selection-related-principle":
        return <ListSelectionRelatedPrincipleView />;
      case "list-feedback-requested":
        return <ListFeedbackRequestedView />;
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
    <DialogCommContext.Provider value={{ initData, sendMessage, submitSave, saving, closeDialog, mailtoUrl, retainSaved }}>
      <ErrorBoundary>
        <MathJaxContext version={3} src={MATHJAX_SRC} config={MATHJAX_CONFIG}>
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
        </MathJaxContext>
      </ErrorBoundary>
    </DialogCommContext.Provider>
  );
}

Office.onReady(() => {
  const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
  root.render(<DialogApp />);
});
