// src/dialog/components/InfoMessageCard.tsx
// Reusable floating draggable info card — wraps MessageDialog.
// Render inside any position:relative/absolute container; manages its own position.

import React from "react";
import MessageDialog from "@/dialog/components/MessageDialog";
import { useDraggable } from "@/dialog/hooks/useDraggable";

export interface InfoMessageCardProps {
  title: string;
  text: string;
  onClose: () => void;
  initialX?: number;
  initialY?: number;
}

export function InfoMessageCard({ title, text, onClose, initialX = 110, initialY = 60 }: InfoMessageCardProps) {
  const { pos, onHeaderMouseDown: onMouseDown } = useDraggable({ initialX, initialY });

  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position: "absolute",
        left: pos.x,
        top: pos.y,
        width: 430,
        zIndex: 210,
        cursor: "grab",
        userSelect: "none",
        borderRadius: 6,
        overflow: "hidden",
        boxShadow: "0px 6px 24px rgba(0,0,0,0.18), 0px 1px 4px rgba(0,0,0,0.08)",
        border: "1px solid #E0E0E0",
      }}
    >
      <MessageDialog title={title} text={text} onClose={onClose} inline />
    </div>
  );
}
