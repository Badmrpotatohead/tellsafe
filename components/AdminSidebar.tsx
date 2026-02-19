// ============================================================
// TellSafe — Admin Sidebar Navigation
// ============================================================

"use client";

import React, { useState, useEffect } from "react";
import { useBrand } from "./BrandProvider";
import { useAuth } from "./AuthProvider";
import { subscribeFeedback } from "../lib/data";
import type { Feedback } from "../types";

const displayFont = "'Fraunces', Georgia, serif";
const monoFont = "'JetBrains Mono', monospace";
const fontStack = "'Outfit', system-ui, sans-serif";

type AdminView = "inbox" | "needs_reply" | "resolved" | "branding" | "team" | "qr" | "templates" | "analytics" | "surveys" | "survey_build" | "survey_results";

interface Props {
  orgId: string;
  activeView: AdminView;
  onNavigate: (view: AdminView) => void;
  activeCategory?: string | null;
  onCategoryFilter?: (category: string | null) => void;
}

export default function AdminSidebar({ orgId, activeView, onNavigate, activeCategory, onCategoryFilter }: Props) {
  const { theme, orgName, logoUrl, categories } = useBrand();
  const { logout } = useAuth();
  const [feedback, setFeedback] = useState<Feedback[]>([]);

  useEffect(() => {
    const unsub = subscribeFeedback(orgId, {}, setFeedback);
    return () => unsub();
  }, [orgId]);

  const totalCount = feedback.length;
  const needsReplyCount = feedback.filter(
    (f) => f.status === "needs_reply" || f.status === "new"
  ).length;
  const urgentCount = feedback.filter((f) => f.sentimentLabel === "urgent").length;

  // Count feedback per category
  const categoryCounts: Record<string, number> = {};
  feedback.forEach((f) => {
    (f.categories || []).forEach((c) => {
      categoryCounts[c] = (categoryCounts[c] || 0) + 1;
    });
  });

  const activeCount = feedback.filter((f) => f.status !== "archived").length;
  const resolvedCount = feedback.filter(
    (f) => f.status === "resolved" || f.status === "archived"
  ).length;

  type NavItem =
    | { sep: true }
    | { icon: string; label: string; view?: AdminView; badge?: number; active?: boolean; onClick?: () => void; category?: string };

  const navItems: NavItem[] = [
    { icon: "📥", label: "Inbox", view: "inbox", badge: activeCount, active: activeView === "inbox" && !activeCategory },
    { icon: "⚡", label: "Needs Reply", view: "needs_reply", badge: needsReplyCount, active: activeView === "needs_reply" },
    ...(urgentCount > 0
      ? [{ icon: "🚨", label: "Urgent", view: "inbox" as AdminView, badge: urgentCount }]
      : []),
    { icon: "✅", label: "Resolved", view: "resolved", badge: resolvedCount, active: activeView === "resolved" },
    { sep: true },
    ...categories.slice(0, 6).map((c) => ({
      icon: c.emoji,
      label: c.label,
      category: c.label,
      badge: categoryCounts[c.label] || 0,
      active: activeCategory === c.label,
    })),
    { sep: true },
    { icon: "📊", label: "Analytics", view: "analytics" as AdminView, active: activeView === "analytics" },
    { icon: "📋", label: "Surveys", view: "surveys" as AdminView, active: activeView === "surveys" || activeView === "survey_build" || activeView === "survey_results" },
    { icon: "🎨", label: "Branding", view: "branding" as AdminView, active: activeView === "branding" },
    { icon: "📋", label: "Templates", view: "templates" as AdminView, active: activeView === "templates" },
    { icon: "👥", label: "Team Access", view: "team" as AdminView, active: activeView === "team" },
    { icon: "🔗", label: "QR Code & Link", view: "qr" as AdminView, active: activeView === "qr" },
    { sep: true },
    { icon: "🚪", label: "Sign Out", onClick: logout },
  ];

  return (
    <aside
      style={{
        width: 240,
        background: "#111118",
        color: "#f8f6f1",
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        fontFamily: fontStack,
      }}
    >
      {/* Org header — links home */}
      <a
        href="/"
        style={{
          display: "block",
          padding: "22px 20px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          textDecoration: "none",
          color: "#f8f6f1",
        }}
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            style={{
              height: 32,
              maxWidth: 140,
              objectFit: "contain",
              marginBottom: 6,
            }}
          />
        ) : null}
        <h2
          style={{
            fontFamily: displayFont,
            fontSize: 18,
            fontWeight: 600,
            lineHeight: 1.2,
          }}
        >
          {orgName}
        </h2>
        <span
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.55)",
            fontFamily: monoFont,
          }}
        >
          Admin Console
        </span>
      </a>

      {/* Navigation */}
      <nav style={{ padding: "10px 0", flex: 1 }}>
        {navItems.map((item, i) => {
          if ("sep" in item) {
            return (
              <div
                key={`sep-${i}`}
                style={{
                  height: 1,
                  background: "rgba(255,255,255,0.06)",
                  margin: "8px 16px",
                }}
              />
            );
          }

          const isActive = item.active;

          return (
            <a
              key={i}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (item.onClick) {
                  item.onClick();
                } else if (item.category) {
                  // Category filter — toggle
                  if (onCategoryFilter) {
                    onCategoryFilter(activeCategory === item.category ? null : item.category);
                  }
                  onNavigate("inbox");
                } else if (item.view) {
                  if (onCategoryFilter) onCategoryFilter(null);
                  onNavigate(item.view);
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 20px",
                color: isActive ? "#fff" : "rgba(255,255,255,0.75)",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 500,
                background: isActive ? "rgba(255,255,255,0.06)" : "transparent",
                borderRight: isActive ? `3px solid ${theme.accent}` : "none",
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: 15, width: 22, textAlign: "center" }}>
                {item.icon}
              </span>
              {item.label}
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  style={{
                    marginLeft: "auto",
                    background: isActive ? theme.accent : "rgba(255,255,255,0.15)",
                    color: isActive ? "#fff" : "rgba(255,255,255,0.8)",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: 100,
                  }}
                >
                  {item.badge}
                </span>
              )}
            </a>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: "12px 20px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          fontSize: 11,
          color: "rgba(255,255,255,0.4)",
        }}
      >
        <a href="/" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>
          🛡️ Powered by TellSafe
        </a>
      </div>
    </aside>
  );
}

export type { AdminView };
