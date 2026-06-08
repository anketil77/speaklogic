import React, { useState, useRef, useCallback, useMemo } from "react";
import { formatDisplayDate } from "@/db/db";
import { FooterBar, DismissBtn } from "@/dialog/components/FooterButtons";
import ReactDOM from "react-dom";
import { RichTextToolbar } from "@/dialog/components/RichTextToolbar";
import { PanelTable, type PanelTableCol } from "@/dialog/components/PanelTable";
import { useDraggable } from "@/dialog/hooks/useDraggable";
import { colors } from "@/styles/tokens";
import { PrincipleDropdownTriggerIcon } from "@/dialog/components/Icons";
import type { AttachFileToProject, PrincipleInterpretation } from "@/types/db";

interface Props {
  interpretation: PrincipleInterpretation;
  initialFiles?: AttachFileToProject[];
  sendMessage: (msg: unknown) => void;
  onClose: () => void;
}

type TabId = "about" | "comm-principle" | "files";

const TABS: { id: TabId; label: string }[] = [
  { id: "about", label: "About Principle Interpretation" },
  { id: "comm-principle", label: "About Communication Principle" },
  { id: "files", label: "Attached Files" },
];

const FILE_COLUMNS: PanelTableCol<AttachFileToProject>[] = [
  { header: "File Name", width: "28%", render: (f) => f.fileName || "—", truncate: true },
  { header: "File Type", width: "15%", render: (f) => f.fileType || "—" },
  { header: "File Date", width: "17%", render: (f) => formatDisplayDate(f.fileDate) || "—" },
  { header: "File Time", width: "15%", render: (f) => f.fileTime || "—" },
  { header: "File Size", width: "15%", render: (f) => f.fileSize || "—" },
];

