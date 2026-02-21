// ============================================================
// TellSafe — Relay Thread Component
// ============================================================

"use client";

import React, { useState, useEffect, useRef } from "react";
import { useBrand } from "./BrandProvider";
import {
  subscribeThreadMessages,
  getTemplates,
  trackTemplateUsage,
} from "../lib/data";
import { auth } from "../lib/firebase";
import { useAuth } from "./AuthProvider";
import type { ThreadMessage, ResponseTemplate } from "../types";
import { PLAN_LIMITS } from "../types";

const fontStack = "'Outfit', system-ui, sans-serif";
const displayFont = "'Fraunces', Georgia, serif";

interface Props {
  orgId: string;
  threadId: string;
  feedbackId: string;
  onBack: () => void;
}

export default function RelayThread({ orgId, threadId, feedbackId, onBack }: Props) {
  const { theme } = useBrand();
  const { user, org } = useAuth();
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [templates, setTemplates] = useState<ResponseTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const hasTemplates = org ? PLAN_LIMITS[org.plan].hasTemplates : false;

  // Real-time messages
  useEffect(() => {
    const unsubscribe = subscribeThreadMessages(orgId, threadId, (msgs) => {
      setMessages(msgs);
      // Scroll to bottom on new message
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsubscribe();
  }, [orgId, threadId]);

  // Load templates
  useEffect(() => {
    if (!hasTemplates) return;
    getTemplates(orgId).then(setTemplates).catch(console.error);
  }, [orgId, hasTemplates]);

  const handleSend = async () => {
    if (!replyText.trim() || sending) return;
    setSending(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/relay/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orgId,
          threadId,
          text: replyText.trim(),
          authorName: user?.displayName || "Organizer",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send reply");
      }
      setReplyText("");
    } catch (err) {
      console.error("Failed to send reply:", err);
    } finally {
      setSending(false);
    }
  };

  const useTemplate = (template: ResponseTemplate) => {
    setReplyText(template.body);
    setShowTemplates(false);
    trackTemplateUsage(orgId, template.id).catch(console.error);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${theme.violetGlow}, transparent), ${theme.paper}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "24px 16px 80px",
        fontFamily: fontStack,
      }}
    >
      {/* Header */}
      <div style={{ width: "100%", maxWidth: 580, marginBottom: 20 }}>
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            color: theme.violet,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: 12,
            fontFamily: fontStack,
          }}
        >
          ← Back to Inbox
        </button>

        <div style={{ textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 14px",
              background: theme.violetGlow,
              borderRadius: 100,
              fontSize: 12,
              fontWeight: 700,
              color: theme.violet,
              marginBottom: 10,
            }}
          >
            🔀 Thread #{threadId.slice(0, 8)}
          </div>
          <h1
            style={{
              fontFamily: displayFont,
              fontSize: 22,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Anonymous Relay
          </h1>
          <p style={{ fontSize: 13, color: theme.muted }}>
            Replies are delivered via encrypted email relay.
          </p>
        </div>
      </div>

      {/* Messages */}
      <div style={{ width: "100%", maxWidth: 580, position: "relative" }}>
        {/* Timeline line */}
        <div
          style={{
            position: "absolute",
            left: 26,
            top: 20,
            bottom: 100,
            width: 2,
            background: `linear-gradient(to bottom, ${theme.violetSoft}, ${theme.divider})`,
          }}
        />

        {messages.map((msg, i) => {
          const isMember = msg.from === "member";
          return (
            <div
              key={msg.id}
              style={{
                background: theme.white,
                borderRadius: 18,
                padding: 22,
                marginBottom: 14,
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                marginLeft: 44,
                position: "relative",
                animation: `fadeUp 0.4s ease ${i * 0.06}s both`,
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  position: "absolute",
                  left: -44,
                  top: 22,
                  width: 30,
                  height: 30,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 700,
                  background: isMember ? theme.violetSoft : theme.accentSoft,
                  color: isMember ? theme.violet : theme.accent,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                {isMember ? "?" : msg.authorName?.[0] || "A"}
              </div>

              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontWeight: 700, fontSize: 13 }}>
                  {isMember ? "Anonymous Member" : msg.authorName || "Organizer"}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: "2px 7px",
                    borderRadius: 4,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    background: isMember ? theme.violetGlow : theme.accentGlow,
                    color: isMember ? theme.violet : theme.accent,
                  }}
                >
                  {isMember ? "Relay" : "Organizer"}
                </span>
                <span style={{ marginLeft: "auto", fontSize: 11, color: theme.muted }}>
                  {formatTime(msg.createdAt)}
                </span>
              </div>

              {/* Body */}
              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: theme.ink,
                  whiteSpace: "pre-wrap",
                }}
              >
                {msg.text}
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />

        {/* Reply box */}
        <div
          style={{
            background: theme.white,
            borderRadius: 18,
            padding: 18,
            marginLeft: 44,
            boxShadow: theme.shadow,
            border: `2px solid ${theme.accentSoft}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                color: theme.accent,
              }}
            >
              ✏️ Reply as Organizer
            </div>

            {/* Template picker toggle */}
            {hasTemplates && templates.length > 0 && (
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: theme.violet,
                  background: showTemplates ? theme.violetGlow : "none",
                  border: `1px solid ${showTemplates ? theme.violet : "transparent"}`,
                  borderRadius: 6,
                  padding: "3px 10px",
                  cursor: "pointer",
                  fontFamily: fontStack,
                }}
              >
                📋 Templates
              </button>
            )}
          </div>

          {/* Templates dropdown */}
          {showTemplates && (
            <div
              style={{
                background: theme.paper,
                borderRadius: 10,
                padding: 8,
                marginBottom: 10,
                border: `1px solid ${theme.divider}`,
                maxHeight: 160,
                overflowY: "auto",
              }}
            >
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => useTemplate(t)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 10px",
                    borderRadius: 6,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 12,
                    color: theme.ink,
                    fontFamily: fontStack,
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.background = theme.white)
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>{t.title}</div>
                  <div
                    style={{
                      color: theme.muted,
                      fontSize: 11,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t.body}
                  </div>
                </button>
              ))}
            </div>
          )}

          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            style={{
              width: "100%",
              border: `1.5px solid ${theme.divider}`,
              borderRadius: 10,
              padding: 11,
              fontSize: 14,
              minHeight: 72,
              resize: "none",
              outline: "none",
              background: theme.paper,
              lineHeight: 1.6,
              fontFamily: fontStack,
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend();
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 8,
            }}
          >
            <span style={{ fontSize: 11, color: theme.muted }}>
              🔒 Identity protected both ways
              <span style={{ marginLeft: 12, opacity: 0.6 }}>⌘ + Enter to send</span>
            </span>
            <button
              onClick={handleSend}
              disabled={!replyText.trim() || sending}
              style={{
                padding: "8px 22px",
                background: replyText.trim() && !sending ? theme.accent : theme.muted,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: replyText.trim() && !sending ? "pointer" : "not-allowed",
                opacity: replyText.trim() && !sending ? 1 : 0.5,
                fontFamily: fontStack,
              }}
            >
              {sending ? "Sending..." : "Send Reply →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
