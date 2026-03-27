import { Anthropic } from "@anthropic-ai/sdk";
import "dotenv/config";

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_TOKEN,
});

const SYSTEM_PROMPT = `You are a content moderation assistant. Your job is to classify chat messages as SAFE or UNSAFE.

Unsafe messages include:
- Hate speech or discrimination
- Threats or violent content
- Harassment or bullying
- Explicit/adult content
- Spam or scam attempts
- Sharing of personal/sensitive information
- Profanity or offensive language

Respond ONLY with a JSON object in this exact format, no markdown, no extra text:
{
  "label": "SAFE" or "UNSAFE",
  "categories": ["list", "of", "triggered", "categories"] 
}

If the message is safe, categories should be an empty array.`;

export interface ModerationResult {
  label: "SAFE" | "UNSAFE";
  categories: string[];
}

export async function moderateMessage(message: string) {
  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    // This cannot be camel case as it needs to be names with an
    // underscore to work with the API
    // eslint-disable-next-line @typescript-eslint/naming-convention
    max_tokens: 1000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: `Classify this chat message: "${message}"` }],
  });

  // The response will be a content array, the first element will
  // contain the text response of Claude, with the label and categories
  const block = res.content[0];
  if (block.type !== "text") throw new Error("Unexpected non-text response from Claude");
  const clean = block.text.replace(/```json|```/g, "").trim();
  try {
    const result = JSON.parse(clean) as ModerationResult;
    return result;
  } catch (e) {
    throw new Error(`Failed to parse moderation response: ${clean}`);
  }
}
