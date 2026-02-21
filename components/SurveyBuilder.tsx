// ============================================================
// TellSafe v1.3 — Survey Builder Component
// ============================================================
// Admin interface for creating and editing surveys.
// Supports: rating, multiple choice, yes/no, free text
// Features: reorder questions, templates, preview, publish

"use client";

import React, { useState } from "react";
import { useBrand } from "./BrandProvider";
import { useAuth } from "./AuthProvider";
import {
  SURVEY_TEMPLATES,
  type SurveyQuestion,
  type QuestionType,
  type SurveyTemplate,
} from "../types/survey";
import { auth } from "../lib/firebase";

const fontStack = "'Outfit', system-ui, sans-serif";
const displayFont = "'Fraunces', Georgia, serif";

interface Props {
  orgId: string;
  onSaved: (surveyId: string) => void;
  onCancel: () => void;
  editSurvey?: any; // existing survey to edit
}

const QUESTION_TYPE_OPTIONS: { type: QuestionType; label: string; icon: string }[] = [
  { type: "rating", label: "Rating Scale", icon: "⭐" },
  { type: "multiple_choice", label: "Multiple Choice", icon: "☑️" },
  { type: "yes_no", label: "Yes / No", icon: "👍" },
  { type: "free_text", label: "Free Text", icon: "✏️" },
];

function newQuestion(type: QuestionType, order: number): SurveyQuestion {
  const base = { id: `q_${Date.now()}_${order}`, type, text: "", required: true, order };
  switch (type) {
    case "rating":
      return { ...base, type: "rating", maxRating: 5, lowLabel: "", highLabel: "" };
    case "multiple_choice":
      return { ...base, type: "multiple_choice", options: ["", ""], allowMultiple: false, allowOther: false };
    case "yes_no":
      return { ...base, type: "yes_no", followUpOnYes: "", followUpOnNo: "" };
    case "free_text":
      return { ...base, type: "free_text", placeholder: "", maxLength: 1000 };
  }
}

