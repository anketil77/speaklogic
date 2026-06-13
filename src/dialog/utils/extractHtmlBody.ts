// src/dialog/utils/extractHtmlBody.ts
//
// Client "information" files arrive as COMPLETE HTML documents
// (<html><head><script src=mathjax><style>…</head><body>…</body></html>).
// We can only store/render the renderable body — an injected <script> never
// executes (HTML5), and a full <head>/<body> wrapper can't be embedded inline.
//
// This extracts the <body> inner HTML, drops scripts/head, and keeps everything
// that actually renders: text, inline SVG diagrams, tables, and TeX math
// (\[ … \], \( … \), $…$) which our MathJax renderer typesets at display time.

/**
 * Returns the renderable inner HTML of a full or partial HTML document.
 * - Full document → returns <body> contents.
 * - Fragment → returned as-is (after script/style strip).
 * Always removes <script>, <style>, <link>, <meta>, <title> and on* handlers.
 */
export function extractHtmlBody(raw: string): string {
  if (!raw) return "";
  if (typeof document === "undefined") return raw;

  const doc = new DOMParser().parseFromString(raw, "text/html");
  // <body> always exists after parsing a document; for a bare fragment the
  // parser still wraps it in <body>, so this is safe for both cases.
  const root: HTMLElement = doc.body ?? doc.documentElement;

  // Strip anything non-renderable or dangerous.
  root.querySelectorAll("script, style, link, meta, title, noscript").forEach((el) => el.remove());
  root.querySelectorAll("*").forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      if (/^on/i.test(attr.name)) el.removeAttribute(attr.name);
      if (attr.name === "href" && /^javascript:/i.test(attr.value.trim())) el.removeAttribute("href");
    });
  });

  return root.innerHTML.trim();
}

/** True if the HTML contains TeX math delimiters \( \) or \[ \] (needs MathJax). */
export function containsMath(html: string): boolean {
  return /\\\(|\\\[/.test(html || "");
}
