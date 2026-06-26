// src/dialog/components/ViewArticleDialog.tsx
// Medium/blog-style article viewer with command bar, resizable dialog, and metadata-first layout.

import React, { useCallback, useState } from "react";
import { formatDisplayDate } from "@/db/db";
import { FooterBar, DismissBtn } from "@/dialog/components/FooterButtons";
import { createPortal } from "react-dom";
import { useDraggable } from "@/dialog/hooks/useDraggable";
import { ResizeHandles } from "@/dialog/components/ResizeHandles";
import { ArticleHeaderIcon, CloseIcon } from "@/dialog/components/Icons";
import { HtmlContent } from "@/dialog/components/HtmlContent";
import { VTABLE_MARKER } from "@/dialog/utils/buildVerificationTable";
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
        <HtmlContent
          className="sl-article-content"
          style={{ flex: 1, fontSize: 14 }}
          html={value}
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
  const hasVTable   = (article.motherNatureConsiderations ?? "").includes(VTABLE_MARKER);
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

      {/* Info before event — suppressed when the verification table is present,
          since the table's left column already shows this info (no duplication). */}
      {article.infoBeforeEvent && !hasVTable && (
        <WizardSection title="Information Before Event">
          <HtmlContent
            className="sl-article-content"
            style={{ fontSize: 14, paddingBottom: 4 }}
            html={article.infoBeforeEvent}
          />
        </WizardSection>
      )}

      {/* Content sections — all authored via RichEditor so render as HTML */}
      {hasContent && (
        <WizardSection title="Content">
          <WizardField
            label={hasVTable ? "Information & Mother Nature Consideration" : "Mother Nature Considerations"}
            value={article.motherNatureConsiderations}
            html
          />
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

// ─── Second View (accordion, no verification table) ────────────────────────────
// Client feedback (06-22): add a second tab that shows Information Before Event +
// Mother Nature Consideration WITHOUT the table, so the article is easier to read.
// The verification table is stored baked into motherNatureConsiderations; here we
// decompose it back into info/verification pairs and render each as an accordion.

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function decomposeVTable(html: string | null | undefined): { info: string; verification: string }[] {
  if (!html || !html.includes(VTABLE_MARKER)) return [];
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const table = doc.querySelector('table[data-sl-vtable="1"]');
    if (!table) return [];
    return Array.from(table.querySelectorAll("tbody tr")).map((tr) => {
      const tds = tr.querySelectorAll("td");
      return { info: tds[0]?.innerHTML ?? "", verification: tds[1]?.innerHTML ?? "" };
    });
  } catch { return []; }
}

function AccordionItem({ title, html, value, open }: { title: string; html?: string | null; value?: string | null; open?: boolean }) {
  if (!html && !value) return null;
  return (
    <details open={open} style={{ borderBottom: "1px solid #F3F4F6" }}>
      <summary style={{
        cursor: "pointer", listStyle: "revert", padding: "11px 2px", fontSize: 13, fontWeight: 700,
        color: "#0057A0", fontFamily: "Inter, Segoe UI, sans-serif", outline: "none",
      }}>
        {title}
      </summary>
      <div style={{ padding: "2px 2px 14px" }}>
        {html ? (
          <HtmlContent className="sl-article-content" style={{ fontSize: 14, lineHeight: 1.7, color: "#374151" }} html={html} />
        ) : (
          <div style={{ fontSize: 13.5, color: "#374151", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{value}</div>
        )}
      </div>
    </details>
  );
}

function SecondView({ article }: { article: Article }) {
  const pairs = decomposeVTable(article.motherNatureConsiderations);
  const hasPairs = pairs.length > 0;
  return (
    <div style={{ padding: "20px 28px 32px" }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: "#0F1419", lineHeight: 1.25, marginBottom: 14, wordBreak: "break-word" }}>
        {article.articleTitle || "Untitled Article"}
      </div>

      {hasPairs ? (
        pairs.map((p, i) => (
          <React.Fragment key={i}>
            <AccordionItem title="Information Before Event"     html={p.info}         open={i === 0} />
            <AccordionItem title="Mother Nature Consideration"  html={p.verification} open={i === 0} />
          </React.Fragment>
        ))
      ) : (
        <>
          <AccordionItem title="Information Before Event"      html={article.infoBeforeEvent}            open />
          {/* fallback branch only runs when there is no baked table, so this is raw text */}
          <AccordionItem title="Mother Nature Considerations"  html={article.motherNatureConsiderations} open />
        </>
      )}

      <AccordionItem title="Negative Function Executed"   html={article.negativeFunction} />
      <AccordionItem title="Problem Developed"            html={article.problemDetails} />
      <AccordionItem title="Function Executed from Event" html={article.funcExecuteFromEvent} />
      <AccordionItem title="Relationship"                 html={article.relationshipDetails} />
      <AccordionItem title="Pre-event Observation"        html={article.preEventObservation} />
      <AccordionItem title="Post-event Observation"       html={article.postEventObservation} />
      {!article.templateName && (
        <AccordionItem title="Article" html={article.articleContent} open />
      )}
    </div>
  );
}

// Opens the article as a standalone, full-width page in the system browser — more
// room to read than the dialog. Best-effort: builds a self-contained HTML doc and
// window.open()s it via a blob URL.
function openArticleInBrowser(article: Article): void {
  const parts: string[] = [];
  const push = (label: string, html?: string | null) => {
    if (html && html.trim()) parts.push(`<h2>${escapeHtml(label)}</h2>${html}`);
  };
  if (article.articleContent && article.articleContent.trim()) parts.push(article.articleContent);
  push("Information Before Event", article.infoBeforeEvent);
  push("Mother Nature Consideration", article.motherNatureConsiderations);
  push("Negative Function Executed", article.negativeFunction);
  push("Problem Developed", article.problemDetails);
  push("Function Executed from Event", article.funcExecuteFromEvent);
  push("Relationship", article.relationshipDetails);
  push("Pre-event Observation", article.preEventObservation);
  push("Post-event Observation", article.postEventObservation);

  const meta = [article.personName, article.articleDate ? formatDisplayDate(article.articleDate) : ""]
    .filter(Boolean).join("  ·  ");
  const docHtml =
    `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<title>${escapeHtml(article.articleTitle || "Article")}</title>` +
    `<style>body{font-family:Inter,'Segoe UI',sans-serif;max-width:780px;margin:40px auto;padding:0 22px;` +
    `color:#1a1a1a;line-height:1.7}h1{font-size:30px;line-height:1.2;margin:0 0 6px}` +
    `h2{font-size:18px;color:#0057A0;margin:30px 0 8px}.byline{color:#777;margin:0 0 24px}` +
    `img{max-width:100%;height:auto}table{border-collapse:collapse;width:100%}` +
    `td,th{border:1px solid #C7C7C7;padding:8px 10px;vertical-align:top}` +
    `blockquote{border-left:3px solid #C7C7C7;margin:0;padding-left:14px;color:#555}</style></head>` +
    `<body><h1>${escapeHtml(article.articleTitle || "Untitled Article")}</h1>` +
    (meta ? `<p class="byline">${escapeHtml(meta)}</p>` : "") +
    parts.join("") +
    `</body></html>`;

  try {
    const url = URL.createObjectURL(new Blob([docHtml], { type: "text/html" }));
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch { /* pop-up blocked or unavailable — best-effort */ }
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

  // Active tab: 0 = About Article (existing layout), 1 = Second View (accordion, no table).
  const [activeTab, setActiveTab] = useState(0);

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
            onClick={() => openArticleInBrowser(article)}
            title="Open in browser"
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#EBF3FC"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#F5F5F5"; }}
            style={{
              height: 26,
              padding: "0 11px",
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#F5F5F5",
              color: "#0057A0",
              border: "1px solid #E0E0E0",
              borderRadius: 6,
              cursor: "pointer",
              flexShrink: 0,
              fontSize: 11.4,
              fontWeight: 600,
              fontFamily: "Inter, Segoe UI, sans-serif",
              whiteSpace: "nowrap",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Open in browser
          </button>
          <button
            onClick={onClose}
            title="Close"
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#F0F0F0"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
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
            <CloseIcon />
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
          {["About Article", "Second View"].map((label, i) => (
            <button
              key={label}
              onClick={() => setActiveTab(i)}
              style={{
                height: 32,
                display: "flex",
                alignItems: "center",
                border: "none",
                background: "none",
                borderBottom: activeTab === i ? "2px solid #0078D4" : "2px solid transparent",
                fontSize: 12.4,
                fontWeight: 600,
                color: activeTab === i ? "#0078D4" : "#6B7280",
                cursor: "pointer",
                padding: "0 2px",
                marginRight: 18,
                fontFamily: "Inter, Segoe UI, sans-serif",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ flex: 1, overflow: "auto", background: "#fff" }}>
        {activeTab === 1 ? <SecondView article={article} /> : (<>

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
        </>)}
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
