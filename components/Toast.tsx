// ============================================================
// TellSafe — Toast Notifications
// ============================================================
// Drop-in replacement for browser alert() for brief notices.
// Usage (anywhere with the hook):
//
//   const { showToast, ToastContainer } = useToast();
//
//   showToast("Survey link copied!", "success");
//   showToast("Export failed", "error");
//   showToast("Sending...", "info");
//
//   // In JSX:
//   <ToastContainer />

"use client";

import React, { useState, useCallback, useRef } from "react";

const fontStack = "'Outfit', system-ui, sans-serif";

export type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
  leaving: boolean;
}

const VARIANTS: Record<ToastVariant, { bg: string; border: string; color: string; icon: string }> = {
  success: { bg: "#f0fdf4", border: "#86efac", color: "#166534", icon: "✓" },
  error:   { bg: "#fef2f2", border: "#fca5a5", color: "#991b1b", icon: "✕" },
  info:    { bg: "#eff6ff", border: "#93c5fd", color: "#1e40af", icon: "ℹ" },
};

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const showToast = useCallback((message: string, variant: ToastVariant = "success", duration = 3000) => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, message, variant, leaving: false }]);

    // Start leave animation before removing
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => t.id === id ? { ...t, leaving: true } : t));
    }, duration);

    // Remove after animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration + 300);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => t.id === id ? { ...t, leaving: true } : t));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const ToastContainer = useCallback(() => (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 10000,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        pointerEvents: "none",
      }}
    >
      <style>{`
        @keyframes tsToastIn {
          from { opacity: 0; transform: translateX(48px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes tsToastOut {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(48px); }
        }
      `}</style>
      {toasts.map((toast) => {
        const v = VARIANTS[toast.variant];
        return (
          <div
            key={toast.id}
            onClick={() => dismiss(toast.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "11px 16px",
              background: v.bg,
              border: `1.5px solid ${v.border}`,
              borderRadius: 12,
              boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
              fontFamily: fontStack,
              fontSize: 13,
              fontWeight: 600,
              color: v.color,
              minWidth: 220,
              maxWidth: 340,
              cursor: "pointer",
              pointerEvents: "auto",
              animation: toast.leaving
                ? "tsToastOut 0.3s ease forwards"
                : "tsToastIn 0.25s ease",
            }}
          >
            <span style={{
              width: 20, height: 20, borderRadius: "50%",
              background: v.border,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 800, flexShrink: 0, color: v.color,
            }}>
              {v.icon}
            </span>
            <span style={{ flex: 1 }}>{toast.message}</span>
          </div>
        );
      })}
    </div>
  ), [toasts, dismiss]);

  return { showToast, ToastContainer };
}
