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
