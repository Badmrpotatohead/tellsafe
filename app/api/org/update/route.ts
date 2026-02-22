// ============================================================
// TellSafe — Update Org Name & Slug
// ============================================================
// PATCH /api/org/update
// Body: { orgId, name?, newSlug? }
// Requires Firebase Auth Bearer token.
// - Any admin can update the org name.
// - Only the org owner can change the slug.
// When slug changes:
//   1. Validate new slug format + uniqueness
//   2. Write slugs/{newSlug} = { orgId }
//   3. Delete slugs/{oldSlug}
//   4. Update organizations/{orgId}.slug (and .name if provided)

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "../../../../lib/firebase-admin";

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;

export async function PATCH(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────
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

    const { orgId, name, newSlug } = await request.json();

    if (!orgId) {
      return NextResponse.json({ error: "orgId is required." }, { status: 400 });
    }

    // ── Load org ──────────────────────────────────────────────
    const orgRef = adminDb.collection("organizations").doc(orgId);
    const orgSnap = await orgRef.get();
    if (!orgSnap.exists) {
      return NextResponse.json({ error: "Organization not found." }, { status: 404 });
    }
    const orgData = orgSnap.data() as {
      ownerId: string;
      slug: string;
      name: string;
    };

    // ── Auth check: must be admin or owner ────────────────────
    const adminSnap = await adminDb
      .collection("organizations")
      .doc(orgId)
      .collection("admins")
      .doc(decoded.uid)
      .get();
    const isOwner = orgData.ownerId === decoded.uid;
    const isAdmin = adminSnap.exists;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── Build update payload ──────────────────────────────────
    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    // Name — any admin can change
    if (name !== undefined) {
      const trimmed = (name as string).trim();
      if (!trimmed) {
        return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
      }
      if (trimmed.length > 100) {
        return NextResponse.json({ error: "Name must be 100 characters or fewer." }, { status: 400 });
      }
      updates.name = trimmed;
    }

    // Slug — owner only
    if (newSlug !== undefined) {
      if (!isOwner) {
        return NextResponse.json(
          { error: "Only the organization owner can change the URL." },
          { status: 403 }
        );
      }

      const slug = (newSlug as string).trim().toLowerCase();

      if (!SLUG_REGEX.test(slug)) {
        return NextResponse.json(
          {
            error:
              "URL must be 3–50 characters, lowercase letters, numbers, and hyphens only. Cannot start or end with a hyphen.",
          },
          { status: 400 }
        );
      }

      const oldSlug = orgData.slug;

      if (slug !== oldSlug) {
        // Check uniqueness
        const slugSnap = await adminDb.collection("slugs").doc(slug).get();
        if (slugSnap.exists) {
          return NextResponse.json(
            { error: "That URL is already taken. Try a different one." },
            { status: 409 }
          );
        }

        // Atomic slug swap + org update
        const batch = adminDb.batch();

        // Write new slug doc
        batch.set(adminDb.collection("slugs").doc(slug), { orgId });

        // Delete old slug doc
        batch.delete(adminDb.collection("slugs").doc(oldSlug));

        // Update org with any name change + new slug + timestamp
        batch.update(orgRef, { ...updates, slug });

        await batch.commit();

        return NextResponse.json({ success: true, slug });
      }
      // slug unchanged — fall through to regular update below
    }

    // ── Regular update (name only, or no-op) ──────────────────
    if (Object.keys(updates).length > 1) {
      // has more than just updatedAt
      await orgRef.update(updates);
    } else if (newSlug === undefined && name === undefined) {
      // nothing to do
      return NextResponse.json({ success: true });
    } else {
      await orgRef.update(updates);
    }

    return NextResponse.json({ success: true, slug: orgData.slug });
  } catch (err) {
    console.error("[org/update] Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
