// src/dialog/views/KeywordSettingsView.tsx
//
// Speak Logic Settings — People & Keywords guard.
// Manage a global banned-words list plus per-person lists, choose Warn vs Stop
// behaviour before sending, and import words from a .txt file (one per line).
// Consumed at send time by the Outlook OnMessageSend handler (commands.ts).

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { FooterBar, DismissBtn, PrimaryBtn, FooterStatusText } from "@/dialog/components/FooterButtons";
import { Spinner } from "@fluentui/react-components";
import { useDialogComm } from "@/dialog/hooks/useDialogComm";
import { HamburgerIcon } from "@/dialog/components/Icons";
import { colors } from "@/styles/tokens";
import type { KeywordRule, KeywordSendMode, SaveKeywordRulesPayload } from "@/types/db";

const GLOBAL_KEY = "__global__";

type Draft = Omit<KeywordRule, "id">;

const inputStyle: React.CSSProperties = {
  width: "100%", height: "32px", border: "1px solid #C7C7C7", borderRadius: "4px",
  padding: "0 11px", fontSize: "12.2px", fontFamily: "inherit", color: colors.grey11,
  background: colors.white, outline: "none", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  fontSize: "11.8px", fontWeight: 700, color: colors.grey11, lineHeight: "14px",
};

function scopeKey(r: { personName: string; personEmail: string; isGlobal: boolean }): string {
  return r.isGlobal ? GLOBAL_KEY : `${r.personName.trim().toLowerCase()}|${r.personEmail.trim().toLowerCase()}`;
}

