// ============================================================
// TellSafe — Feedback Detail Panel
// ============================================================

"use client";

import React, { useState } from "react";
import { useBrand } from "./BrandProvider";
import { updateFeedbackStatus } from "../lib/data";
import type { Feedback, FeedbackStatus } from "../types";

const fontStack = "'Outfit', system-ui, sans-serif";
const displayFont = "'Fraunces', Georgia, serif";

interface Props {
  orgId: string;
  feedback: Feedback;
  onClose: () => void;
  onOpenThread?: (threadId: string, feedbackId: string) => void;
}

export default function FeedbackDetail({ orgId, feedback: f, onClose, onOpenThread }: Props) {
  const { theme } = useBrand();
  const [status, setStatus] = useState<FeedbackStatus>(f.status);

  const handleStatusChange = async (newStatus: FeedbackStatus) => {
    await updateFeedbackStatus(orgId, f.id, newStatus);
    setStatus(newStatus);
  };

  const typeLabels: Record<string, { icon: string; label: string; color: string }> = {
    identified: { icon: "👋", label: "Identified", color: theme.accent },
    anonymous: { icon: "👤", label: "Anonymous", color: theme.primary },
    relay: { icon: "🔀", label: "Anonymous Relay", color: theme.violet },
  };

  const tc = typeLabels[f.type] || typeLabels.anonymous;

  const statusOptions: { value: FeedbackStatus; label: string; color: string }[] = [
    { value: "new", label: "New", color: theme.accent },
    { value: "needs_reply", label: "Needs Reply", color: theme.accent },
    { value: "replied", label: "Replied", color: theme.primary },
    { value: "resolved", label: "Resolved", color: theme.muted },
  ];

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: 480,
        background: "#fff",
        boxShadow: "-4px 0 24px rgba(0,0,0,0.1)",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        fontFamily: fontStack,
        animation: "slideInRight 0.25s ease",
      }}
    >
      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>

      {/* Header */}
      <div
        style={{
          padding: "20px 24px",
          borderBottom: `1px solid ${theme.divider}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>{tc.icon}</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: tc.color }}>{tc.label}</span>
          {f.sentimentLabel && f.sentimentLabel !== "neutral" && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 4,
                background: f.sentimentLabel === "urgent" ? "#fee2e2" : f.sentimentLabel === "negative" ? "#fef3c7" : "#d1fae5",
                color: f.sentimentLabel === "urgent" ? "#dc2626" : f.sentimentLabel === "negative" ? "#d97706" : "#059669",
              }}
            >
              {f.sentimentLabel === "urgent" ? "🚨 Urgent" : f.sentimentLabel === "negative" ? "⚠️ Negative" : "✓ Positive"}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            fontSize: 22,
            cursor: "pointer",
            color: theme.muted,
            padding: "4px 8px",
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
        {/* Categories */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
          {f.categories.map((cat) => (
            <span
              key={cat}
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                padding: "3px 10px",
                borderRadius: 6,
                background: theme.paperWarm,
                color: theme.muted,
              }}
            >
              {cat}
            </span>
          ))}
        </div>

        {/* Timestamp */}
        <div style={{ fontSize: 12, color: theme.muted, marginBottom: 16 }}>
          {new Date(f.createdAt).toLocaleString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </div>

        {/* Contact info for identified */}
        {f.type === "identified" && "authorName" in f && (
          <div
            style={{
              background: theme.accentGlow,
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              border: `1px solid ${theme.accent}22`,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: theme.accent, marginBottom: 8 }}>
              Contact Info
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
              {(f as any).authorName}
            </div>
            {(f as any).authorEmail && (
              <a
                href={`mailto:${(f as any).authorEmail}`}
                style={{ fontSize: 13, color: theme.accent, textDecoration: "none" }}
              >
                {(f as any).authorEmail} →
              </a>
            )}
          </div>
        )}

        {/* Anonymous notice */}
        {f.type === "anonymous" && (
          <div
            style={{
              background: theme.primaryGlow,
              borderRadius: 12,
              padding: 14,
              marginBottom: 20,
              fontSize: 13,
              color: theme.primary,
              border: `1px solid ${theme.primary}22`,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            🔒 Fully anonymous — no way to reply or identify this person.
          </div>
        )}

        {/* Relay notice */}
        {f.type === "relay" && (
          <div
            style={{
              background: theme.violetGlow,
              borderRadius: 12,
              padding: 14,
              marginBottom: 20,
              fontSize: 13,
              color: theme.violet,
              border: `1px solid ${theme.violet}22`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              🔀 Anonymous Relay — reply without seeing their identity.
            </div>
            {"threadId" in f && onOpenThread && (
              <button
                onClick={() => onOpenThread((f as any).threadId, f.id)}
                style={{
                  padding: "8px 18px",
                  background: theme.violet,
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: fontStack,
                }}
              >
                Open Relay Thread →
              </button>
            )}
          </div>
        )}

        {/* Full feedback text */}
        <div
          style={{
            fontSize: 15,
            lineHeight: 1.75,
            color: theme.ink,
            whiteSpace: "pre-wrap",
          }}
        >
          {f.text}
        </div>
      </div>

      {/* Footer — status controls */}
      <div
        style={{
          padding: "16px 24px",
          borderTop: `1px solid ${theme.divider}`,
          background: theme.paper,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: theme.muted, marginBottom: 10 }}>
          Status
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleStatusChange(opt.value)}
              style={{
                flex: 1,
                padding: "8px 4px",
                borderRadius: 8,
                border: `1.5px solid ${status === opt.value ? opt.color : theme.divider}`,
                background: status === opt.value ? opt.color + "15" : "#fff",
                color: status === opt.value ? opt.color : theme.muted,
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: fontStack,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Reply button for identified */}
        {f.type === "identified" && "authorEmail" in f && (f as any).authorEmail && (
          <a
            href={`mailto:${(f as any).authorEmail}?subject=Re: Your feedback to ${f.categories.join(", ") || "our community"}`}
            style={{
              display: "block",
              width: "100%",
              padding: 12,
              marginTop: 12,
              background: theme.accent,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              textAlign: "center",
              textDecoration: "none",
              fontFamily: fontStack,
            }}
          >
            ✉️ Reply via Email
          </a>
        )}
      </div>
    </div>
  );
}
