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

// ── #2: System Derivation Information Multiple Systems ───────────────────────────────────────────────
const INFO_2_NONMATH = `
<p>For multiple systems, we have the following</p>
<div style="${EQ_STYLE}">
  <div style="max-width:580px;margin:0 auto;">
    <svg viewBox="0 0 1400 500" preserveAspectRatio="xMidYMid meet" style="width:100%;height:auto;display:block;" xmlns="http://www.w3.org/2000/svg">
      <!-- Systems Container -->
      <rect x="40" y="60" width="300" height="380" fill="white" stroke="black" stroke-width="3"/>
      <text x="190" y="45" text-anchor="middle" font-size="36" font-family="Arial">Systems</text>
      <!-- System 1 -->
      <rect x="85" y="90" width="190" height="70" fill="white" stroke="black" stroke-width="3"/>
      <text x="180" y="138" text-anchor="middle" font-size="28" font-family="Arial">System 1</text>
      <!-- System 2 -->
      <rect x="85" y="190" width="190" height="70" fill="white" stroke="black" stroke-width="3"/>
      <text x="180" y="238" text-anchor="middle" font-size="28" font-family="Arial">System 2</text>
      <!-- System 3 -->
      <rect x="85" y="290" width="190" height="70" fill="white" stroke="black" stroke-width="3"/>
      <text x="180" y="338" text-anchor="middle" font-size="28" font-family="Arial">System 3</text>
      <!-- Dots -->
      <circle cx="180" cy="380" r="12" fill="black"/>
      <circle cx="180" cy="410" r="12" fill="black"/>
      <circle cx="180" cy="440" r="12" fill="black"/>
      <!-- Arrow to Center -->
      <line x1="500" y1="250" x2="340" y2="250" stroke="black" stroke-width="3"/>
      <polygon points="340,250 370,232 370,268" fill="black"/>
      <text x="445" y="235" text-anchor="middle" font-size="28" font-family="Arial">is</text>
      <!-- Center Block -->
      <rect x="500" y="60" width="160" height="380" fill="white" stroke="black" stroke-width="3"/>
      <text x="580" y="280" text-anchor="middle" font-size="72" font-family="Arial" font-weight="bold">+</text>
      <!-- Top Right Arrow -->
      <line x1="950" y1="160" x2="660" y2="160" stroke="black" stroke-width="3"/>
      <polygon points="660,160 690,142 690,178" fill="black"/>
      <text x="820" y="145" text-anchor="middle" font-size="28" font-family="Arial">realized by</text>
      <!-- Derivation Principle -->
      <rect x="950" y="95" width="340" height="130" fill="white" stroke="black" stroke-width="3"/>
      <text x="1120" y="145" text-anchor="middle" font-size="30" font-family="Arial">Derivation</text>
      <text x="1120" y="200" text-anchor="middle" font-size="30" font-family="Arial">Principle</text>
      <!-- Red X -->
      <line x1="1070" y1="120" x2="1170" y2="200" stroke="red" stroke-width="6"/>
      <line x1="1170" y1="120" x2="1070" y2="200" stroke="red" stroke-width="6"/>
      <!-- Bottom Right Arrow -->
      <line x1="950" y1="350" x2="660" y2="350" stroke="black" stroke-width="3"/>
      <polygon points="660,350 690,332 690,368" fill="black"/>
      <text x="820" y="335" text-anchor="middle" font-size="28" font-family="Arial">functioned by</text>
      <!-- Functional Principle -->
      <rect x="950" y="285" width="340" height="130" fill="white" stroke="black" stroke-width="3"/>
      <text x="1120" y="335" text-anchor="middle" font-size="30" font-family="Arial">Functional</text>
      <text x="1120" y="390" text-anchor="middle" font-size="30" font-family="Arial">Principle</text>
    </svg>
  </div>
</div>
<p>Where the functional principle is the utilization theory</p>
`;
const INFO_2_MATH = `
<p>For multiple systems, such as \\(S_1, S_2, \\cdots\\), we have</p>
<div style="${EQ_STYLE}">\\[ \\left(S_1 + S_2 + \\cdots + S_N\\right) = U_T \\]</div>
`;

// ── #3: System Stability Information ───────────────────────────────────────
const INFO_3_NONMATH = `
<p>In terms of stability, we have</p>
<div style="${EQ_STYLE}">
  <div style="max-width: 580px; margin: 0 auto">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1568 727" width="580" height="auto">
      <defs>
        <marker id="arrow" markerWidth="12" markerHeight="12" refX="6" refY="6" orient="auto">
          <path d="M0,0 L12,6 L0,12 Z" fill="#000"/>
        </marker>
        <g id="figure">
          <circle cx="80" cy="50" r="38" fill="none" stroke="#000" stroke-width="1"/>
          <circle cx="65" cy="38" r="7" fill="#000"/>
          <circle cx="100" cy="38" r="7" fill="#000"/>
          <ellipse cx="80" cy="69" rx="13" ry="6" fill="none" stroke="#000"/>
          <line x1="80" y1="88" x2="80" y2="165" stroke="#000" stroke-width="2"/>
          <line x1="28" y1="122" x2="132" y2="122" stroke="#000" stroke-width="2"/>
          <line x1="80" y1="165" x2="28" y2="235" stroke="#000" stroke-width="2"/>
          <line x1="80" y1="165" x2="132" y2="235" stroke="#000" stroke-width="2"/>
        </g>
      </defs>
      <rect x="627" y="43" width="300" height="115" fill="none" stroke="#000" stroke-width="3"/>
      <text x="777" y="95" font-family="Arial, sans-serif" font-size="36" text-anchor="middle">Functional</text>
      <text x="777" y="130" font-family="Arial, sans-serif" font-size="36" text-anchor="middle">Principle</text>
      <line x1="145" y1="295" x2="1375" y2="295" stroke="#000" stroke-width="3"/>
      <line x1="777" y1="158" x2="777" y2="285" stroke="#000" stroke-width="3" marker-end="url(#arrow)"/>
      <line x1="147" y1="295" x2="147" y2="357" stroke="#000" stroke-width="3" marker-end="url(#arrow)"/>
      <line x1="553" y1="295" x2="553" y2="357" stroke="#000" stroke-width="3" marker-end="url(#arrow)"/>
      <line x1="928" y1="295" x2="928" y2="357" stroke="#000" stroke-width="3" marker-end="url(#arrow)"/>
      <line x1="1374" y1="295" x2="1374" y2="357" stroke="#000" stroke-width="3" marker-end="url(#arrow)"/>
      <rect x="100" y="369" width="160" height="245" fill="none" stroke="#000" stroke-width="3"/>
      <use href="#figure" x="100" y="369"/>
      <text x="180" y="652" font-family="Arial, sans-serif" font-size="40" text-anchor="middle">System 1</text>
      <rect x="472" y="369" width="160" height="245" fill="none" stroke="#000" stroke-width="3"/>
      <use href="#figure" x="472" y="369"/>
      <text x="552" y="652" font-family="Arial, sans-serif" font-size="40" text-anchor="middle">System 2</text>
      <rect x="847" y="369" width="160" height="245" fill="none" stroke="#000" stroke-width="3"/>
      <use href="#figure" x="847" y="369"/>
      <text x="927" y="668" font-family="Arial, sans-serif" font-size="40" text-anchor="middle">System 3</text>
      <circle cx="1091" cy="479" r="25" fill="#000"/>
      <circle cx="1164" cy="479" r="25" fill="#000"/>
      <circle cx="1237" cy="479" r="25" fill="#000"/>
      <rect x="1290" y="369" width="160" height="245" fill="none" stroke="#000" stroke-width="3"/>
      <use href="#figure" x="1290" y="369"/>
      <text x="1370" y="668" font-family="Arial, sans-serif" font-size="40" text-anchor="middle">System etc.</text>
    </svg>
  </div>
</div>
<p>Where the functional principle is the utilization theory</p>
`;
const INFO_3_MATH = `
<p>In terms of stability, we have</p>
<div style="${EQ_STYLE}">\\[ S(x)=\\left(x_1+x_2+\\cdots+x_N\\right)k \\]</div>
<p>Which is the same as</p>
<div style="${EQ_STYLE}">\\[ S(x)=\\frac{k}{x_1+x_2+\\cdots+x_N} \\]</div>
`;

// ── #4: Definition of Life Information or Simply Life Equation ───────────────────────────────────────────────
const INFO_4_NONMATH = `
<p>The definition of life is given to us in the form of</p>
<div style="${EQ_STYLE}">
  <svg class="diagram" viewBox="0 0 640 160" xmlns="http://www.w3.org/2000/svg" width="640">
    <!-- Outer Life box -->
    <rect x="20" y="20" width="600" height="120" rx="6" fill="white" stroke="#555" stroke-width="1.5"/>
    <text x="320" y="16" text-anchor="middle" font-size="17" font-weight="600" fill="#1a1410">Life</text>
    <!-- Natural Function sub-box -->
    <rect x="34" y="32" width="278" height="96" rx="4" fill="#f8f8f8" stroke="#888" stroke-width="1.2"/>
    <text x="173" y="50" text-anchor="middle" font-size="12" font-weight="700" fill="#3a6b4a">Natural Function</text>
    <rect x="50"  y="58" width="82" height="54" rx="3" fill="white" stroke="#aaa" stroke-width="1"/>
    <text x="91"  y="80" text-anchor="middle" font-size="12">Person</text>
    <text x="91"  y="97" text-anchor="middle" font-size="12">Talk</text>
    <rect x="150" y="58" width="78" height="54" rx="3" fill="white" stroke="#aaa" stroke-width="1"/>
    <text x="189" y="80" text-anchor="middle" font-size="12">Dog</text>
    <text x="189" y="97" text-anchor="middle" font-size="12">Walk</text>
    <circle cx="256" cy="85" r="4" fill="#888"/>
    <circle cx="268" cy="85" r="4" fill="#888"/>
    <circle cx="280" cy="85" r="4" fill="#888"/>
    <!-- Nonnatural Function sub-box -->
    <rect x="328" y="32" width="278" height="96" rx="4" fill="#f8f8f8" stroke="#888" stroke-width="1.2"/>
    <text x="467" y="50" text-anchor="middle" font-size="12" font-weight="700" fill="#8b3a2a">Nonnatural Function</text>
    <rect x="344" y="58" width="78" height="54" rx="3" fill="white" stroke="#aaa" stroke-width="1"/>
    <text x="383" y="80" text-anchor="middle" font-size="12">Car</text>
    <text x="383" y="97" text-anchor="middle" font-size="12">Drive</text>
    <rect x="440" y="58" width="78" height="54" rx="3" fill="white" stroke="#aaa" stroke-width="1"/>
    <text x="479" y="80" text-anchor="middle" font-size="12">Door</text>
    <text x="479" y="97" text-anchor="middle" font-size="12">Open</text>
    <circle cx="550" cy="85" r="4" fill="#888"/>
    <circle cx="562" cy="85" r="4" fill="#888"/>
    <circle cx="574" cy="85" r="4" fill="#888"/>
  </svg>
</div>
<p>Where the set of natural functions include only natural functions and the set of nonnatural functions include only nonnatural functions as shown above.</p>
`;
const INFO_4_MATH = `
<p>The functional system equation is given as</p>
<div style="${EQ_STYLE}">\\[ \\mathcal{L}(t) = h(t) + u(t) \\]</div>
<div style="${EQ_STYLE}">\\[ \\mathcal{L}(t) = \\sum_{n=1}^{\\infty} h_n(t) + \\sum_{m=1}^{M} u_m(t) \\]</div>
<p>Where \\(h(t)\\) are set of existing functions and \\(u(t)\\) are set of added functions.</p>
`;

