// ============================================================
// TellSafe — Email Service (Resend)
// ============================================================
// Handles all outbound email:
// 1. Relay confirmation to member after submission
// 2. Admin reply forwarded to member via relay
// 3. New feedback notification to admins
// 4. Weekly digest emails

import { Resend } from "resend";

// Lazy-init to avoid crashing during build when env var is absent
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM_EMAIL = "TellSafe <noreply@tellsafe.app>";

// ============================================================
// Relay: Confirmation to member after submission
// ============================================================
export async function sendRelayConfirmation(params: {
  memberEmail: string;
  orgName: string;
  threadId: string;
}) {
  const { memberEmail, orgName, threadId } = params;

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: memberEmail,
    subject: `Your anonymous feedback was received — ${orgName}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 0;">
        <div style="background: #f8f6f1; border-radius: 16px; padding: 32px; border: 1px solid #e8e5de;">
          <div style="font-size: 14px; color: #6b5b8a; font-weight: 600; margin-bottom: 16px;">
            🔀 Anonymous Relay — Thread #${threadId}
          </div>
          <h2 style="font-size: 22px; margin: 0 0 12px; color: #1a1a2e;">
            Your feedback was delivered
          </h2>
          <p style="font-size: 15px; color: #5a5650; line-height: 1.6; margin: 0 0 20px;">
            The organizers at <strong>${orgName}</strong> have received your anonymous feedback.
            If they respond, you'll receive their reply at this email address.
          </p>
          <div style="background: rgba(107, 91, 138, 0.08); border-radius: 10px; padding: 14px 16px; font-size: 13px; color: #6b5b8a; line-height: 1.5;">
            🔒 <strong>Your identity is protected.</strong> The organizers cannot see your
            email address. All replies are routed through TellSafe's encrypted relay.
          </div>
        </div>
        <p style="font-size: 12px; color: #aaa; text-align: center; margin-top: 20px;">
          Powered by <a href="https://tellsafe.vercel.app" style="color: #2d6a6a;">TellSafe</a> —
          Anonymous feedback for communities
        </p>
      </div>
    `,
  });
}

// ============================================================
// Relay: Forward admin reply to member
// ============================================================
export async function sendRelayReply(params: {
  memberEmail: string;
  orgName: string;
  threadId: string;
  adminName: string;
  replyText: string;
}) {
  const { memberEmail, orgName, threadId, adminName, replyText } = params;

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: memberEmail,
    replyTo: `noreply@tellsafe.app`,
    subject: `Re: Your anonymous feedback — ${orgName}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 0;">
        <div style="background: #f8f6f1; border-radius: 16px; padding: 32px; border: 1px solid #e8e5de;">
          <div style="font-size: 14px; color: #6b5b8a; font-weight: 600; margin-bottom: 16px;">
            🔀 Anonymous Relay — Thread #${threadId}
          </div>
          <h2 style="font-size: 22px; margin: 0 0 16px; color: #1a1a2e;">
            ${adminName} from ${orgName} replied
          </h2>
          <div style="background: white; border-radius: 12px; padding: 20px; border: 1px solid #e8e5de; margin-bottom: 20px;">
            <p style="font-size: 15px; color: #1a1a2e; line-height: 1.65; margin: 0; white-space: pre-wrap;">${replyText}</p>
          </div>
          <p style="font-size: 14px; color: #5a5650; line-height: 1.5; margin: 0 0 16px;">
            <strong>Want to continue the conversation?</strong> Log in to TellSafe to reply
            — your identity stays protected throughout.
          </p>
          <div style="background: rgba(107, 91, 138, 0.08); border-radius: 10px; padding: 14px 16px; font-size: 13px; color: #6b5b8a; line-height: 1.5;">
            🔒 Your identity remains protected throughout this conversation.
          </div>
        </div>
        <p style="font-size: 12px; color: #aaa; text-align: center; margin-top: 20px;">
          Powered by <a href="https://tellsafe.vercel.app" style="color: #2d6a6a;">TellSafe</a>
        </p>
      </div>
    `,
  });
}

