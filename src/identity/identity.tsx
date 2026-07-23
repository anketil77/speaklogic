// TEMPORARY identity diagnostic spike — throwaway page, remove once the
// Microsoft-identity cloud-sync question is answered. Large/high-contrast by
// design: a non-technical user screenshots this on the client's own accounts.

/* global Office */

import React, { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { collectIdentity, type IdentitySnapshot } from "./collectIdentity";
import { acquireToken, getMsalInstance, GRAPH_CLIENT_ID } from "@/graph/auth";

// A popup that fails externally (e.g. an unregistered redirect_uri) can leave
// MSAL's "interaction_in_progress" flag stuck, blocking every later sign-in.
// The flag lives in sessionStorage (which survives a page refresh), so clear
// both stores — MSAL keys only, never the sql.js DB blob.
function clearStuckAuthState() {
  for (const store of [localStorage, sessionStorage]) {
    try {
      Object.keys(store)
        .filter((k) => k.startsWith("msal.") || k.includes("interaction.status") || k.includes(GRAPH_CLIENT_ID))
        .forEach((k) => store.removeItem(k));
    } catch {
      // storage may be unavailable in some sandboxed hosts — ignore.
    }
  }
}

const styles = {
  page: {
    fontFamily: "'Segoe UI', -apple-system, sans-serif",
    background: "#ffffff",
    color: "#323130",
    minHeight: "100vh",
    padding: "12px 14px",
    fontSize: "12px",
    lineHeight: 1.4,
  } as React.CSSProperties,
  headerRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap" as const,
    marginBottom: "10px",
  },
  headerTile: {
    flex: "1 1 auto",
    minWidth: "84px",
    background: "#faf9f8",
    border: "1px solid #edebe9",
    borderRadius: "4px",
    padding: "6px 8px",
  } as React.CSSProperties,
  headerLabel: {
    fontSize: "10px",
    fontWeight: 600,
    letterSpacing: "0.4px",
    textTransform: "uppercase" as const,
    color: "#605e5c",
    marginBottom: "2px",
  },
  headerValue: {
    fontSize: "13px",
    fontWeight: 600,
    wordBreak: "break-word" as const,
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    padding: "5px 0",
    borderBottom: "1px solid #f3f2f1",
  } as React.CSSProperties,
  rowLabel: { color: "#605e5c", minWidth: "120px" },
  rowValue: {
    fontWeight: 600,
    wordBreak: "break-all" as const,
    textAlign: "right" as const,
    fontFamily: "'Consolas', 'Courier New', monospace",
    fontSize: "11px",
  },
  oidBox: {
    background: "#f3f9f1",
    border: "1px solid #107c10",
    borderRadius: "4px",
    padding: "8px 10px",
    margin: "10px 0",
  } as React.CSSProperties,
  oidLabel: { fontSize: "10px", fontWeight: 600, letterSpacing: "0.4px", textTransform: "uppercase" as const, color: "#107c10" },
  oidValue: { fontSize: "13px", fontWeight: 700, wordBreak: "break-all" as const, marginTop: "3px", fontFamily: "'Consolas', 'Courier New', monospace" },
  pill: (ok: boolean) => ({
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "2px",
    fontWeight: 600,
    fontSize: "11px",
    background: ok ? "#dff6dd" : "#fde7e9",
    color: ok ? "#107c10" : "#a4262c",
    border: `1px solid ${ok ? "#107c10" : "#a4262c"}`,
  } as React.CSSProperties),
  button: {
    fontSize: "13px",
    fontWeight: 600,
    padding: "6px 14px",
    borderRadius: "2px",
    border: "none",
    cursor: "pointer",
    marginRight: "8px",
    marginTop: "10px",
  } as React.CSSProperties,
  signInButton: { background: "#0078d4", color: "#ffffff" },
  secondaryButton: { background: "#f3f2f1", color: "#323130", border: "1px solid #8a8886" },
};

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div style={styles.row}>
      <span style={styles.rowLabel}>{label}</span>
      <span style={styles.rowValue}>{value ?? "—"}</span>
    </div>
  );
}

