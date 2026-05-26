import React from "react";

export interface PanelTableCol<T> {
  header: string;
  width: string;
  render: (item: T, index: number) => React.ReactNode;
  truncate?: boolean;
}

export interface PanelTableProps<T> {
  columns: PanelTableCol<T>[];
  rows: T[];
  selectedIndex?: number | null;
  onRowClick?: (index: number) => void;
  onRowContextMenu?: (e: React.MouseEvent, index: number | null) => void;
  selectionColor?: string;
  emptyText?: string;
  children?: React.ReactNode;
}

const TH: React.CSSProperties = {
  padding: "7px 10px",
  textAlign: "left",
  fontSize: "10px",
  fontWeight: 600,
  color: "#555",
  textTransform: "uppercase",
  background: "#F5F5F5",
  borderBottom: "1px solid #E0E0E0",
  whiteSpace: "nowrap",
};

const TD: React.CSSProperties = {
  padding: "7px 10px",
  borderBottom: "1px solid #F0F0F0",
  fontSize: "12px",
  color: "#222",
  verticalAlign: "top",
};

const TRUNCATE: React.CSSProperties = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export function PanelTable<T>({
  columns,
  rows,
  selectedIndex,
  onRowClick,
  onRowContextMenu,
  selectionColor = "#EBF3FC",
  emptyText = "No items.",
  children,
}: PanelTableProps<T>) {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", flex: 1, overflowY: "auto", overflowX: "hidden", position: "relative" }}
      onContextMenu={onRowContextMenu ? (e) => { e.preventDefault(); onRowContextMenu(e, null); } : undefined}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", fontSize: "12px" }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.header} style={{ ...TH, width: col.width }}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: "32px 16px", textAlign: "center", color: "#999", fontSize: "12px" }}>
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr
                key={idx}
                onClick={onRowClick ? () => onRowClick(idx) : undefined}
                onContextMenu={onRowContextMenu ? (e) => { e.preventDefault(); e.stopPropagation(); onRowContextMenu(e, idx); } : undefined}
                style={{
                  cursor: onRowClick ? "pointer" : onRowContextMenu ? "context-menu" : "default",
                  background: selectedIndex === idx ? selectionColor : "transparent",
                }}
              >
                {columns.map((col) => (
                  <td key={col.header} style={col.truncate ? { ...TD, ...TRUNCATE } : TD}>
                    {col.render(row, idx)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {children}
    </div>
  );
}