// ── #5: System Apply Theory Information ───────────────────────────────────────────────
const INFO_5_NONMATH = `
<p>We add function to the system by applying theory as shown by this model</p>
<div style="${EQ_STYLE}">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1472 572" width="580" height="auto">
    <defs>
      <marker id="arrow" markerWidth="14" markerHeight="14" refX="10" refY="7" orient="auto">
        <path d="M0,0 L14,7 L0,14 Z" fill="#000"/>
      </marker>
      <!-- Stick figure -->
      <g id="person">
        <circle cx="0" cy="0" r="38" fill="none" stroke="#000" stroke-width="2"/>
        <circle cx="-15" cy="-10" r="6" fill="#000"/>
        <circle cx="15" cy="-10" r="6" fill="#000"/>
        <ellipse cx="0" cy="22" rx="14" ry="7" fill="none" stroke="#000" stroke-width="1"/>
        <line x1="0" y1="38" x2="0" y2="115" stroke="#000" stroke-width="2"/>
        <line x1="-52" y1="72" x2="52" y2="72" stroke="#000" stroke-width="2"/>
        <line x1="0" y1="115" x2="-52" y2="185" stroke="#000" stroke-width="2"/>
        <line x1="0" y1="115" x2="52" y2="185" stroke="#000" stroke-width="2"/>
      </g>
    </defs>
    <!-- Person -->
    <use href="#person" x="108" y="85"/>
    <!-- Arrow to Apply -->
    <line x1="200" y1="158" x2="430" y2="158" stroke="#000" stroke-width="3" marker-end="url(#arrow)"/>
    <!-- Apply Box -->
    <rect x="433" y="84" width="356" height="159" fill="#08B44A" stroke="#000" stroke-width="3"/>
    <text x="611" y="177" font-family="Arial, sans-serif" font-size="44" fill="#fff" text-anchor="middle">Apply</text>
    <!-- Function Box -->
    <rect x="1036" y="84" width="356" height="159" fill="#08B44A" stroke="#000" stroke-width="3"/>
    <text x="1214" y="177" font-family="Arial, sans-serif" font-size="44" fill="#fff" text-anchor="middle">Function</text>
    <!-- Arrow Apply -> Function -->
    <line x1="789" y1="158" x2="1030" y2="158" stroke="#000" stroke-width="3" marker-end="url(#arrow)"/>
    <!-- Text above arrow -->
    <text x="895" y="75" font-family="Arial, sans-serif" font-size="40" text-anchor="middle">to</text>
    <text x="895" y="135" font-family="Arial, sans-serif" font-size="40" text-anchor="middle">execute</text>
    <!-- Theory Box -->
    <rect x="433" y="367" width="356" height="159" fill="#08B44A" stroke="#000" stroke-width="3"/>
    <text x="611" y="461" font-family="Arial, sans-serif" font-size="44" fill="#fff" text-anchor="middle">Theory</text>
    <!-- Up Arrow -->
    <line x1="611" y1="367" x2="611" y2="245" stroke="#000" stroke-width="3" marker-end="url(#arrow)"/>
  </svg>
</div>
<p>For multiple systems, we have the following model</p>
<div style="${EQ_STYLE}">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1568 986" width="580" height="auto">
    <defs>
      <marker id="arrow" markerWidth="14" markerHeight="14" refX="10" refY="7" orient="auto">
        <path d="M0,0 L14,7 L0,14 Z" fill="#000"/>
      </marker>
      <!-- Reusable stick figure -->
      <g id="person">
        <circle cx="0" cy="0" r="36" fill="none" stroke="#000" stroke-width="2"/>
        <circle cx="-14" cy="-10" r="6" fill="#000"/>
        <circle cx="14" cy="-10" r="6" fill="#000"/>
        <ellipse cx="0" cy="18" rx="13" ry="6" fill="none" stroke="#000" stroke-width="1.5"/>
        <line x1="0" y1="36" x2="0" y2="112" stroke="#000" stroke-width="2"/>
        <line x1="-48" y1="68" x2="48" y2="68" stroke="#000" stroke-width="2"/>
        <line x1="0" y1="112" x2="-48" y2="180" stroke="#000" stroke-width="2"/>
        <line x1="0" y1="112" x2="48" y2="180" stroke="#000" stroke-width="2"/>
      </g>
    </defs>
    <!-- SYSTEM 1 -->
    <use href="#person" x="148" y="63"/>
    <text x="148" y="280" font-family="Arial, sans-serif" font-size="34" text-anchor="middle">System 1</text>
    <line x1="235" y1="131" x2="454" y2="131" stroke="#000" stroke-width="3" marker-end="url(#arrow)"/>
    <!-- Apply 1 -->
    <rect x="454" y="60" width="330" height="150" fill="#06B54A" stroke="#000" stroke-width="3"/>
    <text x="619" y="148" font-family="Arial, sans-serif" font-size="42" fill="#fff" text-anchor="middle">Apply</text>
    <!-- Theory 1 -->
    <rect x="454" y="327" width="330" height="150" fill="#06B54A" stroke="#000" stroke-width="3"/>
    <text x="619" y="416" font-family="Arial, sans-serif" font-size="42" fill="#fff" text-anchor="middle">Theory</text>
    <line x1="619" y1="327" x2="619" y2="214" stroke="#000" stroke-width="3" marker-end="url(#arrow)"/>
    <!-- Top execute path -->
    <text x="910" y="65" font-family="Arial, sans-serif" font-size="34" text-anchor="middle">to</text>
    <text x="910" y="115" font-family="Arial, sans-serif" font-size="34" text-anchor="middle">execute</text>
    <path d="M784 135 H1003 V420 H1178" fill="none" stroke="#000" stroke-width="3" marker-end="url(#arrow)"/>
    <!-- SYSTEM 2 -->
    <use href="#person" x="148" y="553"/>
    <text x="148" y="766" font-family="Arial, sans-serif" font-size="34" text-anchor="middle">System 2</text>
    <line x1="235" y1="621" x2="454" y2="621" stroke="#000" stroke-width="3" marker-end="url(#arrow)"/>
    <!-- Apply 2 -->
    <rect x="454" y="550" width="330" height="150" fill="#06B54A" stroke="#000" stroke-width="3"/>
    <text x="619" y="638" font-family="Arial, sans-serif" font-size="42" fill="#fff" text-anchor="middle">Apply</text>
    <!-- Theory 2 -->
    <rect x="454" y="817" width="330" height="150" fill="#06B54A" stroke="#000" stroke-width="3"/>
    <text x="619" y="906" font-family="Arial, sans-serif" font-size="42" fill="#fff" text-anchor="middle">Theory</text>
    <line x1="619" y1="817" x2="619" y2="704" stroke="#000" stroke-width="3" marker-end="url(#arrow)"/>
    <!-- Bottom execute path -->
    <text x="892" y="815" font-family="Arial, sans-serif" font-size="34" text-anchor="middle">to</text>
    <text x="892" y="870" font-family="Arial, sans-serif" font-size="34" text-anchor="middle">execute</text>
    <path d="M784 887 H1003 V612 H1178" fill="none" stroke="#000" stroke-width="3" marker-end="url(#arrow)"/>
    <!-- Functions container -->
    <rect x="1178" y="338" width="335" height="335" fill="none" stroke="#000" stroke-width="3"/>
    <text x="1345" y="325" font-family="Arial, sans-serif" font-size="32" text-anchor="middle">Functions</text>
    <!-- Function 1 -->
    <rect x="1200" y="360" width="281" height="128" fill="#06B54A" stroke="#000" stroke-width="3"/>
    <text x="1340" y="438" font-family="Arial, sans-serif" font-size="40" fill="#fff" text-anchor="middle">Function 1</text>
    <!-- Function 2 -->
    <rect x="1200" y="512" width="281" height="128" fill="#06B54A" stroke="#000" stroke-width="3"/>
    <text x="1340" y="590" font-family="Arial, sans-serif" font-size="40" fill="#fff" text-anchor="middle">Function 2</text>
  </svg>
</div>
`;
const INFO_5_MATH = `
<p>Using the functional system equation, the functions are added to the system by applying the utilization theory in this form.</p>
<div style="${EQ_STYLE}">\\[ u(t) = S \\cdot Tr\\{T\\} \\]</div>
<p>Where for multiple systems, we have</p>
<div style="${EQ_STYLE}">\\[ u(t) = S_1 Tr\\{T\\} + S_1 Tr\\{T\\} + \\cdots + S_N Tr\\{T\\} \\]</div>
<div style="${EQ_STYLE}">\\[ u(t) = \\sum_{n=1}^{N} S_N \\, Tr\\{T\\} \\]</div>
`;

// ── #6: System Input and Output Information ───────────────────────────────────────────────
const INFO_6_NONMATH = `
<p>In order to execute a function, the physical system applies theory, where theory gives ideas to the system as shown by this model.</p>
<div style="${EQ_STYLE}">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 436" width="580" height="auto">
    <defs>
      <marker id="arrow" markerWidth="14" markerHeight="14" refX="10" refY="7" orient="auto">
        <path d="M0,0 L14,7 L0,14 Z" fill="#000"/>
      </marker>
      <!-- Reusable stick figure -->
      <g id="person">
        <circle cx="0" cy="0" r="50" fill="none" stroke="#000" stroke-width="2"/>
        <circle cx="-20" cy="-15" r="8" fill="#000"/>
        <circle cx="20" cy="-15" r="8" fill="#000"/>
        <ellipse cx="0" cy="25" rx="16" ry="8" fill="none" stroke="#000" stroke-width="1.5"/>
        <line x1="0" y1="50" x2="0" y2="150" stroke="#000" stroke-width="2"/>
        <line x1="-68" y1="92" x2="68" y2="92" stroke="#000" stroke-width="2"/>
        <line x1="0" y1="150" x2="-68" y2="245" stroke="#000" stroke-width="2"/>
        <line x1="0" y1="150" x2="68" y2="245" stroke="#000" stroke-width="2"/>
      </g>
    </defs>
    <!-- Theory -->
    <rect x="25" y="58" width="300" height="140" fill="#07B64A" stroke="#000" stroke-width="3"/>
    <text x="175" y="143" font-family="Arial, sans-serif" font-size="44" fill="#fff" text-anchor="middle">Theory</text>
    <!-- Arrow Theory -> System -->
    <line x1="325" y1="128" x2="620" y2="128" stroke="#000" stroke-width="3" marker-end="url(#arrow)"/>
    <text x="470" y="98" font-family="Arial, sans-serif" font-size="34" text-anchor="middle">give ideas to</text>
    <!-- System box -->
    <rect x="622" y="58" width="205" height="320" fill="none" stroke="#000" stroke-width="3"/>
    <use href="#person" x="724" y="125"/>
    <text x="724" y="430" font-family="Arial, sans-serif" font-size="44" text-anchor="middle">System</text>
    <!-- Arrow System -> Function -->
    <line x1="827" y1="281" x2="1090" y2="281" stroke="#000" stroke-width="3" marker-end="url(#arrow)"/>
    <text x="958" y="240" font-family="Arial, sans-serif" font-size="34" text-anchor="middle">to execute</text>
    <!-- Function -->
    <rect x="1088" y="219" width="300" height="140" fill="#07B64A" stroke="#000" stroke-width="3"/>
    <text x="1238" y="304" font-family="Arial, sans-serif" font-size="44" fill="#fff" text-anchor="middle">Function</text>
  </svg>
</div>
<p>From the model above, the theory is viewed as input to the system, where the output is viewed as the resulted function based on the application of theory.</p>
`;
const INFO_6_MATH = `
<p>In order to execute a function, the physical system applies theory, where theory gives ideas to the system as shown by this model</p>
<div style="${EQ_STYLE}">
  <div style="display:flex;align-items:center;justify-content:space-between;">
    <div style="border:1px solid #000;width:50%;padding:10px 20px;border-radius:6px;text-align:center;font-family:'Times New Roman',Times,serif;font-style:italic;font-size:19px;">T</div>
    <div style="width:30%;text-align:center;font-size:19px;">&#8594;</div>
    <div style="border:1px solid #000;width:50%;padding:10px 20px;border-radius:6px;text-align:center;font-family:'Times New Roman',Times,serif;font-style:italic;font-size:19px;">S</div>
    <div style="width:30%;text-align:center;font-size:19px;">&#8594;</div>
    <div style="border:1px solid #000;width:50%;padding:10px 20px;border-radius:6px;text-align:center;font-family:'Times New Roman',Times,serif;font-style:italic;font-size:19px;">u(t)</div>
  </div>
</div>
<p>From the model above, the theory is viewed as input to the system, where the output is viewed as the resulted function based on the application of theory.</p>
`;

