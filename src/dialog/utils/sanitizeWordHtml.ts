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
    if (el.className) {
      for (const cls of el.className.split(/\s+/)) {
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
    // Strip Word's page margins from direct children of body (outer wrapper divs).
    if (el.parentElement === body) { el.style.margin = "0"; el.style.padding = "0"; }
    for (const child of Array.from(el.children)) fix(child as HTMLElement);
  };
  fix(body);
  // Zero the first paragraph's default browser margin-top (1em) — Word Online doesn't set it inline.
  const firstP = body.querySelector("p") as HTMLElement | null;
  if (firstP) firstP.style.marginTop = "0";
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
  return body.innerHTML;
}
