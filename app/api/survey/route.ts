// ============================================================
// TellSafe v1.3 — Survey Management API
// ============================================================
// POST: Create survey
// GET: List surveys for org
// PUT: Update survey (status, questions, etc.)
// DELETE: Delete survey

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb, adminCollections } from "../../../lib/firebase-admin";
import type { Survey, SurveyQuestion } from "../../../types/survey";
import { FieldValue } from "firebase-admin/firestore";

// Helper to verify admin — returns { uid } on success, { error, reason } on failure
async function verifyAdmin(request: NextRequest, orgId: string): Promise<{ uid: string } | { error: true; reason: string }> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: true, reason: "no_bearer_token" };
  }

  const token = authHeader.split("Bearer ")[1];
  if (!token || token === "undefined" || token === "null") {
    return { error: true, reason: "token_empty_or_undefined" };
  }

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(token);
  } catch (err: any) {
    return { error: true, reason: `verifyIdToken_failed: ${err?.code || err?.message}` };
  }

  const adminDoc = await adminCollections.admins(orgId).doc(decoded.uid).get();
  if (!adminDoc.exists) {
    return { error: true, reason: `no_admin_doc: uid=${decoded.uid} org=${orgId}` };
  }

  return { uid: decoded.uid };
}

// --- CREATE SURVEY ---
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, title, description, questions, allowIdentified, opensAt, closesAt, templateId } = body;

    if (!orgId || !title || !questions?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const authResult = await verifyAdmin(request, orgId);
    if ("error" in authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const uid = authResult.uid;

    const now = new Date().toISOString();

    // Assign IDs to questions
    const questionsWithIds: SurveyQuestion[] = questions.map(
      (q: any, i: number) => ({
        ...q,
        id: `q_${Date.now()}_${i}`,
        order: i,
      })
    );

    const surveyData = {
      orgId,
      title,
      description: description || "",
      questions: questionsWithIds,
      status: "draft" as const,
      responseCount: 0,
      allowIdentified: allowIdentified ?? false,
      opensAt: opensAt || null,
      closesAt: closesAt || null,
      templateId: templateId || null,
      createdBy: uid,
      createdAt: now,
      updatedAt: now,
    };

    const ref = await adminDb
      .collection("organizations")
      .doc(orgId)
      .collection("surveys")
      .add(surveyData);

    return NextResponse.json({
      success: true,
      surveyId: ref.id,
      survey: { id: ref.id, ...surveyData },
    });
  } catch (err: any) {
    console.error("Create survey error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// --- LIST SURVEYS ---
export async function GET(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get("orgId");
    if (!orgId) {
      return NextResponse.json({ error: "orgId required" }, { status: 400 });
    }

    const authResult = await verifyAdmin(request, orgId);
    if ("error" in authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const snap = await adminDb
      .collection("organizations")
      .doc(orgId)
      .collection("surveys")
      .orderBy("createdAt", "desc")
      .get();

    const surveys = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ surveys });
  } catch (err: any) {
    console.error("List surveys error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// --- UPDATE SURVEY ---
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, surveyId, ...updates } = body;

    if (!orgId || !surveyId) {
      return NextResponse.json({ error: "orgId and surveyId required" }, { status: 400 });
    }

    const authResult = await verifyAdmin(request, orgId);
    if ("error" in authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowedFields = [
      "title",
      "description",
      "questions",
      "status",
      "allowIdentified",
      "opensAt",
      "closesAt",
    ];

    const safeUpdates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        safeUpdates[key] = updates[key];
      }
    }
    safeUpdates.updatedAt = new Date().toISOString();

    await adminDb
      .collection("organizations")
      .doc(orgId)
      .collection("surveys")
      .doc(surveyId)
      .update(safeUpdates);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Update survey error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// --- DELETE SURVEY ---
export async function DELETE(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get("orgId");
    const surveyId = request.nextUrl.searchParams.get("surveyId");

    if (!orgId || !surveyId) {
      return NextResponse.json({ error: "orgId and surveyId required" }, { status: 400 });
    }

    const authResult = await verifyAdmin(request, orgId);
    if ("error" in authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete survey and all responses
    const responsesSnap = await adminDb
      .collection("organizations")
      .doc(orgId)
      .collection("surveys")
      .doc(surveyId)
      .collection("responses")
      .get();

    const batch = adminDb.batch();
    responsesSnap.docs.forEach((doc) => batch.delete(doc.ref));
    batch.delete(
      adminDb
        .collection("organizations")
        .doc(orgId)
        .collection("surveys")
        .doc(surveyId)
    );
    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete survey error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}



