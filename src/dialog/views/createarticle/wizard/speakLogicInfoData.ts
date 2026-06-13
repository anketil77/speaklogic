// src/dialog/views/createarticle/wizard/speakLogicInfoData.ts
//
// Built-in, CONSTANT "Speak Logic" information items for the wizard's
// "Select Information" panel (Point 14). These come from the client and are
// read-only — the user cannot add to or remove from this list.
//
// Each item's html is the renderable BODY of the client's HTML file with the
// styling inlined (the original files relied on <head> CSS, which can't be
// embedded inline). Content is rendered by the math-aware HtmlContent:
//   • the diagram item is inline SVG (no MathJax needed)
//   • the math item uses LaTeX \[ … \] which HtmlContent typesets via MathJax

import type { InfoItem } from "./SelectInfoPanel";

const EQ_STYLE =
  "background:#eef1ff;border-left:4px solid #3d5afe;border-radius:0 8px 8px 0;padding:10px 15px;margin:16px 0;overflow-x:auto;";

// ── "System Derivation Information" — diagram (inline SVG) ──────────────────
const SYSTEM_DERIVATION_DIAGRAM = `
<p>A system is realized from its derivation theory and functioned by its utilization theory in the form below.</p>
<div style="${EQ_STYLE}">
  <svg viewBox="0 0 1200 850" preserveAspectRatio="xMidYMid meet" style="width:100%;height:auto;display:block" xmlns="http://www.w3.org/2000/svg">
    <rect x="50" y="120" width="250" height="110" fill="white" stroke="black" stroke-width="2"/>
    <text x="175" y="185" text-anchor="middle" font-size="32">System</text>
    <rect x="430" y="30" width="120" height="300" fill="white" stroke="black" stroke-width="2"/>
    <text x="490" y="190" text-anchor="middle" font-size="60" font-weight="bold">+</text>
    <line x1="430" y1="175" x2="300" y2="175" stroke="black" stroke-width="2"/>
    <polygon points="300,175 325,160 325,190" fill="black"/>
    <text x="370" y="165" text-anchor="middle" font-size="26">is</text>
    <rect x="760" y="70" width="250" height="100" fill="white" stroke="black" stroke-width="2"/>
    <text x="885" y="115" text-anchor="middle" font-size="28">Derivation</text>
    <text x="885" y="150" text-anchor="middle" font-size="28">Principle</text>
    <line x1="760" y1="120" x2="550" y2="120" stroke="black" stroke-width="2"/>
    <polygon points="550,120 575,105 575,135" fill="black"/>
    <text x="650" y="105" text-anchor="middle" font-size="24">realized by</text>
    <rect x="760" y="220" width="250" height="100" fill="white" stroke="black" stroke-width="2"/>
    <text x="885" y="265" text-anchor="middle" font-size="28">Functional</text>
    <text x="885" y="300" text-anchor="middle" font-size="28">Principle</text>
    <line x1="760" y1="270" x2="550" y2="270" stroke="black" stroke-width="2"/>
    <polygon points="550,270 575,255 575,285" fill="black"/>
    <text x="650" y="255" text-anchor="middle" font-size="24">functioned by</text>
    <text x="600" y="430" text-anchor="middle" font-size="34">With the absence of the derivation theory, the model above becomes.</text>
    <rect x="50" y="560" width="250" height="110" fill="white" stroke="black" stroke-width="2"/>
    <text x="175" y="625" text-anchor="middle" font-size="32">System</text>
    <rect x="430" y="470" width="120" height="300" fill="white" stroke="black" stroke-width="2"/>
    <text x="490" y="630" text-anchor="middle" font-size="60" font-weight="bold">+</text>
    <line x1="430" y1="615" x2="300" y2="615" stroke="black" stroke-width="2"/>
    <polygon points="300,615 325,600 325,630" fill="black"/>
    <text x="370" y="605" text-anchor="middle" font-size="26">is</text>
    <rect x="760" y="510" width="250" height="100" fill="white" stroke="black" stroke-width="2"/>
    <text x="885" y="555" text-anchor="middle" font-size="28">Derivation</text>
    <text x="885" y="590" text-anchor="middle" font-size="28">Principle</text>
    <line x1="760" y1="560" x2="550" y2="560" stroke="black" stroke-width="2"/>
    <polygon points="550,560 575,545 575,575" fill="black"/>
    <text x="650" y="545" text-anchor="middle" font-size="24">realized by</text>
    <line x1="850" y1="525" x2="920" y2="595" stroke="red" stroke-width="6"/>
    <line x1="920" y1="525" x2="850" y2="595" stroke="red" stroke-width="6"/>
    <rect x="760" y="660" width="250" height="100" fill="white" stroke="black" stroke-width="2"/>
    <text x="885" y="705" text-anchor="middle" font-size="28">Functional</text>
    <text x="885" y="740" text-anchor="middle" font-size="28">Principle</text>
    <line x1="760" y1="710" x2="550" y2="710" stroke="black" stroke-width="2"/>
    <polygon points="550,710 575,695 575,725" fill="black"/>
    <text x="650" y="695" text-anchor="middle" font-size="24">functioned by</text>
  </svg>
</div>
<p>From above, with the absence of the derivation theory, the system is equal or functioned by its utilization theory.</p>
`;

// ── "System Derivation Information" — math (LaTeX, typeset by MathJax) ───────
const SYSTEM_DERIVATION_MATH = `
<p>The given system definition is that a system is realized from its derivation theory and functioned by its utilization theory.</p>
<div style="${EQ_STYLE}">\\[ S = D_T + U_T \\]</div>
<p>With the absence of the derivation theory, we have</p>
<div style="${EQ_STYLE}">\\[ D_T = 0 \\]</div>
<div style="${EQ_STYLE}">\\[ S = U_T \\]</div>
`;

// Negative ids keep these constant items from colliding with DB-backed
// user-identified items (which use positive AUTOINCREMENT ids).
export const SPEAK_LOGIC_INFO_ITEMS: InfoItem[] = [
  { id: "sl-system-derivation-diagram", name: "System Derivation Information (Diagram)", html: SYSTEM_DERIVATION_DIAGRAM.trim() },
  { id: "sl-system-derivation-math",    name: "System Derivation Information (Math)",    html: SYSTEM_DERIVATION_MATH.trim() },
];
