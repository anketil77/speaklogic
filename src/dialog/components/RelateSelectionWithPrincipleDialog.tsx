// src/dialog/components/RelateSelectionWithPrincipleDialog.tsx
// Inline portal dialog for relating a selection to a principle.
// C# original: RelateSelectionWithPrinciple.cs

import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import ReactDOM from "react-dom";
import { RichTextToolbar } from "@/dialog/components/RichTextToolbar";
import { PanelTable, type PanelTableCol } from "@/dialog/components/PanelTable";
import { useDraggable } from "@/dialog/hooks/useDraggable";
import {
  RelatePrincipleHeaderIcon,
  RelatePrincipleCmdIcon,
  ListIdentifiedCmdIcon,
  ListInterpretedCmdIcon,
} from "@/dialog/components/Icons";
import type {
  AttachFileToProject,
  FlagEntityForAnalysis,
  SaveRelatedSelectionPayload,
} from "@/types/db";

interface Props {
  flag: FlagEntityForAnalysis;
  sendMessage: (msg: unknown) => void;
  onClose: () => void;
  onListIdentified?: () => void;
  onListInterpreted?: () => void;
}

type TabId = "selection" | "principle" | "comm-principle" | "relationship" | "files";

const TABS: { id: TabId; label: string }[] = [
  { id: "selection", label: "About Selection" },
  { id: "principle", label: "About Principle" },
  { id: "comm-principle", label: "About Communication Principle" },
  { id: "relationship", label: "About Relationship" },
  { id: "files", label: "Attached Files" },
];

const FILE_COLUMNS: PanelTableCol<AttachFileToProject>[] = [
  { header: "File Name", width: "28%", render: (f) => f.fileName || "—", truncate: true },
  { header: "File Type", width: "15%", render: (f) => f.fileType || "—" },
  { header: "File Date", width: "17%", render: (f) => f.fileDate || "—" },
  { header: "File Time", width: "15%", render: (f) => f.fileTime || "—" },
  { header: "File Size", width: "15%", render: (f) => f.fileSize || "—" },
];

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
  gallery: "#EBEBEB",
} as const;

