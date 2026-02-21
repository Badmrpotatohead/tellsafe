// ============================================================
// TellSafe — Email Verification Banner
// ============================================================
// Shown at the top of every admin page when the user's email
// is unverified. Soft — never blocks access on its own.
// After 14 days of non-verification, the admin page renders the
// hard lockout screen instead (handled in admin/page.tsx).

"use client";

import React, { useState } from "react";
import { auth } from "../lib/firebase";
import { useAuth } from "./AuthProvider";

const fontStack = "'Outfit', system-ui, sans-serif";

export default function EmailVerificationBanner() {
  const { reloadUser } = useAuth();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleResend = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser?.email) return;
    setStatus("sending");
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: currentUser.email }),
      });
      if (!res.ok) throw new Error("non-ok response");
      setStatus("sent");
    } catch (err: any) {
      console.error("Failed to send verification email:", err);
      setStatus("error");
    }
  };

  const handleCheckVerified = async () => {
    await reloadUser();
    // The parent re-renders and checks user.emailVerified — if now true, banner disappears
  };

  return (
    <div
      style={{
        background: "linear-gradient(90deg, #7c2d12, #c05d3b)",
        color: "#fff",
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontSize: 13,
        fontFamily: fontStack,
        flexWrap: "wrap",
        zIndex: 30,
        position: "sticky",
        top: 0,
      }}
    >
      <span style={{ fontWeight: 700, flexShrink: 0 }}>⚠️ Email not verified</span>
      <span style={{ color: "rgba(255,255,255,0.85)", flexShrink: 0 }}>
        Check your inbox for a verification link. Verify within 14 days to keep access.
      </span>
      <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
        {status === "idle" && (
          <button
            onClick={handleResend}
            style={{
              padding: "5px 14px",
              border: "1.5px solid rgba(255,255,255,0.5)",
              borderRadius: 7,
              background: "transparent",
              color: "#fff",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: fontStack,
              whiteSpace: "nowrap",
            }}
          >
            Resend email
          </button>
        )}
        {status === "sending" && (
          <span style={{ fontSize: 12, opacity: 0.8, alignSelf: "center" }}>Sending...</span>
        )}
        {status === "sent" && (
          <span style={{ fontSize: 12, fontWeight: 700, color: "#86efac", alignSelf: "center" }}>
            ✓ Sent! Check your inbox.
          </span>
        )}
        {status === "error" && (
          <span style={{ fontSize: 12, color: "#fca5a5", alignSelf: "center" }}>
            Failed — try again in a moment.
          </span>
        )}
        <button
          onClick={handleCheckVerified}
          style={{
            padding: "5px 14px",
            border: "none",
            borderRadius: 7,
            background: "rgba(255,255,255,0.15)",
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: fontStack,
            whiteSpace: "nowrap",
          }}
        >
          I've verified →
        </button>
      </div>
    </div>
  );
}
