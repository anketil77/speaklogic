import React from "react";

export function CmdSep() {
  return (
    <div style={{ width: 1, height: 20, background: "#E0E0E0", flexShrink: 0, margin: "0 8px" }} />
  );
}

export function FormRow({
  label,
  children,
  alignTop = false,
  labelWidth = 178,
}: {
  label: string;
  children: React.ReactNode;
  alignTop?: boolean;
  labelWidth?: number;
}) {
  return (
    <div style={{ display: "flex", alignItems: alignTop ? "flex-start" : "center", gap: 0 }}>
      <div
        style={{
          width: labelWidth,
          minWidth: labelWidth,
          fontSize: "11.6px",
          fontWeight: 700,
          color: "#1B1B1B",
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