export default function KeywordSettingsView() {
  const { initData, submitSave, saving, closeDialog } = useDialogComm();
  const [rules, setRules] = useState<Draft[]>([]);
  const [sendMode, setSendMode] = useState<KeywordSendMode>("warn");
  const [activeScope, setActiveScope] = useState<string>(GLOBAL_KEY);
  const [wordInput, setWordInput] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Load from init payload ──────────────────────────────────────────────
  useEffect(() => {
    if (!initData) return;
    const loaded = (initData.keywordRules ?? []).map((r) => ({
      personName: r.personName, personEmail: r.personEmail, keyword: r.keyword, isGlobal: r.isGlobal,
    }));
    setRules(loaded);
    setSendMode(initData.keywordSendMode ?? "warn");
  }, [initData]);

  // People scopes = contacts from the project + any person already in a rule.
  const personScopes = useMemo(() => {
    const map = new Map<string, { name: string; email: string }>();
    for (const c of initData?.contacts ?? []) {
      const key = `${c.personName.trim().toLowerCase()}|${(c.emailAddress ?? "").trim().toLowerCase()}`;
      if (c.personName.trim()) map.set(key, { name: c.personName, email: c.emailAddress ?? "" });
    }
    for (const r of rules) {
      if (r.isGlobal) continue;
      const key = `${r.personName.trim().toLowerCase()}|${r.personEmail.trim().toLowerCase()}`;
      if (!map.has(key)) map.set(key, { name: r.personName, email: r.personEmail });
    }
    return Array.from(map.entries()).map(([key, v]) => ({ key, ...v }));
  }, [initData, rules]);

  const activePerson = useMemo(
    () => personScopes.find((p) => p.key === activeScope),
    [personScopes, activeScope]
  );

  const wordsInScope = useMemo(
    () => rules.filter((r) => scopeKey(r) === activeScope),
    [rules, activeScope]
  );

  // ── Mutations ───────────────────────────────────────────────────────────
  const removeWord = useCallback((keyword: string) => {
    setRules((prev) => prev.filter((r) => !(scopeKey(r) === activeScope && r.keyword === keyword)));
  }, [activeScope]);

  // Holds a just-created person until their first word is added (a scope only
  // becomes "real" in personScopes once it has a rule, so we stash the identity).
  const pendingPerson = useRef<{ name: string; email: string; key: string } | null>(null);

  const addPerson = useCallback(() => {
    if (!newName.trim() && !newEmail.trim()) return;
    const key = `${newName.trim().toLowerCase()}|${newEmail.trim().toLowerCase()}`;
    pendingPerson.current = { name: newName.trim(), email: newEmail.trim(), key };
    setActiveScope(key);
    setNewName(""); setNewEmail("");
  }, [newName, newEmail]);

  // If a pending person matches the active scope, route word adds to them.
  const effectivePerson = activePerson ?? (pendingPerson.current && pendingPerson.current.key === activeScope ? pendingPerson.current : undefined);

  const addWordsEffective = useCallback((raw: string[]) => {
    const isGlobal = activeScope === GLOBAL_KEY;
    const name = isGlobal ? "" : effectivePerson?.name ?? "";
    const email = isGlobal ? "" : effectivePerson?.email ?? "";
    setRules((prev) => {
      const next = [...prev];
      for (const w of raw) {
        const kw = w.trim();
        if (!kw) continue;
        const dup = next.some((r) => scopeKey(r) === activeScope && r.keyword.trim().toLowerCase() === kw.toLowerCase());
        if (!dup) next.push({ personName: name, personEmail: email, keyword: kw, isGlobal });
      }
      return next;
    });
  }, [activeScope, effectivePerson]);

  const onAddOne = useCallback(() => {
    if (!wordInput.trim()) return;
    addWordsEffective([wordInput]);
    setWordInput("");
  }, [wordInput, addWordsEffective]);

  const onImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const words = text.split(/\r?\n/).map((w) => w.trim()).filter(Boolean);
      addWordsEffective(words);
    };
    reader.readAsText(file);
    e.target.value = "";
  }, [addWordsEffective]);

  const save = useCallback(() => {
    const cleaned = rules.filter((r) => r.keyword.trim());
    const payload: SaveKeywordRulesPayload = { rules: cleaned, sendMode };
    submitSave({ action: "SAVE_KEYWORD_RULES", payload });
  }, [rules, sendMode, submitSave]);

  if (!initData) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <Spinner label="Loading..." />
      </div>
    );
  }

  const totalWords = rules.filter((r) => r.keyword.trim()).length;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: colors.white, fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* Title */}
      <div style={{ height: "78px", display: "flex", alignItems: "center", padding: "0 20px", gap: "12px", flexShrink: 0 }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: colors.grey95, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <HamburgerIcon />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "3px" }}>
          <span style={{ fontSize: "15.6px", fontWeight: 700, lineHeight: "21px", letterSpacing: "-0.1px", color: colors.grey11 }}>
            People &amp; Keywords
          </span>
          <span style={{ fontSize: "11.1px", fontWeight: 400, lineHeight: "17px", color: colors.grey38 }}>
            Warn or stop sending when an email contains a flagged word.
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 16px" }}>
        {/* Send mode */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ ...labelStyle, marginBottom: "6px" }}>When a flagged word is found</div>
          <div style={{ display: "flex", gap: "8px" }}>
            {(["warn", "stop"] as KeywordSendMode[]).map((m) => {
              const on = sendMode === m;
              return (
                <button
                  key={m}
                  onClick={() => setSendMode(m)}
                  style={{
                    flex: 1, height: "36px", borderRadius: "6px", cursor: "pointer",
                    border: on ? "1.5px solid #0078D4" : "1px solid #C7C7C7",
                    background: on ? colors.grey95 : colors.white,
                    color: on ? "#0078D4" : colors.grey38, fontWeight: 600, fontSize: "12px",
                  }}
                >
                  {m === "warn" ? "Warn user before sending" : "Stop user from sending"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scope selector */}
        <div style={{ marginBottom: "12px" }}>
          <div style={{ ...labelStyle, marginBottom: "6px" }}>Keyword list for</div>
          <select
            value={activeScope}
            onChange={(e) => { setActiveScope(e.target.value); }}
            style={{ ...inputStyle, appearance: "auto" as React.CSSProperties["appearance"] }}
          >
            <option value={GLOBAL_KEY}>Global — applies to every recipient</option>
            {pendingPerson.current && !personScopes.some((p) => p.key === pendingPerson.current!.key) && (
              <option value={pendingPerson.current.key}>
                {pendingPerson.current.name || pendingPerson.current.email}
              </option>
            )}
            {personScopes.map((p) => (
              <option key={p.key} value={p.key}>
                {p.name}{p.email ? ` (${p.email})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Add a new person */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
          <input style={{ ...inputStyle, flex: 1 }} placeholder="New person name" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <input style={{ ...inputStyle, flex: 1 }} placeholder="Email (optional)" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
          <button onClick={addPerson} style={{ height: "32px", padding: "0 12px", borderRadius: "4px", border: "1px solid #C7C7C7", background: colors.white, cursor: "pointer", fontSize: "12px", fontWeight: 600, color: colors.grey11, whiteSpace: "nowrap" }}>
            + Person
          </button>
        </div>

        {/* Word add row */}
        <div style={{ ...labelStyle, marginBottom: "6px" }}>
          Words {activeScope === GLOBAL_KEY ? "(global)" : effectivePerson ? `for ${effectivePerson.name || effectivePerson.email}` : ""}
        </div>
        <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
          <input
            style={{ ...inputStyle, flex: 1 }}
            placeholder="Type a word and press Enter"
            value={wordInput}
            onChange={(e) => setWordInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAddOne(); } }}
          />
          <button onClick={onAddOne} style={{ height: "32px", padding: "0 14px", borderRadius: "4px", border: "1px solid #0078D4", background: "#0078D4", color: colors.white, cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>
            Add
          </button>
          <button onClick={() => fileRef.current?.click()} style={{ height: "32px", padding: "0 12px", borderRadius: "4px", border: "1px solid #C7C7C7", background: colors.white, cursor: "pointer", fontSize: "12px", fontWeight: 600, color: colors.grey11, whiteSpace: "nowrap" }}>
            Import .txt
          </button>
          <input ref={fileRef} type="file" accept=".txt,text/plain" style={{ display: "none" }} onChange={onImportFile} />
        </div>

        {/* Word chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", minHeight: "40px", padding: "8px", border: "1px solid #E0E0E0", borderRadius: "6px", background: "#FAFAFA" }}>
          {wordsInScope.length === 0 && (
            <span style={{ fontSize: "11.5px", color: colors.grey38 }}>No words yet for this list.</span>
          )}
          {wordsInScope.map((r) => (
            <span key={r.keyword} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 8px", borderRadius: "14px", background: "#FDE7E9", color: colors.redDestructive, fontSize: "11.6px", fontWeight: 600 }}>
              {r.keyword}
              <button onClick={() => removeWord(r.keyword)} aria-label={`Remove ${r.keyword}`} style={{ border: "none", background: "transparent", cursor: "pointer", color: colors.redDestructive, fontSize: "13px", lineHeight: 1, padding: 0 }}>
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <FooterBar>
        <FooterStatusText>{totalWords} word{totalWords === 1 ? "" : "s"} across all lists</FooterStatusText>
        <DismissBtn label="Close" onClick={closeDialog} />
        <PrimaryBtn label={saving ? "Saving…" : "Save"} onClick={save} disabled={saving} />
      </FooterBar>
    </div>
  );
}
