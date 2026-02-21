// ============================================================
// TellSafe — Admin Sidebar Navigation
// ============================================================

"use client";

import React, { useState, useEffect, useRef } from "react";
import { useBrand } from "./BrandProvider";
import { useAuth } from "./AuthProvider";
import { subscribeFeedback } from "../lib/data";
import { PLAN_LIMITS } from "../types";
import type { Feedback, Plan, Organization } from "../types";

const displayFont = "'Fraunces', Georgia, serif";
const monoFont = "'JetBrains Mono', monospace";
const fontStack = "'Outfit', system-ui, sans-serif";

type AdminView = "inbox" | "needs_reply" | "resolved" | "urgent" | "branding" | "team" | "qr" | "templates" | "analytics" | "surveys" | "survey_build" | "survey_results" | "billing" | "updates" | "integrations";

// Views that require specific plan features
const PRO_VIEWS: AdminView[] = ["analytics", "templates"];

interface Props {
  orgId: string;
  activeView: AdminView;
  onNavigate: (view: AdminView) => void;
  activeCategory?: string | null;
  onCategoryFilter?: (category: string | null) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  plan?: Plan;
  allOrgs?: Organization[];
  onOrgSwitch?: (org: Organization) => void;
  onAddOrg?: () => void;
}

export default function AdminSidebar({ orgId, activeView, onNavigate, activeCategory, onCategoryFilter, mobileOpen, onMobileClose, plan = "free", allOrgs = [], onOrgSwitch, onAddOrg }: Props) {
  const { theme, orgName, logoUrl } = useBrand();
  const { logout } = useAuth();
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const orgDropdownRef = useRef<HTMLDivElement>(null);

  // Close org dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(e.target as Node)) {
        setOrgDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const inboxViews: AdminView[] = ["inbox", "needs_reply", "resolved", "urgent"];
  const [inboxOpen, setInboxOpen] = useState(inboxViews.includes(activeView));

  useEffect(() => {
    const unsub = subscribeFeedback(orgId, {}, setFeedback);
    return () => unsub();
  }, [orgId]);

  const needsReplyCount = feedback.filter(
    (f) => f.status === "needs_reply" || f.status === "new"
  ).length;
  const urgentCount = feedback.filter((f) => f.sentimentLabel === "urgent" && f.status !== "resolved" && f.status !== "archived").length;

  const activeCount = feedback.filter((f) => f.status !== "archived").length;
  const resolvedCount = feedback.filter(
    (f) => f.status === "resolved" || f.status === "archived"
  ).length;

  const limits = PLAN_LIMITS[plan];

  type NavItem =
    | { sep: true }
    | { icon: string; label: string; view?: AdminView; badge?: number; active?: boolean; onClick?: () => void; sub?: boolean; proTag?: boolean };

  const inboxSubItems: NavItem[] = [
    { icon: "⚡", label: "Needs Reply", view: "needs_reply", badge: needsReplyCount, active: activeView === "needs_reply", sub: true },
    ...(urgentCount > 0
      ? [{ icon: "🚨", label: "Urgent", view: "urgent" as AdminView, badge: urgentCount, active: activeView === "urgent", sub: true }]
      : []),
    { icon: "✅", label: "Resolved", view: "resolved", badge: resolvedCount, active: activeView === "resolved", sub: true },
  ];

  const navItems: NavItem[] = [
    { icon: "📊", label: "Analytics", view: "analytics" as AdminView, active: activeView === "analytics", proTag: !limits.hasAnalytics },
    { icon: "📋", label: "Surveys", view: "surveys" as AdminView, active: activeView === "surveys" || activeView === "survey_build" || activeView === "survey_results" },
    { icon: "📢", label: "Updates", view: "updates" as AdminView, active: activeView === "updates", proTag: !limits.hasUpdatesBoard },
    { icon: "🎨", label: "Branding", view: "branding" as AdminView, active: activeView === "branding" },
    { icon: "📝", label: "Templates", view: "templates" as AdminView, active: activeView === "templates", proTag: !limits.hasTemplates },
    { icon: "👥", label: "Team Access", view: "team" as AdminView, active: activeView === "team" },
    { icon: "🔗", label: "QR Code & Link", view: "qr" as AdminView, active: activeView === "qr" },
    { icon: "🔌", label: "Integrations", view: "integrations" as AdminView, active: activeView === "integrations", proTag: !limits.hasWebhooks },
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
      {/* Org header — clickable dropdown if Pro + multiple orgs */}
      <div ref={orgDropdownRef} style={{ position: "relative" }}>
        <div
          onClick={() => {
            const canOpen = (allOrgs.length > 1 && onOrgSwitch) || onAddOrg;
            if (canOpen) setOrgDropdownOpen((o) => !o);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "22px 20px 18px",
            borderBottom: orgDropdownOpen ? "none" : "1px solid rgba(255,255,255,0.06)",
            color: "#f8f6f1",
            cursor: ((allOrgs.length > 1 && onOrgSwitch) || onAddOrg) ? "pointer" : "default",
            userSelect: "none",
            transition: "background 0.15s",
            ...((allOrgs.length > 1 && onOrgSwitch) || onAddOrg ? { background: orgDropdownOpen ? "rgba(255,255,255,0.04)" : "transparent" } : {}),
          }}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              style={{
                height: 36,
                width: 36,
                objectFit: "contain",
                borderRadius: 8,
                flexShrink: 0,
              }}
            />
          ) : null}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              style={{
                fontFamily: displayFont,
                fontSize: 18,
                fontWeight: 600,
                lineHeight: 1.2,
                margin: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
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
          </div>
          {((allOrgs.length > 1 && onOrgSwitch) || onAddOrg) && (
            <span style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.4)",
              transition: "transform 0.2s",
              transform: orgDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
              flexShrink: 0,
            }}>▼</span>
          )}
        </div>

        {/* Org switcher dropdown */}
        {orgDropdownOpen && (
          <div style={{
            background: "#1a1a28",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            {/* Existing orgs list */}
            {allOrgs.map((o) => {
              const isCurrent = o.id === orgId;
              return (
                <button
                  key={o.id}
                  onClick={() => {
                    if (!isCurrent && onOrgSwitch) onOrgSwitch(o);
                    setOrgDropdownOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "10px 20px",
                    border: "none",
                    background: isCurrent ? "rgba(255,255,255,0.06)" : "transparent",
                    color: isCurrent ? "#fff" : "rgba(255,255,255,0.7)",
                    fontSize: 13,
                    fontWeight: isCurrent ? 600 : 400,
                    cursor: isCurrent ? "default" : "pointer",
                    textAlign: "left",
                    fontFamily: fontStack,
                    transition: "background 0.15s",
                  }}
                >
                  <span style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: isCurrent ? "rgba(45,106,106,0.4)" : "rgba(255,255,255,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    color: isCurrent ? "#a3c9c9" : "rgba(255,255,255,0.5)",
                    flexShrink: 0,
                  }}>
                    {o.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {o.name}
                  </span>
                  {isCurrent && (
                    <span style={{ fontSize: 10, color: "#a3c9c9" }}>✓</span>
                  )}
                </button>
              );
            })}

            {/* Add new org button — Pro only, max 3 orgs */}
            {onAddOrg ? (
              <button
                onClick={() => {
                  setOrgDropdownOpen(false);
                  onAddOrg();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "10px 20px",
                  border: "none",
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  background: "transparent",
                  color: "#a3c9c9",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: fontStack,
                  transition: "background 0.15s",
                }}
              >
                <span style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  border: "1.5px dashed rgba(163,201,201,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  color: "#a3c9c9",
                  flexShrink: 0,
                }}>+</span>
                Add Organization
              </button>
            ) : (
              <div style={{
                padding: "10px 20px",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                fontSize: 11,
                color: "rgba(255,255,255,0.3)",
                fontFamily: fontStack,
              }}>
                Up to 3 orgs on Pro
              </div>
            )}
          </div>
        )}
      </div>

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
              {item.proTag && (
                <span style={{
                  marginLeft: "auto",
                  fontSize: 8,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  padding: "2px 6px",
                  borderRadius: 4,
                  background: "rgba(139,92,246,0.2)",
                  color: "#a78bfa",
                }}>PRO</span>
              )}
              {!item.proTag && item.badge !== undefined && item.badge > 0 && (
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
