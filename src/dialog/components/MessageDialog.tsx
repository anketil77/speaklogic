// src/dialog/components/MessageDialog.tsx

import React from "react";
import { makeStyles } from "@fluentui/react-components";

export interface MessageDialogProps {
  title: string;
  text: string;
  onClose?: () => void;
  inline?: boolean; // true when used inside InfoMessageCard (auto height, no scroll)
}

const useStyles = makeStyles({
  root: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#FFFFFF",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    overflow: "hidden",
  },
  // Header: 58px — icon(28px) + gap(12px) + title(flex:1)
  // No custom close button — Office.js dialog already provides one
  header: {
    height: "58px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    paddingLeft: "16px",
    paddingRight: "16px",
    gap: "12px",
  },
  iconBox: {
    width: "28px",
    height: "28px",
    background: "#EBF3FC",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  titleText: {
    flex: 1,
    fontSize: "13.6px",
    fontWeight: "700",
    lineHeight: "20px",
    letterSpacing: "-0.1px",
    color: "#1B1B1B",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  divider: {
    height: "1px",
    flexShrink: 0,
    background: "#E0E0E0",
  },
  body: {
    flex: "1",
    minHeight: "0",
    overflowY: "auto",
    paddingLeft: "20px",
    paddingRight: "30px",
    paddingTop: "24px",
    paddingBottom: "16px",
    fontSize: "12px",
    fontWeight: "400",
    lineHeight: "22px",
    color: "#1B1B1B",
  },
  footer: {
    flexShrink: 0,
    display: "flex",
    justifyContent: "center",
    paddingTop: "16px",
    paddingBottom: "16px",
  },
  okBtn: {
    height: "32px",
    minWidth: "84px",
    background: "#0078D4",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "13px",
    fontWeight: "700",
    lineHeight: "16px",
    color: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
});

const MessageDialog: React.FC<MessageDialogProps> = ({ title, text, onClose, inline }) => {
  const s = useStyles();
  return (
    <div className={s.root} style={inline ? { height: "auto" } : undefined}>
      <div className={s.header}>
        <div className={s.iconBox}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="0.5" y="0.5" width="15" height="15" rx="7.5" stroke="#0078D4" strokeWidth="1.4" />
            <rect x="7.25" y="5" width="1.5" height="5" rx="0.75" fill="#0078D4" />
            <rect x="7.25" y="10.25" width="1.5" height="1.5" rx="0.75" fill="#0078D4" />
          </svg>
        </div>
        <span className={s.titleText}>{title}</span>
      </div>
      <div className={s.divider} />
      <div className={s.body} style={inline ? { overflowY: "visible", flex: "none" } : undefined}>{text}</div>
      <div className={s.footer}>
        <button className={s.okBtn} onClick={onClose}>OK</button>
      </div>
    </div>
  );
};

export default MessageDialog;