// ── #7: Functional System Functions Grouping Information ───────────────────────────────────────────────
const INFO_7_NONMATH = `
<p>The functional system which is life is given as</p>
<div style="${EQ_STYLE}">
  <svg class="diagram" viewBox="0 0 640 160" xmlns="http://www.w3.org/2000/svg" width="640">
    <!-- Outer Life box -->
    <rect x="20" y="20" width="600" height="120" rx="6" fill="white" stroke="#555" stroke-width="1.5"/>
    <text x="320" y="16" text-anchor="middle" font-size="17" font-weight="600" fill="#1a1410">Functional System</text>

    <!-- Natural Function sub-box -->
    <rect x="34" y="32" width="278" height="96" rx="4" fill="#f8f8f8" stroke="#888" stroke-width="1.2"/>
    <text x="173" y="50" text-anchor="middle" font-size="12" font-weight="700" fill="#3a6b4a">Natural Function</text>

    <rect x="50"  y="58" width="82" height="54" rx="3" fill="white" stroke="#aaa" stroke-width="1"/>
    <text x="91"  y="80" text-anchor="middle" font-size="12">Person</text>
    <text x="91"  y="97" text-anchor="middle" font-size="12">Talk</text>

    <rect x="150" y="58" width="78" height="54" rx="3" fill="white" stroke="#aaa" stroke-width="1"/>
    <text x="189" y="80" text-anchor="middle" font-size="12">Dog</text>
    <text x="189" y="97" text-anchor="middle" font-size="12">Walk</text>

    <circle cx="256" cy="85" r="4" fill="#888"/>
    <circle cx="268" cy="85" r="4" fill="#888"/>
    <circle cx="280" cy="85" r="4" fill="#888"/>

    <!-- Nonnatural Function sub-box -->
    <rect x="328" y="32" width="278" height="96" rx="4" fill="#f8f8f8" stroke="#888" stroke-width="1.2"/>
    <text x="467" y="50" text-anchor="middle" font-size="12" font-weight="700" fill="#8b3a2a">Nonnatural Function</text>

    <rect x="344" y="58" width="78" height="54" rx="3" fill="white" stroke="#aaa" stroke-width="1"/>
    <text x="383" y="80" text-anchor="middle" font-size="12">Car</text>
    <text x="383" y="97" text-anchor="middle" font-size="12">Drive</text>

    <rect x="440" y="58" width="78" height="54" rx="3" fill="white" stroke="#aaa" stroke-width="1"/>
    <text x="479" y="80" text-anchor="middle" font-size="12">Door</text>
    <text x="479" y="97" text-anchor="middle" font-size="12">Open</text>

    <circle cx="550" cy="85" r="4" fill="#888"/>
    <circle cx="562" cy="85" r="4" fill="#888"/>
    <circle cx="574" cy="85" r="4" fill="#888"/>
  </svg>
</div>
<p>The functions can be grouped by location in the form below, where each group is viewed as a location.</p>
<div style="${EQ_STYLE}">
  <svg class="diagram" viewBox="0 0 640 170" xmlns="http://www.w3.org/2000/svg" width="640">
    <!-- Outer FS -->
    <rect x="20" y="20" width="600" height="110" rx="5" fill="white" stroke="#555" stroke-width="1.5"/>
    <text x="320" y="15" text-anchor="middle" font-size="16" font-weight="700">Functional System</text>

    <!-- Location 1 -->
    <rect x="34" y="32" width="178" height="86" rx="3" fill="#f8f8f8" stroke="#888" stroke-width="1.2"/>
    <text x="123" y="48" text-anchor="middle" font-size="11" font-weight="700" fill="#3a4a5a">Location 1</text>
    <rect x="46"  y="54" width="58" height="50" rx="2" fill="white" stroke="#bbb" stroke-width="1"/>
    <text x="75"  y="83" text-anchor="middle" font-size="11">Function</text>
    <rect x="114" y="54" width="58" height="50" rx="2" fill="white" stroke="#bbb" stroke-width="1"/>
    <text x="143" y="83" text-anchor="middle" font-size="11">Function</text>
    <circle cx="186" cy="79" r="3.5" fill="#888"/>
    <circle cx="196" cy="79" r="3.5" fill="#888"/>

    <!-- Location 2 -->
    <rect x="230" y="32" width="178" height="86" rx="3" fill="#f8f8f8" stroke="#888" stroke-width="1.2"/>
    <text x="319" y="48" text-anchor="middle" font-size="11" font-weight="700" fill="#3a4a5a">Location 2</text>
    <rect x="242" y="54" width="58" height="50" rx="2" fill="white" stroke="#bbb" stroke-width="1"/>
    <text x="271" y="83" text-anchor="middle" font-size="11">Function</text>
    <rect x="310" y="54" width="58" height="50" rx="2" fill="white" stroke="#bbb" stroke-width="1"/>
    <text x="339" y="83" text-anchor="middle" font-size="11">Function</text>
    <circle cx="382" cy="79" r="3.5" fill="#888"/>
    <circle cx="392" cy="79" r="3.5" fill="#888"/>

    <!-- Location 3 -->
    <rect x="426" y="32" width="178" height="86" rx="3" fill="#f8f8f8" stroke="#888" stroke-width="1.2"/>
    <text x="515" y="48" text-anchor="middle" font-size="11" font-weight="700" fill="#3a4a5a">Location 3</text>
    <rect x="438" y="54" width="58" height="50" rx="2" fill="white" stroke="#bbb" stroke-width="1"/>
    <text x="467" y="83" text-anchor="middle" font-size="11">Function</text>
    <rect x="506" y="54" width="58" height="50" rx="2" fill="white" stroke="#bbb" stroke-width="1"/>
    <text x="535" y="83" text-anchor="middle" font-size="11">Function</text>
    <circle cx="578" cy="79" r="3.5" fill="#888"/>
    <circle cx="590" cy="79" r="3.5" fill="#888"/>
    <circle cx="602" cy="79" r="3.5" fill="#888"/>
  </svg>
</div>
<p>From above, we can see that each location is viewed as a function where the functions are similar or equal. For example, Location 1, which is viewed as a function is similar or equal to Location 2 as well as Location 3 as shown by this model.</p>
<div style="${EQ_STYLE}">
  <svg class="diagram" viewBox="0 0 440 70" xmlns="http://www.w3.org/2000/svg" width="440">
    <rect x="20" y="15" width="120" height="40" rx="4" fill="white" stroke="#555" stroke-width="1.5"/>
    <text x="80" y="39" text-anchor="middle" font-size="14" font-weight="600">Location 1</text>
    <line x1="140" y1="35" x2="165" y2="35" stroke="#555" stroke-width="1.5"/>
    <circle cx="180" cy="35" r="14" fill="white" stroke="#555" stroke-width="1.5"/>
    <text x="180" y="39" text-anchor="middle" font-size="16">=</text>
    <line x1="194" y1="35" x2="219" y2="35" stroke="#555" stroke-width="1.5"/>
    <rect x="220" y="15" width="120" height="40" rx="4" fill="white" stroke="#555" stroke-width="1.5"/>
    <text x="280" y="39" text-anchor="middle" font-size="14" font-weight="600">Location 2</text>
    <line x1="340" y1="35" x2="365" y2="35" stroke="#555" stroke-width="1.5"/>
    <circle cx="380" cy="35" r="14" fill="white" stroke="#555" stroke-width="1.5"/>
    <text x="380" y="39" text-anchor="middle" font-size="16">=</text>
    <text x="410" y="25" text-anchor="middle" font-size="16">•</text>
    <text x="420" y="25" text-anchor="middle" font-size="16">•</text>
    <text x="430" y="25" text-anchor="middle" font-size="16">•</text>
  </svg>
</div>
`;
const INFO_7_MATH = `
<p>The functional system equation is given as</p>
<div style="${EQ_STYLE}">\\[ \\mathcal{L}(t) = h(t) + u(t) \\]</div>
<p>By taking location into consideration, we have <span style="font-family:'Times New Roman',Times,serif;font-style:italic;">N</span> locations where equation becomes</p>
<div style="${EQ_STYLE}">\\[ \\mathcal{L}(t) = \\mathcal{L}_1(t) + \\mathcal{L}_2(t) + \\cdots + \\mathcal{L}_N(t) \\]</div>
<p>Where each function is similar or equal in this form</p>
<div style="${EQ_STYLE}">\\[ \\mathcal{L}_1(t) \\simeq \\mathcal{L}_2(t) \\simeq \\cdots \\simeq \\mathcal{L}_N(t) \\]</div>
`;

// ── #8: Functional System Location as Function Information ───────────────────────────────
const INFO_8_NONMATH = `
<p>By grouping all existing functions and the added functions together where the added functions are executed at location or simply location as function, then we have this model.</p>
<div style="${EQ_STYLE}"><svg viewBox="0 0 640 130" xmlns="http://www.w3.org/2000/svg" width="640">
  <rect x="20" y="20" width="600" height="90" rx="5" fill="white" stroke="#555" stroke-width="1.5"/>
  <text x="320" y="14" text-anchor="middle" font-size="16" font-weight="700">Functional System</text>
  <!-- Existing Functions -->
  <rect x="34" y="30" width="160" height="70" rx="3" fill="#f8f8f8" stroke="#888" stroke-width="1.2"/>
  <text x="114" y="48" text-anchor="middle" font-size="11" font-weight="700" fill="#3a4a5a">Existing Functions</text>
  <rect x="46"  y="54" width="52" height="34" rx="2" fill="white" stroke="#bbb" stroke-width="1"/>
  <text x="72"  y="75" text-anchor="middle" font-size="11">Function</text>
  <rect x="108" y="54" width="52" height="34" rx="2" fill="white" stroke="#bbb" stroke-width="1"/>
  <text x="134" y="75" text-anchor="middle" font-size="11">Function</text>
  <circle cx="172" cy="71" r="3" fill="#888"/>
  <circle cx="180" cy="71" r="3" fill="#888"/>
  <!-- Location 1 -->
  <rect x="214" y="30" width="118" height="70" rx="3" fill="#e8f4ec" stroke="#3a6b4a" stroke-width="1.2"/>
  <text x="273" y="48" text-anchor="middle" font-size="11" font-weight="700" fill="#3a6b4a">Location 1</text>
  <rect x="228" y="54" width="90" height="34" rx="2" fill="white" stroke="#3a6b4a" stroke-width="1"/>
  <text x="273" y="75" text-anchor="middle" font-size="11">Added Function</text>
  <!-- Location 2 -->
  <rect x="346" y="30" width="118" height="70" rx="3" fill="#e8f4ec" stroke="#3a6b4a" stroke-width="1.2"/>
  <text x="405" y="48" text-anchor="middle" font-size="11" font-weight="700" fill="#3a6b4a">Location 2</text>
  <rect x="360" y="54" width="90" height="34" rx="2" fill="white" stroke="#3a6b4a" stroke-width="1"/>
  <text x="405" y="75" text-anchor="middle" font-size="11">Added Function</text>
  <!-- Location 3 -->
  <rect x="478" y="30" width="118" height="70" rx="3" fill="#e8f4ec" stroke="#3a6b4a" stroke-width="1.2"/>
  <text x="537" y="48" text-anchor="middle" font-size="11" font-weight="700" fill="#3a6b4a">Location 3</text>
  <rect x="492" y="54" width="90" height="34" rx="2" fill="white" stroke="#3a6b4a" stroke-width="1"/>
  <text x="537" y="75" text-anchor="middle" font-size="11">Added Function</text>
  <circle cx="604" cy="71" r="3.5" fill="#888"/>
  <circle cx="614" cy="71" r="3.5" fill="#888"/>
</svg></div>
`;
const INFO_8_MATH = `
<p>By taking location into consideration with added functions with the functional system equation, we have</p>
<div style="${EQ_STYLE}">\\[ \\mathcal{L}(t) = h(t) + \\left[u(t)\\big|_{L_1} + u(t)\\big|_{L_2} + \\cdots + u(t)\\big|_{L_N}\\right] \\]</div>
<p>From above, we have <span style="font-family:'Times New Roman',Times,serif;font-style:italic;">N</span> locations, where each location is viewed as a group of added functions at that location. If we want to, we can show the function above as</p>
<div style="${EQ_STYLE}">\\[ \\mathcal{L}(t) = h(t) + \\sum_{n=1}^{N} u(t)\\big|_{L_n} \\]</div>
`;

// ── #9: Communication Function and Result Information ───────────────────────────────────────────────
const INFO_9_NONMATH = `
<p>In the communication domain, when multiple people are working on a project, then the function of the project is.</p>
<div style="${EQ_STYLE}">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1680 920" width="580" height="auto">
    <defs>
      <marker id="arrow" markerWidth="14" markerHeight="14" refX="10" refY="7" orient="auto">
        <path d="M0,0 L14,7 L0,14 Z" fill="#000"/>
      </marker>

      <!-- Reusable person -->
      <g id="person">
        <circle cx="0" cy="0" r="32" fill="none" stroke="#000" stroke-width="2"/>
        <circle cx="-12" cy="-10" r="5" fill="#000"/>
        <circle cx="12" cy="-10" r="5" fill="#000"/>
        <ellipse cx="0" cy="18" rx="12" ry="5" fill="none" stroke="#000" stroke-width="1"/>
        <line x1="0" y1="32" x2="0" y2="110" stroke="#000" stroke-width="2"/>
        <line x1="-48" y1="65" x2="48" y2="65" stroke="#000" stroke-width="2"/>
        <line x1="0" y1="110" x2="-48" y2="175" stroke="#000" stroke-width="2"/>
        <line x1="0" y1="110" x2="48" y2="175" stroke="#000" stroke-width="2"/>
      </g>
    </defs>

    <!-- Application -->
    <rect x="55" y="40" width="295" height="140"
          fill="#07B64A"
          stroke="#000"
          stroke-width="3"/>

    <text x="202" y="120"
          font-family="Arial, sans-serif"
          font-size="42"
          fill="#fff"
          text-anchor="middle">
      Application
    </text>

    <!-- Application to Comm App Mix -->
    <path d="M350 110 H840 V280"
          fill="none"
          stroke="#000"
          stroke-width="3"
          marker-end="url(#arrow)"/>

    <!-- Person 1 -->
    <rect x="60" y="320" width="145" height="230"
          fill="none"
          stroke="#000"
          stroke-width="3"/>

    <use href="#person" x="132" y="365"/>

    <text x="132" y="585"
          font-family="Arial, sans-serif"
          font-size="34"
          text-anchor="middle">
      Person 1
    </text>

    <!-- Person 1 communication -->
    <line x1="205" y1="423" x2="700" y2="423"
          stroke="#000"
          stroke-width="3"
          marker-end="url(#arrow)"/>

    <text x="445" y="400"
          font-family="Arial, sans-serif"
          font-size="34"
          font-style="italic"
          text-anchor="middle">
      communication
    </text>

    <!-- Person 2 -->
    <rect x="50" y="620" width="145" height="230"
          fill="none"
          stroke="#000"
          stroke-width="3"/>

    <use href="#person" x="122" y="665"/>

    <text x="122" y="880"
          font-family="Arial, sans-serif"
          font-size="34"
          text-anchor="middle">
      Person 2
    </text>

    <!-- Person 2 communication -->
    <line x1="195" y1="733" x2="700" y2="733"
          stroke="#000"
          stroke-width="3"
          marker-end="url(#arrow)"/>

    <text x="450" y="710"
          font-family="Arial, sans-serif"
          font-size="34"
          font-style="italic"
          text-anchor="middle">
      communication
    </text>

    <!-- Comm App Mix -->
    <rect x="700" y="285" width="245" height="615"
          fill="none"
          stroke="#000"
          stroke-width="3"/>

    <text x="822" y="545"
          font-family="Arial, sans-serif"
          font-size="42"
          text-anchor="middle">
      <tspan x="822" dy="0">Comm</tspan>
      <tspan x="822" dy="64">App</tspan>
      <tspan x="822" dy="64">Mix</tspan>
    </text>

    <!-- Comm App Mix to Communication Function -->
    <line x1="945" y1="585" x2="1160" y2="585"
          stroke="#000"
          stroke-width="3"
          marker-end="url(#arrow)"/>

    <!-- Communication Function -->
    <rect x="1160" y="475" width="435" height="210"
          fill="#07B64A"
          stroke="#000"
          stroke-width="3"/>

    <text x="1378" y="570"
          font-family="Arial, sans-serif"
          font-size="42"
          fill="#fff"
          text-anchor="middle">
      Communication
    </text>

    <text x="1378" y="625"
          font-family="Arial, sans-serif"
          font-size="42"
          fill="#fff"
          text-anchor="middle">
      Function
    </text>
  </svg>
</div>
<p>From above, the application is viewed as the idea of the application or simply the idea of the project, which is given, and communication is the communication of the people in the project.</p>
`;
const INFO_9_MATH = `
<p>In the communication domain, when multiple people are working on a project, the function of the project is</p>
<div style="${EQ_STYLE}">\\[ f(x) = A\\!\\left[\\sum_{n=1}^{N} P_n\\right]\\!x \\]</div>
<p>From above, <span style="font-family:'Times New Roman',Times,serif;font-style:italic;">N</span> people are working on a project with the idea of the application <span style="font-family:'Times New Roman',Times,serif;font-style:italic;">A</span> and communication <span style="font-family:'Times New Roman',Times,serif;font-style:italic;">x</span></p>
`;

