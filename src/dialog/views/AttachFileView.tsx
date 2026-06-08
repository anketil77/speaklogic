// src/dialog/views/AttachFileView.tsx

/* global Office */

import React, { useRef, useState, useCallback } from "react";
import { FooterBar, FooterHelperText, DismissBtn, PrimaryBtn } from "@/dialog/components/FooterButtons";
import { AttachFileIcon, FolderIcon } from "@/dialog/components/Icons";
import type { AttachFileToProject } from "@/types/db";
import { formatDisplayDate } from "@/db/db";

// ─── Design tokens ────────────────────────────────────────────────────────────
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

const LABEL_W = 120;

// ─── Small pieces ─────────────────────────────────────────────────────────────

function CmdSep() {
  return (
    <div
      style={{ width: 1, height: 20, background: C.grey88, flexShrink: 0, margin: "0 8px" }}
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
    <div style={{ display: "flex", alignItems: alignTop ? "flex-start" : "center", gap: 0 }}>
      <div
        style={{
          width: LABEL_W,
          minWidth: LABEL_W,
          fontSize: "11.6px",
          fontWeight: 700,
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

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 32,
  border: `1px solid ${C.grey78}`,
  borderRadius: 4,
  padding: "0 11px",
  fontSize: "12.1px",
  fontFamily: "inherit",
  color: C.grey11,
  background: C.white,
  boxSizing: "border-box",
  outline: "none",
};

const readonlyInputStyle: React.CSSProperties = {
  ...inputStyle,
  background: "#FAFAFA",
  cursor: "default",
};

// ─── Main component ───────────────────────────────────────────────────────────

interface FileState {
  fileName: string;
  fileDirectory: string;
  fileType: string;
  fileSize: string;
  fileDate: string;
  fileTime: string;
  fullFileName: string;
}

const EMPTY_FILE: FileState = {
  fileName: "",
  fileDirectory: "",
  fileType: "",
  fileSize: "",
  fileDate: "",
  fileTime: "",
  fullFileName: "",
};

export default function AttachFileView() {
  const params = new URLSearchParams(window.location.search);
  const storageId = params.get("storageId") ?? "AnalysisDialog";

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<FileState>(EMPTY_FILE);
  const [fileDescription, setFileDescription] = useState("");
  const [error, setError] = useState("");

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) return;

    const lastDot = picked.name.lastIndexOf(".");
    const nameNoExt = lastDot > 0 ? picked.name.substring(0, lastDot) : picked.name;
    const modDate = new Date(picked.lastModified);

    setFile({
      fileName: nameNoExt,
      fileDirectory: "",
      fileType: picked.type || (lastDot > 0 ? picked.name.substring(lastDot + 1).toUpperCase() + " File" : "Unknown"),
      fileSize: picked.size + " Bytes",
      fileDate: `${modDate.getFullYear()}-${String(modDate.getMonth() + 1).padStart(2, "0")}-${String(modDate.getDate()).padStart(2, "0")}`,
      fileTime: modDate.toLocaleTimeString(),
      fullFileName: picked.name,
    });
    setError("");
    // reset so the same file can be re-chosen
    e.target.value = "";
  }, []);

  const close = useCallback(() => {
    try {
      Office.context.ui.messageParent(JSON.stringify({ action: "CLOSE" }));
    } catch {
      window.close();
    }
  }, []);

  const submit = useCallback(() => {
    if (!file.fileName) {
      setError("A file name cannot be empty. Please choose a file first.");
      return;
    }
    setError("");

    const payload: Omit<AttachFileToProject, "id" | "analysisId" | "feedbackId" | "flagId" | "articleId"> = {
      fileName: file.fileName,
      fileType: file.fileType,
      fileSize: file.fileSize,
      fileDirectory: file.fileDirectory,
      fileDescription,
      fileDate: file.fileDate,
      fileTime: file.fileTime,
      storageId,
      fullFileName: file.fullFileName,
    };
    try {
      Office.context.ui.messageParent(JSON.stringify({ action: "ADD_FILE", payload }));
    } catch {
      window.close();
    }
  }, [file, fileDescription, storageId]);

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        background: C.white,
        overflow: "hidden",
      }}
    >
      {/* hidden native file picker */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        style={{
          height: 78,
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: 12,
          flexShrink: 0,
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
          <AttachFileIcon />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "15.4px",
              fontWeight: 700,
              color: C.grey11,
              letterSpacing: "-0.1px",
              lineHeight: "21px",
            }}
          >
            Attach File
          </div>
          <div style={{ fontSize: "11.1px", color: C.grey38, lineHeight: "17px", marginTop: 2 }}>
            Choose a file to attach to this analysis and add an optional description.
          </div>
        </div>
      </div>

      {/* ── Command bar ─────────────────────────────────────────────────── */}
      <div
        style={{
          height: 44,
          background: C.grey96,
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          gap: 4,
          flexShrink: 0,
        }}
      >
        {/* Choose File */}
        <button
          className="sl-icon-btn"
          onClick={() => fileInputRef.current?.click()}
          style={{
            height: 28,
            padding: "0 14px",
            background: C.white,
            border: `1px solid ${C.grey78}`,
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
            flexShrink: 0,
            fontFamily: "inherit",
          }}
        >
          <FolderIcon />
          <span
            style={{
              fontSize: "11.4px",
              fontWeight: 600,
              color: C.grey11,
              lineHeight: "14px",
              whiteSpace: "nowrap",
            }}
          >
            Choose File
          </span>
        </button>

        <CmdSep />

        {/* Attach File (submit) */}
        <button
          className="sl-icon-btn"
          onClick={submit}
          style={{
            height: 28,
            padding: "0 14px",
            background: C.blue,
            border: "none",
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
            flexShrink: 0,
            fontFamily: "inherit",
          }}
        >
          <AttachFileIcon color="#FFFFFF" />
          <span
            style={{
              fontSize: "11.4px",
              fontWeight: 700,
              color: C.white,
              lineHeight: "14px",
              whiteSpace: "nowrap",
            }}
          >
            Attach File
          </span>
        </button>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <div
        style={{
          height: 36,
          background: C.white,
          display: "flex",
          alignItems: "flex-end",
          padding: "0 20px",
          borderBottom: `1px solid ${C.grey88}`,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "relative",
            height: 36,
            display: "flex",
            alignItems: "center",
            fontSize: "12.6px",
            fontWeight: 700,
            color: C.grey11,
            lineHeight: "15px",
          }}
        >
          About File
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
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: C.grey38,
            letterSpacing: "0.6px",
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          File Information
        </div>

        {error && (
          <div
            style={{
              padding: "8px 12px",
              background: "#FFF4CE",
              border: "1px solid #E6B800",
              borderRadius: 4,
              fontSize: "11.6px",
              color: C.grey11,
              marginBottom: 14,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <FormRow label="File Name">
            <input
              style={file.fileName ? inputStyle : readonlyInputStyle}
              placeholder="Choose a file to populate"
              value={file.fileName}
              onChange={(e) => setFile((f) => ({ ...f, fileName: e.target.value }))}
              readOnly={!file.fileName}
            />
          </FormRow>

          <FormRow label="File Type">
            <input
              style={readonlyInputStyle}
              placeholder="Auto-detected"
              value={file.fileType}
              readOnly
            />
          </FormRow>

          <FormRow label="File Size">
            <input
              style={readonlyInputStyle}
              placeholder="Auto-detected"
              value={file.fileSize}
              readOnly
            />
          </FormRow>
        </div>

        <div style={{ height: 1, background: C.grey88, margin: "14px 0" }} />

        {/* Date + Time */}
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          <div
            style={{
              width: LABEL_W,
              minWidth: LABEL_W,
              fontSize: "11.6px",
              fontWeight: 700,
              color: C.grey11,
              flexShrink: 0,
            }}
          >
            File Date
          </div>
          <input style={{ ...readonlyInputStyle, flex: 1 }} placeholder="Auto-detected" value={formatDisplayDate(file.fileDate)} readOnly />
          <div
            style={{
              width: 80,
              minWidth: 80,
              fontSize: "11.6px",
              fontWeight: 700,
              color: C.grey11,
              textAlign: "right",
              paddingRight: 12,
              flexShrink: 0,
            }}
          >
            Time
          </div>
          <input
            style={{ ...readonlyInputStyle, width: 120, flex: "0 0 120px" }}
            placeholder="Auto-detected"
            value={file.fileTime}
            readOnly
          />
        </div>

        <div style={{ height: 1, background: C.grey88, margin: "14px 0" }} />

        {/* Description */}
        <FormRow label="File Description" alignTop>
          <textarea
            placeholder="Describe the file (optional)..."
            value={fileDescription}
            onChange={(e) => setFileDescription(e.target.value)}
            style={{
              width: "100%",
              minHeight: 100,
              border: `1px solid ${C.grey78}`,
              borderRadius: 4,
              padding: "8px 11px",
              fontSize: "12.1px",
              fontFamily: "inherit",
              color: C.grey11,
              background: C.white,
              boxSizing: "border-box",
              outline: "none",
              resize: "vertical",
              lineHeight: "18px",
            }}
          />
        </FormRow>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <FooterBar>
        <FooterHelperText>
          {file.fullFileName ? `Selected: ${file.fullFileName}` : "No file selected. Click Choose File to browse."}
        </FooterHelperText>
        <DismissBtn label="Cancel" onClick={close} />
        <PrimaryBtn label="Attach File" onClick={submit} />
      </FooterBar>
    </div>
  );
}
