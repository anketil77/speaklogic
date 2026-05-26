// src/dialog/components/AttachFileDialog.tsx

import React, { useRef, useState, useCallback } from "react";
import { useDraggable } from "@/dialog/hooks/useDraggable";
import { createPortal } from "react-dom";
import { AttachFileIcon, CloseIcon, FolderBannerIcon } from "@/dialog/components/Icons";
import type { AttachFileToProject } from "@/types/db";

type FileDraft = Omit<
  AttachFileToProject,
  "id" | "analysisId" | "feedbackId" | "flagId" | "articleId"
>;

export interface AttachFileDialogProps {
  onAdd: (item: FileDraft) => void;
  onClose: () => void;
}

const C = {
  blue: "#0078D4",
  blueHover: "#106EBE",
  grey11: "#1B1B1B",
  grey38: "#616161",
  grey78: "#C7C7C7",
  grey88: "#E0E0E0",
  grey96: "#F5F5F5",
  white: "#FFFFFF",
} as const;

const LABEL_W = 56;

interface FieldState {
  fileName: string;
  fileDirectory: string;
  fileType: string;
  fileSize: string;
  fileDate: string;
  fileTime: string;
  fileDescription: string;
  fullFileName: string;
}

const EMPTY: FieldState = {
  fileName: "",
  fileDirectory: "",
  fileType: "",
  fileSize: "",
  fileDate: "",
  fileTime: "",
  fileDescription: "",
  fullFileName: "",
};