// ── #10: Application Error Correction Function Information ───────────────────────────────────────────────
const INFO_10_NONMATH = `
<p>When multiple people are working on a project, with errors in communication, we have</p>
<div style="${EQ_STYLE}">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1680 920" width="580" height="auto">
    <defs>
      <marker id="arrow" markerWidth="14" markerHeight="14" refX="10" refY="7" orient="auto">
        <path d="M0,0 L14,7 L0,14 Z" fill="#000"/>
      </marker>
      <!-- Reusable person -->
      <g id="person">
        <circle cx="0" cy="0" r="32" fill="none" stroke="#000" stroke-width="2"/>
        <circle cx="-12" cy="-10" r="5" fill="#000"/>
        <circle cx="12" cy="-10" r="5" fill="#000"/>
        <ellipse cx="0" cy="18" rx="12" ry="5" fill="none" stroke="#000" stroke-width="1"/>
        <line x1="0" y1="32" x2="0" y2="110" stroke="#000" stroke-width="2"/>
        <line x1="-48" y1="65" x2="48" y2="65" stroke="#000" stroke-width="2"/>
        <line x1="0" y1="110" x2="-48" y2="175" stroke="#000" stroke-width="2"/>
        <line x1="0" y1="110" x2="48" y2="175" stroke="#000" stroke-width="2"/>
      </g>
    </defs>
    <!-- Application -->
    <rect x="55" y="40" width="295" height="140" fill="#f10000" stroke="#000" stroke-width="3"/>
    <text x="202" y="120" font-family="Arial, sans-serif" font-size="42" fill="#fff" text-anchor="middle">Application</text>
    <!-- Application to Comm App Mix -->
    <path d="M350 110 H840 V280" fill="none" stroke="#000" stroke-width="3" marker-end="url(#arrow)"/>
    <!-- Person 1 -->
    <rect x="60" y="320" width="145" height="230" fill="none" stroke="#000" stroke-width="3"/>
    <use href="#person" x="132" y="365"/>
    <text x="132" y="585" font-family="Arial, sans-serif" font-size="34" text-anchor="middle">Person 1</text>
    <!-- Person 1 communication -->
    <line x1="205" y1="423" x2="700" y2="423" stroke="#000" stroke-width="3" marker-end="url(#arrow)"/>
    <text x="445" y="400" font-family="Arial, sans-serif" font-size="34" font-style="italic" fill="#F10000" text-anchor="middle">communication</text>
    <!-- Person 2 -->
    <rect x="50" y="620" width="145" height="230" fill="none" stroke="#000" stroke-width="3"/>
    <use href="#person" x="122" y="665"/>
    <text x="122" y="880" font-family="Arial, sans-serif" font-size="34" text-anchor="middle">Person 2</text>
    <!-- Person 2 communication -->
    <line x1="195" y1="733" x2="700" y2="733" stroke="#000" stroke-width="3" marker-end="url(#arrow)"/>
    <text x="450" y="710" font-family="Arial, sans-serif" font-size="34" font-style="italic" fill="#F10000" text-anchor="middle">communication</text>
    <!-- Comm App Mix -->
    <rect x="700" y="285" width="245" height="615" fill="none" stroke="#000" stroke-width="3"/>
    <text x="822" y="545" font-family="Arial, sans-serif" font-size="42" text-anchor="middle">
      <tspan x="822" dy="0">Comm</tspan>
      <tspan x="822" dy="64">App</tspan>
      <tspan x="822" dy="64">Mix</tspan>
    </text>
    <!-- Comm App Mix to Communication Function -->
    <line x1="945" y1="585" x2="1160" y2="585" stroke="#000" stroke-width="3" marker-end="url(#arrow)"/>
    <!-- Communication Function -->
    <rect x="1160" y="475" width="435" height="210" fill="#f10000" stroke="#000" stroke-width="3"/>
    <text x="1378" y="570" font-family="Arial, sans-serif" font-size="42" fill="#fff" text-anchor="middle">Communication</text>
    <text x="1378" y="625" font-family="Arial, sans-serif" font-size="42" fill="#fff" text-anchor="middle">Function</text>
  </svg>
</div>
<p>Where the errors are corrected using the Error Correction Function (ECF) as shown</p>
<div style="${EQ_STYLE}">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1680 1100" width="580" height="auto">
    <defs>
      <marker id="arrow" markerWidth="14" markerHeight="14" refX="10" refY="7" orient="auto">
        <path d="M0,0 L14,7 L0,14 Z" fill="#000"/>
      </marker>
      <!-- Reusable person -->
      <g id="person">
        <circle cx="0" cy="0" r="32" fill="none" stroke="#000" stroke-width="2"/>
        <circle cx="-12" cy="-10" r="5" fill="#000"/>
        <circle cx="12" cy="-10" r="5" fill="#000"/>
        <ellipse cx="0" cy="18" rx="12" ry="5" fill="none" stroke="#000" stroke-width="1"/>
        <line x1="0" y1="32" x2="0" y2="110" stroke="#000" stroke-width="2"/>
        <line x1="-48" y1="65" x2="48" y2="65" stroke="#000" stroke-width="2"/>
        <line x1="0" y1="110" x2="-48" y2="175" stroke="#000" stroke-width="2"/>
        <line x1="0" y1="110" x2="48" y2="175" stroke="#000" stroke-width="2"/>
      </g>
    </defs>
    <!-- Application -->
    <rect x="55" y="40" width="295" height="140" fill="#07B64A" stroke="#000" stroke-width="3"/>
    <text x="202" y="120" font-family="Arial, sans-serif" font-size="42" fill="#fff" text-anchor="middle">Application</text>
    <!-- Application -> Comm App Mix -->
    <path d="M350 110 H840 V280" fill="none" stroke="#000" stroke-width="3" marker-end="url(#arrow)"/>
    <!-- Person 1 -->
    <rect x="60" y="320" width="145" height="230" fill="none" stroke="#000" stroke-width="3"/>
    <use href="#person" x="132" y="365"/>
    <text x="132" y="605" font-family="Arial, sans-serif" font-size="34" text-anchor="middle">Person 1</text>
    <!-- Person 1 communication -->
    <line x1="205" y1="423" x2="700" y2="423" stroke="#000" stroke-width="3" marker-end="url(#arrow)"/>
    <text x="450" y="400" font-family="Arial, sans-serif" font-size="34" font-style="italic" text-anchor="middle">communication</text>
    <!-- Person 2 -->
    <rect x="50" y="620" width="145" height="230" fill="none" stroke="#000" stroke-width="3"/>
    <use href="#person" x="122" y="665"/>
    <text x="122" y="905" font-family="Arial, sans-serif" font-size="34" text-anchor="middle">Person 2</text>
    <!-- Person 2 communication -->
    <line x1="195" y1="733" x2="700" y2="733" stroke="#000" stroke-width="3" marker-end="url(#arrow)"/>
    <text x="450" y="710" font-family="Arial, sans-serif" font-size="34" font-style="italic" text-anchor="middle">communication</text>
    <!-- Comm App Mix -->
    <rect x="700" y="285" width="245" height="560" fill="none" stroke="#000" stroke-width="3"/>
    <text x="822" y="520" font-family="Arial, sans-serif" font-size="42" text-anchor="middle">
      <tspan x="822" dy="0">Comm</tspan>
      <tspan x="822" dy="64">App</tspan>
      <tspan x="822" dy="64">Mix</tspan>
    </text>
    <!-- ECF -->
    <rect x="700" y="945" width="245" height="105" fill="none" stroke="#000" stroke-width="3"/>
    <text x="822" y="1010" font-family="Arial, sans-serif" font-size="34" font-weight="bold" text-anchor="middle">ECF</text>
    <!-- ECF -> Comm App Mix -->
    <line x1="822" y1="945" x2="822" y2="850" stroke="#000" stroke-width="3" marker-end="url(#arrow)"/>
    <!-- Comm App Mix -> Communication Function -->
    <line x1="945" y1="565" x2="1160" y2="565" stroke="#000" stroke-width="3" marker-end="url(#arrow)"/>
    <!-- Communication Function -->
    <rect x="1160" y="455" width="435" height="210" fill="#07B64A" stroke="#000" stroke-width="3"/>
    <text x="1378" y="550" font-family="Arial, sans-serif" font-size="42" fill="#fff" text-anchor="middle">Communication</text>
    <text x="1378" y="605" font-family="Arial, sans-serif" font-size="42" fill="#fff" text-anchor="middle">Function</text>
  </svg>
</div>
<p>Which has resulted to an error free function</p>
`;
const INFO_10_MATH = `
<p>When multiple people are working on a project, with errors in communication, we have</p>
<div style="${EQ_STYLE}">\\[ f(\\bar{x}) = -A\\bigl(P_1 + P_2 + P_3 + \\cdots\\bigr)x \\]</div>
<p>Where the errors are corrected using the error correction function</p>
<div style="${EQ_STYLE}">\\[ f(x) = \\bigl[f(\\bar{x})\\bigr]\\bigl[ECF(x)\\bigr] \\]</div>
<p>Which has resulted to an error free function</p>
`;

