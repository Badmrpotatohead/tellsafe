// ============================================================
// TellSafe v1.3 — Survey Results Component
// ============================================================
// Shows aggregated results for a survey with visualizations
// per question type.

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useBrand } from "./BrandProvider";
import type { Survey, SurveyQuestion, SurveyResponse, SurveyResponseAnswer } from "../types/survey";
import { adminDb } from "../lib/firebase-admin";

const fontStack = "'Outfit', system-ui, sans-serif";
const displayFont = "'Fraunces', Georgia, serif";

interface Props {
  orgId: string;
  survey: Survey;
  onBack: () => void;
}

export default function SurveyResults({ orgId, survey, onBack }: Props) {
  const { theme } = useBrand();
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResponses();
  }, [orgId, survey.id]);

  const fetchResponses = async () => {
    try {
      const token = await (await import("firebase/auth")).getAuth().currentUser?.getIdToken();
      // We'll fetch via a simple client-side Firestore read
      const { getFirestore, collection, getDocs, query, orderBy } = await import("firebase/firestore");
      const { getApps, getApp } = await import("firebase/app");
      const db = getFirestore(getApp());

      const snap = await getDocs(
        query(
          collection(db, "organizations", orgId, "surveys", survey.id, "responses"),
          orderBy("submittedAt", "desc")
        )
      );

      setResponses(
        snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as SurveyResponse))
      );
    } catch (err) {
      console.error("Failed to fetch responses:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- Aggregate data per question ---
  const questionResults = useMemo(() => {
    return survey.questions.map((q) => {
      const answers = responses
        .map((r) => r.answers.find((a) => a.questionId === q.id))
        .filter(Boolean) as SurveyResponseAnswer[];

      return { question: q, answers };
    });
  }, [survey.questions, responses]);

  if (loading) {
    return (
      <div style={{ padding: 28, fontFamily: fontStack }}>
        <div style={{ color: theme.muted }}>Loading results...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 28, fontFamily: fontStack, maxWidth: 800 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={onBack}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: theme.muted, fontFamily: fontStack, padding: 0, marginBottom: 8 }}
        >
          ← Back to Surveys
        </button>
        <h1 style={{ fontFamily: displayFont, fontSize: 26, fontWeight: 600, margin: "0 0 4px" }}>
          {survey.title}
        </h1>
        <p style={{ color: theme.muted, fontSize: 14, margin: 0 }}>
          {responses.length} response{responses.length !== 1 ? "s" : ""}
          {survey.closesAt && ` · Closes ${new Date(survey.closesAt).toLocaleDateString()}`}
        </p>
      </div>

      {responses.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 16, padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <h3 style={{ fontFamily: displayFont, fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            No responses yet
          </h3>
          <p style={{ color: theme.muted, fontSize: 13 }}>
            Share your survey link to start collecting responses.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {questionResults.map(({ question, answers }, qi) => (
            <div
              key={question.id}
              style={{
                background: "#fff",
                borderRadius: 14,
                padding: 22,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                Q{qi + 1} · {answers.length} answer{answers.length !== 1 ? "s" : ""}
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 14px" }}>
                {question.text}
              </h3>

              {/* Rating Results */}
              {question.type === "rating" && (
                <RatingResults question={question} answers={answers} theme={theme} />
              )}

              {/* Multiple Choice Results */}
              {question.type === "multiple_choice" && (
                <MultipleChoiceResults question={question} answers={answers} theme={theme} />
              )}

              {/* Yes/No Results */}
              {question.type === "yes_no" && (
                <YesNoResults question={question} answers={answers} theme={theme} />
              )}

              {/* Free Text Results */}
              {question.type === "free_text" && (
                <FreeTextResults answers={answers} theme={theme} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Respondents list — only shown for identified surveys */}
      {responses.length > 0 && survey.responseType === "identified" && (
        <div style={{ background: "#fff", borderRadius: 14, padding: 22, boxShadow: "0 1px 3px rgba(0,0,0,0.04)", marginTop: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: theme.muted, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            👋 Respondents ({responses.filter((r: any) => r.respondentName || r.respondentEmail).length} identified)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {responses.map((r: any, i) => (
              r.respondentName || r.respondentEmail ? (
                <div key={r.id || i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: theme.paperWarm, borderRadius: 8, fontSize: 13 }}>
                  <span style={{ fontWeight: 600, color: theme.ink }}>{r.respondentName || "—"}</span>
                  {r.respondentEmail && <span style={{ color: theme.muted }}>{r.respondentEmail}</span>}
                  <span style={{ marginLeft: "auto", fontSize: 11, color: theme.muted }}>{new Date(r.submittedAt).toLocaleDateString()}</span>
                </div>
              ) : null
            ))}
          </div>
        </div>
      )}

      {/* Relay responses — show count + note, no emails */}
      {responses.length > 0 && survey.responseType === "relay" && (
        <div style={{ background: "#fff", borderRadius: 14, padding: 22, boxShadow: "0 1px 3px rgba(0,0,0,0.04)", marginTop: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: theme.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            🔒 Relay Responses
          </div>
          <p style={{ fontSize: 13, color: theme.muted, margin: 0 }}>
            {responses.length} encrypted response{responses.length !== 1 ? "s" : ""}. Emails are not visible here — reply to respondents via the <strong>Inbox</strong> tab.
          </p>
        </div>
      )}
    </div>
  );
}

// --- Rating visualization ---
function RatingResults({ question, answers, theme }: { question: any; answers: SurveyResponseAnswer[]; theme: any }) {
  const values = answers.map((a) => Number(a.value)).filter((v) => !isNaN(v));
  const avg = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;
  const distribution: Record<number, number> = {};
  for (let i = 1; i <= question.maxRating; i++) distribution[i] = 0;
  values.forEach((v) => { distribution[v] = (distribution[v] || 0) + 1; });
  const maxDist = Math.max(...Object.values(distribution), 1);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 36, fontWeight: 700, fontFamily: displayFont, color: theme.ink }}>
          {avg.toFixed(1)}
        </div>
        <div>
          <div style={{ display: "flex", gap: 2 }}>
            {Array.from({ length: question.maxRating }, (_, i) => (
              <span key={i} style={{ fontSize: 18, opacity: i < Math.round(avg) ? 1 : 0.2 }}>⭐</span>
            ))}
          </div>
          <div style={{ fontSize: 11, color: theme.muted }}>{values.length} ratings</div>
        </div>
      </div>
      {/* Distribution bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {Array.from({ length: question.maxRating }, (_, i) => {
          const rating = question.maxRating - i;
          const count = distribution[rating] || 0;
          return (
            <div key={rating} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, width: 14, textAlign: "right", color: theme.muted }}>{rating}</span>
              <div style={{ flex: 1, background: theme.divider, borderRadius: 3, height: 12, overflow: "hidden" }}>
                <div style={{ width: `${(count / maxDist) * 100}%`, height: "100%", background: theme.primary, borderRadius: 3, opacity: 0.75, transition: "width 0.3s" }} />
              </div>
              <span style={{ fontSize: 11, color: theme.muted, width: 24 }}>{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Multiple Choice visualization ---
function MultipleChoiceResults({ question, answers, theme }: { question: any; answers: SurveyResponseAnswer[]; theme: any }) {
  const counts: Record<string, number> = {};
  question.options.forEach((o: string) => { counts[o] = 0; });
  if (question.allowOther) counts["Other"] = 0;

  answers.forEach((a) => {
    const vals = Array.isArray(a.value) ? a.value : [a.value];
    vals.forEach((v: any) => {
      if (counts[v] !== undefined) counts[v]++;
      else counts["Other"] = (counts["Other"] || 0) + 1;
    });
  });

  const maxCount = Math.max(...Object.values(counts), 1);
  const total = answers.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .map(([option, count]) => (
          <div key={option}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{option}</span>
              <span style={{ fontSize: 12, color: theme.muted }}>
                {count} ({total > 0 ? Math.round((count / total) * 100) : 0}%)
              </span>
            </div>
            <div style={{ background: theme.divider, borderRadius: 4, height: 10, overflow: "hidden" }}>
              <div style={{ width: `${(count / maxCount) * 100}%`, height: "100%", background: theme.accent, borderRadius: 4, opacity: 0.75, transition: "width 0.3s" }} />
            </div>
          </div>
        ))}
    </div>
  );
}

// --- Yes/No visualization ---
function YesNoResults({ question, answers, theme }: { question: any; answers: SurveyResponseAnswer[]; theme: any }) {
  const yes = answers.filter((a) => a.value === true || a.value === "yes").length;
  const no = answers.filter((a) => a.value === false || a.value === "no").length;
  const total = yes + no;
  const yesPct = total > 0 ? Math.round((yes / total) * 100) : 0;

  // Collect follow-up texts
  const followUps = answers
    .filter((a) => a.followUpText?.trim())
    .map((a) => a.followUpText!);

  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
        <div style={{ flex: 1, textAlign: "center", padding: 14, borderRadius: 10, background: "#d1fae5" }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#059669" }}>{yesPct}%</div>
          <div style={{ fontSize: 12, color: "#059669", fontWeight: 600 }}>Yes ({yes})</div>
        </div>
        <div style={{ flex: 1, textAlign: "center", padding: 14, borderRadius: 10, background: "#fee2e2" }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#dc2626" }}>{100 - yesPct}%</div>
          <div style={{ fontSize: 12, color: "#dc2626", fontWeight: 600 }}>No ({no})</div>
        </div>
      </div>
      {/* Stacked bar */}
      <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", height: 12, marginBottom: 12 }}>
        <div style={{ flex: yes, background: "#059669", opacity: 0.75 }} />
        <div style={{ flex: no || 0.01, background: "#dc2626", opacity: 0.75 }} />
      </div>
      {/* Follow-ups */}
      {followUps.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, marginBottom: 6, textTransform: "uppercase" }}>
            Follow-up responses ({followUps.length})
          </div>
          {followUps.slice(0, 10).map((text, i) => (
            <div key={i} style={{ fontSize: 13, color: theme.ink, padding: "8px 12px", background: theme.paperWarm, borderRadius: 8, marginBottom: 4, lineHeight: 1.4 }}>
              "{text}"
            </div>
          ))}
          {followUps.length > 10 && (
            <div style={{ fontSize: 11, color: theme.muted, marginTop: 4 }}>
              + {followUps.length - 10} more
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Free Text listing ---
function FreeTextResults({ answers, theme }: { answers: SurveyResponseAnswer[]; theme: any }) {
  const texts = answers.map((a) => String(a.value)).filter((t) => t.trim());

  if (texts.length === 0) {
    return <div style={{ fontSize: 13, color: theme.muted }}>No responses</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {texts.slice(0, 20).map((text, i) => (
        <div key={i} style={{ fontSize: 13, color: theme.ink, padding: "10px 14px", background: theme.paperWarm, borderRadius: 10, lineHeight: 1.5 }}>
          {text}
        </div>
      ))}
      {texts.length > 20 && (
        <div style={{ fontSize: 11, color: theme.muted }}>+ {texts.length - 20} more responses</div>
      )}
    </div>
  );
}