export function AttachFileDialog({ onAdd, onClose }: AttachFileDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fields, setFields] = useState<FieldState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [applyHover, setApplyHover] = useState(false);

  const { pos, onHeaderMouseDown } = useDraggable();

  function update(key: keyof FieldState, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
    if (error) setError(null);
  }

  const handleChooseFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const lastDot = file.name.lastIndexOf(".");
    const nameNoExt = lastDot > 0 ? file.name.substring(0, lastDot) : file.name;
    const ext = lastDot > 0 ? file.name.substring(lastDot + 1) : "";
    const modDate = new Date(file.lastModified);

    setFields({
      fileName: nameNoExt,
      fileDirectory: "",
      fileType: ext ? `${ext.toUpperCase()} File` : file.type || "Unknown",
      fileSize: `${file.size} Bytes`,
      fileDate: modDate.toLocaleDateString(),
      fileTime: modDate.toLocaleTimeString(),
      fileDescription: "",
      fullFileName: file.name,
    });
    setError(null);
    e.target.value = "";
  }

  function handleApply() {
    if (!fields.fileName.trim() || !fields.fileType.trim()) {
      setError("A file name cannot be empty. You must select a file.");
      return;
    }
    onAdd({
      fileName: fields.fileName.trim(),
      fileDirectory: fields.fileDirectory,
      fileType: fields.fileType,
      fileSize: fields.fileSize,
      fileDate: fields.fileDate,
      fileTime: fields.fileTime,
      fileDescription: fields.fileDescription,
      storageId: "AnalysisDialog",
      fullFileName: fields.fullFileName,
    });
    onClose();
  }

  const readOnlyInput = (value: string) => (
    <input
      readOnly
      value={value}
      style={{
        flex: 1,
        height: 28,
        padding: "0 8px",
        background: C.grey96,
        border: `1px solid ${C.grey78}`,
        borderRadius: 4,
        fontSize: 11,
        color: C.grey11,
        boxSizing: "border-box",
      }}
    />
  );

  const fieldRow = (label: string, content: React.ReactNode) => (
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8, width: "100%", height: 28 }}>
      <span
        style={{
          width: LABEL_W,
          minWidth: LABEL_W,
          fontSize: 11,
          fontWeight: 300,
          color: C.grey38,
          textAlign: "right",
          lineHeight: "13px",
        }}
      >
        {label}
      </span>
      {content}
    </div>
  );

  const dialog = (
    <>
      {/* backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.25)",
          zIndex: 199,
        }}
        onClick={onClose}
      />

      {/* modal */}
      <div
        style={{
          position: "fixed",
          top: `calc(50% + ${pos.y}px)`,
          left: `calc(50% + ${pos.x}px)`,
          transform: "translate(-50%, -50%)",
          width: 460,
          background: C.white,
          borderRadius: 8,
          boxShadow: "0px 2px 8px rgba(0,0,0,0.06), 0px 8px 32px rgba(0,0,0,0.14)",
          display: "flex",
          flexDirection: "column",
          zIndex: 200,
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          onMouseDown={onHeaderMouseDown}
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 14px 10px",
            height: 40,
            borderBottom: `1px solid ${C.grey88}`,
            boxSizing: "border-box",
            cursor: "grab",
            userSelect: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AttachFileIcon color={C.blue} />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.grey11, lineHeight: "15px" }}>
              Attach File
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 17,
              height: 17,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              borderRadius: 3,
              cursor: "pointer",
              padding: 3,
            }}
            className="sl-close-btn"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Banner */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            padding: "11px 14px",
            gap: 11,
            height: 51,
            background: C.grey96,
            borderBottom: `1px solid ${C.grey88}`,
            boxSizing: "border-box",
          }}
        >
          <FolderBannerIcon />
          <span style={{ fontSize: 13, fontWeight: 700, color: C.grey11, lineHeight: "15px" }}>
            File Property
          </span>
        </div>

        {/* Body */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: 14,
            gap: 9,
            flex: 1,
          }}
        >
          {/* File Name row (editable + Choose File btn) */}
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8, width: "100%", height: 28 }}>
            <span
              style={{
                width: LABEL_W,
                minWidth: LABEL_W,
                fontSize: 11,
                fontWeight: 300,
                color: C.grey38,
                textAlign: "right",
                lineHeight: "13px",
              }}
            >
              File Name
            </span>
            <div style={{ display: "flex", flexDirection: "row", gap: 6, flex: 1 }}>
              <input
                value={fields.fileName}
                onChange={(e) => update("fileName", e.target.value)}
                placeholder="Select a file…"
                style={{
                  flex: 1,
                  height: 28,
                  padding: "0 8px",
                  background: C.white,
                  border: `1px solid ${C.grey78}`,
                  borderRadius: 4,
                  fontSize: 11,
                  color: C.grey11,
                  boxSizing: "border-box",
                }}
              />
              <button
                onClick={handleChooseFile}
                style={{
                  width: 82,
                  height: 28,
                  background: C.white,
                  border: `1px solid ${C.grey78}`,
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 500,
                  color: C.grey11,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  boxSizing: "border-box",
                }}
              >
                Choose File
              </button>
            </div>
          </div>

          {fieldRow("Directory", readOnlyInput(fields.fileDirectory))}
          {fieldRow("File Type", readOnlyInput(fields.fileType))}
          {fieldRow("File Size", readOnlyInput(fields.fileSize))}
          {fieldRow("File Date", readOnlyInput(fields.fileDate))}
          {fieldRow("File Time", readOnlyInput(fields.fileTime))}

          {/* File Description */}
          <div style={{ display: "flex", flexDirection: "column", gap: 9, width: "100%" }}>
            <span style={{ fontSize: 11, fontWeight: 300, color: C.grey38, lineHeight: "13px" }}>
              File Description
            </span>
            <textarea
              value={fields.fileDescription}
              onChange={(e) => update("fileDescription", e.target.value)}
              style={{
                width: "100%",
                height: 120,
                padding: 8,
                background: C.white,
                border: `1px solid ${C.grey78}`,
                borderRadius: 4,
                fontSize: 11,
                color: C.grey11,
                resize: "none",
                boxSizing: "border-box",
                fontFamily: "Inter, sans-serif",
              }}
            />
          </div>

          {error && (
            <span style={{ fontSize: 11, color: "#D13438" }}>{error}</span>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
            alignItems: "center",
            padding: "9px 14px 12px",
            gap: 6,
            height: 48,
            background: C.grey96,
            borderTop: `1px solid ${C.grey88}`,
            boxSizing: "border-box",
          }}
        >
          <button
            onClick={handleApply}
            onMouseEnter={() => setApplyHover(true)}
            onMouseLeave={() => setApplyHover(false)}
            style={{
              width: 63,
              height: 26,
              background: applyHover ? C.blueHover : C.blue,
              border: `1px solid ${applyHover ? C.blueHover : C.blue}`,
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 700,
              color: C.white,
              cursor: "pointer",
              boxSizing: "border-box",
            }}
          >
            Apply
          </button>
          <button
            onClick={onClose}
            style={{
              width: 67,
              height: 26,
              background: C.white,
              border: `1px solid ${C.grey78}`,
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 500,
              color: C.grey11,
              cursor: "pointer",
              boxSizing: "border-box",
            }}
          >
            Cancel
          </button>
        </div>
      </div>

      <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileChange} />
    </>
  );

  return createPortal(dialog, document.body);
}
