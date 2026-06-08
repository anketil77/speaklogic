import React, { useState } from "react";
import { ListSelectionRelatedPrinciplePortal } from "@/dialog/components/ListSelectionRelatedPrinciplePortal";
import { ViewPrincipleDetailDialog } from "@/dialog/components/ViewPrincipleDetailDialog";
import { useDialogComm } from "@/dialog/hooks/useDialogComm";
import type { SelectionWithPrinciple } from "@/types/db";

export default function ListSelectionRelatedPrincipleView() {
  const { initData, sendMessage } = useDialogComm();
  const [viewRelated, setViewRelated] = useState<SelectionWithPrinciple | null>(null);
  if (!initData) return null;
  const filesBySelectionWithPrincipleId = initData.filesBySelectionWithPrincipleId ?? {};
  return (
    <>
      <ListSelectionRelatedPrinciplePortal
        relations={initData.selectionsWithPrinciple ?? []}
        sendMessage={sendMessage}
        onClose={() => sendMessage({ action: "CLOSE" })}
        onView={(r) => setViewRelated(r)}
        standalone
      />
      {viewRelated && (
        <ViewPrincipleDetailDialog
          title="View Related Principle"
          subtitle="View details of the selection related to a principle."
          aboutSelection={viewRelated.actualSelection}
          actualPrinciple={viewRelated.actualPrinciple}
          principleName={viewRelated.principleName}
          setDerivedFrom={viewRelated.setDerivedFrom}
          principleDescription={viewRelated.principleDescription}
          communicationPrinciple={viewRelated.communicationPrinciple}
          commPrincipleDescription={viewRelated.commPrincipleDescription}
          actualRelationship={viewRelated.actualRelationship}
          relationshipDescription={viewRelated.relationshipDescription}
          files={viewRelated.id !== undefined ? filesBySelectionWithPrincipleId[viewRelated.id] : []}
          onClose={() => setViewRelated(null)}
        />
      )}
    </>
  );
}
