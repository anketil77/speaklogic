// src/dialog/views/ListFeedbackRequestedView.tsx
// Full-screen list of pending feedback requests — matches C# ListOfFeedbackRequested.cs.
// Shows only CommSignalInfo rows where isCommunicationFeedbackRequested = 1.
// No toolbar (read-only list). No custom close button (native OS window chrome).

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { FooterBar, FooterStatusText, DismissBtn } from "@/dialog/components/FooterButtons";
import { useDialogComm } from "@/dialog/hooks/useDialogComm";
import { PanelTable, type PanelTableCol } from "@/dialog/components/PanelTable";
import { ViewFeedbackRequestedDialog } from "@/dialog/components/ViewFeedbackRequestedDialog";
import { InfoMessageCard } from "@/dialog/components/InfoMessageCard";
import {
  ListFeedbackRequestedHeaderIcon,
  ViewFeedbackRequestIcon,
  FbRequestDeleteIcon,
  EditFeedbackRequestIcon,
  ApplyFeedbackRequestIcon,
  ProvideFeedbackWithRequestIcon,
  FlagViewReportIcon,
  FbHistoryViewReportIcon,
} from "@/dialog/components/Icons";
import {
  openRequestFeedbackSelectionReport,
  openRequestFeedbackReport,
} from "@/dialog/utils/reportGenerator";
import { colors } from "@/styles/tokens";
import type { CommSignalInfo } from "@/types/db";

// ── Info messages (mirror C# messages verbatim) ───────────────────────────────
const INFO_MESSAGES = {
  delete: {
    title: "Delete Feedback Message",
    text:
      "Since it is not possible for us to delete an identified communication, it is not possible " +
      "for us as well to delete a communication that is viewed as a request for feedback.  Since " +
      "this is a computer screen, if I want to I can hide the identified request from my list.  " +
      "Do I still want to continue to hide the selected request for feedback from my list?",
  },
  edit: {
    title: "Edit Feedback Message",
    text:
      "Since our application is communication driven, if it was possible for us to edit a " +
      "communication for instance a sentence we have already repeated, then it would have been " +
      "possible for us to undo the execution of our application.  The way to look at it, a " +
      "communication that is already been used for the request of a feedback cannot be edited.  " +
      "Since it is not possible or practical for us to undo the execution of our application, " +
      "it is not practical for us as well to edit a communication that is already been used in " +
      "the execution of our application.",
  },
  apply: {
    title: "Apply Feedback Message",
    text:
      "Since we sense each communication that we identify, by sensing an identified communication, " +
      "it is possible for us to recognize that communication and determine whether or not it is a " +
      "feedback.  In other words, by identifying a communication, our sense determine if that " +
      "communication is a feedback.  A communication that is viewed as a request for feedback " +
      "cannot be viewed as a feedback.  In this case, it is not possible for us to apply a " +
      "communication as feedback, where the communication is not viewed as a feedback.  Therefore " +
      "this operation cannot be completed.",
  },
  provide: {
    title: "Provide Feedback Message",
    text:
      "Since each communication has a unique identification and there is an application associated " +
      "with each communication, it is not possible for us to use a communication to an application " +
      "where that communication is not for that application and it is already tagged for another " +
      "application.  In other words, a communication that is viewed as a request for feedback to " +
      "correct error in an application is tagged for that application.  It is not possible to use " +
      "that communication to another application.  Therefore it is not possible to provide feedback " +
      "with a communication that is already been used in another application.",
  },
} as const;

// ── Table columns — defined at module level to avoid re-creation ──────────────
const DATA_COLUMNS: PanelTableCol<CommSignalInfo>[] = [
  {
    header: "To Person",
    width: "15%",
    render: (r) => r.toPerson || "—",
    truncate: true,
  },
  {
    header: "Feedback Date",
    width: "17%",
    render: (r) => r.communicationDate || "—",
    truncate: true,
  },
  {
    header: "Feedback Time",
    width: "17%",
    render: (r) => r.communicationTime || "—",
    truncate: true,
  },
  {
    header: "Application Name",
    width: "19%",
    render: (r) => r.applicationName || "—",
    truncate: true,
  },
  {
    header: "Communication Function",
    width: "23%",
    render: (r) => r.communicationFunction || "—",
    truncate: true,
  },
  {
    header: "Signal",
    width: "9%",
    render: (r) => r.communicationSignalType || "—",
    truncate: true,
  },
];

function CmdSepBar() {
  return (
    <div style={{ width: 1, height: 20, background: colors.grey88, flexShrink: 0 }} />
  );
}

