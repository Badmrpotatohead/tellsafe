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
  const [checkStatus, setCheckStatus] = useState<"idle" | "checking" | "not_yet">("idle");

  const handleResend = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser?.email) return;
    setStatus("sending");
    try {
      // Force a fresh token to avoid stale/expired tokens
      const token = await currentUser.getIdToken(true);
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
      // Allow retry after 3 seconds
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const handleCheckVerified = async () => {
    setCheckStatus("checking");
    try {
      await reloadUser();
      // Give state a moment to propagate — if still not verified, show feedback
      setTimeout(() => {
        const isNowVerified = auth.currentUser?.emailVerified;
        if (!isNowVerified) {
          setCheckStatus("not_yet");
          setTimeout(() => setCheckStatus("idle"), 4000);
        }
        // If verified, parent re-renders and this banner unmounts
      }, 300);
    } catch (err) {
      console.error("Failed to check verification:", err);
      setCheckStatus("not_yet");
      setTimeout(() => setCheckStatus("idle"), 4000);
    }
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
          disabled={checkStatus === "checking"}
          style={{
            padding: "5px 14px",
            border: "none",
            borderRadius: 7,
            background: checkStatus === "not_yet" ? "rgba(252,165,165,0.2)" : "rgba(255,255,255,0.15)",
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
            cursor: checkStatus === "checking" ? "wait" : "pointer",
            fontFamily: fontStack,
            whiteSpace: "nowrap",
            transition: "background 0.2s",
          }}
        >
          {checkStatus === "checking"
            ? "Checking..."
            : checkStatus === "not_yet"
            ? "Not verified yet — check your inbox"
            : "I've verified →"}
        </button>
      </div>
    </div>
  );
}
