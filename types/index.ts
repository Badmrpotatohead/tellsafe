// ============================================================
// TellSafe — Type Definitions
// ============================================================

// --- Plans & Billing ---
export type Plan = "free" | "community" | "pro";

export interface PlanLimits {
  maxSubmissionsPerMonth: number;
  maxAdmins: number;
  hasRelay: boolean;
  hasCustomBranding: boolean;
  hasSentiment: boolean;
  hasTemplates: boolean;
  hasCsvExport: boolean;
  hasAnalytics: boolean;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    maxSubmissionsPerMonth: 25,
    maxAdmins: 1,
    hasRelay: false,
    hasCustomBranding: false,
    hasSentiment: false,
    hasTemplates: false,
    hasCsvExport: false,
    hasAnalytics: false,
  },
  community: {
    maxSubmissionsPerMonth: Infinity,
    maxAdmins: 2,
    hasRelay: true,
    hasCustomBranding: false,
    hasSentiment: false,
    hasTemplates: false,
    hasCsvExport: false,
    hasAnalytics: false,
  },
  pro: {
    maxSubmissionsPerMonth: Infinity,
    maxAdmins: 5,
    hasRelay: true,
    hasCustomBranding: true,
    hasSentiment: true,
    hasTemplates: true,
    hasCsvExport: true,
    hasAnalytics: true,
  },
};

// --- Organization ---
export interface Category {
  emoji: string;
  label: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string; // unique, used in URLs: tellsafe.app/{slug}
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  tagline: string;
  categories: Category[];
  plan: Plan;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  ownerId: string; // Firebase Auth UID of creator
  submissionCount: number; // current month submissions
  submissionResetDate: string; // ISO date of next reset
  createdAt: string;
  updatedAt: string;
}

// --- Admin (sub-collection of Organization) ---
export type AdminRole = "owner" | "admin";

export interface OrgAdmin {
  id: string; // Firebase Auth UID
  email: string;
  displayName: string;
  role: AdminRole;
  joinedAt: string;
}

// --- Feedback ---
export type FeedbackType = "identified" | "anonymous" | "relay";
export type FeedbackStatus = "new" | "needs_reply" | "replied" | "resolved";

export interface FeedbackBase {
  id: string;
  orgId: string;
  type: FeedbackType;
  categories: string[];
  text: string;
  status: FeedbackStatus;
  sentimentScore: number | null; // -1 to 1, null if not analyzed
  sentimentLabel: "positive" | "neutral" | "negative" | "urgent" | null;
  createdAt: string;
  updatedAt: string;
}

export interface IdentifiedFeedback extends FeedbackBase {
  type: "identified";
  authorName: string;
  authorEmail: string;
}

export interface AnonymousFeedback extends FeedbackBase {
  type: "anonymous";
}

export interface RelayFeedback extends FeedbackBase {
  type: "relay";
  encryptedEmail: string; // AES-256 encrypted, only decryptable server-side
  threadId: string;
}

export type Feedback = IdentifiedFeedback | AnonymousFeedback | RelayFeedback;

// --- Relay Thread ---
export interface RelayThread {
  id: string;
  orgId: string;
  feedbackId: string;
  status: "active" | "closed";
  messageCount: number;
  lastMessageAt: string;
  createdAt: string;
}

// --- Thread Message ---
export type MessageSender = "member" | "admin";

export interface ThreadMessage {
  id: string;
  threadId: string;
  from: MessageSender;
  authorName: string | null; // admin name, null for member
  text: string;
  createdAt: string;
}

// --- Response Templates ---
export interface ResponseTemplate {
  id: string;
  orgId: string;
  title: string; // e.g., "Acknowledge & investigate"
  body: string; // the template text
  category: string | null; // optional: auto-suggest for specific categories
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

// --- API Request/Response Types ---
export interface SubmitFeedbackRequest {
  orgSlug: string;
  type: FeedbackType;
  categories: string[];
  text: string;
  // Only for identified:
  authorName?: string;
  authorEmail?: string;
  // Only for relay:
  relayEmail?: string;
}

export interface SubmitFeedbackResponse {
  success: boolean;
  feedbackId: string;
  threadId?: string; // only for relay
}

export interface AdminReplyRequest {
  threadId: string;
  text: string;
  authorName: string;
}

// --- Sentiment Analysis ---
export interface SentimentResult {
  score: number; // -1 to 1
  label: "positive" | "neutral" | "negative" | "urgent";
  confidence: number;
}
