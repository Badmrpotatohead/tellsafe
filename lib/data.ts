// ============================================================
// TellSafe — Data Operations (Client-Side)
// ============================================================
// All Firestore read/write operations used by the Next.js frontend.
// These run in the browser and are subject to Firestore security rules.

import {
  db,
  auth,
  collections,
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
} from "./firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import type {
  Organization,
  Feedback,
  FeedbackType,
  FeedbackStatus,
  RelayThread,
  ThreadMessage,
  ResponseTemplate,
  OrgAdmin,
  OrgUpdate,
  SubmitFeedbackRequest,
} from "../types";

const functions = getFunctions();

// ============================================================
// Organization Operations
// ============================================================

/** Create a new organization via Next.js API route (no Cloud Functions required) */
export async function createOrganization(name: string, slug: string) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Must be signed in to create an organization.");

  const res = await fetch("/api/org/create", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name, slug }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create organization.");
  return data as { orgId: string; slug: string };
}

/** Get org by slug (for public feedback form) */
export async function getOrgBySlug(
  slug: string
): Promise<Organization | null> {
  const slugSnap = await getDoc(
    (await import("firebase/firestore")).doc(db, "slugs", slug)
  );
  if (!slugSnap.exists()) return null;

  const { orgId } = slugSnap.data() as { orgId: string };
  const orgSnap = await getDoc(collections.organization(orgId));
  if (!orgSnap.exists()) return null;

  return { id: orgSnap.id, ...orgSnap.data() } as Organization;
}

/** Get org by ID (for admin dashboard) */
export async function getOrganization(
  orgId: string
): Promise<Organization | null> {
  const snap = await getDoc(collections.organization(orgId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Organization;
}

/** Update org settings (branding, categories, integrations, etc.) */
export async function updateOrganization(
  orgId: string,
  updates: Partial<
    Pick<
      Organization,
      | "name"
      | "logoUrl"
      | "primaryColor"
      | "accentColor"
      | "tagline"
      | "categories"
      | "webhookUrl"
      | "webhookEnabled"
      | "digestEnabled"
      | "digestDay"
    >
  >
) {
  await updateDoc(collections.organization(orgId), {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

/** Get organizations the current user is admin of */
export async function getMyOrganizations(): Promise<Organization[]> {
  const user = auth.currentUser;
  if (!user) return [];

  // Query all orgs — then filter by admin subcollection
  // In production, you'd denormalize this into a user-level collection
  // for efficiency. For now this works at our scale.
  const orgsSnap = await getDocs(
    query(collections.organizations(), where("ownerId", "==", user.uid))
  );

  return orgsSnap.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Organization)
  );
}

// ============================================================
// Feedback Operations
// ============================================================

/** Submit feedback (public, no auth required) */
export async function submitFeedback(
  orgId: string,
  data: SubmitFeedbackRequest
) {
  const now = new Date().toISOString();
  const feedbackData: Record<string, any> = {
    type: data.type,
    categories: data.categories,
    text: data.text,
    status: "new" as FeedbackStatus,
    sentimentScore: null,
    sentimentLabel: null,
    createdAt: now,
    updatedAt: now,
  };

  // Add type-specific fields
  if (data.type === "identified") {
    feedbackData.authorName = data.authorName || "";
    feedbackData.authorEmail = data.authorEmail || "";
  }

  if (data.type === "relay" && data.relayEmail) {
    // Send plaintext email temporarily — Cloud Function will encrypt and delete it
    feedbackData.relayEmailPlaintext = data.relayEmail;
  }

  const docRef = await addDoc(collections.feedback(orgId), feedbackData);
  return docRef.id;
}

/** Subscribe to feedback list (real-time) */
export function subscribeFeedback(
  orgId: string,
  filters: {
    type?: FeedbackType;
    status?: FeedbackStatus;
    sentimentLabel?: string;
    limitCount?: number;
  },
  callback: (feedback: Feedback[]) => void
) {
  let q = query(
    collections.feedback(orgId),
    orderBy("createdAt", "desc")
  );

  if (filters.type) {
    q = query(q, where("type", "==", filters.type));
  }
  if (filters.status) {
    q = query(q, where("status", "==", filters.status));
  }
  if (filters.sentimentLabel) {
    q = query(q, where("sentimentLabel", "==", filters.sentimentLabel));
  }
  if (filters.limitCount) {
    q = query(q, limit(filters.limitCount));
  }

  return onSnapshot(q, (snap) => {
    const items = snap.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Feedback)
    );
    callback(items);
  });
}

/** Update feedback status */
export async function updateFeedbackStatus(
  orgId: string,
  feedbackId: string,
  status: FeedbackStatus
) {
  await updateDoc(collections.feedbackDoc(orgId, feedbackId), {
    status,
    updatedAt: new Date().toISOString(),
  });
}

/** Batch archive all resolved feedback for an org */
export async function batchArchiveResolved(orgId: string): Promise<number> {
  const q = query(
    collections.feedback(orgId),
    where("status", "==", "resolved")
  );
  const snap = await getDocs(q);
  if (snap.empty) return 0;

  const batch = writeBatch(db);
  snap.docs.forEach((d) => {
    batch.update(d.ref, {
      status: "archived",
      updatedAt: new Date().toISOString(),
    });
  });
  await batch.commit();
  return snap.size;
}

/** Delete a single feedback item permanently */
export async function deleteFeedback(orgId: string, feedbackId: string) {
  await deleteDoc(collections.feedbackDoc(orgId, feedbackId));
}

/** Batch delete multiple feedback items permanently */
export async function batchDeleteFeedback(orgId: string, feedbackIds: string[]): Promise<number> {
  if (feedbackIds.length === 0) return 0;
  const batch = writeBatch(db);
  feedbackIds.forEach((id) => {
    batch.delete(collections.feedbackDoc(orgId, id));
  });
  await batch.commit();
  return feedbackIds.length;
}

// ============================================================
// Relay Thread Operations
// ============================================================

/** Subscribe to thread messages (real-time) */
export function subscribeThreadMessages(
  orgId: string,
  threadId: string,
  callback: (messages: ThreadMessage[]) => void
) {
  const q = query(
    collections.messages(orgId, threadId),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(q, (snap) => {
    const msgs = snap.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as ThreadMessage)
    );
    callback(msgs);
  });
}