export function ViewInterpretedPrincipleDialog({ interpretation, initialFiles = [], sendMessage, onClose }: Props) {
  const { pos, onHeaderMouseDown } = useDraggable();
  const [activeTab, setActiveTab] = useState<TabId>("about");

  const interpretationRef = useRef<HTMLDivElement>(null);
  const commPrincipleRef = useRef<HTMLDivElement>(null);
  const [activeEditor, setActiveEditor] = useState<React.RefObject<HTMLDivElement>>(interpretationRef);

  const [files, setFiles] = useState<AttachFileToProject[]>(initialFiles);
  const [fileMenuIndex, setFileMenuIndex] = useState<number | null>(null);
  const [pendingRemove, setPendingRemove] = useState<number | null>(null);
  const [viewFileInfo, setViewFileInfo] = useState<AttachFileToProject | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTabClick = useCallback((id: TabId) => {
    setActiveTab(id);
    setFileMenuIndex(null);
    setPendingRemove(null);
  }, []);

  const handleFileContextMenu = useCallback((e: React.MouseEvent, idx: number | null) => {
    e.preventDefault();
    e.stopPropagation();
    setFileMenuIndex(idx);
  }, []);

  const handleAddFile = useCallback(() => {
    setFileMenuIndex(null);
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
      principleInterpretationId: interpretation.id,
    };
    setFiles((prev) => [...prev, newFile]);
    sendMessage({ action: "ADD_ATTACHED_FILE", file: newFile });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [files.length, interpretation.id, sendMessage]);

  const handleRemoveFile = useCallback(() => {
    if (pendingRemove === null) return;
    const file = files.find((f) => f.id === pendingRemove);
    if (file?.id && file.id > 0) {
      sendMessage({ action: "REMOVE_ATTACHED_FILE", id: file.id });
    }
    setFiles((prev) => prev.filter((f) => f.id !== pendingRemove));
    setPendingRemove(null);
    setFileMenuIndex(null);
  }, [pendingRemove, files, sendMessage]);

  const handleViewFileInfo = useCallback(() => {
    if (fileMenuIndex === null) return;
    const row = files[fileMenuIndex];
    if (row) setViewFileInfo(row);
    setFileMenuIndex(null);
  }, [fileMenuIndex, files]);

  const contextMenuItems = useMemo(() => {
    return [
      { label: "Add File", onClick: handleAddFile },
      { label: "Remove File", onClick: () => { if (fileMenuIndex !== null && fileMenuIndex >= 0) setPendingRemove(files[fileMenuIndex]?.id ?? null); }, disabled: fileMenuIndex === null || fileMenuIndex < 0 },
      { label: "View File Info", onClick: handleViewFileInfo, disabled: fileMenuIndex === null || fileMenuIndex < 0 },
    ];
  }, [handleAddFile, handleViewFileInfo, fileMenuIndex, files]);
  const renderTabContent = () => {
    switch (activeTab) {
      case "about":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FieldRow label="Principle Name" value={interpretation.principleName} />
            <FieldRow label="Set Derived From" value={interpretation.setDerivedFrom} />
            <FieldRow label="Person Interpreted" value={interpretation.personInterpreted} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 12.4, color: colors.grey11, marginBottom: 6 }}>
                Interpretation Result:
              </div>
              <div
                ref={interpretationRef}
                tabIndex={0}
                onFocus={() => setActiveEditor(interpretationRef)}
                contentEditable
                suppressContentEditableWarning
                style={{
                  border: `1px solid ${colors.grey78}`,
                  borderRadius: 4,
                  padding: "8px 10px",
                  minHeight: 120,
                  fontSize: 12.4,
                  lineHeight: "20px",
                  color: "#444",
                  outline: "none",
                  cursor: "text",
                  overflow: "auto",
                }}
                dangerouslySetInnerHTML={{ __html: interpretation.interpretationResult || "" }}
              />
            </div>
          </div>
        );
      case "comm-principle":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FieldRow label="Communication Principle" value={interpretation.communicationPrinciple} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 12.4, color: colors.grey11, marginBottom: 6 }}>
                Comm Principle Description:
              </div>
              <div
                ref={commPrincipleRef}
                tabIndex={0}
                onFocus={() => setActiveEditor(commPrincipleRef)}
                contentEditable
                suppressContentEditableWarning
                style={{
                  border: `1px solid ${colors.grey78}`,
                  borderRadius: 4,
                  padding: "8px 10px",
                  minHeight: 120,
                  fontSize: 12.4,
                  lineHeight: "20px",
                  color: "#444",
                  outline: "none",
                  cursor: "text",
                  overflow: "auto",
                }}
                dangerouslySetInnerHTML={{ __html: interpretation.commPrincipleDescription || "" }}
              />
            </div>
          </div>
        );
      case "files":
        return (
          <div style={{ position: "relative", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            <PanelTable<AttachFileToProject>
              columns={FILE_COLUMNS}
              rows={files}
              emptyText="No attached files."
              onRowContextMenu={handleFileContextMenu}
            >
              {fileMenuIndex !== null && (
                <div
                  style={{
                    position: "fixed",
                    background: colors.white,
                    border: `1px solid ${colors.grey78}`,
                    borderRadius: 4,
                    boxShadow: "0px 4px 16px rgba(0,0,0,0.12), 0px 1px 4px rgba(0,0,0,0.06)",
                    zIndex: 220,
                    minWidth: 160,
                    padding: "4px 0",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {contextMenuItems.map((item, i) => (
                    <button
                      key={i}
                      disabled={item.disabled}
                      onClick={() => { item.onClick(); }}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        padding: "6px 16px",
                        background: "transparent",
                        border: "none",
                        fontSize: 12.4,
                        fontFamily: "inherit",
                        cursor: item.disabled ? "default" : "pointer",
                        color: item.disabled ? colors.grey74 : colors.grey11,
                      }}
                      onMouseEnter={(e) => { if (!item.disabled) e.currentTarget.style.background = colors.grey92; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
              {pendingRemove !== null && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 215 }}>
                  <div style={{ background: colors.white, borderRadius: 6, boxShadow: "0px 4px 16px rgba(0,0,0,0.14), 0px 1px 4px rgba(0,0,0,0.06)", padding: "20px 24px", maxWidth: 280, textAlign: "center" }}>
                    <div style={{ fontSize: 12.4, fontWeight: 600, color: colors.grey11, marginBottom: 12, lineHeight: "18px" }}>
                      Remove this file?
                    </div>
                    <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                      <button onClick={() => setPendingRemove(null)} style={{ height: 30, padding: "0 16px", background: colors.white, border: `1px solid ${colors.grey78}`, borderRadius: 4, fontSize: 12.4, fontFamily: "inherit", cursor: "pointer", color: colors.grey11 }}>No</button>
                      <button onClick={handleRemoveFile} style={{ height: 30, padding: "0 16px", background: colors.azure42, border: "none", borderRadius: 4, fontSize: 12.4, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", color: colors.white }}>Yes</button>
                    </div>
                  </div>
                </div>
              )}
              {viewFileInfo && (
                <>
                  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.12)", zIndex: 220 }} onClick={() => setViewFileInfo(null)} />
                  <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 221, background: colors.white, borderRadius: 6, boxShadow: "0px 4px 16px rgba(0,0,0,0.14), 0px 1px 4px rgba(0,0,0,0.06)", padding: "20px 24px", minWidth: 260, maxWidth: 320 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: colors.grey11, marginBottom: 12 }}>File Info</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <InfoRow label="File Name" value={viewFileInfo.fileName} />
                      <InfoRow label="File Type" value={viewFileInfo.fileType} />
                      <InfoRow label="File Size" value={viewFileInfo.fileSize} />
                      <InfoRow label="File Date" value={formatDisplayDate(viewFileInfo.fileDate)} />
                      <InfoRow label="File Time" value={viewFileInfo.fileTime} />
                      <InfoRow label="Description" value={viewFileInfo.fileDescription} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                      <button onClick={() => setViewFileInfo(null)} style={{ height: 30, padding: "0 16px", background: colors.white, border: `1px solid ${colors.grey78}`, borderRadius: 4, fontSize: 12.4, fontFamily: "inherit", cursor: "pointer", color: colors.grey11 }}>Close</button>
                    </div>
                  </div>
                </>
              )}
            </PanelTable>
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: "none" }}
              onChange={handleFileSelected}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return ReactDOM.createPortal(
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 210 }} onClick={onClose} />
      <div
        style={{
          position: "fixed",
          left: `calc(50% + ${pos.x}px)`,
          top: `calc(50% + ${pos.y}px)`,
          transform: "translate(-50%, -50%)",
          zIndex: 211,
          background: colors.white,
          borderRadius: 8,
          boxShadow: "0px 8px 32px rgba(0,0,0,0.14), 0px 2px 8px rgba(0,0,0,0.06)",
          width: 680,
          height: 540,
          maxWidth: "96vw",
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
        }}
      >
        {/* Header */}
        <div
          onMouseDown={onHeaderMouseDown}
          style={{
            height: 70,
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
            gap: 12,
            flexShrink: 0,
            cursor: "grab",
            userSelect: "none",
          }}
        >
          <div style={{ width: 32, height: 32, borderRadius: 6, background: "#EBF3FC", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <PrincipleDropdownTriggerIcon />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15.6, lineHeight: "21px", color: colors.grey11, letterSpacing: -0.1 }}>
              View Interpreted Principle
            </div>
            <div style={{ fontWeight: 400, fontSize: 11.1, lineHeight: "17px", color: colors.grey38, marginTop: 2 }}>
              View details of the interpreted principle.
            </div>
          </div>
          <button
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
              <path d="M1 1L13 13M13 1L1 13" stroke="#616161" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Command bar — RichTextToolbar for select/copy */}
        {(activeTab === "about" || activeTab === "comm-principle") && (
          <div
            style={{
              height: 44,
              minHeight: 44,
              background: "#F5F5F5",
              display: "flex",
              alignItems: "center",
              padding: "0 12px",
              gap: 6,
              borderBottom: `1px solid ${colors.grey88}`,
              position: "relative",
            }}
          >
            <RichTextToolbar editorRef={activeEditor} />
          </div>
        )}

        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: `1px solid ${colors.grey88}`, flexShrink: 0 }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              style={{
                padding: "10px 20px",
                background: "transparent",
                border: "none",
                borderBottom: activeTab === tab.id ? "2px solid #0078D4" : "2px solid transparent",
                fontSize: 12.4,
                fontWeight: activeTab === tab.id ? 700 : 400,
                color: activeTab === tab.id ? "#0078D4" : colors.grey38,
                fontFamily: "inherit",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "14px 20px 20px",
          }}
          onClick={() => setFileMenuIndex(null)}
        >
          {renderTabContent()}
        </div>

        {/* Footer */}
        <FooterBar><DismissBtn label="Close" onClick={onClose} /></FooterBar>
      </div>
    </>,
    document.body,
  );
}

function FieldRow({ label, value }: { label: string; value: string | undefined | null }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <span
        style={{
          fontWeight: 600,
          fontSize: 12.4,
          color: colors.grey11,
          minWidth: 160,
          flexShrink: 0,
          lineHeight: "20px",
        }}
      >
        {label}:
      </span>
      <span style={{ fontSize: 12.4, color: "#444", lineHeight: "20px", wordBreak: "break-word" }}>
        {value || "—"}
      </span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | undefined | null }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      <span style={{ fontWeight: 600, fontSize: 12.4, color: colors.grey11, minWidth: 80, flexShrink: 0 }}>
        {label}:
      </span>
      <span style={{ fontSize: 12.4, color: "#444", wordBreak: "break-word" }}>
        {value || "—"}
      </span>
    </div>
  );
}
