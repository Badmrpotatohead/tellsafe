// ============================================================
// TellSafe — Team Access Component
// ============================================================

"use client";

import React, { useState, useEffect } from "react";
import { useBrand } from "./BrandProvider";
import { useAuth } from "./AuthProvider";
import { getOrgAdmins } from "../lib/data";
import { PLAN_LIMITS } from "../types";
import type { OrgAdmin } from "../types";

const fontStack = "'Outfit', system-ui, sans-serif";
const displayFont = "'Fraunces', Georgia, serif";

interface Props {
  orgId: string;
}

export default function TeamAccess({ orgId }: Props) {
  const { theme } = useBrand();
  const { org, user } = useAuth();
  const [admins, setAdmins] = useState<OrgAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  const plan = org?.plan || "free";
  const limits = PLAN_LIMITS[plan];

  useEffect(() => {
    loadAdmins();
  }, [orgId]);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const list = await getOrgAdmins(orgId);
      setAdmins(list);
    } catch (err) {
      console.error("Failed to load admins:", err);
    } finally {
      setLoading(false);
    }
  };

  const roleColors: Record<string, { bg: string; color: string }> = {
    owner: { bg: "#ede9fe", color: "#7c3aed" },
    admin: { bg: "#dbeafe", color: "#1d4ed8" },
  };

  return (
    <div style={{ maxWidth: 520, fontFamily: fontStack }}>
      <h2 style={{ fontFamily: displayFont, fontSize: 22, fontWeight: 600, marginBottom: 6 }}>
        Team Access
      </h2>
      <p style={{ fontSize: 13, color: theme.muted, marginBottom: 28, lineHeight: 1.6 }}>
        Manage who can access your admin dashboard. Your plan supports up to{" "}
        <strong>{limits.maxAdmins} admin{limits.maxAdmins > 1 ? "s" : ""}</strong>.
      </p>

      {/* Current team members */}
      <div style={{ marginBottom: 28 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 10, color: theme.ink }}>
          Current Team ({admins.length}/{limits.maxAdmins})
        </label>

        {loading ? (
          <div style={{ padding: 24, textAlign: "center", color: theme.muted, fontSize: 13 }}>
            Loading team...
          </div>
        ) : admins.length === 0 ? (
          <div
            style={{
              background: theme.white,
              borderRadius: 14,
              padding: "20px 22px",
              border: `1px solid ${theme.divider}`,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: `${theme.primary}15`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16,
            }}>
              👤
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: theme.ink }}>
                {user?.displayName || user?.email || "You"}
              </div>
              <div style={{ fontSize: 12, color: theme.muted }}>{user?.email}</div>
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 100,
              background: "#ede9fe", color: "#7c3aed",
            }}>
              OWNER
            </span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {admins.map((admin) => {
              const rc = roleColors[admin.role] || roleColors.admin;
              const isYou = admin.id === user?.uid;
              return (
                <div
                  key={admin.id}
                  style={{
                    background: theme.white,
                    borderRadius: 14,
                    padding: "14px 18px",
                    border: `1px solid ${theme.divider}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: `${theme.primary}15`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, fontWeight: 700, color: theme.primary,
                  }}>
                    {(admin.displayName || admin.email || "?")[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: theme.ink, display: "flex", alignItems: "center", gap: 6 }}>
                      {admin.displayName || "Team Member"}
                      {isYou && <span style={{ fontSize: 10, color: theme.muted, fontWeight: 400 }}>(you)</span>}
                    </div>
                    <div style={{ fontSize: 12, color: theme.muted, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {admin.email}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 100,
                    background: rc.bg, color: rc.color, textTransform: "uppercase",
                  }}>
                    {admin.role}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invite section */}
      {admins.length < limits.maxAdmins ? (
        <div
          style={{
            background: theme.white,
            borderRadius: 16,
            padding: 24,
            border: `2px dashed ${theme.divider}`,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 10 }}>👥</div>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: theme.ink }}>
            Invite Team Members
          </h3>
          <p style={{ fontSize: 13, color: theme.muted, lineHeight: 1.6, marginBottom: 16 }}>
            Team invitations are coming soon. For now, share access by having team members sign up and contact support to be added to your organization.
          </p>
          <div style={{
            fontSize: 12,
            color: theme.primary,
            fontWeight: 600,
          }}>
            {limits.maxAdmins - admins.length} seat{limits.maxAdmins - admins.length !== 1 ? "s" : ""} remaining on your {plan} plan
          </div>
        </div>
      ) : (
        <div
          style={{
            background: theme.paperWarm,
            borderRadius: 12,
            padding: 16,
            fontSize: 13,
            color: theme.muted,
            lineHeight: 1.6,
            textAlign: "center",
          }}
        >
          You've reached the maximum number of admins for your plan ({limits.maxAdmins}).
          {plan !== "pro" && " Upgrade to Pro for up to 5 admins."}
        </div>
      )}

      {/* Plan tip */}
      <div
        style={{
          marginTop: 24,
          padding: "14px 18px",
          background: `${theme.primary}08`,
          borderRadius: 12,
          fontSize: 12,
          color: theme.primary,
          lineHeight: 1.6,
        }}
      >
        <strong>Plan limits:</strong> Free = 1 admin, Community = 3 admins, Pro = 5 admins per organization.
      </div>
    </div>
  );
}
