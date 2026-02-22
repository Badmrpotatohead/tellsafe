// ============================================================
// TellSafe — Public Feedback Form Component
// ============================================================
// Supports kiosk mode (?mode=kiosk) and multi-language (?lang=es)

"use client";

import React, { useState, useEffect, useRef } from "react";
import { useBrand } from "./BrandProvider";
import PrivacySelector, { getPrivacyConfig } from "./PrivacySelector";
import type { FeedbackType } from "../types";
import type { Organization } from "../types";
import { PLAN_LIMITS } from "../types";
import { TRANSLATIONS, LOCALE_LABELS, type Locale } from "../lib/translations";

const fontStack = "'Outfit', 'DM Sans', system-ui, sans-serif";
const displayFont = "'Fraunces', Georgia, serif";

interface Props {
  org: Organization;
  kioskMode?: boolean;
  locale?: string;
}

export default function FeedbackForm({ org, kioskMode = false, locale = "en" }: Props) {
  const { theme, categories, tagline, orgName, logoUrl } = useBrand();
  const pConfig = getPrivacyConfig(theme);

  const hasMultiLanguage = PLAN_LIMITS[org.plan].hasMultiLanguage;
  const [lang, setLang] = useState<Locale>((hasMultiLanguage && locale in TRANSLATIONS ? locale : "en") as Locale);
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const [privacy, setPrivacy] = useState<FeedbackType>("identified");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  // Persist name/email in localStorage for returning users
  const [name, setName] = useState(() => {
    if (typeof window === "undefined") return "";
    try { return localStorage.getItem("tellsafe_name") || ""; } catch { return ""; }
  });
  const [email, setEmail] = useState(() => {
    if (typeof window === "undefined") return "";
    try { return localStorage.getItem("tellsafe_email") || ""; } catch { return ""; }
  });
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kioskCountdown, setKioskCountdown] = useState<number | null>(null);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const langRef = useRef<HTMLDivElement>(null);

  // Kiosk: auto-detect OS dark mode preference
  const [kioskDark, setKioskDark] = useState(false);
  useEffect(() => {
    if (!kioskMode) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setKioskDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setKioskDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [kioskMode]);

  // Kiosk dark mode palette (warm, not cold/blue)
  const kioskDarkBg = "#1A1A1A";
  const kioskDarkCard = "#2A2926";
  const kioskDarkText = "#F2F0EB";
  const kioskDarkMuted = "#8A8578";
  const kioskDarkBorder = "#3A3835";
  const kioskDarkInput = "#232220";

  const cfg = pConfig[privacy];
  const relayEnabled = org.plan !== "free";

  // Field-level inline validation (shown after blur)
  const markTouched = (field: string) => setTouchedFields((prev) => new Set(prev).add(field));
  const fieldError = (field: string): string | null => {
    if (!touchedFields.has(field)) return null;
    switch (field) {
      case "name":
        if (privacy === "identified" && !name.trim()) return t.pleaseEnterName;
        if (privacy === "identified" && name.trim().length > 100) return "Name is too long (max 100).";
        return null;
      case "email":
        if ((privacy === "identified" || privacy === "relay") && !email.trim()) return t.pleaseEnterEmail;
        if ((privacy === "identified" || privacy === "relay") && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return t.pleaseEnterValidEmail;
        return null;
      case "feedback":
        if (!feedback.trim()) return "Please enter your feedback.";
        if (feedback.trim().length > 5000) return "Feedback is too long (max 5,000 characters).";
        return null;
      case "categories":
        if (categories.length > 0 && selectedCats.length === 0) return "Please select at least one category.";
        return null;
      default:
        return null;
    }
  };

  // Close language dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setShowLangDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Kiosk auto-reset countdown
  useEffect(() => {
    if (!kioskMode || !submitted) return;
    setKioskCountdown(5);
    const interval = setInterval(() => {
      setKioskCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          resetForm();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [kioskMode, submitted]);

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      setError("Please enter your feedback.");
      return;
    }
    if (feedback.trim().length > 5000) {
      setError("Feedback is too long. Please keep it under 5,000 characters.");
      return;
    }
    if (categories.length > 0 && selectedCats.length === 0) {
      setError("Please select at least one category.");
      return;
    }
    if (privacy === "identified" && !name.trim()) {
      setError(t.pleaseEnterName);
      return;
    }
    if (privacy === "identified" && name.trim().length > 100) {
      setError("Name is too long. Please keep it under 100 characters.");
      return;
    }
    if ((privacy === "identified" || privacy === "relay") && !email.trim()) {
      setError(t.pleaseEnterEmail);
      return;
    }
    if ((privacy === "identified" || privacy === "relay") && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t.pleaseEnterValidEmail);
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: org.id,
          orgSlug: org.slug,
          type: privacy,
          categories: selectedCats,
          text: feedback.trim(),
          authorName: privacy === "identified" ? name.trim() : undefined,
          authorEmail: privacy === "identified" ? email.trim() : undefined,
          relayEmail: privacy === "relay" ? email.trim() : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Submission failed");
      }

      // Save name/email for returning users
      if (privacy === "identified" && name.trim()) {
        try {
          localStorage.setItem("tellsafe_name", name.trim());
          localStorage.setItem("tellsafe_email", email.trim());
        } catch {}
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error("Submit failed:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setFeedback("");
    // In kiosk mode, clear name/email to prevent PII leaks between users
    if (kioskMode) {
      setName("");
      setEmail("");
    }
    // In normal mode, keep name/email for returning users (pre-filled from localStorage)
    setSelectedCats([]);
    setError(null);
    setKioskCountdown(null);
    setTouchedFields(new Set());
  };

  const btnText = submitting
    ? t.sending
    : privacy === "identified"
    ? t.sendIdentified
    : privacy === "anonymous"
    ? t.sendAnonymous
    : t.sendRelay;

  // --- Language Selector ---
  const LanguageSelector = () => {
    if (!hasMultiLanguage) return null;
    return (
      <div ref={langRef} style={{ position: "relative", display: "inline-block" }}>
        <button
          onClick={() => setShowLangDropdown(!showLangDropdown)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            border: `1.5px solid ${theme.divider}`,
            borderRadius: 8,
            background: theme.white,
            color: theme.ink,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: fontStack,
          }}
        >
          <span style={{ fontSize: 14 }}>🌐</span>
          {LOCALE_LABELS[lang]}
          <span style={{ fontSize: 10, color: theme.muted }}>▼</span>
        </button>
        {showLangDropdown && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              marginTop: 4,
              background: theme.white,
              border: `1.5px solid ${theme.divider}`,
              borderRadius: 10,
              boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
              zIndex: 50,
              overflow: "hidden",
              minWidth: 140,
            }}
          >
            {(Object.keys(LOCALE_LABELS) as Locale[]).map((l) => (
              <button
                key={l}
                onClick={() => { setLang(l); setShowLangDropdown(false); }}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "10px 16px",
                  border: "none",
                  background: l === lang ? theme.primaryGlow : "transparent",
                  color: l === lang ? theme.primary : theme.ink,
                  fontSize: 13,
                  fontWeight: l === lang ? 700 : 500,
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: fontStack,
                }}
              >
                {LOCALE_LABELS[l]}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // --- Success State ---
  if (submitted) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: kioskDark ? kioskDarkBg : `radial-gradient(ellipse 80% 50% at 30% 20%, ${theme.primaryGlow}, transparent), ${theme.paper}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fontStack,
          color: kioskDark ? kioskDarkText : "inherit",
          ...(kioskMode ? { userSelect: "none" as const } : {}),
        }}
      >
        <div
          style={{
            background: kioskDark ? kioskDarkCard : theme.white,
            borderRadius: 24,
            padding: kioskMode ? 56 : 48,
            maxWidth: 500,
            width: "90%",
            boxShadow: theme.shadowLg,
            textAlign: "center",
            animation: "scaleIn 0.4s ease",
          }}
        >
          <div
            style={{
              width: kioskMode ? 80 : 64,
              height: kioskMode ? 80 : 64,
              borderRadius: "50%",
              background: theme.primaryGlow,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: kioskMode ? 40 : 32,
              margin: "0 auto 20px",
            }}
          >
            ✓
          </div>
          <h2
            style={{
              fontFamily: displayFont,
              fontSize: kioskMode ? 32 : 26,
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            {t.feedbackSent}
          </h2>
          <p
            style={{
              color: theme.muted,
              fontSize: kioskMode ? 17 : 15,
              lineHeight: 1.6,
              marginBottom: 28,
            }}
          >
            {privacy === "anonymous" && t.successAnonymous}
            {privacy === "identified" && t.successIdentified}
            {privacy === "relay" && t.successRelay}
          </p>

          {/* Kiosk countdown */}
          {kioskMode && kioskCountdown !== null && (
            <div
              style={{
                fontSize: 15,
                color: theme.muted,
                marginBottom: 20,
              }}
            >
              {t.kioskResetting} {kioskCountdown}s...
            </div>
          )}

          {!kioskMode && (
            <>
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
                {t.submitMore}
              </button>

              {/* Updates board link */}
              {PLAN_LIMITS[org.plan].hasUpdatesBoard && (
                <a
                  href={`/${org.slug}/updates`}
                  style={{
                    display: "block",
                    marginTop: 16,
                    padding: "14px 20px",
                    borderRadius: 12,
                    background: `${theme.primary}08`,
                    border: `1.5px solid ${theme.primary}20`,
                    textDecoration: "none",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: theme.primary, marginBottom: 2 }}>
                    📢 {t.seeUpdates}
                  </div>
                  <div style={{ fontSize: 12, color: theme.muted }}>
                    See what changed based on your feedback
                  </div>
                </a>
              )}
            </>
          )}

          {/* Powered by TellSafe — success screen */}
          {!org.hidePoweredBy && (
            <a
              href="https://tellsafe.app"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                marginTop: 24,
                fontSize: 11,
                color: kioskDark ? "rgba(242,240,235,0.4)" : theme.muted,
                textDecoration: "none",
                transition: "color 0.15s",
              }}
            >
              🛡️ Powered by TellSafe — Free anonymous feedback for your community
            </a>
          )}
        </div>
      </div>
    );
  }

  // --- Form ---
  return (
    <div
      style={{
        minHeight: "100vh",
        background: kioskDark
          ? kioskDarkBg
          : `radial-gradient(ellipse 80% 50% at 20% 10%, ${theme.primaryGlow}, transparent), radial-gradient(ellipse 50% 40% at 80% 80%, ${theme.accentGlow}, transparent), ${theme.paper}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: kioskMode ? "24px 16px 40px" : "40px 16px 80px",
        fontFamily: fontStack,
        color: kioskDark ? kioskDarkText : "inherit",
        ...(kioskMode ? { userSelect: "none" as const } : {}),
      }}
    >
      {/* Language selector (top right) */}
      {hasMultiLanguage && (
        <div style={{ position: "fixed", top: 16, right: 16, zIndex: 50 }}>
          <LanguageSelector />
        </div>
      )}

      {/* Branded hero */}
      <div
        style={{
          textAlign: "center",
          maxWidth: 520,
          margin: kioskMode ? "8px auto 20px" : "24px auto 32px",
          animation: "fadeUp 0.6s ease",
        }}
      >
        <div style={{ marginBottom: kioskMode ? 12 : 18 }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={orgName}
              style={{
                height: kioskMode ? 64 : 56,
                maxWidth: 200,
                objectFit: "contain",
                borderRadius: 8,
              }}
            />
          ) : org.plan === "free" ? (
            /* Free plan: show TellSafe branding instead of org initials */
            <div
              style={{
                width: kioskMode ? 70 : 60,
                height: kioskMode ? 70 : 60,
                margin: "0 auto",
                background: "linear-gradient(135deg, #2d6a6a, #c05d3b)",
                borderRadius: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: kioskMode ? 32 : 28,
                boxShadow: "0 4px 20px rgba(45,106,106,0.25)",
              }}
            >
              🛡️
            </div>
          ) : (
            <div
              style={{
                width: kioskMode ? 70 : 60,
                height: kioskMode ? 70 : 60,
                margin: "0 auto",
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                borderRadius: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: kioskMode ? 30 : 26,
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
            fontSize: kioskMode ? 36 : 28,
            fontWeight: 600,
            lineHeight: 1.25,
            marginBottom: 10,
            color: kioskDark ? kioskDarkText : theme.ink,
          }}
        >
          {org.plan !== "free" && org.heroHeading ? (
            org.heroHeading
          ) : (
            <>
              How would you like to share with{" "}
              <span style={{ color: theme.primary }}>{orgName}</span>?
            </>
          )}
        </h1>
        <p style={{ fontSize: kioskMode ? 17 : 15, color: kioskDark ? kioskDarkMuted : theme.muted, maxWidth: 400, margin: "0 auto" }}>
          {tagline}
        </p>
      </div>

      {/* Form card */}
      <div
        style={{
          background: kioskDark ? kioskDarkCard : theme.white,
          borderRadius: 24,
          width: "100%",
          maxWidth: kioskMode ? 620 : 560,
          boxShadow: kioskDark ? "0 8px 32px rgba(0,0,0,0.4)" : theme.shadowLg,
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
        <div style={{ padding: kioskMode ? "32px 40px 40px" : "28px 36px 36px" }}>
          {/* Privacy selector */}
          <PrivacySelector
            value={privacy}
            onChange={setPrivacy}
            relayEnabled={relayEnabled}
            showLabel={org.plan === "free"}
            labelOrgName={org.plan === "free" ? orgName : undefined}
            translations={lang !== "en" ? {
              howWouldYouLikeToShare: t.whatsThisAbout,
              identified: t.identified,
              identifiedDesc: t.identifiedDesc,
              anonymous: t.anonymous,
              anonymousDesc: t.anonymousDesc,
              relay: t.relay,
              relayDesc: t.relayDesc,
            } : undefined}
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
            {t.whatsThisAbout}
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
                    padding: kioskMode ? "10px 18px" : "6px 14px",
                    borderRadius: 100,
                    fontSize: kioskMode ? 15 : 13,
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
                  {c.iconUrl ? (
                    <img src={c.iconUrl} alt="" style={{ width: 16, height: 16, borderRadius: 3, objectFit: "cover", verticalAlign: "middle" }} />
                  ) : (
                    c.emoji
                  )}{" "}{c.label}
                </button>
              );
            })}
          </div>

          {/* Identified fields */}
          {privacy === "identified" && (
            <div style={{ animation: "fadeUp 0.3s ease" }}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
                  {t.yourName}
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => markTouched("name")}
                  placeholder={t.namePlaceholder}
                  style={{
                    width: "100%",
                    padding: kioskMode ? "14px 16px" : "11px 14px",
                    border: `1.5px solid ${fieldError("name") ? theme.accent : theme.divider}`,
                    borderRadius: 10,
                    fontSize: kioskMode ? 17 : 15,
                    color: theme.ink,
                    background: theme.paper,
                    outline: "none",
                    fontFamily: fontStack,
                    boxSizing: "border-box" as const,
                  }}
                />
                {fieldError("name") && (
                  <div style={{ fontSize: 11, color: theme.accent, marginTop: 4 }}>{fieldError("name")}</div>
                )}
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
                  {t.yourEmail}
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => markTouched("email")}
                  placeholder={t.emailPlaceholder}
                  type="email"
                  style={{
                    width: "100%",
                    padding: kioskMode ? "14px 16px" : "11px 14px",
                    border: `1.5px solid ${fieldError("email") ? theme.accent : theme.divider}`,
                    borderRadius: 10,
                    fontSize: kioskMode ? 17 : 15,
                    color: theme.ink,
                    background: theme.paper,
                    outline: "none",
                    fontFamily: fontStack,
                    boxSizing: "border-box" as const,
                  }}
                />
                {fieldError("email") && (
                  <div style={{ fontSize: 11, color: theme.accent, marginTop: 4 }}>{fieldError("email")}</div>
                )}
              </div>
            </div>
          )}

          {/* Relay email field */}
          {privacy === "relay" && (
            <div style={{ marginBottom: 14, animation: "fadeUp 0.3s ease" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
                {t.yourEmail}{" "}
                <span style={{ fontWeight: 400, color: theme.muted, fontSize: 12 }}>
                  {t.forAnonymousReplies}
                </span>
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => markTouched("email")}
                placeholder={t.emailPlaceholder}
                type="email"
                style={{
                  width: "100%",
                  padding: kioskMode ? "14px 16px" : "11px 14px",
                  border: `1.5px solid ${fieldError("email") ? theme.accent : theme.divider}`,
                  borderRadius: 10,
                  fontSize: kioskMode ? 17 : 15,
                  color: theme.ink,
                  background: theme.paper,
                  outline: "none",
                  fontFamily: fontStack,
                  boxSizing: "border-box" as const,
                }}
              />
              {fieldError("email") && (
                <div style={{ fontSize: 11, color: theme.accent, marginTop: 4 }}>{fieldError("email")}</div>
              )}
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
                🔒 {t.encryptedNotice}
              </div>
            </div>
          )}

          {/* Feedback text */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
              {t.yourFeedback}
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              onBlur={() => markTouched("feedback")}
              placeholder={t.feedbackPlaceholder}
              maxLength={5000}
              style={{
                width: "100%",
                padding: kioskMode ? "14px 16px" : "12px 14px",
                border: `1.5px solid ${fieldError("feedback") ? theme.accent : theme.divider}`,
                borderRadius: 10,
                fontSize: kioskMode ? 17 : 15,
                color: theme.ink,
                background: theme.paper,
                outline: "none",
                minHeight: kioskMode ? 180 : 130,
                resize: "vertical",
                lineHeight: 1.6,
                fontFamily: fontStack,
                boxSizing: "border-box" as const,
              }}
            />
            {fieldError("feedback") && (
              <div style={{ fontSize: 11, color: theme.accent, marginTop: 4 }}>{fieldError("feedback")}</div>
            )}
            {feedback.length > 4500 && (
              <div style={{ fontSize: 11, color: feedback.length > 4900 ? "#dc2626" : theme.muted, textAlign: "right", marginTop: 4 }}>
                {feedback.length}/5,000
              </div>
            )}
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
              padding: kioskMode ? 20 : 15,
              border: "none",
              borderRadius: 12,
              fontSize: kioskMode ? 20 : 16,
              fontWeight: 700,
              color: "#fff",
              background: cfg.color,
              cursor: feedback.trim() && !submitting ? "pointer" : "not-allowed",
              opacity: feedback.trim() && !submitting ? 1 : 0.5,
              transition: "all 0.3s",
              fontFamily: fontStack,
            }}
          >
            {submitting ? t.sending : btnText}
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
            <span>🔒 {t.encrypted}</span>
            <span>🚫 {t.noTracking}</span>
            {!kioskMode && <span>🛡️ {t.poweredBy}</span>}
          </div>
        </div>
      </div>

      {/* Persistent powered-by footer */}
      {!org.hidePoweredBy && (
        <a
          href="https://tellsafe.app"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            marginTop: 28,
            fontSize: 11,
            color: kioskDark ? "rgba(242,240,235,0.35)" : theme.muted,
            textDecoration: "none",
            textAlign: "center",
            opacity: 0.7,
            transition: "opacity 0.15s",
          }}
        >
          🛡️ Powered by TellSafe
        </a>
      )}

      {/* Kiosk fullscreen hint */}
      {kioskMode && (
        <div
          style={{
            marginTop: 16,
            fontSize: 11,
            color: kioskDark ? "rgba(242,240,235,0.3)" : theme.muted,
            opacity: 0.4,
            textAlign: "center",
          }}
        >
          Tip: Add to Home Screen for fullscreen kiosk experience
        </div>
      )}
    </div>
  );
}
