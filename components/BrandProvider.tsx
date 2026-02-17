// ============================================================
// TellSafe — Brand Context Provider
// ============================================================
// Provides themed design tokens based on the current org's branding.
// Used by the public feedback form and admin dashboard.

"use client";

import React, { createContext, useContext, useMemo } from "react";
import type { Organization, Category } from "../types";

export interface BrandTheme {
  ink: string;
  paper: string;
  paperWarm: string;
  white: string;
  primary: string;
  primarySoft: string;
  primaryGlow: string;
  accent: string;
  accentSoft: string;
  accentGlow: string;
  violet: string;
  violetSoft: string;
  violetGlow: string;
  muted: string;
  divider: string;
  shadow: string;
  shadowLg: string;
}

export interface BrandContextType {
  orgName: string;
  orgSlug: string;
  logoUrl: string | null;
  tagline: string;
  categories: Category[];
  theme: BrandTheme;
}

const BrandContext = createContext<BrandContextType | null>(null);

function hexToRgb(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

function makeTheme(primary: string, accent: string): BrandTheme {
  return {
    ink: "#1a1a2e",
    paper: "#f8f6f1",
    paperWarm: "#eeebe4",
    white: "#ffffff",
    primary,
    primarySoft: primary + "40",
    primaryGlow: `rgba(${hexToRgb(primary)}, 0.10)`,
    accent,
    accentSoft: accent + "55",
    accentGlow: `rgba(${hexToRgb(accent)}, 0.10)`,
    violet: "#6b5b8a",
    violetSoft: "#b8aed0",
    violetGlow: "rgba(107, 91, 138, 0.10)",
    muted: "#8a8578",
    divider: "rgba(26, 26, 46, 0.10)",
    shadow: "0 4px 20px rgba(26,26,46,0.07)",
    shadowLg: "0 8px 32px rgba(26,26,46,0.10)",
  };
}

// Default brand for when no org is loaded
const defaultBrand: BrandContextType = {
  orgName: "TellSafe",
  orgSlug: "",
  logoUrl: null,
  tagline: "Anonymous feedback for communities.",
  categories: [
    { emoji: "💡", label: "Suggestion" },
    { emoji: "❤️", label: "Praise" },
    { emoji: "🤝", label: "Safety" },
    { emoji: "💬", label: "Other" },
  ],
  theme: makeTheme("#2d6a6a", "#c05d3b"),
};

export function BrandProvider({
  org,
  children,
}: {
  org?: Organization | null;
  children: React.ReactNode;
}) {
 const brand = useMemo<BrandContextType>(() => {
    if (!org) return defaultBrand;
    return {
      orgName: org.name || "TellSafe",
      orgSlug: org.slug || "",
      logoUrl: org.logoUrl || null,
      tagline: org.tagline || "Anonymous feedback for communities.",
      categories: org.categories || defaultBrand.categories,
      theme: makeTheme(org.primaryColor || "#2d6a6a", org.accentColor || "#c05d3b"),
    };
  }, [org]);

  return (
    <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>
  );
}

export function useBrand(): BrandContextType {
  const ctx = useContext(BrandContext);
  if (!ctx) return defaultBrand;
  return ctx;
}

export { makeTheme };
