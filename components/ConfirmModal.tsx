// ============================================================
// TellSafe — ConfirmModal
// ============================================================
// Drop-in replacement for browser confirm() dialogs.
// Usage:
//   const [modal, setModal] = useConfirmModal();
//   <ConfirmModal {...modal} />
//
//   setModal({
//     open: true,
//     title: "Delete survey?",
//     description: "This cannot be undone.",
//     variant: "destructive",         // "destructive" | "primary" | "info"
//     icon: "⚠️",                     // optional override
//     confirmLabel: "Delete",         // optional
//     onConfirm: () => doDelete(),
//   });

"use client";

import React, { useEffect, useCallback, useState } from "react";

const fontStack = "'Outfit', system-ui, sans-serif";

export type ConfirmModalVariant = "destructive" | "primary" | "info";

export interface ConfirmModalProps {
  open: boolean;
  title: string;
  description?: string;
  icon?: string;
  variant?: ConfirmModalVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// ── Convenience hook ──────────────────────────────────────────
export type ModalState = Omit<ConfirmModalProps, "onCancel"> & { open: boolean };

export function useConfirmModal(): [ModalState, (state: Omit<ModalState, "open">) => void, () => void] {
  const [state, setState] = useState<ModalState>({
    open: false,
    title: "",
    onConfirm: () => {},
  });

  const show = useCallback((opts: Omit<ModalState, "open">) => {
    setState({ ...opts, open: true });
  }, []);

  const hide = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  return [state, show, hide];
}

// ── Component ─────────────────────────────────────────────────
export default function ConfirmModal({
  open,
  title,
  description,
  icon,
  variant = "primary",
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  // Escape key closes
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  // Prevent body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const defaultIcons: Record<ConfirmModalVariant, string> = {
    destructive: "⚠️",
    primary: "✅",
    info: "ℹ️",
  };

  const confirmColors: Record<ConfirmModalVariant, { bg: string; hover: string }> = {
    destructive: { bg: "#dc2626", hover: "#b91c1c" },
    primary: { bg: "#2d6a6a", hover: "#1a4a4a" },
    info: { bg: "#2563eb", hover: "#1d4ed8" },
  };

  const resolvedIcon = icon ?? defaultIcons[variant];
  const resolvedConfirmLabel = confirmLabel ?? (variant === "destructive" ? "Delete" : "Confirm");
  const colors = confirmColors[variant];

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        padding: 16,
        animation: "tsModalFadeIn 0.15s ease",
      }}
    >
      <style>{`
        @keyframes tsModalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes tsModalSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: "32px 28px",
          maxWidth: 400,
          width: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          fontFamily: fontStack,
          animation: "tsModalSlideUp 0.18s ease",
          textAlign: "center",
        }}
      >
        {/* Icon */}
        <div style={{ fontSize: 40, marginBottom: 16, lineHeight: 1 }}>{resolvedIcon}</div>

        {/* Title */}
        <h2 style={{
          fontSize: 18,
          fontWeight: 700,
          color: "#1a1a2e",
          margin: "0 0 8px",
          fontFamily: fontStack,
          lineHeight: 1.3,
        }}>
          {title}
        </h2>

        {/* Description */}
        {description && (
          <p style={{
            fontSize: 14,
            color: "#5a5650",
            margin: "0 0 24px",
            lineHeight: 1.55,
          }}>
            {description}
          </p>
        )}
        {!description && <div style={{ marginBottom: 24 }} />}

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "12px 0",
              border: "1.5px solid #e8e5de",
              borderRadius: 10,
              background: "#fff",
              color: "#1a1a2e",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: fontStack,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#f8f6f1"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => { onConfirm(); onCancel(); }}
            style={{
              flex: 1,
              padding: "12px 0",
              border: "none",
              borderRadius: 10,
              background: colors.bg,
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: fontStack,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = colors.hover; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = colors.bg; }}
          >
            {resolvedConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
