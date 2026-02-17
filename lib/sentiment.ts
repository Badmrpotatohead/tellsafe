// ============================================================
// TellSafe — Sentiment Analysis (Claude API)
// ============================================================
// Analyzes incoming feedback for sentiment and urgency.
// Pro plan feature — helps admins triage feedback.

import Anthropic from "@anthropic-ai/sdk";
import type { SentimentResult } from "../types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

/**
 * Analyze feedback text for sentiment and urgency.
 * Returns a score (-1 to 1), label, and confidence.
 *
 * Labels:
 * - "urgent"   — safety concerns, harassment, discrimination, immediate issues
 * - "negative" — complaints, frustration, dissatisfaction
 * - "neutral"  — suggestions, questions, general observations
 * - "positive" — praise, thanks, encouragement
 */
export async function analyzeSentiment(
  feedbackText: string,
  category: string
): Promise<SentimentResult> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `Analyze the sentiment of this community feedback submission. The feedback is categorized under "${category}".

Feedback text:
"""
${feedbackText}
"""

Respond with ONLY a JSON object (no markdown, no backticks):
{
  "score": <number from -1.0 (very negative) to 1.0 (very positive)>,
  "label": <one of "urgent", "negative", "neutral", "positive">,
  "confidence": <number from 0.0 to 1.0>
}

Classification guide:
- "urgent": safety concerns, harassment reports, discrimination, threats, anything requiring immediate attention
- "negative": complaints, frustration, dissatisfaction, problems
- "neutral": suggestions, questions, general observations, mixed feedback
- "positive": praise, thanks, encouragement, appreciation

Bias toward "urgent" for anything related to personal safety, unwanted physical contact, harassment, or discriminatory behavior, even if the language is mild.`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const cleaned = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(cleaned) as SentimentResult;

    // Validate ranges
    result.score = Math.max(-1, Math.min(1, result.score));
    result.confidence = Math.max(0, Math.min(1, result.confidence));

    if (!["urgent", "negative", "neutral", "positive"].includes(result.label)) {
      result.label = "neutral";
    }

    return result;
  } catch (error) {
    console.error("Sentiment analysis failed:", error);
    // Fail open — don't block feedback submission
    return {
      score: 0,
      label: "neutral",
      confidence: 0,
    };
  }
}
