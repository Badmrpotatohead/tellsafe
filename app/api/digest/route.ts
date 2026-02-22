// ============================================================
// TellSafe — Weekly Digest API Route
// ============================================================
// Called by Vercel Cron every Monday at 2pm UTC.
// Generates and sends weekly digest emails to all orgs.

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminCollections } from "../../../lib/firebase-admin";
import { generateDigest } from "../../../lib/digest";
import { sendWeeklyDigest } from "../../../lib/email";
import type { Organization } from "../../../types";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (Vercel sends this automatically)
    const authHeader = request.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tellsafe.vercel.app";
    const since = new Date();
    since.setDate(since.getDate() - 7); // Last 7 days

    // Get all orgs that have digest enabled (default: enabled)
    const orgsSnap = await adminCollections.organizations().get();
    const results: Array<{ orgId: string; orgName: string; sent: boolean; reason?: string }> = [];

    for (const orgDoc of orgsSnap.docs) {
      const org = { id: orgDoc.id, ...orgDoc.data() } as Organization;

      // Skip if digest explicitly disabled
      if (org.digestEnabled === false) {
        results.push({ orgId: org.id, orgName: org.name, sent: false, reason: "disabled" });
        continue;
      }

      try {
        // Generate digest data
        const digest = await generateDigest(org.id, org.name, since);

        // Skip if no activity
        if (!digest.hasActivity) {
          results.push({ orgId: org.id, orgName: org.name, sent: false, reason: "no_activity" });
          continue;
        }

        // Get admin emails
        const adminsSnap = await adminCollections.admins(org.id).get();
        const adminEmails = adminsSnap.docs
          .map((d) => d.data().email)
          .filter(Boolean) as string[];

        // Fallback: if no admins subcollection, try owner email
        if (adminEmails.length === 0) {
          results.push({ orgId: org.id, orgName: org.name, sent: false, reason: "no_admins" });
          continue;
        }

        // Send digest email
        await sendWeeklyDigest({
          adminEmails,
          orgName: org.name,
          totalNew: digest.totalNew,
          urgent: digest.urgent,
          needsReply: digest.needsReply,
          resolved: digest.resolved,
          sentimentBreakdown: digest.sentimentBreakdown,
          topCategories: digest.topCategories,
          dashboardUrl: `${appUrl}/admin`,
        });

        results.push({ orgId: org.id, orgName: org.name, sent: true });
      } catch (err) {
        console.error(`Digest failed for org ${org.id}:`, err);
        results.push({ orgId: org.id, orgName: org.name, sent: false, reason: "error" });
      }
    }

    const sentCount = results.filter((r) => r.sent).length;

    return NextResponse.json({
      success: true,
      message: `Sent ${sentCount} digest email(s)`,
      results,
    });
  } catch (err) {
    console.error("Digest cron error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
