// src/dialog/components/ViewAnalysisDialog.tsx
// Portal dialog: View Selected Analysis — matches C# ViewAnalysis.cs design

import React, { useState, useCallback, useMemo } from "react";
import { formatDisplayDate } from "@/db/db";
import { createPortal } from "react-dom";
import { useDraggable } from "@/dialog/hooks/useDraggable";
import { InfoMessageCard } from "@/dialog/components/InfoMessageCard";
import { PanelContextMenu, type PanelMenuEntry } from "@/dialog/components/PanelContextMenu";
import { ViewQuestionDialog } from "@/dialog/components/ViewQuestionDialog";
import { ViewErrorDialog } from "@/dialog/components/ViewErrorDialog";
import { ViewCompensatorDialog } from "@/dialog/components/ViewCompensatorDialog";
import { ViewAnswerDialog } from "@/dialog/components/ViewAnswerDialog";
import { ViewFileInformationDialog } from "@/dialog/components/ViewFileInformationDialog";
import { ViewProblemDialog } from "@/dialog/components/ViewProblemDialog";
import { AnalysisModelDialog } from "@/dialog/components/AnalysisModelDialog";
import {
  CloseIcon,
  AnalysisHistoryHeaderIcon,
  DeleteSelectedIcon,
  EditSelectedAnalysisIcon,
  ApplySelFbMenuIcon,
  ProvideFeedbackAnalysisIcon,
  FlagAnalysisCommunicationIcon,
  AnalyzeSelectionCmdIcon,
  FeedbackModelIcon,
} from "@/dialog/components/Icons";
import { CommandDropdown, type CmdDropdownDef } from "@/dialog/components/CommandDropdown";
import type { ProjectAnalysis, ProjectQuestion, ProjectError, ProjectCompensator, ProjectAnswer, ProjectProblem, AttachFileToProject, ProjectFeedback } from "@/types/db";

type PanelView = "both" | "analysisOnly" | "entityOnly";

interface Props {
  analysis: ProjectAnalysis;
  onClose: () => void;
  onApply?: () => void;
  onProvide?: () => void;
  feedbacks?: ProjectFeedback[];
  onEdit?: (id: number) => void;
}

const C = {
  blue: "#0078D4",
  grey11: "#1B1B1B",
  grey38: "#616161",
  grey78: "#C7C7C7",
  grey88: "#E0E0E0",
  grey96: "#F5F5F5",
  iconBg: "#EBF3FC",
  white: "#FFFFFF",
} as const;

const TABS = [
  "Analysis",
  "Questions",
  "Errors",
  "Compensators",
  "Answers",
  "Problems",
  "Attached Files",
] as const;
type Tab = (typeof TABS)[number];

const LABEL_W = 148;

