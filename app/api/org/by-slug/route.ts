// ============================================================
// TellSafe — Get Org by Slug (for authenticated owner lookup)
// ============================================================
// GET ?slug=<slug> — requires Firebase Auth Bearer token
// Returns { orgId, slug } if the slug exists and belongs to the caller.
// Used by signup flow to recover from double-submit (409) gracefully.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "../../../../lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    let decoded: { uid: string };
    try {
      decoded = await adminAuth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const slug = request.nextUrl.searchParams.get("slug");
    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const slugDoc = await adminDb.collection("slugs").doc(slug).get();
    if (!slugDoc.exists) {
      return NextResponse.json({ error: "Slug not found" }, { status: 404 });
    }

    const { orgId } = slugDoc.data() as { orgId: string };

    // Verify the caller owns this org
    const orgDoc = await adminDb.collection("organizations").doc(orgId).get();
    if (!orgDoc.exists) {
      return NextResponse.json({ error: "Org not found" }, { status: 404 });
    }

    const orgData = orgDoc.data() as { ownerId: string };
    if (orgData.ownerId !== decoded.uid) {
      // Slug belongs to a different user — don't expose
      return NextResponse.json({ error: "That URL is already taken. Try a different one." }, { status: 409 });
    }

    return NextResponse.json({ orgId, slug });
  } catch (err) {
    console.error("[org/by-slug] Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
