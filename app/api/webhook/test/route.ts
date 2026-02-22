// ============================================================
// TellSafe — Webhook Test API Route
// ============================================================
// Sends a test webhook message to verify configuration.

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminCollections } from "../../../../lib/firebase-admin";
import { sendTestWebhook } from "../../../../lib/webhooks";
import type { Organization } from "../../../../types";
import { PLAN_LIMITS } from "../../../../types";

export async function POST(request: NextRequest) {
  try {
    // Verify auth
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);

    const body = await request.json();
    const { orgId, webhookUrl } = body;

    if (!orgId || !webhookUrl) {
      return NextResponse.json(
        { error: "Missing orgId or webhookUrl" },
        { status: 400 }
      );
    }

    // Validate webhook URL — only allow known webhook platforms to prevent SSRF
    try {
      const url = new URL(webhookUrl);
      const allowedHosts = ["hooks.slack.com", "discord.com", "discordapp.com"];
      const isAllowed = allowedHosts.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`));
      if (!isAllowed || url.protocol !== "https:") {
        return NextResponse.json(
          { error: "Only HTTPS Slack and Discord webhook URLs are supported." },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json({ error: "Invalid webhook URL." }, { status: 400 });
    }

    // Verify user is admin of this org
    const adminSnap = await adminCollections.admins(orgId).doc(decoded.uid).get();
    const orgSnap = await adminCollections.organization(orgId).get();

    if (!orgSnap.exists) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const org = { id: orgSnap.id, ...orgSnap.data() } as Organization;

    if (!adminSnap.exists && org.ownerId !== decoded.uid) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Check plan
    if (!PLAN_LIMITS[org.plan].hasWebhooks) {
      return NextResponse.json(
        { error: "Webhook integration requires Pro plan" },
        { status: 403 }
      );
    }

    // Send test
    const success = await sendTestWebhook(webhookUrl, org.name);

    if (success) {
      return NextResponse.json({ success: true, message: "Test webhook sent successfully!" });
    } else {
      return NextResponse.json(
        { error: "Failed to send test webhook. Please check the URL." },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error("Webhook test error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
