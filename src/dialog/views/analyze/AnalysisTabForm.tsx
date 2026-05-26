// src/dialog/views/sub/AnalysisTabForm.tsx
import React, { useState } from "react";
import { makeStyles } from "@fluentui/react-components";
import { ChevronRightRegular } from "@fluentui/react-icons";
import { RichEditor } from "@/dialog/components/RichEditor";
import { colors } from "@/styles/tokens";

const useStyles = makeStyles({
  entityLabelText: {
    display: "block",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.6px",
    textTransform: "uppercase" as const,
    color: colors.grey38,
    lineHeight: "13px",
    marginBottom: "8px",
  },
  entityBox: {
    background: colors.white,
    border: "1px solid #E0E0E0",
    borderRadius: "4px",
    height: "72px",
    display: "flex",
    alignItems: "center",
    padding: "0 12px 0 17px",
    overflow: "hidden",
    marginBottom: "16px",
  },
  entityBoxText: {
    flex: 1,
    fontSize: "16.9px",
    fontWeight: "400",
    lineHeight: "25px",
    color: colors.grey11,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  entityBadge: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    background: colors.grey96,
    border: "1px solid #E0E0E0",
    borderRadius: "12px",
    padding: "0 10px 0 8px",
    height: "21px",
    cursor: "pointer",
    flexShrink: 0,
    marginLeft: "12px",
  },
  entityBadgeText: {
    fontSize: "10.3px",
    fontWeight: "400",
    color: colors.grey38,
    lineHeight: "12px",
  },
  divider: {
    height: "1px",
    background: "#E0E0E0",
    margin: "0 0 16px 0",
  },
  formRow: {
    display: "flex",
    alignItems: "center",
    minHeight: "32px",
    marginBottom: "14px",
  },
  formRowTop: {
    display: "flex",
    alignItems: "flex-start",
    marginBottom: "14px",
  },
  formLabel: {
    width: "120px",
    minWidth: "120px",
    fontSize: "11.8px",
    fontWeight: "700",
    color: colors.grey11,
    lineHeight: "14px",
    flexShrink: 0,
  },
  formLabelTop: {
    width: "120px",
    minWidth: "120px",
    fontSize: "11.6px",
    fontWeight: "700",
    color: colors.grey11,
    lineHeight: "14px",
    flexShrink: 0,
    paddingTop: "9px",
  },
  formField: { flex: 1 },
});

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: "32px",
  border: "1px solid #C7C7C7",
  borderRadius: "4px",
  padding: "0 11px",
  fontSize: "12.2px",
  fontFamily: "inherit",
  color: colors.grey11,
  background: colors.white,
  outline: "none",
  boxSizing: "border-box",
};



export interface AnalysisTabFormProps {
  selection: string;
  peopleList: string[];
  showEntityBox: boolean;
  entityOnlyMode?: boolean;
  fromPerson: string;
  onFromPersonChange: (v: string) => void;
  analysisSubject: string;
  onAnalysisSubjectChange: (v: string) => void;
  actualAnalysis: string;
  onActualAnalysisChange: (html: string) => void;
  editorRef: React.RefObject<HTMLDivElement>;
  onContextMenuQuestion?: (selectedText: string) => void;
  onContextMenuCompensator?: (selectedText: string) => void;
  onContextMenuError?: (selectedText: string) => void;
}

const ctxItemStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "7px 14px",
  textAlign: "left",
  background: "transparent",
  border: "none",
  fontSize: "12.2px",
  fontFamily: "inherit",
  color: "#1B1B1B",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

