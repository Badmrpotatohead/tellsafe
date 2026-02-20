// ============================================================
// TellSafe — Updates Board Manager
// ============================================================
// Admin component for the "You Spoke, We Listened" updates board.
// Allows creating, editing, publishing, and deleting updates.

"use client";

import React, { useState, useEffect } from "react";
import { useBrand } from "./BrandProvider";
import { useAuth } from "./AuthProvider";
import {
  getUpdates,
  createUpdate,
  updateOrgUpdate,
  deleteOrgUpdate,
} from "../lib/data";
import type { OrgUpdate, UpdateStatus } from "../types";

const fontStack = "'Outfit', system-ui, sans-serif";
const displayFont = "'Fraunces', Georgia, serif";

const EMOJI_OPTIONS = [
  "\u2728", "\uD83C\uDF89", "\uD83D\uDEE0\uFE0F", "\uD83D\uDCE2", "\uD83D\uDCA1",
  "\uD83D\uDD27", "\u2705", "\uD83D\uDE80", "\u2764\uFE0F", "\uD83D\uDCCA",
  "\uD83C\uDFAF", "\uD83D\uDD14",
];

interface Props {
  orgId: string;
}

export default function UpdatesManager({ orgId }: Props) {
  const { theme, categories } = useBrand();
  const { org } = useAuth();

  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState<OrgUpdate[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [emoji, setEmoji] = useState("\u2728");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<UpdateStatus>("draft");

  // Load updates on mount
  useEffect(() => {
    loadUpdates();
  }, [orgId]);

  const loadUpdates = async () => {
    setLoading(true);
    try {
      const list = await getUpdates(orgId);
      setUpdates(list);
    } catch (err) {
      console.error("Failed to load updates:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setBody("");
    setEmoji("\u2728");
    setCategory("");
    setStatus("draft");
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!title.trim() || !body.trim()) return;

    try {
      if (editingId) {
        await updateOrgUpdate(orgId, editingId, {
          title: title.trim(),
          body: body.trim(),
          emoji,
          category: category || null,
          status,
        });
      } else {
        await createUpdate(orgId, {
          title: title.trim(),
          body: body.trim(),
          emoji,
          category: category || undefined,
          status,
        });
      }
      resetForm();
      await loadUpdates();
    } catch (err) {
      console.error("Failed to save update:", err);
    }
  };

  const handleEdit = (update: OrgUpdate) => {
    setEditingId(update.id);
    setTitle(update.title);
    setBody(update.body);
    setEmoji(update.emoji);
    setCategory(update.category || "");
    setStatus(update.status);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteOrgUpdate(orgId, id);
      if (editingId === id) resetForm();
      await loadUpdates();
    } catch (err) {
      console.error("Failed to delete update:", err);
    }
  };

  const handleTogglePublish = async (update: OrgUpdate) => {
    const newStatus: UpdateStatus =
      update.status === "published" ? "draft" : "published";
    try {
      await updateOrgUpdate(orgId, update.id, { status: newStatus });
      await loadUpdates();
    } catch (err) {
      console.error("Failed to toggle publish:", err);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px 14px",
    border: `1.5px solid ${theme.divider}`,
    borderRadius: 10,
    fontSize: 14,
    color: theme.ink,
    background: theme.paper,
    outline: "none",
    fontFamily: fontStack,
    boxSizing: "border-box" as const,
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div style={{ maxWidth: 640, fontFamily: fontStack }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h2
          style={{
            fontFamily: displayFont,
            fontSize: 22,
            fontWeight: 600,
            marginBottom: 4,
          }}
        >
          Updates Board
        </h2>
        <p style={{ fontSize: 13, color: theme.muted, marginTop: 4 }}>
          Post what changed based on feedback. Your community sees these at your
          public updates page.
        </p>
      </div>

      {/* Form */}
      <div
        style={{
          background: theme.white,
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
          border: `2px solid ${editingId ? theme.accent + "44" : theme.primary + "33"}`,
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        <h3
          style={{
            fontSize: 15,
            fontWeight: 700,
            marginBottom: 18,
            color: theme.ink,
          }}
        >
          {editingId ? "Edit Update" : "New Update"}
        </h3>

        {/* Title */}
        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 5,
            }}
          >
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='e.g., "New anonymous reporting option"'
            style={inputStyle}
          />
        </div>

        {/* Body */}
        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 5,
            }}
          >
            Body
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Describe the change or improvement you made..."
            style={{
              ...inputStyle,
              minHeight: 100,
              resize: "vertical",
              lineHeight: 1.6,
            }}
          />
        </div>

        {/* Emoji Picker */}
        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 5,
            }}
          >
            Emoji{" "}
            <span
              style={{
                fontWeight: 400,
                color: theme.muted,
                marginLeft: 6,
              }}
            >
              {emoji}
            </span>
          </label>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
            }}
          >
            {EMOJI_OPTIONS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                type="button"
                style={{
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  border:
                    emoji === e
                      ? `2px solid ${theme.primary}`
                      : `1.5px solid ${theme.divider}`,
                  borderRadius: 8,
                  background: emoji === e ? theme.primaryGlow : theme.paper,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 5,
            }}
          >
            Category{" "}
            <span style={{ fontWeight: 400, color: theme.muted }}>(optional)</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.label} value={c.label}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status toggle */}
        <div style={{ marginBottom: 18 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 5,
            }}
          >
            Status
          </label>
          <div style={{ display: "flex", gap: 0 }}>
            <button
              type="button"
              onClick={() => setStatus("draft")}
              style={{
                padding: "7px 18px",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: fontStack,
                border: `1.5px solid ${theme.divider}`,
                borderRight: "none",
                borderRadius: "8px 0 0 8px",
                cursor: "pointer",
                background: status === "draft" ? theme.ink : theme.paper,
                color: status === "draft" ? "#fff" : theme.muted,
                transition: "all 0.15s ease",
              }}
            >
              Draft
            </button>
            <button
              type="button"
              onClick={() => setStatus("published")}
              style={{
                padding: "7px 18px",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: fontStack,
                border: `1.5px solid ${theme.divider}`,
                borderLeft: "none",
                borderRadius: "0 8px 8px 0",
                cursor: "pointer",
                background: status === "published" ? "#1a7a4c" : theme.paper,
                color: status === "published" ? "#fff" : theme.muted,
                transition: "all 0.15s ease",
              }}
            >
              Published
            </button>
          </div>
        </div>

        {/* Save / Cancel */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleSave}
            disabled={!title.trim() || !body.trim()}
            style={{
              padding: "10px 24px",
              background:
                title.trim() && body.trim() ? theme.primary : theme.muted,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
              cursor:
                title.trim() && body.trim() ? "pointer" : "not-allowed",
              fontFamily: fontStack,
            }}
          >
            {editingId ? "Update" : "Save"}
          </button>
          {editingId && (
            <button
              onClick={resetForm}
              style={{
                padding: "10px 18px",
                background: "none",
                color: theme.muted,
                border: `1.5px solid ${theme.divider}`,
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: fontStack,
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Updates list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Loading state */}
        {loading && (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: theme.muted,
              fontSize: 14,
            }}
          >
            Loading updates...
          </div>
        )}

        {/* Empty state */}
        {!loading && updates.length === 0 && (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: theme.muted,
              fontSize: 14,
            }}
          >
            No updates yet. Post your first update to let your community know
            what changed.
          </div>
        )}

        {/* Update cards */}
        {!loading &&
          updates.map((u) => (
            <div
              key={u.id}
              style={{
                background: theme.white,
                borderRadius: 14,
                padding: "18px 22px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                border: `1px solid ${theme.divider}`,
              }}
            >
              {/* Row: emoji + title + status badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 18 }}>{u.emoji}</span>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{u.title}</span>
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontWeight: 600,
                    background:
                      u.status === "published" ? "#d4f5e2" : theme.paperWarm,
                    color:
                      u.status === "published" ? "#1a7a4c" : theme.muted,
                  }}
                >
                  {u.status === "published" ? "Published" : "Draft"}
                </span>
              </div>

              {/* Body (truncated to 2 lines) */}
              <div
                style={{
                  fontSize: 13,
                  color: theme.ink,
                  lineHeight: 1.55,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  opacity: 0.8,
                  marginBottom: 8,
                }}
              >
                {u.body}
              </div>

              {/* Date */}
              <div
                style={{
                  fontSize: 11,
                  color: theme.muted,
                  marginBottom: 10,
                }}
              >
                {formatDate(u.createdAt)}
              </div>

              {/* Actions */}
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  fontSize: 12,
                }}
              >
                <button
                  onClick={() => handleEdit(u)}
                  style={{
                    color: theme.primary,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 12,
                    fontFamily: fontStack,
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleTogglePublish(u)}
                  style={{
                    color: theme.violet,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 12,
                    fontFamily: fontStack,
                  }}
                >
                  {u.status === "published" ? "Unpublish" : "Publish"}
                </button>
                <button
                  onClick={() => handleDelete(u.id)}
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
