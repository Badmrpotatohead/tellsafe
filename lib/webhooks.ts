// ============================================================
// TellSafe — Webhook Integration (Slack / Discord)
// ============================================================
// Sends formatted notifications to Slack or Discord channels
// when new feedback is submitted. Auto-detects platform by URL.

interface WebhookPayload {
  orgName: string;
  feedbackType: string;
  category: string;
  previewText: string;
  sentimentLabel: string | null;
  dashboardUrl: string;
}

type Platform = "slack" | "discord" | "unknown";

function detectPlatform(url: string): Platform {
  if (url.includes("hooks.slack.com") || url.includes("slack.com/services")) {
    return "slack";
  }
  if (url.includes("discord.com/api/webhooks") || url.includes("discordapp.com/api/webhooks")) {
    return "discord";
  }
  return "unknown";
}

function buildSlackPayload(data: WebhookPayload) {
  const typeEmoji: Record<string, string> = {
    identified: "👋",
    anonymous: "👤",
    relay: "🔀",
  };

  const sentimentEmoji: Record<string, string> = {
    urgent: "🚨",
    negative: "⚠️",
    neutral: "➖",
    positive: "✅",
  };

  const emoji = typeEmoji[data.feedbackType] || "📩";
  const sEmoji = data.sentimentLabel ? sentimentEmoji[data.sentimentLabel] || "" : "";

  return {
    text: `${emoji} New ${data.feedbackType} feedback for ${data.orgName}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${emoji} New Feedback — ${data.orgName}`,
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Type:* ${data.feedbackType}` },
          { type: "mrkdwn", text: `*Category:* ${data.category}` },
          ...(data.sentimentLabel
            ? [{ type: "mrkdwn", text: `*Sentiment:* ${sEmoji} ${data.sentimentLabel}` }]
            : []),
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `> ${data.previewText}${data.previewText.length >= 150 ? "..." : ""}`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "View in Dashboard", emoji: true },
            url: data.dashboardUrl,
            style: "primary",
          },
        ],
      },
    ],
  };
}

function buildDiscordPayload(data: WebhookPayload) {
  const typeEmoji: Record<string, string> = {
    identified: "👋",
    anonymous: "👤",
    relay: "🔀",
  };

  const sentimentColors: Record<string, number> = {
    urgent: 0xdc2626,
    negative: 0xd97706,
    neutral: 0x6b7280,
    positive: 0x059669,
  };

  const emoji = typeEmoji[data.feedbackType] || "📩";
  const color = data.sentimentLabel
    ? sentimentColors[data.sentimentLabel] || 0x2d6a6a
    : 0x2d6a6a;

  return {
    embeds: [
      {
        title: `${emoji} New Feedback — ${data.orgName}`,
        description: `> ${data.previewText}${data.previewText.length >= 150 ? "..." : ""}`,
        color,
        fields: [
          { name: "Type", value: data.feedbackType, inline: true },
          { name: "Category", value: data.category, inline: true },
          ...(data.sentimentLabel
            ? [{ name: "Sentiment", value: data.sentimentLabel, inline: true }]
            : []),
        ],
        footer: { text: "TellSafe" },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

/**
 * Send a webhook notification for new feedback.
 * Auto-detects Slack vs Discord by URL pattern.
 * Non-blocking — catches all errors silently.
 */
export async function sendWebhookNotification(
  webhookUrl: string,
  data: WebhookPayload
): Promise<boolean> {
  try {
    // Validate URL to prevent SSRF — only allow known webhook platforms
    try {
      const url = new URL(webhookUrl);
      const allowedHosts = ["hooks.slack.com", "discord.com", "discordapp.com"];
      const isAllowed = allowedHosts.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`));
      if (!isAllowed || url.protocol !== "https:") {
        console.warn("Webhook URL rejected (not an allowed host):", webhookUrl);
        return false;
      }
    } catch {
      console.warn("Invalid webhook URL:", webhookUrl);
      return false;
    }

    const platform = detectPlatform(webhookUrl);
    const payload =
      platform === "slack"
        ? buildSlackPayload(data)
        : platform === "discord"
        ? buildDiscordPayload(data)
        : buildSlackPayload(data); // default to Slack-style for unknown

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return res.ok;
  } catch (err) {
    console.error("Webhook notification failed (non-blocking):", err);
    return false;
  }
}

/**
 * Send a test webhook message.
 */
export async function sendTestWebhook(webhookUrl: string, orgName: string): Promise<boolean> {
  return sendWebhookNotification(webhookUrl, {
    orgName,
    feedbackType: "anonymous",
    category: "Test",
    previewText: "This is a test notification from TellSafe. If you see this, your webhook is working correctly!",
    sentimentLabel: "positive",
    dashboardUrl: process.env.NEXT_PUBLIC_APP_URL || "https://tellsafe.vercel.app",
  });
}