// ============================================================
// Notification: New feedback alert to admins
// ============================================================
export async function sendNewFeedbackNotification(params: {
  adminEmails: string[];
  orgName: string;
  feedbackType: string;
  category: string;
  previewText: string; // first 150 chars of feedback
  dashboardUrl: string;
}) {
  const { adminEmails, orgName, feedbackType, category, previewText, dashboardUrl } = params;

  const typeLabels: Record<string, string> = {
    identified: "👋 Identified",
    anonymous: "👤 Anonymous",
    relay: "🔀 Anonymous Relay",
  };

  // Resend supports multiple recipients in the `to` field
  await getResend().emails.send({
    from: FROM_EMAIL,
    to: adminEmails,
    subject: `New ${feedbackType} feedback — ${orgName}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 0;">
        <div style="background: #f8f6f1; border-radius: 16px; padding: 32px; border: 1px solid #e8e5de;">
          <div style="font-size: 13px; font-weight: 600; color: #8a8578; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">
            New Feedback
          </div>
          <h2 style="font-size: 20px; margin: 0 0 16px; color: #1a1a2e;">
            ${typeLabels[feedbackType] || feedbackType} · ${category}
          </h2>
          <div style="background: white; border-radius: 12px; padding: 20px; border: 1px solid #e8e5de; margin-bottom: 20px;">
            <p style="font-size: 14px; color: #1a1a2e; line-height: 1.6; margin: 0;">${previewText}${previewText.length >= 150 ? "..." : ""}</p>
          </div>
          ${feedbackType === "relay" ? `
            <div style="background: rgba(107, 91, 138, 0.08); border-radius: 10px; padding: 12px 16px; font-size: 13px; color: #6b5b8a; margin-bottom: 16px;">
              🔀 This is a relay submission — you can reply anonymously through TellSafe.
            </div>
          ` : ""}
          <a href="${dashboardUrl}" style="display: inline-block; background: #2d6a6a; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 600;">
            View in Dashboard →
          </a>
        </div>
        <p style="font-size: 12px; color: #aaa; text-align: center; margin-top: 20px;">
          Powered by <a href="https://tellsafe.vercel.app" style="color: #2d6a6a;">TellSafe</a>
        </p>
      </div>
    `,
  });
}

