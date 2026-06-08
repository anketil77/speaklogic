// src/dialog/components/icons/article.tsx

import React from "react";

/** 18×18 open-book / articles icon for the ListArticlesView header badge. */
export function ListArticlesHeaderIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Left page */}
      <path d="M9 4V15C9 15 6.5 13.5 3 14V3C6.5 2 9 4 9 4Z" stroke="#0078D4" strokeWidth="1.2" strokeLinejoin="round" fill="none" />
      {/* Right page */}
      <path d="M9 4V15C9 15 11.5 13.5 15 14V3C11.5 2 9 4 9 4Z" stroke="#0078D4" strokeWidth="1.2" strokeLinejoin="round" fill="none" />
      {/* Left text lines */}
      <line x1="5" y1="6.5" x2="8" y2="6" stroke="#0078D4" strokeWidth="0.9" strokeLinecap="round" />
      <line x1="5" y1="8.5" x2="8" y2="8" stroke="#0078D4" strokeWidth="0.9" strokeLinecap="round" />
      <line x1="5" y1="10.5" x2="8" y2="10" stroke="#0078D4" strokeWidth="0.9" strokeLinecap="round" />
    </svg>
  );
}

/** 16×16 "view article" eye icon (white, for primary button). */
export function ViewArticleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 6.5C1 6.5 3 2.5 6.5 2.5C10 2.5 12 6.5 12 6.5C12 6.5 10 10.5 6.5 10.5C3 10.5 1 6.5 1 6.5Z" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6.5" cy="6.5" r="1.8" stroke="white" strokeWidth="1.4" />
    </svg>
  );
}

export function ArticleHeaderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2.5" y="1.5" width="11" height="13" rx="1" stroke="#0078D4" strokeWidth="1.12" />
      <line x1="4.5" y1="5" x2="11.5" y2="5" stroke="#0078D4" strokeWidth="1.12" strokeLinecap="round" />
      <line x1="4.5" y1="7.5" x2="11.5" y2="7.5" stroke="#0078D4" strokeWidth="1.12" strokeLinecap="round" />
      <line x1="4.5" y1="10" x2="8.5" y2="10" stroke="#0078D4" strokeWidth="1.12" strokeLinecap="round" />
    </svg>
  );
}

export function ArticleCloseIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="1.5" y1="1.5" x2="9.5" y2="9.5" stroke="#616161" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9.5" y1="1.5" x2="1.5" y2="9.5" stroke="#616161" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ArticleCaretDownIcon({ color = "#ADADAD" }: { color?: string }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 3.5L5 6.5L8 3.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Picker — Blank article icon (i-blank, 16×16)
 * Document rect + two content-line indicators.
 * left:12.5% right:25% top:9.38% bottom:9.38% → rect x=2,y=1.5,w=10,h=13
 * line block:  left:31.25% right:31.25% top:31.25% bottom:37.5%
 */
export function ArticlePickerBlankIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Document outline */}
      <rect x="2" y="1.5" width="10" height="13" rx="0.9" stroke="#0078D4" strokeWidth="1.3" />
      {/* Content lines */}
      <path d="M5 6H11M5 8.5H11M5 11H9" stroke="#0078D4" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Picker — Use Template icon (i-tmpl, 16×16)
 * Two overlapping document pages + a small content-line indicator.
 * Back page:  left:34.38% right:9.38% top:12.5%  bottom:25% → x=5.5,y=2,w=9,h=10
 * Front page: left:9.38%  right:34.38% top:25%   bottom:12.5% → x=1.5,y=4,w=9,h=10
 * Line:       left:25%    right:43.75% top:50%    bottom:34.38% → x=4,y=8,w=5,h=2.5
 */
export function ArticlePickerTemplateIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Back page */}
      <rect x="5.5" y="2" width="9" height="10" rx="0.9" fill="white" stroke="#0078D4" strokeWidth="1.3" />
      {/* Front page */}
      <rect x="1.5" y="4" width="9" height="10" rx="0.9" fill="white" stroke="#0078D4" strokeWidth="1.3" />
      {/* Content line on front page */}
      <path d="M4 9H9" stroke="#0078D4" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

// ─── Template picker icons ─────────────────────────────────────────────────────

/** Back chevron — 9×9, left-pointing arrow (header back button). */
export function TplBackIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.75 1.5L2.75 4.5L5.75 7.5" stroke="#616161" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Non-Sport & Game category icon (i-ns, 26×26).
 * Outer frame (8.33% margins) + inner content block (25%/33.33% margins).
 */