// ── #11: Philosophy Inheritance and System Stability Information ───────────────────────────────────────────────
const INFO_11_NONMATH = `
<p>The stability of the physical system is an average function, where for multiple systems execute functions negatively and multiple systems execute function positively, we have the following model</p>
<div style="${EQ_STYLE}">
  <svg viewBox="0 0 960 180" xmlns="http://www.w3.org/2000/svg" width="960">
    <!-- Left panel: philosophy -->
    <rect x="20" y="20" width="360" height="145" rx="5" fill="white" stroke="#888" stroke-width="1.5"/>
    <text x="210" y="42" text-anchor="middle" font-size="13" font-weight="700" fill="#c0392b">Systems depend on philosophy</text>
    <!-- 3 stick figures red -->
    <g fill="none" stroke="#555" stroke-width="1.5">
      <circle cx="65"  cy="75" r="11"/>
      <line x1="65"  y1="86" x2="65"  y2="108"/>
      <line x1="50"  y1="94" x2="80"  y2="94"/>
      <line x1="65"  y1="108" x2="52" y2="124"/>
      <line x1="65"  y1="108" x2="78" y2="124"/>
      <circle cx="130" cy="75" r="11"/>
      <line x1="130" y1="86" x2="130" y2="108"/>
      <line x1="115" y1="94" x2="145" y2="94"/>
      <line x1="130" y1="108" x2="117" y2="124"/>
      <line x1="130" y1="108" x2="143" y2="124"/>
      <circle cx="195" cy="75" r="11"/>
      <line x1="195" y1="86" x2="195" y2="108"/>
      <line x1="180" y1="94" x2="210" y2="94"/>
      <line x1="195" y1="108" x2="182" y2="124"/>
      <line x1="195" y1="108" x2="208" y2="124"/>
    </g>
    <!-- Philosophy ellipse -->
    <ellipse cx="290" cy="100" rx="70" ry="18" fill="#c0392b" opacity="0.85"/>
    <text x="290" y="105" text-anchor="middle" font-size="13" fill="white" font-weight="600">philosophy</text>
    <text x="140" y="150" text-anchor="middle" font-size="11" fill="#555">Systems</text>
    <!-- Right panel: theory -->
    <rect x="400" y="20" width="360" height="145" rx="5" fill="white" stroke="#888" stroke-width="1.5"/>
    <text x="580" y="42" text-anchor="middle" font-size="13" font-weight="700" fill="#2a7a3a">Systems depend on theory</text>
    <g fill="none" stroke="#555" stroke-width="1.5">
      <circle cx="445" cy="75" r="11"/>
      <line x1="445" y1="86" x2="445" y2="108"/>
      <line x1="430" y1="94" x2="460" y2="94"/>
      <line x1="445" y1="108" x2="432" y2="124"/>
      <line x1="445" y1="108" x2="458" y2="124"/>
      <circle cx="510" cy="75" r="11"/>
      <line x1="510" y1="86" x2="510" y2="108"/>
      <line x1="495" y1="94" x2="525" y2="94"/>
      <line x1="510" y1="108" x2="497" y2="124"/>
      <line x1="510" y1="108" x2="523" y2="124"/>
      <circle cx="575" cy="75" r="11"/>
      <line x1="575" y1="86" x2="575" y2="108"/>
      <line x1="560" y1="94" x2="590" y2="94"/>
      <line x1="575" y1="108" x2="562" y2="124"/>
      <line x1="575" y1="108" x2="588" y2="124"/>
    </g>
    <!-- Theory box -->
    <rect x="630" y="90" width="84" height="28" rx="4" style="fill:#2a7a3a;"/>
    <text x="670" y="108" text-anchor="middle" font-size="13" fill="white" font-weight="600">Theory</text>
    <text x="520" y="150" text-anchor="middle" font-size="11" fill="#555">Systems</text>
  </svg>
</div>
<p>Where the systems that depend on theory must help the ones that depend on philosophy in order to help the function execute positively or help the functionality of the overall system.</p>
`;
const INFO_11_MATH = `
<p>The stability function of the physical system is an average function, where for <span style="font-family:'Times New Roman',Times,serif;font-style:italic;">M</span> execute functions negatively and <span style="font-family:'Times New Roman',Times,serif;font-style:italic;">L</span> systems execute functions positively, we have</p>
<div style="${EQ_STYLE}">\\[ S(xy) = S_M(xy) + S_L(x) \\]</div>
<p>Where </p>
<div style="${EQ_STYLE}">\\[ L \\geq 1 \\text{ and } M = \\lambda L \\]</div>
`;

// ── #12: Separation of Entity and Information About Entity ───────────────────────────────────────────────
const INFO_12_NONMATH = `
<p>Let’s a given collection of entities</p>
<div style="${EQ_STYLE}">
  <svg class="diagram" viewBox="0 0 640 110" xmlns="http://www.w3.org/2000/svg" width="640">
    <!-- Collection of Entities -->
    <text x="320" y="22" text-anchor="middle" font-size="14" font-weight="700">Collection of Entities</text>
    <rect x="20" y="28" width="600" height="62" rx="4" fill="white" stroke="#555" stroke-width="1.5"/>
    <rect x="36"  y="38" width="115" height="42" rx="3" fill="white" stroke="#aaa" stroke-width="1"/>
    <text x="93"  y="63" text-anchor="middle" font-size="13">Entity 1</text>
    <rect x="168" y="38" width="115" height="42" rx="3" fill="white" stroke="#aaa" stroke-width="1"/>
    <text x="225" y="63" text-anchor="middle" font-size="13">Entity 2</text>
    <rect x="300" y="38" width="115" height="42" rx="3" fill="white" stroke="#aaa" stroke-width="1"/>
    <text x="357" y="63" text-anchor="middle" font-size="13">Entity 3</text>
    <circle cx="458" cy="59" r="4" fill="#888"/>
    <circle cx="472" cy="59" r="4" fill="#888"/>
    <circle cx="486" cy="59" r="4" fill="#888"/>
  </svg>
</div>

<p>With corresponding collection of information</p>
<div style="${EQ_STYLE}">
  <svg class="diagram" viewBox="0 0 640 110" xmlns="http://www.w3.org/2000/svg" width="640">
    <!-- Collection of Information -->
    <text x="320" y="18" text-anchor="middle" font-size="14" font-weight="700">Collection of Information</text>
    <rect x="20" y="24" width="600" height="62" rx="4" fill="white" stroke="#555" stroke-width="1.5"/>
    <rect x="36"  y="34" width="115" height="42" rx="3" fill="#eef8ee" stroke="#3a6b4a" stroke-width="1"/>
    <text x="93"  y="54" text-anchor="middle" font-size="11">Information</text>
    <text x="93"  y="69" text-anchor="middle" font-size="11">of Entity 1</text>
    <rect x="168" y="34" width="115" height="42" rx="3" fill="#eef8ee" stroke="#3a6b4a" stroke-width="1"/>
    <text x="225" y="54" text-anchor="middle" font-size="11">Information</text>
    <text x="225" y="69" text-anchor="middle" font-size="11">of Entity 2</text>
    <rect x="300" y="34" width="115" height="42" rx="3" fill="#eef8ee" stroke="#3a6b4a" stroke-width="1"/>
    <text x="357" y="54" text-anchor="middle" font-size="11">Information</text>
    <text x="357" y="69" text-anchor="middle" font-size="11">of Entity 3</text>
    <circle cx="458" cy="55" r="4" fill="#888"/>
    <circle cx="472" cy="55" r="4" fill="#888"/>
    <circle cx="486" cy="55" r="4" fill="#888"/>
  </svg>
</div>

<p>In this case, each information entity in the collection of information belongs to entity in the collection of entities in this form</p>
<div style="${EQ_STYLE}">
  <svg class="diagram" viewBox="0 0 640 330" xmlns="http://www.w3.org/2000/svg" width="640">
    <!-- Collection of Information -->
    <text x="320" y="18" text-anchor="middle" font-size="14" font-weight="700">Collection of Information</text>
    <rect x="20" y="24" width="600" height="62" rx="4" fill="white" stroke="#555" stroke-width="1.5"/>
    <rect x="36"  y="34" width="115" height="42" rx="3" fill="#eef8ee" stroke="#3a6b4a" stroke-width="1"/>
    <text x="93"  y="54" text-anchor="middle" font-size="11">Information</text>
    <text x="93"  y="69" text-anchor="middle" font-size="11">of Entity 1</text>
    <rect x="168" y="34" width="115" height="42" rx="3" fill="#eef8ee" stroke="#3a6b4a" stroke-width="1"/>
    <text x="225" y="54" text-anchor="middle" font-size="11">Information</text>
    <text x="225" y="69" text-anchor="middle" font-size="11">of Entity 2</text>
    <rect x="300" y="34" width="115" height="42" rx="3" fill="#eef8ee" stroke="#3a6b4a" stroke-width="1"/>
    <text x="357" y="54" text-anchor="middle" font-size="11">Information</text>
    <text x="357" y="69" text-anchor="middle" font-size="11">of Entity 3</text>
    <circle cx="458" cy="55" r="4" fill="#888"/>
    <circle cx="472" cy="55" r="4" fill="#888"/>
    <circle cx="486" cy="55" r="4" fill="#888"/>
    <!-- "belong to" arrows -->
    <line x1="93"  y1="86" x2="93"  y2="224" stroke="#555" stroke-width="1.4"/>
    <polygon points="93,224 88,216 98,216" fill="#555"/>
    <text x="130"  y="217" text-anchor="middle" font-size="10" fill="#666">belong to</text>
    <line x1="225" y1="86" x2="225" y2="224" stroke="#555" stroke-width="1.4"/>
    <polygon points="225,224 220,216 230,216" fill="#555"/>
    <text x="260" y="217" text-anchor="middle" font-size="10" fill="#666">belong to</text>
    <line x1="357" y1="86" x2="357" y2="224" stroke="#555" stroke-width="1.4"/>
    <polygon points="357,224 352,216 362,216" fill="#555"/>
    <text x="390" y="217" text-anchor="middle" font-size="10" fill="#666">belong to</text>
    <!-- Entities below -->
    <rect x="20" y="226" width="600" height="62" rx="4" fill="white" stroke="#555" stroke-width="1.5"/>
    <text x="320" y="302" text-anchor="middle" font-size="14" font-weight="700">Collection of Entities</text>
    <rect x="36"  y="236" width="115" height="42" rx="3" fill="white" stroke="#aaa" stroke-width="1"/>
    <text x="93"  y="261" text-anchor="middle" font-size="13">Entity 1</text>
    <rect x="168" y="236" width="115" height="42" rx="3" fill="white" stroke="#aaa" stroke-width="1"/>
    <text x="225" y="261" text-anchor="middle" font-size="13">Entity 2</text>
    <rect x="300" y="236" width="115" height="42" rx="3" fill="white" stroke="#aaa" stroke-width="1"/>
    <text x="357" y="261" text-anchor="middle" font-size="13">Entity 3</text>
    <circle cx="458" cy="257" r="4" fill="#888"/>
    <circle cx="472" cy="257" r="4" fill="#888"/>
    <circle cx="486" cy="257" r="4" fill="#888"/>
  </svg>
</div>
`;
const INFO_12_MATH = `
<p>Let’s a given collection of entities</p>
<div style="${EQ_STYLE}">\\[ C(E) = \\{E_1, E_2, E_3, \\cdots\\} \\]</div>

<p>With corresponding given collection of information</p>
<div style="${EQ_STYLE}">\\[ C(i_E) = \\{i_{E_1}, i_{E_2}, i_{E_3}, \\cdots\\} \\]</div>

<p>In this case, each information entity in the collection of information belongs to the entity in the given collection of entities in this form</p>
<div style="${EQ_STYLE}">\\begin{align*}
i_{E_1} &\\in E_1 \\\\
i_{E_2} &\\in E_2 \\\\
i_{E_3} &\\in E_3 \\\\
&\\vdots
\\end{align*}</div>
`;

// ── #13: Given Information and Identified Information Relationship ───────────────────────────────────────────────
const INFO_13_NONMATH = `
<p>In terms of identified information, let's a given collection of entities</p>
<div style="${EQ_STYLE}">
  <svg viewBox="0 0 500 80" xmlns="http://www.w3.org/2000/svg" width="100%">
    <text x="250" y="16" text-anchor="middle" font-size="13" font-weight="700" font-family="Inter, sans-serif">Collection of Entities</text>
    <rect x="10" y="22" width="480" height="50" rx="4" fill="white" stroke="#555" stroke-width="1.5"/>
    <rect x="24" y="30" width="100" height="34" rx="3" fill="white" stroke="#aaa" stroke-width="1"/>
    <text x="74" y="52" text-anchor="middle" font-size="12" font-family="Inter, sans-serif">Entity 1</text>
    <rect x="140" y="30" width="100" height="34" rx="3" fill="white" stroke="#aaa" stroke-width="1"/>
    <text x="190" y="52" text-anchor="middle" font-size="12" font-family="Inter, sans-serif">Entity 2</text>
    <rect x="256" y="30" width="100" height="34" rx="3" fill="white" stroke="#aaa" stroke-width="1"/>
    <text x="306" y="52" text-anchor="middle" font-size="12" font-family="Inter, sans-serif">Entity 3</text>
    <circle cx="390" cy="47" r="4" fill="#888"/>
    <circle cx="404" cy="47" r="4" fill="#888"/>
    <circle cx="418" cy="47" r="4" fill="#888"/>
  </svg>
</div>
<p>With corresponding given collection of information</p>
<div style="${EQ_STYLE}">
  <svg viewBox="0 0 500 80" xmlns="http://www.w3.org/2000/svg" width="100%">
    <text x="250" y="16" text-anchor="middle" font-size="13" font-weight="700" font-family="Inter, sans-serif">Collection of Information</text>
    <rect x="10" y="22" width="480" height="50" rx="4" fill="white" stroke="#555" stroke-width="1.5"/>
    <rect x="24" y="30" width="100" height="34" rx="3" fill="#eef8ee" stroke="#3a6b4a" stroke-width="1"/>
    <text x="74" y="44" text-anchor="middle" font-size="10" font-family="Inter, sans-serif">Information</text>
    <text x="74" y="57" text-anchor="middle" font-size="10" font-family="Inter, sans-serif">of Entity 1</text>
    <rect x="140" y="30" width="100" height="34" rx="3" fill="#eef8ee" stroke="#3a6b4a" stroke-width="1"/>
    <text x="190" y="44" text-anchor="middle" font-size="10" font-family="Inter, sans-serif">Information</text>
    <text x="190" y="57" text-anchor="middle" font-size="10" font-family="Inter, sans-serif">of Entity 2</text>
    <rect x="256" y="30" width="100" height="34" rx="3" fill="#eef8ee" stroke="#3a6b4a" stroke-width="1"/>
    <text x="306" y="44" text-anchor="middle" font-size="10" font-family="Inter, sans-serif">Information</text>
    <text x="306" y="57" text-anchor="middle" font-size="10" font-family="Inter, sans-serif">of Entity 3</text>
    <circle cx="390" cy="47" r="4" fill="#888"/>
    <circle cx="404" cy="47" r="4" fill="#888"/>
    <circle cx="418" cy="47" r="4" fill="#888"/>
  </svg>
</div>
<p>In terms of given information about Entity 1, we have</p>
<div style="${EQ_STYLE}">
  <svg viewBox="0 0 440 60" xmlns="http://www.w3.org/2000/svg" width="100%">
    <rect x="10" y="10" width="150" height="40" rx="3" fill="white" stroke="#555" stroke-width="1.5"/>
    <text x="85" y="28" text-anchor="middle" font-size="11" font-family="Inter, sans-serif">Information</text>
    <text x="85" y="43" text-anchor="middle" font-size="11" font-family="Inter, sans-serif">of Entity 1</text>
    <line x1="160" y1="30" x2="255" y2="30" stroke="#555" stroke-width="1.4"/>
    <polygon points="255,30 246,25 246,35" fill="#555"/>
    <text x="207" y="24" text-anchor="middle" font-size="10" fill="#666" font-family="Inter, sans-serif">point to</text>
    <rect x="260" y="10" width="150" height="40" rx="3" fill="white" stroke="#555" stroke-width="1.5"/>
    <text x="335" y="35" text-anchor="middle" font-size="11" font-family="Inter, sans-serif">Entity 1</text>
  </svg>
</div>
<p>In terms of identified information, we have</p>
<div style="${EQ_STYLE}">
  <svg viewBox="0 0 440 60" xmlns="http://www.w3.org/2000/svg" width="100%">
    <rect x="10" y="10" width="170" height="40" rx="3" fill="white" stroke="#555" stroke-width="1.5"/>
    <text x="95" y="28" text-anchor="middle" font-size="11" font-family="Inter, sans-serif">Identified Information</text>
    <text x="95" y="43" text-anchor="middle" font-size="11" font-family="Inter, sans-serif">of Entity 1</text>
    <line x1="180" y1="30" x2="255" y2="30" stroke="#555" stroke-width="1.4"/>
    <polygon points="255,30 246,25 246,35" fill="#555"/>
    <text x="217" y="24" text-anchor="middle" font-size="10" fill="#666" font-family="Inter, sans-serif">match</text>
    <rect x="260" y="10" width="150" height="40" rx="3" fill="white" stroke="#555" stroke-width="1.5"/>
    <text x="335" y="28" text-anchor="middle" font-size="11" font-family="Inter, sans-serif">Information</text>
    <text x="335" y="43" text-anchor="middle" font-size="11" font-family="Inter, sans-serif">of Entity 1</text>
  </svg>
</div>
<p>From above, the identified information is information identified by people or by a person.</p>
`;
const INFO_13_MATH = `
<p>In terms of identified information, let's a given collection of entities</p>
<div style="${EQ_STYLE}">\\( C(E) = \\left\\{ E_1, E_2, E_3, \\cdots \\right\\} \\)</div>
<p>With corresponding given collection of information</p>
<div style="${EQ_STYLE}">\\( C(i_E) = \\left\\{ i_{E_1}, i_{E_2}, i_{E_3}, \\cdots \\right\\} \\)</div>
<p>In terms of given information, we have \\( i_{E_1} \\xrightarrow{\\textit{point to}} E_1 \\) where in terms of identified information, we have \\( \\hat{i}_{E_1} \\xrightarrow{\\textit{match}} i_{E_1} \\), where \\( \\hat{i}_{E_1} \\) is identified information about \\( E_1 \\).</p>
`;

