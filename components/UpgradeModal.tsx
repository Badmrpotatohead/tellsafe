// ============================================================
// TellSafe — Plan Upgrade Celebration Modal
// ============================================================
// Shown once when the admin's plan upgrades to community/pro.
// Reads/writes lastSeenPlan on organizations/{orgId}/admins/{uid}.
// Silently updates the flag on downgrades without showing a modal.

"use client";

import React, { useEffect, useState, useRef } from "react";

const fontStack = "'Outfit', system-ui, sans-serif";
const displayFont = "'Fraunces', Georgia, serif";

interface Props {
  orgId: string;
  uid: string;
  currentPlan: string;
  primaryColor?: string;
}

const PLAN_CONTENT: Record<string, { emoji: string; headline: string; body: string; cta: string }> = {
  community: {
    emoji: "🎉",
    headline: "You're on Community!",
    body: "Thanks for supporting TellSafe. You now have unlimited submissions, anonymous relay, custom branding, and up to 3 admins. Happy organizing!",
    cta: "Got it →",
  },
  pro: {
    emoji: "🚀",
    headline: "You're on Pro!",
    body: "You've unlocked everything — AI sentiment, surveys, analytics, Slack/Discord, multi-language, and more. You're running a world-class feedback system now.",
    cta: "Let's go →",
  },
};

const UPGRADE_PLANS = new Set(["community", "pro"]);

export default function UpgradeModal({ orgId, uid, currentPlan, primaryColor = "#2d6a6a" }: Props) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [planContent, setPlanContent] = useState<typeof PLAN_CONTENT[string] | null>(null);
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current || !orgId || !uid || !currentPlan) return;
    checked.current = true;
    checkAndShow();
  }, [orgId, uid, currentPlan]);

  const checkAndShow = async () => {
    try {
      const { getFirestore, doc, getDoc, updateDoc } = await import("firebase/firestore");
      const { getApp } = await import("firebase/app");
      const db = getFirestore(getApp());

      const adminRef = doc(db, "organizations", orgId, "admins", uid);
      const snap = await getDoc(adminRef);
      const lastSeenPlan = snap.data()?.lastSeenPlan ?? null;

      // Always update lastSeenPlan to current
      if (lastSeenPlan !== currentPlan) {
        await updateDoc(adminRef, { lastSeenPlan: currentPlan });

        // Only show modal for upgrades to paid plans
        if (UPGRADE_PLANS.has(currentPlan) && lastSeenPlan !== null) {
          const content = PLAN_CONTENT[currentPlan];
          if (content) {
            setPlanContent(content);
            setVisible(true);
          }
        }
      }
    } catch (err) {
      console.warn("[UpgradeModal] Failed to check lastSeenPlan:", err);
    }
  };

  const handleDismiss = () => {
    setClosing(true);
    setTimeout(() => setVisible(false), 300);
  };

  if (!visible || !planContent) return null;

  return (
    <div
      onClick={handleDismiss}
      style={{
        position: "fixed", inset: 0, zIndex: 10001,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
        animation: closing ? "tsUpgradeFadeOut 0.3s ease forwards" : "tsUpgradeFadeIn 0.25s ease",
      }}
    >
      <style>{`
        @keyframes tsUpgradeFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tsUpgradeFadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes tsUpgradeSlideUp { from { opacity: 0; transform: translateY(24px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 24,
          padding: "44px 36px 36px",
          maxWidth: 420,
          width: "100%",
          boxShadow: "0 24px 80px rgba(0,0,0,0.22)",
          fontFamily: fontStack,
          animation: "tsUpgradeSlideUp 0.3s ease",
          textAlign: "center",
        }}
      >
        {/* Big emoji */}
        <div style={{ fontSize: 56, marginBottom: 16, lineHeight: 1 }}>
          {planContent.emoji}
        </div>

        <h1 style={{
          fontFamily: displayFont,
          fontSize: 26, fontWeight: 700,
          margin: "0 0 12px", color: "#1a1a2e",
        }}>
          {planContent.headline}
        </h1>

        <p style={{
          fontSize: 15, color: "#5a5650",
          lineHeight: 1.65, margin: "0 0 28px",
        }}>
          {planContent.body}
        </p>

        <button
          onClick={handleDismiss}
          style={{
            width: "100%", padding: "14px 0",
            background: primaryColor,
            color: "#fff",
            border: "none", borderRadius: 12,
            fontSize: 16, fontWeight: 700,
            cursor: "pointer", fontFamily: fontStack,
            boxShadow: `0 4px 16px ${primaryColor}40`,
          }}
        >
          {planContent.cta}
        </button>
      </div>
    </div>
  );
}
