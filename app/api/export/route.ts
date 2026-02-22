// ============================================================
// TellSafe v1.2 — CSV Export API Route
// ============================================================
// Exports feedback data as a CSV file for download.
// Pro plan feature — gated on the client side.
// Requires auth token in Authorization header.

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminCollections } from "../../../lib/firebase-admin";
import type { Feedback, Organization } from "../../../types";
import { PLAN_LIMITS } from "../../../types";

export async function GET(request: NextRequest) {
  try {
    // --- Auth check ---
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    let uid: string;
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      uid = decoded.uid;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // --- Get orgId from query ---
    const orgId = request.nextUrl.searchParams.get("orgId");
    if (!orgId) {
      return NextResponse.json(
        { error: "orgId is required" },
        { status: 400 }
      );
    }

    // --- Verify user is admin of this org ---
    const adminDoc = await adminCollections.admins(orgId).doc(uid).get();
    const orgCheckSnap = await adminCollections.organization(orgId).get();
    if (!adminDoc.exists && (!orgCheckSnap.exists || orgCheckSnap.data()?.ownerId !== uid)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // --- Server-side plan gate: CSV export requires Pro ---
    if (orgCheckSnap.exists) {
      const orgPlan = (orgCheckSnap.data() as Organization).plan || "free";
      if (!PLAN_LIMITS[orgPlan].hasCsvExport) {
        return NextResponse.json(
          { error: "CSV export requires the Pro plan." },
          { status: 403 }
        );
      }
    }

    // --- Optional filters ---
    const statusFilter = request.nextUrl.searchParams.get("status");
    const categoryFilter = request.nextUrl.searchParams.get("category");
    const sentimentFilter = request.nextUrl.searchParams.get("sentiment");
    const fromDate = request.nextUrl.searchParams.get("from");
    const toDate = request.nextUrl.searchParams.get("to");

    // --- Fetch feedback ---
    let query: FirebaseFirestore.Query = adminCollections
      .feedback(orgId)
      .orderBy("createdAt", "desc");

    if (statusFilter) {
      query = query.where("status", "==", statusFilter);
    }
    if (sentimentFilter) {
      query = query.where("sentimentLabel", "==", sentimentFilter);
    }

    const snap = await query.get();
    let items = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Feedback[];

    // Client-side filters (Firestore limitations on compound queries)
    if (categoryFilter) {
      items = items.filter((f) => f.categories.includes(categoryFilter));
    }
    if (fromDate) {
      items = items.filter((f) => f.createdAt >= fromDate);
    }
    if (toDate) {
      items = items.filter((f) => f.createdAt <= toDate);
    }

    // --- Get org name for filename ---
    const orgSnap = await adminCollections.organization(orgId).get();
    const orgName = orgSnap.exists
      ? (orgSnap.data() as Organization).name
      : "export";
    const safeOrgName = orgName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();

    // --- Build CSV ---
    const headers = [
      "ID",
      "Date",
      "Type",
      "Status",
      "Categories",
      "Feedback Text",
      "Sentiment",
      "Sentiment Score",
      "Author Name",
      "Author Email",
    ];

    const rows = items.map((f) => {
      const date = new Date(f.createdAt).toLocaleString("en-US", {
        timeZone: "America/New_York",
      });
      const cats = f.categories.join("; ");
      const authorName =
        f.type === "identified" && "authorName" in f
          ? (f as any).authorName
          : "";
      const authorEmail =
        f.type === "identified" && "authorEmail" in f
          ? (f as any).authorEmail
          : "";

      return [
        f.id,
        date,
        f.type,
        f.status,
        cats,
        f.text,
        f.sentimentLabel || "unanalyzed",
        f.sentimentScore !== null ? f.sentimentScore.toString() : "",
        authorName,
        authorEmail,
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    // --- Return CSV ---
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `tellsafe-${safeOrgName}-${dateStr}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("CSV export error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
