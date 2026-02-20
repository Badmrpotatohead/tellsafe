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
import type { AdminView } from "../../components/AdminSidebar";

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
  const { user, org, loading } = useAuth();
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
              </div>
            </div>

            {!categoryFilter && <DashboardStats orgId={orgId} />}
            <FeedbackList
              orgId={orgId}
              onOpenThread={openThread}
              onSelect={setSelectedFeedback}
              categoryFilter={categoryFilter}
              showArchived={view === "resolved"}
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
          <div style={{ padding: 36, fontFamily: fontStack }}>
            <h2 style={{ fontFamily: displayFont, fontSize: 22, fontWeight: 600, marginBottom: 8 }}>
              Team Access
            </h2>
            <p style={{ color: "#8a8578", fontSize: 14 }}>
              Invite other organizers to manage feedback. Coming soon.
            </p>
          </div>
        );

      case "qr":
        return (
          <div style={{ padding: 36 }}>
            <QRCodeGenerator orgSlug={org.slug} />
          </div>
        );

      case "analytics":
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
    </BrandProvider>
  );
}

