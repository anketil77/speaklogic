// src/dialog/components/InterpretePrincipleDialog.tsx
// Inline portal dialog for interpreting an identified principle.
// C# original: InterpretePrinciple.cs (opened from ListIdentifiedPrinciple "Interpret").

import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { FooterBar, FooterHelperText, DismissBtn, PrimaryBtn } from "@/dialog/components/FooterButtons";
import ReactDOM from "react-dom";
import { RichTextToolbar } from "@/dialog/components/RichTextToolbar";
import { PanelTable, type PanelTableCol } from "@/dialog/components/PanelTable";
import { useDraggable } from "@/dialog/hooks/useDraggable";
import { AttachFileDialog } from "@/dialog/components/AttachFileDialog";
import {
  InterpretePrincipleHeaderIcon,
  ListInterpretedCmdIcon,
  ListIdentifiedCmdIcon,
} from "@/dialog/components/Icons";
import type {
  AttachFileToProject,
  PrincipleInSelection,
  SaveInterpretationPayload,
} from "@/types/db";

interface Props {
  /** The identified principle being interpreted (carries name + set). */
  principle: PrincipleInSelection;
  /** Pre-fills "Person Interpreted" (Communication Config person name). */
  defaultPerson?: string;
  sendMessage: (msg: unknown) => void;
  onClose: () => void;
  onListIdentified?: () => void;
  onListInterpreted?: () => void;
}

type TabId = "interpretation" | "comm-principle" | "files";

const TABS: { id: TabId; label: string }[] = [
  { id: "interpretation", label: "About Principle Interpretation" },
  { id: "comm-principle", label: "About Communication Principle" },
  { id: "files", label: "Attached Files" },
];

const FILE_COLUMNS: PanelTableCol<AttachFileToProject>[] = [
  { header: "File Name", width: "28%", render: (f) => f.fileName || "—", truncate: true },
  { header: "File Type", width: "15%", render: (f) => f.fileType || "—" },
  { header: "File Date", width: "17%", render: (f) => f.fileDate || "—" },
  { header: "File Time", width: "15%", render: (f) => f.fileTime || "—" },
  { header: "File Size", width: "15%", render: (f) => f.fileSize || "—" },
];

// C# verbatim validation messages (InterpretePrinciple.cs barButtonInterpretPrinciple_ItemClick).
const MSG_INTERPRETATION =
  "A principle is identified; a principle is interpreted.  As a principle dependent entity, it is not possible for us to work with a principle without interpreting it.  The result of the interpretation is the actual interpretation of the identified principle.  Here I need to provide my interpretation of the actual principle.";
const MSG_COMM_PRINCIPLE =
  "The relationship of an identified principle with the principle of communication enables that principle to exist with the existence of the principle of communication.  A principle does not exist without the principle of communication.  Here I will to identify the principle of communication that is a part to that principle or attaches to it.";
const MSG_COMM_DESC = "Here I need to provide a description of the communication principle";

const C = {
  blue: "#0078D4",
  blueHover: "#106EBE",
  grey11: "#1B1B1B",
  grey38: "#616161",
  grey78: "#C7C7C7",
  grey88: "#E0E0E0",
  grey96: "#F5F5F5",
  iconBg: "#EBF3FC",
  white: "#FFFFFF",
} as const;

function CmdSep() {
  return <div style={{ width: 1, height: 20, background: C.grey88, flexShrink: 0 }} />;
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
      <label
        style={{ minWidth: 180, fontSize: 12.2, color: C.grey11, paddingTop: 8, flexShrink: 0, lineHeight: "16px" }}
      >
        {label}
      </label>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  boxSizing: "border-box",
  width: "100%",
  height: 32,
  border: `1px solid ${C.grey78}`,
  borderRadius: 4,
  padding: "0 10px",
  fontSize: "12.2px",
  fontFamily: "inherit",
  color: C.grey11,
  background: C.white,
  outline: "none",
};

const readonlyInputStyle: React.CSSProperties = {
  ...inputStyle,
  background: C.grey96,
  color: C.grey38,
};

const editorStyle: React.CSSProperties = {
  border: `1px solid ${C.grey78}`,
  borderRadius: 4,
  padding: "8px 10px",
  minHeight: 110,
  fontSize: 12.2,
  lineHeight: "20px",
  color: C.grey11,
  fontFamily: "inherit",
  outline: "none",
  cursor: "text",
  overflow: "auto",
};

