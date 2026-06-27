// src/dialog/views/PointToEntityView.tsx
//
// Point Selection to Entity (More Selections menu). A selected Word / Sentence /
// Paragraph "points to" one or more entities. Two tabs:
//   - Details: read-only document location + selection, then the entity editor(s)
//     (name + image source: From Computer / Image URL / YouTube, OR — when
//     "Entity as Explanation" is checked — a rich-text explanation box).
//   - Model: a box → "points to" → box diagram (selection → entity). For
//     Sentence/Paragraph the right box cycles through the multiple entities.
//
// Word mode = a single entity. Sentence / Paragraph mode = multiple entities
// via "Add Entity" / "Add More Entity".

import React, { useState, useMemo, useRef, useCallback } from "react";
import { useDialogComm } from "@/dialog/hooks/useDialogComm";
import { RichTextToolbar } from "@/dialog/components/RichTextToolbar";
import { RichEditor } from "@/dialog/components/RichEditor";
import { HtmlContent } from "@/dialog/components/HtmlContent";
import { FooterBar, DismissBtn, PrimaryBtn } from "@/dialog/components/FooterButtons";
import { colors } from "@/styles/tokens";
import type {
  EntitySelectionType,
  EntityImageSource,
  PointToEntityItem,
  SavePointToEntityPayload,
} from "@/types/db";

const SELECTION_TYPES: EntitySelectionType[] = ["Word", "Sentence", "Paragraph"];

function emptyEntity(): PointToEntityItem {
  return { name: "", isExplanation: false, explanation: "", imageSource: "computer", imageValue: "" };
}

const fieldLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: colors.grey38,
  textTransform: "uppercase",
  letterSpacing: 0.3,
  marginBottom: 4,
  display: "block",
};

