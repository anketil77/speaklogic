// src/dialog/hooks/useDialogComm.ts
//
// useDialogComm is a thin context consumer. All Office.js communication
// (addHandlerAsync, messageParent) is owned exclusively by DialogApp in
// dialog/index.tsx — calling those APIs more than once per dialog page
// causes Office error 715-123280.

import { createContext, useContext } from "react";
import type { DialogInitPayload } from "@/types/db";

export interface DialogCommContextValue {
  initData: DialogInitPayload | null;
  sendMessage: (action: object) => void;
  closeDialog: () => void;
  mailtoUrl: string | null;
  retainSaved: boolean;
}

export const DialogCommContext = createContext<DialogCommContextValue>({
  initData: null,
  sendMessage: () => {},
  closeDialog: () => {},
  mailtoUrl: null,
  retainSaved: false,
});

export function useDialogComm(): DialogCommContextValue {
  return useContext(DialogCommContext);
}
