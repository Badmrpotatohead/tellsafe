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

// Derive a slug suggestion from a display name
function slugify(val: string): string {
  return val
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
}

export default function BrandingSettings({ orgId }: Props) {
  const { theme } = useBrand();
  const { org, refreshOrg, user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const hasBranding = org ? PLAN_LIMITS[org.plan].hasCustomBranding : false;
  const isOwner = !!user && org?.ownerId === user.uid;

  // ── Identity (name + slug) ────────────────────────────────
  const [name, setName] = useState(org?.name || "");
  const [slug, setSlug] = useState(org?.slug || "");
  const [slugDirty, setSlugDirty] = useState(false); // true once admin manually edits slug field
  const [identitySaving, setIdentitySaving] = useState(false);
  const [identitySaved, setIdentitySaved] = useState(false);
  const [identityError, setIdentityError] = useState<string | null>(null);
  const [showSlugWarning, setShowSlugWarning] = useState(false);

  // ── Branding (everything else) ────────────────────────────
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
  const [newCatIconUrl, setNewCatIconUrl] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [catIconUploading, setCatIconUploading] = useState(false);
  const catIconRef = useRef<HTMLInputElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [hidePoweredBy, setHidePoweredBy] = useState(org?.hidePoweredBy || false);

  // When name changes, auto-suggest a new slug (unless admin has manually set one)
  const handleNameChange = (val: string) => {
    setName(val);
    if (!slugDirty) {
      setSlug(slugify(val));
    }
  };

  const handleSlugChange = (val: string) => {
    setSlugDirty(true);
    setSlug(val.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 50));
  };

  // Save name + slug via the dedicated API route
  const handleIdentitySave = async () => {
    setIdentityError(null);
    const slugChanged = slug !== (org?.slug || "");

    // If slug is changing, show confirmation warning first
    if (slugChanged && !showSlugWarning) {
      setShowSlugWarning(true);
      return;
    }

    setIdentitySaving(true);
    setShowSlugWarning(false);
    try {
      const token = await user?.getIdToken();
      const body: Record<string, string> = { orgId, name };
      if (slugChanged && isOwner) body.newSlug = slug;

      const res = await fetch("/api/org/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setIdentityError(data.error || "Failed to save.");
        return;
      }

      // Update local slug state if it changed
      if (data.slug) setSlug(data.slug);
      setSlugDirty(false);
      await refreshOrg();
      setIdentitySaved(true);
      setTimeout(() => setIdentitySaved(false), 2500);
    } catch {
      setIdentityError("Network error. Please try again.");
    } finally {
      setIdentitySaving(false);
    }
  };

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

  const handleCatIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_LOGO_SIZE_BYTES) {
      setUploadError(`Icon must be under ${MAX_LOGO_SIZE_MB}MB`);
      return;
    }
    setCatIconUploading(true);
    try {
      const storageRef = ref(storage, `orgs/${orgId}/cat-icons/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setNewCatIconUrl(url);
      setNewCatEmoji("");
      setShowEmojiPicker(false);
    } catch {
      setUploadError("Icon upload failed. Try again.");
    } finally {
      setCatIconUploading(false);
      if (catIconRef.current) catIconRef.current.value = "";
    }
  };

  const addCategory = () => {
    if (!newCatLabel.trim()) return;
    if (categories.length >= 10) return;
    setCategories((prev) => [...prev, {
      emoji: newCatIconUrl ? "" : (newCatEmoji || "📌"),
      label: newCatLabel.trim(),
      iconUrl: newCatIconUrl || null,
    }]);
    setNewCatEmoji("");
    setNewCatLabel("");
    setNewCatIconUrl(null);
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
        hidePoweredBy,
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

      {/* ── Organization Identity ──────────────────────────── */}
      <div style={{
        marginBottom: 28,
        padding: "20px 20px 16px",
        border: `1.5px solid ${theme.divider}`,
        borderRadius: 14,
        background: theme.paper,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: theme.ink, marginBottom: 14, letterSpacing: "0.01em" }}>
          Organization Identity
        </div>

        {/* Name */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Organization Name</label>
          <input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            maxLength={100}
            placeholder="Acme Corp"
            style={{ ...inputStyle, boxSizing: "border-box" as const }}
          />
          <div style={{ fontSize: 11, color: theme.muted, marginTop: 4 }}>
            Shown on your feedback form and in email notifications.
          </div>
        </div>

        {/* Slug — owner only */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>
            Public URL
            {!isOwner && (
              <span style={{ color: theme.muted, fontWeight: 400, marginLeft: 6 }}>
                — only the owner can change this
              </span>
            )}
          </label>
          <div style={{
            display: "flex",
            alignItems: "center",
            border: `1.5px solid ${theme.divider}`,
            borderRadius: 10,
            overflow: "hidden",
            background: theme.paper,
          }}>
            <span style={{
              padding: "10px 10px 10px 14px",
              fontSize: 13,
              color: theme.muted,
              whiteSpace: "nowrap",
              background: theme.white,
              borderRight: `1px solid ${theme.divider}`,
              flexShrink: 0,
            }}>
              tellsafe.app/
            </span>
            <input
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              disabled={!isOwner}
              maxLength={50}
              placeholder="your-org"
              style={{
                flex: 1,
                padding: "10px 14px",
                border: "none",
                outline: "none",
                fontSize: 14,
                fontFamily: monoFont,
                color: theme.ink,
                background: isOwner ? theme.paper : theme.white,
                opacity: isOwner ? 1 : 0.65,
                boxSizing: "border-box" as const,
              }}
            />
          </div>
          {isOwner && (
            <div style={{ fontSize: 11, color: theme.muted, marginTop: 4 }}>
              Lowercase letters, numbers, and hyphens only. 3–50 characters.
            </div>
          )}
        </div>

        {/* Slug-change warning */}
        {showSlugWarning && (
          <div style={{
            marginBottom: 14,
            padding: "12px 14px",
            borderRadius: 10,
            background: "#fffbeb",
            border: "1.5px solid #f59e0b",
            fontSize: 12,
            color: "#92400e",
            lineHeight: 1.5,
          }}>
            <strong>⚠️ Heads up:</strong> Changing your URL will break any existing QR codes or shared links using the old URL (<code style={{ fontFamily: monoFont }}>tellsafe.app/{org?.slug}</code>). This cannot be undone automatically.
            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              <button
                onClick={handleIdentitySave}
                disabled={identitySaving}
                style={{
                  padding: "6px 14px", borderRadius: 8,
                  background: "#f59e0b", border: "none",
                  color: "#fff", fontSize: 12, fontWeight: 700,
                  cursor: identitySaving ? "not-allowed" : "pointer",
                  fontFamily: fontStack,
                }}
              >
                {identitySaving ? "Saving…" : "Yes, change URL"}
              </button>
              <button
                onClick={() => { setShowSlugWarning(false); setSlug(org?.slug || ""); setSlugDirty(false); }}
                style={{
                  padding: "6px 14px", borderRadius: 8,
                  background: "transparent", border: `1px solid #f59e0b`,
                  color: "#92400e", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", fontFamily: fontStack,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Identity error */}
        {identityError && (
          <div style={{
            marginBottom: 12,
            padding: "9px 13px",
            borderRadius: 8,
            background: "#fef2f2",
            border: "1.5px solid #fca5a5",
            fontSize: 12,
            color: "#991b1b",
          }}>
            {identityError}
          </div>
        )}

        {/* Save Identity button */}
        {!showSlugWarning && (
          <button
            onClick={handleIdentitySave}
            disabled={identitySaving || (name === (org?.name || "") && slug === (org?.slug || ""))}
            style={{
              padding: "9px 20px",
              background: identitySaved ? "#059669" : theme.primary,
              color: "#fff",
              border: "none",
              borderRadius: 9,
              fontSize: 13,
              fontWeight: 700,
              cursor: (identitySaving || (name === (org?.name || "") && slug === (org?.slug || "")))
                ? "not-allowed"
                : "pointer",
              opacity: (name === (org?.name || "") && slug === (org?.slug || "") && !identitySaving) ? 0.5 : 1,
              fontFamily: fontStack,
              transition: "background 0.2s",
            }}
          >
            {identitySaving ? "Saving…" : identitySaved ? "Saved!" : "Save Identity"}
          </button>
        )}
      </div>

      {/* Logo Upload */}
      <div style={{ marginBottom: 28, position: "relative" }}>
        {brandingLocked && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 5,
            background: "rgba(242,240,235,0.7)", backdropFilter: "blur(1px)",
            borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <a href="#" onClick={(e) => { e.preventDefault(); window.location.hash = "billing"; }}
              style={{
                padding: "8px 18px", borderRadius: 8,
                background: theme.violet, color: "#fff",
                fontSize: 12, fontWeight: 700, textDecoration: "none",
                boxShadow: "0 2px 8px rgba(124,58,237,0.3)",
              }}>
              Upgrade to Community+
            </a>
          </div>
        )}
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
      <div style={{ marginBottom: 22, position: "relative" }}>
        {brandingLocked && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 5,
            background: "rgba(242,240,235,0.7)", backdropFilter: "blur(1px)",
            borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <a href="#" onClick={(e) => { e.preventDefault(); window.location.hash = "billing"; }}
              style={{
                padding: "8px 18px", borderRadius: 8,
                background: theme.violet, color: "#fff",
                fontSize: 12, fontWeight: 700, textDecoration: "none",
                boxShadow: "0 2px 8px rgba(124,58,237,0.3)",
              }}>
              Upgrade to Community+
            </a>
          </div>
        )}
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
          position: "relative",
        }}
      >
        {brandingLocked && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 5,
            background: "rgba(242,240,235,0.7)", backdropFilter: "blur(1px)",
            borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <a href="#" onClick={(e) => { e.preventDefault(); window.location.hash = "billing"; }}
              style={{
                padding: "8px 18px", borderRadius: 8,
                background: theme.violet, color: "#fff",
                fontSize: 12, fontWeight: 700, textDecoration: "none",
                boxShadow: "0 2px 8px rgba(124,58,237,0.3)",
              }}>
              Upgrade to Community+
            </a>
          </div>
        )}
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
              {c.iconUrl ? (
                <img src={c.iconUrl} alt="" style={{ width: 20, height: 20, borderRadius: 4, objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 16 }}>{c.emoji}</span>
              )}
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
            {newCatIconUrl ? (
              <img src={newCatIconUrl} alt="" style={{ width: 24, height: 24, borderRadius: 4, objectFit: "cover" }} />
            ) : (
              newCatEmoji || "😀"
            )}
          </button>

          {/* Emoji / icon picker dropdown */}
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
              width: 248,
              maxWidth: "calc(100vw - 48px)",
              boxSizing: "border-box" as const,
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
                      setNewCatIconUrl(null);
                      setShowEmojiPicker(false);
                    }}
                    style={{
                      width: 28,
                      height: 28,
                      border: newCatEmoji === emoji && !newCatIconUrl ? `2px solid ${theme.primary}` : "1px solid transparent",
                      borderRadius: 6,
                      background: newCatEmoji === emoji && !newCatIconUrl ? `${theme.primary}15` : "transparent",
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
                  onChange={(e) => { setNewCatEmoji(e.target.value); setNewCatIconUrl(null); }}
                  placeholder="Or type any emoji..."
                  maxLength={4}
                  style={{ ...inputStyle, fontSize: 12, padding: "6px 10px" }}
                />
              </div>
              {/* Upload custom icon — Community+ */}
              {!brandingLocked && (
                <div style={{ marginTop: 8, borderTop: `1px solid ${theme.divider}`, paddingTop: 8 }}>
                  <input
                    ref={catIconRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleCatIconUpload}
                  />
                  {newCatIconUrl ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <img src={newCatIconUrl} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover", border: `2px solid ${theme.primary}` }} />
                      <span style={{ fontSize: 11, color: theme.primary, fontWeight: 600, flex: 1 }}>Custom icon set</span>
                      <button onClick={() => setNewCatIconUrl(null)} style={{ background: "none", border: "none", fontSize: 12, color: theme.muted, cursor: "pointer" }}>✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => catIconRef.current?.click()}
                      disabled={catIconUploading}
                      style={{
                        width: "100%", padding: "6px 10px", borderRadius: 8,
                        border: `1.5px dashed ${theme.divider}`,
                        background: "transparent", cursor: "pointer",
                        fontSize: 11, fontWeight: 600, color: theme.muted,
                        fontFamily: fontStack,
                      }}
                    >
                      {catIconUploading ? "Uploading..." : "⬆ Upload custom icon"}
                    </button>
                  )}
                </div>
              )}
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

      {/* White-label: hide Powered by TellSafe (Community+ only) */}
      {hasBranding && (
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              padding: "14px 18px",
              background: theme.paper,
              borderRadius: 12,
              border: `1.5px solid ${theme.divider}`,
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: theme.ink }}>
                Hide &ldquo;Powered by TellSafe&rdquo;
              </div>
              <div style={{ fontSize: 11, color: theme.muted, marginTop: 2 }}>
                Remove TellSafe branding from your public forms
              </div>
            </div>
            <button
              onClick={() => setHidePoweredBy(!hidePoweredBy)}
              aria-checked={hidePoweredBy}
              role="switch"
              style={{
                position: "relative",
                width: 44,
                height: 24,
                borderRadius: 12,
                border: "none",
                background: hidePoweredBy ? theme.primary : theme.divider,
                cursor: "pointer",
                flexShrink: 0,
                transition: "background 0.2s",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 2,
                  left: hidePoweredBy ? 22 : 2,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "#fff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                  transition: "left 0.2s",
                }}
              />
            </button>
          </div>
        </div>
      )}

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