/** Send admin reply in a thread */
export async function sendAdminReply(
  orgId: string,
  threadId: string,
  text: string,
  authorName: string
) {
  await addDoc(collections.messages(orgId, threadId), {
    from: "admin",
    authorName,
    text,
    createdAt: new Date().toISOString(),
  });
}

/** Get or create a thread for a feedback item (for in-app replies) */
export async function getOrCreateThread(
  orgId: string,
  feedbackId: string
): Promise<string> {
  // Check if feedback already has a threadId
  const feedbackDoc = await getDoc(collections.feedbackDoc(orgId, feedbackId));
  const data = feedbackDoc.data();
  if (data?.threadId) return data.threadId;

  // Create a new thread
  const now = new Date().toISOString();
  const threadRef = await addDoc(collections.threads(orgId), {
    orgId,
    feedbackId,
    status: "active",
    messageCount: 0,
    lastMessageAt: now,
    createdAt: now,
  });

  // Link thread back to feedback
  await updateDoc(collections.feedbackDoc(orgId, feedbackId), {
    threadId: threadRef.id,
    updatedAt: now,
  });

  return threadRef.id;
}

/** Get all threads for an org */
export function subscribeThreads(
  orgId: string,
  callback: (threads: RelayThread[]) => void
) {
  const q = query(
    collections.threads(orgId),
    orderBy("lastMessageAt", "desc")
  );

  return onSnapshot(q, (snap) => {
    const threads = snap.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as RelayThread)
    );
    callback(threads);
  });
}

// ============================================================
// Response Templates
// ============================================================

/** Get all templates for an org */
export async function getTemplates(
  orgId: string
): Promise<ResponseTemplate[]> {
  const snap = await getDocs(
    query(collections.templates(orgId), orderBy("usageCount", "desc"))
  );
  return snap.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as ResponseTemplate)
  );
}

