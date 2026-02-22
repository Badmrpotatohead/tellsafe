// ============================================================
// TellSafe — Feedback Detail Panel with In-App Reply
// ============================================================

"use client";

import React, { useState, useEffect, useRef } from "react";
import { useBrand } from "./BrandProvider";
import { useAuth } from "./AuthProvider";
import {
  updateFeedbackStatus,
  updateFeedbackCategories,
  getOrCreateThread,
  sendAdminReply,
  subscribeThreadMessages,
  getTemplates,
  trackTemplateUsage,
} from "../lib/data";
import { PLAN_LIMITS } from "../types";
import type { Feedback, FeedbackStatus, ThreadMessage, ResponseTemplate } from "../types";

const fontStack = "'Outfit', system-ui, sans-serif";

interface Props {
  orgId: string;
  feedback: Feedback;
  onClose: () => void;
}

export default function FeedbackDetail({ orgId, feedback: f, onClose }: Props) {
  const { theme } = useBrand();
  const { user, org } = useAuth();
  const [status, setStatus] = useState<FeedbackStatus>(f.status);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [threadId, setThreadId] = useState<string | null>((f as any).threadId || null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [templates, setTemplates] = useState<ResponseTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingCategories, setEditingCategories] = useState(false);
  const [editCats, setEditCats] = useState<string[]>(f.categories);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reset state when switching feedback items
  useEffect(() => {
    setStatus(f.status);
    setReplyText("");
    setSending(false);
    setThreadId((f as any).threadId || null);
    setMessages([]);
    setLoadingThread(false);
    setShowTemplates(false);
    setEditingCategories(false);
    setEditCats(f.categories);
  }, [f.id]);

  const hasTemplates = org ? PLAN_LIMITS[org.plan].hasTemplates : false;

  // Load templates
  useEffect(() => {
    if (hasTemplates) {
      getTemplates(orgId).then(setTemplates).catch(() => {});
    }
  }, [orgId, hasTemplates]);

  // Subscribe to messages when thread exists
  useEffect(() => {
    if (!threadId) return;
    const unsub = subscribeThreadMessages(orgId, threadId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return unsub;
  }, [orgId, threadId]);

  const handleStatusChange = async (newStatus: FeedbackStatus) => {
    try {
      await updateFeedbackStatus(orgId, f.id, newStatus);
      setStatus(newStatus);
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || sending) return;
    setSending(true);

    try {
      // Get or create thread
      let tid = threadId;
      if (!tid) {
        setLoadingThread(true);
        tid = await getOrCreateThread(orgId, f.id);
        setThreadId(tid);
        setLoadingThread(false);
      }

      const adminName = user?.displayName || "Admin";
      await sendAdminReply(orgId, tid, replyText.trim(), adminName);

      // Auto-update status to replied
      if (status === "new" || status === "needs_reply" || status === "reopened") {
        await updateFeedbackStatus(orgId, f.id, "replied");
        setStatus("replied");
      }

      setReplyText("");
    } catch (err) {
      console.error("Failed to send reply:", err);
      setLoadingThread(false);
    } finally {
      setSending(false);
    }
  };

  // Normalize field names
  const contactName = (f as any).authorName || (f as any).name || null;
  const contactEmail = (f as any).authorEmail || (f as any).email || null;
  const canReply = f.type === "identified" || f.type === "relay";

  const typeLabels: Record<string, { icon: string; label: string; color: string }> = {
    identified: { icon: "👋", label: "Identified", color: theme.accent },
    anonymous: { icon: "👤", label: "Anonymous", color: theme.primary },
    relay: { icon: "🔀", label: "Anonymous Relay", color: theme.violet },
  };
  const tc = typeLabels[f.type] || typeLabels.anonymous;

  const allStatusOptions: { value: FeedbackStatus; label: string; color: string }[] = [
    { value: "new", label: "New", color: theme.accent },
    { value: "needs_reply", label: "Needs Reply", color: theme.accent },
    { value: "replied", label: "Replied", color: theme.primary },
    { value: "reopened", label: "↩ Reopened", color: "#d97706" },
    { value: "resolved", label: "Resolved", color: theme.muted },
    { value: "archived", label: "📦 Archive", color: theme.muted },
  ];

  // Hide reply-related statuses for anonymous feedback (no way to reply)
  const statusOptions = f.type === "anonymous"
    ? allStatusOptions.filter((o) => o.value !== "needs_reply" && o.value !== "replied" && o.value !== "reopened")
    : allStatusOptions;

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };

  return (
    <>
    {/* Backdrop — click outside to close */}
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99,
        background: "rgba(0,0,0,0.15)",
        animation: "fadeInBackdrop 0.2s ease",
      }}
    />
    <div
      className="admin-feedback-detail"
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: 500,
        background: "var(--admin-card, #fff)",
        boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        fontFamily: fontStack,
        animation: "slideInRight 0.25s ease",
        color: "var(--admin-text, #1a1a2e)",
      }}
    >
      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fadeInBackdrop { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {/* ====== Back button (visible on small screens via CSS) ====== */}
      <button
        className="admin-detail-back"
        onClick={onClose}
        style={{
          display: "none",
          alignItems: "center",
          gap: 6,
          padding: "10px 20px",
          background: "var(--admin-bg-alt, #f8f6f1)",
          border: "none",
          borderBottom: "1px solid var(--admin-border, #e8e5de)",
          fontSize: 13,
          fontWeight: 600,
          color: "var(--admin-primary, #2d6a6a)",
          cursor: "pointer",
          fontFamily: fontStack,
          flexShrink: 0,
        }}
      >
        ← Back to Inbox
      </button>

      {/* ====== Header ====== */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--admin-border, #e8e5de)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
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
            color: "#8a8578",
            padding: "4px 8px",
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {/* ====== Scrollable Content ====== */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>

        {/* --- Feedback Info Section --- */}
        <div style={{ padding: "20px 20px 16px" }}>
          {/* Categories — clickable to edit */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
            {editingCategories ? (
              <>
                {(org?.categories || []).map((c) => {
                  const active = editCats.includes(c.label);
                  return (
                    <button
                      key={c.label}
                      onClick={() => setEditCats((prev) =>
                        prev.includes(c.label)
                          ? prev.filter((x) => x !== c.label)
                          : [...prev, c.label]
                      )}
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        padding: "3px 10px",
                        borderRadius: 6,
                        border: `1.5px solid ${active ? theme.primary : "var(--admin-border, #e8e5de)"}`,
                        background: active ? `${theme.primary}15` : "var(--admin-bg, #f2f0eb)",
                        color: active ? theme.primary : "var(--admin-text-muted, #8a8578)",
                        cursor: "pointer",
                        fontFamily: fontStack,
                        transition: "all 0.15s",
                      }}
                    >
                      {active ? "✓ " : ""}{c.emoji} {c.label}
                    </button>
                  );
                })}
                <button
                  onClick={async () => {
                    if (editCats.length > 0) {
                      await updateFeedbackCategories(orgId, f.id, editCats);
                    }
                    setEditingCategories(false);
                  }}
                  style={{
                    fontSize: 10, fontWeight: 700, padding: "3px 10px",
                    borderRadius: 6, border: "none", cursor: "pointer",
                    background: theme.primary, color: "#fff", fontFamily: fontStack,
                  }}
                >
                  ✓ Save
                </button>
                <button
                  onClick={() => { setEditCats(f.categories); setEditingCategories(false); }}
                  style={{
                    fontSize: 10, fontWeight: 600, padding: "3px 8px",
                    borderRadius: 6, border: "none", cursor: "pointer",
                    background: "transparent", color: "var(--admin-text-muted, #8a8578)", fontFamily: fontStack,
                  }}
                >
                  ✕
                </button>
              </>
            ) : (
              <>
                {f.categories.map((cat) => (
                  <span
                    key={cat}
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      padding: "3px 10px",
                      borderRadius: 6,
                      background: "var(--admin-bg, #f2f0eb)",
                      color: "var(--admin-text-muted, #8a8578)",
                    }}
                  >
                    {cat}
                  </span>
                ))}
                <button
                  onClick={() => { setEditCats(f.categories); setEditingCategories(true); }}
                  title="Edit categories"
                  style={{
                    fontSize: 10, color: "var(--admin-text-muted, #8a8578)", background: "none",
                    border: "none", cursor: "pointer", padding: "2px 4px", opacity: 0.6,
                    fontFamily: fontStack, transition: "opacity 0.15s",
                  }}
                >
                  ✏️
                </button>
              </>
            )}
          </div>

          {/* Timestamp */}
          <div style={{ fontSize: 11, color: "#8a8578", marginBottom: 14 }}>
            {new Date(f.createdAt).toLocaleString("en-US", {
              weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
            })}
          </div>

          {/* Contact info for identified */}
          {f.type === "identified" && contactName && (
            <div
              style={{
                background: `${theme.accent}08`,
                borderRadius: 10,
                padding: 14,
                marginBottom: 14,
                border: `1px solid ${theme.accent}18`,
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: theme.accent, marginBottom: 6 }}>
                Contact Info
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2, color: "var(--admin-text, #1a1a2e)" }}>
                {contactName}
              </div>
              {contactEmail && (
                <div style={{ fontSize: 12, color: theme.accent }}>{contactEmail}</div>
              )}
            </div>
          )}

          {/* Anonymous notice */}
          {f.type === "anonymous" && (
            <div
              style={{
                background: `${theme.primary}08`,
                borderRadius: 10,
                padding: 14,
                marginBottom: 14,
                fontSize: 13,
                color: theme.primary,
                border: `1px solid ${theme.primary}18`,
              }}
            >
              🔒 Fully anonymous — no way to reply or identify this person.
            </div>
          )}

          {/* Relay notice */}
          {f.type === "relay" && (
            <div
              style={{
                background: `${theme.violet}08`,
                borderRadius: 10,
                padding: 14,
                marginBottom: 14,
                fontSize: 13,
                color: theme.violet,
                border: `1px solid ${theme.violet}18`,
              }}
            >
              🔀 Anonymous Relay — replies are sent via encrypted email.
            </div>
          )}
        </div>

        {/* --- Conversation Thread --- */}
        <div style={{ flex: 1, padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Original feedback message */}
          <div style={{ display: "flex", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: `${tc.color}15`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              {f.type === "identified" ? "👋" : f.type === "relay" ? "🔀" : "👤"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--admin-text, #1a1a2e)" }}>
                  {f.type === "identified" ? (contactName || "Member") : "Anonymous Member"}
                </span>
                <span style={{ fontSize: 10, color: "var(--admin-text-muted, #8a8578)" }}>{formatTime(f.createdAt)}</span>
              </div>
              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: "var(--admin-text, #1a1a2e)",
                  background: "var(--admin-bg, #f8f6f1)",
                  borderRadius: "4px 14px 14px 14px",
                  padding: "12px 16px",
                  whiteSpace: "pre-wrap",
                }}
              >
                {f.text}
              </div>
            </div>
          </div>

          {/* Thread messages */}
          {messages.map((msg) => {
            const isAdmin = msg.from === "admin";
            return (
              <div key={msg.id} style={{ display: "flex", gap: 10, flexDirection: isAdmin ? "row-reverse" : "row" }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: isAdmin ? `${theme.primary}15` : `${tc.color}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                >
                  {isAdmin ? "🛡️" : "👤"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexDirection: isAdmin ? "row-reverse" : "row" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--admin-text, #1a1a2e)" }}>
                      {isAdmin ? (msg.authorName || "Admin") : "Member"}
                    </span>
                    <span style={{ fontSize: 10, color: "var(--admin-text-muted, #8a8578)" }}>{formatTime(msg.createdAt)}</span>
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      lineHeight: 1.6,
                      color: "var(--admin-text, #1a1a2e)",
                      background: isAdmin ? `${theme.primary}10` : "var(--admin-bg, #f8f6f1)",
                      borderRadius: isAdmin ? "14px 4px 14px 14px" : "4px 14px 14px 14px",
                      padding: "12px 16px",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ====== Footer ====== */}
      <div style={{ flexShrink: 0, borderTop: "1px solid var(--admin-border, #e8e5de)" }}>

        {/* Status bar */}
        <div style={{ padding: "12px 20px", display: "flex", gap: 6 }}>
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleStatusChange(opt.value)}
              style={{
                flex: 1,
                padding: "6px 4px",
                borderRadius: 6,
                border: `1.5px solid ${status === opt.value ? opt.color : "var(--admin-border, #e8e5de)"}`,
                background: status === opt.value ? opt.color + "12" : "var(--admin-card, #fff)",
                color: status === opt.value ? opt.color : "var(--admin-text-muted, #8a8578)",
                fontSize: 10,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: fontStack,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Reply input (only for identified and relay) */}
        {canReply && (
          <div style={{ padding: "0 20px 16px" }}>
            {/* Template picker */}
            {hasTemplates && templates.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#8a8578",
                    cursor: "pointer",
                    fontFamily: fontStack,
                    padding: "2px 0",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  📝 {showTemplates ? "Hide templates" : "Use a template"}
                  <span style={{ fontSize: 9, transform: showTemplates ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
                </button>
                {showTemplates && (
                  <div style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                    marginTop: 6,
                    padding: "8px 0",
                  }}>
                    {templates.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setReplyText(t.body);
                          setShowTemplates(false);
                          trackTemplateUsage(orgId, t.id).catch(() => {});
                        }}
                        style={{
                          padding: "5px 12px",
                          borderRadius: 8,
                          border: "1px solid var(--admin-border, #e8e5de)",
                          background: "var(--admin-bg, #f8f6f1)",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                          color: "var(--admin-text, #1a1a2e)",
                          fontFamily: fontStack,
                          transition: "all 0.15s",
                        }}
                        title={t.body}
                      >
                        {t.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  handleSendReply();
                }
              }}
              placeholder={
                f.type === "identified"
                  ? `Reply to ${contactName || "member"}...`
                  : "Reply anonymously via relay..."
              }
              rows={2}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: 10,
                border: "1.5px solid var(--admin-border, #e8e5de)",
                background: "var(--admin-input-bg, #fff)",
                color: "var(--admin-text, #1a1a2e)",
                fontSize: 13,
                fontFamily: fontStack,
                resize: "none",
                outline: "none",
                lineHeight: 1.5,
              }}
            />
            <button
              onClick={handleSendReply}
              disabled={!replyText.trim() || sending}
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                border: "none",
                background: replyText.trim() ? theme.primary : "#e8e5de",
                color: replyText.trim() ? "#fff" : "#8a8578",
                fontSize: 13,
                fontWeight: 700,
                cursor: replyText.trim() ? "pointer" : "default",
                fontFamily: fontStack,
                alignSelf: "flex-end",
                transition: "all 0.15s",
              }}
            >
              {sending ? "..." : "Send"}
            </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
