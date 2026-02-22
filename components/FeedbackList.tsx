// ============================================================
// TellSafe — Feedback List Component (Admin Dashboard)
// ============================================================

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useBrand } from "./BrandProvider";
import { subscribeFeedback, updateFeedbackStatus, batchDeleteFeedback } from "../lib/data";
import type { Feedback, FeedbackType, FeedbackStatus } from "../types";
import type { BrandTheme } from "./BrandProvider";

const fontStack = "'Outfit', system-ui, sans-serif";
const displayFont = "'Fraunces', Georgia, serif";

interface Props {
  orgId: string;
  org?: { slug?: string; logoUrl?: string | null; submissionCount?: number } | null;
  onOpenThread: (threadId: string, feedbackId: string) => void;
  onSelect?: (feedback: Feedback) => void;
  onNavigate?: (view: string) => void;
  categoryFilter?: string | null;
  showArchived?: boolean;
  viewFilter?: "inbox" | "needs_reply" | "resolved" | "urgent";
}

export default function FeedbackList({ orgId, org, onOpenThread, onSelect, onNavigate, categoryFilter, showArchived, viewFilter }: Props) {
  const { theme } = useBrand();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Multi-select state
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);

  // Clear selection and filters on view change
  useEffect(() => {
    setSelected(new Set());
    setLastClickedId(null);
    setConfirmDelete(false);
    setTypeFilter("all");
    setStatusFilter("all");
  }, [viewFilter, categoryFilter]);

  useEffect(() => {
    const unsubscribe = subscribeFeedback(orgId, {}, (items) => {
      setFeedback(items);
    });
    return () => unsubscribe();
  }, [orgId]);

  const filtered = feedback.filter((f) => {
    // View-level filtering from sidebar nav
    if (viewFilter === "resolved") {
      // Only show resolved items — archived are separate
      if (f.status !== "resolved") return false;
    } else if (viewFilter === "needs_reply") {
      // Show needs_reply, new, and reopened items
      if (f.status !== "needs_reply" && f.status !== "new" && f.status !== "reopened") return false;
    } else if (viewFilter === "urgent") {
      // Only show urgent items that are still active
      if (f.sentimentLabel !== "urgent") return false;
      if (f.status === "resolved" || f.status === "archived") return false;
    } else {
      // Inbox: hide archived
      if (!showArchived && f.status === "archived") return false;
    }

    if (categoryFilter && !f.categories.includes(categoryFilter)) return false;

    // Type filter (identified / anonymous / relay)
    if (typeFilter !== "all" && f.type !== typeFilter) return false;

    // Status filter (needs_reply / urgent) — independent of type filter
    if (statusFilter === "needs_reply" && f.status !== "needs_reply" && f.status !== "new") return false;
    if (statusFilter === "urgent" && f.sentimentLabel !== "urgent") return false;

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

  // Handle card click with shift-select support
  const handleCardClick = useCallback((e: React.MouseEvent, f: Feedback, index: number) => {
    if (e.shiftKey) {
      e.preventDefault();
      setSelected((prev) => {
        const next = new Set(prev);

        if (lastClickedId !== null) {
          // Range select: select everything between lastClicked and current
          const lastIdx = filtered.findIndex((item) => item.id === lastClickedId);
          if (lastIdx !== -1) {
            const start = Math.min(lastIdx, index);
            const end = Math.max(lastIdx, index);
            for (let i = start; i <= end; i++) {
              next.add(filtered[i].id);
            }
            return next;
          }
        }

        // Toggle single item
        if (next.has(f.id)) {
          next.delete(f.id);
        } else {
          next.add(f.id);
        }
        return next;
      });
      setLastClickedId(f.id);
      setConfirmDelete(false);
      return;
    }

    // If items are selected and user clicks without shift, clear selection
    if (selected.size > 0) {
      setSelected(new Set());
      setLastClickedId(null);
      setConfirmDelete(false);
      return;
    }

    // Normal click — open detail
    const isRelay = f.type === "relay" && "threadId" in f;
    if (isRelay && "threadId" in f) {
      onOpenThread((f as any).threadId, f.id);
    } else if (onSelect) {
      onSelect(f);
    }
  }, [filtered, lastClickedId, selected, onOpenThread, onSelect]);

  // Batch actions
  const handleBatchArchive = async () => {
    setBatchLoading(true);
    try {
      const promises = Array.from(selected).map((id) =>
        updateFeedbackStatus(orgId, id, "archived")
      );
      await Promise.all(promises);
      setSelected(new Set());
      setLastClickedId(null);
    } catch (err) {
      console.error("Batch archive failed:", err);
    } finally {
      setBatchLoading(false);
    }
  };

  const handleBatchDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setBatchLoading(true);
    try {
      await batchDeleteFeedback(orgId, Array.from(selected));
      setSelected(new Set());
      setLastClickedId(null);
      setConfirmDelete(false);
    } catch (err) {
      console.error("Batch delete failed:", err);
    } finally {
      setBatchLoading(false);
    }
  };

  const handleBatchResolve = async () => {
    setBatchLoading(true);
    try {
      const promises = Array.from(selected).map((id) =>
        updateFeedbackStatus(orgId, id, "resolved")
      );
      await Promise.all(promises);
      setSelected(new Set());
      setLastClickedId(null);
    } catch (err) {
      console.error("Batch resolve failed:", err);
    } finally {
      setBatchLoading(false);
    }
  };

  const statusMap: Record<FeedbackStatus, { color: string; label: string }> = {
    new: { color: theme.accent, label: "New" },
    needs_reply: { color: theme.accent, label: "Needs reply" },
    replied: { color: theme.primary, label: "Replied" },
    resolved: { color: theme.muted, label: "Resolved" },
    reopened: { color: "#d97706", label: "Reopened" },
    archived: { color: theme.muted, label: "Archived" },
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
      <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 4, background: cfg.bg, color: cfg.color }}>
        {cfg.text}
      </span>
    );
  };

  const typeFilters = [
    { id: "all", label: "All" },
    { id: "identified", label: "👋 Identified" },
    { id: "anonymous", label: "👤 Anon" },
    { id: "relay", label: "🔀 Relay" },
  ];

  const statusFilters = [
    { id: "needs_reply", label: "⚡ Needs Reply" },
    { id: "urgent", label: "🚨 Urgent" },
  ];

  return (
    <div>
      <style>{`
        @keyframes actionBarSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {/* Hint text when items are selected */}
      {selected.size > 0 && (
        <div style={{
          fontSize: 12, color: theme.muted, marginBottom: 10, fontFamily: fontStack,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <span style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 20, height: 20, borderRadius: 6,
            background: theme.primary, color: "#fff", fontSize: 10, fontWeight: 700,
          }}>
            {selected.size}
          </span>
          selected — shift+click more to add, or click anywhere to clear
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={searchInput}
          onChange={(e) => {
            const val = e.target.value;
            setSearchInput(val);
            // Debounce search by 250ms
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
            searchTimerRef.current = setTimeout(() => setSearch(val), 250);
          }}
          placeholder="Search feedback..."
          style={{
            flex: 1, minWidth: 180, maxWidth: 280, padding: "8px 12px",
            border: `1.5px solid var(--admin-border, ${theme.divider})`, borderRadius: 8, fontSize: 13,
            background: "var(--admin-card, #fff)", color: "var(--admin-text, #1a1a2e)", outline: "none", fontFamily: fontStack,
          }}
        />

        {/* Type filters: All / Identified / Anon / Relay */}
        {typeFilters.map((f) => (
          <button
            key={f.id}
            onClick={() => setTypeFilter(f.id)}
            className={typeFilter === f.id ? "admin-filter-chip-active" : "admin-filter-chip"}
            style={{
              padding: "7px 12px", borderRadius: 100, fontSize: 11, fontWeight: 600,
              border: `1.5px solid ${typeFilter === f.id ? theme.ink : "var(--admin-border, " + theme.divider + ")"}`,
              background: typeFilter === f.id ? theme.ink : "var(--admin-card, #fff)",
              color: typeFilter === f.id ? "#f8f6f1" : "var(--admin-text, " + theme.ink + ")",
              cursor: "pointer", outline: "none", fontFamily: fontStack,
            }}
          >
            {f.label}
          </button>
        ))}

        {/* Divider — only show when status filters are visible */}
        {viewFilter !== "resolved" && viewFilter !== "urgent" && viewFilter !== "needs_reply" && (
          <div style={{ width: 1, height: 20, background: theme.divider, margin: "0 2px", flexShrink: 0 }} />
        )}
        {/* Only show "Urgent" (not "Needs Reply") when on needs_reply tab */}
        {viewFilter === "needs_reply" && (
          <div style={{ width: 1, height: 20, background: theme.divider, margin: "0 2px", flexShrink: 0 }} />
        )}

        {/* Status filters: contextually shown per tab */}
        {statusFilters.filter((f) => {
          // Resolved tab: no status filters (everything is resolved)
          if (viewFilter === "resolved") return false;
          // Urgent tab: already filtered to urgent, no status filters
          if (viewFilter === "urgent") return false;
          // Needs Reply tab: hide redundant "Needs Reply" chip, show only "Urgent"
          if (viewFilter === "needs_reply" && f.id === "needs_reply") return false;
          return true;
        }).map((f) => {
          const isActive = statusFilter === f.id;
          const isUrgent = f.id === "urgent";
          return (
            <button
              key={f.id}
              onClick={() => setStatusFilter(isActive ? "all" : f.id)}
              className={isActive ? "admin-filter-chip-active" : "admin-filter-chip"}
              style={{
                padding: "7px 12px", borderRadius: 100, fontSize: 11, fontWeight: 600,
                border: `1.5px solid ${isActive ? (isUrgent ? "#dc2626" : theme.accent) : "var(--admin-border, " + theme.divider + ")"}`,
                background: isActive ? (isUrgent ? "#fee2e2" : theme.accentGlow) : "var(--admin-card, #fff)",
                color: isActive ? (isUrgent ? "#dc2626" : theme.accent) : "var(--admin-text, " + theme.ink + ")",
                cursor: "pointer", outline: "none", fontFamily: fontStack,
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: selected.size > 0 ? 80 : 0 }}>
        {filtered.length === 0 && feedback.length === 0 && (org?.submissionCount ?? 0) < 5 && (
          <QuickStartChecklist org={org} onNavigate={onNavigate} theme={theme} />
        )}
        {filtered.length === 0 && (feedback.length > 0 || (org?.submissionCount ?? 0) >= 5) && (
          <div style={{ padding: 40, textAlign: "center", color: theme.muted, fontSize: 14, fontFamily: fontStack }}>
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
          const isSelected = selected.has(f.id);

          return (
            <div
              key={f.id}
              className="admin-feedback-item"
              onClick={(e) => handleCardClick(e, f, i)}
              style={{
                background: isSelected ? `${theme.primary}08` : "var(--admin-card, #fff)",
                borderRadius: 14,
                padding: "18px 22px",
                boxShadow: isSelected ? `0 0 0 2px ${theme.primary}40` : "0 1px 3px rgba(0,0,0,0.03)",
                display: "flex",
                gap: 14,
                cursor: "pointer",
                borderLeft: `4px solid ${isSelected ? theme.primary : tc.border}`,
                transition: "all 0.15s",
                animation: `slideIn 0.35s ease ${i * 0.03}s both`,
                opacity: f.status === "resolved" || f.status === "archived" ? (isSelected ? 0.8 : 0.5) : 1,
                userSelect: selected.size > 0 ? "none" : "auto",
              }}
            >
              {/* Selection indicator / type icon */}
              <div style={{
                flexShrink: 0, width: 34, height: 34, borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: isSelected ? 16 : 15,
                background: isSelected ? theme.primary : tc.bg,
                color: isSelected ? "#fff" : "inherit",
                transition: "all 0.15s",
              }}>
                {isSelected ? "✓" : tc.icon}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                  {f.categories.map((cat) => (
                    <span key={cat} style={{
                      fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
                      padding: "2px 7px", borderRadius: 4, background: theme.paperWarm, color: theme.muted,
                    }}>
                      {cat}
                    </span>
                  ))}
                  <span style={{ fontSize: 10, fontWeight: 600, color: tc.border }}>
                    {f.type === "identified" && "authorName" in f ? (f as any).authorName : f.type.toUpperCase()}
                  </span>
                  {sentimentBadge(f.sentimentLabel)}
                  <span style={{ fontSize: 11, color: theme.muted, marginLeft: "auto" }}>{timeAgo}</span>
                </div>

                <div style={{
                  fontSize: 13, color: "var(--admin-text, " + theme.ink + ")", lineHeight: 1.5, overflow: "hidden",
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", fontFamily: fontStack,
                }}>
                  {f.text}
                </div>

                {/* Footer row — hide individual actions when in multi-select mode */}
                {selected.size === 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, fontSize: 11, color: theme.muted }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc.color, display: "inline-block" }} />
                      {sc.label}
                    </span>
                    {isRelay && <span>#{(f as any).threadId}</span>}
                    {f.type === "anonymous" && <span>No reply possible</span>}
                    {f.status === "resolved" ? (
                      <span style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); updateFeedbackStatus(orgId, f.id, "archived"); }}
                          style={{
                            fontSize: 11, color: theme.muted,
                            background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontFamily: fontStack,
                          }}
                        >
                          📦 Archive
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); updateFeedbackStatus(orgId, f.id, "reopened"); }}
                          style={{
                            fontSize: 11, color: theme.accent,
                            background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontFamily: fontStack,
                          }}
                        >
                          ↩ Reopen
                        </button>
                      </span>
                    ) : f.status === "archived" ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); updateFeedbackStatus(orgId, f.id, "reopened"); }}
                        style={{
                          marginLeft: "auto", fontSize: 11, color: theme.accent,
                          background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontFamily: fontStack,
                        }}
                      >
                        ↩ Reopen
                      </button>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); updateFeedbackStatus(orgId, f.id, "resolved"); }}
                        style={{
                          marginLeft: "auto", fontSize: 11, color: theme.primary,
                          background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontFamily: fontStack,
                        }}
                      >
                        ✓ Resolve
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ====== Floating Action Bar ====== */}
      {selected.size > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 24px",
            background: "#1a1a2e",
            borderRadius: 16,
            boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
            zIndex: 90,
            fontFamily: fontStack,
            animation: "actionBarSlideUp 0.25s ease",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginRight: 4 }}>
            {selected.size} selected
          </span>

          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.12)" }} />

          {/* Resolve (only show if not on resolved view) */}
          {viewFilter !== "resolved" && (
            <button
              onClick={handleBatchResolve}
              disabled={batchLoading}
              style={{
                padding: "7px 16px", borderRadius: 8, border: "none",
                background: "rgba(45,106,106,0.2)", color: "#a3c9c9",
                fontSize: 12, fontWeight: 700, cursor: batchLoading ? "wait" : "pointer",
                fontFamily: fontStack, transition: "all 0.15s",
              }}
            >
              ✓ Resolve
            </button>
          )}

          <button
            onClick={handleBatchArchive}
            disabled={batchLoading}
            style={{
              padding: "7px 16px", borderRadius: 8, border: "none",
              background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)",
              fontSize: 12, fontWeight: 700, cursor: batchLoading ? "wait" : "pointer",
              fontFamily: fontStack, transition: "all 0.15s",
            }}
          >
            📦 Archive
          </button>

          <button
            onClick={handleBatchDelete}
            disabled={batchLoading}
            style={{
              padding: "7px 16px", borderRadius: 8, border: "none",
              background: confirmDelete ? "#dc2626" : "rgba(220,38,38,0.15)",
              color: confirmDelete ? "#fff" : "#f87171",
              fontSize: 12, fontWeight: 700, cursor: batchLoading ? "wait" : "pointer",
              fontFamily: fontStack, transition: "all 0.15s",
            }}
          >
            {confirmDelete ? `Delete ${selected.size} permanently?` : "🗑️ Delete"}
          </button>

          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.12)" }} />

          <button
            onClick={() => { setSelected(new Set()); setLastClickedId(null); setConfirmDelete(false); }}
            style={{
              padding: "7px 12px", borderRadius: 8, border: "none",
              background: "transparent", color: "rgba(255,255,255,0.4)",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              fontFamily: fontStack,
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

// ── Quick Start Checklist ──────────────────────────────────────
function QuickStartChecklist({
  org,
  onNavigate,
  theme,
}: {
  org?: { slug?: string; logoUrl?: string | null; submissionCount?: number } | null;
  onNavigate?: (view: string) => void;
  theme: BrandTheme;
}) {
  const slug = org?.slug || "";
  const hasLogo = !!org?.logoUrl;
  const hasSubmissions = (org?.submissionCount ?? 0) > 0;

  const items: { icon: string; label: string; done: boolean; action: () => void }[] = [
    {
      icon: "📬",
      label: "Submit your first test feedback",
      done: hasSubmissions,
      action: () => slug && window.open(`/${slug}`, "_blank"),
    },
    {
      icon: "🎨",
      label: "Upload your logo",
      done: hasLogo,
      action: () => onNavigate?.("branding"),
    },
    {
      icon: "📱",
      label: "Generate a QR code",
      done: false,
      action: () => onNavigate?.("qr"),
    },
    {
      icon: "📋",
      label: "Create your first survey",
      done: false,
      action: () => onNavigate?.("surveys"),
    },
    {
      icon: "🔗",
      label: "Share your form link with your community",
      done: false,
      action: () => slug && window.open(`https://tellsafe.app/${slug}`, "_blank"),
    },
  ];

  const doneCount = items.filter((i) => i.done).length;

  return (
    <div style={{
      background: "#fff",
      borderRadius: 18,
      padding: "28px 28px 24px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      fontFamily: fontStack,
      margin: "8px 0",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <h3 style={{ fontFamily: displayFont, fontSize: 18, fontWeight: 600, margin: "0 0 4px", color: "#1a1a2e" }}>
            🚀 Get started
          </h3>
          <p style={{ fontSize: 13, color: theme.muted, margin: 0 }}>
            {doneCount === items.length
              ? "You're all set! Feedback will appear here."
              : `${doneCount} of ${items.length} done`}
          </p>
        </div>
        {/* Progress ring */}
        <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
          <svg width="44" height="44" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="22" cy="22" r="18" fill="none" stroke="#e8e5de" strokeWidth="4" />
            <circle
              cx="22" cy="22" r="18" fill="none"
              stroke={theme.primary} strokeWidth="4"
              strokeDasharray={`${(doneCount / items.length) * 113} 113`}
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray 0.4s ease" }}
            />
          </svg>
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: theme.primary,
          }}>
            {doneCount}/{items.length}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((item, i) => (
          <button
            key={i}
            onClick={item.action}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "11px 14px",
              border: `1.5px solid ${item.done ? "#d1fae5" : theme.divider}`,
              borderRadius: 12,
              background: item.done ? "#f0fdf4" : "#fafaf9",
              cursor: item.done ? "default" : "pointer",
              textAlign: "left", fontFamily: fontStack,
              transition: "all 0.15s",
            }}
          >
            {/* Checkbox */}
            <div style={{
              width: 22, height: 22, borderRadius: 6, flexShrink: 0,
              border: `2px solid ${item.done ? "#059669" : theme.divider}`,
              background: item.done ? "#059669" : "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, color: "#fff", fontWeight: 700,
              transition: "all 0.15s",
            }}>
              {item.done ? "✓" : ""}
            </div>
            <span style={{ fontSize: 14 }}>{item.icon}</span>
            <span style={{
              fontSize: 14, fontWeight: 500,
              color: item.done ? "#059669" : "#1a1a2e",
              textDecoration: item.done ? "line-through" : "none",
              opacity: item.done ? 0.7 : 1,
            }}>
              {item.label}
            </span>
            {!item.done && (
              <span style={{ marginLeft: "auto", fontSize: 12, color: theme.muted }}>→</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

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
