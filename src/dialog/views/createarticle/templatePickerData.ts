// src/dialog/views/createarticle/templatePickerData.ts
//
// Static data and types for TemplatePickerPanel. Kept separate so the
// main view file stays under the 400-line limit.

import {
  TplNsIcon,
  TplSpIcon,
  TplPrIcon,
} from "@/dialog/components/Icons";
import type React from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type TemplateCategory = "non-sport" | "sport" | "product-reviews";

export interface TemplateItem {
  name: string;
  desc: string;
}

export interface CategoryDef {
  id:    TemplateCategory;
  label: string;
  Icon:  React.ComponentType<{ color?: string }>;
}

// ─── Category definitions ─────────────────────────────────────────────────────

export const CATEGORY_DATA: ReadonlyArray<CategoryDef> = [
  { id: "non-sport",       label: "Non-Sport & Game", Icon: TplNsIcon },
  { id: "sport",           label: "Sport & Game",      Icon: TplSpIcon },
  { id: "product-reviews", label: "Product Reviews",   Icon: TplPrIcon },
];

// ─── Template lists ───────────────────────────────────────────────────────────

export const TEMPLATES: Readonly<Record<TemplateCategory, TemplateItem[]>> = {
  "non-sport": [
    {
      name: "News Template 1",
      desc: "This template helps you separate the information to identify problems and negative functions",
    },
    {
      name: "News Template 2",
      desc: "This template further extends Template 1 to identify relationships between negative functions and information",
    },
    {
      name: "News Template 3",
      desc: "Use this template if there is no problem developed and negative function executed",
    },
    {
      name: "News Template 4",
      desc: "This template further extends Template 3 to identify relationships between functions and information",
    },
  ],
  "sport": [
    {
      name: "Sport & Game News Template 1",
      desc: "Use this template to separate events, functions, and observations",
    },
    {
      name: "Sport & Game News Template 2",
      desc: "Use this template only to provide information about functions executed from event",
    },
    {
      name: "Sport & Game News Template 3",
      desc: "Use this template to separate the functions from event and previous information",
    },
    {
      name: "Sport & Game News Template 4",
      desc: "This template further extends Template 3 by identifying relationships between event and functions",
    },
  ],
  "product-reviews": [
    {
      name: "Product Review News Template",
      desc: "This template separates a product from its function as well as problem solved",
    },
  ],
};