// ── #14: Complexity Theorem Information ───────────────────────────────────────────────
const INFO_14_NONMATH = `
<p>The complexity theorem is given as: <em>If we increase the complexity of the added function, the complexity of the existing functions would also increase tremendously.</em> This model is shown just that</p>
<div style="${EQ_STYLE}">
  <svg viewBox="0 0 500 200" xmlns="http://www.w3.org/2000/svg" width="100%">
    <!-- Header row -->
    <line x1="250" y1="0" x2="250" y2="200" stroke="#555" stroke-width="1.5"/>
    <line x1="0" y1="30" x2="500" y2="30" stroke="#555" stroke-width="1.5"/>
    <text x="125" y="20" text-anchor="middle" font-size="14" font-weight="700" font-family="Inter, sans-serif">Before</text>
    <text x="375" y="20" text-anchor="middle" font-size="14" font-weight="700" font-family="Inter, sans-serif">After</text>

    <!-- Before: aFunction 1 -->
    <rect x="20" y="44" width="110" height="30" rx="3" fill="white" stroke="#555" stroke-width="1.5"/>
    <text x="75" y="64" text-anchor="middle" font-size="12" font-family="Inter, sans-serif">aFunction 1</text>

    <!-- Before: eFunction 1 -->
    <rect x="20" y="90" width="110" height="30" rx="3" fill="white" stroke="#555" stroke-width="1.5"/>
    <text x="75" y="110" text-anchor="middle" font-size="12" font-family="Inter, sans-serif">eFunction 1</text>

    <!-- After: grid of aFunction / eFunction pairs -->
    <!-- Row 1 -->
    <rect x="262" y="44" width="100" height="26" rx="2" fill="white" stroke="#555" stroke-width="1"/>
    <text x="312" y="62" text-anchor="middle" font-size="11" font-family="Inter, sans-serif">aFunction 1</text>
    <rect x="368" y="44" width="100" height="26" rx="2" fill="white" stroke="#555" stroke-width="1"/>
    <text x="418" y="62" text-anchor="middle" font-size="11" font-family="Inter, sans-serif">eFunction 1</text>
    <!-- Row 2 -->
    <rect x="262" y="76" width="100" height="26" rx="2" fill="white" stroke="#555" stroke-width="1"/>
    <text x="312" y="94" text-anchor="middle" font-size="11" font-family="Inter, sans-serif">aFunction 2</text>
    <rect x="368" y="76" width="100" height="26" rx="2" fill="white" stroke="#555" stroke-width="1"/>
    <text x="418" y="94" text-anchor="middle" font-size="11" font-family="Inter, sans-serif">eFunction 2</text>
    <!-- Row 3 -->
    <rect x="262" y="108" width="100" height="26" rx="2" fill="white" stroke="#555" stroke-width="1"/>
    <text x="312" y="126" text-anchor="middle" font-size="11" font-family="Inter, sans-serif">aFunction 3</text>
    <rect x="368" y="108" width="100" height="26" rx="2" fill="white" stroke="#555" stroke-width="1"/>
    <text x="418" y="126" text-anchor="middle" font-size="11" font-family="Inter, sans-serif">eFunction 3</text>
    <!-- Dots -->
    <circle cx="312" cy="150" r="3" fill="#888"/>
    <circle cx="312" cy="162" r="3" fill="#888"/>
    <circle cx="312" cy="174" r="3" fill="#888"/>
    <circle cx="418" cy="150" r="3" fill="#888"/>
    <circle cx="418" cy="162" r="3" fill="#888"/>
    <circle cx="418" cy="174" r="3" fill="#888"/>
  </svg>
</div>
<p>From above to the left, aFunction 1 is an added function where the complexity of that function is increased and shown to the right. By not increasing the complexity of the added functions, that helps both the functional system and the physical system.</p>
`;
const INFO_14_MATH = `
<p>The complexity theorem is given as</p>
<div style="${EQ_STYLE}">
  \\( \\textit{if} \\quad C\\!\\left[u(t)\\right] = \\alpha^N \\quad \\textit{then} \\quad C\\!\\left[h(t)\\right] = M\\alpha^{MN} \\)
</div>
<p>From the complexity theorem, we can see that if we increase the complexity of the added functions, then the complexity of the existing functions increases tremendously. By not increasing the complexity of the added functions, that helps both the functional system and the physical system.</p>
`;

// ── #15: Function Structure Information ───────────────────────────────────────────────
const INFO_15_NONMATH = `
<p>A problem is identified such as</p>
<div style="${EQ_STYLE}">
  <svg viewBox="0 0 200 44" xmlns="http://www.w3.org/2000/svg" width="200">
    <rect x="0" y="0" width="160" height="44" rx="6" fill="#c0392b"/>
    <text x="80" y="28" text-anchor="middle" font-size="14" font-weight="700" fill="white" font-family="Inter, sans-serif">Problem 1</text>
  </svg>
</div>
<p>Where that problem is solved by Function 1 as shown</p>
<div style="${EQ_STYLE}">
  <svg viewBox="0 0 200 44" xmlns="http://www.w3.org/2000/svg" width="200">
    <rect x="0" y="0" width="160" height="44" rx="6" fill="#2a7a3a"/>
    <text x="80" y="28" text-anchor="middle" font-size="14" font-weight="700" fill="white" font-family="Inter, sans-serif">Function 1</text>
  </svg>
</div>
<p>In this case, Function 1 must have a structure in order to execute to solve the problem. The structure of that function enables that function to be executed to substitute the problem by its solution. The structure of a function is a collection of information given with a function that enables that function to execute to solve the problem. Let's a function is identified as Entity 1 as shown by this model.</p>
<div style="${EQ_STYLE}">
  <svg viewBox="0 0 300 60" xmlns="http://www.w3.org/2000/svg" width="300">
    <rect x="0" y="8" width="160" height="44" rx="3" fill="white" stroke="#555" stroke-width="1.5"/>
    <text x="80" y="35" text-anchor="middle" font-size="13" font-family="Inter, sans-serif">Entity 1</text>
  </svg>
</div>
<p>Where the structure of that function is identified as <strong>Entity 1, 1</strong>, then we have the following model.</p>
<div style="${EQ_STYLE}">
  <svg viewBox="0 0 300 80" xmlns="http://www.w3.org/2000/svg" width="300">
    <text x="90" y="16" text-anchor="middle" font-size="13" font-weight="700" font-family="Inter, sans-serif">Entity 1</text>
    <rect x="0" y="22" width="180" height="50" rx="3" fill="white" stroke="#555" stroke-width="1.5"/>
    <rect x="14" y="32" width="150" height="32" rx="2" fill="white" stroke="#aaa" stroke-width="1"/>
    <text x="89" y="53" text-anchor="middle" font-size="12" font-family="Inter, sans-serif">Entity 1, 1</text>
  </svg>
</div>
<p>Where the structure information of the structure entity is given as shown by this model. In other words, the structure information which belongs to the structure entity of the function.</p>
<div style="${EQ_STYLE}">
  <svg viewBox="0 0 300 80" xmlns="http://www.w3.org/2000/svg" width="300">
    <rect x="0" y="8" width="230" height="60" rx="3" fill="white" stroke="#555" stroke-width="1.5"/>
    <text x="115" y="32" text-anchor="middle" font-size="11" font-family="Inter, sans-serif">Structure Information</text>
    <text x="115" y="52" text-anchor="middle" font-size="11" font-family="Inter, sans-serif">Of Entity 1, 1</text>
  </svg>
</div>
<p>From above, the structure information includes a lot of information that makes up the function structure as shown. In other words, the structure information is made of collection of information about the function structure.</p>
<p><strong>Structure Information of Function 1</strong></p>
<div style="${EQ_STYLE}">
  <svg viewBox="0 0 500 80" xmlns="http://www.w3.org/2000/svg" width="100%">
    <rect x="10" y="8" width="480" height="62" rx="4" fill="white" stroke="#555" stroke-width="1.5"/>
    <rect x="24" y="18" width="110" height="42" rx="3" fill="white" stroke="#aaa" stroke-width="1"/>
    <text x="79" y="36" text-anchor="middle" font-size="11" font-family="Inter, sans-serif">Information</text>
    <text x="79" y="51" text-anchor="middle" font-size="11" font-family="Inter, sans-serif">1</text>
    <rect x="152" y="18" width="110" height="42" rx="3" fill="white" stroke="#aaa" stroke-width="1"/>
    <text x="207" y="36" text-anchor="middle" font-size="11" font-family="Inter, sans-serif">Information</text>
    <text x="207" y="51" text-anchor="middle" font-size="11" font-family="Inter, sans-serif">2</text>
    <rect x="280" y="18" width="110" height="42" rx="3" fill="white" stroke="#aaa" stroke-width="1"/>
    <text x="335" y="36" text-anchor="middle" font-size="11" font-family="Inter, sans-serif">Information</text>
    <text x="335" y="51" text-anchor="middle" font-size="11" font-family="Inter, sans-serif">3</text>
    <circle cx="415" cy="39" r="4" fill="#888"/>
    <circle cx="430" cy="39" r="4" fill="#888"/>
    <circle cx="445" cy="39" r="4" fill="#888"/>
  </svg>
</div>
<p>From above, the structure information of Function 1 which is viewed as a collection of information, where each information entity in the collection provides specific information about the structure of that function.</p>
`;
const INFO_15_MATH = `
<p>A problem is identified such as</p>
<div style="${EQ_STYLE}">\\( Pr_1 = 1 \\)</div>
<p>Where that problem is solved by function \\( f(x) \\) or \\( u(t) \\), then function \\( f(x) \\) or \\( u(t) \\) must have a structure in order to execute to solve that problem. In this case, the structure of that function enables that function to be executed to solve the problem or set \\( Pr_1 = 0 \\).</p>
<p>The structure of a function is collection of information given with a function that enables that function to execute to solve the problem. Let's a function be \\( E_1 \\), where the structure of that function is \\( E_{1,1} \\). In this case, \\( i_{E_{1,1}} \\) is the structure information of \\( E_{1,1} \\). Where \\( i_{E_{1,1}} \\) includes a lot of information that makes up the structure of the function.</p>
`;

