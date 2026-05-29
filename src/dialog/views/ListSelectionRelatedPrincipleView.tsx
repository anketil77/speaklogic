import React from "react";
import { ListSelectionRelatedPrinciplePortal } from "@/dialog/components/ListSelectionRelatedPrinciplePortal";
import { useDialogComm } from "@/dialog/hooks/useDialogComm";

export default function ListSelectionRelatedPrincipleView() {
  const { initData, sendMessage } = useDialogComm();
  if (!initData) return null;
  return (
    <ListSelectionRelatedPrinciplePortal
      relations={initData.selectionsWithPrinciple ?? []}
      sendMessage={sendMessage}
      onClose={() => sendMessage({ action: "CLOSE" })}
    />
  );
}
