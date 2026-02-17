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
  const [primaryColor, setPrimaryColor] = useState(org?.primaryColor || "#2d6a6a");
  const [accentColor, setAccentColor] = useState(org?.accentColor || "#c05d3b");
  const [categories, setCategories] = useState<Category[]>(org?.categories || []);
  const [logoUrl, setLogoUrl] = useState(org?.logoUrl || null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newCatEmoji, setNewCatEmoji] = useState("");
  const [newCatLabel, setNewCatLabel] = useState("");

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

    setUploading(true);
    try {
      const storageRef = ref(storage, `logos/${orgId}/logo`);
      await uploadBytes(storageRef, file, { contentType: file.type });
      const url = await getDownloadURL(storageRef);
      setLogoUrl(url);
    } catch (err) {
      console.error("Logo upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = () => setLogoUrl(null);

  const addCategory = () => {
    if (!newCatLabel.trim()) return;
    setCategories((prev) => [...prev, { emoji: newCatEmoji || "📌", label: newCatLabel.trim() }]);
    setNewCatEmoji("");
    setNewCatLabel("");
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

  return (
    <div style={{ maxWidth: 480, fontFamily: fontStack }}>
      <h2 style={{ fontFamily: displayFont, fontSize: 22, fontWeight: 600, marginBottom: 6 }}>
        Customize Your Form
      </h2>
      <p style={{ fontSize: 13, color: theme.muted, marginBottom: 28, lineHeight: 1.6 }}>
        These settings control how your public feedback form looks.
        {brandingLocked && " Logo and color customization is available on the Pro plan."}
      </p>

      {/* Logo Upload */}
      <div style={{ marginBottom: 28, opacity: brandingLocked ? 0.5 : 1, pointerEvents: brandingLocked ? "none" : "auto" }}>
        <label style={labelStyle}>
          Organization Logo
          {brandingLocked && <span style={{ color: theme.violet, fontWeight: 500, marginLeft: 6 }}>Pro</span>}
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              border: `2px dashed ${theme.divider}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              background: theme.white,
              cursor: "pointer",
              flexShrink: 0,
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
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleLogoUpload}
          />
          <div>
            <p style={{ fontSize: 13, color: theme.ink, fontWeight: 500 }}>
              {logoUrl ? "Logo uploaded" : "No logo yet"}
            </p>
            <p style={{ fontSize: 11, color: theme.muted }}>
              PNG, JPG, or SVG. Recommended 200×200px.
            </p>
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
            {brandingLocked && <span style={{ color: theme.violet, fontWeight: 500, marginLeft: 6 }}>Pro</span>}
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
            {brandingLocked && <span style={{ color: theme.violet, fontWeight: 500, marginLeft: 6 }}>Pro</span>}
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
        <label style={labelStyle}>Feedback Categories</label>
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
                ×
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={newCatEmoji}
            onChange={(e) => setNewCatEmoji(e.target.value)}
            placeholder="🎯"
            maxLength={2}
            style={{ ...inputStyle, width: 50, textAlign: "center", flexShrink: 0 }}
          />
          <input
            value={newCatLabel}
            onChange={(e) => setNewCatLabel(e.target.value)}
            placeholder="New category name..."
            style={{ ...inputStyle, flex: 1 }}
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
          />
          <button
            onClick={addCategory}
            style={{
              padding: "10px 18px",
              background: theme.primary,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              flexShrink: 0,
              fontFamily: fontStack,
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
        {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Changes"}
      </button>
    </div>
  );
}
