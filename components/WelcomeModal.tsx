// ============================================================
// TellSafe — First-Time Welcome Modal
// ============================================================
// Shown once per user on their first admin dashboard visit.
// Reads/writes hasSeenWelcome on organizations/{orgId}/admins/{uid}.

"use client";

import React, { useEffect, useState, useRef } from "react";

const fontStack = "'Outfit', system-ui, sans-serif";
const displayFont = "'Fraunces', Georgia, serif";

interface Props {
  orgId: string;
  uid: string;
  primaryColor?: string;
}

const FEATURES = [
  { icon: "🔀", label: "Anonymous Relay", desc: "Respond to anonymous feedback without revealing anyone's identity" },
  { icon: "📋", label: "Surveys", desc: "Create post-event and safety surveys with built-in templates" },
  { icon: "🤖", label: "AI Sentiment Analysis", desc: "Every submission auto-tagged as positive, neutral, negative, or urgent" },
  { icon: "📊", label: "Analytics Dashboard", desc: "Track trends, sentiment, and categories over time" },
  { icon: "🎨", label: "Custom Branding", desc: "Your logo, your colors, your form" },
  { icon: "💬", label: "Slack/Discord Integration", desc: "Get feedback posted to your team channels" },
  { icon: "🌍", label: "Multi-Language Forms", desc: "Reach your whole community" },
  { icon: "📰", label: "Public Updates Board", desc: "Show your community you're listening" },
];

export default function WelcomeModal({ orgId, uid, primaryColor = "#2d6a6a" }: Props) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState<{ x: number; color: string; delay: number; duration: number; size: number }[]>([]);
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current || !orgId || !uid) return;
    checked.current = true;
    checkAndShow();
  }, [orgId, uid]);

  const checkAndShow = async () => {
    try {
      const { getFirestore, doc, getDoc } = await import("firebase/firestore");
      const { getApp } = await import("firebase/app");
      const db = getFirestore(getApp());

      const adminRef = doc(db, "organizations", orgId, "admins", uid);
      const snap = await getDoc(adminRef);

      if (!snap.exists() || !snap.data()?.hasSeenWelcome) {
        // Generate confetti
        setConfettiPieces(
          Array.from({ length: 40 }, (_, i) => ({
            x: Math.random() * 100,
            color: ["#2d6a6a", "#c05d3b", "#a3c9c9", "#f59e0b", "#7c3aed", "#059669"][i % 6],
            delay: Math.random() * 0.6,
            duration: 1.2 + Math.random() * 1.2,
            size: 6 + Math.random() * 8,
          }))
        );
        setVisible(true);
      }
    } catch (err) {
      console.warn("[WelcomeModal] Failed to check hasSeenWelcome:", err);
    }
  };

  const handleDismiss = async () => {
    setClosing(true);
    // Mark as seen in Firestore
    try {
      const { getFirestore, doc, updateDoc } = await import("firebase/firestore");
      const { getApp } = await import("firebase/app");
      const db = getFirestore(getApp());
      await updateDoc(doc(db, "organizations", orgId, "admins", uid), {
        hasSeenWelcome: true,
      });
    } catch (err) {
      console.warn("[WelcomeModal] Failed to set hasSeenWelcome:", err);
    }
    setTimeout(() => setVisible(false), 300);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
        animation: closing ? "tsWelcomeFadeOut 0.3s ease forwards" : "tsWelcomeFadeIn 0.25s ease",
        overflowY: "auto",
      }}
    >
      <style>{`
        @keyframes tsWelcomeFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tsWelcomeFadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes tsWelcomeSlideUp { from { opacity: 0; transform: translateY(24px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes tsConfettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(120px) rotate(720deg); opacity: 0; }
        }
      `}</style>

      {/* Confetti */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        {confettiPieces.map((p, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: "-20px",
              width: p.size,
              height: p.size,
              borderRadius: i % 3 === 0 ? "50%" : i % 3 === 1 ? "2px" : "0",
              background: p.color,
              animation: `tsConfettiFall ${p.duration}s ease ${p.delay}s both`,
            }}
          />
        ))}
      </div>

      {/* Modal card */}
      <div
        style={{
          background: "#fff",
          borderRadius: 24,
          padding: "40px 36px 36px",
          maxWidth: 520,
          width: "100%",
          boxShadow: "0 24px 80px rgba(0,0,0,0.22)",
          fontFamily: fontStack,
          animation: "tsWelcomeSlideUp 0.3s ease",
          position: "relative",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Shield icon */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: `linear-gradient(135deg, ${primaryColor}, #c05d3b)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 30, margin: "0 auto 16px",
            boxShadow: `0 8px 24px ${primaryColor}40`,
          }}>
            🛡️
          </div>
          <h1 style={{
            fontFamily: displayFont,
            fontSize: 26, fontWeight: 700,
            margin: "0 0 8px", color: "#1a1a2e",
            lineHeight: 1.2,
          }}>
            Welcome to TellSafe! 🎉
          </h1>
          <p style={{ fontSize: 14, color: "#5a5650", margin: 0, lineHeight: 1.6 }}>
            Thanks for trying TellSafe! You have{" "}
            <strong style={{ color: primaryColor }}>full Pro access free for 30 days</strong>
            {" "}— no credit card needed. Here's what you can do:
          </p>
        </div>

        {/* Feature list */}
        <div style={{
          background: "#f8f6f1",
          borderRadius: 16,
          padding: "16px 18px",
          marginBottom: 24,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}>
          {FEATURES.map((f) => (
            <div key={f.label} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.4 }}>{f.icon}</span>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>{f.label}</span>
                <span style={{ fontSize: 13, color: "#5a5650" }}> — {f.desc}</span>
              </div>
            </div>
          ))}
        </div>

        {/* After 30 days note */}
        <p style={{
          fontSize: 12, color: "#8a8578", textAlign: "center",
          margin: "0 0 24px", lineHeight: 1.6,
        }}>
          After 30 days, you can continue on our free plan or upgrade to keep Pro features.
        </p>

        {/* CTA */}
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
            transition: "transform 0.1s, box-shadow 0.1s",
          }}
          onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.02)"; }}
          onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
        >
          Let's go! →
        </button>
      </div>
    </div>
  );
}
