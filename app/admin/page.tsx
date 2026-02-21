// ============================================================
// TellSafe — Admin Dashboard Page
// ============================================================

"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../../components/AuthProvider";
import { BrandProvider } from "../../components/BrandProvider";
import AdminSidebar from "../../components/AdminSidebar";
import DashboardStats from "../../components/DashboardStats";
import FeedbackList from "../../components/FeedbackList";
import FeedbackDetail from "../../components/FeedbackDetail";
import { batchArchiveResolved } from "../../lib/data";
import RelayThread from "../../components/RelayThread";
import BrandingSettings from "../../components/BrandingSettings";
import TemplatesManager from "../../components/TemplatesManager";
import QRCodeGenerator from "../../components/QRCodeGenerator";
import AnalyticsDashboard from "../../components/AnalyticsDashboard";
import SurveyList from "../../components/SurveyList";
import SurveyBuilder from "../../components/SurveyBuilder";
import SurveyResults from "../../components/SurveyResults";
import BillingSettings from "../../components/BillingSettings";
import TeamAccess from "../../components/TeamAccess";
import UpdatesManager from "../../components/UpdatesManager";
import IntegrationsSettings from "../../components/IntegrationsSettings";
import type { AdminView } from "../../components/AdminSidebar";
import { PLAN_LIMITS } from "../../types";
import { createOrganization } from "../../lib/data";

const fontStack = "'Outfit', system-ui, sans-serif";
const displayFont = "'Fraunces', Georgia, serif";

const adminResponsiveCss = `
  @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes scaleIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
  @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }

  /* ====== MOBILE ADMIN (≤ 768px) ====== */
  @media (max-width: 768px) {
    /* Sidebar: hidden off-screen by default, slides in as overlay */
    .admin-sidebar {
      transform: translateX(-100%) !important;
    }
    .admin-sidebar.admin-sidebar-open {
      transform: translateX(0) !important;
    }

    /* Backdrop visible on mobile when sidebar open */
    .admin-sidebar-backdrop {
      display: block !important;
    }

    /* Main content: no left margin, full width */
    .admin-main {
      margin-left: 0 !important;
    }

    /* Mobile top bar visible */
    .admin-mobile-topbar {
      display: flex !important;
    }

    /* Content padding */
    .admin-content-pad {
      padding: 16px !important;
    }

    /* Inbox header stacks vertically */
    .admin-inbox-header {
      flex-direction: column !important;
      align-items: flex-start !important;
    }

    /* Action buttons: smaller text, wrap */
    .admin-inbox-actions {
      width: 100% !important;
    }
    .admin-action-btn {
      flex: 1 !important;
      min-width: 0 !important;
      padding: 8px 10px !important;
      font-size: 11px !important;
      text-align: center !important;
      justify-content: center !important;
    }

    /* Page title smaller */
    .admin-page-title {
      font-size: 22px !important;
    }
  }

  /* ====== TABLET (769–1024px) ====== */
  @media (min-width: 769px) and (max-width: 1024px) {
    .admin-action-btn {
      padding: 7px 10px !important;
      font-size: 11px !important;
    }
  }
`;

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Outfit', system-ui, sans-serif", background: "#f2f0eb" }}>
        <p style={{ color: "#8a8578", fontSize: 14 }}>Loading dashboard...</p>
      </div>
    }>
      <AdminPageInner />
    </Suspense>
  );
}

