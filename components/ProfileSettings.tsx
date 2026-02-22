// ============================================================
// TellSafe — Profile / Account Settings
// ============================================================
// Allows admins to update their display name and password.
// Email changes are not supported (Firebase limitation for
// email/password auth without re-auth flow).

"use client";

import React, { useState } from "react";
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useAuth } from "./AuthProvider";

const fontStack = "'Outfit', system-ui, sans-serif";
const displayFont = "'Fraunces', Georgia, serif";

export default function ProfileSettings() {
  const { user, reloadUser } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [savingName, setSavingName] = useState(false);
  const [savedName, setSavedName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [savedPassword, setSavedPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const handleSaveName = async () => {
    if (!displayName.trim()) {
      setNameError("Name cannot be empty.");
      return;
    }
    if (!auth.currentUser) return;
    setSavingName(true);
    setNameError(null);
    try {
      await updateProfile(auth.currentUser, { displayName: displayName.trim() });
      await reloadUser();
      setSavedName(true);
      setTimeout(() => setSavedName(false), 2000);
    } catch (err: any) {
      console.error("Failed to update name:", err);
      setNameError("Failed to update name. Please try again.");
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setPasswordError("New password must include an uppercase letter.");
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      setPasswordError("New password must include a lowercase letter.");
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setPasswordError("New password must include a number.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (!auth.currentUser || !auth.currentUser.email) return;
    setSavingPassword(true);

    try {
      // Re-authenticate first
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Update password
      await updatePassword(auth.currentUser, newPassword);

      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSavedPassword(true);
      setTimeout(() => setSavedPassword(false), 3000);
    } catch (err: any) {
      console.error("Failed to change password:", err);
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setPasswordError("Current password is incorrect.");
      } else if (err.code === "auth/requires-recent-login") {
        setPasswordError("Session expired. Please log out and log back in, then try again.");
      } else {
        setPasswordError("Failed to change password. Please try again.");
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    border: "1.5px solid var(--admin-border, rgba(26,26,46,0.12))",
    borderRadius: 10,
    fontSize: 14,
    color: "var(--admin-text, #1a1a2e)",
    background: "var(--admin-input-bg, #f8f6f1)",
    outline: "none",
    fontFamily: fontStack,
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 5,
    color: "var(--admin-text, #1a1a2e)",
  };

  const eyeBtn: React.CSSProperties = {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 16,
    color: "var(--admin-text-muted, #8a8578)",
    padding: 4,
  };

  return (
    <div style={{ maxWidth: 480, fontFamily: fontStack }}>
      <h2
        style={{
          fontFamily: displayFont,
          fontSize: 22,
          fontWeight: 600,
          marginBottom: 6,
          color: "var(--admin-text, #1a1a2e)",
        }}
      >
        Account Settings
      </h2>
      <p
        style={{
          fontSize: 13,
          color: "var(--admin-text-muted, #8a8578)",
          marginBottom: 28,
          lineHeight: 1.6,
        }}
      >
        Update your profile information and password.
      </p>

      {/* ── Account info (read-only) ── */}
      <div
        style={{
          background: "var(--admin-card, #fff)",
          borderRadius: 16,
          padding: 24,
          boxShadow: "var(--admin-shadow, 0 4px 20px rgba(26,26,46,0.07))",
          marginBottom: 24,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--admin-text-muted, #8a8578)", marginBottom: 16 }}>
          Account Info
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Email</label>
          <input
            value={user?.email || ""}
            disabled
            style={{
              ...inputStyle,
              opacity: 0.6,
              cursor: "not-allowed",
            }}
          />
          <div style={{ fontSize: 11, color: "var(--admin-text-muted, #8a8578)", marginTop: 4 }}>
            Email cannot be changed. Contact support if needed.
          </div>
        </div>

        <div style={{ marginBottom: 4 }}>
          <label style={labelStyle}>Display Name</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            style={inputStyle}
          />
        </div>

        {nameError && (
          <div style={{ fontSize: 12, color: "#dc2626", marginTop: 6, marginBottom: 8 }}>
            {nameError}
          </div>
        )}

        <button
          onClick={handleSaveName}
          disabled={savingName || displayName.trim() === (user?.displayName || "")}
          style={{
            marginTop: 12,
            padding: "10px 20px",
            background: savedName ? "#059669" : "var(--admin-primary, #2d6a6a)",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            cursor: savingName || displayName.trim() === (user?.displayName || "") ? "not-allowed" : "pointer",
            fontFamily: fontStack,
            opacity: savingName || displayName.trim() === (user?.displayName || "") ? 0.5 : 1,
            transition: "all 0.2s",
          }}
        >
          {savingName ? "Saving..." : savedName ? "✓ Saved!" : "Update Name"}
        </button>
      </div>

      {/* ── Change Password ── */}
      <div
        style={{
          background: "var(--admin-card, #fff)",
          borderRadius: 16,
          padding: 24,
          boxShadow: "var(--admin-shadow, 0 4px 20px rgba(26,26,46,0.07))",
          marginBottom: 24,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--admin-text-muted, #8a8578)", marginBottom: 16 }}>
          Change Password
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Current Password</label>
          <div style={{ position: "relative", width: "100%" }}>
            <input
              type={showCurrentPw ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              style={{ ...inputStyle, paddingRight: 42 }}
            />
            <button onClick={() => setShowCurrentPw(!showCurrentPw)} style={eyeBtn} type="button">
              {showCurrentPw ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>New Password</label>
          <div style={{ position: "relative", width: "100%" }}>
            <input
              type={showNewPw ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              style={{ ...inputStyle, paddingRight: 42 }}
            />
            <button onClick={() => setShowNewPw(!showNewPw)} style={eyeBtn} type="button">
              {showNewPw ? "🙈" : "👁️"}
            </button>
          </div>
          <div style={{ fontSize: 11, color: "var(--admin-text-muted, #8a8578)", marginTop: 4 }}>
            Must include uppercase, lowercase, and a number.
          </div>
        </div>

        <div style={{ marginBottom: 4 }}>
          <label style={labelStyle}>Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
            style={inputStyle}
          />
        </div>

        {passwordError && (
          <div style={{ fontSize: 12, color: "#dc2626", marginTop: 8, marginBottom: 4 }}>
            {passwordError}
          </div>
        )}

        {savedPassword && (
          <div style={{ fontSize: 12, color: "#059669", fontWeight: 600, marginTop: 8, marginBottom: 4 }}>
            ✓ Password updated successfully!
          </div>
        )}

        <button
          onClick={handleChangePassword}
          disabled={savingPassword || !currentPassword || !newPassword}
          style={{
            marginTop: 12,
            padding: "10px 20px",
            background: "var(--admin-primary, #2d6a6a)",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            cursor: savingPassword || !currentPassword || !newPassword ? "not-allowed" : "pointer",
            fontFamily: fontStack,
            opacity: savingPassword || !currentPassword || !newPassword ? 0.5 : 1,
            transition: "all 0.2s",
          }}
        >
          {savingPassword ? "Updating..." : "Change Password"}
        </button>
      </div>

      {/* ── Verification status ── */}
      <div
        style={{
          background: "var(--admin-primary-soft, rgba(45,106,106,0.10))",
          borderRadius: 12,
          padding: 16,
          fontSize: 13,
          color: "var(--admin-primary, #2d6a6a)",
          lineHeight: 1.6,
        }}
      >
        <strong>Email verification:</strong>{" "}
        {user?.emailVerified ? (
          <span style={{ color: "#059669", fontWeight: 600 }}>✓ Verified</span>
        ) : (
          <span style={{ color: "#dc2626", fontWeight: 600 }}>⚠️ Not verified</span>
        )}
      </div>
    </div>
  );
}
