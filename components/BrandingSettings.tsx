// ============================================================
// TellSafe — Branding Settings Component
// ============================================================

"use client";

import React, { useState, useRef } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../lib/firebase";
import { updateOrganization } from "../lib/data";
import { useBrand } from "./BrandProvider";
import { useAuth } from "./AuthProvider";
import { PLAN_LIMITS } from "../types";
import type { Category } from "../types";

const fontStack = "'Outfit', system-ui, sans-serif";
const displayFont = "'Fraunces', Georgia, serif";
const monoFont = "'JetBrains Mono', monospace";

const MAX_LOGO_SIZE_MB = 2;
const MAX_LOGO_SIZE_BYTES = MAX_LOGO_SIZE_MB * 1024 * 1024;

// Common emoji icons for category picker
const EMOJI_OPTIONS = [
  "💬", "💡", "❤️", "🎵", "🏠", "📚", "🤝", "🔒",
  "⚡", "🎯", "🙏", "🎨", "🏆", "📢", "🔧", "🌟",
  "👥", "📋", "🎉", "🚀", "💪", "🧩", "🔥", "✨",
];

interface Props {
  orgId: string;
}

export default function BrandingSettings({ orgId }: Props) {
  const { theme } = useBrand();
  const { org, refreshOrg } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const hasBranding = org ? PLAN_LIMITS[org.plan].hasCustomBranding : false;

  const [name, setName] = useState(org?.name || "");
  const [tagline, setTagline] = useState(org?.tagline || "");
  const [heroHeading, setHeroHeading] = useState(org?.heroHeading || "");
  const [primaryColor, setPrimaryColor] = useState(org?.primaryColor || "#2d6a6a");
  const [accentColor, setAccentColor] = useState(org?.accentColor || "#c05d3b");
  const [categories, setCategories] = useState<Category[]>(org?.categories || []);
  const [logoUrl, setLogoUrl] = useState(org?.logoUrl || null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newCatEmoji, setNewCatEmoji] = useState("");
  const [newCatLabel, setNewCatLabel] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    border: `1.5px solid ${theme.divider}`,
    borderRadius: 10,
    fontSize: 14,
    color: theme.ink,
    background: theme.paper,
    outline: "none",
    fontFamily: fontStack,
  };

  const labelStyle = {
    display: "block" as const,
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 5,
    color: theme.ink,
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Validate file size
    if (file.size > MAX_LOGO_SIZE_BYTES) {
      setUploadError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max size is ${MAX_LOGO_SIZE_MB}MB.`);
      // Reset input so same file can be re-selected
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setUploadError("Unsupported file type. Use PNG, JPG, SVG, or WebP.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    setUploading(true);
    try {
      const storageRef = ref(storage, `logos/${orgId}/logo`);
      await uploadBytes(storageRef, file, { contentType: file.type });
      const url = await getDownloadURL(storageRef);
      setLogoUrl(url);
    } catch (err) {
      console.error("Logo upload failed:", err);
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeLogo = () => {
    setLogoUrl(null);
    setUploadError(null);
  };

  const addCategory = () => {
    if (!newCatLabel.trim()) return;
    if (categories.length >= 10) return;
    setCategories((prev) => [...prev, { emoji: newCatEmoji || "📌", label: newCatLabel.trim() }]);
    setNewCatEmoji("");
    setNewCatLabel("");
    setShowEmojiPicker(false);
  };

  const removeCategory = (idx: number) => {
    setCategories((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateOrganization(orgId, {
        name,
        tagline,
        heroHeading: heroHeading.trim() || null,
        primaryColor,
        accentColor,
        categories,
        logoUrl,
      });
      await refreshOrg();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  // Gate check for branding customization
  const brandingLocked = !hasBranding;

  // --- Live Preview Component ---
  const FormPreview = () => {
    const previewPrimary = primaryColor || "#2d6a6a";
    const previewAccent = accentColor || "#c05d3b";
    return (
      <div style={{
        background: theme.paper,
        borderRadius: 16,
        border: `1.5px solid ${theme.divider}`,
        overflow: "hidden",
        marginBottom: 28,
      }}>
        <div style={{
          padding: "10px 16px",
          background: theme.white,
          borderBottom: `1px solid ${theme.divider}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: theme.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Live Preview
          </span>
          <button
            onClick={() => setShowPreview(false)}
            style={{ background: "none", border: "none", fontSize: 14, color: theme.muted, cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: 20, textAlign: "center" }}>
          {/* Mini feedback form preview */}
          <div style={{
            background: theme.white,
            borderRadius: 16,
            padding: 24,
            maxWidth: 340,
            margin: "0 auto",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}>
            <div style={{
              height: 3,
              borderRadius: "16px 16px 0 0",
              background: `linear-gradient(90deg, ${previewPrimary}, ${previewAccent})`,
              margin: "-24px -24px 16px",
            }} />

            {/* Logo / initials */}
            <div style={{ marginBottom: 12 }}>
              {logoUrl ? (
                <img src={logoUrl} alt="" style={{ height: 40, maxWidth: 120, objectFit: "contain", borderRadius: 6 }} />
              ) : (
                <div style={{
                  width: 44, height: 44, margin: "0 auto",
                  background: `linear-gradient(135deg, ${previewPrimary}, ${previewAccent})`,
                  borderRadius: 12,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, color: "#fff", fontWeight: 700,
                }}>
                  {(name || "Org").split(" ").map((w) => w[0]).join("").slice(0, 3)}
                </div>
              )}
            </div>

            <h4 style={{ fontFamily: displayFont, fontSize: 16, fontWeight: 600, marginBottom: 4, color: theme.ink }}>
              Share Your <span style={{ color: previewPrimary }}>Feedback</span>
            </h4>
            <p style={{ fontSize: 11, color: theme.muted, marginBottom: 14, lineHeight: 1.4 }}>
              {tagline || "Your voice matters..."}
            </p>

            {/* Categories preview */}
            {categories.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center", marginBottom: 12 }}>
                {categories.slice(0, 5).map((c, i) => (
                  <span key={i} style={{
                    padding: "3px 10px",
                    borderRadius: 100,
                    fontSize: 10,
                    fontWeight: 500,
                    border: i === 0 ? `1.5px solid ${previewPrimary}` : `1px solid ${theme.divider}`,
                    background: i === 0 ? previewPrimary : theme.white,
                    color: i === 0 ? "#fff" : theme.ink,
                  }}>{c.emoji} {c.label}</span>
                ))}
                {categories.length > 5 && (
                  <span style={{ fontSize: 10, color: theme.muted, padding: "3px 6px" }}>+{categories.length - 5}</span>
                )}
              </div>
            )}

            {/* Fake textarea */}
            <div style={{
              background: theme.paper,
              borderRadius: 8,
              padding: "8px 10px",
              border: `1px solid ${theme.divider}`,
              fontSize: 10,
              color: theme.muted,
              textAlign: "left",
              minHeight: 36,
              marginBottom: 10,
            }}>
              What's on your mind?
            </div>

            {/* Fake button */}
            <div style={{
              padding: "8px 16px",
              borderRadius: 8,
              background: previewAccent,
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
            }}>
              Send Feedback
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 480, fontFamily: fontStack }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <h2 style={{ fontFamily: displayFont, fontSize: 22, fontWeight: 600, margin: 0 }}>
          Customize Your Form
        </h2>
        <button
          onClick={() => setShowPreview(!showPreview)}
          style={{
            padding: "6px 14px",
            border: `1.5px solid ${theme.divider}`,
            borderRadius: 8,
            background: showPreview ? theme.primary : theme.white,
            color: showPreview ? "#fff" : theme.ink,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: fontStack,
            transition: "all 0.2s",
          }}
        >
          {showPreview ? "Hide Preview" : "Preview Form"}
        </button>
      </div>
      <p style={{ fontSize: 13, color: theme.muted, marginBottom: 28, lineHeight: 1.6 }}>
        These settings control how your public feedback form looks.
        {brandingLocked && " Logo and color customization is available on the Community plan and above."}
      </p>

      {/* Live Preview */}
      {showPreview && <FormPreview />}

      {/* Logo Upload */}
      <div style={{ marginBottom: 28, opacity: brandingLocked ? 0.5 : 1, pointerEvents: brandingLocked ? "none" : "auto" }}>
        <label style={labelStyle}>
          Organization Logo
          {brandingLocked && <span style={{ color: theme.violet, fontWeight: 500, marginLeft: 6 }}>Community+</span>}
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              border: `2px dashed ${uploadError ? theme.accent : theme.divider}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              background: theme.white,
              cursor: "pointer",
              flexShrink: 0,
              transition: "border-color 0.2s",
            }}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? (
              <span style={{ fontSize: 12, color: theme.muted }}>Uploading...</span>
            ) : logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                style={{ width: "100%", height: "100%", objectFit: "contain", padding: 6 }}
              />
            ) : (
              <span
                style={{
                  fontSize: 12,
                  color: theme.muted,
                  textAlign: "center",
                  lineHeight: 1.3,
                  padding: 8,
                }}
              >
                Click to upload
              </span>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
            style={{ display: "none" }}
            onChange={handleLogoUpload}
          />
          <div>
            <p style={{ fontSize: 13, color: theme.ink, fontWeight: 500 }}>
              {logoUrl ? "Logo uploaded" : "No logo yet"}
            </p>
            <p style={{ fontSize: 11, color: theme.muted }}>
              PNG, JPG, SVG, or WebP. Max {MAX_LOGO_SIZE_MB}MB. Recommended 200x200px.
            </p>
            {uploadError && (
              <p style={{ fontSize: 11, color: theme.accent, fontWeight: 600, marginTop: 3 }}>
                {uploadError}
              </p>
            )}
            {logoUrl && (
              <button
                onClick={removeLogo}
                style={{
                  fontSize: 12,
                  color: theme.accent,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  marginTop: 4,
                  fontWeight: 600,
                }}
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Org Name — always editable */}
      <div style={{ marginBottom: 22 }}>
        <label style={labelStyle}>Organization Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
      </div>

      {/* Tagline — always editable */}
      <div style={{ marginBottom: 22 }}>
        <label style={labelStyle}>Tagline</label>
        <input
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="Your voice matters..."
          style={inputStyle}
        />
        <div style={{ fontSize: 11, color: theme.muted, marginTop: 4 }}>
          Shown below your logo on the feedback form.
        </div>
      </div>

      {/* Hero Heading — Community+ */}
      <div style={{ marginBottom: 22, opacity: brandingLocked ? 0.5 : 1, pointerEvents: brandingLocked ? "none" : "auto" }}>
        <label style={labelStyle}>
          Form Heading
          {brandingLocked && <span style={{ color: theme.violet, fontWeight: 500, marginLeft: 6 }}>Community+</span>}
        </label>
        <input
          value={heroHeading}
          onChange={(e) => setHeroHeading(e.target.value)}
          placeholder={`How would you like to share with ${org?.name || "us"}?`}
          style={inputStyle}
          disabled={brandingLocked}
        />
        <div style={{ fontSize: 11, color: theme.muted, marginTop: 4 }}>
          The main heading above the form. Leave blank to use the default.
        </div>
      </div>

      {/* Colors */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 28,
          opacity: brandingLocked ? 0.5 : 1,
          pointerEvents: brandingLocked ? "none" : "auto",
        }}
      >
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>
            Primary Color
            {brandingLocked && <span style={{ color: theme.violet, fontWeight: 500, marginLeft: 6 }}>Community+</span>}
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              style={{
                width: 42,
                height: 42,
                border: "none",
                borderRadius: 10,
                cursor: "pointer",
                padding: 0,
                background: "none",
              }}
            />
            <input
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              style={{ ...inputStyle, fontFamily: monoFont, fontSize: 13 }}
            />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>
            Accent Color
            {brandingLocked && <span style={{ color: theme.violet, fontWeight: 500, marginLeft: 6 }}>Community+</span>}
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              style={{
                width: 42,
                height: 42,
                border: "none",
                borderRadius: 10,
                cursor: "pointer",
                padding: 0,
                background: "none",
              }}
            />
            <input
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              style={{ ...inputStyle, fontFamily: monoFont, fontSize: 13 }}
            />
          </div>
        </div>
      </div>

      {/* Categories — always editable */}
      <div style={{ marginBottom: 28 }}>
        <label style={labelStyle}>
          Feedback Categories
          <span style={{ fontWeight: 400, color: theme.muted, marginLeft: 6, fontSize: 11 }}>
            ({categories.length}/10)
          </span>
        </label>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          {categories.map((c, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                background: theme.white,
                borderRadius: 10,
                border: `1px solid ${theme.divider}`,
              }}
            >
              <span style={{ fontSize: 16 }}>{c.emoji}</span>
              <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{c.label}</span>
              <button
                onClick={() => removeCategory(i)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 16,
                  cursor: "pointer",
                  color: theme.muted,
                  padding: "0 4px",
                  lineHeight: 1,
                }}
              >
                x
              </button>
            </div>
          ))}
        </div>

        {/* Add category row */}
        <div style={{ display: "flex", gap: 8, position: "relative" }}>
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            style={{
              width: 50,
              height: 42,
              border: `1.5px solid ${theme.divider}`,
              borderRadius: 10,
              background: theme.white,
              fontSize: 18,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "border-color 0.2s",
            }}
            title="Pick an icon"
          >
            {newCatEmoji || "😀"}
          </button>

          {/* Emoji picker dropdown */}
          {showEmojiPicker && (
            <div style={{
              position: "absolute",
              top: 48,
              left: 0,
              zIndex: 20,
              background: theme.white,
              borderRadius: 14,
              border: `1.5px solid ${theme.divider}`,
              boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
              padding: 12,
              width: 260,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Pick an icon
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 4 }}>
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setNewCatEmoji(emoji);
                      setShowEmojiPicker(false);
                    }}
                    style={{
                      width: 28,
                      height: 28,
                      border: newCatEmoji === emoji ? `2px solid ${theme.primary}` : "1px solid transparent",
                      borderRadius: 6,
                      background: newCatEmoji === emoji ? `${theme.primary}15` : "transparent",
                      fontSize: 16,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s",
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 8, borderTop: `1px solid ${theme.divider}`, paddingTop: 8 }}>
                <input
                  value={newCatEmoji}
                  onChange={(e) => setNewCatEmoji(e.target.value)}
                  placeholder="Or type any emoji..."
                  maxLength={2}
                  style={{ ...inputStyle, fontSize: 12, padding: "6px 10px" }}
                />
              </div>
            </div>
          )}

          <input
            value={newCatLabel}
            onChange={(e) => setNewCatLabel(e.target.value)}
            placeholder="New category name..."
            style={{ ...inputStyle, flex: 1 }}
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
          />
          <button
            onClick={addCategory}
            disabled={categories.length >= 10}
            style={{
              padding: "10px 18px",
              background: categories.length >= 10 ? theme.muted : theme.primary,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: categories.length >= 10 ? "not-allowed" : "pointer",
              flexShrink: 0,
              fontFamily: fontStack,
              opacity: categories.length >= 10 ? 0.5 : 1,
            }}
          >
            Add
          </button>
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: "100%",
          padding: 14,
          background: saved ? "#059669" : theme.primary,
          color: "#fff",
          border: "none",
          borderRadius: 12,
          fontSize: 15,
          fontWeight: 700,
          cursor: saving ? "not-allowed" : "pointer",
          fontFamily: fontStack,
          transition: "background 0.3s",
        }}
      >
        {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
      </button>
    </div>
  );
}
