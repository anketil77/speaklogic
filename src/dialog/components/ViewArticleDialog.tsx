// src/dialog/components/ViewArticleDialog.tsx
// Medium/blog-style article viewer with command bar, resizable dialog, and metadata-first layout.

import React, { useCallback, useState } from "react";
import { formatDisplayDate } from "@/db/db";
import { FooterBar, DismissBtn } from "@/dialog/components/FooterButtons";
import { createPortal } from "react-dom";
import { useDraggable } from "@/dialog/hooks/useDraggable";
import { ResizeHandles } from "@/dialog/components/ResizeHandles";
import { ArticleHeaderIcon, ArticleCloseIcon } from "@/dialog/components/Icons";
import { HtmlContent } from "@/dialog/components/HtmlContent";
import { CategoryIcon } from "@/dialog/views/createarticle/CategoryPickerPanel";
import type { Article } from "@/types/db";

interface Props {
  article: Article;
  onClose: () => void;
  onFlagForAnalysis?: () => void;
  onAnalyzeArticle?: () => void;
  onRequestFeedback?: () => void;
}

// Each category has its own gradient — gives every article a unique visual identity.
const CATEGORY_GRADIENTS: Record<string, [string, string]> = {
  Art:            ["#7C3AED", "#4C1D95"],
  Business:       ["#0078D4", "#003F73"],
  Technology:     ["#2563EB", "#1E3A8A"],
  Health:         ["#059669", "#064E3B"],
  Education:      ["#D97706", "#78350F"],
  Finance:        ["#0E7490", "#0C4A6E"],
  Entertainment:  ["#DB2777", "#831843"],
  Travel:         ["#0891B2", "#164E63"],
  Food:           ["#EA580C", "#7C2D12"],
  Fashion:        ["#BE185D", "#500724"],
  Sports:         ["#16A34A", "#14532D"],
  Science:        ["#7C3AED", "#3B0764"],
  Environment:    ["#15803D", "#052E16"],
  Politics:       ["#DC2626", "#450A0A"],
};

function getBannerGradient(category?: string | null): string {
  const pair = category ? CATEGORY_GRADIENTS[category] : null;
  const [from, to] = pair ?? ["#0078D4", "#003F73"];
  return `linear-gradient(135deg, ${from} 0%, ${to} 100%)`;
}

// ─── Banner action button ─────────────────────────────────────────────────────

function BannerBtn({ label, onClick }: { label: string; onClick?: () => void }) {
  const [hover, setHover] = useState(false);
  if (!onClick) return null;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        height: 26,
        paddingLeft: 12,
        paddingRight: 12,
        background: "#fff",
        color: hover ? "#003F73" : "#1a1a1a",
        border: "none",
        borderRadius: 20,
        cursor: "pointer",
        fontSize: 11.4,
        fontWeight: 600,
        fontFamily: "Inter, Segoe UI, sans-serif",
        whiteSpace: "nowrap",
        flexShrink: 0,
        boxShadow: hover
          ? "0 3px 10px rgba(0,0,0,0.22)"
          : "0 1px 4px rgba(0,0,0,0.15)",
        transform: hover ? "translateY(-1px)" : "translateY(0)",
        transition: "box-shadow 0.15s, transform 0.15s, color 0.1s",
      }}
    >
      {label}
    </button>
  );
}

// ─── WizardContent ────────────────────────────────────────────────────────────

function WizardSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{
        fontSize: 10.5, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const,
        letterSpacing: "0.9px", marginBottom: 10,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function WizardField({ label, value, html }: { label: string; value?: string | null; html?: boolean }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", gap: 16, padding: "8px 0", borderBottom: "1px solid #F3F4F6" }}>
      <div style={{ width: 200, minWidth: 200, fontSize: 12.5, color: "#9CA3AF", flexShrink: 0 }}>{label}</div>
      {html ? (
        <div
          className="sl-article-content"
          style={{ flex: 1, fontSize: 14 }}
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: value }}
        />
      ) : (
        <div style={{ flex: 1, fontSize: 12.5, fontWeight: 500, color: "#374151", wordBreak: "break-word" }}>{value}</div>
      )}
    </div>
  );
}

