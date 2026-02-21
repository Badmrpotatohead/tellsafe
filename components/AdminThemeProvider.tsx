// ============================================================
// TellSafe — Admin Dark/Light Theme Provider
// ============================================================
// Provides dark mode toggle for the admin dashboard.
// Persists preference to localStorage. Does NOT affect public pages.
// Uses CSS custom properties for seamless theming.

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

type AdminThemeMode = "light" | "dark";

interface AdminThemeContextType {
  mode: AdminThemeMode;
  toggle: () => void;
  isDark: boolean;
}

const AdminThemeContext = createContext<AdminThemeContextType>({
  mode: "light",
  toggle: () => {},
  isDark: false,
});

const STORAGE_KEY = "tellsafe-admin-theme";

// ── Warm dark palette ──
// Background tones: warm charcoal, not cold blue
const darkTokens = {
  "--admin-bg": "#1A1A1A",
  "--admin-bg-alt": "#1E1D1B",
  "--admin-card": "#2A2926",
  "--admin-card-hover": "#333028",
  "--admin-text": "#F2F0EB",
  "--admin-text-secondary": "#B5B0A5",
  "--admin-text-muted": "#8A8578",
  "--admin-divider": "#3A3835",
  "--admin-border": "#3A3835",
  "--admin-primary": "#2D6A6A",
  "--admin-primary-soft": "rgba(45,106,106,0.2)",
  "--admin-input-bg": "#232220",
  "--admin-input-border": "#3A3835",
  "--admin-shadow": "0 4px 20px rgba(0,0,0,0.3)",
  "--admin-shadow-lg": "0 8px 32px rgba(0,0,0,0.4)",
  "--admin-overlay": "rgba(0,0,0,0.6)",
  "--admin-badge-bg": "rgba(255,255,255,0.08)",
  "--admin-success": "#059669",
  "--admin-error": "#ef4444",
  "--admin-warning": "#d97706",
  "--admin-code-bg": "#1E1D1B",
};

const lightTokens = {
  "--admin-bg": "#f2f0eb",
  "--admin-bg-alt": "#f8f6f1",
  "--admin-card": "#ffffff",
  "--admin-card-hover": "#f8f6f1",
  "--admin-text": "#1a1a2e",
  "--admin-text-secondary": "#555555",
  "--admin-text-muted": "#8a8578",
  "--admin-divider": "rgba(26,26,46,0.10)",
  "--admin-border": "rgba(26,26,46,0.12)",
  "--admin-primary": "#2d6a6a",
  "--admin-primary-soft": "rgba(45,106,106,0.10)",
  "--admin-input-bg": "#f8f6f1",
  "--admin-input-border": "rgba(26,26,46,0.12)",
  "--admin-shadow": "0 4px 20px rgba(26,26,46,0.07)",
  "--admin-shadow-lg": "0 8px 32px rgba(26,26,46,0.10)",
  "--admin-overlay": "rgba(0,0,0,0.5)",
  "--admin-badge-bg": "rgba(26,26,46,0.06)",
  "--admin-success": "#059669",
  "--admin-error": "#c05d3b",
  "--admin-warning": "#d97706",
  "--admin-code-bg": "#f8f6f1",
};

function tokensToCSS(tokens: Record<string, string>) {
  return Object.entries(tokens)
    .map(([k, v]) => `${k}: ${v};`)
    .join("\n  ");
}

