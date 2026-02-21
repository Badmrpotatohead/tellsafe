// ============================================================
// TellSafe v1.3 — Survey Response API
// ============================================================
// POST: Submit a response to a survey (public, no auth)
// GET:  Get survey data for public rendering

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "../../../../../lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { encryptEmail } from "../../../../../lib/encryption";
import { sendRelayConfirmation } from "../../../../../lib/email";
import type { Survey, SurveyResponseAnswer } from "../../../../../types/survey";

interface RouteContext {
  params: { surveyId: string };
}

// --- GET: Fetch survey for public rendering ---
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { surveyId } = context.params;
    const orgId = request.nextUrl.searchParams.get("orgId");

    if (!orgId) {
      return NextResponse.json({ error: "orgId required" }, { status: 400 });
    }

    const surveySnap = await adminDb
      .collection("organizations")
      .doc(orgId)
      .collection("surveys")
      .doc(surveyId)
      .get();

    if (!surveySnap.exists) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }

    const survey = { id: surveySnap.id, ...surveySnap.data() } as Survey;

    if (survey.status !== "active") {
      return NextResponse.json(
        { error: "This survey is not currently accepting responses" },
        { status: 403 }
      );
    }

    const now = new Date().toISOString();
    if (survey.opensAt && now < survey.opensAt) {
      return NextResponse.json({ error: "This survey hasn't opened yet" }, { status: 403 });
    }
    if (survey.closesAt && now > survey.closesAt) {
      return NextResponse.json({ error: "This survey has closed" }, { status: 403 });
    }

    const orgSnap = await adminDb.collection("organizations").doc(orgId).get();
    const org = orgSnap.exists ? orgSnap.data() : null;

    return NextResponse.json({
      survey: {
        id: survey.id,
        title: survey.title,
        description: survey.description,
        questions: survey.questions,
        responseType: survey.responseType ?? "anonymous",
      },
      org: org
        ? {
            name: org.name,
            slug: org.slug,
            logoUrl: org.logoUrl,
            primaryColor: org.primaryColor,
            accentColor: org.accentColor,
            tagline: org.tagline,
          }
        : null,
    });
  } catch (err) {
    console.error("Fetch survey error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// --- POST: Submit response ---
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { surveyId } = context.params;
    const body = await request.json();
    const { orgId, answers, respondentName, respondentEmail, relayEmail } = body;

    if (!orgId || !answers?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const surveyRef = adminDb
      .collection("organizations")
      .doc(orgId)
      .collection("surveys")
      .doc(surveyId);

    const surveySnap = await surveyRef.get();
    if (!surveySnap.exists) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }

    const survey = surveySnap.data() as Survey;
    const responseType = survey.responseType ?? "anonymous";

    if (survey.status !== "active") {
      return NextResponse.json({ error: "This survey is not accepting responses" }, { status: 403 });
    }

    const now = new Date().toISOString();
    if (survey.closesAt && now > survey.closesAt) {
      return NextResponse.json({ error: "This survey has closed" }, { status: 403 });
    }

    // Validate required questions
    const requiredIds = survey.questions.filter((q) => q.required).map((q) => q.id);
    const answeredIds = answers.map((a: SurveyResponseAnswer) => a.questionId);
    const missing = requiredIds.filter((id) => !answeredIds.includes(id));
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required answers for ${missing.length} question(s)` },
        { status: 400 }
      );
    }

    // Validate type-specific required fields
    if (responseType === "identified") {
      if (!respondentName?.trim() || !respondentEmail?.trim()) {
        return NextResponse.json(
          { error: "Name and email are required for identified responses" },
          { status: 400 }
        );
      }
    }
    if (responseType === "relay") {
      if (!relayEmail?.trim()) {
        return NextResponse.json(
          { error: "Email is required for relay responses" },
          { status: 400 }
        );
      }
    }

    // Build response document
    const responseData: Record<string, any> = {
      surveyId,
      orgId,
      answers,
      responseType,
      respondentName: null,
      respondentEmail: null,
      encryptedEmail: null,
      threadId: null,
      submittedAt: now,
    };

    if (responseType === "identified") {
      responseData.respondentName = respondentName.trim();
      responseData.respondentEmail = respondentEmail.trim();
    }

    if (responseType === "relay") {
      // Encrypt email — never store plaintext
      responseData.encryptedEmail = encryptEmail(relayEmail.trim());

      // Create a relay thread so admin can reply
      const orgSnap = await adminDb.collection("organizations").doc(orgId).get();
      const orgData = orgSnap.data();
      const threadRef = await adminDb
        .collection("organizations")
        .doc(orgId)
        .collection("threads")
        .add({
          orgId,
          surveyId,
          surveyTitle: survey.title,
          source: "survey",
          status: "active",
          messageCount: 0,
          lastMessageAt: now,
          createdAt: now,
        });
      responseData.threadId = threadRef.id;

      // Send confirmation email to relay submitter (non-blocking)
      sendRelayConfirmation({
        memberEmail: relayEmail.trim(),
        orgName: orgData?.name || "the organization",
        threadId: threadRef.id,
      }).catch((e) => console.warn("[Survey relay] Failed to send confirmation:", e));
    }

    const responseRef = await surveyRef.collection("responses").add(responseData);

    await surveyRef.update({
      responseCount: FieldValue.increment(1),
      updatedAt: now,
    });

    return NextResponse.json({ success: true, responseId: responseRef.id });
  } catch (err) {
    console.error("Submit survey response error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
