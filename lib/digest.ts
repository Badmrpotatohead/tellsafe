// ============================================================
// TellSafe — Weekly Digest Generator
// ============================================================
// Queries feedback from the last 7 days and computes summary stats.

import { adminCollections } from "./firebase-admin";

export interface DigestData {
  orgId: string;
  orgName: string;
  totalNew: number;
  urgent: number;
  needsReply: number;
  resolved: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
    urgent: number;
  };
  topCategories: Array<{ name: string; count: number }>;
  hasActivity: boolean;
}

export async function generateDigest(orgId: string, orgName: string, since: Date): Promise<DigestData> {
  const sinceISO = since.toISOString();

  const feedbackSnap = await adminCollections
    .feedback(orgId)
    .where("createdAt", ">=", sinceISO)
    .get();

  const items = feedbackSnap.docs.map((d) => d.data());

  const totalNew = items.length;
  const urgent = items.filter((f) => f.sentimentLabel === "urgent").length;
  const needsReply = items.filter(
    (f) => f.status === "needs_reply" || f.status === "new"
  ).length;
  const resolved = items.filter(
    (f) => f.status === "resolved" || f.status === "archived"
  ).length;

  // Sentiment breakdown
  const sentimentBreakdown = {
    positive: items.filter((f) => f.sentimentLabel === "positive").length,
    neutral: items.filter((f) => f.sentimentLabel === "neutral").length,
    negative: items.filter((f) => f.sentimentLabel === "negative").length,
    urgent,
  };

  // Category counts
  const categoryCounts: Record<string, number> = {};
  items.forEach((f) => {
    (f.categories || []).forEach((c: string) => {
      categoryCounts[c] = (categoryCounts[c] || 0) + 1;
    });
  });

  const topCategories = Object.entries(categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  return {
    orgId,
    orgName,
    totalNew,
    urgent,
    needsReply,
    resolved,
    sentimentBreakdown,
    topCategories,
    hasActivity: totalNew > 0,
  };
}
