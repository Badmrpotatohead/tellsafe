// ============================================================
// TellSafe — Create Organization API Route
// ============================================================
// Replaces the Firebase Cloud Function for org creation so this
// works on Vercel without needing Cloud Functions deployed.
// POST: { name, slug } — requires Firebase Auth Bearer token

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "../../../../lib/firebase-admin";

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;

function getNextMonthReset(): string {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return next.toISOString();
}

function getTrialEnd(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString();
}

export async function POST(request: NextRequest) {
  try {
    // Verify auth token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    let decoded: { uid: string; email?: string; name?: string };
    try {
      decoded = await adminAuth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { name, slug } = await request.json();

    if (!name?.trim() || !slug?.trim()) {
      return NextResponse.json({ error: "Name and slug are required." }, { status: 400 });
    }

    if (!SLUG_REGEX.test(slug)) {
      return NextResponse.json(
        { error: "URL must be 3–50 characters, lowercase letters, numbers, and hyphens only." },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const slugDoc = await adminDb.collection("slugs").doc(slug).get();
    if (slugDoc.exists) {
      return NextResponse.json(
        { error: "That URL is already taken. Try a different one." },
        { status: 409 }
      );
    }

    // Create org + slug + admin in a batch
    const batch = adminDb.batch();
    const orgRef = adminDb.collection("organizations").doc();
    const now = new Date().toISOString();

    batch.set(orgRef, {
      name: name.trim(),
      slug,
      logoUrl: null,
      primaryColor: "#2d6a6a",
      accentColor: "#c05d3b",
      tagline: "Your voice matters. Share your feedback anonymously.",
      categories: [
        { emoji: "💡", label: "Suggestion" },
        { emoji: "❤️", label: "Praise" },
        { emoji: "🤝", label: "Safety" },
        { emoji: "💬", label: "Other" },
      ],
      plan: "pro",
      isTrialing: true,
      trialEndsAt: getTrialEnd(),
      billingInterval: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      ownerId: decoded.uid,
      submissionCount: 0,
      submissionResetDate: getNextMonthReset(),
      createdAt: now,
      updatedAt: now,
    });

    batch.set(adminDb.collection("slugs").doc(slug), { orgId: orgRef.id });

    batch.set(
      adminDb.collection("organizations").doc(orgRef.id).collection("admins").doc(decoded.uid),
      {
        email: decoded.email || "",
        displayName: decoded.name || "Owner",
        role: "owner",
        joinedAt: now,
      }
    );

    await batch.commit();

    return NextResponse.json({ orgId: orgRef.id, slug });
  } catch (err) {
    console.error("[org/create] Error:", err);
    return NextResponse.json({ error: "Failed to create organization." }, { status: 500 });
  }
}