export default function SurveyBuilder({ orgId, onSaved, onCancel, editSurvey }: Props) {
  const { theme } = useBrand();
  const { user } = useAuth();

  const [step, setStep] = useState<"template" | "build">(editSurvey ? "build" : "template");
  const [title, setTitle] = useState(editSurvey?.title || "");
  const [description, setDescription] = useState(editSurvey?.description || "");
  const [questions, setQuestions] = useState<SurveyQuestion[]>(editSurvey?.questions || []);
  const [responseType, setResponseType] = useState<"identified" | "anonymous" | "relay">(
    editSurvey?.responseType ?? "anonymous"
  );
  const [closesAt, setClosesAt] = useState(editSurvey?.closesAt?.split("T")[0] || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(editSurvey?.templateId || null);

  // --- Template Selection ---
  const selectTemplate = (tmpl: SurveyTemplate) => {
    setTitle(tmpl.name);
    setDescription(tmpl.description);
    setTemplateId(tmpl.id);
    setQuestions(
      tmpl.questions.map((q, i) => ({
        ...q,
        id: `q_${Date.now()}_${i}`,
        order: i,
      } as SurveyQuestion))
    );
    setStep("build");
  };

  const startBlank = () => {
    setTitle("");
    setDescription("");
    setQuestions([]);
    setTemplateId(null);
    setStep("build");
  };

  // --- Question Management ---
  const addQuestion = (type: QuestionType) => {
    setQuestions([...questions, newQuestion(type, questions.length)]);
  };

  const updateQuestion = (index: number, updates: Partial<SurveyQuestion>) => {
    setQuestions(
      questions.map((q, i) => (i === index ? { ...q, ...updates } as SurveyQuestion : q))
    );
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index).map((q, i) => ({ ...q, order: i })));
  };

  const moveQuestion = (from: number, to: number) => {
    if (to < 0 || to >= questions.length) return;
    const arr = [...questions];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    setQuestions(arr.map((q, i) => ({ ...q, order: i })));
  };

  // MC option helpers
  const addOption = (qIndex: number) => {
    const q = questions[qIndex];
    if (q.type === "multiple_choice") {
      updateQuestion(qIndex, { options: [...q.options, ""] });
    }
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    const q = questions[qIndex];
    if (q.type === "multiple_choice") {
      const opts = [...q.options];
      opts[optIndex] = value;
      updateQuestion(qIndex, { options: opts });
    }
  };

  const removeOption = (qIndex: number, optIndex: number) => {
    const q = questions[qIndex];
    if (q.type === "multiple_choice" && q.options.length > 2) {
      updateQuestion(qIndex, { options: q.options.filter((_, i) => i !== optIndex) });
    }
  };

  // --- Save ---
  const handleSave = async (publish: boolean) => {
    if (!title.trim()) return setError("Survey title is required");
    if (questions.length === 0) return setError("Add at least one question");

    // Validate all questions have text
    const empty = questions.find((q) => !q.text.trim());
    if (empty) return setError("All questions must have text");

    // Validate MC options
    const badMc = questions.find(
      (q) => q.type === "multiple_choice" && q.options.some((o) => !o.trim())
    );
    if (badMc) return setError("All multiple choice options must have text");

    setError(null);
    setSaving(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Not signed in — please refresh and sign in again");
      }
      const token = await user.getIdToken(true);

      const method = editSurvey ? "PUT" : "POST";
      const body: any = {
        orgId,
        title: title.trim(),
        description: description.trim(),
        questions,
        responseType,
        closesAt: closesAt ? new Date(closesAt + "T23:59:59").toISOString() : null,
        opensAt: null,
        templateId,
      };

      if (editSurvey) {
        body.surveyId = editSurvey.id;
        if (publish) body.status = "active";
      }

      const res = await fetch("/api/survey", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("[SurveyBuilder] Save failed:", res.status, data);
        const detail = data.detail || data.reason || "";
        throw new Error(`${data.error || "Failed to save survey"} (${res.status})${detail ? ": " + detail : ""}`);
      }

      const data = await res.json();

      // If publishing a new survey, update status
      if (publish && !editSurvey) {
        await fetch("/api/survey", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            orgId,
            surveyId: data.surveyId,
            status: "active",
          }),
        });
      }

      onSaved(data.surveyId || editSurvey?.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    border: `1.5px solid ${theme.divider}`,
    borderRadius: 10,
    fontSize: 14,
    background: "#fff",
    fontFamily: fontStack,
    outline: "none",
    boxSizing: "border-box",
  };

  // =============================================
  // Template Selection Step
  // =============================================
  if (step === "template") {
    return (
      <div style={{ padding: 28, fontFamily: fontStack, maxWidth: 800 }}>
        <h1 style={{ fontFamily: displayFont, fontSize: 26, fontWeight: 600, marginBottom: 6 }}>
          Create a Survey
        </h1>
        <p style={{ color: theme.muted, fontSize: 14, marginBottom: 28 }}>
          Start from a template or build from scratch.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, marginBottom: 20 }}>
          {/* Blank survey card */}
          <div
            onClick={startBlank}
            style={{
              background: "#fff",
              border: `2px dashed ${theme.divider}`,
              borderRadius: 14,
              padding: 22,
              cursor: "pointer",
              transition: "all 0.2s",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>✨</div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Start from Scratch</div>
            <div style={{ fontSize: 12, color: theme.muted }}>Build your own custom survey</div>
          </div>

          {/* Template cards */}
          {SURVEY_TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              onClick={() => selectTemplate(tmpl)}
              style={{
                background: "#fff",
                border: `1.5px solid ${theme.divider}`,
                borderRadius: 14,
                padding: 22,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>{tmpl.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{tmpl.name}</div>
              <div style={{ fontSize: 12, color: theme.muted, lineHeight: 1.4 }}>
                {tmpl.description}
              </div>
              <div
                style={{
                  marginTop: 10,
                  fontSize: 11,
                  color: theme.primary,
                  fontWeight: 600,
                }}
              >
                {tmpl.questions.length} questions
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onCancel}
          style={{
            padding: "8px 20px",
            border: `1.5px solid ${theme.divider}`,
            borderRadius: 8,
            background: "#fff",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            color: theme.muted,
            fontFamily: fontStack,
          }}
        >
          ← Back
        </button>
      </div>
    );
  }

  // =============================================
  // Build Step
  // =============================================
  return (
    <div style={{ padding: 28, fontFamily: fontStack, maxWidth: 800 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontFamily: displayFont, fontSize: 26, fontWeight: 600, margin: 0 }}>
          {editSurvey ? "Edit Survey" : "Build Survey"}
        </h1>
        <button
          onClick={() => { if (!editSurvey) setStep("template"); else onCancel(); }}
          style={{
            padding: "6px 14px",
            border: `1.5px solid ${theme.divider}`,
            borderRadius: 8,
            background: "#fff",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            color: theme.muted,
            fontFamily: fontStack,
          }}
        >
          {editSurvey ? "Cancel" : "← Templates"}
        </button>
      </div>

      {error && (
        <div style={{ background: "#fee2e2", color: "#dc2626", padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Survey Info */}
      <div style={{ background: "#fff", borderRadius: 14, padding: 22, marginBottom: 18, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Survey title..."
          style={{ ...inputStyle, fontSize: 18, fontWeight: 600, fontFamily: displayFont, marginBottom: 10, border: "none", padding: "4px 0" }}
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description (optional)..."
          style={{ ...inputStyle, border: "none", padding: "4px 0", color: theme.muted }}
        />
      </div>

      {/* Questions */}
      {questions.map((q, qi) => (
        <div
          key={q.id}
          style={{
            background: "#fff",
            borderRadius: 14,
            padding: 22,
            marginBottom: 12,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            borderLeft: `4px solid ${theme.primary}`,
          }}
        >
          {/* Question header */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: theme.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Q{qi + 1} · {QUESTION_TYPE_OPTIONS.find((o) => o.type === q.type)?.label}
            </span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
              <button onClick={() => moveQuestion(qi, qi - 1)} disabled={qi === 0}
                style={{ background: "none", border: "none", cursor: qi === 0 ? "default" : "pointer", fontSize: 14, opacity: qi === 0 ? 0.2 : 0.6 }}>↑</button>
              <button onClick={() => moveQuestion(qi, qi + 1)} disabled={qi === questions.length - 1}
                style={{ background: "none", border: "none", cursor: qi === questions.length - 1 ? "default" : "pointer", fontSize: 14, opacity: qi === questions.length - 1 ? 0.2 : 0.6 }}>↓</button>
              <button onClick={() => removeQuestion(qi)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#dc2626", opacity: 0.6 }}>✕</button>
            </div>
          </div>

          {/* Question text */}
          <input
            value={q.text}
            onChange={(e) => updateQuestion(qi, { text: e.target.value })}
            placeholder="Enter your question..."
            style={{ ...inputStyle, fontWeight: 600, marginBottom: 12 }}
          />

          {/* Type-specific fields */}
          {q.type === "rating" && (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                value={q.lowLabel || ""}
                onChange={(e) => updateQuestion(qi, { lowLabel: e.target.value })}
                placeholder="Low label (e.g. Poor)"
                style={{ ...inputStyle, flex: 1 }}
              />
              <div style={{ display: "flex", gap: 4 }}>
                {Array.from({ length: q.maxRating }, (_, i) => (
                  <span key={i} style={{ fontSize: 18, opacity: 0.3 }}>⭐</span>
                ))}
              </div>
              <input
                value={q.highLabel || ""}
                onChange={(e) => updateQuestion(qi, { highLabel: e.target.value })}
                placeholder="High label (e.g. Excellent)"
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>
          )}

          {q.type === "multiple_choice" && (
            <div>
              {q.options.map((opt, oi) => (
                <div key={oi} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 14, opacity: 0.3 }}>{q.allowMultiple ? "☐" : "○"}</span>
                  <input
                    value={opt}
                    onChange={(e) => updateOption(qi, oi, e.target.value)}
                    placeholder={`Option ${oi + 1}`}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  {q.options.length > 2 && (
                    <button onClick={() => removeOption(qi, oi)}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#dc2626", opacity: 0.5 }}>✕</button>
                  )}
                </div>
              ))}
              <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
                <button onClick={() => addOption(qi)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: theme.primary, fontWeight: 600, fontFamily: fontStack, padding: 0 }}>
                  + Add option
                </button>
                <label style={{ fontSize: 12, color: theme.muted, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                  <input type="checkbox" checked={q.allowMultiple} onChange={(e) => updateQuestion(qi, { allowMultiple: e.target.checked })} />
                  Allow multiple selections
                </label>
                <label style={{ fontSize: 12, color: theme.muted, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                  <input type="checkbox" checked={q.allowOther} onChange={(e) => updateQuestion(qi, { allowOther: e.target.checked })} />
                  Add "Other" option
                </label>
              </div>
            </div>
          )}

          {q.type === "yes_no" && (
            <div style={{ display: "flex", gap: 10 }}>
              <input
                value={q.followUpOnYes || ""}
                onChange={(e) => updateQuestion(qi, { followUpOnYes: e.target.value })}
                placeholder="Follow-up prompt if Yes (optional)"
                style={{ ...inputStyle, flex: 1 }}
              />
              <input
                value={q.followUpOnNo || ""}
                onChange={(e) => updateQuestion(qi, { followUpOnNo: e.target.value })}
                placeholder="Follow-up prompt if No (optional)"
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>
          )}

          {q.type === "free_text" && (
            <input
              value={q.placeholder || ""}
              onChange={(e) => updateQuestion(qi, { placeholder: e.target.value })}
              placeholder="Placeholder text (optional)"
              style={inputStyle}
            />
          )}

          {/* Required toggle */}
          <div style={{ marginTop: 10 }}>
            <label style={{ fontSize: 12, color: theme.muted, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
              <input type="checkbox" checked={q.required} onChange={(e) => updateQuestion(qi, { required: e.target.checked })} />
              Required
            </label>
          </div>
        </div>
      ))}

      {/* Add Question Buttons */}
      <div style={{ background: "#fff", borderRadius: 14, padding: 18, marginBottom: 18, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: theme.muted, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Add Question
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {QUESTION_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.type}
              onClick={() => addQuestion(opt.type)}
              style={{
                padding: "8px 16px",
                border: `1.5px solid ${theme.divider}`,
                borderRadius: 10,
                background: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: fontStack,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div style={{ background: "#fff", borderRadius: 14, padding: 22, marginBottom: 18, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: theme.muted, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Settings
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Response type selector */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: theme.muted, marginBottom: 8 }}>Response Type</div>
            <div style={{ display: "flex", gap: 8 }}>
              {([
                { value: "identified", icon: "👋", label: "Identified", desc: "Name & email required" },
                { value: "anonymous", icon: "🎭", label: "Anonymous", desc: "No personal info collected" },
                { value: "relay", icon: "🔒", label: "Relay", desc: "Encrypted — admin can reply" },
              ] as const).map((opt) => {
                const active = responseType === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setResponseType(opt.value)}
                    style={{
                      flex: 1,
                      padding: "10px 8px",
                      borderRadius: 10,
                      border: `2px solid ${active ? theme.primary : theme.divider}`,
                      background: active ? `${theme.primary}10` : theme.paper,
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ fontSize: 18, marginBottom: 2 }}>{opt.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: active ? theme.primary : theme.ink }}>{opt.label}</div>
                    <div style={{ fontSize: 10, color: theme.muted, lineHeight: 1.3, marginTop: 2 }}>{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <label style={{ fontSize: 13, whiteSpace: "nowrap" }}>Auto-close on:</label>
            <input
              type="date"
              value={closesAt}
              onChange={(e) => setClosesAt(e.target.value)}
              style={{ ...inputStyle, width: "auto" }}
            />
            {closesAt && (
              <button onClick={() => setClosesAt("")}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: theme.muted }}>Clear</button>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => handleSave(false)}
          disabled={saving}
          style={{
            padding: "12px 24px",
            border: `1.5px solid ${theme.divider}`,
            borderRadius: 10,
            background: "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
            fontFamily: fontStack,
          }}
        >
          {saving ? "Saving..." : "Save as Draft"}
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={saving}
          style={{
            padding: "12px 24px",
            border: "none",
            borderRadius: 10,
            background: theme.primary,
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
            fontFamily: fontStack,
          }}
        >
          {saving ? "Publishing..." : "Publish Survey"}
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: "12px 24px",
            background: "none",
            border: "none",
            fontSize: 13,
            color: theme.muted,
            cursor: "pointer",
            fontFamily: fontStack,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
