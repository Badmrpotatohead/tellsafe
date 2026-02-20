// ============================================================
// TellSafe — Firebase Admin SDK (Server-Side Only)
// ============================================================
// Used in: Cloud Functions, Next.js API routes (server-side)
// NEVER import this in client-side code

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

// Initialize with service account credentials
if (getApps().length === 0) {
  const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!rawKey) {
    console.error("[firebase-admin] FIREBASE_SERVICE_ACCOUNT_KEY is not set — auth will fail");
  }
  const serviceAccount = rawKey ? JSON.parse(rawKey) : undefined;

  initializeApp(
    serviceAccount
      ? {
          credential: cert(serviceAccount),
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        }
      : undefined
  );
}

export const adminDb = getFirestore();
export const adminAuth = getAuth();
export const adminStorage = getStorage();

// ============================================================
// Admin Collection References
// ============================================================

export const adminCollections = {
  organizations: () => adminDb.collection("organizations"),
  organization: (orgId: string) =>
    adminDb.collection("organizations").doc(orgId),

  admins: (orgId: string) =>
    adminDb.collection("organizations").doc(orgId).collection("admins"),

  feedback: (orgId: string) =>
    adminDb.collection("organizations").doc(orgId).collection("feedback"),
  feedbackDoc: (orgId: string, feedbackId: string) =>
    adminDb.collection("organizations").doc(orgId).collection("feedback").doc(feedbackId),

  threads: (orgId: string) =>
    adminDb.collection("organizations").doc(orgId).collection("threads"),
  thread: (orgId: string, threadId: string) =>
    adminDb.collection("organizations").doc(orgId).collection("threads").doc(threadId),

  messages: (orgId: string, threadId: string) =>
    adminDb
      .collection("organizations").doc(orgId)
      .collection("threads").doc(threadId)
      .collection("messages"),

  templates: (orgId: string) =>
    adminDb.collection("organizations").doc(orgId).collection("templates"),

  updates: (orgId: string) =>
    adminDb.collection("organizations").doc(orgId).collection("updates"),
  updateDoc: (orgId: string, updateId: string) =>
    adminDb.collection("organizations").doc(orgId).collection("updates").doc(updateId),
};