function IdentityApp() {
  const [snapshot, setSnapshot] = useState<IdentitySnapshot | null>(null);
  const [copied, setCopied] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const refresh = useCallback(() => {
    collectIdentity().then(setSnapshot);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSignIn = useCallback(async () => {
    setSigningIn(true);
    setNote(null);
    clearStuckAuthState();
    try {
      await acquireToken();
      refresh();
    } catch (err) {
      setNote("Sign-in failed: " + String(err));
    } finally {
      setSigningIn(false);
    }
  }, [refresh]);

  const handleCopy = useCallback(async () => {
    if (!snapshot) return;
    // Word/Outlook add-in iframes often block the Clipboard API via permissions policy.
    try {
      await navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setNote("Clipboard is blocked in this app — screenshot the values instead.");
    }
  }, [snapshot]);

  if (!snapshot) {
    return <div style={styles.page}>Loading identity snapshot…</div>;
  }

  const hasAccount = snapshot.oid || snapshot.username;

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div style={styles.headerTile}>
          <div style={styles.headerLabel}>Host</div>
          <div style={styles.headerValue}>{snapshot.host ?? "—"}</div>
        </div>
        <div style={styles.headerTile}>
          <div style={styles.headerLabel}>Platform</div>
          <div style={styles.headerValue}>{snapshot.platform ?? "—"}</div>
        </div>
        <div style={styles.headerTile}>
          <div style={styles.headerLabel}>Version</div>
          <div style={styles.headerValue}>{snapshot.version ?? "—"}</div>
        </div>
      </div>

      <div>
        <span style={styles.pill(snapshot.silentWorked)}>
          Silent SSO: {snapshot.silentWorked ? "yes" : "no"}
        </span>
      </div>

      {note && (
        <div style={{ margin: "8px 0", padding: "6px 8px", background: "#fff4ce", border: "1px solid #f2c94c", borderRadius: "4px", fontSize: "11px", color: "#605e5c", wordBreak: "break-word" }}>
          {note}
        </div>
      )}

      <div style={styles.oidBox}>
        <div style={styles.oidLabel}>oid (stable unique user id)</div>
        <div style={styles.oidValue}>{snapshot.oid ?? "not signed in"}</div>
      </div>

      {!hasAccount && (
        <button style={{ ...styles.button, ...styles.signInButton }} onClick={handleSignIn} disabled={signingIn}>
          {signingIn ? "Signing in…" : "Sign in"}
        </button>
      )}

      <Row label="sub" value={snapshot.sub} />
      <Row label="tid" value={snapshot.tid} />
      <Row label="preferred_username" value={snapshot.preferredUsername} />
      <Row label="name" value={snapshot.name} />
      <Row label="localAccountId" value={snapshot.localAccountId} />
      <Row label="homeAccountId" value={snapshot.homeAccountId} />
      <Row label="username" value={snapshot.username} />
      <Row label="environment" value={snapshot.environment} />
      <Row label="tenantId" value={snapshot.tenantId} />
      <Row label="mailbox displayName" value={snapshot.mailboxDisplayName} />
      <Row label="mailbox emailAddress" value={snapshot.mailboxEmailAddress} />
      <Row label="mailbox accountType" value={snapshot.mailboxAccountType} />

      <div>
        <button style={{ ...styles.button, ...styles.secondaryButton }} onClick={handleCopy}>
          {copied ? "Copied!" : "Copy JSON"}
        </button>
        <button style={{ ...styles.button, ...styles.secondaryButton }} onClick={refresh}>
          Refresh
        </button>
      </div>
    </div>
  );
}

// When this page loads inside the MSAL sign-in popup, the URL carries the auth
// response (#code=... or #error=...). Don't boot the app there — a second app
// instance would attempt its own auth and MSAL blocks it (block_nested_popups).
// Just complete the handshake so the opener receives the token, then let the
// popup close itself.
const authHash = window.location.hash || "";
if (authHash.includes("code=") || authHash.includes("error=")) {
  getMsalInstance()
    .then((pca) => pca.handleRedirectPromise())
    .catch(() => {
      /* opener owns the result; nothing to render here */
    });
} else {
  Office.onReady(() => {
    const container = document.getElementById("root");
    if (container) {
      createRoot(container).render(<IdentityApp />);
    }
  });
}
