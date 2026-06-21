// src/dialog/views/PeopleView.tsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Spinner } from "@fluentui/react-components";
import { FooterBar, DismissBtn, PrimaryBtn } from "@/dialog/components/FooterButtons";
import { CloseIcon } from "@/dialog/components/Icons";
import { useDialogComm } from "@/dialog/hooks/useDialogComm";
import { colors } from "@/styles/tokens";
import type { ContactPerson } from "@/types/db";

// ── Column header ─────────────────────────────────────────────────────────────
const colHeader: React.CSSProperties = {
  fontSize: "10.8px", fontWeight: "700", color: colors.grey38,
  padding: "6px 10px", borderBottom: `1px solid ${colors.grey88}`,
  textTransform: "uppercase", letterSpacing: "0.4px", textAlign: "left",
};

const cellStyle: React.CSSProperties = {
  fontSize: "12px", color: colors.grey11, padding: "8px 10px",
  borderBottom: `1px solid ${colors.grey88}`, verticalAlign: "middle",
  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
};

const inputStyle: React.CSSProperties = {
  width: "100%", height: "30px", border: `1px solid ${colors.grey78}`, borderRadius: "4px",
  padding: "0 10px", fontSize: "12px", fontFamily: "inherit", color: colors.grey11,
  background: colors.white, outline: "none", boxSizing: "border-box",
};

const inputErrorStyle: React.CSSProperties = { ...inputStyle, borderColor: "#D13438" };

const labelStyle: React.CSSProperties = {
  fontSize: "11.4px", fontWeight: "700", color: colors.grey11, marginBottom: "4px", display: "block",
};

