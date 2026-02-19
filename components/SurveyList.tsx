// ============================================================
// TellSafe v1.3 — Survey List Component
// ============================================================
// Admin view showing all surveys with status, response count,
// and actions (edit, view results, share link, close, delete).

"use client";

import React, { useState, useEffect } from "react";
import { useBrand } from "./BrandProvider";
import type { Survey, SurveyStatus } from "../types/survey";

const fontStack = "'Outfit', system-ui, sans-serif";
const displayFont = "'Fraunces', Georgia, serif";

interface Props {
  orgId: string;
  orgSlug: string;
  onCreateNew: () => void;
  onEdit: (survey: Survey) => void;
  onViewResults: (survey: Survey) => void;
}

export default function SurveyList({ orgId, orgSlug, onCreateNew, onEdit, onViewResults }: Props) {
  const { theme } = useBrand();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchSurveys = async () => {
    try {
      const token = await (await import("firebase/auth")).getAuth().currentUser?.getIdToken();
      const res = await fetch(`/api/survey?orgId=${orgId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSurveys(data.surveys);
      }
    } catch (err) {
      console.error("Failed to fetch surveys:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, [orgId]);

  const updateStatus = async (surveyId: string, status: SurveyStatus) => {
    setActionLoading(surveyId);
    try {
      const token = await (await import("firebase/auth")).getAuth().currentUser?.getIdToken();
      await fetch("/api/survey", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orgId, surveyId, status }),
      });
      await fetchSurveys();
    } catch (err) {
      console.error("Status update failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteSurvey = async (surveyId: string) => {
    if (!confirm("Delete this survey and all its responses? This cannot be undone.")) return;
    setActionLoading(surveyId);
    try {
      const token = await (await import("firebase/auth")).getAuth().currentUser?.getIdToken();
      await fetch(`/api/survey?orgId=${orgId}&surveyId=${surveyId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchSurveys();
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const copyLink = (surveyId: string) => {
    const url = `${window.location.origin}/${orgSlug}/survey/${surveyId}`;
    navigator.clipboard.writeText(url).then(() => {
      alert("Survey link copied!");
    });
  };

  const statusConfig: Record<SurveyStatus, { color: string; bg: string; label: string }> = {
    draft: { color: theme.muted, bg: theme.paperWarm, label: "Draft" },
    active: { color: "#059669", bg: "#d1fae5", label: "Active" },
    closed: { color: "#d97706", bg: "#fef3c7", label: "Closed" },
    archived: { color: theme.muted, bg: theme.paperWarm, label: "Archived" },
  };

  if (loading) {
    return (
      <div style={{ padding: 28, fontFamily: fontStack }}>
        <div style={{ color: theme.muted, fontSize: 14 }}>Loading surveys...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 28, fontFamily: fontStack }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontFamily: displayFont, fontSize: 26, fontWeight: 600, margin: 0 }}>
          Surveys
        </h1>
        <button
          onClick={onCreateNew}
          style={{
            padding: "10px 20px",
            border: "none",
            borderRadius: 10,
            background: theme.primary,
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: fontStack,
          }}
        >
          + New Survey
        </button>
      </div>

      {surveys.length === 0 ? (
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 48,
            textAlign: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <h3 style={{ fontFamily: displayFont, fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
            No surveys yet
          </h3>
          <p style={{ color: theme.muted, fontSize: 14, marginBottom: 20 }}>
            Create your first survey to start collecting structured feedback from your community.
          </p>
          <button
            onClick={onCreateNew}
            style={{
              padding: "12px 28px",
              border: "none",
              borderRadius: 10,
              background: theme.primary,
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: fontStack,
            }}
          >
            Create Your First Survey
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {surveys.map((s, i) => {
            const sc = statusConfig[s.status];
            const isLoading = actionLoading === s.id;

            return (
              <div
                key={s.id}
                style={{
                  background: "#fff",
                  borderRadius: 14,
                  padding: "18px 22px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                  animation: `slideIn 0.35s ease ${i * 0.03}s both`,
                  opacity: isLoading ? 0.5 : 1,
                  transition: "opacity 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, flex: 1 }}>{s.title}</h3>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "3px 10px",
                      borderRadius: 100,
                      background: sc.bg,
                      color: sc.color,
                    }}
                  >
                    {sc.label}
                  </span>
                </div>

                {s.description && (
                  <p style={{ fontSize: 13, color: theme.muted, margin: "0 0 10px", lineHeight: 1.4 }}>
                    {s.description}
                  </p>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12, color: theme.muted }}>
                  <span>{s.questions.length} questions</span>
                  <span style={{ fontWeight: 600, color: s.responseCount > 0 ? theme.ink : theme.muted }}>
                    {s.responseCount} response{s.responseCount !== 1 ? "s" : ""}
                  </span>
                  {s.closesAt && (
                    <span>
                      Closes {new Date(s.closesAt).toLocaleDateString()}
                    </span>
                  )}
                  <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                  {s.status === "draft" && (
                    <>
                      <button onClick={() => onEdit(s)} style={actionBtnStyle(theme)}>✏️ Edit</button>
                      <button onClick={() => updateStatus(s.id, "active")} style={actionBtnStyle(theme, theme.primary, "#fff")}>
                        🚀 Publish
                      </button>
                    </>
                  )}
                  {s.status === "active" && (
                    <>
                      <button onClick={() => copyLink(s.id)} style={actionBtnStyle(theme)}>🔗 Copy Link</button>
                      <button onClick={() => onViewResults(s)} style={actionBtnStyle(theme)}>📊 Results</button>
                      <button onClick={() => updateStatus(s.id, "closed")} style={actionBtnStyle(theme)}>⏹ Close</button>
                    </>
                  )}
                  {s.status === "closed" && (
                    <>
                      <button onClick={() => onViewResults(s)} style={actionBtnStyle(theme)}>📊 Results</button>
                      <button onClick={() => updateStatus(s.id, "active")} style={actionBtnStyle(theme)}>↩ Reopen</button>
                    </>
                  )}
                  <button onClick={() => deleteSurvey(s.id)} style={{ ...actionBtnStyle(theme), color: "#dc2626", borderColor: "#fecaca" }}>
                    🗑 Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function actionBtnStyle(theme: any, bg?: string, color?: string): React.CSSProperties {
  return {
    padding: "6px 12px",
    border: bg ? "none" : `1.5px solid ${theme.divider}`,
    borderRadius: 8,
    background: bg || "#fff",
    color: color || theme.ink,
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'Outfit', system-ui, sans-serif",
  };
}
