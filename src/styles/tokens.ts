// src/styles/tokens.ts
// Single source of truth for all design tokens.
// Import `colors` in components for type-safe access.
// CSS custom properties are declared in src/dialog/index.html <style> block.

export const colors = {
  azure42: "#0078D4",
  grey11: "#1B1B1B",
  grey38: "#616161",
  grey74: "#BDBDBD",
  grey78: "#C7C7C7",
  grey88: "#E0E0E0",
  grey92: "#EBEBEB",
  grey95: "#EBF3FC",
  grey96: "#F5F5F5",
  white: "#FFFFFF",
  green: "#0CBA58",
  purple: "#4259C3",
  lightGrey: "#D9D9D9",
  red: "#FF1D25",
  redDestructive: "#D13438",
} as const;

export type ColorKey = keyof typeof colors;
