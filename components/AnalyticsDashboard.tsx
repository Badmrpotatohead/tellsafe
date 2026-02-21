// ============================================================
// TellSafe v1.2 — Analytics Dashboard
// ============================================================
// Comprehensive analytics view with:
// - Submission trend (last 30 days)
// - Sentiment breakdown (pie/donut style)
// - Category distribution
// - Privacy type breakdown
// - Response time stats

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useBrand } from "./BrandProvider";
import { subscribeFeedback } from "../lib/data";
import type { Feedback } from "../types";

const fontStack = "'Outfit', system-ui, sans-serif";
const displayFont = "'Fraunces', Georgia, serif";

interface Props {
  orgId: string;
}

// --- Helpers ---
function getDaysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function getWeekLabel(d: Date): string {
  const month = d.toLocaleString("en", { month: "short" });
  return `${month} ${d.getDate()}`;
}

export default function AnalyticsDashboard({ orgId }: Props) {
  const { theme } = useBrand();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeFeedback(orgId, {}, (items) => {
      setFeedback(items);
      setLoading(false);
    });
    return () => unsub();
  }, [orgId]);

  // --- Filter by time range ---
  const filtered = useMemo(() => {
    if (timeRange === "all") return feedback;
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const cutoff = getDaysAgo(days).toISOString();
    return feedback.filter((f) => f.createdAt >= cutoff);
  }, [feedback, timeRange]);

  // --- Compute stats ---
  const stats = useMemo(() => {
    const total = filtered.length;
    const byStatus = {
      new: filtered.filter((f) => f.status === "new").length,
      needs_reply: filtered.filter((f) => f.status === "needs_reply").length,
      replied: filtered.filter((f) => f.status === "replied").length,
      resolved: filtered.filter((f) => f.status === "resolved").length,
      reopened: filtered.filter((f) => f.status === "reopened").length,
    };
    const bySentiment = {
      positive: filtered.filter((f) => f.sentimentLabel === "positive").length,
      neutral: filtered.filter((f) => f.sentimentLabel === "neutral").length,
      negative: filtered.filter((f) => f.sentimentLabel === "negative").length,
      urgent: filtered.filter((f) => f.sentimentLabel === "urgent").length,
      unanalyzed: filtered.filter((f) => !f.sentimentLabel).length,
    };
    const byType = {
      identified: filtered.filter((f) => f.type === "identified").length,
      anonymous: filtered.filter((f) => f.type === "anonymous").length,
      relay: filtered.filter((f) => f.type === "relay").length,
    };
    const byCategory: Record<string, number> = {};
    filtered.forEach((f) =>
      f.categories.forEach((c) => {
        byCategory[c] = (byCategory[c] || 0) + 1;
      })
    );

    // Resolution rate (reopened items count as not resolved)
    const closedCount = byStatus.resolved + byStatus.replied;
    const reopenedCount = byStatus.reopened;
    const resolutionRate = total > 0 ? Math.round((closedCount / total) * 100) : 0;

    // Avg sentiment score
    const scored = filtered.filter((f) => f.sentimentScore !== null);
    const avgSentiment =
      scored.length > 0
        ? scored.reduce((s, f) => s + (f.sentimentScore || 0), 0) / scored.length
        : null;

    return { total, byStatus, bySentiment, byType, byCategory, resolutionRate, avgSentiment };
  }, [filtered]);

  // --- Trend data (daily counts) ---
  const trendData = useMemo(() => {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 60;
    const data: { date: Date; label: string; count: number; sentiment: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = getDaysAgo(i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayItems = feedback.filter((f) => {
        const d = new Date(f.createdAt);
        return d >= dayStart && d < dayEnd;
      });

      const scored = dayItems.filter((f) => f.sentimentScore !== null);
      const avgScore =
        scored.length > 0
          ? scored.reduce((s, f) => s + (f.sentimentScore || 0), 0) / scored.length
          : 0;

      data.push({
        date: dayStart,
        label: formatDate(dayStart),
        count: dayItems.length,
        sentiment: avgScore,
      });
    }
    return data;
  }, [feedback, timeRange]);

  const maxCount = Math.max(...trendData.map((d) => d.count), 1);

  if (loading) {
    return (
      <div style={{ padding: 28, fontFamily: fontStack }}>
        <div style={{ height: 400, display: "flex", alignItems: "center", justifyContent: "center", color: theme.muted }}>
          Loading analytics...
        </div>
      </div>
    );
  }

  const sentimentColors: Record<string, string> = {
    positive: "#059669",
    neutral: "#8a8578",
    negative: "#d97706",
    urgent: "#dc2626",
    unanalyzed: "#d4d0c8",
  };

  const typeColors: Record<string, string> = {
    identified: theme.accent,
    anonymous: theme.primary,
    relay: theme.violet,
  };

  // Sentiment donut segments
  const sentimentTotal =
    stats.bySentiment.positive +
    stats.bySentiment.neutral +
    stats.bySentiment.negative +
    stats.bySentiment.urgent;
  const sentimentSegments = sentimentTotal > 0
    ? [
        { label: "Positive", count: stats.bySentiment.positive, color: sentimentColors.positive },
        { label: "Neutral", count: stats.bySentiment.neutral, color: sentimentColors.neutral },
        { label: "Negative", count: stats.bySentiment.negative, color: sentimentColors.negative },
        { label: "Urgent", count: stats.bySentiment.urgent, color: sentimentColors.urgent },
      ].filter((s) => s.count > 0)
    : [];

  const categoryEntries = Object.entries(stats.byCategory).sort(([, a], [, b]) => b - a);
  const maxCategoryCount = categoryEntries.length > 0 ? categoryEntries[0][1] : 1;

  return (
    <div style={{ padding: 28, fontFamily: fontStack }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontFamily: displayFont, fontSize: 26, fontWeight: 600, margin: 0 }}>
          Analytics
        </h1>
        <div style={{ display: "flex", gap: 6 }}>
          {(["7d", "30d", "90d", "all"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              style={{
                padding: "6px 14px",
                borderRadius: 100,
                fontSize: 12,
                fontWeight: 600,
                border: `1.5px solid ${timeRange === r ? theme.ink : theme.divider}`,
                background: timeRange === r ? theme.ink : "#fff",
                color: timeRange === r ? "#f8f6f1" : theme.ink,
                cursor: "pointer",
                fontFamily: fontStack,
              }}
            >
              {r === "all" ? "All Time" : r.replace("d", " days")}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        {[
          {
            label: "Total Submissions",
            value: stats.total,
            sub: `${stats.byStatus.new + stats.byStatus.needs_reply + stats.byStatus.reopened} pending`,
            color: stats.byStatus.needs_reply > 0 ? theme.accent : theme.muted,
          },
          {
            label: "Resolution Rate",
            value: `${stats.resolutionRate}%`,
            sub: stats.byStatus.reopened > 0
              ? `${stats.byStatus.resolved + stats.byStatus.replied} resolved · ${stats.byStatus.reopened} reopened`
              : `${stats.byStatus.resolved + stats.byStatus.replied} resolved`,
            color: stats.resolutionRate >= 80 ? "#059669" : stats.resolutionRate >= 50 ? "#d97706" : "#dc2626",
          },
          {
            label: "Avg Sentiment",
            value:
              stats.avgSentiment !== null
                ? stats.avgSentiment > 0.3
                  ? "👍 Positive"
                  : stats.avgSentiment < -0.3
                  ? "👎 Negative"
                  : "➡️ Neutral"
                : "—",
            sub:
              stats.avgSentiment !== null
                ? `Score: ${stats.avgSentiment.toFixed(2)}`
                : "No data",
            color: theme.muted,
            small: true,
          },
          {
            label: "Urgent Items",
            value: stats.bySentiment.urgent,
            sub: stats.bySentiment.urgent > 0 ? "Requires attention" : "All clear",
            color: stats.bySentiment.urgent > 0 ? "#dc2626" : "#059669",
          },
        ].map((card, i) => (
          <div
            key={i}
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: 18,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              animation: `fadeUp 0.4s ease ${i * 0.06}s both`,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: theme.muted }}>
              {card.label}
            </div>
            <div style={{ fontFamily: card.small ? fontStack : displayFont, fontSize: card.small ? 18 : 30, color: theme.ink, marginTop: 2, fontWeight: card.small ? 700 : 400 }}>
              {card.value}
            </div>
            <div style={{ fontSize: 11, color: card.color, fontWeight: 600, marginTop: 1 }}>
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Trend Chart */}
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 24,
          marginBottom: 20,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <h3 style={{ fontSize: 14, fontWeight: 700, color: theme.ink, margin: "0 0 18px", fontFamily: fontStack }}>
          Submission Trend
        </h3>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 140 }}>
          {trendData.map((d, i) => {
            const barH = maxCount > 0 ? (d.count / maxCount) * 120 : 0;
            const barColor =
              d.sentiment > 0.3
                ? "#059669"
                : d.sentiment < -0.3
                ? "#d97706"
                : theme.primary;

            // Show labels at intervals
            const showLabel =
              trendData.length <= 14 ||
              i % Math.ceil(trendData.length / 10) === 0 ||
              i === trendData.length - 1;

            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                }}
                title={`${d.label}: ${d.count} submission${d.count !== 1 ? "s" : ""}`}
              >
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: theme.muted,
                    opacity: d.count > 0 ? 1 : 0,
                  }}
                >
                  {d.count}
                </div>
                <div
                  style={{
                    width: "100%",
                    maxWidth: 24,
                    height: Math.max(barH, d.count > 0 ? 4 : 1),
                    background: d.count > 0 ? barColor : theme.divider,
                    borderRadius: 3,
                    transition: "height 0.3s ease",
                    opacity: d.count > 0 ? 0.85 : 0.3,
                  }}
                />
                <div
                  style={{
                    fontSize: 8,
                    color: theme.muted,
                    whiteSpace: "nowrap",
                    opacity: showLabel ? 1 : 0,
                  }}
                >
                  {d.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-column grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Sentiment Breakdown */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 700, color: theme.ink, margin: "0 0 18px", fontFamily: fontStack }}>
            Sentiment Breakdown
          </h3>
          {sentimentSegments.length === 0 ? (
            <div style={{ textAlign: "center", padding: 30, color: theme.muted, fontSize: 13 }}>
              No sentiment data yet
            </div>
          ) : (
            <div>
              {/* Horizontal stacked bar */}
              <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 28, marginBottom: 18 }}>
                {sentimentSegments.map((seg) => (
                  <div
                    key={seg.label}
                    style={{
                      flex: seg.count,
                      background: seg.color,
                      opacity: 0.85,
                      transition: "flex 0.3s ease",
                    }}
                    title={`${seg.label}: ${seg.count}`}
                  />
                ))}
              </div>
              {/* Legend */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
                {sentimentSegments.map((seg) => (
                  <div key={seg.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: seg.color, opacity: 0.85 }} />
                    <span style={{ fontSize: 12, color: theme.ink, fontWeight: 500 }}>{seg.label}</span>
                    <span style={{ fontSize: 12, color: theme.muted }}>
                      {seg.count} ({Math.round((seg.count / sentimentTotal) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
              {stats.bySentiment.unanalyzed > 0 && (
                <div style={{ fontSize: 11, color: theme.muted, marginTop: 10 }}>
                  + {stats.bySentiment.unanalyzed} unanalyzed
                </div>
              )}
            </div>
          )}
        </div>

        {/* Category Distribution */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 700, color: theme.ink, margin: "0 0 18px", fontFamily: fontStack }}>
            Category Distribution
          </h3>
          {categoryEntries.length === 0 ? (
            <div style={{ textAlign: "center", padding: 30, color: theme.muted, fontSize: 13 }}>
              No category data yet
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {categoryEntries.map(([cat, count]) => (
                <div key={cat}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: theme.ink }}>{cat}</span>
                    <span style={{ fontSize: 12, color: theme.muted }}>{count}</span>
                  </div>
                  <div style={{ background: theme.divider, borderRadius: 4, height: 8, overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${(count / maxCategoryCount) * 100}%`,
                        height: "100%",
                        background: theme.primary,
                        borderRadius: 4,
                        transition: "width 0.3s ease",
                        opacity: 0.75,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Privacy Type Breakdown */}
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <h3 style={{ fontSize: 14, fontWeight: 700, color: theme.ink, margin: "0 0 18px", fontFamily: fontStack }}>
          Privacy Mode Usage
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {([
            { key: "identified", label: "Identified", icon: "👋" },
            { key: "anonymous", label: "Anonymous", icon: "👤" },
            { key: "relay", label: "Relay", icon: "🔀" },
          ] as const).map((t) => {
            const count = stats.byType[t.key];
            const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
            return (
              <div
                key={t.key}
                style={{
                  borderRadius: 12,
                  padding: 16,
                  border: `1.5px solid ${theme.divider}`,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 4 }}>{t.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: typeColors[t.key], fontFamily: displayFont }}>
                  {count}
                </div>
                <div style={{ fontSize: 11, color: theme.muted, fontWeight: 600, marginTop: 2 }}>
                  {t.label} · {pct}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
