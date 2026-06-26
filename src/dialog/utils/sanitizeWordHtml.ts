// src/dialog/utils/sanitizeWordHtml.ts
//
// Cleans the raw HTML that Word (Online + Desktop) emits for a selection so it
// renders correctly on a white dialog background: converts mso-highlight/bgcolor
// to standard background-color, recovers dark-theme-adapted highlight colours,
// fixes near-white text, strips page margins, and removes dangerous content.
//
// Shared by AnalyzeView (EUA panel), ApplyFeedbackView (Actual Selection) and
// ViewFeedbackDialog (saved selection). Do NOT duplicate this logic in views.

/* global DOMParser HTMLElement */

function colorLuminance(cssColor: string): number | null {
  const tmp = document.createElement("span");
  tmp.style.color = cssColor;
  document.body.appendChild(tmp);
  const computed = getComputedStyle(tmp).color;
  document.body.removeChild(tmp);
  const m = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return null;
  return (0.299 * +m[1] + 0.587 * +m[2] + 0.114 * +m[3]) / 255;
}

export function sanitizeWordHtml(html: string): string {
  if (!html) return "";

  // Extract class→highlight-color from the <style> block BEFORE stripping it.
  // Dark theme Word may store mso-highlight in class rules rather than inline styles.
  const highlightByClass: Record<string, string> = {};
  const styleBlocks = html.match(/<style[\s\S]*?<\/style>/gi) ?? [];
  for (const block of styleBlocks) {
    const ruleRe = /\.([\w-]+)\s*\{([^}]*)\}/g;
    let m: RegExpExecArray | null;
    while ((m = ruleRe.exec(block)) !== null) {
      const hlMatch = m[2].match(/mso-highlight:\s*([^;}"'\s][^;}"']*)/i);
      if (hlMatch) highlightByClass[m[1]] = hlMatch[1];
    }
  }

  const noStyle = html.replace(/<style[\s\S]*?<\/style>/gi, "");
  // Convert inline mso-highlight and bgcolor attributes to standard background-color.
  const normalized = noStyle
    .replace(/mso-highlight:\s*([^;}"'\s][^;}"']*)/gi, "background-color:$1")
    .replace(/bgcolor="([^"]+)"/gi, 'style="background-color:$1"');

  // Parse as a proper HTML document so we get the real <body> to zero its margins.
  const doc = new DOMParser().parseFromString(normalized, "text/html");
  const body = doc.body;
  body.style.margin = "0";
  body.style.padding = "0";

  const fix = (el: HTMLElement) => {
    // Apply class-based highlights extracted from the style block (dark theme).
    // Use getAttribute("class") (always a string) instead of el.className, which is
    // an SVGAnimatedString — not a string — on SVG elements (e.g. a pasted diagram),
    // where .split() throws "className.split is not a function" and crashes the editor.
    const classAttr = el.getAttribute("class") || "";
    if (classAttr) {
      for (const cls of classAttr.split(/\s+/)) {
        if (highlightByClass[cls]) { el.style.backgroundColor = highlightByClass[cls]; break; }
      }
    }
    // Fix near-white text so it's readable on the white background.
    if (el.style.color) {
      const lum = colorLuminance(el.style.color);
      if (lum !== null && lum > 0.85) el.style.color = "#1B1B1B";
    }
    // Save background color BEFORE clearing — setting background="" also wipes backgroundColor.
    const bgColor = el.style.backgroundColor;
    el.style.background = "";
    el.style.backgroundColor = "";
    if (bgColor) {
      const bgLum = colorLuminance(bgColor);
      if (bgLum !== null && bgLum > 0.5) {
        // Light color — keep as-is (light theme highlight).
        el.style.backgroundColor = bgColor;
      } else if (el.classList.contains("Highlight") && bgLum !== null && bgLum > 0.01) {
        // Word Online dark theme adapts yellow (255,255,0) → rgb(57,57,0): same hue, ~11% lightness.
        // Recover the original hue by scaling each channel up so the max channel = 255.
        const tmp2 = document.createElement("span");
        tmp2.style.color = bgColor;
        document.body.appendChild(tmp2);
        const comp = getComputedStyle(tmp2).color;
        document.body.removeChild(tmp2);
        const hm = comp.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (hm) {
          const r = +hm[1], g = +hm[2], b = +hm[3];
          const mx = Math.max(r, g, b);
          if (mx > 0) {
            const sc = 255 / mx;
            el.style.backgroundColor = `rgb(${Math.min(255, Math.round(r * sc))},${Math.min(255, Math.round(g * sc))},${Math.min(255, Math.round(b * sc))})`;
          }
        }
      }
      // else: dark non-highlight background → stripped.
    }
    // Strip Word's page margins from direct wrapper-div children of body
    // (e.g. <div class=WordSection1>). Do NOT touch semantic block elements —
    // their margins carry the article's intentional spacing (h1→byline→first p).
    if (el.parentElement === body && el.tagName === "DIV") {
      el.style.margin = "0";
      el.style.padding = "0";
    }
    for (const child of Array.from(el.children)) fix(child as HTMLElement);
  };
  fix(body);
  // Collapse whitespace inside text nodes (skip <pre>/<code>) so the displayed text
  // matches what window.getSelection().toString() returns — selection-based highlight
  // lookups (applyEuaHighlight) can then find their target via indexOf without needing
  // the container to use white-space: pre-wrap.
  const collectTextNodes = (root: Node): Text[] => {
    const out: Text[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n = walker.nextNode() as Text | null;
    while (n) { out.push(n); n = walker.nextNode() as Text | null; }
    return out;
  };
  for (const node of collectTextNodes(body)) {
    let inPreCode = false;
    for (let a = node.parentElement; a && a !== body; a = a.parentElement) {
      if (a.tagName === "PRE" || a.tagName === "CODE") { inPreCode = true; break; }
    }
    if (inPreCode) continue;
    const value = node.nodeValue ?? "";
    const collapsed = value.replace(/\s+/g, " ");
    if (collapsed !== value) node.nodeValue = collapsed;
  }
  // Remove leading empty block elements (e.g. empty <p> before actual content in Word's getHtml()).
  const stripLeadingEmpty = (parent: Element) => {
    while (parent.firstElementChild) {
      const first = parent.firstElementChild as HTMLElement;
      if ((first.textContent?.trim() ?? "") || first.querySelector("img, table")) break;
      first.remove();
    }
  };
  stripLeadingEmpty(body);
  // Word Desktop wraps content in <div class=WordSection1> — strip empty from there too.
  const firstWrapper = body.firstElementChild as HTMLElement | null;
  if (firstWrapper?.tagName === "DIV") stripLeadingEmpty(firstWrapper);
  // Zero the first visible block element's top margin and padding.
  const firstBlock = body.querySelector("p, h1, h2, h3, h4, h5, h6") as HTMLElement | null;
  if (firstBlock) { firstBlock.style.marginTop = "0"; firstBlock.style.paddingTop = "0"; }
  // Strip dangerous content: <script> tags, javascript: hrefs, and inline event handlers.
  body.querySelectorAll("script").forEach((s) => s.remove());
  body.querySelectorAll("[href]").forEach((el) => {
    const href = el.getAttribute("href") ?? "";
    if (/^javascript:/i.test(href.trim())) el.removeAttribute("href");
  });
  body.querySelectorAll("*").forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      if (/^on/i.test(attr.name)) el.removeAttribute(attr.name);
    });
  });
  return body.innerHTML.trim();
}
