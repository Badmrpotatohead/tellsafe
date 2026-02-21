// ============================================================
// TellSafe — Dashboard Stats Cards
// ============================================================

"use client";

import React, { useState, useEffect } from "react";
import { useBrand } from "./BrandProvider";
import { getFeedbackStats } from "../lib/data";

const displayFont = "'Fraunces', Georgia, serif";
const fontStack = "'Outfit', system-ui, sans-serif";

interface Props {
  orgId: string;
}

interface Stats {
  total: number;
  needsReply: number;
  urgent: number;
  topCategory: { name: string; count: number } | null;
  sentimentCounts: {
    positive: number;
    neutral: number;
    negative: number;
    urgent: number;
    unanalyzed: number;
  };
}

export default function DashboardStats({ orgId }: Props) {
  const { theme } = useBrand();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    getFeedbackStats(orgId).then(setStats).catch(console.error);
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      getFeedbackStats(orgId).then(setStats).catch(console.error);
    }, 30000);
    return () => clearInterval(interval);
  }, [orgId]);

  if (!stats) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14,
          marginBottom: 24,
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="admin-stat-card"
            style={{
              background: "var(--admin-card, #fff)",
              borderRadius: 14,
              padding: 18,
              height: 90,
              animation: "fadeUp 0.4s ease both",
            }}
          />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Total",
      value: stats.total.toString(),
      sub: `${stats.needsReply} need attention`,
      subColor: stats.needsReply > 0 ? theme.accent : theme.primary,
    },
    {
      label: "Needs Reply",
      value: stats.needsReply.toString(),
      sub: stats.urgent > 0 ? `${stats.urgent} urgent` : "All clear",
      subColor: stats.urgent > 0 ? "#dc2626" : theme.primary,
    },
    {
      label: "Sentiment",
      value:
        stats.sentimentCounts.positive > stats.sentimentCounts.negative
          ? "👍"
          : stats.sentimentCounts.negative > stats.sentimentCounts.positive
          ? "👎"
          : "➡️",
      sub: `${stats.sentimentCounts.positive}+ ${stats.sentimentCounts.negative}- ${stats.sentimentCounts.neutral}~`,
      subColor: theme.muted,
      small: true,
    },
    {
      label: "Top Category",
      value: stats.topCategory?.name || "—",
      sub: stats.topCategory
        ? `${Math.round((stats.topCategory.count / stats.total) * 100)}% of feedback`
        : "No data",
      subColor: theme.primary,
      small: true,
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 14,
        marginBottom: 24,
        fontFamily: fontStack,
      }}
    >
      {cards.map((s, i) => (
        <div
          key={i}
          className="admin-stat-card"
          style={{
            background: "var(--admin-card, #fff)",
            borderRadius: 14,
            padding: 18,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            animation: `fadeUp 0.4s ease ${i * 0.06}s both`,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--admin-text-muted, " + theme.muted + ")",
            }}
          >
            {s.label}
          </div>
          <div
            style={{
              fontFamily: s.small ? fontStack : displayFont,
              fontSize: s.small ? 20 : 30,
              color: "var(--admin-text)",
              marginTop: 2,
              fontWeight: s.small ? 700 : 400,
            }}
          >
            {s.value}
          </div>
          <div
            style={{
              fontSize: 11,
              color: s.subColor,
              fontWeight: 600,
              marginTop: 1,
            }}
          >
            {s.sub}
          </div>
        </div>
      ))}
    </div>
  );
}
