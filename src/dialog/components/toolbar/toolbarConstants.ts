// src/dialog/components/toolbar/toolbarConstants.ts
import React from "react";

export const FONT_COLORS = [
  "#1B1B1B",
  "#D13438",
  "#F7630C",
  "#F8D44A",
  "#107C10",
  "#0078D4",
  "#744DA9",
  "#FFFFFF",
] as const;

export const HIGHLIGHT_COLORS = [
  "#F8D44A",
  "#92D050",
  "#00B0F0",
  "#FF69B4",
  "#FF0000",
  "#FFA500",
  "#FFFFFF",
] as const;

export const FR_FONT = "'Segoe UI Variable','Segoe UI',system-ui,sans-serif";

export const iconBtnBase: React.CSSProperties = {
  width: "28px",
  height: "28px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  background: "transparent",
  border: "none",
  borderRadius: "4px",
  padding: "0",
  flexShrink: 0,
  fontFamily: "inherit",
};

export const frBtnBase: React.CSSProperties = {
  height: "26px",
  padding: "0 13px",
  border: "1px solid #C7C7C7",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "11px",
  fontFamily: FR_FONT,
  fontWeight: 500,
  whiteSpace: "nowrap",
};

export const frBtnPrimary: React.CSSProperties = {
  ...frBtnBase,
  background: "#0078D4",
  color: "#FFFFFF",
  border: "1px solid #0078D4",
  fontWeight: 600,
};

export const frBtnSecondary: React.CSSProperties = {
  ...frBtnBase,
  background: "#FFFFFF",
  color: "#1B1B1B",
};

export const toolbarSep: React.CSSProperties = {
  width: "1px",
  height: "20px",
  background: "#E0E0E0",
  margin: "0 8px",
  flexShrink: 0,
};
