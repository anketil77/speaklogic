// src/graph/auth.ts
//
// NAA (Nested App Authentication) wrapper for MSAL.js, used for Microsoft Graph
// calls (mail folders + inbox rules). createNestablePublicClientApplication
// detects the Office.js iframe and uses the Office identity broker (the
// brk-multihub redirect URIs in the Azure app registration); it falls back to a
// standard MSAL popup when NAA is unavailable (e.g. localhost dev).
//
// The client ID is a PUBLIC value (not a secret) so it is safe to ship in the
// bundle. Override via AZURE_CLIENT_ID at build time if needed.

/* global console process */

import {
  createNestablePublicClientApplication,
  type IPublicClientApplication,
  type AccountInfo,
} from "@azure/msal-browser";

// Azure app registration "Application (client) ID" — Speak Logic, personal +
// org accounts, delegated Mail.ReadWrite + MailboxSettings.ReadWrite + User.Read.
export const GRAPH_CLIENT_ID: string =
  (typeof process !== "undefined" && process.env && process.env.AZURE_CLIENT_ID) ||
  "3ad7751b-5004-4b3d-a968-e8c1a0829f88";

export const GRAPH_SCOPES = [
  "https://graph.microsoft.com/Mail.ReadWrite",
  "https://graph.microsoft.com/MailboxSettings.ReadWrite",
  "https://graph.microsoft.com/User.Read",
  "openid",
  "profile",
];

let _pca: IPublicClientApplication | null = null;
let _initPromise: Promise<IPublicClientApplication> | null = null;

export async function getMsalInstance(): Promise<IPublicClientApplication> {
  if (_pca) return _pca;
  if (_initPromise) return _initPromise;
  _initPromise = createNestablePublicClientApplication({
    auth: {
      clientId: GRAPH_CLIENT_ID,
      authority: "https://login.microsoftonline.com/common",
    },
    // localStorage is shared across same-origin windows (dialog + commands runtime)
    // so a token acquired in one can be reused silently in another.
    cache: { cacheLocation: "localStorage" },
  }).then((pca) => {
    _pca = pca;
    return pca;
  });
  return _initPromise;
}

/** Interactive token acquisition — silent first, popup fallback. */
export async function acquireToken(): Promise<string> {
  const pca = await getMsalInstance();
  const account = pca.getAllAccounts()[0] ?? null;
  try {
    const result = await pca.acquireTokenSilent({ scopes: GRAPH_SCOPES, account: account ?? undefined });
    return result.accessToken;
  } catch {
    const result = await pca.acquireTokenPopup({ scopes: GRAPH_SCOPES });
    return result.accessToken;
  }
}

/** Silent-only — never prompts. Returns null if no cached account/token. */
export async function acquireTokenSilentOnly(): Promise<string | null> {
  try {
    const pca = await getMsalInstance();
    const account = pca.getAllAccounts()[0] ?? null;
    if (!account) return null;
    const result = await pca.acquireTokenSilent({ scopes: GRAPH_SCOPES, account });
    return result.accessToken;
  } catch {
    return null;
  }
}

export async function getSignedInAccount(): Promise<AccountInfo | null> {
  try {
    const pca = await getMsalInstance();
    return pca.getAllAccounts()[0] ?? null;
  } catch {
    return null;
  }
}

export async function signOut(): Promise<void> {
  // NAA doesn't support logoutPopup/logoutRedirect — clear the local token cache.
  try {
    const pca = await getMsalInstance();
    await pca.clearCache();
  } catch {
    /* ignore — signing out regardless */
  } finally {
    _pca = null;
    _initPromise = null;
  }
}