export function AnalysisTabForm({
  selection,
  peopleList,
  showEntityBox,
  entityOnlyMode = false,
  fromPerson,
  onFromPersonChange,
  analysisSubject,
  onAnalysisSubjectChange,
  actualAnalysis,
  onActualAnalysisChange,
  editorRef,
  onContextMenuQuestion,
  onContextMenuCompensator,
  onContextMenuError,
}: AnalysisTabFormProps) {
  const styles = useStyles();

  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; text: string } | null>(null);
  const [entityCtxMenu, setEntityCtxMenu] = useState<{ x: number; y: number; text: string } | null>(null);

  function handleEntityContextMenu(e: React.MouseEvent) {
    if (!onContextMenuError) return;
    e.preventDefault();
    const text = window.getSelection()?.toString().trim() ?? "";
    setEntityCtxMenu({ x: e.clientX, y: e.clientY, text });
  }

  function handleEditorContextMenu(e: React.MouseEvent) {
    if (!onContextMenuQuestion && !onContextMenuCompensator) return;
    e.preventDefault();
    const text = window.getSelection()?.toString().trim() ?? "";
    setCtxMenu({ x: e.clientX, y: e.clientY, text });
  }

  return (
    <>
      {showEntityBox && (
        <>
          <span className={styles.entityLabelText}>Entity Under Analysis</span>
          <div className={styles.entityBox} onContextMenu={handleEntityContextMenu}>
            <span className={styles.entityBoxText} style={{ userSelect: "text" }}>{selection}</span>
            <span className={styles.entityBadge}>
              <ChevronRightRegular style={{ fontSize: "11px", color: colors.grey38 }} />
              <span className={styles.entityBadgeText}>Preview</span>
            </span>
          </div>
          <div className={styles.divider} />
        </>
      )}

      {!entityOnlyMode && (
        <>
          <div className={styles.formRow}>
            <span className={styles.formLabel}>From Person</span>
            <div className={styles.formField} style={{ position: "relative" }}>
              <select
                style={{ ...inputStyle, cursor: "pointer", padding: "0 32px 0 11px",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23616161' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat", backgroundPosition: "right 11px center",
                  appearance: "none", WebkitAppearance: "none",
                }}
                value={fromPerson}
                onChange={(e) => onFromPersonChange(e.target.value)}
              >
                <option value="">Select person</option>
                {peopleList.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <span className={styles.formLabel}>Analysis Subject</span>
            <div className={styles.formField}>
              <input
                style={inputStyle}
                type="text"
                value={analysisSubject}
                onChange={(e) => onAnalysisSubjectChange(e.target.value)}
                placeholder="Enter analysis subject"
              />
            </div>
          </div>

          <div className={styles.formRowTop}>
            <span className={styles.formLabelTop}>Actual Analysis</span>
            <div className={styles.formField} onContextMenu={handleEditorContextMenu}>
              <RichEditor
                ref={editorRef}
                value={actualAnalysis}
                onChange={onActualAnalysisChange}
                placeholder="Write actual analysis here..."
              />
            </div>
          </div>
        </>
      )}

      {entityCtxMenu && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onClick={() => setEntityCtxMenu(null)} />
          <div
            style={{
              position: "fixed",
              left: entityCtxMenu.x,
              top: entityCtxMenu.y,
              zIndex: 9999,
              background: "#FFFFFF",
              border: "1px solid #E0E0E0",
              borderRadius: 4,
              boxShadow: "0 4px 16px rgba(0,0,0,0.14)",
              minWidth: 220,
              overflow: "hidden",
              fontFamily: "'Inter', 'Segoe UI', sans-serif",
            }}
          >
            {onContextMenuError && (
              <button
                disabled={!entityCtxMenu.text}
                style={{ ...ctxItemStyle, opacity: entityCtxMenu.text ? 1 : 0.4, cursor: entityCtxMenu.text ? "pointer" : "default" }}
                onMouseEnter={(e) => { if (entityCtxMenu.text) (e.currentTarget as HTMLButtonElement).style.background = "#F5F5F5"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                onClick={() => { onContextMenuError(entityCtxMenu.text); setEntityCtxMenu(null); }}
              >
                Identify Selection as Error
              </button>
            )}
          </div>
        </>
      )}

      {ctxMenu && (
        <>
          {/* Backdrop — click outside to dismiss */}
          <div
            style={{ position: "fixed", inset: 0, zIndex: 9998 }}
            onClick={() => setCtxMenu(null)}
          />
          <div
            style={{
              position: "fixed",
              left: ctxMenu.x,
              top: ctxMenu.y,
              zIndex: 9999,
              background: "#FFFFFF",
              border: "1px solid #E0E0E0",
              borderRadius: 4,
              boxShadow: "0 4px 16px rgba(0,0,0,0.14)",
              minWidth: 260,
              overflow: "hidden",
              fontFamily: "'Inter', 'Segoe UI', sans-serif",
            }}
          >
            {onContextMenuQuestion && (
              <button
                disabled={!ctxMenu.text}
                style={{ ...ctxItemStyle, opacity: ctxMenu.text ? 1 : 0.4, cursor: ctxMenu.text ? "pointer" : "default" }}
                onMouseEnter={(e) => { if (ctxMenu.text) (e.currentTarget as HTMLButtonElement).style.background = "#F5F5F5"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                onClick={() => { onContextMenuQuestion(ctxMenu.text); setCtxMenu(null); }}
              >
                Identify Selection as Analysis Question
              </button>
            )}
            {onContextMenuCompensator && (
              <button
                disabled={!ctxMenu.text}
                style={{ ...ctxItemStyle, opacity: ctxMenu.text ? 1 : 0.4, cursor: ctxMenu.text ? "pointer" : "default" }}
                onMouseEnter={(e) => { if (ctxMenu.text) (e.currentTarget as HTMLButtonElement).style.background = "#F5F5F5"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                onClick={() => { onContextMenuCompensator(ctxMenu.text); setCtxMenu(null); }}
              >
                Identify Selection as Compensator
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
}
