// Temporary debug endpoint — DELETE after fixing auth
// Shows env var status without exposing actual values

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getApps } from "firebase-admin/app";

export async function GET() {
  const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  let parsed: any = null;
  let parseError: string | null = null;
  try {
    if (rawKey) parsed = JSON.parse(rawKey);
  } catch (e: any) {
    parseError = e.message;
  }

  return NextResponse.json({
    envKeyExists: !!rawKey,
    envKeyLength: rawKey?.length || 0,
    envKeyStartsWith: rawKey?.substring(0, 20) || "MISSING",
    jsonParseOk: !!parsed && !parseError,
    parseError,
    projectId: parsed?.project_id || "N/A",
    clientEmail: parsed?.client_email || "N/A",
    privateKeyId: parsed?.private_key_id || "N/A",
    privateKeyStartsWith: parsed?.private_key?.substring(0, 30) || "N/A",
    privateKeyLength: parsed?.private_key?.length || 0,
    firebaseAppsInitialized: getApps().length,
    nodeEnv: process.env.NODE_ENV,
  });
}
