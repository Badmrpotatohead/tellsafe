// ============================================================
// TellSafe v1.3 — Public Survey Page
// ============================================================
// Renders a survey form for community members.
// URL: /{orgSlug}/survey/{surveyId}

"use client";

import React, { useState, useEffect } from "react";
import type { Survey, SurveyQuestion, SurveyResponseAnswer } from "../../../../types/survey";
import type { Organization } from "../../../../types";

const fontStack = "'Outfit', 'DM Sans', system-ui, sans-serif";
const displayFont = "'Fraunces', Georgia, serif";

interface PageProps {
  params: { orgSlug: string; surveyId: string };
}

export default function SurveyPage({ params }: PageProps) {
  const { orgSlug, surveyId } = params;

  const [survey, setSurvey] = useState<any>(null);
  const [org, setOrg] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [followUps, setFollowUps] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [identifiedEmail, setIdentifiedEmail] = useState("");
  const [relayEmail, setRelayEmail] = useState("");
  // When survey allows multiple response types, respondent picks one.
  // null means "not yet chosen" (only relevant when allowedResponseTypes.length > 1)
  const [chosenResponseType, setChosenResponseType] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState("");

  useEffect(() => {
    loadSurvey();
  }, [orgSlug, surveyId]);

  const loadSurvey = async () => {
    try {
      // First get orgId from slug
      const { getFirestore, doc, getDoc } = await import("firebase/firestore");
      const { getApps, getApp, initializeApp } = await import("firebase/app");

      if (getApps().length === 0) {
        initializeApp({
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        });
      }

      const db = getFirestore(getApp());
      const slugSnap = await getDoc(doc(db, "slugs", orgSlug));
      if (!slugSnap.exists()) {
        setLoadError("Organization not found");
        setLoading(false);
        return;
      }

      const oid = (slugSnap.data() as any).orgId;
      setOrgId(oid);

      // Fetch survey via API
      const res = await fetch(`/api/survey/${surveyId}/respond?orgId=${oid}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setLoadError(data.error || "Survey not available");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setSurvey(data.survey);
      setOrg(data.org);
    } catch (err) {
      console.error("Load survey error:", err);
      setLoadError("Failed to load survey");
    } finally {
      setLoading(false);
    }
  };

  const setAnswer = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const setFollowUp = (questionId: string, text: string) => {
    setFollowUps((prev) => ({ ...prev, [questionId]: text }));
  };

  const toggleMultiChoice = (questionId: string, option: string) => {
    setAnswers((prev) => {
      const current = (prev[questionId] as string[]) || [];
      return {
        ...prev,
        [questionId]: current.includes(option)
          ? current.filter((o) => o !== option)
          : [...current, option],
      };
    });
  };

  const handleSubmit = async () => {
    // Determine effective response type
    const allowedTypes: string[] = survey.allowedResponseTypes?.length
      ? survey.allowedResponseTypes
      : [survey.responseType ?? "anonymous"];
    const responseType = allowedTypes.length > 1
      ? (chosenResponseType ?? allowedTypes[0])
      : allowedTypes[0];

    // Validate required questions
    const missing = survey.questions.filter(
      (q: SurveyQuestion) => q.required && !answers[q.id] && answers[q.id] !== false
    );
    if (missing.length > 0) {
      setError(`Please answer all required questions (${missing.length} remaining)`);
      return;
    }

    // If multiple types allowed, ensure one is chosen
    if (allowedTypes.length > 1 && !chosenResponseType) {
      setError("Please select how you'd like to respond.");
      return;
    }

    // Validate type-specific fields
    if (responseType === "identified") {
      if (!name.trim() || !identifiedEmail.trim()) {
        setError("Please enter your name and email to submit.");
        return;
      }
    }
    if (responseType === "relay") {
      if (!relayEmail.trim()) {
        setError("Please enter your email so we can reply to you.");
        return;
      }
    }

    setError(null);
    setSubmitting(true);

    try {
      const responseAnswers: SurveyResponseAnswer[] = survey.questions
        .filter((q: SurveyQuestion) => answers[q.id] !== undefined)
        .map((q: SurveyQuestion) => ({
          questionId: q.id,
          value: answers[q.id],
          followUpText: followUps[q.id] || undefined,
        }));

      const res = await fetch(`/api/survey/${surveyId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          answers: responseAnswers,
          responseType, // tell the API which type the respondent chose
          respondentName: responseType === "identified" ? name.trim() : null,
          respondentEmail: responseType === "identified" ? identifiedEmail.trim() : null,
          relayEmail: responseType === "relay" ? relayEmail.trim() : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const primaryColor = org?.primaryColor || "#2d6a6a";
  const accentColor = org?.accentColor || "#c05d3b";
  const primaryGlow = `${primaryColor}18`;
  const accentGlow = `${accentColor}14`;
  const orgInitials = (org?.name || "?")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const pageBackground = `radial-gradient(ellipse 80% 50% at 20% 10%, ${primaryGlow}, transparent), radial-gradient(ellipse 50% 40% at 80% 80%, ${accentGlow}, transparent), #f8f6f1`;

  // --- Loading ---
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fontStack, background: pageBackground }}>
        <div style={{ textAlign: "center", color: "#8a8578" }}>Loading survey...</div>
      </div>
    );
  }

  // --- Error ---
  if (loadError) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fontStack, background: pageBackground }}>
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <h2 style={{ fontFamily: displayFont, fontSize: 22, fontWeight: 600, marginBottom: 8 }}>{loadError}</h2>
          <a href={`/${orgSlug}`} style={{ color: primaryColor, fontSize: 14, textDecoration: "none", fontWeight: 600 }}>
            ← Go to feedback form
          </a>
        </div>
      </div>
    );
  }

  // --- Submitted ---
  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fontStack, background: pageBackground }}>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,600;9..144,700&display=swap" rel="stylesheet" />
        <div style={{ background: "#fff", borderRadius: 24, padding: 48, maxWidth: 440, textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
          {/* Branded logo */}
          <div style={{ marginBottom: 20 }}>
            {org?.logoUrl ? (
              <img src={org.logoUrl} alt={org.name} style={{ height: 48, objectFit: "contain", margin: "0 auto" }} />
            ) : (
              <div style={{
                width: 56, height: 56, borderRadius: 16, margin: "0 auto",
                background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 20, fontWeight: 700, fontFamily: fontStack,
              }}>{orgInitials}</div>
            )}
          </div>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
          <h2 style={{ fontFamily: displayFont, fontSize: 24, fontWeight: 600, marginBottom: 8, color: "#1a1a2e" }}>
            Thank you!
          </h2>
          <p style={{ color: "#5a5650", fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
            Your response has been submitted. Your feedback helps make <strong style={{ color: primaryColor }}>{org?.name || "our community"}</strong> better.
          </p>
          <a
            href={`/${orgSlug}`}
            style={{
              display: "inline-block", padding: "12px 28px",
              background: primaryColor, color: "#fff", borderRadius: 10,
              textDecoration: "none", fontWeight: 700, fontSize: 14,
            }}
          >
            Share Feedback →
          </a>
        </div>
      </div>
    );
  }

  // --- Survey Form ---
  return (
    <div style={{ minHeight: "100vh", background: pageBackground, fontFamily: fontStack }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,600;9..144,700&display=swap"
        rel="stylesheet"
      />

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 20px" }}>
        {/* Branded header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          {/* Logo or initials */}
          <div style={{ marginBottom: 16 }}>
            {org?.logoUrl ? (
              <img src={org.logoUrl} alt={org.name} style={{ height: 52, objectFit: "contain", margin: "0 auto", display: "block" }} />
            ) : (
              <div style={{
                width: 56, height: 56, borderRadius: 16, margin: "0 auto",
                background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 20, fontWeight: 700,
              }}>{orgInitials}</div>
            )}
          </div>
          {/* Org name */}
          <div style={{ fontSize: 13, fontWeight: 600, color: primaryColor, marginBottom: 12, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            {org?.name}
          </div>
          {/* Colored bar */}
          <div style={{ height: 3, borderRadius: 2, background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})`, maxWidth: 280, margin: "0 auto 20px" }} />
          {/* Survey title */}
          <h1 style={{ fontFamily: displayFont, fontSize: 28, fontWeight: 600, marginBottom: 8, color: "#1a1a2e", lineHeight: 1.25 }}>
            {survey.title}
          </h1>
          {survey.description && (
            <p style={{ color: "#5a5650", fontSize: 15, lineHeight: 1.6, maxWidth: 480, margin: "0 auto" }}>{survey.description}</p>
          )}
          <div style={{ fontSize: 12, color: "#8a8578", marginTop: 10 }}>
            {survey.questions.length} question{survey.questions.length !== 1 ? "s" : ""}
          </div>
        </div>

        {error && (
          <div style={{ background: "#fee2e2", color: "#dc2626", padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Questions */}
        {survey.questions.map((q: SurveyQuestion, qi: number) => (
          <div
            key={q.id}
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 24,
              marginBottom: 14,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 14, lineHeight: 1.4, color: "#1a1a2e" }}>
              {q.text}
              {q.required && <span style={{ color: accentColor, marginLeft: 4 }}>*</span>}
            </div>

            {/* Rating */}
            {q.type === "rating" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  {q.lowLabel && <span style={{ fontSize: 11, color: "#8a8578" }}>{q.lowLabel}</span>}
                  {q.highLabel && <span style={{ fontSize: 11, color: "#8a8578" }}>{q.highLabel}</span>}
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                  {Array.from({ length: q.maxRating }, (_, i) => {
                    const val = i + 1;
                    const selected = Number(answers[q.id]) === val;
                    const filled = Number(answers[q.id]) >= val;
                    return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAnswer(q.id, val)}
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 12,
                        border: `2px solid ${selected ? primaryColor : filled ? `${primaryColor}60` : "#e8e5de"}`,
                        background: selected ? primaryColor : filled ? `${primaryColor}15` : "#fff",
                        color: selected ? "#fff" : filled ? primaryColor : "#1a1a2e",
                        fontSize: 20,
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.15s",
                        fontFamily: fontStack,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        WebkitTapHighlightColor: "transparent",
                        touchAction: "manipulation",
                        userSelect: "none",
                      }}
                    >
                      ⭐
                    </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Multiple Choice */}
            {q.type === "multiple_choice" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {q.options.map((opt, oi) => {
                  const isSelected = q.allowMultiple
                    ? ((answers[q.id] as string[]) || []).includes(opt)
                    : answers[q.id] === opt;

                  return (
                    <button
                      key={oi}
                      type="button"
                      onClick={() =>
                        q.allowMultiple
                          ? toggleMultiChoice(q.id, opt)
                          : setAnswer(q.id, opt)
                      }
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "12px 16px",
                        border: `1.5px solid ${isSelected ? primaryColor : "#e8e5de"}`,
                        borderRadius: 10,
                        background: isSelected ? `${primaryColor}10` : "#fff",
                        cursor: "pointer",
                        fontSize: 14,
                        textAlign: "left",
                        fontFamily: fontStack,
                        color: "#1a1a2e",
                        WebkitTapHighlightColor: "transparent",
                        touchAction: "manipulation",
                        userSelect: "none",
                      }}
                    >
                      <span style={{
                        width: 20, height: 20, borderRadius: q.allowMultiple ? 4 : 10,
                        border: `2px solid ${isSelected ? primaryColor : "#ccc"}`,
                        background: isSelected ? primaryColor : "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0,
                      }}>
                        {isSelected ? "✓" : ""}
                      </span>
                      {opt}
                    </button>
                  );
                })}
                {q.allowOther && (
                  <input
                    placeholder="Other..."
                    onChange={(e) => {
                      if (q.allowMultiple) {
                        // Remove old "other" and add new
                        const current = ((answers[q.id] as string[]) || []).filter(
                          (o) => q.options.includes(o)
                        );
                        if (e.target.value) current.push(e.target.value);
                        setAnswer(q.id, current);
                      } else {
                        setAnswer(q.id, e.target.value);
                      }
                    }}
                    style={{
                      padding: "12px 16px",
                      border: "1.5px solid #e8e5de",
                      borderRadius: 10,
                      fontSize: 14,
                      fontFamily: fontStack,
                      outline: "none",
                    }}
                  />
                )}
              </div>
            )}

            {/* Yes/No */}
            {q.type === "yes_no" && (
              <div>
                <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  {[
                    { val: true, label: "✅ Yes", color: "#059669", bg: "#d1fae5" },
                    { val: false, label: "❌ No", color: "#dc2626", bg: "#fee2e2" },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setAnswer(q.id, opt.val)}
                      style={{
                        flex: 1,
                        padding: 16,
                        borderRadius: 12,
                        border: `2px solid ${answers[q.id] === opt.val ? opt.color : "#e8e5de"}`,
                        background: answers[q.id] === opt.val ? opt.bg : "#fff",
                        color: answers[q.id] === opt.val ? opt.color : "#1a1a2e",
                        fontSize: 16,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: fontStack,
                        transition: "all 0.15s",
                        WebkitTapHighlightColor: "transparent",
                        touchAction: "manipulation",
                        userSelect: "none",
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {/* Follow-up */}
                {answers[q.id] === true && q.followUpOnYes && (
                  <textarea
                    value={followUps[q.id] || ""}
                    onChange={(e) => setFollowUp(q.id, e.target.value)}
                    placeholder={q.followUpOnYes}
                    rows={3}
                    style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e5de", borderRadius: 10, fontSize: 14, fontFamily: fontStack, outline: "none", resize: "vertical", boxSizing: "border-box" }}
                  />
                )}
                {answers[q.id] === false && q.followUpOnNo && (
                  <textarea
                    value={followUps[q.id] || ""}
                    onChange={(e) => setFollowUp(q.id, e.target.value)}
                    placeholder={q.followUpOnNo}
                    rows={3}
                    style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e5de", borderRadius: 10, fontSize: 14, fontFamily: fontStack, outline: "none", resize: "vertical", boxSizing: "border-box" }}
                  />
                )}
              </div>
            )}

            {/* Free Text */}
            {q.type === "free_text" && (
              <textarea
                value={answers[q.id] || ""}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                placeholder={q.placeholder || "Type your answer..."}
                rows={4}
                style={{ width: "100%", padding: "12px 16px", border: "1.5px solid #e8e5de", borderRadius: 12, fontSize: 14, fontFamily: fontStack, outline: "none", resize: "vertical", lineHeight: 1.5, boxSizing: "border-box" }}
              />
            )}
          </div>
        ))}

        {/* Respondent info — varies by responseType. Multi-type surveys show a picker first. */}
        {(() => {
          const allowedTypes: string[] = survey.allowedResponseTypes?.length
            ? survey.allowedResponseTypes
            : [survey.responseType ?? "anonymous"];
          const isMulti = allowedTypes.length > 1;
          const activeType = isMulti ? chosenResponseType : allowedTypes[0];

          const TYPE_META: Record<string, { icon: string; label: string; desc: string; accentColor: string; bgColor: string }> = {
            identified: { icon: "👋", label: "Identified", desc: "Your name & email will be visible to organizers.", accentColor: primaryColor, bgColor: `${primaryColor}18` },
            anonymous:  { icon: "🎭", label: "Anonymous", desc: "No personal info collected. Your response cannot be traced.", accentColor: "#6b7280", bgColor: "#f3f4f6" },
            relay:      { icon: "🔒", label: "Anonymous Relay", desc: "Your email is encrypted. Organizers can reply without knowing who you are.", accentColor: "#7c3aed", bgColor: "#f5f3ff" },
          };

          return (
            <div style={{ marginBottom: 14 }}>
              {/* Multi-type picker */}
              {isMulti && (
                <div style={{ background: "#fff", borderRadius: 16, padding: 20, marginBottom: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#8a8578", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    How would you like to respond?
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {allowedTypes.map((type) => {
                      const meta = TYPE_META[type];
                      const selected = chosenResponseType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setChosenResponseType(type)}
                          style={{
                            flex: 1,
                            minWidth: 120,
                            padding: "12px 10px 10px",
                            borderRadius: 12,
                            border: `2px solid ${selected ? meta.accentColor : "#e8e5de"}`,
                            background: selected ? meta.bgColor : "#fafaf9",
                            cursor: "pointer",
                            textAlign: "center",
                            position: "relative",
                            transition: "all 0.15s",
                            fontFamily: fontStack,
                            WebkitTapHighlightColor: "transparent",
                            touchAction: "manipulation",
                            userSelect: "none",
                          }}
                        >
                          {/* Selection circle */}
                          <div style={{
                            position: "absolute",
                            top: 8, right: 8,
                            width: 14, height: 14,
                            borderRadius: "50%",
                            border: `2px solid ${selected ? meta.accentColor : "#d1d5db"}`,
                            background: selected ? meta.accentColor : "transparent",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            {selected && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff" }} />}
                          </div>
                          <div style={{ fontSize: 20, marginBottom: 4 }}>{meta.icon}</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: selected ? meta.accentColor : "#1a1a2e" }}>{meta.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Identified fields */}
              {activeType === "identified" && (
                <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.04)", border: `1.5px solid ${primaryColor}30` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, color: "#1a1a2e" }}>👋 Your details</div>
                  <div style={{ fontSize: 12, color: "#8a8578", marginBottom: 12 }}>Your name and email will be visible to organizers.</div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name *" required
                      style={{ flex: 1, minWidth: 140, padding: "10px 14px", border: "1.5px solid #e8e5de", borderRadius: 10, fontSize: 14, fontFamily: fontStack, outline: "none" }} />
                    <input value={identifiedEmail} onChange={(e) => setIdentifiedEmail(e.target.value)} placeholder="Your email *" type="email" required
                      style={{ flex: 1, minWidth: 140, padding: "10px 14px", border: "1.5px solid #e8e5de", borderRadius: 10, fontSize: 14, fontFamily: fontStack, outline: "none" }} />
                  </div>
                </div>
              )}

              {/* Relay email field */}
              {activeType === "relay" && (
                <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.04)", border: "1.5px solid #7c3aed30" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, color: "#1a1a2e" }}>🔒 Relay — stay anonymous</div>
                  <div style={{ fontSize: 12, color: "#8a8578", marginBottom: 12 }}>Your email is encrypted. Organizers can reply without knowing who you are.</div>
                  <input value={relayEmail} onChange={(e) => setRelayEmail(e.target.value)} placeholder="Your email (encrypted) *" type="email" required
                    style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e5de", borderRadius: 10, fontSize: 14, fontFamily: fontStack, outline: "none", boxSizing: "border-box" }} />
                </div>
              )}

              {/* Anonymous notice */}
              {activeType === "anonymous" && (
                <div style={{ background: "#f3f4f6", borderRadius: 12, padding: "10px 16px", fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 8 }}>
                  🎭 <span>Your response is completely anonymous — no personal info collected.</span>
                </div>
              )}

              {/* Multi-type: nothing chosen yet */}
              {isMulti && !activeType && (
                <div style={{ background: "#f8f6f1", borderRadius: 12, padding: "10px 16px", fontSize: 12, color: "#8a8578", textAlign: "center" }}>
                  Select how you'd like to respond above.
                </div>
              )}
            </div>
          );
        })()}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            width: "100%",
            padding: 16,
            border: "none",
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 700,
            color: "#fff",
            background: primaryColor,
            cursor: submitting ? "not-allowed" : "pointer",
            opacity: submitting ? 0.6 : 1,
            fontFamily: fontStack,
            transition: "all 0.2s",
          }}
        >
          {submitting ? "Submitting..." : "Submit Survey"}
        </button>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "#aaa" }}>
          Powered by <a href="/" style={{ color: primaryColor, textDecoration: "none", fontWeight: 600 }}>TellSafe</a>
          {" · "}
          <a href={`/${orgSlug}`} style={{ color: "#aaa", textDecoration: "none" }}>Share feedback instead →</a>
        </div>
      </div>
    </div>
  );
}