const readonlyBox: React.CSSProperties = {
  background: colors.grey96,
  border: `1px solid ${colors.grey88}`,
  borderRadius: 4,
  padding: "8px 10px",
  fontSize: 12.4,
  color: colors.grey11,
  minHeight: 18,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

const textInput: React.CSSProperties = {
  width: "100%",
  height: 30,
  border: `1px solid ${colors.grey78}`,
  borderRadius: 4,
  padding: "0 8px",
  fontSize: 12.4,
  fontFamily: "inherit",
  boxSizing: "border-box",
  color: colors.grey11,
};

// ─── One entity item editor (own RichEditor ref, per the rich-text convention) ──
function EntityItemEditor({
  index,
  total,
  entity,
  onChange,
  onRemove,
}: {
  index: number;
  total: number;
  entity: PointToEntityItem;
  onChange: (next: PointToEntityItem) => void;
  onRemove?: () => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);

  const onFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => onChange({ ...entity, imageValue: String(reader.result ?? "") });
      reader.readAsDataURL(file);
    },
    [entity, onChange]
  );

  return (
    <div
      style={{
        border: `1px solid ${colors.grey88}`,
        borderRadius: 6,
        padding: 12,
        marginBottom: 10,
        background: colors.white,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 12.4, fontWeight: 700, color: colors.grey11 }}>
          Entity {total > 1 ? index + 1 : ""}
        </span>
        {onRemove && total > 1 && (
          <button
            onClick={onRemove}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: colors.redDestructive,
              fontSize: 12,
              fontFamily: "inherit",
            }}
          >
            Remove
          </button>
        )}
      </div>

      <label style={fieldLabel}>Entity Name (optional)</label>
      <input
        style={{ ...textInput, marginBottom: 10 }}
        value={entity.name}
        placeholder="Name this entity…"
        onChange={(e) => onChange({ ...entity, name: e.target.value })}
      />

      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.4, color: colors.grey11, marginBottom: 10, cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={entity.isExplanation}
          onChange={(e) => onChange({ ...entity, isExplanation: e.target.checked })}
        />
        Entity as Explanation
      </label>

      {entity.isExplanation ? (
        <div>
          <label style={fieldLabel}>Entity Explanation</label>
          <RichTextToolbar editorRef={editorRef} />
          <RichEditor
            ref={editorRef}
            value={entity.explanation}
            onChange={(next) => onChange({ ...entity, explanation: next })}
            placeholder="Explain the entity…"
            htmlContentStyling
            sanitizeOnPaste
            style={{
              border: `1px solid ${colors.grey78}`,
              borderRadius: 4,
              minHeight: 90,
              padding: 8,
              fontSize: 12.4,
              overflow: "auto",
            }}
          />
        </div>
      ) : (
        <div>
          <label style={fieldLabel}>Entity Image</label>
          <div style={{ display: "flex", gap: 14, marginBottom: 8, flexWrap: "wrap" }}>
            {(["computer", "url", "youtube"] as EntityImageSource[]).map((src) => (
              <label key={src} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.4, color: colors.grey11, cursor: "pointer" }}>
                <input
                  type="radio"
                  name={`imgsrc-${index}`}
                  checked={entity.imageSource === src}
                  onChange={() => onChange({ ...entity, imageSource: src, imageValue: "" })}
                />
                {src === "computer" ? "From Computer" : src === "url" ? "Image URL" : "YouTube"}
              </label>
            ))}
          </div>

          {entity.imageSource === "computer" && (
            <div>
              <input type="file" accept="image/*" onChange={onFile} style={{ fontSize: 12 }} />
              {entity.imageValue && (
                <img
                  src={entity.imageValue}
                  alt={entity.name || "entity"}
                  style={{ display: "block", maxWidth: "100%", maxHeight: 140, marginTop: 8, borderRadius: 4, border: `1px solid ${colors.grey88}` }}
                />
              )}
            </div>
          )}

          {entity.imageSource === "url" && (
            <div>
              <input
                style={textInput}
                value={entity.imageValue}
                placeholder="https://example.com/image.png"
                onChange={(e) => onChange({ ...entity, imageValue: e.target.value })}
              />
              {entity.imageValue && (
                <img
                  src={entity.imageValue}
                  alt={entity.name || "entity"}
                  style={{ display: "block", maxWidth: "100%", maxHeight: 140, marginTop: 8, borderRadius: 4, border: `1px solid ${colors.grey88}` }}
                />
              )}
            </div>
          )}

          {entity.imageSource === "youtube" && (
            <input
              style={textInput}
              value={entity.imageValue}
              placeholder="https://www.youtube.com/watch?v=…"
              onChange={(e) => onChange({ ...entity, imageValue: e.target.value })}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Inline model diagram (selection → points to → entity) ──────────────────────
function EntityPreview({ entity }: { entity: PointToEntityItem | undefined }) {
  if (!entity) return <span style={{ color: colors.grey74 }}>No entity</span>;
  if (entity.isExplanation) {
    return entity.explanation
      ? <HtmlContent html={entity.explanation} />
      : <span style={{ color: colors.grey74 }}>No explanation</span>;
  }
  if (!entity.imageValue) return <span style={{ color: colors.grey74 }}>No image</span>;
  if (entity.imageSource === "youtube") {
    return <a href={entity.imageValue} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: colors.azure42, wordBreak: "break-all" }}>{entity.imageValue}</a>;
  }
  return (
    <img
      src={entity.imageValue}
      alt={entity.name || "entity"}
      style={{ maxWidth: "100%", maxHeight: 120, borderRadius: 4 }}
    />
  );
}

