// ============================================================
// TellSafe — Public Feedback Form Component
// ============================================================

"use client";

import React, { useState } from "react";
import { useBrand } from "./BrandProvider";
import PrivacySelector, { getPrivacyConfig } from "./PrivacySelector";
import { submitFeedback } from "../lib/data";
import type { FeedbackType } from "../types";
import type { Organization } from "../types";

const fontStack = "'Outfit', 'DM Sans', system-ui, sans-serif";
const displayFont = "'Fraunces', Georgia, serif";

interface Props {
  org: Organization;
}

export default function FeedbackForm({ org }: Props) {
  const { theme, categories, tagline, orgName, logoUrl } = useBrand();
  const pConfig = getPrivacyConfig(theme);

  const [privacy, setPrivacy] = useState<FeedbackType>("identified");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cfg = pConfig[privacy];
  const relayEnabled = org.plan !== "free";

  const handleSubmit = async () => {
    if (!feedback.trim()) return;
    if (privacy === "identified" && !name.trim()) {
      setError("Please enter your name.");
      return;
    }
   if ((privacy === "identified" || privacy === "relay") && !email.trim()) {
      setError("Please enter your email.");
      return;
    }
    if ((privacy === "identified" || privacy === "relay") && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await submitFeedback(org.id, {
        orgSlug: org.slug,
        type: privacy,
        categories: selectedCats,
        text: feedback.trim(),
        authorName: privacy === "identified" ? name.trim() : undefined,
        authorEmail: privacy === "identified" ? email.trim() : undefined,
        relayEmail: privacy === "relay" ? email.trim() : undefined,
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Submit failed:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setFeedback("");
    setName("");
    setEmail("");
    setSelectedCats([]);
    setError(null);
  };

  // --- Success State ---
  if (submitted) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: `radial-gradient(ellipse 80% 50% at 30% 20%, ${theme.primaryGlow}, transparent), ${theme.paper}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fontStack,
        }}
      >
        <div
          style={{
            background: theme.white,
            borderRadius: 24,
            padding: 48,
            maxWidth: 500,
            width: "90%",
            boxShadow: theme.shadowLg,
            textAlign: "center",
            animation: "scaleIn 0.4s ease",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: theme.primaryGlow,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              margin: "0 auto 20px",
            }}
          >
            ✓
          </div>
          <h2
            style={{
              fontFamily: displayFont,
              fontSize: 26,
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            Feedback Sent!
          </h2>
          <p
            style={{
              color: theme.muted,
              fontSize: 15,
              lineHeight: 1.6,
              marginBottom: 28,
            }}
          >
            {privacy === "anonymous" &&
              "Your anonymous feedback has been delivered. No identifying information was stored."}
            {privacy === "identified" &&
              "Thanks for sharing openly! The organizers can reach out to you directly."}
            {privacy === "relay" &&
              "Sent via anonymous relay. You'll receive replies at your email without revealing your identity."}
          </p>
          <button
            onClick={resetForm}
            style={{
              padding: "12px 28px",
              borderRadius: 10,
              border: "none",
              background: theme.primary,
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: fontStack,
            }}
          >
            Submit More Feedback
          </button>
        </div>
      </div>
    );
  }

  // --- Form ---
  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(ellipse 80% 50% at 20% 10%, ${theme.primaryGlow}, transparent), radial-gradient(ellipse 50% 40% at 80% 80%, ${theme.accentGlow}, transparent), ${theme.paper}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 16px 80px",
        fontFamily: fontStack,
      }}
    >
      {/* Branded hero */}
      <div
        style={{
          textAlign: "center",
          maxWidth: 520,
          margin: "24px auto 32px",
          animation: "fadeUp 0.6s ease",
        }}
      >
        <div style={{ marginBottom: 18 }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={orgName}
              style={{
                height: 56,
                maxWidth: 200,
                objectFit: "contain",
                borderRadius: 8,
              }}
            />
          ) : (
            <div
              style={{
                width: 60,
                height: 60,
                margin: "0 auto",
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                borderRadius: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                color: "#fff",
                fontWeight: 700,
                boxShadow: `0 4px 20px ${theme.primaryGlow}`,
              }}
            >
              {orgName
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 3)}
            </div>
          )}
        </div>
        <h1
          style={{
            fontFamily: displayFont,
            fontSize: 32,
            fontWeight: 600,
            lineHeight: 1.2,
            marginBottom: 10,
            color: theme.ink,
          }}
        >
          Share Your <span style={{ color: theme.primary }}>Feedback</span>
        </h1>
        <p style={{ fontSize: 15, color: theme.muted, maxWidth: 400, margin: "0 auto" }}>
          {tagline}
        </p>
      </div>

      {/* Form card */}
      <div
        style={{
          background: theme.white,
          borderRadius: 24,
          width: "100%",
          maxWidth: 560,
          boxShadow: theme.shadowLg,
          overflow: "hidden",
          animation: "fadeUp 0.6s ease 0.1s both",
        }}
      >
        <div
          style={{
            height: 3,
            background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent}, ${theme.violet})`,
          }}
        />
        <div style={{ padding: "28px 36px 36px" }}>
          {/* Privacy selector */}
          <PrivacySelector
            value={privacy}
            onChange={setPrivacy}
            relayEnabled={relayEnabled}
          />

          {/* Categories */}
          <label
            style={{
              display: "block",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: theme.muted,
              marginBottom: 8,
            }}
          >
            What's this about?
          </label>
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 22 }}
          >
            {categories.map((c) => {
              const active = selectedCats.includes(c.label);
              return (
                <button
                  key={c.label}
                  onClick={() =>
                    setSelectedCats((prev) =>
                      prev.includes(c.label)
                        ? prev.filter((x) => x !== c.label)
                        : [...prev, c.label]
                    )
                  }
                  style={{
                    padding: "6px 14px",
                    borderRadius: 100,
                    fontSize: 13,
                    fontWeight: 500,
                    border: `1.5px solid ${active ? theme.primary : theme.divider}`,
                    background: active ? theme.primary : theme.white,
                    color: active ? "#fff" : theme.ink,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    outline: "none",
                    fontFamily: fontStack,
                  }}
                >
                  {c.emoji} {c.label}
                </button>
              );
            })}
          </div>

          {/* Identified fields */}
          {privacy === "identified" && (
            <div style={{ animation: "fadeUp 0.3s ease" }}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
                  Your Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jamie Rivera"
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    border: `1.5px solid ${theme.divider}`,
                    borderRadius: 10,
                    fontSize: 15,
                    color: theme.ink,
                    background: theme.paper,
                    outline: "none",
                    fontFamily: fontStack,
                  }}
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
                  Your Email
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jamie@example.com"
                  type="email"
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    border: `1.5px solid ${theme.divider}`,
                    borderRadius: 10,
                    fontSize: 15,
                    color: theme.ink,
                    background: theme.paper,
                    outline: "none",
                    fontFamily: fontStack,
                  }}
                />
              </div>
            </div>
          )}

          {/* Relay email field */}
          {privacy === "relay" && (
            <div style={{ marginBottom: 14, animation: "fadeUp 0.3s ease" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
                Your Email{" "}
                <span style={{ fontWeight: 400, color: theme.muted, fontSize: 12 }}>
                  (for anonymous replies)
                </span>
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your-email@example.com"
                type="email"
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  border: `1.5px solid ${theme.divider}`,
                  borderRadius: 10,
                  fontSize: 15,
                  color: theme.ink,
                  background: theme.paper,
                  outline: "none",
                  fontFamily: fontStack,
                }}
              />
              <div
                style={{
                  fontSize: 11,
                  color: theme.violet,
                  marginTop: 5,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                🔒 Encrypted — organizers will never see this
              </div>
            </div>
          )}

          {/* Feedback text */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
              Your Feedback
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="What's on your mind? The more detail, the better we can respond..."
              style={{
                width: "100%",
                padding: "12px 14px",
                border: `1.5px solid ${theme.divider}`,
                borderRadius: 10,
                fontSize: 15,
                color: theme.ink,
                background: theme.paper,
                outline: "none",
                minHeight: 130,
                resize: "vertical",
                lineHeight: 1.6,
                fontFamily: fontStack,
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                marginBottom: 14,
                fontSize: 13,
                background: "rgba(192, 93, 59, 0.08)",
                color: theme.accent,
                border: `1px solid ${theme.accent}22`,
              }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!feedback.trim() || submitting}
            style={{
              width: "100%",
              padding: 15,
              border: "none",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 700,
              color: "#fff",
              background: cfg.color,
              cursor: feedback.trim() && !submitting ? "pointer" : "not-allowed",
              opacity: feedback.trim() && !submitting ? 1 : 0.5,
              transition: "all 0.3s",
              fontFamily: fontStack,
            }}
          >
            {submitting ? "Sending..." : cfg.btnText}
          </button>

          {/* Trust footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 20,
              marginTop: 20,
              fontSize: 11,
              color: theme.muted,
              opacity: 0.55,
            }}
          >
            <span>🔒 Encrypted</span>
            <span>🚫 No tracking</span>
            <span>🛡️ Powered by TellSafe</span>
          </div>
        </div>
      </div>
    </div>
  );
}
