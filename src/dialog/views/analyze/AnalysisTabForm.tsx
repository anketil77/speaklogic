// src/dialog/views/sub/AnalysisTabForm.tsx
import React, { useLayoutEffect, useRef, useState } from "react";
import { makeStyles } from "@fluentui/react-components";
import { RichEditor } from "@/dialog/components/RichEditor";
import { colors } from "@/styles/tokens";

const useStyles = makeStyles({
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
  peopleList: string[];
  fromPerson: string;
  onFromPersonChange: (v: string) => void;
  analysisSubject: string;
  onAnalysisSubjectChange: (v: string) => void;
  actualAnalysis: string;
  onActualAnalysisChange: (html: string) => void;
  editorRef: React.RefObject<HTMLDivElement>;
  onContextMenuQuestion?: (selectedText: string, range: Range | null) => void;
  onContextMenuCompensator?: (selectedText: string, range: Range | null) => void;
  onContextMenuGuideline?: (range: Range | null) => void;
  onContextMenuInsertToDocument?: (selectedText: string, html: string) => void;
}

function getSelectionHtml(sel: Selection | null): string {
  if (!sel || sel.rangeCount === 0) return "";
  const range = sel.getRangeAt(0);
  const fragment = range.cloneContents();
  const wrapper = document.createElement("div");
  wrapper.appendChild(fragment);
  return wrapper.innerHTML;
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
  peopleList,
  fromPerson,
  onFromPersonChange,
  analysisSubject,
  onAnalysisSubjectChange,
  actualAnalysis,
  onActualAnalysisChange,
  editorRef,
  onContextMenuQuestion,
  onContextMenuCompensator,
  onContextMenuGuideline,
  onContextMenuInsertToDocument,
}: AnalysisTabFormProps) {
  const styles = useStyles();
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; text: string; html: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const compensatorRangeRef = useRef<Range | null>(null);
  const questionRangeRef = useRef<Range | null>(null);
  const guidelineRangeRef = useRef<Range | null>(null);

  // After the menu mounts, clamp its position so it stays inside the viewport.
  // Office dialogs have a small viewport, so a long menu near the bottom-right
  // (raw clientX/Y from the right-click event) easily overflows.
  useLayoutEffect(() => {
    if (!ctxMenu || !menuRef.current) return;
    const el = menuRef.current;
    const rect = el.getBoundingClientRect();
    const margin = 8;
    let x = ctxMenu.x;
    let y = ctxMenu.y;
    if (x + rect.width + margin > window.innerWidth) {
      x = Math.max(margin, window.innerWidth - rect.width - margin);
    }
    if (y + rect.height + margin > window.innerHeight) {
      // Flip above the cursor first, else clamp to bottom of viewport.
      y = Math.max(margin, ctxMenu.y - rect.height);
    }
    if (x !== ctxMenu.x || y !== ctxMenu.y) setCtxMenu({ ...ctxMenu, x, y });
  }, [ctxMenu]);

  function handleEditorContextMenu(e: React.MouseEvent) {
    if (!onContextMenuQuestion && !onContextMenuCompensator && !onContextMenuGuideline && !onContextMenuInsertToDocument) return;
    e.preventDefault();
    const sel = window.getSelection();
    const text = sel?.toString().trim() ?? "";
    const html = getSelectionHtml(sel);
    const cloned = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0).cloneRange() : null;
    compensatorRangeRef.current = cloned;
    questionRangeRef.current = cloned ? cloned.cloneRange() : null;
    guidelineRangeRef.current = cloned ? cloned.cloneRange() : null;
    setCtxMenu({ x: e.clientX, y: e.clientY, text, html });
  }

  return (
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
            htmlContentStyling
            sanitizeOnPaste
          />
        </div>
      </div>

      {ctxMenu && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 9998 }}
            onClick={() => setCtxMenu(null)}
          />
          <div
            ref={menuRef}
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
                onClick={() => { onContextMenuQuestion(ctxMenu.text, questionRangeRef.current); setCtxMenu(null); }}
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
                onClick={() => { onContextMenuCompensator(ctxMenu.text, compensatorRangeRef.current); setCtxMenu(null); }}
              >
                Identify Selection as Compensator
              </button>
            )}
            {onContextMenuGuideline && (
              <button
                style={{ ...ctxItemStyle, borderTop: "1px solid #E0E0E0" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#F5F5F5"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                onClick={() => { onContextMenuGuideline(guidelineRangeRef.current); setCtxMenu(null); }}
              >
                Insert Analysis Guideline
              </button>
            )}
            {onContextMenuInsertToDocument && (
              <button
                disabled={!ctxMenu.text}
                style={{ ...ctxItemStyle, borderTop: "1px solid #E0E0E0", opacity: ctxMenu.text ? 1 : 0.4, cursor: ctxMenu.text ? "pointer" : "default" }}
                onMouseEnter={(e) => { if (ctxMenu.text) (e.currentTarget as HTMLButtonElement).style.background = "#F5F5F5"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                onClick={() => { onContextMenuInsertToDocument(ctxMenu.text, ctxMenu.html); setCtxMenu(null); }}
              >
                Insert Selected Text to Document
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
}
