// ============================================================
// TellSafe — Signup Page (Create Account + Organization)
// ============================================================

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/AuthProvider";
import { createOrganization } from "../../../lib/data";

const fontStack = "'Outfit', system-ui, sans-serif";
const displayFont = "'Fraunces', Georgia, serif";
const monoFont = "'JetBrains Mono', monospace";

export default function SignupPage() {
  const router = useRouter();
  const { signup, error: authError } = useAuth();
  const [step, setStep] = useState<"account" | "org" | "done">("account");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 50);
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signup(email, password, displayName);
      setStep("org");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createOrganization(orgName, slug);
      setStep("done");
    } catch (err: any) {
      setError(err.message || "Failed to create organization.");
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
        href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />
      <div
        style={{
          background: "#fff",
          borderRadius: 24,
          padding: "48px 40px",
          maxWidth: 440,
          width: "100%",
          boxShadow: "0 8px 32px rgba(26,26,46,0.10)",
        }}
      >
        {/* Step indicator — hidden on done step */}
        {step !== "done" && (
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 28 }}>
            {["Account", "Organization"].map((label, i) => {
              const active = (i === 0 && step === "account") || (i === 1 && step === "org");
              const completed = i === 0 && step === "org";
              return (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      width: 24, height: 24, borderRadius: "50%",
                      background: completed ? "#059669" : active ? "#2d6a6a" : "rgba(26,26,46,0.08)",
                      color: completed || active ? "#fff" : "#8a8578",
                      fontSize: 12, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    {completed ? "✓" : i + 1}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: active ? "#1a1a2e" : "#8a8578" }}>
                    {label}
                  </span>
                  {i === 0 && <span style={{ color: "#e8e5de", margin: "0 4px" }}>—</span>}
                </div>
              );
            })}
          </div>
        )}

        {step === "account" ? (
          <>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <a href="/" style={{ textDecoration: "none" }}>
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
              </a>
              <h1 style={{ fontFamily: displayFont, fontSize: 24, fontWeight: 600, marginBottom: 6 }}>
                Create your account
              </h1>
              <p style={{ color: "#8a8578", fontSize: 14 }}>
                Set up your admin account first.
              </p>
            </div>

            <form onSubmit={handleAccountSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
                  Your Name
                </label>
                <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Chris Martinez" required style={inputStyle} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
                  Email
                </label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" required style={inputStyle} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
                  Password
                </label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters" required minLength={6} style={inputStyle} />
              </div>

              {(error || authError) && (
                <div style={{
                  padding: "10px 14px", borderRadius: 10, marginBottom: 16, fontSize: 13,
                  background: "rgba(192, 93, 59, 0.08)", color: "#c05d3b",
                }}>
                  {error || authError}
                </div>
              )}

              <button type="submit" disabled={loading}
                style={{
                  width: "100%", padding: 14, border: "none", borderRadius: 12,
                  fontSize: 16, fontWeight: 700, color: "#fff", background: "#2d6a6a",
                  cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
                  fontFamily: fontStack,
                }}>
                {loading ? "Creating account..." : "Continue →"}
              </button>
            </form>
          </>
        ) : (
          <>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <h1 style={{ fontFamily: displayFont, fontSize: 24, fontWeight: 600, marginBottom: 6 }}>
                Set up your organization
              </h1>
              <p style={{ color: "#8a8578", fontSize: 14 }}>
                This is what your community will see.
              </p>
            </div>

            <form onSubmit={handleOrgSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
                  Organization Name
                </label>
                <input value={orgName}
                  onChange={(e) => {
                    setOrgName(e.target.value);
                    setSlug(generateSlug(e.target.value));
                  }}
                  placeholder="West Orlando Westies" required style={inputStyle} />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
                  Your URL
                </label>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{
                    padding: "12px 12px 12px 14px",
                    background: "#eeebe4",
                    border: "1.5px solid rgba(26,26,46,0.10)",
                    borderRight: "none",
                    borderRadius: "10px 0 0 10px",
                    fontSize: 13, color: "#8a8578", fontFamily: monoFont,
                    whiteSpace: "nowrap",
                  }}>
                    tellsafe.app/
                  </span>
                  <input value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="your-org" required
                    style={{
                      ...inputStyle,
                      borderRadius: "0 10px 10px 0",
                      fontFamily: monoFont,
                      fontSize: 13,
                    }} />
                </div>
                <div style={{ fontSize: 11, color: "#8a8578", marginTop: 5 }}>
                  This is where your feedback form lives. Keep it short and memorable.
                </div>
              </div>

              {error && (
                <div style={{
                  padding: "10px 14px", borderRadius: 10, marginBottom: 16, fontSize: 13,
                  background: "rgba(192, 93, 59, 0.08)", color: "#c05d3b",
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
                {loading ? "Creating..." : "Launch TellSafe 🚀"}
              </button>
            </form>
          </>
        )}

        {step === "account" && (
          <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#8a8578" }}>
            Already have an account?{" "}
            <a href="/auth/login" style={{ color: "#2d6a6a", fontWeight: 600, textDecoration: "none" }}>
              Sign in →
            </a>
          </p>
        )}

        {step === "done" && (
          <div style={{ textAlign: "center" }}>
            {/* Success icon */}
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "linear-gradient(135deg, #2d6a6a, #a3c9c9)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, margin: "0 auto 20px",
            }}>🚀</div>

            <h1 style={{ fontFamily: displayFont, fontSize: 24, fontWeight: 600, marginBottom: 8, color: "#1a1a2e" }}>
              You&apos;re all set!
            </h1>
            <p style={{ color: "#8a8578", fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
              <strong style={{ color: "#1a1a2e" }}>{orgName}</strong> is ready. Your community can start sharing feedback right now.
            </p>

            {/* "Add another org?" prompt */}
            <div style={{
              background: "#f8f6f1",
              borderRadius: 14,
              padding: "18px 20px",
              marginBottom: 24,
              textAlign: "left",
              border: "1.5px solid rgba(26,26,46,0.06)",
            }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", margin: "0 0 6px" }}>
                🏢 Want to add another organization?
              </p>
              <p style={{ fontSize: 13, color: "#8a8578", margin: "0 0 12px", lineHeight: 1.5 }}>
                If you manage multiple communities, the <strong>Pro plan</strong> lets you run up to 3 organizations from one account. You can add more anytime from the{" "}
                <strong style={{ color: "#2d6a6a" }}>dropdown in the top-left of your dashboard</strong>.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                <a
                  href="/admin"
                  style={{
                    display: "inline-block",
                    padding: "9px 20px",
                    background: "#2d6a6a",
                    color: "#fff",
                    borderRadius: 9,
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  Go to Dashboard →
                </a>
                <a
                  href="/admin?billing=upgrade"
                  style={{
                    display: "inline-block",
                    padding: "9px 20px",
                    border: "1.5px solid #2d6a6a",
                    color: "#2d6a6a",
                    borderRadius: 9,
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: "none",
                    background: "transparent",
                  }}
                >
                  View Pro Plans
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
