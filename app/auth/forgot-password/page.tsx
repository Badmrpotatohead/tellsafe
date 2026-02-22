// ============================================================
// TellSafe — Forgot Password Page
// ============================================================

"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../../lib/firebase";

const fontStack = "'Outfit', system-ui, sans-serif";
const displayFont = "'Fraunces', Georgia, serif";

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const pre = searchParams.get("email");
    if (pre) setEmail(pre);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/user-not-found" || code === "auth/invalid-email") {
        setError("No account found with that email address. Double-check the address or create a new account.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many attempts. Please wait a few minutes and try again.");
      } else {
        setError(`Couldn't send reset email (${code || "unknown error"}). Check the address and try again.`);
      }
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
    boxSizing: "border-box" as const,
  };

  return (
    <div style={{
      background: "#fff", borderRadius: 24, padding: "48px 40px",
      maxWidth: 440, width: "100%", boxShadow: "0 8px 32px rgba(26,26,46,0.10)",
    }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: "linear-gradient(135deg, #2d6a6a, #c05d3b)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, margin: "0 auto 16px",
          }}>🛡️</div>
        </a>

        {sent ? (
          <>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📬</div>
            <h1 style={{ fontFamily: displayFont, fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
              Check your inbox
            </h1>
            <p style={{ color: "#8a8578", fontSize: 14, lineHeight: 1.6 }}>
              If <strong style={{ color: "#1a1a2e" }}>{email}</strong> has an account,
              you&apos;ll receive a reset link shortly. Check your spam folder if it doesn&apos;t arrive within a minute.
            </p>
            <p style={{ color: "#8a8578", fontSize: 13, lineHeight: 1.6, marginTop: 10 }}>
              No email?{" "}
              <a href="/auth/signup" style={{ color: "#2d6a6a", fontWeight: 600, textDecoration: "none" }}>
                Create a new account →
              </a>
            </p>
            <a href="/auth/login" style={{
              display: "inline-block", marginTop: 20,
              padding: "10px 24px", background: "#2d6a6a", color: "#fff",
              borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: "none",
            }}>
              Back to Sign In →
            </a>
          </>
        ) : (
          <>
            <h1 style={{ fontFamily: displayFont, fontSize: 24, fontWeight: 600, marginBottom: 6 }}>
              Reset your password
            </h1>
            <p style={{ color: "#8a8578", fontSize: 14 }}>
              We&apos;ll email you a link to reset it.
            </p>

            <form onSubmit={handleSubmit} style={{ marginTop: 24, textAlign: "left" }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  style={inputStyle}
                />
              </div>

              {error && (
                <div style={{
                  padding: "10px 14px", borderRadius: 10, marginBottom: 16, fontSize: 13,
                  background: "rgba(192, 93, 59, 0.08)", color: "#c05d3b",
                }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                width: "100%", padding: 14, border: "none", borderRadius: 12,
                fontSize: 16, fontWeight: 700, color: "#fff", background: "#2d6a6a",
                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
                fontFamily: fontStack,
              }}>
                {loading ? "Sending..." : "Send Reset Link →"}
              </button>
            </form>
          </>
        )}
      </div>

      <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#8a8578" }}>
        Remember it?{" "}
        <a href="/auth/login" style={{ color: "#2d6a6a", fontWeight: 600, textDecoration: "none" }}>
          Sign in →
        </a>
      </p>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse 80% 50% at 50% 20%, rgba(45,106,106,0.08), transparent), #f8f6f1",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: fontStack, padding: 20,
    }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&display=swap"
        rel="stylesheet"
      />
      <Suspense fallback={null}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}