function AdminPageInner() {
  const { user, org, allOrgs, loading, setOrg, refreshOrg } = useAuth();
  const [view, setView] = useState<AdminView>("inbox");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [threadFeedbackId, setThreadFeedbackId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [editingSurvey, setEditingSurvey] = useState<any>(null);
  const [viewingSurveyResults, setViewingSurveyResults] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const searchParams = useSearchParams();
  const billingParam = searchParams.get("billing") as "success" | "cancel" | null;

  // --- New Org Modal ---
  const [newOrgOpen, setNewOrgOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");
  const [newOrgLoading, setNewOrgLoading] = useState(false);
  const [newOrgError, setNewOrgError] = useState<string | null>(null);

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 50);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewOrgLoading(true);
    setNewOrgError(null);
    try {
      const { getMyOrganizations } = await import("../../lib/data");
      await createOrganization(newOrgName, newOrgSlug);
      // Reload all orgs and switch to the newly created one (last in list)
      const updatedOrgs = await getMyOrganizations();
      const newOrg = updatedOrgs.find((o) => o.slug === newOrgSlug) || updatedOrgs[updatedOrgs.length - 1];
      setOrg(newOrg);
      await refreshOrg();
      setNewOrgOpen(false);
      setNewOrgName("");
      setNewOrgSlug("");
      setView("inbox");
    } catch (err: any) {
      setNewOrgError(err.message || "Failed to create organization.");
    } finally {
      setNewOrgLoading(false);
    }
  };

  // Auto-navigate to billing tab after Stripe redirect
  useEffect(() => {
    if (billingParam === "success" || billingParam === "cancel") {
      setView("billing");
    }
  }, [billingParam]);

  // Loading state
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fontStack,
          background: "#f2f0eb",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 40,
              height: 40,
              border: "3px solid #e8e5de",
              borderTopColor: "#2d6a6a",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: "#8a8578", fontSize: 14 }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Auth gate
  if (!user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fontStack,
          background: "#f2f0eb",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <a href="/" style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🛡️</div>
          </a>
          <h1
            style={{
              fontFamily: displayFont,
              fontSize: 24,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            Sign in to TellSafe
          </h1>
          <p style={{ color: "#8a8578", fontSize: 14, marginBottom: 24 }}>
            Access your admin dashboard to manage feedback.
          </p>
          <a
            href="/auth/login"
            style={{
              display: "inline-block",
              padding: "12px 32px",
              background: "#2d6a6a",
              color: "#fff",
              borderRadius: 10,
              textDecoration: "none",
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            Sign In →
          </a>
        </div>
      </div>
    );
  }

  // No org yet
  if (!org) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fontStack,
          background: "#f2f0eb",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <a href="/" style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          </a>
          <h1 style={{ fontFamily: displayFont, fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
            Welcome to TellSafe!
          </h1>
          <p style={{ color: "#8a8578", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
            Let's set up your organization so your community can start sharing feedback.
          </p>
          <a
            href="/auth/signup"
            style={{
              display: "inline-block",
              padding: "12px 32px",
              background: "#2d6a6a",
              color: "#fff",
              borderRadius: 10,
              textDecoration: "none",
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            Create Organization →
          </a>
        </div>
      </div>
    );
  }

  const orgId = org.id;

  // Pro plan allows up to 3 orgs; show "+ Add Org" only when under the limit
  const canAddOrg = org.plan === "pro" && allOrgs.length < 3;

  const viewLabel = categoryFilter
    ? categoryFilter
    : view === "inbox" ? "Inbox"
    : view === "needs_reply" ? "Needs Reply"
    : view === "resolved" ? "Resolved"
    : view === "branding" ? "Branding"
    : view === "templates" ? "Templates"
    : view === "team" ? "Team"
    : view === "qr" ? "QR Code"
    : view === "analytics" ? "Analytics"
    : view === "surveys" ? "Surveys"
    : view === "survey_build" ? "Survey Builder"
    : view === "survey_results" ? "Results"
    : view === "billing" ? "Billing"
    : "Dashboard";

  const mobileTopBar = (
    <div className="admin-mobile-topbar" style={{
      display: "none",
      alignItems: "center",
      gap: 12,
      padding: "12px 16px",
      background: "#111118",
      color: "#f8f6f1",
      position: "sticky",
      top: 0,
      zIndex: 40,
    }}>
      <button
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
        style={{
          background: "none", border: "none", color: "#f8f6f1",
          fontSize: 22, cursor: "pointer", padding: 4, lineHeight: 1,
        }}
      >☰</button>
      <span style={{ fontFamily: displayFont, fontSize: 16, fontWeight: 600 }}>{viewLabel}</span>
    </div>
  );

  const handleExportCsv = async () => {
    try {
      const { getAuth } = await import("firebase/auth");
      const token = await getAuth().currentUser?.getIdToken();
      if (!token) return alert("Please sign in to export.");

      const res = await fetch(`/api/export?orgId=${orgId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return alert(data.error || "Export failed");
      }

      // Trigger download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") ||
        "tellsafe-export.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Export failed. Please try again.");
    }
  };

  const openThread = (tid: string, fid: string) => {
    setThreadId(tid);
    setThreadFeedbackId(fid);
    setSelectedFeedback(null);
    setView("inbox");
  };

  const closeThread = () => {
    setThreadId(null);
    setThreadFeedbackId(null);
  };

  // Thread view
  if (threadId && threadFeedbackId) {
    return (
      <BrandProvider org={org}>
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,600;9..144,700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <style>{adminResponsiveCss}</style>
        <div style={{ display: "flex", minHeight: "100vh" }}>
          <AdminSidebar
            orgId={orgId}
            activeView={view}
            onNavigate={(v) => { closeThread(); setView(v); }}
            activeCategory={categoryFilter}
            onCategoryFilter={setCategoryFilter}
            mobileOpen={sidebarOpen}
            onMobileClose={() => setSidebarOpen(false)}
            plan={org.plan}
            allOrgs={allOrgs}
            onOrgSwitch={(newOrg) => { setOrg(newOrg); setView("inbox"); }}
            onAddOrg={canAddOrg ? () => setNewOrgOpen(true) : undefined}
          />
          <main className="admin-main" style={{ marginLeft: 240, flex: 1 }}>
            {mobileTopBar}
            <RelayThread
              orgId={orgId}
              threadId={threadId}
              feedbackId={threadFeedbackId}
              onBack={closeThread}
            />
          </main>
        </div>
      </BrandProvider>
    );
  }

  const renderView = () => {
    switch (view) {
      case "inbox":
      case "needs_reply":
      case "resolved":
      case "urgent":
        return (
          <div className="admin-content-pad" style={{ padding: 28 }}>
            <div
              className="admin-inbox-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <h1 className="admin-page-title" style={{ fontFamily: displayFont, fontSize: 26, fontWeight: 600 }}>
                  {categoryFilter
                    ? categoryFilter
                    : view === "inbox"
                    ? "Feedback Inbox"
                    : view === "needs_reply"
                    ? "Needs Reply"
                    : view === "urgent"
                    ? "🚨 Urgent"
                    : "Resolved"}
                </h1>
                {categoryFilter && (
                  <button
                    onClick={() => setCategoryFilter(null)}
                    style={{
                      marginTop: 6,
                      fontSize: 12,
                      color: "#8a8578",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: fontStack,
                      padding: 0,
                    }}
                  >
                    ← Back to all feedback
                  </button>
                )}
              </div>
              <div className="admin-inbox-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {PLAN_LIMITS[org.plan].hasCsvExport ? (
                  <button
                    onClick={handleExportCsv}
                    className="admin-action-btn"
                    style={{
                      padding: "7px 16px",
                      border: "1.5px solid rgba(26,26,46,0.10)",
                      borderRadius: 8,
                      background: "#fff",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      color: "#1a1a2e",
                      fontFamily: fontStack,
                    }}
                  >
                    📤 Export
                  </button>
                ) : (
                  <button
                    onClick={() => setView("billing")}
                    className="admin-action-btn"
                    style={{
                      padding: "7px 16px",
                      border: "1.5px solid rgba(26,26,46,0.10)",
                      borderRadius: 8,
                      background: "#fff",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      color: "#8a8578",
                      fontFamily: fontStack,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    📤 Export
                    <span style={{
                      fontSize: 8,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      padding: "1px 5px",
                      borderRadius: 3,
                      background: "rgba(139,92,246,0.12)",
                      color: "#7c3aed",
                    }}>PRO</span>
                  </button>
                )}
              </div>
            </div>

            {!categoryFilter && <DashboardStats orgId={orgId} />}
            <FeedbackList
              orgId={orgId}
              onOpenThread={openThread}
              onSelect={setSelectedFeedback}
              categoryFilter={categoryFilter}
              showArchived={view === "resolved"}
              viewFilter={view as "inbox" | "needs_reply" | "resolved" | "urgent"}
            />
            {view === "resolved" && (
              <div style={{ textAlign: "center", padding: "24px 0 8px" }}>
                <button
                  onClick={async () => {
                    const count = await batchArchiveResolved(orgId);
                    if (count === 0) alert("No resolved feedback to archive.");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: 12,
                    fontWeight: 500,
                    color: "#8a8578",
                    cursor: "pointer",
                    fontFamily: fontStack,
                    textDecoration: "underline",
                    textUnderlineOffset: 3,
                  }}
                >
                  📦 Archive all resolved items
                </button>
              </div>
            )}
          </div>
        );

      case "branding":
        return (
          <div style={{ padding: 36 }}>
            <BrandingSettings orgId={orgId} />
          </div>
        );

      case "templates":
        return (
          <div style={{ padding: 36 }}>
            <TemplatesManager orgId={orgId} />
          </div>
        );

      case "team":
        return (
          <div style={{ padding: 36 }}>
            <TeamAccess orgId={orgId} />
          </div>
        );

      case "qr":
        return (
          <div style={{ padding: 36 }}>
            <QRCodeGenerator orgSlug={org.slug} />
          </div>
        );

      case "analytics":
        if (!PLAN_LIMITS[org.plan].hasAnalytics) {
          return (
            <div style={{ padding: 36, fontFamily: fontStack, textAlign: "center", maxWidth: 420, margin: "60px auto" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
              <h2 style={{ fontFamily: displayFont, fontSize: 22, fontWeight: 600, marginBottom: 8 }}>
                Analytics Dashboard
              </h2>
              <p style={{ color: "#8a8578", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                See submission trends, sentiment breakdowns, category distribution, and more. Available on the Pro plan.
              </p>
              <button
                onClick={() => setView("billing")}
                style={{
                  padding: "12px 28px", border: "none", borderRadius: 10,
                  background: "#2d6a6a", color: "#fff", fontSize: 14,
                  fontWeight: 700, cursor: "pointer", fontFamily: fontStack,
                }}
              >
                Upgrade to Pro
              </button>
            </div>
          );
        }
        return <AnalyticsDashboard orgId={orgId} />;

      case "surveys":
        return (
          <SurveyList
            orgId={orgId}
            orgSlug={org.slug}
            onCreateNew={() => { setEditingSurvey(null); setView("survey_build" as any); }}
            onEdit={(s) => { setEditingSurvey(s); setView("survey_build" as any); }}
            onViewResults={(s) => { setViewingSurveyResults(s); setView("survey_results" as any); }}
          />
        );

      case "survey_build":
        return (
          <SurveyBuilder
            orgId={orgId}
            editSurvey={editingSurvey}
            onSaved={() => { setEditingSurvey(null); setView("surveys"); }}
            onCancel={() => { setEditingSurvey(null); setView("surveys"); }}
          />
        );

      case "survey_results":
        return viewingSurveyResults ? (
          <SurveyResults
            orgId={orgId}
            survey={viewingSurveyResults}
            onBack={() => { setViewingSurveyResults(null); setView("surveys"); }}
          />
        ) : null;

      case "updates":
        if (!PLAN_LIMITS[org.plan].hasUpdatesBoard) {
          return (
            <div style={{ padding: 36, fontFamily: fontStack, textAlign: "center", maxWidth: 420, margin: "60px auto" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📢</div>
              <h2 style={{ fontFamily: displayFont, fontSize: 22, fontWeight: 600, marginBottom: 8 }}>
                Updates Board
              </h2>
              <p style={{ color: "#8a8578", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                Share what changed based on feedback. Close the loop with your community and encourage more submissions. Available on the Pro plan.
              </p>
              <button
                onClick={() => setView("billing")}
                style={{
                  padding: "12px 28px", border: "none", borderRadius: 10,
                  background: "#2d6a6a", color: "#fff", fontSize: 14,
                  fontWeight: 700, cursor: "pointer", fontFamily: fontStack,
                }}
              >
                Upgrade to Pro
              </button>
            </div>
          );
        }
        return (
          <div style={{ padding: 36 }}>
            <UpdatesManager orgId={orgId} />
          </div>
        );

      case "integrations":
        if (!PLAN_LIMITS[org.plan].hasWebhooks) {
          return (
            <div style={{ padding: 36, fontFamily: fontStack, textAlign: "center", maxWidth: 420, margin: "60px auto" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔌</div>
              <h2 style={{ fontFamily: displayFont, fontSize: 22, fontWeight: 600, marginBottom: 8 }}>
                Integrations
              </h2>
              <p style={{ color: "#8a8578", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                Send new feedback directly to your Slack or Discord channel. Never miss a submission. Available on the Pro plan.
              </p>
              <button
                onClick={() => setView("billing")}
                style={{
                  padding: "12px 28px", border: "none", borderRadius: 10,
                  background: "#2d6a6a", color: "#fff", fontSize: 14,
                  fontWeight: 700, cursor: "pointer", fontFamily: fontStack,
                }}
              >
                Upgrade to Pro
              </button>
            </div>
          );
        }
        return (
          <div style={{ padding: 36 }}>
            <IntegrationsSettings orgId={orgId} />
          </div>
        );

      case "billing":
        return (
          <BillingSettings orgId={orgId} billingStatus={billingParam} />
        );

      default:
        return null;
    }
  };

  return (
    <BrandProvider org={org}>
      <link
        href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,600;9..144,700&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />
      <style>{adminResponsiveCss}</style>
      <div style={{ display: "flex", minHeight: "100vh", background: "#f2f0eb" }}>
        <AdminSidebar
          orgId={orgId}
          activeView={view}
          onNavigate={(v) => { setCategoryFilter(null); setView(v); }}
          activeCategory={categoryFilter}
          onCategoryFilter={setCategoryFilter}
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
          plan={org.plan}
          allOrgs={allOrgs}
          onOrgSwitch={(newOrg) => { setOrg(newOrg); setCategoryFilter(null); setView("inbox"); }}
          onAddOrg={canAddOrg ? () => setNewOrgOpen(true) : undefined}
        />
        <main className="admin-main" style={{ marginLeft: 240, flex: 1, minWidth: 0 }}>
          {mobileTopBar}
          {renderView()}
          {selectedFeedback && (
            <FeedbackDetail
              orgId={orgId}
              feedback={selectedFeedback}
              onClose={() => setSelectedFeedback(null)}
            />
          )}
        </main>
      </div>

      {/* ── New Organization Modal ── */}
      {newOrgOpen && (
        <div
          onClick={() => { setNewOrgOpen(false); setNewOrgError(null); }}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 20, padding: "40px 36px",
              maxWidth: 440, width: "100%",
              boxShadow: "0 16px 64px rgba(0,0,0,0.2)",
              fontFamily: fontStack,
              animation: "scaleIn 0.2s ease",
            }}
          >
            <h2 style={{ fontFamily: displayFont, fontSize: 22, fontWeight: 600, marginBottom: 6, color: "#1a1a2e" }}>
              Add Organization
            </h2>
            <p style={{ fontSize: 13, color: "#8a8578", marginBottom: 24 }}>
              Pro plan allows up to 3 organizations. You have {allOrgs.length} of 3.
            </p>

            <form onSubmit={handleCreateOrg}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5, color: "#1a1a2e" }}>
                  Organization Name
                </label>
                <input
                  value={newOrgName}
                  onChange={(e) => {
                    setNewOrgName(e.target.value);
                    setNewOrgSlug(generateSlug(e.target.value));
                  }}
                  placeholder="West Orlando Westies"
                  required
                  style={{
                    width: "100%", padding: "11px 14px",
                    border: "1.5px solid rgba(26,26,46,0.12)", borderRadius: 10,
                    fontSize: 14, color: "#1a1a2e", background: "#f8f6f1",
                    outline: "none", fontFamily: fontStack, boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5, color: "#1a1a2e" }}>
                  Your URL
                </label>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{
                    padding: "11px 12px 11px 14px",
                    background: "#eeebe4",
                    border: "1.5px solid rgba(26,26,46,0.12)",
                    borderRight: "none",
                    borderRadius: "10px 0 0 10px",
                    fontSize: 12, color: "#8a8578",
                    fontFamily: "'JetBrains Mono', monospace",
                    whiteSpace: "nowrap",
                  }}>
                    tellsafe.app/
                  </span>
                  <input
                    value={newOrgSlug}
                    onChange={(e) => setNewOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="your-org"
                    required
                    style={{
                      flex: 1, padding: "11px 14px",
                      border: "1.5px solid rgba(26,26,46,0.12)",
                      borderRadius: "0 10px 10px 0",
                      fontSize: 12, color: "#1a1a2e", background: "#f8f6f1",
                      outline: "none",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  />
                </div>
                <div style={{ fontSize: 11, color: "#8a8578", marginTop: 5 }}>
                  This is where your feedback form lives. Lowercase letters, numbers, and hyphens only.
                </div>
              </div>

              {newOrgError && (
                <div style={{
                  padding: "10px 14px", borderRadius: 10, marginBottom: 16, fontSize: 13,
                  background: "rgba(192,93,59,0.08)", color: "#c05d3b",
                }}>
                  {newOrgError}
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => { setNewOrgOpen(false); setNewOrgError(null); }}
                  style={{
                    flex: 1, padding: "12px 0", border: "1.5px solid rgba(26,26,46,0.12)",
                    borderRadius: 10, background: "transparent", color: "#8a8578",
                    fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: fontStack,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={newOrgLoading}
                  style={{
                    flex: 2, padding: "12px 0", border: "none",
                    borderRadius: 10, background: "#2d6a6a", color: "#fff",
                    fontSize: 14, fontWeight: 700,
                    cursor: newOrgLoading ? "not-allowed" : "pointer",
                    opacity: newOrgLoading ? 0.7 : 1,
                    fontFamily: fontStack,
                  }}
                >
                  {newOrgLoading ? "Creating..." : "Create Organization →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </BrandProvider>
  );
}

