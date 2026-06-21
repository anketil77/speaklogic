// src/dialog/views/KeywordHistoryView.tsx
//
// Keywords / Bad Words History — an audit log of every flagged-send event.
// Each row records the date + time the email was sent, the recipient(s), the
// flagged word(s) used, and the action taken (Warn user / Stop from sending).
// Populated by the Outlook OnMessageSend handler (commands.ts → addKeywordHistory).
// Read-only with per-row delete + "Clear all".

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { FooterBar, DismissBtn, FooterStatusText } from "@/dialog/components/FooterButtons";
import { Spinner } from "@fluentui/react-components";
import { useDialogComm } from "@/dialog/hooks/useDialogComm";
import { HamburgerIcon, DeleteSelectedIcon } from "@/dialog/components/Icons";
import { colors } from "@/styles/tokens";
import { formatDisplayDate } from "@/db/db";
import type { KeywordHistory } from "@/types/db";

const RED = "#D13438";

const thStyle: React.CSSProperties = {
  textAlign: "left", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase",
  letterSpacing: "0.3px", color: colors.grey38, padding: "8px 10px", borderBottom: "1px solid #E0E0E0",
  position: "sticky", top: 0, background: colors.white,
};
const tdStyle: React.CSSProperties = {
  fontSize: "11.6px", color: colors.grey11, padding: "9px 10px",
  borderBottom: "1px solid #F0F0F0", verticalAlign: "top",
};

export default function KeywordHistoryView() {
  const { initData, sendMessage, closeDialog } = useDialogComm();
  const [rows, setRows] = useState<KeywordHistory[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (!initData) return;
    setRows(initData.keywordHistory ?? []);
    setConfirmClear(false);
  }, [initData]);

  const deleteRow = useCallback((id?: number) => {
    if (id == null) return;
    sendMessage({ action: "DELETE_KEYWORD_HISTORY", id });
  }, [sendMessage]);

  const clearAll = useCallback(() => {
    sendMessage({ action: "CLEAR_KEYWORD_HISTORY" });
    setConfirmClear(false);
  }, [sendMessage]);

  const count = useMemo(() => rows.length, [rows]);

  if (!initData) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <Spinner label="Loading..." />
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: colors.white, fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* Title */}
      <div style={{ height: "78px", display: "flex", alignItems: "center", padding: "0 20px", gap: "12px", flexShrink: 0 }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: colors.grey95, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <HamburgerIcon />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "3px" }}>
          <span style={{ fontSize: "15.6px", fontWeight: 700, lineHeight: "21px", letterSpacing: "-0.1px", color: colors.grey11 }}>
            Keywords History
          </span>
          <span style={{ fontSize: "11.1px", fontWeight: 400, lineHeight: "17px", color: colors.grey38 }}>
            Flagged words found when sending — date, time, recipients and action taken.
          </span>
        </div>
        {count > 0 && (
          <button
            onClick={() => setConfirmClear(true)}
            style={{ height: "30px", padding: "0 12px", borderRadius: "4px", border: "1px solid #C7C7C7", background: colors.white, cursor: "pointer", fontSize: "11.5px", fontWeight: 600, color: colors.grey11, whiteSpace: "nowrap" }}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 16px" }}>
        {count === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "70%", gap: "8px", color: colors.grey38 }}>
            <HamburgerIcon />
            <span style={{ fontSize: "12.5px" }}>No flagged sends yet.</span>
            <span style={{ fontSize: "11px" }}>Sends containing a flagged word will be logged here.</span>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "16%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "27%" }} />
              <col style={{ width: "23%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "8%" }} />
            </colgroup>
            <thead>
              <tr>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Time</th>
                <th style={thStyle}>Recipients</th>
                <th style={thStyle}>Words</th>
                <th style={thStyle}>Action</th>
                <th style={{ ...thStyle, textAlign: "center" }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={tdStyle}>{formatDisplayDate(r.sentDate) || "—"}</td>
                  <td style={tdStyle}>{r.sentTime || "—"}</td>
                  <td style={{ ...tdStyle, wordBreak: "break-word" }}>{r.recipients || "—"}</td>
                  <td style={{ ...tdStyle, wordBreak: "break-word" }}>
                    {/* Flagged words shown in red for quick visual scanning (client request 5c). */}
                    {r.words
                      ? r.words.split(",").map((w, i, arr) => (
                          <span key={i}>
                            <span style={{ color: RED, fontWeight: 600 }}>{w.trim()}</span>
                            {i < arr.length - 1 ? ", " : ""}
                          </span>
                        ))
                      : "—"}
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: "10.8px", fontWeight: 600, padding: "2px 8px", borderRadius: "10px", whiteSpace: "nowrap", color: r.action === "stop" ? RED : "#8A5A00", background: r.action === "stop" ? "#FDE7E9" : "#FFF4CE" }}>
                      {r.action === "stop" ? "Stopped" : "Warned"}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <button
                      title="Delete entry"
                      onClick={() => deleteRow(r.id)}
                      style={{ border: "none", background: "transparent", cursor: "pointer", padding: "2px", display: "inline-flex" }}
                    >
                      <DeleteSelectedIcon color={RED} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Clear-all confirmation */}
      {confirmClear && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }}>
          <div style={{ background: colors.white, borderRadius: "8px", padding: "22px", width: "300px", boxShadow: "0px 8px 24px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column", gap: "14px" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, color: colors.grey11 }}>Clear all history?</span>
            <span style={{ fontSize: "12px", color: colors.grey38, lineHeight: "17px" }}>This permanently removes every logged flagged-send entry. This cannot be undone.</span>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <DismissBtn label="Cancel" onClick={() => setConfirmClear(false)} />
              <button
                onClick={clearAll}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#C50F1F")}
                onMouseLeave={(e) => (e.currentTarget.style.background = RED)}
                style={{ height: "32px", padding: "0 16px", borderRadius: "4px", border: "none", background: RED, color: colors.white, fontWeight: 600, fontSize: "12px", cursor: "pointer" }}
              >
                Clear all
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <FooterBar>
        <FooterStatusText>{count} {count === 1 ? "entry" : "entries"}</FooterStatusText>
        <DismissBtn label="Close" onClick={closeDialog} />
      </FooterBar>
    </div>
  );
}