function ModelTab({
  selectionType,
  selection,
  entities,
}: {
  selectionType: EntitySelectionType;
  selection: string;
  entities: PointToEntityItem[];
}) {
  const [idx, setIdx] = useState(0);
  const multiple = entities.length > 1;
  const safeIdx = Math.min(idx, entities.length - 1);
  const rightLabel = multiple ? "Entities" : "Entity";

  const boxStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    border: `2px solid ${colors.azure42}`,
    borderRadius: 12,
    background: colors.white,
    padding: 12,
    minHeight: 140,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  };

  return (
    <div style={{ padding: "8px 4px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={boxStyle}>
          <div style={{ fontSize: 11, fontWeight: 700, color: colors.grey38, textTransform: "uppercase" }}>{selectionType}</div>
          <div style={{ fontSize: 12.4, color: colors.grey11, overflow: "auto", maxHeight: 110, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {selection || "—"}
          </div>
        </div>

        <div style={{ flexShrink: 0, textAlign: "center", color: colors.grey38, fontSize: 11.5, fontWeight: 600 }}>
          points to
          <div style={{ fontSize: 20, lineHeight: "16px" }}>→</div>
        </div>

        <div style={boxStyle}>
          <div style={{ fontSize: 11, fontWeight: 700, color: colors.grey38, textTransform: "uppercase", display: "flex", justifyContent: "space-between" }}>
            <span>{entities[safeIdx]?.name || rightLabel}</span>
            {multiple && <span>{safeIdx + 1}/{entities.length}</span>}
          </div>
          <div style={{ fontSize: 12.4, color: colors.grey11, overflow: "auto", maxHeight: 110 }}>
            <EntityPreview entity={entities[safeIdx]} />
          </div>
        </div>
      </div>

      {multiple && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12 }}>
          <button
            onClick={() => setIdx((p) => (p - 1 + entities.length) % entities.length)}
            style={{ height: 28, padding: "0 14px", border: `1px solid ${colors.grey78}`, borderRadius: 4, background: colors.white, cursor: "pointer", fontFamily: "inherit", fontSize: 12 }}
          >
            Previous
          </button>
          <button
            onClick={() => setIdx((p) => (p + 1) % entities.length)}
            style={{ height: 28, padding: "0 14px", border: `1px solid ${colors.grey78}`, borderRadius: 4, background: colors.white, cursor: "pointer", fontFamily: "inherit", fontSize: 12 }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default function PointToEntityView() {
  const { initData, submitSave, saving, closeDialog, mailtoUrl } = useDialogComm();

  const selection = initData?.selection ?? "";
  const documentLocation = initData?.documentLocation ?? initData?.entityName ?? "";
  const entityName = initData?.entityName ?? initData?.applicationName ?? "";

  const [selectionType, setSelectionType] = useState<EntitySelectionType | null>(
    initData?.entitySelectionType ?? null
  );
  const [tab, setTab] = useState<"details" | "model">("details");
  const [entities, setEntities] = useState<PointToEntityItem[]>([emptyEntity()]);

  const isWord = selectionType === "Word";
  const saved = mailtoUrl !== null;

  const updateEntity = useCallback((i: number, next: PointToEntityItem) => {
    setEntities((prev) => prev.map((e, j) => (j === i ? next : e)));
  }, []);

  const addEntity = useCallback(() => {
    setEntities((prev) => [...prev, emptyEntity()]);
  }, []);

  const removeEntity = useCallback((i: number) => {
    setEntities((prev) => (prev.length > 1 ? prev.filter((_, j) => j !== i) : prev));
  }, []);

  // Word mode: collapse to a single entity if the user switched from a multi mode.
  const chooseType = useCallback((t: EntitySelectionType) => {
    setSelectionType(t);
    if (t === "Word") setEntities((prev) => (prev.length ? [prev[0]] : [emptyEntity()]));
  }, []);

  const canSave = useMemo(
    () =>
      selectionType !== null &&
      entities.some((e) => (e.isExplanation ? e.explanation.trim() : e.imageValue.trim()) || e.name.trim()),
    [selectionType, entities]
  );

  const handleSave = useCallback(() => {
    if (!selectionType) return;
    const payload: SavePointToEntityPayload = {
      selectionType,
      actualSelection: selection,
      documentLocation,
      entityName,
      entities: isWord ? entities.slice(0, 1) : entities,
      source: initData?.source ?? "Word Document",
      personName: initData?.personName ?? "",
      personEmail: initData?.personEmail ?? "",
    };
    submitSave({ action: "SAVE_POINT_TO_ENTITY", payload });
  }, [selectionType, selection, documentLocation, entityName, isWord, entities, initData, submitSave]);

  const containerStyle: React.CSSProperties = {
    width: "100vw",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    fontFamily: "Inter, Segoe UI, sans-serif",
    background: colors.white,
    overflow: "hidden",
    boxSizing: "border-box",
  };

  // ── Saved success state ──
  if (saved) {
    return (
      <div style={containerStyle}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: colors.grey11 }}>Entity saved</div>
          <div style={{ fontSize: 12.4, color: colors.grey38, maxWidth: 360 }}>
            The selection has been pointed to the entity and saved. You can view it under "List of Entities".
          </div>
        </div>
        <FooterBar>
          <span style={{ flex: 1 }} />
          <DismissBtn label="Close" onClick={closeDialog} />
        </FooterBar>
      </div>
    );
  }

  // ── Mode chooser (when selection type was not pre-supplied) ──
  if (!selectionType) {
    return (
      <div style={containerStyle}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${colors.grey88}` }}>
          <div style={{ fontWeight: 700, fontSize: 15.6, color: colors.grey11 }}>Point Selection to Entity</div>
          <div style={{ fontSize: 11.1, color: colors.grey38, marginTop: 3 }}>
            Choose what kind of selection points to the entity.
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
          {SELECTION_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => chooseType(t)}
              style={{
                width: 220, height: 40, borderRadius: 6,
                border: `1px solid ${colors.azure42}`, background: colors.white,
                color: colors.azure42, fontSize: 13, fontWeight: 600, cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <FooterBar>
          <span style={{ flex: 1 }} />
          <DismissBtn label="Cancel" onClick={closeDialog} />
        </FooterBar>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ padding: "16px 24px 0" }}>
        <div style={{ fontWeight: 700, fontSize: 15.6, color: colors.grey11 }}>Point {selectionType} to Entity</div>
        <div style={{ fontSize: 11.1, color: colors.grey38, marginTop: 3 }}>
          Point the selected {selectionType.toLowerCase()} to one or more entities.
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 18, padding: "10px 24px 0", borderBottom: `1px solid ${colors.grey88}` }}>
        {(["details", "model"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              height: 34, border: "none", background: "none", cursor: "pointer",
              borderBottom: tab === t ? `2px solid ${colors.azure42}` : "2px solid transparent",
              fontSize: 12.6, fontWeight: 600, padding: "0 2px",
              color: tab === t ? colors.azure42 : colors.grey38, fontFamily: "inherit",
            }}
          >
            {t === "details" ? "Details" : "Model"}
          </button>
        ))}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: "auto", padding: "16px 24px" }}>
        {tab === "details" ? (
          <>
            <div style={{ marginBottom: 12 }}>
              <label style={fieldLabel}>Document Location</label>
              <div style={readonlyBox}>{documentLocation || "—"}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={fieldLabel}>Actual {selectionType}</label>
              <div style={readonlyBox}>{selection || "—"}</div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 12.6, fontWeight: 700, color: colors.grey11 }}>Actual Entity</span>
              <span style={{ fontSize: 11, color: colors.grey38 }}>
                {isWord ? "Word mode points to a single entity." : `${entities.length} entit${entities.length === 1 ? "y" : "ies"}`}
              </span>
            </div>

            {entities.map((e, i) => (
              <EntityItemEditor
                key={i}
                index={i}
                total={entities.length}
                entity={e}
                onChange={(next) => updateEntity(i, next)}
                onRemove={isWord ? undefined : () => removeEntity(i)}
              />
            ))}

            {!isWord && (
              <button
                onClick={addEntity}
                style={{
                  height: 30, padding: "0 14px", borderRadius: 4,
                  border: `1px dashed ${colors.azure42}`, background: colors.white,
                  color: colors.azure42, fontSize: 12.4, fontWeight: 600, cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {entities.length === 0 ? "Add Entity" : "Add More Entity"}
              </button>
            )}
          </>
        ) : (
          <ModelTab selectionType={selectionType} selection={selection} entities={entities} />
        )}
      </div>

      {/* Footer */}
      <FooterBar>
        <span style={{ flex: 1 }} />
        <DismissBtn label="Cancel" onClick={closeDialog} />
        <PrimaryBtn label={saving ? "Saving…" : "Save"} onClick={handleSave} disabled={saving || !canSave} />
      </FooterBar>
    </div>
  );
}