// ── #16: Problem Solution Information ───────────────────────────────────────
const INFO_16_NONMATH = `
<p>A problem is identified in this form</p>
<div style="${EQ_STYLE}">
  <svg viewBox="0 0 200 44" xmlns="http://www.w3.org/2000/svg" width="200">
    <rect x="0" y="0" width="160" height="44" rx="0" fill="#f10000"/>
    <text x="80" y="28" text-anchor="middle" font-size="14" font-weight="700" fill="white" font-family="Inter, sans-serif">Problem 1</text>
  </svg>
</div>
<p>To solve the problem, a function is executed in this form</p>
<div style="${EQ_STYLE}">
  <svg viewBox="0 0 200 44" xmlns="http://www.w3.org/2000/svg" width="200">
    <rect x="0" y="0" width="160" height="44" rx="0" fill="#2a7a3a"/>
    <text x="80" y="28" text-anchor="middle" font-size="14" font-weight="700" fill="white" font-family="Inter, sans-serif">Function 1</text>
  </svg>
</div>
<p>The execution of the function enables the problem to be replaced by its solution</p>
<div style="${EQ_STYLE}">
  <svg viewBox="0 0 200 44" xmlns="http://www.w3.org/2000/svg" width="200">
    <rect x="0" y="0" width="160" height="44" rx="0" fill="#2a7a3a"/>
    <text x="80" y="28" text-anchor="middle" font-size="14" font-weight="700" fill="white" font-family="Inter, sans-serif">Solution 1</text>
  </svg>
</div>
<p>By executing additional negative functions</p>
<div style="${EQ_STYLE}">
  <svg viewBox="0 0 500 90" xmlns="http://www.w3.org/2000/svg" width="100%">
    <text x="250" y="16" text-anchor="middle" font-size="13" font-weight="700" font-family="Inter, sans-serif">Negative Function 1</text>
    <rect x="10" y="22" width="480" height="60" rx="0" fill="white" stroke="#555" stroke-width="1.5"/>
    <rect x="22" y="32" width="130" height="44" rx="0" fill="#f10000"/>
    <text x="87" y="49" text-anchor="middle" font-size="10" font-weight="700" fill="white" font-family="Inter, sans-serif">Negative</text>
    <text x="87" y="63" text-anchor="middle" font-size="10" font-weight="700" fill="white" font-family="Inter, sans-serif">Function 1, 1</text>
    <rect x="164" y="32" width="130" height="44" rx="0" fill="#f10000"/>
    <text x="229" y="49" text-anchor="middle" font-size="10" font-weight="700" fill="white" font-family="Inter, sans-serif">Negative</text>
    <text x="229" y="63" text-anchor="middle" font-size="10" font-weight="700" fill="white" font-family="Inter, sans-serif">Function 1, 2</text>
    <rect x="306" y="32" width="130" height="44" rx="0" fill="#f10000"/>
    <text x="371" y="49" text-anchor="middle" font-size="10" font-weight="700" fill="white" font-family="Inter, sans-serif">Negative</text>
    <text x="371" y="63" text-anchor="middle" font-size="10" font-weight="700" fill="white" font-family="Inter, sans-serif">Function 1, 3</text>
    <circle cx="452" cy="52" r="4" fill="#888"/>
    <circle cx="464" cy="52" r="4" fill="#888"/>
    <circle cx="476" cy="52" r="4" fill="#888"/>
  </svg>
</div>
<p>The problem is simply expanded in this form</p>
<div style="${EQ_STYLE}">
  <svg viewBox="0 0 500 90" xmlns="http://www.w3.org/2000/svg" width="100%">
    <text x="250" y="16" text-anchor="middle" font-size="13" font-weight="700" font-family="Inter, sans-serif">Problem 1</text>
    <rect x="10" y="22" width="480" height="60" rx="0" fill="white" stroke="#555" stroke-width="1.5"/>
    <rect x="22" y="32" width="120" height="44" rx="0" fill="#f10000"/>
    <text x="82" y="57" text-anchor="middle" font-size="11" font-weight="700" fill="white" font-family="Inter, sans-serif">Problem 1,1</text>
    <rect x="154" y="32" width="120" height="44" rx="0" fill="#f10000"/>
    <text x="214" y="57" text-anchor="middle" font-size="11" font-weight="700" fill="white" font-family="Inter, sans-serif">Problem 1,2</text>
    <rect x="286" y="32" width="120" height="44" rx="0" fill="#f10000"/>
    <text x="346" y="57" text-anchor="middle" font-size="11" font-weight="700" fill="white" font-family="Inter, sans-serif">Problem 1,3</text>
    <circle cx="430" cy="52" r="4" fill="#888"/>
    <circle cx="444" cy="52" r="4" fill="#888"/>
    <circle cx="458" cy="52" r="4" fill="#888"/>
  </svg>
</div>
<p>Where more effort is needed in order to solve the problem.</p>
`;
const INFO_16_MATH = `
<p>A problem is identified such as</p>
<div style="${EQ_STYLE}">\\( Pr_1 = 1 \\)</div>
<p>The solution to that problem is given as</p>
<div style="${EQ_STYLE}">\\( \\textit{if} \\; u_1(t) = 1 \\; \\textit{then} \\; Pr_1 = 0 \\)</div>
<p>Where \\( u_1(t) \\) is executed at its basis in order to set \\( Pr_1 = 0 \\). In this case, additional negative functions executed in the form below do not solve the problem but rather develop additional problems.</p>
<div style="${EQ_STYLE}">\\( \\bar{u}_1(t) = \\sum_{n=1}^{N} \\bar{u}_{1,n}(t) \\)</div>
<p>Where \\( N \\) is additional negative functions. Which produces more problems in the form of</p>
<div style="${EQ_STYLE}">\\( Pr_1 = \\sum_{n=1}^{N} Pr_{1,n} \\)</div>
`;

// ── #17: Given Solution Information ───────────────────────────────────────────────
const INFO_17_NONMATH = `
<p>The solution of a problem is given by the following equation</p>
<div style="${EQ_STYLE}">
  <svg viewBox="0 0 400 50" xmlns="http://www.w3.org/2000/svg" width="400">
    <text x="10" y="34" font-size="20" font-style="italic" font-family="Times New Roman, serif" fill="#1a1a1a">Available + Given = Solution</text>
  </svg>
</div>
<p>Where <em>Available</em> is the entity available to help us solve the problem. <em>Given</em> is the entity given that tells us how to use the entity available which results to the solution of the problem. The entity available can be a list of entities.</p>
`;
const INFO_17_MATH = `
<p>Let's identify a problem such as</p>
<div style="${EQ_STYLE}">\\( Pr_1 = 1 \\)</div>
<p>The solution of that problem is given by the following equation</p>
<div style="${EQ_STYLE}">\\( Ava + Giv = Sol \\)</div>
<p>Where \\( Ava \\) is the entity available to us to help us solve the problem and \\( Giv \\) is the entity given to us such as theory \\( T = U_T \\) that tells us how to use the entity available \\( Ava \\) which produces the solution. The entity available \\( Ava \\) can be a list of entities such as:</p>
<div style="${EQ_STYLE}">\\( Ava = \\left\\{ Ava_1, Ava_2, Ava_3, \\cdots \\right\\} \\)</div>
`;

// ── #18: Function Location Information ───────────────────────────────────────
const INFO_18_NONMATH = `
<p>At 2 or more locations, people are identified as well as functions that belong to them, where the functions that belong to them are executed by them to solve problems at their respective locations as shown by this model.</p>
<div style="${EQ_STYLE}">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2000 560" width="800" height="auto">
    <defs>
      <!-- Person -->
      <g id="person">
        <circle cx="0" cy="0" r="35" fill="none" stroke="#000" stroke-width="2"/>
        <circle cx="-12" cy="-10" r="6" fill="#000"/>
        <circle cx="12" cy="-10" r="6" fill="#000"/>
        <ellipse cx="0" cy="18" rx="12" ry="6" fill="none" stroke="#000" stroke-width="1"/>
        <line x1="0" y1="35" x2="0" y2="110" stroke="#000" stroke-width="2"/>
        <line x1="-48" y1="65" x2="48" y2="65" stroke="#000" stroke-width="2"/>
        <line x1="0" y1="110" x2="-48" y2="175" stroke="#000" stroke-width="2"/>
        <line x1="0" y1="110" x2="48" y2="175" stroke="#000" stroke-width="2"/>
      </g>
    </defs>

    <!-- ================= LEFT HOUSE ================= -->
    <polygon points="30,260 220,70 410,260"
             fill="none"
             stroke="#000"
             stroke-width="2"/>
    <rect x="90"
          y="260"
          width="255"
          height="190"
          fill="none"
          stroke="#000"
          stroke-width="2"/>
    <!-- Door -->
    <rect x="187"
          y="290"
          width="65"
          height="125"
          fill="none"
          stroke="#000"
          stroke-width="2"/>
    <!-- Brick Base -->
    <rect x="90"
          y="415"
          width="255"
          height="30"
          fill="none"
          stroke="#000"
          stroke-width="2"/>
    <!-- Brick pattern -->
    <g stroke="#000" stroke-width="2">
      <line x1="90" y1="425" x2="345" y2="425"/>
      <line x1="90" y1="435" x2="345" y2="435"/>
      <line x1="105" y1="415" x2="105" y2="445"/>
      <line x1="135" y1="415" x2="135" y2="445"/>
      <line x1="165" y1="415" x2="165" y2="445"/>
      <line x1="195" y1="415" x2="195" y2="445"/>
      <line x1="225" y1="415" x2="225" y2="445"/>
      <line x1="255" y1="415" x2="255" y2="445"/>
      <line x1="285" y1="415" x2="285" y2="445"/>
      <line x1="315" y1="415" x2="315" y2="445"/>
    </g>
    <text x="217"
          y="495"
          font-family="Arial, sans-serif"
          font-size="42"
          font-weight="bold"
          text-anchor="middle">
      Location 1
    </text>

    <!-- ================= FUNCTION 1 ================= -->
    <rect x="355"
          y="30"
          width="245"
          height="125"
          fill="#07B64A"
          stroke="#000"
          stroke-width="3"/>
    <text x="477"
          y="108"
          fill="#fff"
          font-family="Arial, sans-serif"
          font-size="42"
          font-weight="bold"
          text-anchor="middle">
      Function 1
    </text>

    <!-- ================= PROBLEM 1 ================= -->
    <rect x="660"
          y="30"
          width="245"
          height="125"
          fill="#ff1f0f"
          stroke="#000"
          stroke-width="3"/>
    <text x="782"
          y="108"
          fill="#fff"
          font-family="Arial, sans-serif"
          font-size="42"
          font-weight="bold"
          text-anchor="middle">
      Problem 1
    </text>

    <!-- ================= PEOPLE 1-3 ================= -->
    <use href="#person" x="480" y="205"/>
    <text x="480" y="430"
          font-family="Arial,sans-serif"
          font-size="38"
          text-anchor="middle">
      Person 1
    </text>
    <use href="#person" x="670" y="205"/>
    <text x="670" y="430"
          font-family="Arial,sans-serif"
          font-size="38"
          text-anchor="middle">
      Person 2
    </text>
    <use href="#person" x="860" y="205"/>
    <text x="860" y="430"
          font-family="Arial,sans-serif"
          font-size="38"
          text-anchor="middle">
      Person 3
    </text>

    <!-- ================= CENTER DIVIDER ================= -->
    <line x1="980"
          y1="30"
          x2="980"
          y2="545"
          stroke="#000"
          stroke-width="6"
          stroke-linecap="round"
          stroke-dasharray="85 55"/>

    <!-- ================= FUNCTION 2 ================= -->
    <rect x="1045"
          y="30"
          width="245"
          height="125"
          fill="#07B64A"
          stroke="#000"
          stroke-width="3"/>
    <text x="1167"
          y="108"
          fill="#fff"
          font-family="Arial, sans-serif"
          font-size="42"
          font-weight="bold"
          text-anchor="middle">
      Function 2
    </text>

    <!-- ================= PROBLEM 2 ================= -->
    <rect x="1315"
          y="30"
          width="245"
          height="125"
          fill="#ff1f0f"
          stroke="#000"
          stroke-width="3"/>
    <text x="1437"
          y="108"
          fill="#fff"
          font-family="Arial, sans-serif"
          font-size="42"
          font-weight="bold"
          text-anchor="middle">
      Problem 2
    </text>

    <!-- ================= PEOPLE 4-6 ================= -->
    <use href="#person" x="1105" y="205"/>
    <text x="1105" y="430"
          font-family="Arial,sans-serif"
          font-size="38"
          text-anchor="middle">
      Person 4
    </text>
    <use href="#person" x="1295" y="205"/>
    <text x="1295" y="430"
          font-family="Arial,sans-serif"
          font-size="38"
          text-anchor="middle">
      Person 5
    </text>
    <use href="#person" x="1485" y="205"/>
    <text x="1485" y="430"
          font-family="Arial,sans-serif"
          font-size="38"
          text-anchor="middle">
      Person 6
    </text>

    <!-- ================= RIGHT HOUSE ================= -->
    <polygon points="1595,250 1785,60 1975,250"
             fill="none"
             stroke="#000"
             stroke-width="2"/>
    <rect x="1660"
          y="250"
          width="255"
          height="190"
          fill="none"
          stroke="#000"
          stroke-width="2"/>
    <rect x="1757"
          y="280"
          width="65"
          height="125"
          fill="none"
          stroke="#000"
          stroke-width="2"/>
    <rect x="1660"
          y="405"
          width="255"
          height="30"
          fill="none"
          stroke="#000"
          stroke-width="2"/>
    <!-- Brick pattern -->
    <g stroke="#000" stroke-width="2">
      <line x1="1660" y1="415" x2="1915" y2="415"/>
      <line x1="1660" y1="425" x2="1915" y2="425"/>
      <line x1="1675" y1="405" x2="1675" y2="435"/>
      <line x1="1705" y1="405" x2="1705" y2="435"/>
      <line x1="1735" y1="405" x2="1735" y2="435"/>
      <line x1="1765" y1="405" x2="1765" y2="435"/>
      <line x1="1795" y1="405" x2="1795" y2="435"/>
      <line x1="1825" y1="405" x2="1825" y2="435"/>
      <line x1="1855" y1="405" x2="1855" y2="435"/>
      <line x1="1885" y1="405" x2="1885" y2="435"/>
    </g>
    <text x="1788"
          y="490"
          font-family="Arial, sans-serif"
          font-size="42"
          font-weight="bold"
          text-anchor="middle">
      Location 2
    </text>
  </svg>
</div>
<p>From the model, people at Location 1 are identified where Function 1 belongs to them and people at Location 2 are identified, where Function 2 belongs to them. In this case, Function 1 is executed by People at Location 1 to solve Problem 1 and Function 2 is executed by people at Location 2 to solve Problem 2. The separation line is viewed as a distance between the locations or simply distance between people at Location 1 and people at Location 2.</p>
`;
const INFO_18_MATH = `
<p>At 2 or more locations, the following people are identified with their respective functions and problem solved by the functions.</p>
<div style="${EQ_STYLE}">\\( P\\big|_{L_1} = \\sum_{n=1}^{N} P_n \\)</div>
<div style="${EQ_STYLE}">\\( P\\big|_{L_2} = \\sum_{m=1}^{M} P_m \\)</div>
<p>With respective functions</p>
<div style="${EQ_STYLE}">\\( f(x)\\big|_{L_1} \\text{ and } f(v)\\big|_{L_2} \\text{ or simply } u_1(t)\\big|_{L_1} \\text{ and } u_2(t)\\big|_{L_1} \\)</div>
<p>Where at \\( L_1 \\) and at \\( L_2 \\) the following problems are identified</p>
<div style="${EQ_STYLE}">\\( Pr_1\\big|_{L_1} = 1 \\text{ and } Pr_2\\big|_{L_2} = 1 \\)</div>
<p>In order to solve the problems or simply set</p>
<div style="${EQ_STYLE}">\\( Pr_1\\big|_{L_1} = 0 \\text{ and } Pr_2\\big|_{L_2} = 0 \\)</div>
<p>The functions belong to people at their respective locations and executed by them</p>
<div style="${EQ_STYLE}">\\( f(x)\\big|_{L_1} \\in P\\big|_{L_1} \\)</div>
<div style="${EQ_STYLE}">\\( f(v)\\big|_{L_2} \\in P\\big|_{L_2} \\)</div>
`;