function WizardContent({ article }: { article: Article }) {
  const isProduct = (article.wizardCategory ?? "").toLowerCase().includes("product");

  const hasEvent    = article.eventName || article.eventLocation || article.eventDate;
  const hasGivenSet = article.peopleLocation || article.consideration || article.articleBasisReference;
  const hasContent  = article.motherNatureConsiderations || article.negativeFunction ||
                      article.problemDetails || article.funcExecuteFromEvent || article.relationshipDetails;
  const hasObs      = article.preEventObservation || article.postEventObservation;
  const hasProvider = article.providerName || article.reviewerName;
  const hasProduct  = article.productName || article.modelNumber || article.productType || article.productFunction;
  const hasReview   = article.functionExecutedDuringReview;
  const hasAdditional = article.additionalInformation || article.productURL;

  return (
    <div style={{ marginTop: 4 }}>
      {/* Template label */}
      <div style={{ marginBottom: 18, display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{
          background: "#EBF3FC", color: "#0057A0", borderRadius: 4,
          padding: "3px 10px", fontSize: 11.5, fontWeight: 500,
        }}>
          {article.templateName}
        </span>
      </div>

      {/* Provider (non-product) */}
      {!isProduct && hasProvider && (
        <WizardSection title="Provider Information">
          <WizardField label="Provider Name"  value={article.providerName} />
          <WizardField label="Reviewer Name"  value={article.reviewerName} />
          <WizardField label="Uses Given Set" value={article.isGivenSet === 1 ? "Yes" : article.isGivenSet === 0 ? "No" : null} />
        </WizardSection>
      )}

      {/* Given Set */}
      {!isProduct && hasGivenSet && (
        <WizardSection title="Given Set">
          <WizardField label="Basis Reference"  value={article.articleBasisReference} />
          <WizardField label="People Location"  value={article.peopleLocation} />
          <WizardField label="Consideration"    value={article.consideration} />
        </WizardSection>
      )}

      {/* Event */}
      {!isProduct && hasEvent && (
        <WizardSection title="Event">
          <WizardField label="Event Name"     value={article.eventName} />
          <WizardField label="Event Location" value={article.eventLocation} />
          <WizardField label="Event Date"     value={[formatDisplayDate(article.eventDate), article.eventTime].filter(Boolean).join("  ·  ")} />
        </WizardSection>
      )}

      {/* Pre/Post observations (Sport Template 1) */}
      {hasObs && (
        <WizardSection title="Observations">
          <WizardField label="Pre-event Observation"  value={article.preEventObservation}  html />
          <WizardField label="Post-event Observation" value={article.postEventObservation} html />
        </WizardSection>
      )}

      {/* Info before event */}
      {article.infoBeforeEvent && (
        <WizardSection title="Information Before Event">
          <div
            className="sl-article-content"
            style={{ fontSize: 14, paddingBottom: 4 }}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: article.infoBeforeEvent }}
          />
        </WizardSection>
      )}

      {/* Content sections — all authored via RichEditor so render as HTML */}
      {hasContent && (
        <WizardSection title="Content">
          <WizardField label="Mother Nature Considerations" value={article.motherNatureConsiderations} html />
          <WizardField label="Negative Function Executed"   value={article.negativeFunction}           html />
          <WizardField label="Problem Developed"            value={article.problemDetails}             html />
          <WizardField label="Function Executed from Event" value={article.funcExecuteFromEvent}       html />
          <WizardField label="Relationship"                 value={article.relationshipDetails}        html />
        </WizardSection>
      )}

      {/* Product Review fields */}
      {isProduct && (hasProvider || article.isProviderUseGivenSetOfInfo1 !== undefined) && (
        <WizardSection title="Provider Information">
          <WizardField label="Provider Name"     value={article.providerName} />
          <WizardField label="Reviewer Name"     value={article.reviewerName} />
          <WizardField label="Uses Given Set"    value={article.isProviderUseGivenSetOfInfo1 === 1 ? "Yes" : "No"} />
        </WizardSection>
      )}

      {isProduct && hasProduct && (
        <WizardSection title="Product Details">
          <WizardField label="Product Name"     value={article.productName} />
          <WizardField label="Model Number"     value={article.modelNumber} />
          <WizardField label="Product Type"     value={article.productType} />
          <WizardField label="Product Function" value={article.productFunction} />
          <WizardField label="Problem Solved"   value={article.problemSolved} />
        </WizardSection>
      )}

      {isProduct && hasReview && (
        <WizardSection title="Review">
          <WizardField label="Function During Review" value={article.functionExecutedDuringReview} html />
          <WizardField label="Problem Solved by Product" value={article.isSolvedProblem === 1 ? "Yes" : article.isSolvedProblem === 0 ? "No" : null} />
        </WizardSection>
      )}

      {isProduct && hasAdditional && (
        <WizardSection title="Additional Information">
          <WizardField label="Additional Information" value={article.additionalInformation} html />
          <WizardField label="Product URL"            value={article.productURL} />
        </WizardSection>
      )}
    </div>
  );
}

