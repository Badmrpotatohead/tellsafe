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

// Helper to verify admin
async function verifyAdmin(request: NextRequest, orgId: string) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    console.error("[survey] No Bearer token in Authorization header");
    return null;
  }

  const token = authHeader.split("Bearer ")[1];
  if (!token || token === "undefined" || token === "null") {
    console.error("[survey] Token is empty/undefined");
    return null;
  }

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(token);
  } catch (err: any) {
    console.error("[survey] verifyIdToken failed:", err?.code || err?.message);
    return null;
  }

  const adminDoc = await adminCollections.admins(orgId).doc(decoded.uid).get();
  if (!adminDoc.exists) {
    console.error(`[survey] No admin doc for uid=${decoded.uid} in org=${orgId}`);
    return null;
  }

  return decoded.uid;
}

// --- CREATE SURVEY ---
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, title, description, questions, allowIdentified, opensAt, closesAt, templateId } = body;

    if (!orgId || !title || !questions?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const uid = await verifyAdmin(request, orgId);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
  } catch (err) {
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

    const uid = await verifyAdmin(request, orgId);
    if (!uid) {
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
  } catch (err) {
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

    const uid = await verifyAdmin(request, orgId);
    if (!uid) {
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

    const uid = await verifyAdmin(request, orgId);
    if (!uid) {
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



