// ============================================================
// TellSafe — Firebase Client SDK Init
// ============================================================
// Used in the Next.js frontend (browser + server components)

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  increment,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

// These are public client-side keys — safe to expose
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Prevent re-initialization in hot-reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// ============================================================
// Collection References (typed helpers)
// ============================================================

export const collections = {
  organizations: () => collection(db, "organizations"),
  organization: (orgId: string) => doc(db, "organizations", orgId),

  admins: (orgId: string) =>
    collection(db, "organizations", orgId, "admins"),
  admin: (orgId: string, userId: string) =>
    doc(db, "organizations", orgId, "admins", userId),

  feedback: (orgId: string) =>
    collection(db, "organizations", orgId, "feedback"),
  feedbackDoc: (orgId: string, feedbackId: string) =>
    doc(db, "organizations", orgId, "feedback", feedbackId),

  threads: (orgId: string) =>
    collection(db, "organizations", orgId, "threads"),
  thread: (orgId: string, threadId: string) =>
    doc(db, "organizations", orgId, "threads", threadId),

  messages: (orgId: string, threadId: string) =>
    collection(db, "organizations", orgId, "threads", threadId, "messages"),
  message: (orgId: string, threadId: string, messageId: string) =>
    doc(db, "organizations", orgId, "threads", threadId, "messages", messageId),

  templates: (orgId: string) =>
    collection(db, "organizations", orgId, "templates"),
  template: (orgId: string, templateId: string) =>
    doc(db, "organizations", orgId, "templates", templateId),
};

// Re-export Firestore utilities for convenience
export {
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  increment,
  Timestamp,
  writeBatch,
};
