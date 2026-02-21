// ============================================================
// TellSafe — Billing Settings Component
// ============================================================
// Admin view showing current plan, plan comparison cards,
// upgrade buttons, and billing management.

"use client";

import React, { useState, useEffect } from "react";
import { useBrand } from "./BrandProvider";
import { useAuth } from "./AuthProvider";
import { PLAN_LIMITS } from "../types";
import type { Plan } from "../types";
import { auth } from "../lib/firebase";

const fontStack = "'Outfit', system-ui, sans-serif";
const displayFont = "'Fraunces', Georgia, serif";

interface Props {
  orgId: string;
  billingStatus?: "success" | "cancel" | null;
}

type BillingInterval = "month" | "year";

interface PlanCard {
  plan: Plan;
  name: string;
  monthlyPrice: string;   // displayed when toggle = monthly
  annualPrice: string;    // per-month figure when toggle = annual
  annualTotal: string;    // e.g. "$47.88/yr" — shown as sub-note
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

const PLAN_CARDS: PlanCard[] = [
  {
    plan: "free",
    name: "Free",
    monthlyPrice: "$0",
    annualPrice: "$0",
    annualTotal: "",
    period: "",
    description: "Get started with anonymous feedback",
    features: [
      "25 submissions/month",
      "1 admin",
      "Anonymous & identified feedback",
      "Basic inbox management",
      "Kiosk/tablet mode",
    ],
  },
  {
    plan: "community",
    name: "Community",
    monthlyPrice: "$4.99",
    annualPrice: "$3.99",
    annualTotal: "$47.88/yr",
    period: "/month",
    description: "For growing organizations",
    highlighted: true,
    features: [
      "Unlimited submissions",
      "3 admins",
      "Everything in Free",
      "Anonymous relay messaging",
      "Custom branding & colors",
      "In-app replies & categories",
    ],
  },
  {
    plan: "pro",
    name: "Pro",
    monthlyPrice: "$9.99",
    annualPrice: "$7.99",
    annualTotal: "$95.88/yr",
    period: "/month",
    description: "Full suite for serious orgs",
    features: [
      "Unlimited submissions",
      "5 admins",
      "Everything in Community",
      "AI sentiment analysis",
      "Surveys & response templates",
      "CSV export & analytics",
      "Multi-language forms",
      "Public updates board",
      "Slack/Discord integration",
    ],
  },
];

export default function BillingSettings({ orgId, billingStatus }: Props) {
  const { theme } = useBrand();
  const { org, refreshOrg } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [interval, setInterval] = useState<BillingInterval>("year");

  const currentPlan = org?.plan || "free";
  const currentInterval = (org?.billingInterval as BillingInterval | null) || null;
  const limits = PLAN_LIMITS[currentPlan];

  // Handle billing redirect status
  useEffect(() => {
    if (billingStatus === "success") {
      setShowToast("Your plan has been upgraded! Changes may take a moment to reflect.");
      refreshOrg();
    } else if (billingStatus === "cancel") {
      setShowToast("Checkout was cancelled. No changes were made.");
    }
  }, [billingStatus]);

  // Auto-dismiss toast
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const handleUpgrade = async (plan: Plan) => {
    if (plan === "free" || plan === currentPlan) return;

    setLoading(plan);
    setError(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        setError("Please sign in to upgrade.");
        return;
      }

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orgId, plan, interval }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create checkout session.");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Upgrade failed:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const handleManageBilling = async () => {
    setLoading("portal");
    setError(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        setError("Please sign in.");
        return;
      }

      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orgId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to open billing portal.");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Portal failed:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const planIndex = (p: Plan) => (p === "free" ? 0 : p === "community" ? 1 : 2);

  // Human-readable current plan label including interval
  const currentPlanLabel =
    currentPlan === "free"
      ? "Free"
      : currentPlan === "community"
      ? currentInterval === "year" ? "Community (Annual)" : "Community (Monthly)"
      : currentInterval === "year" ? "Pro (Annual)" : "Pro (Monthly)";

  return (
    <div style={{ padding: 36, fontFamily: fontStack, maxWidth: 900 }}>
      {/* Toast */}
      {showToast && (
        <div
          style={{
            position: "fixed",
            top: 24,
            right: 24,
            padding: "14px 22px",
            background: billingStatus === "success" ? "#059669" : "#d97706",
            color: "#fff",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            fontFamily: fontStack,
            zIndex: 1000,
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            animation: "fadeUp 0.35s ease both",
          }}
        >
          {showToast}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: displayFont, fontSize: 26, fontWeight: 600, margin: 0 }}>
          Billing & Plan
        </h1>
        <p style={{ color: theme.muted, fontSize: 14, marginTop: 6 }}>
          Manage your subscription and see what&apos;s included in each plan.
        </p>
      </div>

      {/* Current plan badge */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: "18px 24px",
          marginBottom: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: theme.muted, fontWeight: 600, marginBottom: 4 }}>
            CURRENT PLAN
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: theme.ink }}>
              {currentPlanLabel}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: 100,
                background: currentPlan === "free" ? theme.paperWarm : currentPlan === "community" ? "#dbeafe" : "#ede9fe",
                color: currentPlan === "free" ? theme.muted : currentPlan === "community" ? "#1d4ed8" : "#7c3aed",
              }}
            >
              {currentPlan === "free" ? "Free tier" : "Active"}
            </span>
          </div>
        </div>

        {/* Usage bar */}
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, color: theme.muted, marginBottom: 4 }}>
            Submissions this month
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 120,
                height: 6,
                borderRadius: 3,
                background: theme.divider,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, ((org?.submissionCount || 0) / (limits.maxSubmissionsPerMonth === Infinity ? 1000 : limits.maxSubmissionsPerMonth)) * 100)}%`,
                  height: "100%",
                  borderRadius: 3,
                  background: limits.maxSubmissionsPerMonth !== Infinity && (org?.submissionCount || 0) > limits.maxSubmissionsPerMonth * 0.8
                    ? "#dc2626"
                    : theme.primary,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: theme.ink }}>
              {org?.submissionCount || 0}
              {limits.maxSubmissionsPerMonth === Infinity ? "" : ` / ${limits.maxSubmissionsPerMonth}`}
            </span>
          </div>
        </div>
      </div>

      {/* Manage billing button (for paid plans) */}
      {org?.stripeSubscriptionId && (
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={handleManageBilling}
            disabled={loading === "portal"}
            style={{
              padding: "10px 20px",
              border: `1.5px solid ${theme.divider}`,
              borderRadius: 10,
              background: "#fff",
              color: theme.ink,
              fontSize: 13,
              fontWeight: 600,
              cursor: loading === "portal" ? "wait" : "pointer",
              fontFamily: fontStack,
              opacity: loading === "portal" ? 0.6 : 1,
            }}
          >
            {loading === "portal" ? "Opening..." : "Manage Billing & Invoices"}
          </button>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div
          style={{
            padding: "12px 18px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 10,
            color: "#dc2626",
            fontSize: 13,
            fontWeight: 500,
            marginBottom: 20,
          }}
        >
          {error}
        </div>
      )}

      {/* ── Billing interval toggle — pill buttons ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{
          display: "inline-flex",
          background: theme.divider,
          borderRadius: 100,
          padding: 3,
          gap: 2,
        }}>
          <button
            onClick={() => setInterval("month")}
            style={{
              padding: "7px 20px",
              borderRadius: 100,
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: fontStack,
              transition: "all 0.2s",
              background: interval === "month" ? "#fff" : "transparent",
              color: interval === "month" ? theme.ink : theme.muted,
              boxShadow: interval === "month" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval("year")}
            style={{
              padding: "7px 20px",
              borderRadius: 100,
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: fontStack,
              transition: "all 0.2s",
              background: interval === "year" ? theme.primary : "transparent",
              color: interval === "year" ? "#fff" : theme.muted,
              boxShadow: interval === "year" ? "0 1px 3px rgba(45,106,106,0.3)" : "none",
              display: "flex",
              alignItems: "center",
              gap: 7,
            }}
          >
            Annual
            <span style={{
              fontSize: 10,
              fontWeight: 800,
              padding: "2px 7px",
              borderRadius: 100,
              background: interval === "year" ? "rgba(255,255,255,0.25)" : theme.primary,
              color: "#fff",
              letterSpacing: "0.02em",
            }}>SAVE 20%</span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {PLAN_CARDS.map((card) => {
          const isCurrent = card.plan === currentPlan;
          const isDowngrade = planIndex(card.plan) < planIndex(currentPlan);
          const isLoading = loading === card.plan;
          const displayPrice = interval === "year" ? card.annualPrice : card.monthlyPrice;

          return (
            <div
              key={card.plan}
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: 24,
                boxShadow: card.highlighted
                  ? "0 4px 20px rgba(0,0,0,0.08)"
                  : "0 1px 3px rgba(0,0,0,0.04)",
                border: isCurrent
                  ? `2px solid ${theme.primary}`
                  : card.highlighted
                  ? "2px solid rgba(45,106,106,0.2)"
                  : "2px solid transparent",
                position: "relative" as const,
                display: "flex",
                flexDirection: "column" as const,
              }}
            >
              {/* Current badge */}
              {isCurrent && (
                <div
                  style={{
                    position: "absolute",
                    top: -10,
                    right: 16,
                    background: theme.primary,
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: 100,
                  }}
                >
                  CURRENT
                </div>
              )}

              {/* Popular badge */}
              {card.highlighted && !isCurrent && (
                <div
                  style={{
                    position: "absolute",
                    top: -10,
                    right: 16,
                    background: theme.accent,
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: 100,
                  }}
                >
                  POPULAR
                </div>
              )}

              <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px" }}>{card.name}</h3>
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 32, fontWeight: 700, color: theme.ink }}>{displayPrice}</span>
                {card.period && (
                  <span style={{ fontSize: 14, color: theme.muted }}>{card.period}</span>
                )}
              </div>
              {/* Annual sub-note */}
              {interval === "year" && card.annualTotal && (
                <div style={{ fontSize: 12, color: theme.muted, marginBottom: 8 }}>
                  billed annually ({card.annualTotal})
                </div>
              )}
              <p style={{ fontSize: 13, color: theme.muted, margin: "0 0 16px", lineHeight: 1.4 }}>
                {card.description}
              </p>

              {/* Features */}
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", flex: 1 }}>
                {card.features.map((f, i) => (
                  <li
                    key={i}
                    style={{
                      fontSize: 13,
                      color: theme.ink,
                      padding: "4px 0",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span style={{ color: "#059669", fontSize: 14 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* Action button */}
              {isCurrent ? (
                <button
                  disabled
                  style={{
                    padding: "10px 20px",
                    border: `1.5px solid ${theme.divider}`,
                    borderRadius: 10,
                    background: theme.paperWarm,
                    color: theme.muted,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "default",
                    fontFamily: fontStack,
                    width: "100%",
                  }}
                >
                  Current Plan
                </button>
              ) : isDowngrade ? (
                <button
                  onClick={handleManageBilling}
                  disabled={!org?.stripeSubscriptionId}
                  style={{
                    padding: "10px 20px",
                    border: `1.5px solid ${theme.divider}`,
                    borderRadius: 10,
                    background: "#fff",
                    color: theme.muted,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: org?.stripeSubscriptionId ? "pointer" : "default",
                    fontFamily: fontStack,
                    width: "100%",
                    opacity: org?.stripeSubscriptionId ? 1 : 0.5,
                  }}
                >
                  Downgrade
                </button>
              ) : (
                <button
                  onClick={() => handleUpgrade(card.plan)}
                  disabled={isLoading}
                  style={{
                    padding: "10px 20px",
                    border: "none",
                    borderRadius: 10,
                    background: theme.primary,
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: isLoading ? "wait" : "pointer",
                    fontFamily: fontStack,
                    width: "100%",
                    opacity: isLoading ? 0.6 : 1,
                    transition: "opacity 0.2s",
                  }}
                >
                  {isLoading ? "Redirecting..." : `Upgrade to ${card.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Feature comparison footer */}
      <div
        style={{
          marginTop: 28,
          padding: "16px 20px",
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          fontSize: 13,
          color: theme.muted,
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: theme.ink }}>Need help choosing?</strong>{" "}
        Free is perfect for trying TellSafe out. Community adds relay messaging, custom branding, and
        unlimited submissions. Pro unlocks AI sentiment analysis, response templates, CSV exports,
        analytics, multi-language forms, a public updates board, and Slack/Discord integration for organizations that need the full picture.
      </div>
    </div>
  );
}
