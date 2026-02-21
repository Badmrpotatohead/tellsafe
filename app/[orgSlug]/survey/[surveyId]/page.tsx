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
  const [email, setEmail] = useState("");
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
    // Validate required
    const missing = survey.questions.filter(
      (q: SurveyQuestion) => q.required && !answers[q.id] && answers[q.id] !== false
    );
    if (missing.length > 0) {
      setError(`Please answer all required questions (${missing.length} remaining)`);
      return;
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
          respondentName: name || null,
          respondentEmail: email || null,
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

  // --- Loading ---
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fontStack, background: "#f2f0eb" }}>
        <div style={{ textAlign: "center", color: "#8a8578" }}>Loading survey...</div>
      </div>
    );
  }

  // --- Error ---
  if (loadError) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fontStack, background: "#f2f0eb" }}>
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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fontStack, background: "#f2f0eb" }}>
        <div style={{ background: "#fff", borderRadius: 24, padding: 48, maxWidth: 440, textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontFamily: displayFont, fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
            Thank you!
          </h2>
          <p style={{ color: "#5a5650", fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
            Your response has been submitted. Your feedback helps make {org?.name || "our community"} better.
          </p>
          <a
            href={`/${orgSlug}`}
            style={{
              display: "inline-block",
              padding: "12px 28px",
              background: primaryColor,
              color: "#fff",
              borderRadius: 10,
              textDecoration: "none",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            Submit Feedback →
          </a>
        </div>
      </div>
    );
  }

  // --- Survey Form ---
  return (
    <div style={{ minHeight: "100vh", background: "#f2f0eb", fontFamily: fontStack }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,600;9..144,700&display=swap"
        rel="stylesheet"
      />

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 20px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          {org?.logoUrl && (
            <img src={org.logoUrl} alt="" style={{ height: 40, marginBottom: 12, objectFit: "contain" }} />
          )}
          <h1 style={{ fontFamily: displayFont, fontSize: 28, fontWeight: 600, marginBottom: 6, color: "#1a1a2e" }}>
            {survey.title}
          </h1>
          {survey.description && (
            <p style={{ color: "#5a5650", fontSize: 15, lineHeight: 1.5 }}>{survey.description}</p>
          )}
          <div style={{ fontSize: 12, color: "#8a8578", marginTop: 8 }}>
            {org?.name} · {survey.questions.length} questions
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
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                  {Array.from({ length: q.maxRating }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setAnswer(q.id, i + 1)}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        border: `2px solid ${answers[q.id] === i + 1 ? primaryColor : "#e8e5de"}`,
                        background: answers[q.id] === i + 1 ? primaryColor : "#fff",
                        color: answers[q.id] === i + 1 ? "#fff" : "#1a1a2e",
                        fontSize: 18,
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.15s",
                        fontFamily: fontStack,
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}
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
                    { val: true, label: "Yes", color: "#059669", bg: "#d1fae5" },
                    { val: false, label: "No", color: "#dc2626", bg: "#fee2e2" },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => setAnswer(q.id, opt.val)}
                      style={{
                        flex: 1,
                        padding: 14,
                        borderRadius: 10,
                        border: `2px solid ${answers[q.id] === opt.val ? opt.color : "#e8e5de"}`,
                        background: answers[q.id] === opt.val ? opt.bg : "#fff",
                        color: answers[q.id] === opt.val ? opt.color : "#1a1a2e",
                        fontSize: 16,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: fontStack,
                        transition: "all 0.15s",
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

        {/* Optional identification */}
        {survey.allowIdentified && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, marginBottom: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "#8a8578" }}>
              Optional: Identify yourself
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" style={{ flex: 1, padding: "10px 14px", border: "1.5px solid #e8e5de", borderRadius: 10, fontSize: 14, fontFamily: fontStack, outline: "none" }} />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" style={{ flex: 1, padding: "10px 14px", border: "1.5px solid #e8e5de", borderRadius: 10, fontSize: 14, fontFamily: fontStack, outline: "none" }} />
            </div>
          </div>
        )}

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
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#aaa" }}>
          Powered by <a href="/" style={{ color: primaryColor, textDecoration: "none" }}>TellSafe</a>
        </div>
      </div>
    </div>
  );
}
