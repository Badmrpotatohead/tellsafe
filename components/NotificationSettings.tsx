// ============================================================
// TellSafe — Notification Preferences Component
// ============================================================
// Each admin can configure their own email notification prefs.
// Stored per-admin in organizations/{orgId}/admins/{uid}

"use client";

import React, { useState, useEffect } from "react";
import { useBrand } from "./BrandProvider";
import { useAuth } from "./AuthProvider";
import { getOrgAdmins, updateAdminNotificationPrefs } from "../lib/data";
import type { OrgAdmin } from "../types";

const fontStack = "'Outfit', system-ui, sans-serif";
const displayFont = "'Fraunces', Georgia, serif";

interface Props {
  orgId: string;
}

interface ToggleRowProps {
  icon: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  saving?: boolean;
}

function ToggleRow({ icon, label, description, checked, onChange, saving }: ToggleRowProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        padding: "16px 0",
        borderBottom: "1px solid var(--admin-divider, rgba(26,26,46,0.08))",
      }}
    >
      <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--admin-text, #1a1a2e)", marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontSize: 12, color: "var(--admin-text-muted, #8a8578)", lineHeight: 1.5 }}>
          {description}
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        disabled={saving}
        aria-checked={checked}
        role="switch"
        style={{
          position: "relative",
          width: 44,
          height: 24,
          borderRadius: 12,
          border: "none",
          background: checked ? "var(--admin-primary, #2d6a6a)" : "var(--admin-border, rgba(26,26,46,0.15))",
          cursor: saving ? "wait" : "pointer",
          flexShrink: 0,
          transition: "background 0.2s",
          marginTop: 2,
          opacity: saving ? 0.6 : 1,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 22 : 2,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
            transition: "left 0.2s",
          }}
        />
      </button>
    </div>
  );
}

export default function NotificationSettings({ orgId }: Props) {
  const { theme } = useBrand();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [myPrefs, setMyPrefs] = useState({
    emailOnNewFeedback: true,
    emailOnUrgent: true,
    emailOnSurveyResponse: false,
  });

  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);
    getOrgAdmins(orgId)
      .then((admins) => {
        const me = admins.find((a) => a.id === user.uid);
        if (me) {
          setMyPrefs({
            emailOnNewFeedback: me.emailOnNewFeedback !== false,
            emailOnUrgent: me.emailOnUrgent !== false,
            emailOnSurveyResponse: me.emailOnSurveyResponse === true,
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [orgId, user?.uid]);

  const handleToggle = async (key: keyof typeof myPrefs, value: boolean) => {
    if (!user?.uid) return;
    setSaving(key);
    const updated = { ...myPrefs, [key]: value };
    setMyPrefs(updated);
    try {
      await updateAdminNotificationPrefs(orgId, user.uid, { [key]: value });
    } catch (err) {
      console.error("Failed to update notification pref:", err);
      // Revert on error
      setMyPrefs((prev) => ({ ...prev, [key]: !value }));
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 36, fontFamily: fontStack }}>
        <div style={{ color: "var(--admin-text-muted, #8a8578)", fontSize: 14 }}>
          Loading notification preferences...
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560, fontFamily: fontStack }}>
      <h2
        style={{
          fontFamily: displayFont,
          fontSize: 22,
          fontWeight: 600,
          marginBottom: 6,
          color: "var(--admin-text, #1a1a2e)",
        }}
      >
        Notification Preferences
      </h2>
      <p
        style={{
          fontSize: 13,
          color: "var(--admin-text-muted, #8a8578)",
          marginBottom: 28,
          lineHeight: 1.6,
        }}
      >
        Choose which email notifications you receive. These settings only affect your account
        — other team members manage their own preferences.
      </p>

      {/* Email notifications section */}
      <div
        style={{
          background: "var(--admin-card, #fff)",
          borderRadius: 16,
          padding: "8px 24px",
          boxShadow: "var(--admin-shadow, 0 4px 20px rgba(26,26,46,0.07))",
          marginBottom: 24,
        }}
      >
        <ToggleRow
          icon="✉️"
          label="New feedback submitted"
          description="Get an email whenever someone submits feedback to your organization."
          checked={myPrefs.emailOnNewFeedback}
          onChange={(val) => handleToggle("emailOnNewFeedback", val)}
          saving={saving === "emailOnNewFeedback"}
        />
        <ToggleRow
          icon="🚨"
          label="Urgent or safety-related feedback"
          description="Get an email when feedback is detected as urgent or safety-related, even if you've turned off regular notifications."
          checked={myPrefs.emailOnUrgent}
          onChange={(val) => handleToggle("emailOnUrgent", val)}
          saving={saving === "emailOnUrgent"}
        />
        <div style={{ borderBottom: "none" }}>
          <ToggleRow
            icon="📋"
            label="Survey responses"
            description="Get an email when someone submits a response to one of your surveys."
            checked={myPrefs.emailOnSurveyResponse}
            onChange={(val) => handleToggle("emailOnSurveyResponse", val)}
            saving={saving === "emailOnSurveyResponse"}
          />
        </div>
      </div>

      {/* Info note */}
      <div
        style={{
          background: "var(--admin-primary-soft, rgba(45,106,106,0.10))",
          borderRadius: 12,
          padding: 16,
          fontSize: 13,
          color: "var(--admin-primary, #2d6a6a)",
          lineHeight: 1.6,
        }}
      >
        <strong>Note:</strong> Slack and Discord webhook notifications are shared with your
        whole team and managed separately in{" "}
        <span style={{ fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}>
          Integrations
        </span>.
      </div>
    </div>
  );
}