/** Create a new template */
export async function createTemplate(
  orgId: string,
  data: { title: string; body: string; category?: string }
) {
  const now = new Date().toISOString();
  const docRef = await addDoc(collections.templates(orgId), {
    ...data,
    category: data.category || null,
    usageCount: 0,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

/** Update a template */
export async function updateTemplate(
  orgId: string,
  templateId: string,
  data: Partial<Pick<ResponseTemplate, "title" | "body" | "category">>
) {
  await updateDoc(collections.template(orgId, templateId), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

/** Delete a template */
export async function deleteTemplate(orgId: string, templateId: string) {
  await deleteDoc(collections.template(orgId, templateId));
}

/** Increment template usage count (called when admin uses a template) */
export async function trackTemplateUsage(
  orgId: string,
  templateId: string
) {
  await updateDoc(collections.template(orgId, templateId), {
    usageCount: increment(1),
  });
}

// ============================================================
// Admin Management
// ============================================================

/** Get admins for an org */
export async function getOrgAdmins(orgId: string): Promise<OrgAdmin[]> {
  const snap = await getDocs(collections.admins(orgId));
  return snap.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as OrgAdmin)
  );
}

// ============================================================
// Analytics Helpers
// ============================================================

/** Get feedback stats for dashboard */
export async function getFeedbackStats(orgId: string) {
  const allSnap = await getDocs(collections.feedback(orgId));
  const items = allSnap.docs.map((d) => d.data());

  const total = items.length;
  const needsReply = items.filter(
    (f) => f.status === "needs_reply" || f.status === "new"
  ).length;
  const urgent = items.filter((f) => f.sentimentLabel === "urgent").length;

  // Category breakdown
  const categoryCounts: Record<string, number> = {};
  items.forEach((f) => {
    (f.categories || []).forEach((c: string) => {
      categoryCounts[c] = (categoryCounts[c] || 0) + 1;
    });
  });

  const topCategory = Object.entries(categoryCounts).sort(
    ([, a], [, b]) => b - a
  )[0];

  // Sentiment breakdown
  const sentimentCounts = {
    positive: items.filter((f) => f.sentimentLabel === "positive").length,
    neutral: items.filter((f) => f.sentimentLabel === "neutral").length,
    negative: items.filter((f) => f.sentimentLabel === "negative").length,
    urgent: items.filter((f) => f.sentimentLabel === "urgent").length,
    unanalyzed: items.filter((f) => !f.sentimentLabel).length,
  };

  return {
    total,
    needsReply,
    urgent,
    topCategory: topCategory ? { name: topCategory[0], count: topCategory[1] } : null,
    categoryCounts,
    sentimentCounts,
  };
}

// ============================================================
// Updates Board
// ============================================================

/** Get all updates for an org (admin) */
export async function getUpdates(orgId: string): Promise<OrgUpdate[]> {
  const snap = await getDocs(
    query(collections.updates(orgId), orderBy("createdAt", "desc"))
  );
  return snap.docs.map(
    (doc) => ({ id: doc.id, orgId, ...doc.data() } as OrgUpdate)
  );
}

/** Get published updates only (public page) */
export async function getPublishedUpdates(orgId: string): Promise<OrgUpdate[]> {
  const snap = await getDocs(
    query(
      collections.updates(orgId),
      where("status", "==", "published"),
      orderBy("createdAt", "desc")
    )
  );
  return snap.docs.map(
    (doc) => ({ id: doc.id, orgId, ...doc.data() } as OrgUpdate)
  );
}

/** Create a new update */
export async function createUpdate(
  orgId: string,
  data: { title: string; body: string; category?: string; emoji?: string; status?: string }
) {
  const now = new Date().toISOString();
  const docRef = await addDoc(collections.updates(orgId), {
    title: data.title,
    body: data.body,
    category: data.category || null,
    emoji: data.emoji || "✨",
    status: data.status || "draft",
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

/** Update an existing update */
export async function updateOrgUpdate(
  orgId: string,
  updateId: string,
  data: Partial<Pick<OrgUpdate, "title" | "body" | "category" | "emoji" | "status">>
) {
  await updateDoc(collections.update(orgId, updateId), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

/** Delete an update */
export async function deleteOrgUpdate(orgId: string, updateId: string) {
  await deleteDoc(collections.update(orgId, updateId));
}
