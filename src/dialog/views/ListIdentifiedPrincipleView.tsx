import React from "react";
import { ListIdentifiedPrinciplePortal } from "@/dialog/components/ListIdentifiedPrinciplePortal";
import { useDialogComm } from "@/dialog/hooks/useDialogComm";

export default function ListIdentifiedPrincipleView() {
  const { initData, sendMessage } = useDialogComm();
  if (!initData) return null;
  return (
    <ListIdentifiedPrinciplePortal
      principles={initData.principlesInSelection ?? []}
      sendMessage={sendMessage}
      onClose={() => sendMessage({ action: "CLOSE" })}
    />
  );
}
