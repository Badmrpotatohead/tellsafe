// ============================================================
// TellSafe — Response Templates Manager
// ============================================================

"use client";

import React, { useState, useEffect } from "react";
import { useBrand } from "./BrandProvider";
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "../lib/data";
import { useAuth } from "./AuthProvider";
import { PLAN_LIMITS } from "../types";
import type { ResponseTemplate } from "../types";

const fontStack = "'Outfit', system-ui, sans-serif";
const displayFont = "'Fraunces', Georgia, serif";

interface Props {
  orgId: string;
}

export default function TemplatesManager({ orgId }: Props) {
  const { theme, categories } = useBrand();
  const { org } = useAuth();
  const [templates, setTemplates] = useState<ResponseTemplate[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const hasTemplates = org ? PLAN_LIMITS[org.plan].hasTemplates : false;

  useEffect(() => {
    loadTemplates();
  }, [orgId]);

  const loadTemplates = async () => {
    const list = await getTemplates(orgId);
    setTemplates(list);
  };

  const handleCreate = async () => {
    if (!newTitle.trim() || !newBody.trim()) return;
    await createTemplate(orgId, {
      title: newTitle.trim(),
      body: newBody.trim(),
      category: newCategory || undefined,
    });
    setNewTitle("");
    setNewBody("");
    setNewCategory("");
    setShowCreate(false);
    await loadTemplates();
  };

  const handleDelete = async (id: string) => {
    await deleteTemplate(orgId, id);
    await loadTemplates();
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

  // Gate check
  if (!hasTemplates) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          fontFamily: fontStack,
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
        <h2 style={{ fontFamily: displayFont, fontSize: 22, marginBottom: 8 }}>
          Response Templates
        </h2>
        <p style={{ color: theme.muted, fontSize: 14, marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
          Save frequently used replies as templates. Available on the Pro plan.
        </p>
        <div
          style={{
            display: "inline-block",
            padding: "10px 24px",
            background: `linear-gradient(135deg, ${theme.accent}, ${theme.primary})`,
            color: "#fff",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Upgrade to Pro →
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, fontFamily: fontStack }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <h2 style={{ fontFamily: displayFont, fontSize: 22, fontWeight: 600 }}>
            Response Templates
          </h2>
          <p style={{ fontSize: 13, color: theme.muted, marginTop: 4 }}>
            Save common replies to use in relay threads.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          style={{
            padding: "8px 18px",
            background: theme.primary,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: fontStack,
          }}
        >
          {showCreate ? "Cancel" : "+ New Template"}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div
          style={{
            background: theme.white,
            borderRadius: 16,
            padding: 24,
            marginBottom: 20,
            border: `2px solid ${theme.primary}33`,
            animation: "fadeUp 0.3s ease",
          }}
        >
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
              Template Name
            </label>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder='e.g., "Acknowledge & investigate"'
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
              Template Body
            </label>
            <textarea
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              placeholder="Thank you for bringing this to our attention. We take this seriously and will look into it..."
              style={{ ...inputStyle, minHeight: 100, resize: "vertical", lineHeight: 1.6 }}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
              Auto-suggest for category{" "}
              <span style={{ fontWeight: 400, color: theme.muted }}>(optional)</span>
            </label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="">Any category</option>
              {categories.map((c) => (
                <option key={c.label} value={c.label}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCreate}
            disabled={!newTitle.trim() || !newBody.trim()}
            style={{
              padding: "10px 24px",
              background: newTitle.trim() && newBody.trim() ? theme.primary : theme.muted,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
              cursor: newTitle.trim() && newBody.trim() ? "pointer" : "not-allowed",
              fontFamily: fontStack,
            }}
          >
            Save Template
          </button>
        </div>
      )}

      {/* Template list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {templates.length === 0 && !showCreate && (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: theme.muted,
              fontSize: 14,
            }}
          >
            No templates yet. Create one to speed up your relay responses.
          </div>
        )}

        {templates.map((t) => (
          <div
            key={t.id}
            style={{
              background: theme.white,
              borderRadius: 14,
              padding: "18px 22px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              border: `1px solid ${theme.divider}`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 14 }}>{t.title}</span>
              {t.category && (
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 7px",
                    borderRadius: 4,
                    background: theme.paperWarm,
                    color: theme.muted,
                    fontWeight: 600,
                  }}
                >
                  {t.category}
                </span>
              )}
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 11,
                  color: theme.muted,
                }}
              >
                Used {t.usageCount}×
              </span>
            </div>

            <div
              style={{
                fontSize: 13,
                color: theme.ink,
                lineHeight: 1.55,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                opacity: 0.8,
              }}
            >
              {t.body}
            </div>

            <div
              style={{
                display: "flex",
                gap: 12,
                marginTop: 10,
                fontSize: 12,
              }}
            >
              <button
                onClick={() => handleDelete(t.id)}
                style={{
                  color: theme.accent,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 12,
                  fontFamily: fontStack,
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
