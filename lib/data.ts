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
} from "./firebase";
import type {
  Organization,
  Feedback,
  FeedbackType,
  FeedbackStatus,
  RelayThread,
  ThreadMessage,
  ResponseTemplate,
  OrgAdmin,
  SubmitFeedbackRequest,
} from "../types";

// ============================================================
// Organization Operations
// ============================================================

/** Create a new organization (direct Firestore write) */
export async function createOrganization(name: string, slug: string) {
  const { doc, setDoc, collection: col } = await import("firebase/firestore");
  const user = auth.currentUser;
  if (!user) throw new Error("Must be signed in");

  const now = new Date().toISOString();
  const orgRef = doc(col(db, "organizations"));

  await setDoc(orgRef, {
    name,
    slug,
    logoUrl: null,
    primaryColor: "#2d6a6a",
    accentColor: "#c05d3b",
    tagline: "Your voice matters. Share your feedback anonymously.",
    categories: [
      { emoji: "💡", label: "Suggestion" },
      { emoji: "❤️", label: "Praise" },
      { emoji: "🤝", label: "Safety" },
      { emoji: "💬", label: "Other" },
    ],
    plan: "free",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    ownerId: user.uid,
    submissionCount: 0,
    submissionResetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
    createdAt: now,
    updatedAt: now,
  });

  await setDoc(doc(db, "slugs", slug), { orgId: orgRef.id });

  await setDoc(doc(db, "organizations", orgRef.id, "admins", user.uid), {
    email: user.email || "",
    displayName: user.displayName || "Owner",
    role: "owner",
    joinedAt: now,
  });

  return { orgId: orgRef.id, slug };
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

/** Update org settings (branding, categories, tagline) */
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

// ============================================================
// Thread & Reply Operations
// ============================================================

/** Create a thread for any feedback type (identified or relay) */
export async function createThreadForFeedback(
  orgId: string,
  feedbackId: string
): Promise<string> {
  const now = new Date().toISOString();
  const threadRef = await addDoc(collections.threads(orgId), {
    orgId,
    feedbackId,
    status: "active",
    messageCount: 0,
    lastMessageAt: now,
    createdAt: now,
  });

  // Update the feedback doc with the threadId
  await updateDoc(collections.feedbackDoc(orgId, feedbackId), {
    threadId: threadRef.id,
    updatedAt: now,
  });

  return threadRef.id;
}

/** Get or create a thread for a feedback item */
export async function getOrCreateThread(
  orgId: string,
  feedbackId: string,
  existingThreadId?: string
): Promise<string> {
  if (existingThreadId) {
    const threadSnap = await getDoc(collections.thread(orgId, existingThreadId));
    if (threadSnap.exists()) return existingThreadId;
  }
  return createThreadForFeedback(orgId, feedbackId);
}

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
  const now = new Date().toISOString();

  await addDoc(collections.messages(orgId, threadId), {
    from: "admin",
    authorName,
    text,
    createdAt: now,
  });

  // Update thread metadata
  await updateDoc(collections.thread(orgId, threadId), {
    lastMessageAt: now,
    messageCount: increment(1),
  });
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

/** Increment template usage count */
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

  const categoryCounts: Record<string, number> = {};
  items.forEach((f) => {
    (f.categories || []).forEach((c: string) => {
      categoryCounts[c] = (categoryCounts[c] || 0) + 1;
    });
  });

  const topCategory = Object.entries(categoryCounts).sort(
    ([, a], [, b]) => b - a
  )[0];

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