// ============================================================
// Weekly Digest: Summary email to admins
// ============================================================
export async function sendWeeklyDigest(params: {
  adminEmails: string[];
  orgName: string;
  totalNew: number;
  urgent: number;
  needsReply: number;
  resolved: number;
  sentimentBreakdown: { positive: number; neutral: number; negative: number; urgent: number };
  topCategories: Array<{ name: string; count: number }>;
  dashboardUrl: string;
}) {
  const {
    adminEmails, orgName, totalNew, urgent, needsReply, resolved,
    sentimentBreakdown, topCategories, dashboardUrl,
  } = params;

  // Determine overall sentiment trend
  const total = sentimentBreakdown.positive + sentimentBreakdown.neutral + sentimentBreakdown.negative + sentimentBreakdown.urgent;
  let sentimentTrend = "No data";
  let sentimentEmoji = "📊";
  if (total > 0) {
    if (sentimentBreakdown.positive > total * 0.5) {
      sentimentTrend = "Trending positive";
      sentimentEmoji = "😊";
    } else if (sentimentBreakdown.negative + sentimentBreakdown.urgent > total * 0.5) {
      sentimentTrend = "Needs attention";
      sentimentEmoji = "⚠️";
    } else {
      sentimentTrend = "Mixed sentiment";
      sentimentEmoji = "😐";
    }
  }

  const categoryHtml = topCategories.length > 0
    ? topCategories.map((c) => `
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
          <span style="font-size: 13px; color: #1a1a2e; font-weight: 600;">${c.name}</span>
          <span style="font-size: 12px; color: #8a8578;">(${c.count})</span>
        </div>
      `).join("")
    : '<div style="font-size: 13px; color: #8a8578;">No categorized feedback this week</div>';

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: adminEmails,
    subject: `Weekly Digest: ${totalNew} new submission${totalNew !== 1 ? "s" : ""} — ${orgName}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 0;">
        <div style="background: #f8f6f1; border-radius: 16px; padding: 32px; border: 1px solid #e8e5de;">
          <div style="font-size: 13px; font-weight: 600; color: #8a8578; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
            📊 Weekly Feedback Digest
          </div>
          <h2 style="font-size: 22px; margin: 0 0 24px; color: #1a1a2e;">
            ${orgName}
          </h2>

          <!-- Stats grid -->
          <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
            <tr>
              <td width="50%" style="padding-right: 6px; padding-bottom: 12px;">
                <div style="background: white; border-radius: 12px; padding: 16px; border: 1px solid #e8e5de; text-align: center;">
                  <div style="font-size: 28px; font-weight: 700; color: #2d6a6a;">${totalNew}</div>
                  <div style="font-size: 12px; color: #8a8578; font-weight: 600;">New Submissions</div>
                </div>
              </td>
              <td width="50%" style="padding-left: 6px; padding-bottom: 12px;">
                <div style="background: white; border-radius: 12px; padding: 16px; border: 1px solid #e8e5de; text-align: center;">
                  <div style="font-size: 28px; font-weight: 700; color: ${urgent > 0 ? "#dc2626" : "#8a8578"};">${urgent}</div>
                  <div style="font-size: 12px; color: #8a8578; font-weight: 600;">Urgent</div>
                </div>
              </td>
            </tr>
            <tr>
              <td width="50%" style="padding-right: 6px;">
                <div style="background: white; border-radius: 12px; padding: 16px; border: 1px solid #e8e5de; text-align: center;">
                  <div style="font-size: 28px; font-weight: 700; color: ${needsReply > 0 ? "#d97706" : "#8a8578"};">${needsReply}</div>
                  <div style="font-size: 12px; color: #8a8578; font-weight: 600;">Needs Reply</div>
                </div>
              </td>
              <td width="50%" style="padding-left: 6px;">
                <div style="background: white; border-radius: 12px; padding: 16px; border: 1px solid #e8e5de; text-align: center;">
                  <div style="font-size: 28px; font-weight: 700; color: #059669;">${resolved}</div>
                  <div style="font-size: 12px; color: #8a8578; font-weight: 600;">Resolved</div>
                </div>
              </td>
            </tr>
          </table>

          <!-- Sentiment -->
          <div style="background: white; border-radius: 12px; padding: 16px; border: 1px solid #e8e5de; margin-bottom: 16px;">
            <div style="font-size: 13px; font-weight: 600; color: #1a1a2e; margin-bottom: 8px;">
              ${sentimentEmoji} Sentiment
            </div>
            <div style="font-size: 15px; color: #5a5650;">${sentimentTrend}</div>
          </div>

          <!-- Top categories -->
          <div style="background: white; border-radius: 12px; padding: 16px; border: 1px solid #e8e5de; margin-bottom: 24px;">
            <div style="font-size: 13px; font-weight: 600; color: #1a1a2e; margin-bottom: 12px;">
              📂 Top Categories
            </div>
            ${categoryHtml}
          </div>

          <a href="${dashboardUrl}" style="display: inline-block; background: #2d6a6a; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 600;">
            View Dashboard →
          </a>
        </div>
        <p style="font-size: 12px; color: #aaa; text-align: center; margin-top: 20px;">
          Powered by <a href="https://tellsafe.vercel.app" style="color: #2d6a6a;">TellSafe</a> —
          You can disable digest emails in your admin settings.
        </p>
      </div>
    `,
  });
}