// ─── MetaRow ──────────────────────────────────────────────────────────────────

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        padding: "9px 0",
        borderBottom: "1px solid #F3F4F6",
      }}
    >
      <div
        style={{
          width: 200,
          minWidth: 200,
          fontSize: 12.5,
          color: "#9CA3AF",
          fontFamily: "Inter, Segoe UI, sans-serif",
        }}
      >
        {label}
      </div>
      <div
        style={{
          flex: 1,
          fontSize: 12.5,
          fontWeight: 500,
          color: "#374151",
          fontFamily: "Inter, Segoe UI, sans-serif",
          wordBreak: "break-word",
        }}
      >
        {value || <span style={{ color: "#D1D5DB", fontStyle: "italic" }}>—</span>}
      </div>
    </div>
  );
}

export function ViewArticleDialog({ article, onClose, onFlagForAnalysis, onAnalyzeArticle, onRequestFeedback }: Props) {
  // Clamp the initial size to the real viewport — the host dialog window is only
  // ~43% of the screen wide, so a fixed 760px would overflow and push the resize
  // grip off-screen on narrower windows. Never exceed the viewport.
  const initW = Math.min(760, Math.round(window.innerWidth  * 0.96));
  const initH = Math.min(600, Math.round(window.innerHeight * 0.92));
  const { pos, setPos, onHeaderMouseDown } = useDraggable({
    initialX: Math.max(0, Math.round((window.innerWidth  - initW) / 2)),
    initialY: Math.max(0, Math.round((window.innerHeight - initH) / 2)),
  });

  // ── Resize state (8-way handles own all the drag logic) ───────────────────
  const [size, setSize] = useState({ width: initW, height: initH });

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  const givenSet = article.isProviderUseGivenSetOfInfo === 1 ? "Yes" : "No";
  const isDraft = article.isDraft === 1;
  const authorInitial = (article.personName || "?")[0].toUpperCase();
  const bannerGradient = getBannerGradient(article.category);

  const hasActions = onFlagForAnalysis || onAnalyzeArticle || onRequestFeedback;

  return createPortal(
    <>
      {/* Scrim */}
      <div
        style={{ position: "fixed", inset: 0, zIndex: 199, background: "rgba(0,0,0,0.28)" }}
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="View Article"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
        style={{
          position: "fixed",
          left: pos.x,
          top: pos.y,
          width: size.width,
          height: size.height,
          zIndex: 200,
          background: "#fff",
          border: "1px solid #E5E7EB",
          borderRadius: 10,
          boxShadow: "0 20px 60px rgba(0,0,0,0.22)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily: "Inter, Segoe UI, sans-serif",
        }}
      >
        {/* ── Drag header ── */}
        <div
          onMouseDown={onHeaderMouseDown}
          style={{
            height: 56,
            minHeight: 56,
            display: "flex",
            alignItems: "center",
            padding: "0 14px",
            background: "#fff",
            borderBottom: "1px solid #F3F4F6",
            cursor: "move",
            userSelect: "none",
            gap: 10,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: "#EBF3FC",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ArticleHeaderIcon />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 700,
                color: "#111827",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              View Article
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#9CA3AF",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                marginTop: 1,
              }}
            >
              {article.articleTitle || "Untitled Article"}
            </div>
          </div>
          <button
            onClick={onClose}
            title="Close"
            style={{
              width: 24,
              height: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              flexShrink: 0,
              padding: 0,
            }}
          >
            <ArticleCloseIcon />
          </button>
        </div>

        {/* ── Tab bar ── */}
        <div
          style={{
            height: 34,
            minHeight: 34,
            display: "flex",
            alignItems: "flex-end",
            padding: "0 16px",
            borderBottom: "1px solid #F3F4F6",
            background: "#fff",
          }}
        >
          <div
            style={{
              height: 32,
              display: "flex",
              alignItems: "center",
              borderBottom: "2px solid #0078D4",
              fontSize: 12.4,
              fontWeight: 600,
              color: "#0078D4",
              paddingLeft: 2,
              paddingRight: 2,
            }}
          >
            About Article
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ flex: 1, overflow: "auto", background: "#fff" }}>

          {/* ── Cover banner with action buttons ── */}
          <div
            style={{
              position: "relative",
              height: hasActions ? 104 : 82,
              background: bannerGradient,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: hasActions ? "12px 20px 14px" : "0 28px 14px",
              overflow: "hidden",
            }}
          >
            {/* Decorative circles */}
            <div
              style={{
                position: "absolute",
                top: -24,
                right: -24,
                width: 110,
                height: 110,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.08)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 12,
                right: 72,
                width: 50,
                height: 50,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.05)",
                pointerEvents: "none",
              }}
            />

            {/* Action buttons row */}
            {hasActions && (
              <div style={{ display: "flex", gap: 7, position: "relative", zIndex: 1, flexWrap: "wrap", alignItems: "center" }}>
                <BannerBtn label="Flag for Analysis" onClick={onFlagForAnalysis} />
                <BannerBtn label="Analyze Article"   onClick={onAnalyzeArticle} />
                <BannerBtn label="Request Feedback"  onClick={onRequestFeedback} />
              </div>
            )}

            {/* Category + Draft tags (bottom of banner) */}
            <div style={{ display: "flex", gap: 6, position: "relative" }}>
              {article.category ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    background: "rgba(255,255,255,0.2)",
                    color: "#fff",
                    borderRadius: 20,
                    padding: "3px 11px",
                    fontSize: 11.5,
                    fontWeight: 600,
                    border: "1px solid rgba(255,255,255,0.3)",
                    letterSpacing: 0.2,
                  }}
                >
                  <CategoryIcon
                    category={article.category}
                    size={13}
                    color="#fff"
                  />
                  {article.category}
                </span>
              ) : null}
              {isDraft ? (
                <span
                  style={{
                    background: "rgba(254,240,138,0.2)",
                    color: "#FEF08A",
                    borderRadius: 20,
                    padding: "3px 11px",
                    fontSize: 11.5,
                    fontWeight: 600,
                    border: "1px solid rgba(254,240,138,0.35)",
                    letterSpacing: 0.2,
                  }}
                >
                  DRAFT
                </span>
              ) : null}
            </div>
          </div>

          {/* ── Article layout ── */}
          <div style={{ padding: "22px 28px 32px" }}>

            {/* Source chip */}
            {article.source ? (
              <div style={{ marginBottom: 14 }}>
                <span
                  style={{
                    background: "#EBF3FC",
                    color: "#0057A0",
                    borderRadius: 4,
                    padding: "3px 10px",
                    fontSize: 11.5,
                    fontWeight: 500,
                  }}
                >
                  {article.source}
                </span>
              </div>
            ) : null}

            {/* Title */}
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: "#0F1419",
                lineHeight: "1.22",
                letterSpacing: "-0.5px",
                marginBottom: 16,
                wordBreak: "break-word",
              }}
            >
              {article.articleTitle || (
                <span style={{ color: "#D1D5DB", fontStyle: "italic", fontWeight: 400 }}>
                  Untitled Article
                </span>
              )}
            </div>

            {/* Author + date */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 20,
                paddingBottom: 20,
                borderBottom: "1px solid #F3F4F6",
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: bannerGradient,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 700,
                  flexShrink: 0,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
                }}
              >
                {authorInitial}
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "#111827", lineHeight: "18px" }}>
                  {article.personName || "—"}
                </div>
                {(article.articleDate || article.articleTime) ? (
                  <div style={{ fontSize: 12, color: "#9CA3AF", lineHeight: "16px", marginTop: 2 }}>
                    {[formatDisplayDate(article.articleDate), article.articleTime].filter(Boolean).join("  ·  ")}
                  </div>
                ) : null}
              </div>
            </div>

            {/* ── Article Details (metadata before content) ── */}
            <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid #F3F4F6" }}>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: "#C4CAC7",
                  textTransform: "uppercase",
                  letterSpacing: "0.9px",
                  marginBottom: 4,
                }}
              >
                Article Details
              </div>
              <MetaRow
                label="Article Number"
                value={article.articleNumber ? String(article.articleNumber) : ""}
              />
              <MetaRow label="Provider Uses Given Set?" value={givenSet} />
              {article.articleBasisReference ? (
                <MetaRow label="Article Basis Reference" value={article.articleBasisReference} />
              ) : null}
            </div>

            {article.articleContent ? (
              <HtmlContent
                html={article.articleContent}
                style={{ fontSize: 15, lineHeight: 1.7, color: "#374151", wordBreak: "break-word" }}
              />
            ) : !article.templateName ? (
              <div style={{ textAlign: "center", padding: "36px 0", color: "#D1D5DB" }}>
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ display: "block", margin: "0 auto 10px" }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <div style={{ fontSize: 13, fontStyle: "italic" }}>No content written for this article.</div>
              </div>
            ) : null}

            {/* Wizard content sections — shown for template-based articles */}
            {article.templateName && <WizardContent article={article} />}
          </div>
        </div>

        {/* ── Footer ── */}
        <FooterBar><DismissBtn label="Close" onClick={onClose} /></FooterBar>

        {/* ── 8-way resize handles (4 edges + 4 corners), reusable component ── */}
        <ResizeHandles
          pos={pos}
          setPos={setPos}
          size={size}
          setSize={setSize}
          minWidth={500}
          minHeight={360}
          maxWidth={Math.round(window.innerWidth * 0.99)}
          maxHeight={Math.round(window.innerHeight * 0.98)}
        />
      </div>
    </>,
    document.body
  );
}