// ── Icons ─────────────────────────────────────────────────────────────────────
function PersonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="6" r="3.5" stroke="#4259C3" strokeWidth="1.4"/>
      <path d="M2 15c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="#4259C3" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function EditPencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M9.5 1.5l3 3-8 8H1.5v-3l8-8z" stroke="#616161" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 3l3 3" stroke="#616161" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function TrashIcon({ color = "#616161" }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 3.5h10M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M5.5 6v4.5M8.5 6v4.5M3 3.5l.75 8a.5.5 0 00.5.5h5.5a.5.5 0 00.5-.5L11 3.5"
        stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Initials avatar ───────────────────────────────────────────────────────────
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function InitialsAvatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: colors.grey95, border: `1.5px solid ${colors.purple}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, userSelect: "none",
      fontSize: size <= 28 ? "10px" : "11.5px",
      fontWeight: "700", color: colors.purple, letterSpacing: "0.3px",
    }}>
      {getInitials(name)}
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────
type FormState = {
  mode: "idle" | "add" | "edit";
  id: number | null;
  name: string;
  email: string;
  nameError: boolean;
  emailError: string | null;
};

const IDLE_FORM: FormState = { mode: "idle", id: null, name: "", email: "", nameError: false, emailError: null };

// ── Component ─────────────────────────────────────────────────────────────────
export default function PeopleView() {
  const { initData, sendMessage, closeDialog } = useDialogComm();
  const [contacts, setContacts] = useState<ContactPerson[]>([]);
  const [form, setForm] = useState<FormState>(IDLE_FORM);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const myName = initData?.communicationPersonName ?? "";
  const myEmail = initData?.communicationPersonEmail ?? "";
  const myEmailKey = myEmail.trim().toLowerCase();

  useEffect(() => {
    if (initData?.contacts) {
      // Hide the "you" row from the Other Contacts list. Filter by email when
      // possible because names are not unique — filtering on name alone would
      // hide unrelated contacts who happen to share the user's name.
      const filtered = initData.contacts.filter((c) => {
        const emailKey = (c.emailAddress ?? "").trim().toLowerCase();
        if (myEmailKey && emailKey) return emailKey !== myEmailKey;
        // Fall back to name when one side has no email configured.
        if (myName) return c.personName !== myName;
        return true;
      });
      setContacts(filtered);
    }
  }, [initData?.contacts, myEmailKey, myName]);

  useEffect(() => {
    if (form.mode !== "idle") setTimeout(() => nameInputRef.current?.focus(), 60);
  }, [form.mode]);

  const openAdd = useCallback(() => {
    setDeleteConfirmId(null);
    setForm({ mode: "add", id: null, name: "", email: "", nameError: false, emailError: null });
  }, []);

  const openEdit = useCallback((c: ContactPerson) => {
    setDeleteConfirmId(null);
    setForm({ mode: "edit", id: c.id, name: c.personName, email: c.emailAddress, nameError: false, emailError: null });
  }, []);

  const cancelForm = useCallback(() => setForm(IDLE_FORM), []);

  const saveForm = useCallback(() => {
    const cleanName = form.name.trim();
    const cleanEmail = form.email.trim();
    if (!cleanName) {
      setForm((f) => ({ ...f, nameError: true }));
      return;
    }
    // Email is the unique key — refuse client-side too so the user gets an
    // immediate, specific message instead of a generic host error.
    if (cleanEmail) {
      const emailKey = cleanEmail.toLowerCase();
      const allContacts = initData?.contacts ?? [];
      const clash = allContacts.find(
        (c) => (c.emailAddress ?? "").trim().toLowerCase() === emailKey && c.id !== form.id
      );
      if (clash) {
        setForm((f) => ({
          ...f,
          emailError: `Already used by "${clash.personName}". Each contact needs a unique email.`,
        }));
        return;
      }
    }
    if (form.mode === "add") {
      sendMessage({ action: "ADD_CONTACT", personName: cleanName, emailAddress: cleanEmail });
    } else if (form.mode === "edit" && form.id !== null) {
      sendMessage({ action: "UPDATE_CONTACT", id: form.id, personName: cleanName, emailAddress: cleanEmail });
    }
    setForm(IDLE_FORM);
  }, [form, sendMessage, initData?.contacts]);

  const confirmDelete = useCallback((id: number) => {
    setForm(IDLE_FORM);
    setDeleteConfirmId(id);
  }, []);

  const doDelete = useCallback((id: number) => {
    sendMessage({ action: "DELETE_CONTACT", id });
    setDeleteConfirmId(null);
  }, [sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") saveForm();
    if (e.key === "Escape") cancelForm();
  }, [saveForm, cancelForm]);

  if (!initData) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <Spinner label="Loading..." />
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: colors.white, fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ height: "78px", display: "flex", alignItems: "center", padding: "0 20px", gap: "12px", flexShrink: 0 }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: colors.grey95, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <PersonIcon />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "3px" }}>
          <span style={{ fontSize: "15.6px", fontWeight: "700", lineHeight: "21px", letterSpacing: "-0.1px", color: colors.grey11 }}>
            Contacts
          </span>
          <span style={{ fontSize: "11.1px", fontWeight: "400", lineHeight: "17px", color: colors.grey38 }}>
            Manage your contacts for use in feedback and analysis.
          </span>
        </div>
        {/* Add contact button in header */}
        {form.mode === "idle" && (
          <button
            onClick={openAdd}
            title="Add contact"
            style={{
              display: "flex", alignItems: "center", gap: "5px",
              height: "28px", padding: "0 12px",
              background: "#0078D4", color: colors.white,
              border: "none", borderRadius: "4px",
              fontSize: "11.6px", fontFamily: "inherit", fontWeight: "600",
              cursor: "pointer", flexShrink: 0,
            }}
          >
            <span style={{ fontSize: "15px", lineHeight: "1", marginTop: "-1px" }}>+</span>
            Add
          </button>
        )}
      </div>

      {/* ── Divider ─────────────────────────────────────────────────────────── */}
      <div style={{ height: "1px", background: colors.grey88, flexShrink: 0 }} />

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 10px" }}>

        {/* ── You card ────────────────────────────────────────────────────── */}
        <div style={{
          border: `1px solid ${colors.grey88}`, borderRadius: "8px",
          overflow: "hidden", marginBottom: "18px",
        }}>
          <div style={{
            background: colors.grey96, borderBottom: `1px solid ${colors.grey88}`,
            padding: "6px 14px", display: "flex", alignItems: "center", gap: "6px",
          }}>
            <span style={{ fontSize: "10.6px", fontWeight: "700", color: colors.grey38, textTransform: "uppercase", letterSpacing: "0.5px" }}>You</span>
          </div>
          <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: "12px" }}>
            {myName && <InitialsAvatar name={myName} size={34} />}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
              {myName ? (
                <>
                  <span style={{ fontSize: "12.4px", fontWeight: "700", color: colors.grey11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{myName}</span>
                  <span style={{ fontSize: "11.2px", color: myEmail ? colors.grey38 : colors.grey74, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{myEmail || "No email set"}</span>
                </>
              ) : (
                <span style={{ fontSize: "11.6px", color: colors.grey38, fontStyle: "italic" }}>Not configured — set your identity in Communication Configuration.</span>
              )}
            </div>
            <button
              onClick={() => sendMessage({ action: "OPEN_COMM_CONFIG" })}
              style={{
                marginLeft: "auto", flexShrink: 0, height: "26px", padding: "0 10px",
                border: `1px solid ${colors.grey78}`, borderRadius: "4px",
                background: colors.white, color: colors.grey38,
                fontSize: "11px", fontFamily: "inherit", cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Edit →
            </button>
          </div>
        </div>

        {/* ── Other contacts label ─────────────────────────────────────────── */}
        <div style={{ fontSize: "10.6px", fontWeight: "700", color: colors.grey38, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>
          Other Contacts
        </div>

        {/* ── Premium add/edit form card ───────────────────────────────────── */}
        {form.mode !== "idle" && (
          <div style={{
            background: colors.white,
            border: `1px solid ${colors.grey88}`,
            borderRadius: "8px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.09)",
            marginBottom: "16px",
            overflow: "hidden",
          }}>
            {/* Card header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "9px 16px",
              background: colors.grey96,
              borderBottom: `1px solid ${colors.grey88}`,
            }}>
              <span style={{ fontSize: "12px", fontWeight: "700", color: colors.grey11 }}>
                {form.mode === "add" ? "Add Contact" : "Edit Contact"}
              </span>
              <button
                onClick={cancelForm}
                title="Cancel"
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#F0F0F0"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                style={{
                  width: "22px", height: "22px", border: "none", background: "transparent",
                  cursor: "pointer", borderRadius: "4px", display: "flex",
                  alignItems: "center", justifyContent: "center", padding: 0,
                }}
              >
                <CloseIcon />
              </button>
            </div>

            {/* Card body — stacked inputs */}
            <div style={{ padding: "14px 16px 12px" }}>
              <div style={{ marginBottom: "10px" }}>
                <label style={labelStyle}>Name <span style={{ color: "#D13438" }}>*</span></label>
                <input
                  ref={nameInputRef}
                  style={form.nameError ? inputErrorStyle : inputStyle}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, nameError: false }))}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter full name"
                />
                {form.nameError && (
                  <span style={{ fontSize: "10.6px", color: "#D13438", marginTop: "3px", display: "block" }}>
                    Name is required
                  </span>
                )}
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  style={form.emailError ? inputErrorStyle : inputStyle}
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value, emailError: null }))}
                  onKeyDown={handleKeyDown}
                  placeholder="email@example.com"
                />
                {form.emailError && (
                  <span style={{ fontSize: "10.6px", color: "#D13438", marginTop: "3px", display: "block" }}>
                    {form.emailError}
                  </span>
                )}
              </div>
            </div>

            {/* Card footer buttons */}
            <div style={{
              display: "flex", justifyContent: "flex-end", gap: "8px",
              padding: "10px 16px",
              borderTop: `1px solid ${colors.grey88}`,
              background: colors.grey96,
            }}>
              <DismissBtn label="Cancel" onClick={cancelForm} />
              <PrimaryBtn label={form.mode === "add" ? "Add Contact" : "Save Changes"} onClick={saveForm} />
            </div>
          </div>
        )}

        {/* ── Contacts table ───────────────────────────────────────────────── */}
        {contacts.length === 0 && form.mode === "idle" ? (
          <div style={{
            textAlign: "center", padding: "36px 0", color: colors.grey38,
            fontSize: "12px", lineHeight: "20px",
          }}>
            <div style={{ marginBottom: "6px", opacity: 0.45 }}>
              <PersonIcon />
            </div>
            No other contacts yet.<br />
            <span style={{ color: colors.grey38 }}>Click <strong style={{ color: colors.grey11 }}>+ Add</strong> to add someone.</span>
          </div>
        ) : contacts.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "40%" }} />
              <col style={{ width: "43%" }} />
              <col style={{ width: "17%" }} />
            </colgroup>
            <thead>
              <tr style={{ background: colors.grey96 }}>
                <th style={colHeader}>Name</th>
                <th style={colHeader}>Email</th>
                <th style={{ ...colHeader, textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c, i) => (
                <tr key={c.id} style={{ background: i % 2 === 0 ? colors.white : "#FAFAFA" }}>
                  <td style={{ ...cellStyle, overflow: "hidden" }} title={c.personName}>
                    <span style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                      <InitialsAvatar name={c.personName} size={26} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{c.personName}</span>
                    </span>
                  </td>
                  <td style={{ ...cellStyle, color: c.emailAddress ? colors.grey11 : colors.grey38 }} title={c.emailAddress}>
                    {c.emailAddress || "—"}
                  </td>
                  <td style={{ ...cellStyle, textAlign: "center", padding: "6px 4px" }}>
                    {deleteConfirmId === c.id ? (
                      <span style={{ fontSize: "10.8px", color: colors.grey38, whiteSpace: "nowrap" }}>
                        Delete?&nbsp;
                        <button onClick={() => doDelete(c.id)} style={confirmYesStyle}>Yes</button>
                        <span style={{ color: colors.grey74 }}> / </span>
                        <button onClick={() => setDeleteConfirmId(null)} style={confirmNoStyle}>No</button>
                      </span>
                    ) : (
                      <span style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                        <button
                          onClick={() => openEdit(c)}
                          disabled={form.mode !== "idle"}
                          title="Edit contact"
                          style={iconBtnStyle(form.mode !== "idle")}
                        >
                          <EditPencilIcon />
                        </button>
                        <button
                          onClick={() => confirmDelete(c.id)}
                          disabled={form.mode !== "idle"}
                          title="Delete contact"
                          style={iconBtnStyle(form.mode !== "idle")}
                        >
                          <TrashIcon color={form.mode !== "idle" ? colors.grey74 : "#D13438"} />
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <FooterBar>
        <DismissBtn label="Close" onClick={closeDialog} />
      </FooterBar>

    </div>
  );
}

// ── Shared button styles ──────────────────────────────────────────────────────

const iconBtnStyle = (disabled: boolean): React.CSSProperties => ({
  width: "26px", height: "26px", border: `1px solid transparent`,
  background: "transparent", cursor: disabled ? "default" : "pointer",
  borderRadius: "4px", display: "inline-flex", alignItems: "center",
  justifyContent: "center", padding: 0, opacity: disabled ? 0.35 : 1,
  transition: "background 0.1s",
});

const confirmYesStyle: React.CSSProperties = {
  fontSize: "10.8px", fontFamily: "inherit", border: "none",
  background: "transparent", color: "#D13438", cursor: "pointer",
  padding: "0 1px", fontWeight: "700",
};

const confirmNoStyle: React.CSSProperties = {
  fontSize: "10.8px", fontFamily: "inherit", border: "none",
  background: "transparent", color: colors.grey38, cursor: "pointer", padding: "0 1px",
};