export function InterpretePrincipleDialog({
  principle,
  defaultPerson,
  sendMessage,
  onClose,
  onListIdentified,
  onListInterpreted,
}: Props) {
  const { pos, onHeaderMouseDown } = useDraggable();
  const [activeTab, setActiveTab] = useState<TabId>("interpretation");

  const [personInterpreted, setPersonInterpreted] = useState(defaultPerson ?? "");
  const [communicationPrinciple, setCommunicationPrinciple] = useState("");

  const interpretationRef = useRef<HTMLDivElement>(null);
  const commPrincipleDescRef = useRef<HTMLDivElement>(null);
  const [activeEditor, setActiveEditor] = useState<React.RefObject<HTMLDivElement>>(interpretationRef);

  const [files, setFiles] = useState<AttachFileToProject[]>([]);
  const [fileMenuIndex, setFileMenuIndex] = useState<number | null>(null);
  const [pendingRemove, setPendingRemove] = useState<number | null>(null);
  const [viewFileInfo, setViewFileInfo] = useState<AttachFileToProject | null>(null);
  const [showAddFile, setShowAddFile] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitHover, setSubmitHover] = useState(false);

  useEffect(() => {
    if (defaultPerson) setPersonInterpreted(defaultPerson);
  }, [defaultPerson]);

  const handleTabClick = useCallback((id: TabId) => {
    setActiveTab(id);
    setFileMenuIndex(null);
    setPendingRemove(null);
    setErrorMsg(null);
    if (id === "interpretation") setActiveEditor(interpretationRef);
    else if (id === "comm-principle") setActiveEditor(commPrincipleDescRef);
  }, []);

  // Open the shared AttachFileDialog (visible "Choose File" button + file fields) —
  // same add-file flow as the analyze/feedback tabs, instead of a raw OS picker.
  const handleAddFile = useCallback(() => {
    setFileMenuIndex(null);
    setShowAddFile(true);
  }, []);

  const handleAddedFile = useCallback((draft: Omit<AttachFileToProject, "id">) => {
    setFiles((prev) => [...prev, { ...draft, id: -(prev.length + 1) }]);
  }, []);

  const handleRemoveFile = useCallback(() => {
    if (pendingRemove === null) return;
    setFiles((prev) => prev.filter((_, i) => i !== pendingRemove));
    setPendingRemove(null);
    setFileMenuIndex(null);
  }, [pendingRemove]);

  const handleViewFileInfo = useCallback(() => {
    if (fileMenuIndex === null || fileMenuIndex < 0) return;
    setViewFileInfo(files[fileMenuIndex] ?? null);
    setFileMenuIndex(null);
  }, [fileMenuIndex, files]);

  const fileContextMenuItems = useMemo(
    () => [
      { label: "Add File", onClick: handleAddFile },
      {
        label: "Remove File",
        onClick: () => {
          if (fileMenuIndex !== null && fileMenuIndex >= 0) setPendingRemove(fileMenuIndex);
        },
        disabled: fileMenuIndex === null || fileMenuIndex < 0,
      },
      {
        label: "View File Info",
        onClick: handleViewFileInfo,
        disabled: fileMenuIndex === null || fileMenuIndex < 0,
      },
    ],
    [handleAddFile, handleViewFileInfo, fileMenuIndex]
  );

  const handleSubmit = useCallback(() => {
    const interpretationResult = interpretationRef.current?.innerHTML ?? "";
    const commPrincipleDesc = commPrincipleDescRef.current?.innerHTML ?? "";

    // Validation — C# order + verbatim messages.
    if (!(interpretationRef.current?.innerText ?? "").trim()) {
      setErrorMsg(MSG_INTERPRETATION);
      setActiveTab("interpretation");
      return;
    }
    if (!communicationPrinciple.trim()) {
      setErrorMsg(MSG_COMM_PRINCIPLE);
      setActiveTab("comm-principle");
      return;
    }
    if (!(commPrincipleDescRef.current?.innerText ?? "").trim()) {
      setErrorMsg(MSG_COMM_DESC);
      setActiveTab("comm-principle");
      return;
    }

    setErrorMsg(null);

    const payload: SaveInterpretationPayload = {
      record: {
        actualPrinciple: principle.actualPrinciple,
        principleName: principle.principleName,
        setDerivedFrom: principle.setDerivedFrom,
        personInterpreted: personInterpreted.trim(),
        interpretationResult,
        communicationPrinciple: communicationPrinciple.trim(),
        commPrincipleDescription: commPrincipleDesc,
        analysisId: principle.analysisId,
      },
      files: files.map((f) => ({
        fileName: f.fileName,
        fileType: f.fileType,
        fileSize: f.fileSize,
        fileDirectory: f.fileDirectory,
        fileDescription: f.fileDescription,
        fileDate: f.fileDate,
        fileTime: f.fileTime,
        storageId: f.storageId,
        fullFileName: f.fullFileName,
      })),
    };

    sendMessage({ action: "SAVE_INTERPRETATION", payload });
    setSaved(true);
  }, [principle, personInterpreted, communicationPrinciple, files, sendMessage]);

  const renderTabContent = () => (
    <>
      {/* Interpretation tab — always mounted so contentEditable content is preserved */}
      <div style={{ display: activeTab === "interpretation" ? "block" : "none", padding: "20px 20px 20px" }}>
        <FieldRow label="Principle Name">
          <input style={readonlyInputStyle} value={principle.principleName} readOnly />
        </FieldRow>
        <FieldRow label="Set Derived From">
          <input style={readonlyInputStyle} value={principle.setDerivedFrom} readOnly />
        </FieldRow>
        <FieldRow label="Person Interpreted">
          <input
            style={inputStyle}
            value={personInterpreted}
            onChange={(e) => setPersonInterpreted(e.target.value)}
            placeholder="Enter person who interpreted"
          />
        </FieldRow>
        <FieldRow label="Interpretation Result">
          <div
            ref={interpretationRef}
            contentEditable
            suppressContentEditableWarning
            onFocus={() => setActiveEditor(interpretationRef)}
            style={editorStyle}
          />
        </FieldRow>
      </div>

      {/* Comm-principle tab — always mounted so contentEditable content is preserved */}
      <div style={{ display: activeTab === "comm-principle" ? "block" : "none", padding: "20px 20px 20px" }}>
        <FieldRow label="Communication Principle">
          <input
            style={inputStyle}
            value={communicationPrinciple}
            onChange={(e) => setCommunicationPrinciple(e.target.value)}
            placeholder="Enter communication principle"
          />
        </FieldRow>
        <FieldRow label="Communication Principle Description">
          <div
            ref={commPrincipleDescRef}
            contentEditable
            suppressContentEditableWarning
            onFocus={() => setActiveEditor(commPrincipleDescRef)}
            style={{ ...editorStyle, minHeight: 120 }}
          />
        </FieldRow>
      </div>

      {/* Files tab */}
      <div style={{ display: activeTab === "files" ? "flex" : "none", position: "relative", flexDirection: "column", flex: 1, minHeight: 0 }}>
        <PanelTable<AttachFileToProject>
          columns={FILE_COLUMNS}
          rows={files}
          emptyText="No attached files."
          onRowContextMenu={(e, idx) => {
            e.preventDefault();
            e.stopPropagation();
            setFileMenuIndex(idx);
          }}
        >
          {fileMenuIndex !== null && (
            <div
              style={{
                position: "fixed",
                background: C.white,
                border: `1px solid ${C.grey78}`,
                borderRadius: 4,
                boxShadow: "0px 4px 16px rgba(0,0,0,0.12)",
                zIndex: 220,
                minWidth: 160,
                padding: "4px 0",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {fileContextMenuItems.map((item, i) => (
                <button
                  key={i}
                  disabled={item.disabled}
                  onClick={item.onClick}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "6px 16px",
                    background: "transparent",
                    border: "none",
                    fontSize: 12.2,
                    fontFamily: "inherit",
                    cursor: item.disabled ? "default" : "pointer",
                    color: item.disabled ? C.grey78 : C.grey11,
                  }}
                  onMouseEnter={(e) => { if (!item.disabled) e.currentTarget.style.background = C.grey96; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
          {pendingRemove !== null && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(255,255,255,0.88)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 215,
              }}
            >
              <div
                style={{
                  background: C.white,
                  borderRadius: 6,
                  boxShadow: "0px 4px 16px rgba(0,0,0,0.14)",
                  padding: "20px 24px",
                  maxWidth: 280,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 12.4, fontWeight: 600, color: C.grey11, marginBottom: 12, lineHeight: "18px" }}>
                  Remove this file?
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                  <button
                    onClick={() => setPendingRemove(null)}
                    style={{
                      height: 30, padding: "0 16px", background: C.white,
                      border: `1px solid ${C.grey78}`, borderRadius: 4,
                      fontSize: 12.2, fontFamily: "inherit", cursor: "pointer", color: C.grey11,
                    }}
                  >
                    No
                  </button>
                  <button
                    onClick={handleRemoveFile}
                    style={{
                      height: 30, padding: "0 16px", background: C.blue,
                      border: "none", borderRadius: 4, fontSize: 12.2, fontWeight: 700,
                      fontFamily: "inherit", cursor: "pointer", color: C.white,
                    }}
                  >
                    Yes
                  </button>
                </div>
              </div>
            </div>
          )}
          {viewFileInfo && (
            <>
              <div
                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.12)", zIndex: 220 }}
                onClick={() => setViewFileInfo(null)}
              />
              <div
                style={{
                  position: "fixed", top: "50%", left: "50%",
                  transform: "translate(-50%, -50%)", zIndex: 221,
                  background: C.white, borderRadius: 6,
                  boxShadow: "0px 4px 16px rgba(0,0,0,0.14)",
                  padding: "20px 24px", minWidth: 260, maxWidth: 320,
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 14, color: C.grey11, marginBottom: 12 }}>File Info</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(
                    [
                      ["File Name", viewFileInfo.fileName],
                      ["File Type", viewFileInfo.fileType],
                      ["File Size", viewFileInfo.fileSize],
                      ["File Date", viewFileInfo.fileDate],
                      ["File Time", viewFileInfo.fileTime],
                      ["Description", viewFileInfo.fileDescription],
                    ] as [string, string][]
                  ).map(([label, value]) => (
                    <div key={label} style={{ display: "flex", gap: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 12.2, color: C.grey11, minWidth: 80, flexShrink: 0 }}>
                        {label}:
                      </span>
                      <span style={{ fontSize: 12.2, color: "#444", wordBreak: "break-word" }}>{value || "—"}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                  <button
                    onClick={() => setViewFileInfo(null)}
                    style={{
                      height: 30, padding: "0 16px", background: C.white,
                      border: `1px solid ${C.grey78}`, borderRadius: 4,
                      fontSize: 12.2, fontFamily: "inherit", cursor: "pointer", color: C.grey11,
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </>
          )}
        </PanelTable>
      </div>

      {showAddFile && (
        <AttachFileDialog onAdd={handleAddedFile} onClose={() => setShowAddFile(false)} />
      )}
    </>
  );

  const showToolbar = activeTab !== "files";

  return ReactDOM.createPortal(
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 199 }} onClick={onClose} />

      <div
        style={{
          position: "fixed",
          left: `calc(50% + ${pos.x}px)`,
          top: `calc(50% + ${pos.y}px)`,
          transform: "translate(-50%, -50%)",
          width: 900,
          height: 540,
          maxWidth: "96vw",
          maxHeight: "90vh",
          zIndex: 200,
          display: "flex",
          flexDirection: "column",
          background: C.white,
          boxShadow: "0px 8px 32px rgba(0,0,0,0.14), 0px 2px 8px rgba(0,0,0,0.06)",
          borderRadius: 8,
          overflow: "hidden",
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
        }}
        onClick={() => setFileMenuIndex(null)}
      >
        {/* ── Header ── */}
        <div
          onMouseDown={onHeaderMouseDown}
          style={{ height: 77.59, flexShrink: 0, display: "flex", alignItems: "center", paddingLeft: 20, paddingRight: 20, gap: 12, cursor: "grab", userSelect: "none" }}
        >
          <div style={{ width: 32, height: 32, borderRadius: 6, background: C.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <InterpretePrincipleHeaderIcon />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15.6, fontWeight: 700, color: C.grey11, letterSpacing: "-0.1px", lineHeight: "21px" }}>
              Interpret Principle
            </div>
            <div style={{ fontSize: 11.1, color: C.grey38, lineHeight: "17px", marginTop: 2 }}>
              Provide your interpretation of the identified principle.
            </div>
          </div>
          <button
            className="sl-close-btn"
            onClick={onClose}
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", borderRadius: 4, cursor: "pointer", flexShrink: 0, padding: 0 }}
            title="Close"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M13 1L1 13" stroke={C.grey38} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* ── Command bar ── */}
        <div
          style={{ height: 44, flexShrink: 0, background: C.grey96, display: "flex", alignItems: "center", paddingLeft: 12, paddingRight: 12, gap: 8, position: "relative" }}
        >
          <button
            onClick={handleSubmit}
            onMouseEnter={() => setSubmitHover(true)}
            onMouseLeave={() => setSubmitHover(false)}
            style={{
              width: 160, height: 28, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              background: submitHover ? C.blueHover : C.blue, color: C.white, border: "none", borderRadius: 4,
              cursor: "pointer", fontSize: 11.6, fontWeight: 700, fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0,
            }}
          >
            Interpret Principle
          </button>

          <CmdSep />

          <button
            className="sl-icon-btn"
            onClick={() => onListIdentified?.()}
            title="List Identified Principle"
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", borderRadius: 3, cursor: "pointer", flexShrink: 0, padding: 0 }}
          >
            <ListIdentifiedCmdIcon />
          </button>

          <button
            className="sl-icon-btn"
            onClick={() => onListInterpreted?.()}
            title="List Interpreted Principle"
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", borderRadius: 3, cursor: "pointer", flexShrink: 0, padding: 0 }}
          >
            <ListInterpretedCmdIcon />
          </button>

          <CmdSep />

          {showToolbar && <RichTextToolbar editorRef={activeEditor} />}
        </div>

        {/* ── Tab bar ── */}
        <div
          style={{ height: 36, flexShrink: 0, display: "flex", alignItems: "flex-end", borderBottom: `1px solid ${C.grey88}`, overflow: "hidden" }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              style={{
                height: 36, padding: "0 16px", background: "transparent", border: "none",
                borderBottom: activeTab === tab.id ? `2px solid ${C.blue}` : "2px solid transparent",
                fontSize: 12.2, fontWeight: activeTab === tab.id ? 700 : 400,
                color: activeTab === tab.id ? C.grey11 : C.grey38, fontFamily: "inherit",
                cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Error message ── */}
        {errorMsg && (
          <div
            style={{
              background: "#FFF4CE", border: "1px solid #F0D060", borderRadius: 4,
              margin: "8px 12px 0", padding: "7px 12px", fontSize: 11.5, color: "#5D4037",
              lineHeight: "17px", flexShrink: 0,
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* ── Content ── */}
        <div style={{ flex: 1, overflowY: "auto", minHeight: 0, display: "flex", flexDirection: "column" }}>
          {renderTabContent()}
        </div>

        {/* ── Footer ── */}
        <FooterBar>
          <FooterHelperText>Interpret the identified principle and submit.</FooterHelperText>
          <DismissBtn label="Cancel" onClick={onClose} />
          <PrimaryBtn label="Interpret Principle" onClick={handleSubmit} />
        </FooterBar>

        {/* ── Saved success overlay ── */}
        {saved && (
          <div
            style={{
              position: "absolute", inset: 0, background: "rgba(255,255,255,0.95)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              zIndex: 250, borderRadius: 8,
            }}
          >
            <div
              style={{ width: 48, height: 48, borderRadius: "50%", background: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M5 12L10 17L19 8" stroke="#0CBA58" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.grey11, marginBottom: 6, textAlign: "center" }}>
              Principle Interpreted
            </div>
            <div style={{ fontSize: 12.2, color: C.grey38, marginBottom: 24, textAlign: "center", maxWidth: 340, lineHeight: "18px" }}>
              The principle has been interpreted the dialog will now close
            </div>
            <button
              onClick={onClose}
              style={{
                height: 32, padding: "0 24px", background: C.blue, border: "none",
                borderRadius: 4, fontSize: 12.4, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", color: C.white,
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </>,
    document.body
  );
}
