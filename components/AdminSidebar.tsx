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

type AdminView = "inbox" | "needs_reply" | "resolved" | "branding" | "team" | "qr" | "templates" | "analytics" | "surveys" | "survey_build" | "survey_results" | "billing";

interface Props {
  orgId: string;
  activeView: AdminView;
  onNavigate: (view: AdminView) => void;
  activeCategory?: string | null;
  onCategoryFilter?: (category: string | null) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function AdminSidebar({ orgId, activeView, onNavigate, activeCategory, onCategoryFilter, mobileOpen, onMobileClose }: Props) {
  const { theme, orgName, logoUrl } = useBrand();
  const { logout } = useAuth();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const inboxViews: AdminView[] = ["inbox", "needs_reply", "resolved"];
  const [inboxOpen, setInboxOpen] = useState(inboxViews.includes(activeView));

  useEffect(() => {
    const unsub = subscribeFeedback(orgId, {}, setFeedback);
    return () => unsub();
  }, [orgId]);

  const needsReplyCount = feedback.filter(
    (f) => f.status === "needs_reply" || f.status === "new"
  ).length;
  const urgentCount = feedback.filter((f) => f.sentimentLabel === "urgent").length;

  const activeCount = feedback.filter((f) => f.status !== "archived").length;
  const resolvedCount = feedback.filter(
    (f) => f.status === "resolved" || f.status === "archived"
  ).length;

  type NavItem =
    | { sep: true }
    | { icon: string; label: string; view?: AdminView; badge?: number; active?: boolean; onClick?: () => void; sub?: boolean };

  const inboxSubItems: NavItem[] = [
    { icon: "⚡", label: "Needs Reply", view: "needs_reply", badge: needsReplyCount, active: activeView === "needs_reply", sub: true },
    ...(urgentCount > 0
      ? [{ icon: "🚨", label: "Urgent", view: "inbox" as AdminView, badge: urgentCount, sub: true }]
      : []),
    { icon: "✅", label: "Resolved", view: "resolved", badge: resolvedCount, active: activeView === "resolved", sub: true },
  ];

  const navItems: NavItem[] = [
    { icon: "📊", label: "Analytics", view: "analytics" as AdminView, active: activeView === "analytics" },
    { icon: "📋", label: "Surveys", view: "surveys" as AdminView, active: activeView === "surveys" || activeView === "survey_build" || activeView === "survey_results" },
    { icon: "🎨", label: "Branding", view: "branding" as AdminView, active: activeView === "branding" },
    { icon: "📋", label: "Templates", view: "templates" as AdminView, active: activeView === "templates" },
    { icon: "👥", label: "Team Access", view: "team" as AdminView, active: activeView === "team" },
    { icon: "🔗", label: "QR Code & Link", view: "qr" as AdminView, active: activeView === "qr" },
    { icon: "💳", label: "Billing", view: "billing" as AdminView, active: activeView === "billing" },
    { sep: true },
    { icon: "🚪", label: "Sign Out", onClick: logout },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onMobileClose}
          className="admin-sidebar-backdrop"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 99,
            display: "none",
          }}
        />
      )}
      <aside
        className={`admin-sidebar${mobileOpen ? " admin-sidebar-open" : ""}`}
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
          zIndex: 100,
          transition: "transform 0.25s ease",
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
        {/* ── Inbox parent with expandable sub-items ── */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            if (onCategoryFilter) onCategoryFilter(null);
            onNavigate("inbox");
            setInboxOpen(true);
            if (onMobileClose) onMobileClose();
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "9px 20px",
            color: (activeView === "inbox" && !activeCategory) ? "#fff" : "rgba(255,255,255,0.75)",
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 600,
            background: (activeView === "inbox" && !activeCategory) ? "rgba(255,255,255,0.06)" : "transparent",
            borderRight: (activeView === "inbox" && !activeCategory) ? `3px solid ${theme.accent}` : "none",
            transition: "all 0.15s",
          }}
        >
          <span style={{ fontSize: 15, width: 22, textAlign: "center" }}>📥</span>
          Inbox
          {activeCount > 0 && (
            <span style={{
              marginLeft: "auto",
              background: (activeView === "inbox" && !activeCategory) ? theme.accent : "rgba(255,255,255,0.15)",
              color: (activeView === "inbox" && !activeCategory) ? "#fff" : "rgba(255,255,255,0.8)",
              fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 100,
            }}>{activeCount}</span>
          )}
          <span
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setInboxOpen(!inboxOpen); }}
            style={{
              marginLeft: activeCount > 0 ? 6 : "auto",
              fontSize: 10,
              color: "rgba(255,255,255,0.4)",
              cursor: "pointer",
              transition: "transform 0.2s",
              transform: inboxOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >▼</span>
        </a>

        {/* Inbox sub-items */}
        {inboxOpen && inboxSubItems.map((item, i) => {
          if ("sep" in item) return null;
          const isActive = item.active;
          return (
            <a
              key={`inbox-sub-${i}`}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (onCategoryFilter) onCategoryFilter(null);
                if (item.view) onNavigate(item.view);
                if (onMobileClose) onMobileClose();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "7px 20px 7px 52px",
                color: isActive ? "#fff" : "rgba(255,255,255,0.55)",
                textDecoration: "none",
                fontSize: 12,
                fontWeight: 500,
                background: isActive ? "rgba(255,255,255,0.04)" : "transparent",
                borderRight: isActive ? `3px solid ${theme.accent}` : "none",
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: 13, width: 18, textAlign: "center" }}>{item.icon}</span>
              {item.label}
              {item.badge !== undefined && item.badge > 0 && (
                <span style={{
                  marginLeft: "auto",
                  background: isActive ? theme.accent : "rgba(255,255,255,0.1)",
                  color: isActive ? "#fff" : "rgba(255,255,255,0.6)",
                  fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 100,
                }}>{item.badge}</span>
              )}
            </a>
          );
        })}

        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 16px" }} />

        {/* ── Rest of nav items ── */}
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
                } else if (item.view) {
                  if (onCategoryFilter) onCategoryFilter(null);
                  onNavigate(item.view);
                }
                if (onMobileClose) onMobileClose();
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
    </>
  );
}

export type { AdminView };
