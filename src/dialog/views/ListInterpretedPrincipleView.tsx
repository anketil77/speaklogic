import React from "react";
import { ListInterpretedPrinciplePortal } from "@/dialog/components/ListInterpretedPrinciplePortal";
import { useDialogComm } from "@/dialog/hooks/useDialogComm";

export default function ListInterpretedPrincipleView() {
  const { initData, sendMessage } = useDialogComm();
  if (!initData) return null;
  return (
    <ListInterpretedPrinciplePortal
      interpretations={initData.principleInterpretations ?? []}
      filesByInterpretationId={initData.filesByInterpretationId ?? {}}
      sendMessage={sendMessage}
      onClose={() => sendMessage({ action: "CLOSE" })}
      standalone
    />
  );
}
