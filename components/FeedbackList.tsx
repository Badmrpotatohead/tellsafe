// ============================================================
// TellSafe — Feedback List Component (Admin Dashboard)
// ============================================================

"use client";

import React, { useState, useEffect } from "react";
import { useBrand } from "./BrandProvider";
import { subscribeFeedback, updateFeedbackStatus } from "../lib/data";
import type { Feedback, FeedbackType, FeedbackStatus } from "../types";
import type { BrandTheme } from "./BrandProvider";

const fontStack = "'Outfit', system-ui, sans-serif";
const displayFont = "'Fraunces', Georgia, serif";

interface Props {
  orgId: string;
  onOpenThread: (threadId: string, feedbackId: string) => void;
}

export default function FeedbackList({ orgId, onOpenThread }: Props) {
  const { theme } = useBrand();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Real-time subscription
  useEffect(() => {
    const unsubscribe = subscribeFeedback(orgId, {}, (items) => {
      setFeedback(items);
    });
    return () => unsubscribe();
  }, [orgId]);

  // Client-side filtering (keeps real-time updates responsive)
  const filtered = feedback.filter((f) => {
    if (filter === "needs_reply" && f.status !== "needs_reply" && f.status !== "new") return false;
    if (filter === "urgent" && f.sentimentLabel !== "urgent") return false;
    if (filter !== "all" && filter !== "needs_reply" && filter !== "urgent" && f.type !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !f.text.toLowerCase().includes(q) &&
        !f.categories.some((c) => c.toLowerCase().includes(q))
      )
        return false;
    }
    return true;
  });

  const statusMap: Record<FeedbackStatus, { color: string; label: string }> = {
    new: { color: theme.accent, label: "New" },
    needs_reply: { color: theme.accent, label: "Needs reply" },
    replied: { color: theme.primary, label: "Replied" },
    resolved: { color: theme.muted, label: "Resolved" },
  };

  const typeMap: Record<FeedbackType, { bg: string; border: string; icon: string }> = {
    identified: { bg: theme.accentGlow, border: theme.accent, icon: "👋" },
    anonymous: { bg: theme.primaryGlow, border: theme.primary, icon: "👤" },
    relay: { bg: theme.violetGlow, border: theme.violet, icon: "🔀" },
  };

  const sentimentBadge = (label: string | null) => {
    if (!label) return null;
    const map: Record<string, { bg: string; color: string; text: string }> = {
      urgent: { bg: "#fee2e2", color: "#dc2626", text: "🚨 Urgent" },
      negative: { bg: "#fef3c7", color: "#d97706", text: "⚠️ Negative" },
      neutral: { bg: theme.paperWarm, color: theme.muted, text: "Neutral" },
      positive: { bg: "#d1fae5", color: "#059669", text: "✓ Positive" },
    };
    const cfg = map[label];
    if (!cfg) return null;
    return (
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          padding: "2px 7px",
          borderRadius: 4,
          background: cfg.bg,
          color: cfg.color,
        }}
      >
        {cfg.text}
      </span>
    );
  };

  const filters = [
    { id: "all", label: "All" },
    { id: "identified", label: "👋 Identified" },
    { id: "anonymous", label: "👤 Anon" },
    { id: "relay", label: "🔀 Relay" },
    { id: "needs_reply", label: "⚡ Needs Reply" },
    { id: "urgent", label: "🚨 Urgent" },
  ];

  return (
    <div>
      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 18,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search feedback..."
          style={{
            flex: 1,
            minWidth: 180,
            maxWidth: 280,
            padding: "8px 12px",
            border: `1.5px solid ${theme.divider}`,
            borderRadius: 8,
            fontSize: 13,
            background: "#fff",
            outline: "none",
            fontFamily: fontStack,
          }}
        />
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              padding: "7px 12px",
              borderRadius: 100,
              fontSize: 11,
              fontWeight: 600,
              border: `1.5px solid ${filter === f.id ? theme.ink : theme.divider}`,
              background: filter === f.id ? theme.ink : "#fff",
              color: filter === f.id ? "#f8f6f1" : theme.ink,
              cursor: "pointer",
              outline: "none",
              fontFamily: fontStack,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.length === 0 && (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: theme.muted,
              fontSize: 14,
              fontFamily: fontStack,
            }}
          >
            {feedback.length === 0
              ? "No feedback yet. Share your form link to start collecting!"
              : "No feedback matches your filters."}
          </div>
        )}

        {filtered.map((f, i) => {
          const tc = typeMap[f.type];
          const sc = statusMap[f.status];
          const isRelay = f.type === "relay" && "threadId" in f;
          const timeAgo = formatTimeAgo(f.createdAt);

          return (
            <div
              key={f.id}
              onClick={() => {
                if (isRelay && "threadId" in f) {
                  onOpenThread((f as any).threadId, f.id);
                }
              }}
              style={{
                background: "#fff",
                borderRadius: 14,
                padding: "18px 22px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                display: "flex",
                gap: 14,
                cursor: isRelay ? "pointer" : "default",
                borderLeft: `4px solid ${tc.border}`,
                transition: "all 0.2s",
                animation: `slideIn 0.35s ease ${i * 0.03}s both`,
              }}
            >
              {/* Type icon */}
              <div
                style={{
                  flexShrink: 0,
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                  background: tc.bg,
                }}
              >
                {tc.icon}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Header row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 5,
                    flexWrap: "wrap",
                  }}
                >
                  {f.categories.map((cat) => (
                    <span
                      key={cat}
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        padding: "2px 7px",
                        borderRadius: 4,
                        background: theme.paperWarm,
                        color: theme.muted,
                      }}
                    >
                      {cat}
                    </span>
                  ))}
                  <span style={{ fontSize: 10, fontWeight: 600, color: tc.border }}>
                    {f.type === "identified" && "authorName" in f
                      ? (f as any).authorName
                      : f.type.toUpperCase()}
                  </span>
                  {sentimentBadge(f.sentimentLabel)}
                  <span style={{ fontSize: 11, color: theme.muted, marginLeft: "auto" }}>
                    {timeAgo}
                  </span>
                </div>

                {/* Body */}
                <div
                  style={{
                    fontSize: 13,
                    color: theme.ink,
                    lineHeight: 1.5,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    fontFamily: fontStack,
                  }}
                >
                  {f.text}
                </div>

                {/* Footer */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginTop: 8,
                    fontSize: 11,
                    color: theme.muted,
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: sc.color,
                        display: "inline-block",
                      }}
                    />
                    {sc.label}
                  </span>
                  {isRelay && <span>#{(f as any).threadId}</span>}
                  {f.type === "anonymous" && <span>No reply possible</span>}

                  {/* Quick actions */}
                 <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateFeedbackStatus(
                        orgId,
                        f.id,
                        f.status === "resolved" ? "new" : "resolved"
                      );
                    }}
                    style={{
                      marginLeft: "auto",
                      fontSize: 11,
                      color: f.status === "resolved" ? theme.accent : theme.primary,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontFamily: fontStack,
                    }}
                  >
                    {f.status === "resolved" ? "↩ Reopen" : "✓ Resolve"}
                  </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================

function formatTimeAgo(isoDate: string): string {
  const now = new Date();
  const then = new Date(isoDate);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
}
