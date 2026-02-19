// Temporary debug endpoint — DELETE after fixing auth
// Tests Firebase Admin SDK initialization and Firestore connectivity

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getApps } from "firebase-admin/app";
import { adminDb, adminAuth } from "../../../lib/firebase-admin";

export async function GET() {
  const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  let parsed: any = null;
  let parseError: string | null = null;
  try {
    if (rawKey) parsed = JSON.parse(rawKey);
  } catch (e: any) {
    parseError = e.message;
  }

  // Test Firestore connectivity
  let firestoreTest = "not_tested";
  let firestoreError: string | null = null;
  try {
    const snap = await adminDb.collection("organizations").limit(1).get();
    firestoreTest = `ok: found ${snap.size} doc(s)`;
  } catch (e: any) {
    firestoreTest = "FAILED";
    firestoreError = e?.message || String(e);
  }

  return NextResponse.json({
    envKeyExists: !!rawKey,
    envKeyLength: rawKey?.length || 0,
    jsonParseOk: !!parsed && !parseError,
    parseError,
    projectId: parsed?.project_id || "N/A",
    clientEmail: parsed?.client_email || "N/A",
    privateKeyId: parsed?.private_key_id || "N/A",
    privateKeyLength: parsed?.private_key?.length || 0,
    firebaseAppsInitialized: getApps().length,
    firestoreTest,
    firestoreError,
    nodeEnv: process.env.NODE_ENV,
  });
}