// ── #19: Function Basis Information ───────────────────────────────────────────────
const INFO_19_NONMATH = `
<p>A problem is identified such as Problem 1 as shown</p>
<div style="${EQ_STYLE}">
  <svg viewBox="0 0 200 44" xmlns="http://www.w3.org/2000/svg" width="200">
    <rect x="0" y="0" width="160" height="44" rx="6" fill="#c0392b"/>
    <text x="80" y="28" text-anchor="middle" font-size="14" font-weight="700" fill="white" font-family="Inter, sans-serif">Problem 1</text>
  </svg>
</div>
<p>To solve that problem, a function is executed such as Function 1 as shown</p>
<div style="${EQ_STYLE}">
  <svg viewBox="0 0 200 44" xmlns="http://www.w3.org/2000/svg" width="200">
    <rect x="0" y="0" width="160" height="44" rx="6" fill="#2a7a3a"/>
    <text x="80" y="28" text-anchor="middle" font-size="14" font-weight="700" fill="white" font-family="Inter, sans-serif">Function 1</text>
  </svg>
</div>
<p>The function is executed at its basis in order to substitute the problem by its solution. At the end, the solution replaces the problem as shown</p>
<div style="${EQ_STYLE}">
  <svg viewBox="0 0 200 44" xmlns="http://www.w3.org/2000/svg" width="200">
    <rect x="0" y="0" width="160" height="44" rx="6" fill="#2a7a3a"/>
    <text x="80" y="28" text-anchor="middle" font-size="14" font-weight="700" fill="white" font-family="Inter, sans-serif">Solution 1</text>
  </svg>
</div>
<p>With that, we have the following model</p>
<div style="${EQ_STYLE}">
  <svg viewBox="0 0 500 60" xmlns="http://www.w3.org/2000/svg" width="100%">
    <rect x="0" y="8" width="130" height="44" rx="6" fill="#2a7a3a"/>
    <text x="65" y="35" text-anchor="middle" font-size="13" font-weight="700" fill="white" font-family="Inter, sans-serif">Function 1</text>
    <line x1="130" y1="30" x2="185" y2="30" stroke="#555" stroke-width="1.5"/>
    <polygon points="185,30 176,25 176,35" fill="#555"/>
    <text x="157" y="22" text-anchor="middle" font-size="10" fill="#555" font-family="Inter, sans-serif">executed at</text>
    <rect x="190" y="8" width="100" height="44" rx="6" fill="#2a7a3a"/>
    <text x="240" y="35" text-anchor="middle" font-size="13" font-weight="700" fill="white" font-family="Inter, sans-serif">Basis</text>
    <line x1="290" y1="30" x2="340" y2="30" stroke="#555" stroke-width="1.5"/>
    <polygon points="340,30 331,25 331,35" fill="#555"/>
    <text x="315" y="22" text-anchor="middle" font-size="10" fill="#555" font-family="Inter, sans-serif">to solve</text>
    <rect x="345" y="8" width="130" height="44" rx="6" fill="#c0392b"/>
    <text x="410" y="35" text-anchor="middle" font-size="13" font-weight="700" fill="white" font-family="Inter, sans-serif">Problem 1</text>
  </svg>
</div>
<p>The basis of a function is given with that function, and it is related to the formula applied to execute that function. For example, the basis of Function 1 above is related to the given formula applied by a person to execute that function to solve the problem.</p>
`;
const INFO_19_MATH = `
<p>A problem is identified such as</p>
<div style="${EQ_STYLE}">\\( Pr_1 = 1 \\)</div>
<p>In order to solve that problem, a function is executed such as \\( u_1(t) \\) with the following condition</p>
<div style="${EQ_STYLE}">\\( \\textit{if} \\; u_1(t) = 1 \\; \\textit{then} \\; Pr_1 = 0 \\)</div>
<p>In this case, we can see that \\( u_1(t) \\) is executed at its basis to solve the problem. Now, let's \\( u_1(t) \\) is executed in the form of</p>
<div style="${EQ_STYLE}">\\( u_1(t) = k u_1(t) \\)</div>
<p>Then \\( k \\) is viewed as the basis of function \\( u_1(t) \\), where \\( k \\) is related to the understanding of the theory \\( T \\) applied by system \\( S_1 \\) in the form of</p>
<div style="${EQ_STYLE}">\\( S_1 Tr\\{T\\} = k u_1(t) \\)</div>
<p>Here \\( k \\) can be a normalized value like \\( 100 \\), \\( 100\\% \\), or simply \\( 1 \\) as well as fractional value like \\( \\frac{1}{2} \\), \\( \\frac{1}{3} \\), \\( \\frac{1}{8} \\) and so forth.</p>
`;

// Prefixed ids keep these constant items from colliding with DB-backed
// user-identified items (which use positive AUTOINCREMENT ids). Each of the 19
// client "Speak Logic" information concepts ships in two variants — a diagram
// ("Non-math") form and a LaTeX ("Math") form.
export const SPEAK_LOGIC_INFO_ITEMS: InfoItem[] = [
  { id: "sl-system-derivation-diagram", name: "System Derivation Information (Non-math)", html: SYSTEM_DERIVATION_DIAGRAM.trim() },
  { id: "sl-system-derivation-math",    name: "System Derivation Information (Math)",    html: SYSTEM_DERIVATION_MATH.trim() },
  { id: "sl-info-2-nonmath", name: "System Derivation Information Multiple Systems (Non-math)", html: INFO_2_NONMATH.trim() },
  { id: "sl-info-2-math",    name: "System Derivation Information Multiple Systems (Math)",     html: INFO_2_MATH.trim() },
  { id: "sl-info-3-nonmath", name: "System Stability Information (Non-math)", html: INFO_3_NONMATH.trim() },
  { id: "sl-info-3-math",    name: "System Stability Information (Math)",     html: INFO_3_MATH.trim() },
  { id: "sl-info-4-nonmath", name: "Definition of Life Information or Simply Life Equation (Non-math)", html: INFO_4_NONMATH.trim() },
  { id: "sl-info-4-math",    name: "Definition of Life Information or Simply Life Equation (Math)",     html: INFO_4_MATH.trim() },
  { id: "sl-info-5-nonmath", name: "System Apply Theory Information (Non-math)", html: INFO_5_NONMATH.trim() },
  { id: "sl-info-5-math",    name: "System Apply Theory Information (Math)",     html: INFO_5_MATH.trim() },
  { id: "sl-info-6-nonmath", name: "System Input and Output Information (Non-math)", html: INFO_6_NONMATH.trim() },
  { id: "sl-info-6-math",    name: "System Input and Output Information (Math)",     html: INFO_6_MATH.trim() },
  { id: "sl-info-7-nonmath", name: "Functional System Functions Grouping Information (Non-math)", html: INFO_7_NONMATH.trim() },
  { id: "sl-info-7-math",    name: "Functional System Functions Grouping Information (Math)",     html: INFO_7_MATH.trim() },
  { id: "sl-info-8-nonmath", name: "Functional System Location as Function Information (Non-math)", html: INFO_8_NONMATH.trim() },
  { id: "sl-info-8-math",    name: "Functional System Location as Function Information (Math)",     html: INFO_8_MATH.trim() },
  { id: "sl-info-9-nonmath", name: "Communication Function and Result Information (Non-math)", html: INFO_9_NONMATH.trim() },
  { id: "sl-info-9-math",    name: "Communication Function and Result Information (Math)",     html: INFO_9_MATH.trim() },
  { id: "sl-info-10-nonmath", name: "Application Error Correction Function Information (Non-math)", html: INFO_10_NONMATH.trim() },
  { id: "sl-info-10-math",    name: "Application Error Correction Function Information (Math)",     html: INFO_10_MATH.trim() },
  { id: "sl-info-11-nonmath", name: "Philosophy Inheritance and System Stability Information (Non-math)", html: INFO_11_NONMATH.trim() },
  { id: "sl-info-11-math",    name: "Philosophy Inheritance and System Stability Information (Math)",     html: INFO_11_MATH.trim() },
  { id: "sl-info-12-nonmath", name: "Separation of Entity and Information About Entity (Non-math)", html: INFO_12_NONMATH.trim() },
  { id: "sl-info-12-math",    name: "Separation of Entity and Information About Entity (Math)",     html: INFO_12_MATH.trim() },
  { id: "sl-info-13-nonmath", name: "Given Information and Identified Information Relationship (Non-math)", html: INFO_13_NONMATH.trim() },
  { id: "sl-info-13-math",    name: "Given Information and Identified Information Relationship (Math)",     html: INFO_13_MATH.trim() },
  { id: "sl-info-14-nonmath", name: "Complexity Theorem Information (Non-math)", html: INFO_14_NONMATH.trim() },
  { id: "sl-info-14-math",    name: "Complexity Theorem Information (Math)",     html: INFO_14_MATH.trim() },
  { id: "sl-info-15-nonmath", name: "Function Structure Information (Non-math)", html: INFO_15_NONMATH.trim() },
  { id: "sl-info-15-math",    name: "Function Structure Information (Math)",     html: INFO_15_MATH.trim() },
  { id: "sl-info-16-nonmath", name: "Problem Solution Information (Non-math)", html: INFO_16_NONMATH.trim() },
  { id: "sl-info-16-math",    name: "Problem Solution Information (Math)",     html: INFO_16_MATH.trim() },
  { id: "sl-info-17-nonmath", name: "Given Solution Information (Non-math)", html: INFO_17_NONMATH.trim() },
  { id: "sl-info-17-math",    name: "Given Solution Information (Math)",     html: INFO_17_MATH.trim() },
  { id: "sl-info-18-nonmath", name: "Function Location Information (Non-math)", html: INFO_18_NONMATH.trim() },
  { id: "sl-info-18-math",    name: "Function Location Information (Math)",     html: INFO_18_MATH.trim() },
  { id: "sl-info-19-nonmath", name: "Function Basis Information (Non-math)", html: INFO_19_NONMATH.trim() },
  { id: "sl-info-19-math",    name: "Function Basis Information (Math)",     html: INFO_19_MATH.trim() },
];
