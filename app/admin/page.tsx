// ============================================================
// TellSafe — Admin Dashboard Page
// ============================================================
// Route: tellsafe.app/admin
// Protected page — requires authentication.
// Composes all admin components into a single-page app with
// sidebar navigation routing between views.

"use client";

import React, { useState } from "react";
import { useAuth } from "../../components/AuthProvider";
import { BrandProvider } from "../../components/BrandProvider";
import AdminSidebar from "../../components/AdminSidebar";
import DashboardStats from "../../components/DashboardStats";
import FeedbackList from "../../components/FeedbackList";
import RelayThread from "../../components/RelayThread";
import BrandingSettings from "../../components/BrandingSettings";
import TemplatesManager from "../../components/TemplatesManager";
import QRCodeGenerator from "../../components/QRCodeGenerator";
import type { AdminView } from "../../components/AdminSidebar";

const fontStack = "'Outfit', system-ui, sans-serif";
const displayFont = "'Fraunces', Georgia, serif";

export default function AdminPage() {
  const { user, org, loading } = useAuth();
  const [view, setView] = useState<AdminView>("inbox");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [threadFeedbackId, setThreadFeedbackId] = useState<string | null>(null);

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

  // Auth gate — redirect to login if not authenticated
  if (!user) {
    // In production, use Next.js redirect or middleware
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
          <div style={{ fontSize: 48, marginBottom: 16 }}>🛡️</div>
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

  // No org yet — prompt to create
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
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
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

  // Handle opening a relay thread
  const openThread = (tid: string, fid: string) => {
    setThreadId(tid);
    setThreadFeedbackId(fid);
    setView("inbox"); // stays on inbox, but shows thread overlay
  };

  const closeThread = () => {
    setThreadId(null);
    setThreadFeedbackId(null);
  };

  // If viewing a thread, show the thread view
  if (threadId && threadFeedbackId) {
    return (
      <BrandProvider org={org}>
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,600;9..144,700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <style>{`
          @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        `}</style>
        <div style={{ display: "flex", minHeight: "100vh" }}>
          <AdminSidebar orgId={orgId} activeView={view} onNavigate={(v) => { closeThread(); setView(v); }} />
          <main style={{ marginLeft: 240, flex: 1 }}>
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

  // Render the appropriate view
  const renderView = () => {
    switch (view) {
      case "inbox":
      case "needs_reply":
      case "resolved":
        return (
          <div style={{ padding: 28 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <h1 style={{ fontFamily: displayFont, fontSize: 26, fontWeight: 600 }}>
                {view === "inbox"
                  ? "Feedback Inbox"
                  : view === "needs_reply"
                  ? "Needs Reply"
                  : "Resolved"}
              </h1>
              <div style={{ display: "flex", gap: 8 }}>
                <button
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
                <button
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
                  🔗 Share Link
                </button>
              </div>
            </div>

            <DashboardStats orgId={orgId} />
            <FeedbackList orgId={orgId} onOpenThread={openThread} />
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
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
      `}</style>
      <div style={{ display: "flex", minHeight: "100vh", background: "#f2f0eb" }}>
        <AdminSidebar orgId={orgId} activeView={view} onNavigate={setView} />
        <main style={{ marginLeft: 240, flex: 1, minWidth: 0 }}>{renderView()}</main>
      </div>
    </BrandProvider>
  );
}