// Info messages verbatim from ViewAnalysis.cs
const INFO = {
  delete: {
    title: "Delete Analysis Message",
    text: "After an analysis has been performed to an entity, it is not possible or practical to delete that analysis. After we analyze an entity, it is not possible or practical for us to delete that analysis. After I analyze an underlined entity, it is not possible for me to delete that analysis. If it was possible to delete an analysis, then it would not be possible to correct an error by the use of applying a feedback whether it is provided.",
  },
  edit: {
    title: "Edit Analysis Message",
    text: "An analysis is enabled by the principle. We use the principle to analyze an entity. Practically, it is not possible to edit an analysis. The way to look at it, the principle enables us to analyze an entity that we are currently analyzing. Now let's assume that an error is committed during the analysis of that entity. In this case, that analysis is no longer considered an analysis. To fix this problem, a new analysis is required. It is always good to think that the term of editing analysis is not really the editing of an existing analysis, but performing a new analysis. Here while the existing text may be used, think the process as a new analysis.",
  },
  apply: {
    title: "Apply Analysis as Feedback Message",
    text: "After an analysis is performed to an entity, it is possible to apply that analysis as feedback or provide feedback with that analysis. Practically feedback is provided at a time it is needed and it is applied as well at a time it is needed. At the time the analysis is performed, it is good for that analysis to be provided as feedback, so it can be applied at that time to enable the correction. Now let's assume that at the time an analysis is performed, then it was not possible for feedback to be given or applied based on that analysis, then it is possible for us to save that analysis, then later applied it as feedback. Here only retained analysis can be applied as feedback. Any analysis that is not retained or was not provided as feedback, will need to be flagged as communication, then perform another analysis of that communication and use that analysis as feedback.",
  },
  applyNotRetained: {
    title: "Apply Analysis as Feedback",
    text: "An analysis that is not retained cannot be applied later as a feedback. It is not possible or practical to apply an analysis that is not retained as feedback. Here in order to apply this analysis as feedback, I will need to flag that analysis as communication, perform another analysis on that communication and use that analysis as feedback.",
  },
  provide: {
    title: "Provide Analysis as Feedback Message",
    text: "After an analysis is performed to an entity, it is possible to apply that analysis as feedback or provide feedback with that analysis. Practically feedback is provided at a time it is needed and it is applied as well at a time it is needed. At the time the analysis is performed, it is good for that analysis to be provided as feedback, so it can be applied at that time to enable the correction. Now let's assume that at the time an analysis is performed, then it was not possible for feedback to be given or applied based on that analysis, then it is possible for us to save that analysis, then later applied it as feedback. Here only retained analysis can be provided as feedback. Any analysis that is not retained, will need to be flagged as communication, then perform another analysis of that communication and use that analysis as feedback.",
  },
  provideNotRetained: {
    title: "Apply Analysis as Feedback",
    text: "An analysis that is not retained cannot be provided later as a feedback. It is not possible or practical to provided feedback with an analysis that is not retained. Here in order to provided this analysis as feedback as feedback, I will need to flag it as communication, perform another analysis on that communication and provide that analysis as feedback.",
  },
  flag: {
    title: "Flag Analysis as Communication",
    text: "Since an analysis must include the principle in it, if we suspect an entity that claims to be an analysis and it is not an analysis, then it is possible for us to flag that entity as communication, since it is not an analysis at all. If an analysis is already performed and we need to provide feedback with that analysis or apply that analysis as feedback and that analysis was not retained, we will need to flag that analysis as communication, perform another analysis on that communication and use that analysis as feedback.",
  },
  flagged: {
    title: "Flag Analysis as Communication",
    text: "This analysis has been flagged as communication. If the reason for the flag is that the analysis was not an analysis at all, I will need to remove it from the list of analysis, since it was not an analysis at all.",
  },
  analyze: {
    title: "Analyze Analysis Message",
    text: "An analysis is not possible without the principle that enables it. We use the principle to analyze an entity. The result of an analysis is an entity with the inclusion of the principle. If an analysis does not include the principle, then it is not an analysis at all. In this case, we can simply flag that entity as communication. The principles that include in an analysis enable that analysis. It is not possible to analyze an analysis directly without flagging it first as communication.",
  },
  editBlocked: {
    title: "Edit Analysis Message",
    text: "Since the analysis has been provided or applied as feedback, it can no longer be edited",
  },
} as const;

type InfoKey = keyof typeof INFO;

// Sub-dialog open state types
type SubDialog =
  | { kind: "question"; item: Omit<ProjectQuestion, "id" | "analysisId"> }
  | { kind: "error"; item: Omit<ProjectError, "id" | "analysisId"> }
  | { kind: "compensator"; item: Omit<ProjectCompensator, "id" | "analysisId"> }
  | { kind: "answer"; item: Omit<ProjectAnswer, "id" | "analysisId"> }
  | { kind: "problem"; item: Omit<ProjectProblem, "id" | "analysisId"> }
  | { kind: "file"; item: Omit<AttachFileToProject, "id" | "analysisId" | "feedbackId" | "flagId" | "articleId"> };

type CtxMenu = { x: number; y: number; tab: Tab; rowIndex: number };

const readonlyInput: React.CSSProperties = {
  width: "100%",
  height: 32,
  border: `1px solid ${C.grey78}`,
  borderRadius: 4,
  padding: "0 11px",
  fontSize: "12.2px",
  fontFamily: "inherit",
  color: C.grey38,
  background: C.grey96,
  boxSizing: "border-box",
  outline: "none",
  cursor: "default",
};

function CmdSep() {
  return (
    <div
      style={{
        width: 1,
        height: 20,
        background: C.grey88,
        flexShrink: 0,
        margin: "0 8px",
      }}
    />
  );
}

function FormRow({
  label,
  children,
  alignTop = false,
}: {
  label: string;
  children: React.ReactNode;
  alignTop?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: alignTop ? "flex-start" : "center",
      }}
    >
      <div
        style={{
          width: LABEL_W,
          minWidth: LABEL_W,
          fontSize: "11.8px",
          fontWeight: 400,
          color: C.grey11,
          lineHeight: "14px",
          paddingTop: alignTop ? 9 : 0,
          flexShrink: 0,
        }}
      >
        {label}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: C.grey38,
        letterSpacing: "0.6px",
        textTransform: "uppercase",
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

function Divider() {
  return (
    <div
      style={{ height: 1, background: C.grey88, margin: "14px 0", flexShrink: 0 }}
    />
  );
}

