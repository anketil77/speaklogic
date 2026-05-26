// Icons used in the analyze tab panels and their sub-dialogs.
import React from "react";

/** 32×32 header icon with EBF3FC background — used in AnalysisQuestionDialog header. */
export function AnalysisQuestionHeaderIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="6" fill="#EBF3FC" />
      <path d="M16 23C19.866 23 23 19.866 23 16C23 12.134 19.866 9 16 9C12.134 9 9 12.134 9 16C9 19.866 12.134 23 16 23Z" stroke="#0078D4" strokeWidth="1.4" />
      <path d="M14 14C14 13.4696 14.2107 12.9609 14.5858 12.5858C14.9609 12.2107 15.4696 12 16 12C16.5304 12 17.0391 12.2107 17.4142 12.5858C17.7893 12.9609 18 13.4696 18 14C18 15.5 16 16 16 17.5M16 20V20.5" stroke="#0078D4" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

/** 13×13 circle-plus icon — used on "Add Analysis Question" button (white stroke). */
export function AddCircleIcon({ stroke = "white" }: { stroke?: string } = {}) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.5 11.5C9.26142 11.5 11.5 9.26142 11.5 6.5C11.5 3.73858 9.26142 1.5 6.5 1.5C3.73858 1.5 1.5 3.73858 1.5 6.5C1.5 9.26142 3.73858 11.5 6.5 11.5Z" stroke={stroke} strokeWidth="1.4" />
      <path d="M6.5 4V9M4 6.5H9" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

/** 18×18 rounded-rect with "?" text — used in AnalysisQuestionView command bar / inline. */
export function QuestionIcon({ color = "#0078D4" }: { color?: string } = {}) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="1" y="1" width="16" height="16" rx="3" stroke={color} strokeWidth="1.4" />
      <text x="9" y="13" textAnchor="middle" fontSize="10" fontWeight="700" fill={color} fontFamily="Inter, sans-serif">
        ?
      </text>
    </svg>
  );
}

export function AnswerIcon({ color = "#0078D4" }: { color?: string } = {}) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 2C5.134 2 2 5.134 2 9s3.134 7 7 7 7-3.134 7-7-3.134-7-7-7z" stroke={color} strokeWidth="1.4" />
      <path d="M6.5 7.5C6.5 6.119 7.619 5 9 5s2.5 1.119 2.5 2.5c0 1.25-.875 2.291-2.063 2.457L9 10v1" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="9" cy="13" r="0.75" fill={color} />
    </svg>
  );
}

export function ErrorIcon({ color = "#D13438" }: { color?: string } = {}) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="7" stroke={color} strokeWidth="1.5" />
      <line x1="9" y1="5.5" x2="9" y2="10" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="9" cy="12.5" r="0.9" fill={color} />
    </svg>
  );
}

export function CompensatorIcon({ color = "#0078D4" }: { color?: string } = {}) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="1" y="1" width="16" height="16" rx="3" stroke={color} strokeWidth="1.4" />
      <rect x="4.5" y="4.5" width="9" height="9" rx="1.5" stroke={color} strokeWidth="1.4" />
      <circle cx="9" cy="9" r="1.5" fill={color} />
    </svg>
  );
}

export function IdentifyProblemStarIcon({ color = "#0078D4" }: { color?: string } = {}) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 2L11 7H16L12 10.5L13.5 16L9 12.5L4.5 16L6 10.5L2 7H7L9 2Z" stroke={color} strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  );
}

export function ProblemIcon({ color = "#D13438" }: { color?: string } = {}) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="1" y="1" width="16" height="16" rx="3" stroke={color} strokeWidth="1.4" />
      <path d="M9 5C7.34 5 6 6.34 6 8C6 9.1 6.6 10.05 7.5 10.58V12H10.5V10.58C11.4 10.05 12 9.1 12 8C12 6.34 10.66 5 9 5Z" stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
      <rect x="7.5" y="13" width="3" height="1.5" rx="0.5" fill={color} />
    </svg>
  );
}

export function AttachFileIcon({ color = "#0078D4" }: { color?: string } = {}) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M10.5 2H5a1.5 1.5 0 00-1.5 1.5v11A1.5 1.5 0 005 16h8a1.5 1.5 0 001.5-1.5V6L10.5 2z" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M10.5 2v4H14.5" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M6.5 10h5M6.5 12.5h3" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function FolderIcon({ color = "#0078D4" }: { color?: string } = {}) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M1.5 3.5h4l1.5 1.5H12.5v6.5h-11V3.5z" stroke={color} strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

export function FolderBannerIcon() {
  return (
    <svg width="32" height="28" viewBox="0 0 32 28" fill="none">
      <rect x="0.5" y="5.5" width="31" height="22" rx="1.5" fill="#F5C842" stroke="#D4A800" />
      <path d="M0.5 10.5H31.5V27H1.5C0.947715 27 0.5 26.5523 0.5 26V10.5Z" fill="#FFD94A" stroke="#D4A800" />
      <path d="M0.5 9C0.5 8.17157 1.17157 7.5 2 7.5H13L15.5 10.5H0.5V9Z" fill="#FFD94A" stroke="#D4A800" strokeLinejoin="round" />
    </svg>
  );
}
