// src/db/queries/communication.ts

import { getDb, persistDb } from "@/db/db";
import type { CommunicationData, SaveCommunicationConfigPayload } from "@/types/db";

export function getCommunicationConfig(): CommunicationData | null {
  try {
    const db = getDb();
    const result = db.exec("SELECT * FROM CommunicationData LIMIT 1");
    if (!result.length || !result[0].values.length) return null;
    const [id, personName, personEmail, outgoingServer, incomingServer, userName, personPassword, serverSecurity, incomingPort, outgoingPort, useAuthentication] = result[0].values[0];
    return {
      id: id as number,
      personName: String(personName ?? ""),
      personEmail: String(personEmail ?? ""),
      outgoingServer: String(outgoingServer ?? ""),
      incomingServer: String(incomingServer ?? ""),
      userName: String(userName ?? ""),
      personPassword: String(personPassword ?? ""),
      serverSecurity: String(serverSecurity ?? "None"),
      incomingPort: Number(incomingPort ?? 995),
      outgoingPort: Number(outgoingPort ?? 25),
      useAuthentication: Boolean(useAuthentication),
    };
  } catch {
    return null;
  }
}

export function saveCommunicationConfig(payload: SaveCommunicationConfigPayload): void {
  const db = getDb();
  const existing = getCommunicationConfig();
  if (existing) {
    db.run(
      "UPDATE CommunicationData SET personName = ?, personEmail = ? WHERE id = ?",
      [payload.personName.trim(), payload.personEmail.trim(), existing.id as number]
    );
  } else {
    db.run(
      "INSERT INTO CommunicationData (personName, personEmail) VALUES (?, ?)",
      [payload.personName.trim(), payload.personEmail.trim()]
    );
  }
  persistDb();
}