function EmptyList({ label, onContextMenu }: { label: string; onContextMenu?: (e: React.MouseEvent) => void }) {
  return (
    <div
      onContextMenu={onContextMenu ? (e) => { e.preventDefault(); onContextMenu(e); } : undefined}
      style={{
        padding: "32px 0",
        textAlign: "center",
        color: C.grey38,
        fontSize: "11.8px",
      }}
    >
      No {label} recorded.
    </div>
  );
}

// Interactive sub-table with right-click support
function SubTable({
  cols,
  rows,
  onRowContextMenu,
  selectedRow,
}: {
  cols: string[];
  rows: (string | undefined)[][];
  onRowContextMenu?: (e: React.MouseEvent, idx: number) => void;
  selectedRow?: number | null;
}) {
  if (rows.length === 0) return null;
  const colW = `${Math.floor(100 / cols.length)}%`;
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        tableLayout: "fixed",
        fontSize: "12px",
      }}
    >
      <thead>
        <tr
          style={{
            background: C.grey96,
            borderBottom: `1px solid ${C.grey88}`,
          }}
        >
          {cols.map((c) => (
            <th
              key={c}
              style={{
                width: colW,
                padding: "6px 10px",
                textAlign: "left",
                fontWeight: 600,
                color: C.grey38,
                fontSize: "11.2px",
              }}
            >
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr
            key={i}
            onContextMenu={onRowContextMenu ? (e) => { e.preventDefault(); onRowContextMenu(e, i); } : undefined}
            style={{
              borderBottom: `1px solid ${C.grey88}`,
              background: selectedRow === i ? C.iconBg : i % 2 === 0 ? C.white : C.grey96,
              cursor: onRowContextMenu ? "context-menu" : "default",
            }}
          >
            {row.map((cell, j) => (
              <td
                key={j}
                style={{
                  padding: "6px 10px",
                  color: C.grey11,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {cell || "—"}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TabContent({
  tab,
  analysis,
  panelView,
  onRowContextMenu,
  ctxMenu,
}: {
  tab: Tab;
  analysis: ProjectAnalysis;
  panelView: PanelView;
  onRowContextMenu: (e: React.MouseEvent, idx: number, tab: Tab) => void;
  ctxMenu: CtxMenu | null;
}) {
  if (tab === "Analysis") {
    const showEntity = panelView === "both" || panelView === "entityOnly";
    const showAnalysis = panelView === "both" || panelView === "analysisOnly";
    return (
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {showEntity && (
          <>
            <SectionLabel>Entity Under Analysis</SectionLabel>
            <div
              style={{
                minHeight: 64,
                maxHeight: 120,
                overflowY: "auto",
                border: `1px solid ${C.grey78}`,
                borderRadius: 4,
                padding: "8px 11px",
                fontSize: "12.2px",
                fontFamily: "inherit",
                color: C.grey11,
                background: C.grey96,
                lineHeight: "20px",
              }}
              dangerouslySetInnerHTML={{ __html: analysis.entityUnderAnalysis || "" }}
            />
          </>
        )}

        {showEntity && showAnalysis && <Divider />}

        {showAnalysis && (
          <>
            <SectionLabel>Analysis Details</SectionLabel>

            <FormRow label="From Person">
              <input style={readonlyInput} value={analysis.fromPerson || "—"} readOnly />
            </FormRow>
            <FormRow label="Analysis Subject">
              <input
                style={readonlyInput}
                value={analysis.analysisSubject || "—"}
                readOnly
              />
            </FormRow>
            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
              <div
                style={{
                  width: LABEL_W,
                  minWidth: LABEL_W,
                  fontSize: "11.8px",
                  color: C.grey11,
                  flexShrink: 0,
                }}
              >
                Analysis Date
              </div>
              <input
                style={{ ...readonlyInput, flex: 1 }}
                value={formatDisplayDate(analysis.analysisDate) || "—"}
                readOnly
              />
              <div
                style={{
                  width: 100,
                  minWidth: 100,
                  fontSize: "11.8px",
                  color: C.grey11,
                  textAlign: "right",
                  paddingRight: 12,
                  flexShrink: 0,
                }}
              >
                Analysis Time
              </div>
              <input
                style={{ ...readonlyInput, width: 110, flex: "0 0 110px" }}
                value={analysis.analysisTime || "—"}
                readOnly
              />
            </div>

            <Divider />

            <FormRow label="Actual Analysis" alignTop>
              <div
                style={{
                  minHeight: 100,
                  border: `1px solid ${C.grey78}`,
                  borderRadius: 4,
                  padding: "8px 11px",
                  fontSize: "12.2px",
                  fontFamily: "inherit",
                  color: C.grey11,
                  background: C.grey96,
                  lineHeight: "20px",
                  overflowY: "auto",
                }}
                dangerouslySetInnerHTML={{ __html: analysis.actualAnalysis || "" }}
              />
            </FormRow>
          </>
        )}
      </div>
    );
  }

  if (tab === "Questions") {
    const rows = (analysis.questions ?? []).map((q) => [
      q.entityQuestionPointTo ?? "",
      q.actualQuestion?.replace(/<[^>]+>/g, "") ?? "",
      formatDisplayDate(q.questionDate) ?? "",
      q.questionTime ?? "",
    ]);
    return (
      <div style={{ flex: 1, overflowY: "auto" }}>
        {rows.length === 0 ? (
          <EmptyList label="questions" onContextMenu={(e) => onRowContextMenu(e, -1, "Questions")} />
        ) : (
          <SubTable
            cols={["Entity Question Point To", "Actual Question", "Date", "Time"]}
            rows={rows}
            onRowContextMenu={(e, i) => onRowContextMenu(e, i, "Questions")}
            selectedRow={ctxMenu?.tab === "Questions" ? ctxMenu.rowIndex : null}
          />
        )}
      </div>
    );
  }

  if (tab === "Errors") {
    const rows = (analysis.errors ?? []).map((e) => [
      e.actualError ?? "",
      e.fromActualCommunication ?? "",
      e.entityErrorPointTo ?? "",
      formatDisplayDate(e.errorDate) ?? "",
    ]);
    return (
      <div style={{ flex: 1, overflowY: "auto" }}>
        {rows.length === 0 ? (
          <EmptyList label="errors" onContextMenu={(e) => onRowContextMenu(e, -1, "Errors")} />
        ) : (
          <SubTable
            cols={["Actual Error", "From Application", "Entity Error Point To", "Date"]}
            rows={rows}
            onRowContextMenu={(e, i) => onRowContextMenu(e, i, "Errors")}
            selectedRow={ctxMenu?.tab === "Errors" ? ctxMenu.rowIndex : null}
          />
        )}
      </div>
    );
  }

  if (tab === "Compensators") {
    const rows = (analysis.compensators ?? []).map((c) => [
      c.actualCompensator ?? "",
      c.actualErrorReplaced ?? "",
      c.inActualCommunication ?? "",
      formatDisplayDate(c.compensatorDate) ?? "",
    ]);
    return (
      <div style={{ flex: 1, overflowY: "auto" }}>
        {rows.length === 0 ? (
          <EmptyList label="compensators" onContextMenu={(e) => onRowContextMenu(e, -1, "Compensators")} />
        ) : (
          <SubTable
            cols={["Actual Compensator", "Error Replaced", "In Application", "Date"]}
            rows={rows}
            onRowContextMenu={(e, i) => onRowContextMenu(e, i, "Compensators")}
            selectedRow={ctxMenu?.tab === "Compensators" ? ctxMenu.rowIndex : null}
          />
        )}
      </div>
    );
  }

  if (tab === "Answers") {
    const rows = (analysis.answers ?? []).map((a) => [
      a.actualQuestion?.replace(/<[^>]+>/g, "") ?? "",
      a.actualAnswer?.replace(/<[^>]+>/g, "") ?? "",
      formatDisplayDate(a.answerDate) ?? "",
    ]);
    return (
      <div style={{ flex: 1, overflowY: "auto" }}>
        {rows.length === 0 ? (
          <EmptyList label="answers" onContextMenu={(e) => onRowContextMenu(e, -1, "Answers")} />
        ) : (
          <SubTable
            cols={["Actual Question", "Actual Answer", "Date"]}
            rows={rows}
            onRowContextMenu={(e, i) => onRowContextMenu(e, i, "Answers")}
            selectedRow={ctxMenu?.tab === "Answers" ? ctxMenu.rowIndex : null}
          />
        )}
      </div>
    );
  }

  if (tab === "Problems") {
    const rows = (analysis.problems ?? []).map((p) => [
      String(p.problemNumber ?? ""),
      p.actualProblem ?? "",
      p.problemName ?? "",
      p.fromActualError ?? "",
      formatDisplayDate(p.problemDate) ?? "",
    ]);
    return (
      <div style={{ flex: 1, overflowY: "auto" }}>
        {rows.length === 0 ? (
          <EmptyList label="problems" onContextMenu={(e) => onRowContextMenu(e, -1, "Problems")} />
        ) : (
          <SubTable
            cols={["Problem #", "Actual Problem", "Problem Name", "From Actual Error", "Date"]}
            rows={rows}
            onRowContextMenu={(e, i) => onRowContextMenu(e, i, "Problems")}
            selectedRow={ctxMenu?.tab === "Problems" ? ctxMenu.rowIndex : null}
          />
        )}
      </div>
    );
  }

  if (tab === "Attached Files") {
    const rows = (analysis.files ?? []).map((f) => [
      f.fileName ?? "",
      f.fileType ?? "",
      formatDisplayDate(f.fileDate) ?? "",
      f.fileSize ?? "",
    ]);
    return (
      <div style={{ flex: 1, overflowY: "auto" }}>
        {rows.length === 0 ? (
          <EmptyList label="attached files" onContextMenu={(e) => onRowContextMenu(e, -1, "Attached Files")} />
        ) : (
          <SubTable
            cols={["File Name", "Type", "Date", "Size"]}
            rows={rows}
            onRowContextMenu={(e, i) => onRowContextMenu(e, i, "Attached Files")}
            selectedRow={ctxMenu?.tab === "Attached Files" ? ctxMenu.rowIndex : null}
          />
        )}
      </div>
    );
  }

  return null;
}

export function ViewAnalysisDialog({ analysis, onClose, onApply, onProvide, feedbacks, onEdit }: Props) {
  const { pos, onHeaderMouseDown } = useDraggable();
  const [activeTab, setActiveTab] = useState<Tab>("Analysis");
  const [panelView, setPanelView] = useState<PanelView>("both");

  // Toggle info: for Delete / Edit / Analyze (click to open, click again to close)
  const [toggleInfo, setToggleInfo] = useState<InfoKey | null>(null);

  // Flow info: sequential messages for Apply / Provide / Flag
  const [flowMsgs, setFlowMsgs] = useState<Array<{ title: string; text: string }>>([]);
  const [closeOnFlowDone, setCloseOnFlowDone] = useState(false);
  // postFlowAction: navigate after flow completes (apply/provide for retained analyses)
  const [postFlowAction, setPostFlowAction] = useState<"apply" | "provide" | null>(null);
  // Which flow button is highlighted
  const [flowKey, setFlowKey] = useState<"apply" | "provide" | "flag" | null>(null);

  const [pendingEditConfirm, setPendingEditConfirm] = useState(false);
  const [showModel, setShowModel] = useState(false);
  const [openEntityDd, setOpenEntityDd] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
  const [subDialog, setSubDialog] = useState<SubDialog | null>(null);

  // The message currently displayed (flow takes priority over toggle)
  const currentInfo: { title: string; text: string } | null =
    flowMsgs.length > 0 ? flowMsgs[0] : toggleInfo ? INFO[toggleInfo] : null;

  const handleInfoClose = useCallback(() => {
    if (flowMsgs.length > 0) {
      const remaining = flowMsgs.slice(1);
      setFlowMsgs(remaining);
      if (remaining.length === 0) {
        const action = postFlowAction;
        setFlowKey(null);
        setPostFlowAction(null);
        if (action === "apply") {
          onClose();
          onApply?.();
          return;
        }
        if (action === "provide") {
          onClose();
          onProvide?.();
          return;
        }
        if (closeOnFlowDone) {
          setCloseOnFlowDone(false);
          onClose();
        }
      }
    } else {
      setToggleInfo(null);
    }
  }, [flowMsgs, closeOnFlowDone, postFlowAction, onClose, onApply, onProvide]);

  const toggle = useCallback((key: InfoKey) => {
    setFlowMsgs([]);
    setFlowKey(null);
    setPostFlowAction(null);
    setToggleInfo((p) => (p === key ? null : key));
  }, []);

  const handleApply = useCallback(() => {
    const w = analysis.whatToDoWithAnalysis;
    const canApply = w === "RetainAnalysisAsNeed" || w === "ProvideFeedbackWithAnalysis";
    // Show the apply message; if retained, navigate after dismissal
    const msgs = canApply ? [INFO.apply] : [INFO.apply, INFO.applyNotRetained];
    setToggleInfo(null);
    setPostFlowAction(canApply ? "apply" : null);
    setCloseOnFlowDone(false);
    setFlowKey("apply");
    setFlowMsgs(msgs);
  }, [analysis.whatToDoWithAnalysis]);

  const handleProvide = useCallback(() => {
    const canProvide = analysis.whatToDoWithAnalysis === "RetainAnalysisAsNeed";
    const msgs = canProvide ? [INFO.provide] : [INFO.provide, INFO.provideNotRetained];
    setToggleInfo(null);
    setPostFlowAction(canProvide ? "provide" : null);
    setCloseOnFlowDone(false);
    setFlowKey("provide");
    setFlowMsgs(msgs);
  }, [analysis.whatToDoWithAnalysis]);

  const handleFlag = useCallback(() => {
    setToggleInfo(null);
    setCloseOnFlowDone(true);
    setFlowKey("flag");
    setFlowMsgs([INFO.flag, INFO.flagged]);
  }, []);

  const handleRowContextMenu = useCallback(
    (e: React.MouseEvent, idx: number, tab: Tab) => {
      e.preventDefault();
      setCtxMenu({ x: e.clientX, y: e.clientY, tab, rowIndex: idx });
    },
    []
  );

  const openSubDialog = useCallback(() => {
    if (!ctxMenu) return;
    const { tab, rowIndex } = ctxMenu;
    setCtxMenu(null);
    if (tab === "Questions") {
      const item = analysis.questions?.[rowIndex];
      if (item) setSubDialog({ kind: "question", item });
    } else if (tab === "Errors") {
      const item = analysis.errors?.[rowIndex];
      if (item) setSubDialog({ kind: "error", item });
    } else if (tab === "Compensators") {
      const item = analysis.compensators?.[rowIndex];
      if (item) setSubDialog({ kind: "compensator", item });
    } else if (tab === "Answers") {
      const item = analysis.answers?.[rowIndex];
      if (item) setSubDialog({ kind: "answer", item });
    } else if (tab === "Problems") {
      const item = analysis.problems?.[rowIndex];
      if (item) setSubDialog({ kind: "problem", item });
    } else if (tab === "Attached Files") {
      const item = analysis.files?.[rowIndex];
      if (item) setSubDialog({ kind: "file", item });
    }
  }, [ctxMenu, analysis]);

  const buildContextMenuItems = useCallback((tab: Tab, rowIndex: number): PanelMenuEntry[] => {
    const hasRow = rowIndex >= 0;
    const viewAction = { label: "", onClick: openSubDialog, disabled: !hasRow };
    switch (tab) {
      case "Questions":
        return [
          { label: "Add Analysis Question", onClick: () => {}, disabled: true },
          { label: "Respond To Analysis Question", onClick: () => {}, disabled: true },
          { label: "Remove Analysis Question", onClick: () => {}, disabled: true },
          { isSep: true },
          { ...viewAction, label: "View Analysis Question" },
        ];
      case "Errors":
        return [
          { label: "Add Error", onClick: () => {}, disabled: true },
          { label: "Remove Error", onClick: () => {}, disabled: true },
          { isSep: true },
          { ...viewAction, label: "View Error" },
        ];
      case "Compensators":
        return [
          { label: "Add Compensator", onClick: () => {}, disabled: true },
          { label: "Remove Compensator", onClick: () => {}, disabled: true },
          { isSep: true },
          { ...viewAction, label: "View Compensator" },
        ];
      case "Answers":
        return [{ ...viewAction, label: "View Answer" }];
      case "Problems":
        return [
          { label: "Add Identify Problem", onClick: () => {}, disabled: true },
          { label: "Response To Identify Problem", onClick: () => {}, disabled: true },
          { label: "Remove Identify Problem", onClick: () => {}, disabled: true },
          { isSep: true },
          { ...viewAction, label: "View Identify Problem" },
        ];
      case "Attached Files":
        return [
          { label: "Add File", onClick: () => {}, disabled: true },
          { label: "Remove File", onClick: () => {}, disabled: true },
          { isSep: true },
          { ...viewAction, label: "View File Info" },
        ];
      default:
        return [];
    }
  }, [openSubDialog]);

  const entityDropdown: CmdDropdownDef = useMemo(() => ({
    id: "entity",
    iconSrc: "assets/icons/entity-under-analysis.svg",
    title: "Entity Under Analysis",
    items: [
      { label: "Hide Entity Under Analysis", iconSrc: "assets/icons/hide-entity-under-analysis.svg", enabled: panelView !== "analysisOnly", onClick: () => { setPanelView("analysisOnly"); setOpenEntityDd(false); } },
      { label: "Show Entity Under Analysis", iconSrc: "assets/icons/entity-under-analysis.svg", enabled: panelView !== "both", onClick: () => { setPanelView("both"); setOpenEntityDd(false); } },
      { label: "Show Analysis Only", iconSrc: "assets/icons/analysis.svg", enabled: panelView !== "analysisOnly", onClick: () => { setPanelView("analysisOnly"); setOpenEntityDd(false); } },
      { label: "Show Entity Under Analysis Only", iconSrc: "assets/icons/show-entity-under-analysis-only.svg", enabled: panelView !== "entityOnly", onClick: () => { setPanelView("entityOnly"); setOpenEntityDd(false); } },
    ],
  }), [panelView]);

  return createPortal(
    <>
      {/* Scrim */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.18)",
          zIndex: 199,
        }}
      />

      {/* Dialog */}
      <div
        style={{
          position: "fixed",
          left: `calc(50% + ${pos.x}px)`,
          top: `calc(50% + ${pos.y}px)`,
          transform: "translate(-50%, -50%)",
          width: 900,
          maxWidth: "96vw",
          height: 600,
          maxHeight: "90vh",
          zIndex: 200,
          display: "flex",
          flexDirection: "column",
          background: C.white,
          boxShadow:
            "0px 8px 32px rgba(0,0,0,0.14), 0px 2px 8px rgba(0,0,0,0.06)",
          borderRadius: 8,
          overflow: "hidden",
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
        }}
      >
        {/* ── Header (77.59px) ── */}
        <div
          onMouseDown={onHeaderMouseDown}
          style={{
            height: 77.59,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
            gap: 12,
            cursor: "grab",
            userSelect: "none",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: C.iconBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AnalysisHistoryHeaderIcon />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: "15.5px",
                fontWeight: 700,
                color: C.grey11,
                letterSpacing: "-0.1px",
                lineHeight: "21px",
              }}
            >
              View Selected Analysis
            </div>
            <div
              style={{
                fontSize: "11.1px",
                color: C.grey38,
                lineHeight: "17px",
                marginTop: 2,
              }}
            >
              View the analysis details, questions, errors, compensators, answers, and attached files.
            </div>
          </div>
          <button
            className="sl-close-btn"
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              flexShrink: 0,
              padding: 0,
            }}
            title="Close"
          >
            <CloseIcon />
          </button>
        </div>

        {/* ── Command bar (44px) ── */}
        <div
          style={{
            height: 44,
            flexShrink: 0,
            background: C.grey96,
            display: "flex",
            alignItems: "center",
            padding: "0 12px",
            position: "relative",
          }}
        >
          {/* Delete */}
          <button
            className="sl-icon-btn"
            onClick={() => toggle("delete")}
            title="Delete Analysis"
            style={{
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: toggleInfo === "delete" ? C.iconBg : "transparent",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              padding: 0,
              flexShrink: 0,
            }}
          >
            <DeleteSelectedIcon />
          </button>

          {/* Edit */}
          <button
            className="sl-icon-btn"
            onClick={() => {
              const isRetained = analysis.whatToDoWithAnalysis === "RetainAnalysisAsNeed";
              const hasFeedback = (feedbacks ?? []).some((f) => f.analysisId === analysis.id);
              if (isRetained && !hasFeedback) {
                setPendingEditConfirm(true);
              } else {
                toggle("editBlocked");
              }
            }}
            title="Edit This Analysis"
            style={{
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: toggleInfo === "editBlocked" ? C.iconBg : "transparent",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              padding: 0,
              flexShrink: 0,
            }}
          >
            <EditSelectedAnalysisIcon />
          </button>

          <CmdSep />

          {/* Apply as Feedback */}
          <button
            className="sl-icon-btn"
            onClick={handleApply}
            title="Apply Analysis as Feedback"
            style={{
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: flowKey === "apply" ? C.iconBg : "transparent",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              padding: 0,
              flexShrink: 0,
            }}
          >
            <ApplySelFbMenuIcon />
          </button>

          {/* Provide Feedback */}
          <button
            className="sl-icon-btn"
            onClick={handleProvide}
            title="Provide Feedback With Analysis"
            style={{
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: flowKey === "provide" ? C.iconBg : "transparent",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              padding: 0,
              flexShrink: 0,
            }}
          >
            <ProvideFeedbackAnalysisIcon />
          </button>

          <CmdSep />

          {/* Flag as Communication */}
          <button
            className="sl-icon-btn"
            onClick={handleFlag}
            title="Flag Analysis as Communication"
            style={{
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: flowKey === "flag" ? C.iconBg : "transparent",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              padding: 0,
              flexShrink: 0,
            }}
          >
            <FlagAnalysisCommunicationIcon />
          </button>

          {/* Analyze Analysis */}
          <button
            className="sl-icon-btn"
            onClick={() => toggle("analyze")}
            title="Analyze Analysis"
            style={{
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: toggleInfo === "analyze" ? C.iconBg : "transparent",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              padding: 0,
              flexShrink: 0,
            }}
          >
            <AnalyzeSelectionCmdIcon />
          </button>

          {/* View Analysis Model */}
          <button
            className="sl-icon-btn"
            onClick={() => setShowModel(true)}
            title="View Analysis Model"
            style={{
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              padding: 0,
              flexShrink: 0,
            }}
          >
            <FeedbackModelIcon color={C.grey38} />
          </button>

          <CmdSep />

          {/* Entity Under Analysis dropdown — mirrors AnalyzeView entity CommandDropdown */}
          <CommandDropdown
            def={entityDropdown}
            open={openEntityDd}
            onToggle={() => setOpenEntityDd((p) => !p)}
            onClose={() => setOpenEntityDd(false)}
          />
        </div>

        {/* ── Tab bar (36px) ── */}
        <div
          style={{
            height: 36,
            flexShrink: 0,
            background: C.white,
            display: "flex",
            alignItems: "flex-end",
            paddingLeft: 20,
            borderBottom: `1px solid ${C.grey88}`,
          }}
        >
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => { setActiveTab(t); setCtxMenu(null); }}
              style={{
                position: "relative",
                height: 36,
                padding: "0 12px",
                display: "flex",
                alignItems: "center",
                fontSize: "12px",
                fontWeight: activeTab === t ? 700 : 400,
                color: activeTab === t ? C.grey11 : C.grey38,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {t}
              {activeTab === t && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: C.blue,
                    borderRadius: "1px 1px 0 0",
                  }}
                />
              )}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <TabContent
            tab={activeTab}
            analysis={analysis}
            panelView={panelView}
            onRowContextMenu={handleRowContextMenu}
            ctxMenu={ctxMenu}
          />
        </div>

        {/* ── Edit confirm overlay ── */}
        {pendingEditConfirm && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: C.white, border: `1px solid ${C.grey78}`, borderRadius: 6, padding: "20px 24px", maxWidth: 420, boxShadow: "0px 4px 16px rgba(0,0,0,0.12)", fontFamily: "inherit" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.grey11, marginBottom: 10 }}>Edit Analysis Message</div>
              <div style={{ fontSize: 12, color: C.grey38, lineHeight: "18px", marginBottom: 18 }}>
                Since the analysis has not been applied or provided as feedback, it is ok to make changes to it. Do you want to edit the analysis?
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button
                  onClick={() => setPendingEditConfirm(false)}
                  style={{ height: 28, padding: "0 16px", background: C.white, border: `1px solid ${C.grey78}`, borderRadius: 4, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
                >
                  No
                </button>
                <button
                  onClick={() => {
                    setPendingEditConfirm(false);
                    const id = analysis.id;
                    if (id !== undefined) {
                      onClose();
                      onEdit?.(id as number);
                    }
                  }}
                  style={{ height: 28, padding: "0 16px", background: C.blue, border: "none", borderRadius: 4, fontSize: 12, fontWeight: 700, color: C.white, cursor: "pointer", fontFamily: "inherit" }}
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Floating info card (inside dialog) ── */}
        {currentInfo && (
          <InfoMessageCard
            title={currentInfo.title}
            text={currentInfo.text}
            onClose={handleInfoClose}
          />
        )}
      </div>

      {/* ── Context menu — rendered as portal sibling (outside transform div) ── */}
      {ctxMenu && (
        <PanelContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          onClose={() => setCtxMenu(null)}
          items={buildContextMenuItems(ctxMenu.tab, ctxMenu.rowIndex)}
          width={ctxMenu.tab === "Questions" || ctxMenu.tab === "Problems" ? 260 : 220}
        />
      )}

      {/* ── Sub-view dialogs — zIndexBase 300 so they stack above this dialog ── */}
      {subDialog?.kind === "question" && (
        <ViewQuestionDialog
          question={subDialog.item}
          onClose={() => setSubDialog(null)}
          zIndexBase={300}
        />
      )}
      {subDialog?.kind === "error" && (
        <ViewErrorDialog
          error={subDialog.item}
          onClose={() => setSubDialog(null)}
          zIndexBase={300}
        />
      )}
      {subDialog?.kind === "compensator" && (
        <ViewCompensatorDialog
          compensator={subDialog.item}
          onClose={() => setSubDialog(null)}
          zIndexBase={300}
        />
      )}
      {subDialog?.kind === "answer" && (
        <ViewAnswerDialog
          answer={subDialog.item}
          onClose={() => setSubDialog(null)}
          zIndexBase={300}
        />
      )}
      {subDialog?.kind === "problem" && (
        <ViewProblemDialog
          problem={subDialog.item}
          onClose={() => setSubDialog(null)}
          zIndexBase={300}
        />
      )}
      {subDialog?.kind === "file" && (
        <ViewFileInformationDialog
          file={subDialog.item}
          onClose={() => setSubDialog(null)}
          zIndexBase={300}
        />
      )}

      {showModel && (
        <AnalysisModelDialog
          analysis={analysis}
          onClose={() => setShowModel(false)}
          zIndexBase={300}
        />
      )}
    </>,
    document.body
  );
}