export function TplNsIcon({ color = "#616161" }: { color?: string }) {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2.17" y="2.17" width="21.66" height="21.66" rx="1.5" stroke={color} strokeWidth="1.625" />
      <rect x="6.5"  y="8.67" width="13"    height="8.67"  rx="0.5" stroke={color} strokeWidth="1.52"  />
    </svg>
  );
}

/**
 * Sport & Game category icon (i-sp, 26×26).
 * Outer circle (12.5% margins) + inner circle (33.33% margins).
 */
export function TplSpIcon({ color = "#616161" }: { color?: string }) {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="13" cy="13" r="9.75" stroke={color} strokeWidth="1.625" />
      <circle cx="13" cy="13" r="4.33" stroke={color} strokeWidth="1.3"   />
    </svg>
  );
}

/**
 * Product Reviews category icon (i-pr, 26×26).
 * Three overlapping rectangles at offset positions.
 */
export function TplPrIcon({ color = "#616161" }: { color?: string }) {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* bottom-left rect */}
      <rect x="2.17" y="6.5"  width="14.08" height="14.08" rx="1" stroke={color} strokeWidth="1.625" />
      {/* top-right rect */}
      <rect x="8.67" y="2.17" width="14.08" height="14.08" rx="1" stroke={color} strokeWidth="1.625" />
      {/* small accent rect */}
      <rect x="5.42" y="13"   width="7.58"  height="3.25"  rx="0.4" stroke={color} strokeWidth="1.3"  />
    </svg>
  );
}

/**
 * Document icon for template list items (i-doc-md, 14×14).
 * Outer rect (7.14% margins) + inner content block (21.43% / 32.14% margins).
 */
export function TplDocIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="12" height="12" rx="0.8" stroke="#0078D4" strokeWidth="1.2" />
      <rect x="3" y="4.5" width="8" height="5" rx="0.4" stroke="#0078D4" strokeWidth="1"   />
    </svg>
  );
}

// ─── Article Wizard icons ──────────────────────────────────────────────────────

/**
 * Completed-step checkmark (7×7, blue stroke) for the wizard step bar.
 * left:14.29%≈1px right:14.29%≈1px top:21.43%≈1.5px bottom:24.29%≈1.7px
 */
export function WizardStepCheckIcon() {
  return (
    <svg width="7" height="7" viewBox="0 0 7 7" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 3.5L2.8 5.3L6 2" stroke="#0078D4" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Success-screen checkmark (24×24, green stroke) for step 8 Done.
 * left:16.67%≈4px right:16.67%≈4px top:25%=6px bottom:29.17%≈7px → path within 16×11
 */
export function WizardDoneCheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 12L9.5 17.5L20 7" stroke="#2E7D32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Back chevron (8×8, dark) for wizard footer Back button.
 * left:25%=2px right:37.5%=3px → x from 5 to 2; top/bottom 18.75%≈1.5px
 */
export function WizardBackChevron() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 1.5L2.5 4L5 6.5" stroke="#1B1B1B" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Next chevron (8×8, white) for wizard footer Next/Finish button.
 * Mirror of WizardBackChevron; white stroke (appears on blue button).
 */
export function WizardNextChevron() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 1.5L5.5 4L3 6.5" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Search icon (11×11) for the Select Information panel.
 * Circle: 9.09%≈1px to 72.73%≈8px (left/top) → cx≈4.5,cy≈4.5,r≈3
 * Handle: 68.18%≈7.5px to 86.36%≈9.5px
 */
export function WizardSearchIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="4.5" cy="4.5" r="3" stroke="#616161" strokeWidth="1.2" />
      <path d="M7 7L9.5 9.5" stroke="#616161" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Add-information icon (10×10, document+plus) for "Add information" button.
 */
export function WizardAddInfoIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="8" height="8" rx="0.8" stroke="#1B1B1B" strokeWidth="1.4" />
      <path d="M5 3.5V6.5M3.5 5H6.5" stroke="#1B1B1B" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Select-information icon (10×10, list-select) for "Select Information" button.
 */
export function WizardSelectInfoIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 3H9M1 5H9M1 7H6" stroke="#1B1B1B" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Publish article icon (16×16, upload-arrow) for "Publish Article" command bar button.
 */
export function PublishArticleIcon({ color = "#616161" }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 10V3M5 6L8 3L11 6" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 12H13" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
