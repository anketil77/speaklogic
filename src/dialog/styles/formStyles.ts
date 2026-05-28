import type { CSSProperties } from "react";

export const inputStyle: CSSProperties = {
  width: "100%",
  height: 32,
  border: "1px solid #C7C7C7",
  borderRadius: 4,
  padding: "0 11px",
  fontSize: "12.1px",
  fontFamily: "inherit",
  color: "#1B1B1B",
  background: "#FFFFFF",
  boxSizing: "border-box",
  outline: "none",
};

export const readonlyInputStyle: CSSProperties = {
  ...inputStyle,
  background: "#FAFAFA",
  cursor: "default",
};