// Generate CSS that overrides hardcoded admin colors in dark mode
// This targets common admin patterns without refactoring every component
function generateDarkModeCSS() {
  return `
  /* ── Admin Dark Mode Overrides ── */
  .admin-dark {
    ${tokensToCSS(darkTokens)}
  }
  .admin-light {
    ${tokensToCSS(lightTokens)}
  }

  /* ── Main content area ── */
  .admin-dark .admin-main {
    background: var(--admin-bg) !important;
  }

  /* ── Page titles ── */
  .admin-dark .admin-page-title {
    color: var(--admin-text) !important;
  }

  /* ── Content pads (inbox, etc.) ── */
  .admin-dark .admin-content-pad h1,
  .admin-dark .admin-content-pad h2 {
    color: var(--admin-text) !important;
  }

  .admin-dark .admin-content-pad p {
    color: var(--admin-text-secondary) !important;
  }

  /* ── Action buttons (Export, etc.) ── */
  .admin-dark .admin-action-btn {
    background: var(--admin-card) !important;
    color: var(--admin-text) !important;
    border-color: var(--admin-border) !important;
  }

  /* ── Stat cards & generic cards ── */
  .admin-dark .admin-stat-card,
  .admin-dark .admin-card {
    background: var(--admin-card) !important;
    border-color: var(--admin-border) !important;
    box-shadow: var(--admin-shadow) !important;
  }

  .admin-dark .admin-stat-card h3,
  .admin-dark .admin-card h3 {
    color: var(--admin-text) !important;
  }

  .admin-dark .admin-stat-card p,
  .admin-dark .admin-card p {
    color: var(--admin-text-secondary) !important;
  }

  /* ── Feedback list items ── */
  .admin-dark .admin-feedback-item {
    background: var(--admin-card) !important;
    border-color: var(--admin-border) !important;
  }

  .admin-dark .admin-feedback-item:hover {
    background: var(--admin-card-hover) !important;
  }

  /* ── Feedback detail panel ── */
  .admin-dark .admin-feedback-detail {
    background: var(--admin-bg-alt) !important;
    border-color: var(--admin-border) !important;
  }

  /* ── Filter chips ── */
  .admin-dark .admin-filter-chip {
    background: var(--admin-card) !important;
    border-color: var(--admin-border) !important;
    color: var(--admin-text-secondary) !important;
  }

  .admin-dark .admin-filter-chip-active {
    background: var(--admin-primary) !important;
    border-color: var(--admin-primary) !important;
    color: #fff !important;
  }

  /* ── Inputs & textareas ── */
  .admin-dark input:not([type="color"]),
  .admin-dark textarea,
  .admin-dark select {
    background: var(--admin-input-bg) !important;
    border-color: var(--admin-input-border) !important;
    color: var(--admin-text) !important;
  }

  .admin-dark input::placeholder,
  .admin-dark textarea::placeholder {
    color: var(--admin-text-muted) !important;
  }

  /* ── Labels ── */
  .admin-dark label {
    color: var(--admin-text) !important;
  }

  /* ── Mobile top bar ── */
  .admin-dark .admin-mobile-topbar {
    background: #111118 !important;
  }

  /* ── Modals ── */
  .admin-dark .admin-modal-overlay {
    background: var(--admin-overlay) !important;
  }

  .admin-dark .admin-modal-content {
    background: var(--admin-card) !important;
    color: var(--admin-text) !important;
  }

  /* ── Tooltips and popovers ── */
  .admin-dark .admin-tooltip {
    background: var(--admin-card) !important;
    border-color: var(--admin-border) !important;
    color: var(--admin-text) !important;
  }

  /* ── Generic text color helpers ── */
  .admin-dark .text-ink {
    color: var(--admin-text) !important;
  }
  .admin-dark .text-muted {
    color: var(--admin-text-muted) !important;
  }

  /* ── Email verification banner — keep as-is (gradient bg) ── */

  /* ── Separator lines ── */
  .admin-dark hr,
  .admin-dark .admin-divider {
    border-color: var(--admin-border) !important;
    background: var(--admin-border) !important;
  }

  /* ── Back to all feedback link ── */
  .admin-dark .admin-content-pad button {
    color: var(--admin-text-muted) !important;
  }

  /* ── Settings views (branding, team, billing, etc.) ── */
  .admin-dark .admin-main > div > div {
    color: var(--admin-text);
  }

  .admin-dark .admin-main h2 {
    color: var(--admin-text) !important;
  }

  .admin-dark .admin-main > div > div > p {
    color: var(--admin-text-secondary) !important;
  }

  /* ── New org modal ── */
  .admin-dark .admin-main ~ div[style*="position: fixed"] > div {
    background: var(--admin-card) !important;
    color: var(--admin-text) !important;
  }

  /* ── Scrollbar styling for dark mode ── */
  .admin-dark ::-webkit-scrollbar {
    width: 8px;
  }
  .admin-dark ::-webkit-scrollbar-track {
    background: var(--admin-bg);
  }
  .admin-dark ::-webkit-scrollbar-thumb {
    background: var(--admin-border);
    border-radius: 4px;
  }
  .admin-dark ::-webkit-scrollbar-thumb:hover {
    background: #4A4744;
  }
`;
}

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<AdminThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as AdminThemeMode | null;
      if (saved === "dark" || saved === "light") {
        setMode(saved);
      }
    } catch {}
    setMounted(true);
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {}
  }, [mode, mounted]);

  const toggle = useCallback(() => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const isDark = mode === "dark";

  const ctx = useMemo(() => ({ mode, toggle, isDark }), [mode, toggle, isDark]);

  return (
    <AdminThemeContext.Provider value={ctx}>
      <style>{generateDarkModeCSS()}</style>
      <div className={isDark ? "admin-dark" : "admin-light"}>
        {children}
      </div>
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  return useContext(AdminThemeContext);
}

export { darkTokens, lightTokens };
