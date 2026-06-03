// src/dialog/components/ViewPrincipleDetailDialog.tsx
// Read-only portal for viewing an identified principle (PrincipleInSelection)
// or a selection-principle relation (SelectionWithPrinciple).
// C# refs: ViewIdentifyPrinciple.cs / ViewRelatedPrinciple.cs

import React, { useState, useCallback } from "react";
import { FooterBar, DismissBtn } from "@/dialog/components/FooterButtons";
import ReactDOM from "react-dom";
import { PanelTable, type PanelTableCol } from "@/dialog/components/PanelTable";
import { useDraggable } from "@/dialog/hooks/useDraggable";
import { colors } from "@/styles/tokens";
import { PrincipleDropdownTriggerIcon } from "@/dialog/components/Icons";
import type { AttachFileToProject } from "@/types/db";

interface Props {
  title: string;
  subtitle: string;
  aboutSelection: string;
  actualPrinciple: string;
  principleName: string;
  setDerivedFrom: string;
  principleDescription: string;
  communicationPrinciple: string;
  commPrincipleDescription: string;
  /** When provided, an "About Relationship" tab is shown (related-principle variant). */
  actualRelationship?: string;
  relationshipDescription?: string;
  files?: AttachFileToProject[];
  onClose: () => void;
}

type TabId = "selection" | "principle" | "comm-principle" | "relationship" | "files";

const FILE_COLUMNS: PanelTableCol<AttachFileToProject>[] = [
  { header: "File Name", width: "28%", render: (f) => f.fileName || "—", truncate: true },
  { header: "File Type", width: "15%", render: (f) => f.fileType || "—" },
  { header: "File Date", width: "17%", render: (f) => f.fileDate || "—" },
  { header: "File Time", width: "15%", render: (f) => f.fileTime || "—" },
  { header: "File Size", width: "15%", render: (f) => f.fileSize || "—" },
];

function FieldRow({ label, value }: { label: string; value: string | undefined | null }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
      <span style={{ fontWeight: 600, fontSize: 12.4, color: colors.grey11, minWidth: 160, flexShrink: 0, lineHeight: "20px" }}>
        {label}:
      </span>
      <span style={{ fontSize: 12.4, color: "#444", lineHeight: "20px", wordBreak: "break-word" }}>{value || "—"}</span>
    </div>
  );
}

function HtmlBlock({ label, html }: { label: string; html: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontWeight: 600, fontSize: 12.4, color: colors.grey11, marginBottom: 6 }}>{label}:</div>
      <div
        style={{
          border: `1px solid ${colors.grey88}`,
          borderRadius: 4,
          padding: "8px 10px",
          minHeight: 90,
          fontSize: 12.4,
          lineHeight: "20px",
          color: "#444",
          background: "#FAFAFA",
          overflow: "auto",
          wordBreak: "break-word",
        }}
        dangerouslySetInnerHTML={{ __html: html || "" }}
      />
    </div>
  );
}

export function ViewPrincipleDetailDialog({
  title,
  subtitle,
  aboutSelection,
  actualPrinciple,
  principleName,
  setDerivedFrom,
  principleDescription,
  communicationPrinciple,
  commPrincipleDescription,
  actualRelationship,
  relationshipDescription,
  files = [],
  onClose,
}: Props) {
  const { pos, onHeaderMouseDown } = useDraggable();
  const [activeTab, setActiveTab] = useState<TabId>("selection");
  const hasRelationship = actualRelationship !== undefined || relationshipDescription !== undefined;

  const TABS: { id: TabId; label: string }[] = [
    { id: "selection", label: "About Selection" },
    { id: "principle", label: "About Principle" },
    { id: "comm-principle", label: "About Communication Principle" },
    ...(hasRelationship ? [{ id: "relationship" as TabId, label: "About Relationship" }] : []),
    { id: "files", label: "Attached Files" },
  ];

  const renderTab = useCallback(() => {
    switch (activeTab) {
      case "selection":
        return <HtmlBlock label="Actual Selection" html={aboutSelection} />;
      case "principle":
        return (
          <>
            <FieldRow label="Actual Principle" value={actualPrinciple} />
            <FieldRow label="Principle Name" value={principleName} />
            <FieldRow label="Set Derived From" value={setDerivedFrom} />
            <HtmlBlock label="Principle Description" html={principleDescription} />
          </>
        );
      case "comm-principle":
        return (
          <>
            <FieldRow label="Communication Principle" value={communicationPrinciple} />
            <HtmlBlock label="Comm Principle Description" html={commPrincipleDescription} />
          </>
        );
      case "relationship":
        return (
          <>
            <FieldRow label="Actual Relationship" value={actualRelationship} />
            <HtmlBlock label="Relationship Description" html={relationshipDescription || ""} />
          </>
        );
      case "files":
        return (
          <div style={{ position: "relative", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            <PanelTable<AttachFileToProject> columns={FILE_COLUMNS} rows={files} emptyText="No attached files." />
          </div>
        );
      default:
        return null;
    }
  }, [
    activeTab,
    aboutSelection,
    actualPrinciple,
    principleName,
    setDerivedFrom,
    principleDescription,
    communicationPrinciple,
    commPrincipleDescription,
    actualRelationship,
    relationshipDescription,
    files,
  ]);

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
          width: 760,
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
          style={{ height: 70, display: "flex", alignItems: "center", padding: "0 20px", gap: 12, flexShrink: 0, cursor: "grab", userSelect: "none" }}
        >
          <div style={{ width: 32, height: 32, borderRadius: 6, background: "#EBF3FC", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <PrincipleDropdownTriggerIcon />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15.6, lineHeight: "21px", color: colors.grey11, letterSpacing: -0.1 }}>{title}</div>
            <div style={{ fontWeight: 400, fontSize: 11.1, lineHeight: "17px", color: colors.grey38, marginTop: 2 }}>{subtitle}</div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", borderRadius: 4, cursor: "pointer", flexShrink: 0, padding: 0 }}
            title="Close"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M13 1L1 13" stroke="#616161" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: `1px solid ${colors.grey88}`, flexShrink: 0, overflow: "hidden" }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "10px 16px",
                background: "transparent",
                border: "none",
                borderBottom: activeTab === tab.id ? "2px solid #0078D4" : "2px solid transparent",
                fontSize: 12.2,
                fontWeight: activeTab === tab.id ? 700 : 400,
                color: activeTab === tab.id ? "#0078D4" : colors.grey38,
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

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: "16px 20px 20px", display: "flex", flexDirection: "column", minHeight: 0 }}>
          {renderTab()}
        </div>

        {/* Footer */}
        <FooterBar><DismissBtn label="Close" onClick={onClose} /></FooterBar>
      </div>
    </>,
    document.body
  );
}
