// ============================================================
// TellSafe — Privacy Mode Selector
// ============================================================

"use client";

import React from "react";
import { useBrand } from "./BrandProvider";
import type { FeedbackType } from "../types";

interface PrivacyConfig {
  color: string;
  glow: string;
  icon: string;
  label: string;
  desc: string;
  banner: string;
  btnText: string;
}

function getPrivacyConfig(theme: ReturnType<typeof useBrand>["theme"]): Record<FeedbackType, PrivacyConfig> {
  return {
    identified: {
      color: theme.accent,
      glow: theme.accentGlow,
      icon: "👋",
      label: "Identified",
      desc: "Share your name & email",
      banner: "Your name and email will be visible to organizers so they can follow up directly.",
      btnText: "Send Feedback",
    },
    anonymous: {
      color: theme.primary,
      glow: theme.primaryGlow,
      icon: "👤",
      label: "Anonymous",
      desc: "Fully private, no replies",
      banner: "No identifying information is collected. Your feedback cannot be traced or replied to.",
      btnText: "Send Anonymously",
    },
    relay: {
      color: theme.violet,
      glow: theme.violetGlow,
      icon: "🔀",
      label: "Anonymous Relay",
      desc: "Stay hidden, get replies",
      banner: "Your email is encrypted and hidden. Organizers reply through TellSafe — you get their response without them seeing who you are.",
      btnText: "Send via Anonymous Relay",
    },
  };
}

interface Props {
  value: FeedbackType;
  onChange: (type: FeedbackType) => void;
  relayEnabled: boolean; // false on free plan
}

export default function PrivacySelector({ value, onChange, relayEnabled }: Props) {
  const { theme } = useBrand();
  const config = getPrivacyConfig(theme);
  const current = config[value];

  const types: FeedbackType[] = relayEnabled
    ? ["identified", "anonymous", "relay"]
    : ["identified", "anonymous"];

  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: theme.muted,
          marginBottom: 10,
          fontFamily: "'Outfit', system-ui, sans-serif",
        }}
      >
        How would you like to share?
      </label>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {types.map((type) => {
          const cfg = config[type];
          const active = value === type;
          return (
            <button
              key={type}
              onClick={() => onChange(type)}
              style={{
                flex: 1,
                minWidth: 135,
                border: `2px solid ${active ? cfg.color : theme.divider}`,
                borderRadius: 14,
                padding: "16px 12px",
                cursor: "pointer",
                background: active ? cfg.glow : theme.white,
                transition: "all 0.25s",
                textAlign: "center",
                outline: "none",
                position: "relative",
                fontFamily: "'Outfit', system-ui, sans-serif",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  border: `2px solid ${active ? cfg.color : theme.divider}`,
                  background: active ? cfg.color : "transparent",
                  boxShadow: active ? `inset 0 0 0 2.5px ${theme.white}` : "none",
                  transition: "all 0.2s",
                }}
              />
              <div style={{ fontSize: 22, marginBottom: 4 }}>{cfg.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: theme.ink }}>
                {cfg.label}
              </div>
              <div style={{ fontSize: 11, color: theme.muted, lineHeight: 1.35 }}>
                {cfg.desc}
              </div>
            </button>
          );
        })}
      </div>

      {/* Privacy banner */}
      <div
        style={{
          padding: "12px 14px",
          borderRadius: 10,
          marginBottom: 22,
          fontSize: 13,
          lineHeight: 1.55,
          display: "flex",
          gap: 10,
          background: current.glow,
          color: current.color,
          border: `1px solid ${current.color}22`,
          transition: "all 0.3s",
          fontFamily: "'Outfit', system-ui, sans-serif",
        }}
      >
        <span style={{ fontSize: 15, flexShrink: 0 }}>
          {value === "identified" ? "💬" : value === "anonymous" ? "🔒" : "🔀"}
        </span>
        <span>{current.banner}</span>
      </div>
    </div>
  );
}

export { getPrivacyConfig };
export type { PrivacyConfig };
