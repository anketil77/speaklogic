import React, { useState } from "react";
import { ListIdentifiedPrinciplePortal } from "@/dialog/components/ListIdentifiedPrinciplePortal";
import { ViewPrincipleDetailDialog } from "@/dialog/components/ViewPrincipleDetailDialog";
import { InterpretePrincipleDialog } from "@/dialog/components/InterpretePrincipleDialog";
import { useDialogComm } from "@/dialog/hooks/useDialogComm";
import type { PrincipleInSelection } from "@/types/db";

export default function ListIdentifiedPrincipleView() {
  const { initData, sendMessage, submitSave } = useDialogComm();
  const [viewIdentified, setViewIdentified] = useState<PrincipleInSelection | null>(null);
  const [interpretPrinciple, setInterpretPrinciple] = useState<PrincipleInSelection | null>(null);
  if (!initData) return null;
  const filesByPrincipleInSelectionId = initData.filesByPrincipleInSelectionId ?? {};
  return (
    <>
      <ListIdentifiedPrinciplePortal
        principles={initData.principlesInSelection ?? []}
        sendMessage={sendMessage}
        onClose={() => sendMessage({ action: "CLOSE" })}
        onView={(p) => setViewIdentified(p)}
        onInterpret={(p) => setInterpretPrinciple(p)}
        standalone
      />
      {viewIdentified && (
        <ViewPrincipleDetailDialog
          title="View Identified Principle"
          subtitle="View details of the identified principle."
          aboutSelection={viewIdentified.actualSelection}
          actualPrinciple={viewIdentified.actualPrinciple}
          principleName={viewIdentified.principleName}
          setDerivedFrom={viewIdentified.setDerivedFrom}
          principleDescription={viewIdentified.principleDescription}
          communicationPrinciple={viewIdentified.communicationPrinciple}
          commPrincipleDescription={viewIdentified.commPrincipleDescription}
          files={viewIdentified.id !== undefined ? filesByPrincipleInSelectionId[viewIdentified.id] : []}
          onClose={() => setViewIdentified(null)}
        />
      )}
      {interpretPrinciple && (
        <InterpretePrincipleDialog
          principle={interpretPrinciple}
          defaultPerson={initData.personName}
          sendMessage={submitSave}
          onClose={() => setInterpretPrinciple(null)}
          onListIdentified={() => setInterpretPrinciple(null)}
          onListInterpreted={() => setInterpretPrinciple(null)}
        />
      )}
    </>
  );
}
