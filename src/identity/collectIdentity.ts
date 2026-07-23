// TEMPORARY identity diagnostic spike — throwaway, remove once the client's
// Microsoft-identity cloud-sync question is answered (see project notes).
//
// Confirms whether the token `oid` claim is a stable, identical identifier
// for the signed-in user across Word, PowerPoint, and Outlook, desktop + web.

/* global Office */

import { ssoSilentAccount, getSignedInAccount } from "@/graph/auth";
import { dbg } from "@/debug/log";

// MSAL types idTokenClaims loosely (Record<string, unknown> spread); narrow to
// just the fields this spike reads.
interface IdentityTokenClaims {
  oid?: string;
  sub?: string;
  tid?: string;
  preferred_username?: string;
  name?: string;
}

export interface IdentitySnapshot {
  host: string | null;
  platform: string | null;
  version: string | null;

  mailboxDisplayName: string | null;
  mailboxEmailAddress: string | null;
  mailboxAccountType: string | null;

  silentWorked: boolean;

  oid: string | null;
  sub: string | null;
  tid: string | null;
  preferredUsername: string | null;
  name: string | null;
  localAccountId: string | null;
  homeAccountId: string | null;
  username: string | null;
  environment: string | null;
  tenantId: string | null;
}

export async function collectIdentity(): Promise<IdentitySnapshot> {
  let host: string | null = null;
  let platform: string | null = null;
  let version: string | null = null;
  try {
    const diag = Office.context.diagnostics;
    host = diag?.host != null ? String(diag.host) : null;
    platform = diag?.platform != null ? String(diag.platform) : null;
    version = diag?.version ?? null;
  } catch {
    // Office.context.diagnostics is always present once Office.onReady fires — ignore otherwise.
  }

  let mailboxDisplayName: string | null = null;
  let mailboxEmailAddress: string | null = null;
  let mailboxAccountType: string | null = null;
  try {
    const p = Office.context.mailbox?.userProfile;
    if (p) {
      mailboxDisplayName = p.displayName ?? null;
      mailboxEmailAddress = p.emailAddress ?? null;
      mailboxAccountType = p.accountType ?? null;
    }
  } catch {
    // Office.context.mailbox only exists in Outlook — absent in Word/PowerPoint.
  }

  // ssoSilent (NAA broker) resolves the current Office user with no popup and no
  // pre-cached account — the path Word-on-the-web needs. Fall back to an already
  // cached account (e.g. Outlook after a prior sign-in).
  let account = await ssoSilentAccount();
  const silentWorked = account !== null;
  if (!account) account = await getSignedInAccount();
  const claims = account?.idTokenClaims as IdentityTokenClaims | undefined;

  const snapshot: IdentitySnapshot = {
    host,
    platform,
    version,
    mailboxDisplayName,
    mailboxEmailAddress,
    mailboxAccountType,
    silentWorked,
    oid: claims?.oid ?? null,
    sub: claims?.sub ?? null,
    tid: claims?.tid ?? null,
    preferredUsername: claims?.preferred_username ?? null,
    name: claims?.name ?? null,
    localAccountId: account?.localAccountId ?? null,
    homeAccountId: account?.homeAccountId ?? null,
    username: account?.username ?? null,
    environment: account?.environment ?? null,
    tenantId: account?.tenantId ?? null,
  };

  dbg("IDENTITY-SPIKE", "snapshot", snapshot);
  return snapshot;
}
