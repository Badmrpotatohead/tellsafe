// ============================================================
// TellSafe — Public Updates Board Component
// ============================================================
// Renders a branded timeline of published updates for an organization.
// Used on the /{orgSlug}/updates public page.

"use client";

import React from "react";
import { useBrand } from "./BrandProvider";

const fontStack = "'Outfit', system-ui, sans-serif";
const displayFont = "'Fraunces', Georgia, serif";

interface Update {
  id: string;
  title: string;
  body: string;
  emoji: string;
  category: string | null;
  createdAt: string;
}

interface Props {
  orgSlug: string;
  updates: Update[];
}

function relativeDate(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffWeek < 5) return `${diffWeek}w ago`;
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function UpdatesBoard({ orgSlug, updates }: Props) {
  const { theme, orgName, logoUrl } = useBrand();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${theme.paper} 0%, ${theme.paperWarm} 100%)`,
        fontFamily: fontStack,
        color: theme.ink,
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "48px 24px 0",
          textAlign: "center",
          animation: "fadeUp 0.6s ease-out both",
        }}
      >
        {logoUrl && (
          <img
            src={logoUrl}
            alt={`${orgName} logo`}
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              objectFit: "cover",
              marginBottom: 16,
              boxShadow: theme.shadow,
            }}
          />
        )}
        <h1
          style={{
            fontFamily: displayFont,
            fontSize: 28,
            fontWeight: 600,
            margin: "0 0 8px",
            color: theme.ink,
            lineHeight: 1.3,
          }}
        >
          Updates from {orgName}
        </h1>
        <p
          style={{
            fontSize: 15,
            color: theme.muted,
            margin: "0 0 40px",
            fontWeight: 400,
          }}
        >
          See what's changed based on your feedback
        </p>
      </header>

      {/* ── Timeline ── */}
      <main
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "0 24px 64px",
        }}
      >
        {updates.length === 0 ? (
          /* ── Empty State ── */
          <div
            style={{
              textAlign: "center",
              padding: "64px 24px",
              animation: "scaleIn 0.5s ease-out both",
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: theme.primaryGlow,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                fontSize: 36,
              }}
            >
              <span role="img" aria-label="empty">
                {"\ud83d\udcec"}
              </span>
            </div>
            <p
              style={{
                fontFamily: displayFont,
                fontSize: 18,
                fontWeight: 500,
                color: theme.ink,
                margin: "0 0 8px",
              }}
            >
              No updates yet
            </p>
            <p
              style={{
                fontSize: 14,
                color: theme.muted,
                margin: 0,
              }}
            >
              Check back soon!
            </p>
          </div>
        ) : (
          <div style={{ position: "relative" }}>
            {/* Vertical timeline line */}
            <div
              style={{
                position: "absolute",
                left: 27,
                top: 28,
                bottom: 28,
                width: 2,
                background: `linear-gradient(to bottom, ${theme.primary}40, ${theme.divider})`,
                borderRadius: 1,
              }}
            />

            {updates.map((update, i) => (
              <div
                key={update.id}
                style={{
                  display: "flex",
                  gap: 20,
                  position: "relative",
                  marginBottom: i < updates.length - 1 ? 32 : 0,
                  animation: `fadeUp 0.5s ease-out ${0.1 + i * 0.08}s both`,
                }}
              >
                {/* Emoji circle */}
                <div
                  style={{
                    flexShrink: 0,
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: theme.white,
                    border: `2px solid ${theme.primary}30`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 26,
                    boxShadow: theme.shadow,
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  <span role="img" aria-label={update.title}>
                    {update.emoji}
                  </span>
                </div>

                {/* Content card */}
                <div
                  style={{
                    flex: 1,
                    background: theme.white,
                    borderRadius: 16,
                    padding: "20px 24px",
                    boxShadow: theme.shadow,
                    border: `1px solid ${theme.divider}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 12,
                      marginBottom: 8,
                    }}
                  >
                    <h3
                      style={{
                        fontFamily: displayFont,
                        fontSize: 17,
                        fontWeight: 600,
                        margin: 0,
                        color: theme.ink,
                        lineHeight: 1.4,
                      }}
                    >
                      {update.title}
                    </h3>
                    <span
                      style={{
                        fontSize: 12,
                        color: theme.muted,
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                        marginTop: 3,
                      }}
                    >
                      {relativeDate(update.createdAt)}
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: 14,
                      lineHeight: 1.65,
                      color: theme.ink,
                      opacity: 0.8,
                      margin: 0,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {update.body}
                  </p>

                  {update.category && (
                    <span
                      style={{
                        display: "inline-block",
                        marginTop: 12,
                        padding: "4px 12px",
                        fontSize: 12,
                        fontWeight: 500,
                        color: theme.primary,
                        background: theme.primaryGlow,
                        borderRadius: 100,
                        letterSpacing: 0.2,
                      }}
                    >
                      {update.category}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Footer link ── */}
      <footer
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "0 24px 48px",
          textAlign: "center",
        }}
      >
        <a
          href={`/${orgSlug}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 14,
            fontWeight: 500,
            color: theme.primary,
            textDecoration: "none",
            padding: "10px 20px",
            borderRadius: 100,
            background: theme.primaryGlow,
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = "0.8";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = "1";
          }}
        >
          <span aria-hidden="true" style={{ fontSize: 16 }}>
            &larr;
          </span>
          Back to feedback form
        </a>

        <p
          style={{
            marginTop: 24,
            fontSize: 12,
            color: theme.muted,
            opacity: 0.6,
          }}
        >
          Powered by TellSafe
        </p>
      </footer>
    </div>
  );
}