export default function ListFeedbackRequestedView() {
  const { initData, sendMessage } = useDialogComm();

  // ── Local delete-tracking (optimistic removal) ────────────────────────────
  const [deletedIds, setDeletedIds] = useState<Set<number>>(new Set());
  const requests = useMemo(
    () =>
      ((initData?.commSignalRequests ?? []) as CommSignalInfo[]).filter(
        (r) => r.id === undefined || !deletedIds.has(r.id as number)
      ),
    [initData, deletedIds]
  );

  // ── Selection ─────────────────────────────────────────────────────────────
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // ── View detail portal ────────────────────────────────────────────────────
  const [viewRequest, setViewRequest] = useState<CommSignalInfo | null>(null);

  // ── Delete confirmation overlay ───────────────────────────────────────────
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [cancelDeleteHover, setCancelDeleteHover] = useState(false);
  const [confirmDeleteHover, setConfirmDeleteHover] = useState(false);

  // ── Info message card ─────────────────────────────────────────────────────
  const [infoMsg, setInfoMsg] = useState<{ title: string; text: string } | null>(null);

  // ── Button hover states ───────────────────────────────────────────────────
  const [primaryHover, setPrimaryHover] = useState(false);

  // ── Keyboard: Escape closes info or detail overlay ────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (viewRequest) { setViewRequest(null); return; }
        if (infoMsg)     { setInfoMsg(null); return; }
        if (pendingDelete !== null) { setPendingDelete(null); return; }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [viewRequest, infoMsg, pendingDelete]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleRowClick = useCallback((idx: number) => {
    setSelectedIndex((prev) => (prev === idx ? null : idx));
  }, []);

  const handleView = useCallback(() => {
    if (selectedIndex === null) return;
    const row = requests[selectedIndex];
    if (row) setViewRequest(row);
  }, [selectedIndex, requests]);

  const handleDelete = useCallback(() => {
    if (selectedIndex === null) return;
    const row = requests[selectedIndex];
    if (row?.id !== undefined) {
      setPendingDelete(row.id as number);
    }
  }, [selectedIndex, requests]);

  const confirmDelete = useCallback(() => {
    if (pendingDelete === null) return;
    sendMessage({ action: "DELETE_COMM_SIGNAL_REQUEST", id: pendingDelete });
    setDeletedIds((prev) => new Set(prev).add(pendingDelete));
    setSelectedIndex(null);
    setPendingDelete(null);
  }, [pendingDelete, sendMessage]);

  const cancelDelete = useCallback(() => {
    setPendingDelete(null);
  }, []);

  const showInfo = useCallback((key: keyof typeof INFO_MESSAGES) => {
    setInfoMsg(INFO_MESSAGES[key]);
  }, []);

  const handleSelectionReport = useCallback(() => {
    if (selectedIndex === null) return;
    const row = requests[selectedIndex];
    if (row) openRequestFeedbackSelectionReport(row);
  }, [selectedIndex, requests]);

  const handleFeedbackReport = useCallback(() => {
    if (selectedIndex === null) return;
    const row = requests[selectedIndex];
    if (row) openRequestFeedbackReport(row);
  }, [selectedIndex, requests]);

  const hasSelection = selectedIndex !== null;

  // ── Icon button style helper ─────────────────────────────────────────────
  const iconBtnStyle = useCallback(
    (enabled: boolean): React.CSSProperties => ({
      width: 28,
      height: 28,
      border: "none",
      background: "transparent",
      cursor: enabled ? "pointer" : "default",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 3,
      flexShrink: 0,
      opacity: enabled ? 1 : 0.4,
    }),
    []
  );

  return (
    <>
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Inter, Segoe UI, sans-serif",
          background: colors.white,
          overflow: "hidden",
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            height: 78,
            minHeight: 78,
            position: "relative",
            display: "flex",
            alignItems: "flex-start",
            padding: "0 20px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: "#EBF3FC",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 21,
              flexShrink: 0,
            }}
          >
            <ListFeedbackRequestedHeaderIcon />
          </div>
          <div style={{ marginLeft: 12, marginTop: 20, display: "flex", flexDirection: "column", flex: 1 }}>
            <span
              style={{
                fontWeight: 700,
                fontSize: 15.6,
                lineHeight: "21px",
                color: colors.grey11,
                letterSpacing: -0.1,
              }}
            >
              List of Feedback Requested
            </span>
            <span
              style={{
                fontWeight: 400,
                fontSize: 11.1,
                lineHeight: "17px",
                color: colors.grey38,
                marginTop: 3,
              }}
            >
              View and manage all feedback requests.
            </span>
          </div>
        </div>

        {/* ── Command bar ── */}
        <div
          style={{
            height: 44,
            minHeight: 44,
            background: colors.grey96,
            display: "flex",
            alignItems: "center",
            padding: "0 12px",
            gap: 4,
            boxSizing: "border-box",
            position: "relative",
          }}
        >
          {/* Primary: View Feedback Request */}
          <button
            disabled={!hasSelection}
            onClick={handleView}
            onMouseEnter={() => setPrimaryHover(true)}
            onMouseLeave={() => setPrimaryHover(false)}
            style={{
              height: 28,
              paddingLeft: 10,
              paddingRight: 10,
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: !hasSelection
                ? "#C5C5C5"
                : primaryHover
                ? "#106EBE"
                : colors.azure42,
              color: colors.white,
              border: "none",
              borderRadius: 4,
              cursor: hasSelection ? "pointer" : "default",
              fontSize: 11.4,
              fontWeight: 700,
              fontFamily: "inherit",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            <ViewFeedbackRequestIcon />
            View Feedback Request
          </button>

          <CmdSepBar />

          {/* Delete */}
          <button
            className="sl-icon-btn"
            title="Delete Selected Request"
            disabled={!hasSelection}
            onClick={handleDelete}
            style={iconBtnStyle(hasSelection)}
          >
            <FbRequestDeleteIcon />
          </button>

          {/* Edit — shows info message (cannot edit) */}
          <button
            className="sl-icon-btn"
            title="Edit Selected Request"
            disabled={!hasSelection}
            onClick={() => showInfo("edit")}
            style={iconBtnStyle(hasSelection)}
          >
            <EditFeedbackRequestIcon />
          </button>

          <CmdSepBar />

          {/* Apply — shows info message (cannot apply) */}
          <button
            className="sl-icon-btn"
            title="Apply Selected Feedback"
            disabled={!hasSelection}
            onClick={() => showInfo("apply")}
            style={iconBtnStyle(hasSelection)}
          >
            <ApplyFeedbackRequestIcon />
          </button>

          {/* Provide Feedback With — shows info message */}
          <button
            className="sl-icon-btn"
            title="Provide Feedback With Feedback"
            disabled={!hasSelection}
            onClick={() => showInfo("provide")}
            style={iconBtnStyle(hasSelection)}
          >
            <ProvideFeedbackWithRequestIcon />
          </button>

          <CmdSepBar />

          {/* Selection Report */}
          <button
            className="sl-icon-btn"
            title="Selection Report"
            disabled={!hasSelection}
            onClick={handleSelectionReport}
            style={iconBtnStyle(hasSelection)}
          >
            <FlagViewReportIcon />
          </button>

          {/* Request Provided Report */}
          <button
            className="sl-icon-btn"
            title="Request Provided Report"
            disabled={!hasSelection}
            onClick={handleFeedbackReport}
            style={iconBtnStyle(hasSelection)}
          >
            <FbHistoryViewReportIcon />
          </button>
        </div>

        {/* ── Table ── */}
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          <PanelTable
            columns={DATA_COLUMNS}
            rows={requests}
            selectedIndex={selectedIndex}
            onRowClick={handleRowClick}
          />

          {/* Delete confirmation overlay */}
          {pendingDelete !== null && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(255,255,255,0.92)",
                zIndex: 10,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: colors.grey11,
                  maxWidth: 520,
                  textAlign: "center",
                  lineHeight: "20px",
                  padding: "0 20px",
                }}
              >
                {INFO_MESSAGES.delete.text}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onMouseEnter={() => setConfirmDeleteHover(true)}
                  onMouseLeave={() => setConfirmDeleteHover(false)}
                  onClick={confirmDelete}
                  style={{
                    height: 28,
                    paddingLeft: 16,
                    paddingRight: 16,
                    background: confirmDeleteHover ? "#C50F1F" : "#D13438",
                    color: colors.white,
                    border: "none",
                    borderRadius: 4,
                    fontSize: 11.4,
                    fontWeight: 700,
                    fontFamily: "inherit",
                    cursor: "pointer",
                  }}
                >
                  Yes, Hide It
                </button>
                <button
                  onMouseEnter={() => setCancelDeleteHover(true)}
                  onMouseLeave={() => setCancelDeleteHover(false)}
                  onClick={cancelDelete}
                  style={{
                    height: 28,
                    paddingLeft: 16,
                    paddingRight: 16,
                    background: cancelDeleteHover ? "#E5E5E5" : colors.white,
                    color: colors.grey11,
                    border: `1px solid ${colors.grey88}`,
                    borderRadius: 4,
                    fontSize: 11.4,
                    fontWeight: 600,
                    fontFamily: "inherit",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* InfoMessageCard (edit / apply / provide messages) */}
          {infoMsg && (
            <InfoMessageCard
              title={infoMsg.title}
              text={infoMsg.text}
              onClose={() => setInfoMsg(null)}
              initialX={40}
              initialY={40}
            />
          )}
        </div>

        {/* ── Footer ── */}
        <FooterBar>
          <FooterStatusText>{requests.length} request{requests.length !== 1 ? "s" : ""}</FooterStatusText>
          <DismissBtn label="Back" onClick={() => sendMessage({ action: "BACK_TO_FEEDBACK_HISTORY" })} />
        </FooterBar>
      </div>

      {/* View detail portal */}
      {viewRequest && (
        <ViewFeedbackRequestedDialog
          request={viewRequest}
          onClose={() => setViewRequest(null)}
        />
      )}
    </>
  );
}
