// src/dialog/components/ViewFileInformationDialog.tsx

import React from "react";
import { createPortal } from "react-dom";
import { AttachFileIcon, CloseIcon, FolderBannerIcon } from "@/dialog/components/Icons";
import type { AttachFileToProject } from "@/types/db";

type FileDraft = Omit<
  AttachFileToProject,
  "id" | "analysisId" | "feedbackId" | "flagId" | "articleId"
>;

export interface ViewFileInformationDialogProps {
  file: FileDraft;
  onClose: () => void;
  zIndexBase?: number;
}

const C = {
  grey11: "#1B1B1B",
  grey38: "#616161",
  grey78: "#C7C7C7",
  grey88: "#E0E0E0",
  grey96: "#F5F5F5",
  white: "#FFFFFF",
} as const;

const LABEL_W = 56;

function ReadField({ label, value }: { label: string; value: string }) {
  return (
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
    </div>
  );
}

export function ViewFileInformationDialog({ file, onClose, zIndexBase = 200 }: ViewFileInformationDialogProps) {
  const dialog = (
    <>
      {/* backdrop */}
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)", zIndex: zIndexBase - 1 }}
        onClick={onClose}
      />

      {/* modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 460,
          background: C.white,
          borderRadius: 8,
          boxShadow: "0px 2px 8px rgba(0,0,0,0.06), 0px 8px 32px rgba(0,0,0,0.14)",
          display: "flex",
          flexDirection: "column",
          zIndex: zIndexBase,
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 14px 10px",
            height: 40,
            borderBottom: `1px solid ${C.grey88}`,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AttachFileIcon color="#0078D4" />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.grey11, lineHeight: "15px" }}>
              View File Information
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
        <div style={{ display: "flex", flexDirection: "column", padding: 14, gap: 9, flex: 1 }}>
          <ReadField label="File Name" value={file.fileName} />
          <ReadField label="Directory" value={file.fileDirectory} />
          <ReadField label="File Type" value={file.fileType} />
          <ReadField label="File Size" value={file.fileSize} />
          <ReadField label="File Date" value={file.fileDate || "—"} />
          <ReadField label="File Time" value={file.fileTime || "—"} />

          {/* File Description */}
          <div style={{ display: "flex", flexDirection: "column", gap: 9, width: "100%" }}>
            <span style={{ fontSize: 11, fontWeight: 300, color: C.grey38, lineHeight: "13px" }}>
              File Description
            </span>
            <textarea
              readOnly
              value={file.fileDescription}
              style={{
                width: "100%",
                height: 120,
                padding: 8,
                background: C.grey96,
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
            Close
          </button>
        </div>
      </div>
    </>
  );

  return createPortal(dialog, document.body);
}
