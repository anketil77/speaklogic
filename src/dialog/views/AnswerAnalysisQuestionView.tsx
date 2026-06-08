// src/dialog/views/AnswerAnalysisQuestionView.tsx

/* global Office */

import React, { useRef, useState, useCallback } from "react";
import { FooterBar, FooterHelperText, DismissBtn, PrimaryBtn } from "@/dialog/components/FooterButtons";
import { RichTextToolbar } from "@/dialog/components/RichTextToolbar";
import { RichEditor } from "@/dialog/components/RichEditor";
import { AnswerIcon } from "@/dialog/components/Icons";
import { FormRow, CmdSep } from "@/dialog/components/FormRow";
import { inputStyle, readonlyInputStyle } from "@/dialog/styles/formStyles";
import { nowDate, nowTime, formatDisplayDate } from "@/db/db";
import type { ProjectAnswer } from "@/types/db";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  blue: "#0078D4",
  grey11: "#1B1B1B",
  grey38: "#616161",
  grey78: "#C7C7C7",
  grey88: "#E0E0E0",
  grey96: "#F5F5F5",
  iconBg: "#EBF3FC",
  white: "#FFFFFF",
} as const;

const LABEL_W = 192;

// ─── Main component ───────────────────────────────────────────────────────────

export default function AnswerAnalysisQuestionView() {
  const params = new URLSearchParams(window.location.search);
  const actualQuestion = params.get("actualQuestion") ?? "";
  const entityQuestionPointTo = params.get("entityQuestionPointTo") ?? "";

  const editorRef = useRef<HTMLDivElement>(null);
  const [toolbarCloseSignal, setToolbarCloseSignal] = useState(0);

  const [informationAnswerPointTo, setInformationAnswerPointTo] = useState("");
  const [actualAnswer, setActualAnswer] = useState("");

  const answerDate = nowDate();
  const answerTime = nowTime();

  const close = useCallback(() => {
    try {
      Office.context.ui.messageParent(JSON.stringify({ action: "CLOSE" }));
    } catch {
      window.close();
    }
  }, []);

  const submit = useCallback(
    (isDraft: boolean) => {
      const payload: Omit<ProjectAnswer, "id" | "analysisId" | "questionId"> = {
        answerNumber: 0,
        actualQuestion,
        entityQuestionPointTo,
        informationAnswerPointTo,
        actualAnswer,
        answerDate,
        answerTime,
      };
      try {
        Office.context.ui.messageParent(
          JSON.stringify({ action: isDraft ? "SAVE_ANSWER_DRAFT" : "ADD_ANSWER", payload })
        );
      } catch {
        window.close();
      }
    },
    [actualQuestion, entityQuestionPointTo, informationAnswerPointTo, actualAnswer, answerDate, answerTime]
  );

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        background: C.white,
        overflow: "hidden",
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        style={{
          height: 78,
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: 12,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            background: C.iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <AnswerIcon />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "15.4px",
              fontWeight: 700,
              color: C.grey11,
              letterSpacing: "-0.1px",
              lineHeight: "21px",
            }}
          >
            Answer Question
          </div>
          <div style={{ fontSize: "11.1px", color: C.grey38, lineHeight: "17px", marginTop: 2 }}>
            Provide an answer to the analysis question and specify the information it points to.
          </div>
        </div>
      </div>

      {/* ── Command bar ─────────────────────────────────────────────────── */}
      <div
        style={{
          height: 44,
          background: C.grey96,
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          flexShrink: 0,
        }}
      >
        <button
          className="sl-icon-btn"
          onClick={() => submit(false)}
          style={{
            height: 28,
            padding: "0 14px",
            background: C.blue,
            border: "none",
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
            flexShrink: 0,
            fontFamily: "inherit",
          }}
        >
          <AnswerIcon color="#FFFFFF" />
          <span
            style={{
              fontSize: "11.4px",
              fontWeight: 700,
              color: C.white,
              lineHeight: "14px",
              whiteSpace: "nowrap",
            }}
          >
            Submit Answer
          </span>
        </button>

        <CmdSep />

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
          <RichTextToolbar
            editorRef={editorRef}
            closeSignal={toolbarCloseSignal}
            onOpen={() => setToolbarCloseSignal((s) => s + 1)}
          />
        </div>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <div
        style={{
          height: 36,
          background: C.white,
          display: "flex",
          alignItems: "flex-end",
          padding: "0 20px",
          borderBottom: `1px solid ${C.grey88}`,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "relative",
            height: 36,
            display: "flex",
            alignItems: "center",
            fontSize: "12.6px",
            fontWeight: 700,
            color: C.grey11,
            lineHeight: "15px",
          }}
        >
          About Answer
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 2,
              background: C.blue,
              borderRadius: "1px 1px 0 0",
            }}
          />
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: C.grey38,
            letterSpacing: "0.6px",
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          Question Details
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <FormRow label="Actual Question" labelWidth={LABEL_W}>
            <input
              style={readonlyInputStyle}
              value={actualQuestion}
              readOnly
              title={actualQuestion}
            />
          </FormRow>

          <FormRow label="Entity Question Points To" labelWidth={LABEL_W}>
            <input
              style={readonlyInputStyle}
              value={entityQuestionPointTo}
              readOnly
              title={entityQuestionPointTo}
            />
          </FormRow>

          <FormRow label="Information Answer Points To" labelWidth={LABEL_W}>
            <input
              style={inputStyle}
              placeholder="Enter the information this answer points to"
              value={informationAnswerPointTo}
              onChange={(e) => setInformationAnswerPointTo(e.target.value)}
            />
          </FormRow>
        </div>

        <div style={{ height: 1, background: C.grey88, margin: "16px 0" }} />

        {/* Date + Time row */}
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          <div
            style={{
              width: LABEL_W,
              minWidth: LABEL_W,
              fontSize: "11.6px",
              fontWeight: 700,
              color: C.grey11,
              flexShrink: 0,
            }}
          >
            Answer Date
          </div>
          <input style={{ ...readonlyInputStyle, flex: 1 }} value={formatDisplayDate(answerDate)} readOnly />
          <div
            style={{
              width: 100,
              minWidth: 100,
              fontSize: "11.6px",
              fontWeight: 700,
              color: C.grey11,
              textAlign: "right",
              paddingRight: 12,
              flexShrink: 0,
            }}
          >
            Time
          </div>
          <input
            style={{ ...readonlyInputStyle, width: 120, flex: "0 0 120px" }}
            value={answerTime}
            readOnly
          />
        </div>

        <div style={{ height: 1, background: C.grey88, margin: "16px 0" }} />

        <FormRow label="Actual Answer" alignTop labelWidth={LABEL_W}>
          <RichEditor
            ref={editorRef}
            value={actualAnswer}
            onChange={setActualAnswer}
            placeholder="Enter the actual answer..."
            style={{ minHeight: 140 }}
          />
        </FormRow>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <FooterBar>
        <FooterHelperText>Provide a complete answer to the question and the information it points to.</FooterHelperText>
        <DismissBtn label="Cancel" onClick={close} />
        <button
          className="sl-fr-btn"
          onClick={() => submit(true)}
          style={{
            height: 32,
            padding: "0 16px",
            background: C.white,
            border: `1px solid ${C.blue}`,
            borderRadius: 4,
            fontSize: "12.3px",
            fontFamily: "inherit",
            color: C.blue,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          Save Draft
        </button>
        <PrimaryBtn label="Submit Answer" onClick={() => submit(false)} />
      </FooterBar>
    </div>
  );
}
