// ============================================================
// TellSafe — Login Page
// ============================================================

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/AuthProvider";

const fontStack = "'Outfit', system-ui, sans-serif";
const displayFont = "'Fraunces', Georgia, serif";

export default function LoginPage() {
  const router = useRouter();
  const { login, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      router.push("/admin");
    } catch {
      // Error is set via auth context
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    border: "1.5px solid rgba(26,26,46,0.10)",
    borderRadius: 10,
    fontSize: 15,
    color: "#1a1a2e",
    background: "#f8f6f1",
    outline: "none",
    fontFamily: fontStack,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse 80% 50% at 50% 20%, rgba(45,106,106,0.08), transparent), #f8f6f1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: fontStack,
        padding: 20,
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&display=swap"
        rel="stylesheet"
      />
      <div
        style={{
          background: "#fff",
          borderRadius: 24,
          padding: "48px 40px",
          maxWidth: 420,
          width: "100%",
          boxShadow: "0 8px 32px rgba(26,26,46,0.10)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 48, height: 48, borderRadius: 14,
              background: "linear-gradient(135deg, #2d6a6a, #c05d3b)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, margin: "0 auto 16px",
            }}
          >
            🛡️
          </div>
          <h1 style={{ fontFamily: displayFont, fontSize: 26, fontWeight: 600, marginBottom: 6 }}>
            Welcome back
          </h1>
          <p style={{ color: "#8a8578", fontSize: 14 }}>Sign in to your TellSafe admin dashboard.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5 }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" required style={inputStyle} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5 }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" required style={inputStyle} />
          </div>

          {error && (
            <div style={{
              padding: "10px 14px", borderRadius: 10, marginBottom: 16, fontSize: 13,
              background: "rgba(192, 93, 59, 0.08)", color: "#c05d3b",
              border: "1px solid rgba(192, 93, 59, 0.15)",
            }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{
              width: "100%", padding: 14, border: "none", borderRadius: 12,
              fontSize: 16, fontWeight: 700, color: "#fff", background: "#2d6a6a",
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
              fontFamily: fontStack,
            }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#8a8578" }}>
          Don't have an account?{" "}
          <a href="/auth/signup" style={{ color: "#2d6a6a", fontWeight: 600, textDecoration: "none" }}>
            Create one →
          </a>
        </p>
      </div>
    </div>
  );
}
