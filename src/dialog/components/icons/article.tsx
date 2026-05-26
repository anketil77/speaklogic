// src/dialog/components/icons/article.tsx

import React from "react";

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
