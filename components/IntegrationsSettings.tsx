// ============================================================
// TellSafe — Integrations Settings Component
// ============================================================
// Admin view for configuring Slack/Discord webhook integration.

"use client";

import React, { useState, useEffect } from "react";
import { updateOrganization } from "../lib/data";
import { useBrand } from "./BrandProvider";
import { useAuth } from "./AuthProvider";

const fontStack = "'Outfit', system-ui, sans-serif";
const displayFont = "'Fraunces', Georgia, serif";

interface Props {
  orgId: string;
}

export default function IntegrationsSettings({ orgId }: Props) {
  const { theme } = useBrand();
  const { org, refreshOrg } = useAuth();

  const [webhookUrl, setWebhookUrl] = useState(org?.webhookUrl || "");
  const [webhookEnabled, setWebhookEnabled] = useState(org?.webhookEnabled || false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [accordionOpen, setAccordionOpen] = useState<"slack" | "discord" | null>(null);

  // Sync initial values when org loads/changes
  useEffect(() => {
    if (org) {
      setWebhookUrl(org.webhookUrl || "");
      setWebhookEnabled(org.webhookEnabled || false);
    }
  }, [org]);

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px 14px",
    border: `1.5px solid ${theme.divider}`,
    borderRadius: 10,
    fontSize: 14,
    color: theme.ink,
    background: theme.paper,
    outline: "none",
    fontFamily: fontStack,
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 5,
    color: theme.ink,
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl.trim()) {
      setToast({ message: "Please enter a webhook URL first.", type: "error" });
      return;
    }

    setTesting(true);
    try {
      const res = await fetch("/api/webhook/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, webhookUrl: webhookUrl.trim() }),
      });

      if (res.ok) {
        setToast({ message: "Test message sent successfully! Check your channel.", type: "success" });
      } else {
        const data = await res.json().catch(() => ({}));
        setToast({ message: data.error || "Test failed. Please check your webhook URL.", type: "error" });
      }
    } catch (err) {
      console.error("Webhook test failed:", err);
      setToast({ message: "Test failed. Please check your webhook URL and try again.", type: "error" });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateOrganization(orgId, {
        webhookUrl: webhookUrl.trim() || null,
        webhookEnabled,
      });
      await refreshOrg();
      setToast({ message: "Integration settings saved.", type: "success" });
    } catch (err) {
      console.error("Save failed:", err);
      setToast({ message: "Failed to save settings. Please try again.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const toggleAccordion = (section: "slack" | "discord") => {
    setAccordionOpen(accordionOpen === section ? null : section);
  };

  return (
    <div style={{ maxWidth: 520, fontFamily: fontStack }}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 24,
            right: 24,
            padding: "14px 22px",
            background: toast.type === "success" ? "#059669" : "#dc2626",
            color: "#fff",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            fontFamily: fontStack,
            zIndex: 1000,
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            maxWidth: 380,
            lineHeight: 1.4,
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <h2 style={{ fontFamily: displayFont, fontSize: 22, fontWeight: 600, margin: "0 0 6px" }}>
        Integrations
      </h2>
      <p style={{ fontSize: 13, color: theme.muted, marginBottom: 28, lineHeight: 1.6 }}>
        Connect TellSafe to your team's communication tools.
      </p>

      {/* Webhook Card */}
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          border: `1.5px solid ${theme.divider}`,
          padding: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <h3 style={{ fontFamily: fontStack, fontSize: 16, fontWeight: 700, margin: "0 0 6px", color: theme.ink }}>
          Slack / Discord Webhook
        </h3>
        <p style={{ fontSize: 13, color: theme.muted, margin: "0 0 22px", lineHeight: 1.5 }}>
          Automatically post new feedback to a Slack or Discord channel.
        </p>

        {/* Webhook URL */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Webhook URL</label>
          <input
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://hooks.slack.com/services/... or https://discord.com/api/webhooks/..."
            style={inputStyle}
          />
        </div>

        {/* Enable/Disable Toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 22,
            padding: "12px 16px",
            background: theme.paper,
            borderRadius: 12,
            border: `1px solid ${theme.divider}`,
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: theme.ink }}>
              Enable Webhook
            </div>
            <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>
              {webhookEnabled ? "New feedback will be posted to your channel." : "Webhook is currently disabled."}
            </div>
          </div>
          <button
            onClick={() => setWebhookEnabled(!webhookEnabled)}
            style={{
              position: "relative",
              width: 44,
              height: 24,
              borderRadius: 12,
              border: "none",
              background: webhookEnabled ? "#059669" : "#d1d5db",
              cursor: "pointer",
              transition: "background 0.25s ease",
              flexShrink: 0,
              padding: 0,
            }}
            aria-label={webhookEnabled ? "Disable webhook" : "Enable webhook"}
          >
            <div
              style={{
                position: "absolute",
                top: 2,
                left: webhookEnabled ? 22 : 2,
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                transition: "left 0.25s ease",
              }}
            />
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          <button
            onClick={handleTestWebhook}
            disabled={testing || !webhookUrl.trim()}
            style={{
              padding: "10px 20px",
              border: `1.5px solid ${theme.divider}`,
              borderRadius: 10,
              background: "#fff",
              color: testing || !webhookUrl.trim() ? theme.muted : theme.ink,
              fontSize: 13,
              fontWeight: 600,
              cursor: testing || !webhookUrl.trim() ? "not-allowed" : "pointer",
              fontFamily: fontStack,
              opacity: testing || !webhookUrl.trim() ? 0.5 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {testing ? "Sending..." : "Test Webhook"}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "10px 20px",
              border: "none",
              borderRadius: 10,
              background: theme.primary,
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              fontFamily: fontStack,
              opacity: saving ? 0.6 : 1,
              transition: "opacity 0.2s",
              flex: 1,
            }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>

        {/* Setup Instructions Accordion */}
        <div style={{ borderTop: `1px solid ${theme.divider}`, paddingTop: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: theme.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
            Setup Instructions
          </div>

          {/* Slack Accordion */}
          <div style={{ marginBottom: 6 }}>
            <button
              onClick={() => toggleAccordion("slack")}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                background: accordionOpen === "slack" ? theme.paper : "#fff",
                border: `1px solid ${theme.divider}`,
                borderRadius: accordionOpen === "slack" ? "10px 10px 0 0" : 10,
                cursor: "pointer",
                fontFamily: fontStack,
                fontSize: 13,
                fontWeight: 600,
                color: theme.ink,
                transition: "background 0.2s",
              }}
            >
              <span>Slack</span>
              <span
                style={{
                  fontSize: 11,
                  color: theme.muted,
                  transform: accordionOpen === "slack" ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                  display: "inline-block",
                }}
              >
                ▼
              </span>
            </button>
            {accordionOpen === "slack" && (
              <div
                style={{
                  padding: "14px 16px",
                  background: theme.paper,
                  border: `1px solid ${theme.divider}`,
                  borderTop: "none",
                  borderRadius: "0 0 10px 10px",
                  fontSize: 13,
                  color: theme.ink,
                  lineHeight: 1.7,
                }}
              >
                <ol style={{ margin: 0, paddingLeft: 18 }}>
                  <li style={{ marginBottom: 4 }}>
                    Go to your Slack workspace settings &rarr; Apps &rarr; Incoming Webhooks.
                  </li>
                  <li style={{ marginBottom: 4 }}>
                    Create a new webhook and choose a channel.
                  </li>
                  <li>
                    Copy the webhook URL and paste it above.
                  </li>
                </ol>
              </div>
            )}
          </div>

          {/* Discord Accordion */}
          <div>
            <button
              onClick={() => toggleAccordion("discord")}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                background: accordionOpen === "discord" ? theme.paper : "#fff",
                border: `1px solid ${theme.divider}`,
                borderRadius: accordionOpen === "discord" ? "10px 10px 0 0" : 10,
                cursor: "pointer",
                fontFamily: fontStack,
                fontSize: 13,
                fontWeight: 600,
                color: theme.ink,
                transition: "background 0.2s",
              }}
            >
              <span>Discord</span>
              <span
                style={{
                  fontSize: 11,
                  color: theme.muted,
                  transform: accordionOpen === "discord" ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                  display: "inline-block",
                }}
              >
                ▼
              </span>
            </button>
            {accordionOpen === "discord" && (
              <div
                style={{
                  padding: "14px 16px",
                  background: theme.paper,
                  border: `1px solid ${theme.divider}`,
                  borderTop: "none",
                  borderRadius: "0 0 10px 10px",
                  fontSize: 13,
                  color: theme.ink,
                  lineHeight: 1.7,
                }}
              >
                <ol style={{ margin: 0, paddingLeft: 18 }}>
                  <li style={{ marginBottom: 4 }}>
                    Open your Discord server &rarr; Channel Settings &rarr; Integrations &rarr; Webhooks.
                  </li>
                  <li style={{ marginBottom: 4 }}>
                    Create a new webhook and choose a channel.
                  </li>
                  <li>
                    Copy the webhook URL and paste it above.
                  </li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
