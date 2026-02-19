// ============================================================
// TellSafe v1.3 — Survey Response API
// ============================================================
// POST: Submit a response to a survey (public, no auth)
// GET: Get survey data for rendering (public)

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "../../../../../lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { Survey, SurveyResponse, SurveyResponseAnswer } from "../../../../../types/survey";

interface RouteContext {
  params: Promise<{ surveyId: string }>;
}

// --- GET: Fetch survey for public rendering ---
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { surveyId } = await context.params;
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

    // Check if survey is active
    if (survey.status !== "active") {
      return NextResponse.json(
        { error: "This survey is not currently accepting responses" },
        { status: 403 }
      );
    }

    // Check scheduling
    const now = new Date().toISOString();
    if (survey.opensAt && now < survey.opensAt) {
      return NextResponse.json(
        { error: "This survey hasn't opened yet" },
        { status: 403 }
      );
    }
    if (survey.closesAt && now > survey.closesAt) {
      return NextResponse.json(
        { error: "This survey has closed" },
        { status: 403 }
      );
    }

    // Get org info for branding
    const orgSnap = await adminDb.collection("organizations").doc(orgId).get();
    const org = orgSnap.exists ? orgSnap.data() : null;

    return NextResponse.json({
      survey: {
        id: survey.id,
        title: survey.title,
        description: survey.description,
        questions: survey.questions,
        allowIdentified: survey.allowIdentified,
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
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { surveyId } = await context.params;
    const body = await request.json();
    const { orgId, answers, respondentName, respondentEmail } = body;

    if (!orgId || !answers?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify survey exists and is active
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

    if (survey.status !== "active") {
      return NextResponse.json(
        { error: "This survey is not accepting responses" },
        { status: 403 }
      );
    }

    // Check scheduling
    const now = new Date().toISOString();
    if (survey.closesAt && now > survey.closesAt) {
      return NextResponse.json(
        { error: "This survey has closed" },
        { status: 403 }
      );
    }

    // Validate required questions are answered
    const requiredIds = survey.questions
      .filter((q) => q.required)
      .map((q) => q.id);
    const answeredIds = answers.map((a: SurveyResponseAnswer) => a.questionId);
    const missing = requiredIds.filter((id) => !answeredIds.includes(id));

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required answers for ${missing.length} question(s)` },
        { status: 400 }
      );
    }

    // Save response
    const responseData = {
      surveyId,
      orgId,
      answers,
      respondentName: respondentName || null,
      respondentEmail: respondentEmail || null,
      submittedAt: now,
    };

    const responseRef = await surveyRef.collection("responses").add(responseData);

    // Increment response count
    await surveyRef.update({
      responseCount: FieldValue.increment(1),
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      responseId: responseRef.id,
    });
  } catch (err) {
    console.error("Submit survey response error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