function CmdSep() {
  return <div style={{ width: 1, height: 20, background: C.grey88, flexShrink: 0 }} />;
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
      <label
        style={{
          minWidth: 180,
          fontSize: 12.2,
          color: C.grey11,
          paddingTop: 8,
          flexShrink: 0,
          lineHeight: "16px",
        }}
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

export function RelateSelectionWithPrincipleDialog({
  flag,
  sendMessage,
  onClose,
  onListIdentified,
  onListInterpreted,
}: Props) {
  const { pos, onHeaderMouseDown } = useDraggable();
  const [activeTab, setActiveTab] = useState<TabId>("selection");

  // Form fields
  const [actualPrinciple, setActualPrinciple] = useState("");
  const [principleName, setPrincipleName] = useState("");
  const [setDerivedFrom, setSetDerivedFrom] = useState("");
  const [communicationPrinciple, setCommunicationPrinciple] = useState("");
  const [actualRelationship, setActualRelationship] = useState("");

  // Rich text editor refs
  const selectionRef = useRef<HTMLDivElement>(null);
  const principleDescRef = useRef<HTMLDivElement>(null);
  const commPrincipleDescRef = useRef<HTMLDivElement>(null);
  const relationshipDescRef = useRef<HTMLDivElement>(null);
  const [activeEditor, setActiveEditor] = useState<React.RefObject<HTMLDivElement>>(principleDescRef);

  // File management
  const [files, setFiles] = useState<AttachFileToProject[]>([]);
  const [fileMenuIndex, setFileMenuIndex] = useState<number | null>(null);
  const [pendingRemove, setPendingRemove] = useState<number | null>(null);
  const [viewFileInfo, setViewFileInfo] = useState<AttachFileToProject | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitHover, setSubmitHover] = useState(false);
  const [cancelHover, setCancelHover] = useState(false);

  // Set selection text into the readonly editor
  useEffect(() => {
    const el = selectionRef.current;
    if (!el) return;
    el.innerHTML = flag.actualSelection || "";
  }, [flag.actualSelection]);

  const handleTabClick = useCallback((id: TabId) => {
    setActiveTab(id);
    setFileMenuIndex(null);
    setPendingRemove(null);
    setErrorMsg(null);
    // Switch active editor when changing to a rich-text tab
    if (id === "principle") setActiveEditor(principleDescRef);
    else if (id === "comm-principle") setActiveEditor(commPrincipleDescRef);
    else if (id === "relationship") setActiveEditor(relationshipDescRef);
    else if (id === "selection") setActiveEditor(selectionRef);
  }, []);

  const handleAddFile = useCallback(() => {
    setFileMenuIndex(null);
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const fileDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      const fileTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      const sizeKB = Math.round(f.size / 1024);
      const fileSize = sizeKB >= 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
      const newFile: AttachFileToProject = {
        id: -(files.length + 1),
        fileName: f.name,
        fileType: f.type || "application/octet-stream",
        fileSize,
        fileDate,
        fileTime,
        fileDirectory: "",
        fileDescription: "",
        storageId: "",
        fullFileName: f.name,
      };
      setFiles((prev) => [...prev, newFile]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [files.length]
  );

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
    const actualSelection = (selectionRef.current?.innerText ?? "").trim();
    const principleDesc = principleDescRef.current?.innerHTML ?? "";
    const commPrincipleDesc = commPrincipleDescRef.current?.innerHTML ?? "";
    const relationshipDesc = relationshipDescRef.current?.innerHTML ?? "";

    // Validation matching C# original
    if (!actualSelection) {
      setErrorMsg(
        "The selection cannot be empty; in order to identify principle in a selection, that selection must exist."
      );
      setActiveTab("selection");
      return;
    }
    if (!actualPrinciple.trim()) {
      setErrorMsg(
        "If the principle exists it must be actual and it must have a name. I need to state whether the identified principle is actual and have a name."
      );
      setActiveTab("principle");
      return;
    }
    if (!principleName.trim()) {
      setErrorMsg(
        "If the principle exists it must be actual and it must have a name. I need to state whether the identified principle is actual and have a name."
      );
      setActiveTab("principle");
      return;
    }
    if (!setDerivedFrom.trim()) {
      setErrorMsg(
        "Since principles can only be identified and they cannot be generated or created, they must be identified from a set and that set must be actual or given. I need to identify the set that principle belongs to."
      );
      setActiveTab("principle");
      return;
    }
    if (!(principleDescRef.current?.innerText ?? "").trim()) {
      setErrorMsg(
        "If the actual principle exists it must have a description. I need to describe the identified principle from the selection."
      );
      setActiveTab("principle");
      return;
    }
    if (!communicationPrinciple.trim()) {
      setErrorMsg(
        "The relationship of an identified principle with the principle of communication enables that principle to exist. I will identify the principle of communication that is a part to that principle."
      );
      setActiveTab("comm-principle");
      return;
    }
    if (!(commPrincipleDescRef.current?.innerText ?? "").trim()) {
      setErrorMsg("I need to provide a description of the communication principle.");
      setActiveTab("comm-principle");
      return;
    }
    if (!actualRelationship.trim()) {
      setErrorMsg(
        "The relationship between the selection and the identified principle enables the relationship to exist. I need to identify the actual relationship."
      );
      setActiveTab("relationship");
      return;
    }
    if (!(relationshipDescRef.current?.innerText ?? "").trim()) {
      setErrorMsg(
        "If the relationship exists it must have a description. I need to provide a description for the actual relationship."
      );
      setActiveTab("relationship");
      return;
    }

    setErrorMsg(null);

    const payload: SaveRelatedSelectionPayload = {
      record: {
        actualSelection: flag.actualSelection,
        actualPrinciple: actualPrinciple.trim(),
        principleName: principleName.trim(),
        setDerivedFrom: setDerivedFrom.trim(),
        principleDescription: principleDesc,
        communicationPrinciple: communicationPrinciple.trim(),
        commPrincipleDescription: commPrincipleDesc,
        actualRelationship: actualRelationship.trim(),
        relationshipDescription: relationshipDesc,
        selectionType: flag.selectionType,
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

    sendMessage({ action: "SAVE_RELATED_SELECTION", payload });
    setSaved(true);
  }, [
    actualPrinciple,
    principleName,
    setDerivedFrom,
    communicationPrinciple,
    actualRelationship,
    flag,
    files,
    sendMessage,
  ]);

  const renderTabContent = () => (
    <>
      {/* Selection tab — always mounted so contentEditable content is preserved */}
      <div style={{ display: activeTab === "selection" ? "flex" : "none", flexDirection: "column", flex: 1 }}>
        <div style={{ background: C.grey96, height: 37, display: "flex", alignItems: "center", paddingLeft: 20, flexShrink: 0 }}>
          <span style={{ fontStyle: "italic", fontSize: 11.3, color: C.grey38, lineHeight: "14px" }}>
            Actual Selection The Principle is Related To
          </span>
        </div>
        <div style={{ padding: "24px 20px 20px" }}>
          <div
            ref={selectionRef}
            contentEditable
            suppressContentEditableWarning
            onFocus={() => setActiveEditor(selectionRef)}
            style={{ fontSize: 26.3, lineHeight: "39px", color: C.grey11, fontFamily: "inherit", outline: "none", wordBreak: "break-word", minHeight: 40 }}
          />
        </div>
      </div>

      {/* Principle tab — always mounted so contentEditable content is preserved */}
      <div style={{ display: activeTab === "principle" ? "block" : "none", padding: "20px 20px 20px" }}>
        <FieldRow label="Actual Principle">
          <input style={inputStyle} value={actualPrinciple} onChange={(e) => setActualPrinciple(e.target.value)} placeholder="Enter actual principle" />
        </FieldRow>
        <FieldRow label="Principle Name">
          <input style={inputStyle} value={principleName} onChange={(e) => setPrincipleName(e.target.value)} placeholder="Enter principle name" />
        </FieldRow>
        <FieldRow label="Set Derived From">
          <input style={inputStyle} value={setDerivedFrom} onChange={(e) => setSetDerivedFrom(e.target.value)} placeholder="Enter the set this principle is derived from" />
        </FieldRow>
        <FieldRow label="Principle Description">
          <div
            ref={principleDescRef}
            contentEditable
            suppressContentEditableWarning
            onFocus={() => setActiveEditor(principleDescRef)}
            style={{ border: `1px solid ${C.grey78}`, borderRadius: 4, padding: "8px 10px", minHeight: 90, fontSize: 12.2, lineHeight: "20px", color: C.grey11, fontFamily: "inherit", outline: "none", cursor: "text", overflow: "auto" }}
          />
        </FieldRow>
      </div>

      {/* Comm-principle tab — always mounted so contentEditable content is preserved */}
      <div style={{ display: activeTab === "comm-principle" ? "block" : "none", padding: "20px 20px 20px" }}>
        <FieldRow label="Communication Principle">
          <input style={inputStyle} value={communicationPrinciple} onChange={(e) => setCommunicationPrinciple(e.target.value)} placeholder="Enter communication principle" />
        </FieldRow>
        <FieldRow label="Comm Principle Description">
          <div
            ref={commPrincipleDescRef}
            contentEditable
            suppressContentEditableWarning
            onFocus={() => setActiveEditor(commPrincipleDescRef)}
            style={{ border: `1px solid ${C.grey78}`, borderRadius: 4, padding: "8px 10px", minHeight: 110, fontSize: 12.2, lineHeight: "20px", color: C.grey11, fontFamily: "inherit", outline: "none", cursor: "text", overflow: "auto" }}
          />
        </FieldRow>
      </div>

      {/* Relationship tab — always mounted so contentEditable content is preserved */}
      <div style={{ display: activeTab === "relationship" ? "block" : "none", padding: "20px 20px 20px" }}>
        <FieldRow label="Actual Relationship">
          <input style={inputStyle} value={actualRelationship} onChange={(e) => setActualRelationship(e.target.value)} placeholder="Enter the actual relationship" />
        </FieldRow>
        <FieldRow label="Relationship Description">
          <div
            ref={relationshipDescRef}
            contentEditable
            suppressContentEditableWarning
            onFocus={() => setActiveEditor(relationshipDescRef)}
            style={{ border: `1px solid ${C.grey78}`, borderRadius: 4, padding: "8px 10px", minHeight: 110, fontSize: 12.2, lineHeight: "20px", color: C.grey11, fontFamily: "inherit", outline: "none", cursor: "text", overflow: "auto" }}
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
              style={{ position: "fixed", background: C.white, border: `1px solid ${C.grey78}`, borderRadius: 4, boxShadow: "0px 4px 16px rgba(0,0,0,0.12)", zIndex: 220, minWidth: 160, padding: "4px 0" }}
              onClick={(e) => e.stopPropagation()}
            >
              {fileContextMenuItems.map((item, i) => (
                <button
                  key={i}
                  disabled={item.disabled}
                  onClick={item.onClick}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 16px", background: "transparent", border: "none", fontSize: 12.2, fontFamily: "inherit", cursor: item.disabled ? "default" : "pointer", color: item.disabled ? C.grey78 : C.grey11 }}
                  onMouseEnter={(e) => { if (!item.disabled) e.currentTarget.style.background = C.grey96; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
          {pendingRemove !== null && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.88)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 215 }}>
              <div style={{ background: C.white, borderRadius: 6, boxShadow: "0px 4px 16px rgba(0,0,0,0.14)", padding: "20px 24px", maxWidth: 280, textAlign: "center" }}>
                <div style={{ fontSize: 12.4, fontWeight: 600, color: C.grey11, marginBottom: 12, lineHeight: "18px" }}>
                  Remove this file?
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                  <button onClick={() => setPendingRemove(null)} style={{ height: 30, padding: "0 16px", background: C.white, border: `1px solid ${C.grey78}`, borderRadius: 4, fontSize: 12.2, fontFamily: "inherit", cursor: "pointer", color: C.grey11 }}>No</button>
                  <button onClick={handleRemoveFile} style={{ height: 30, padding: "0 16px", background: C.blue, border: "none", borderRadius: 4, fontSize: 12.2, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", color: C.white }}>Yes</button>
                </div>
              </div>
            </div>
          )}
          {viewFileInfo && (
            <>
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.12)", zIndex: 220 }} onClick={() => setViewFileInfo(null)} />
              <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 221, background: C.white, borderRadius: 6, boxShadow: "0px 4px 16px rgba(0,0,0,0.14)", padding: "20px 24px", minWidth: 260, maxWidth: 320 }}>
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
                      <span style={{ fontWeight: 600, fontSize: 12.2, color: C.grey11, minWidth: 80, flexShrink: 0 }}>{label}:</span>
                      <span style={{ fontSize: 12.2, color: "#444", wordBreak: "break-word" }}>{value || "—"}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                  <button onClick={() => setViewFileInfo(null)} style={{ height: 30, padding: "0 16px", background: C.white, border: `1px solid ${C.grey78}`, borderRadius: 4, fontSize: 12.2, fontFamily: "inherit", cursor: "pointer", color: C.grey11 }}>Close</button>
                </div>
              </div>
            </>
          )}
        </PanelTable>
        <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileSelected} />
      </div>
    </>
  );

  // Determine if toolbar should show (not on files tab or selection tab when not focused)
  const showToolbar = activeTab !== "files";

  return ReactDOM.createPortal(
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.18)",
          zIndex: 199,
        }}
        onClick={onClose}
      />

      {/* Dialog */}
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
        {/* ── Header (77.59px) ── */}
        <div
          onMouseDown={onHeaderMouseDown}
          style={{
            height: 77.59,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            paddingLeft: 20,
            paddingRight: 20,
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
            <RelatePrincipleHeaderIcon />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 15.6,
                fontWeight: 700,
                color: C.grey11,
                letterSpacing: "-0.1px",
                lineHeight: "21px",
              }}
            >
              Relate Selection with Principle
            </div>
            <div
              style={{ fontSize: 11.1, color: C.grey38, lineHeight: "17px", marginTop: 2 }}
            >
              Relate the current selection to a principle and describe the relationship.
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
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M1 1L13 13M13 1L1 13"
                stroke={C.grey38}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* ── Command bar (44px, #F5F5F5) ── */}
        <div
          style={{
            height: 44,
            flexShrink: 0,
            background: C.grey96,
            display: "flex",
            alignItems: "center",
            paddingLeft: 12,
            paddingRight: 12,
            gap: 8,
            position: "relative",
          }}
        >
          {/* Primary button */}
          <button
            onClick={handleSubmit}
            onMouseEnter={() => setSubmitHover(true)}
            onMouseLeave={() => setSubmitHover(false)}
            style={{
              width: 215,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              background: submitHover ? C.blueHover : C.blue,
              color: C.white,
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 11.6,
              fontWeight: 700,
              fontFamily: "inherit",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <RelatePrincipleCmdIcon />
            Relate Selection with Principle
          </button>

          <CmdSep />

          {/* List Identified Principle */}
          <button
            className="sl-icon-btn"
            onClick={() => {
              onListIdentified?.();
            }}
            title="List Identified Principle"
            style={{
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              borderRadius: 3,
              cursor: "pointer",
              flexShrink: 0,
              padding: 0,
            }}
          >
            <ListIdentifiedCmdIcon />
          </button>

          {/* List Interpreted Principle */}
          <button
            className="sl-icon-btn"
            onClick={() => {
              onListInterpreted?.();
            }}
            title="List Interpreted Principle"
            style={{
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              borderRadius: 3,
              cursor: "pointer",
              flexShrink: 0,
              padding: 0,
            }}
          >
            <ListInterpretedCmdIcon />
          </button>

          <CmdSep />

          {showToolbar && <RichTextToolbar editorRef={activeEditor} />}
        </div>

        {/* ── Tab bar (36px) ── */}
        <div
          style={{
            height: 36,
            flexShrink: 0,
            display: "flex",
            alignItems: "flex-end",
            borderBottom: `1px solid ${C.grey88}`,
            paddingLeft: 0,
            overflow: "hidden",
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              style={{
                height: 36,
                padding: "0 16px",
                background: "transparent",
                border: "none",
                borderBottom:
                  activeTab === tab.id
                    ? `2px solid ${C.blue}`
                    : "2px solid transparent",
                fontSize: 12.2,
                fontWeight: activeTab === tab.id ? 700 : 400,
                color: activeTab === tab.id ? C.grey11 : C.grey38,
                fontFamily: "inherit",
                cursor: "pointer",
                flexShrink: 0,
                whiteSpace: "nowrap",
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
              background: "#FFF4CE",
              border: "1px solid #F0D060",
              borderRadius: 4,
              margin: "8px 12px 0",
              padding: "7px 12px",
              fontSize: 11.5,
              color: "#5D4037",
              lineHeight: "17px",
              flexShrink: 0,
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* ── Content area ── */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {renderTabContent()}
        </div>

        {/* ── Footer (57px) ── */}
        <div
          style={{
            height: 57,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
            borderTop: `1px solid ${C.grey88}`,
            background: C.white,
            boxSizing: "border-box",
          }}
        >
          <span
            style={{ fontSize: 10.1, color: C.grey38, fontFamily: "inherit" }}
          >
            Relate the selection to a principle and submit.
          </span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={onClose}
              onMouseEnter={() => setCancelHover(true)}
              onMouseLeave={() => setCancelHover(false)}
              style={{
                width: 74,
                height: 32,
                background: cancelHover ? "#F3F3F3" : C.white,
                border: `1px solid ${C.grey78}`,
                borderRadius: 4,
                fontSize: 12.4,
                fontFamily: "inherit",
                cursor: "pointer",
                color: C.grey11,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              onMouseEnter={() => setSubmitHover(true)}
              onMouseLeave={() => setSubmitHover(false)}
              style={{
                width: 133,
                height: 32,
                background: submitHover ? C.blueHover : C.blue,
                border: "none",
                borderRadius: 4,
                fontSize: 12.7,
                fontWeight: 700,
                fontFamily: "inherit",
                cursor: "pointer",
                color: C.white,
                whiteSpace: "nowrap",
              }}
            >
              Relate Selection
            </button>
          </div>
        </div>

        {/* ── Saved success overlay ── */}
        {saved && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(255,255,255,0.95)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 250,
              borderRadius: 8,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "#E8F5E9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12L10 17L19 8"
                  stroke="#0CBA58"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: C.grey11,
                marginBottom: 6,
                textAlign: "center",
              }}
            >
              Relationship Saved
            </div>
            <div
              style={{
                fontSize: 12.2,
                color: C.grey38,
                marginBottom: 24,
                textAlign: "center",
                maxWidth: 320,
                lineHeight: "18px",
              }}
            >
              The relationship between the selection and the principle has been identified.
            </div>
            <button
              onClick={onClose}
              style={{
                height: 32,
                padding: "0 24px",
                background: C.blue,
                border: "none",
                borderRadius: 4,
                fontSize: 12.4,
                fontWeight: 700,
                fontFamily: "inherit",
                cursor: "pointer",
                color: C.white,
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
