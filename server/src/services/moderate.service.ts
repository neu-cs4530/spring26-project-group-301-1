import { Anthropic } from "@anthropic-ai/sdk";
import "dotenv/config";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a content moderation assistant. Your job is to classify chat messages as SAFE or UNSAFE.

Unsafe messages include:
- Hate speech or discrimination
- Threats or violent content
- Harassment or bullying
- Explicit/adult content
- Spam or scam attempts
- Sharing of personal/sensitive information
- Profanity or offensive language, even if in a nice context

Respond ONLY with a JSON object in this exact format, no markdown, no extra text:
{
  "label": "SAFE" or "UNSAFE",
  "categories": ["list", "of", "triggered", "categories"] 
}

If the message is safe, categories should be an empty array.`;

/**
 * The interface that represents whether a message is safe or unsafe as well as why
 */
export interface ModerationResult {
  label: "SAFE" | "UNSAFE";
  categories: string[];
}

/**
 * Moderate a message based on the Anthropic API by parsing the response a model told
 * to mark a message as safe or unsafe and include categories of violation
 * @param message The message the model will evaluate
 * @returns a ModerationResult, which includes the safe or unsafe label and the categories
 * it violates if unsafe
 */
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
  // The message returned by Claude has '''json at the beginning and ''' at the end that need
  // to be removed to properly parse the content returned by the model
  const clean = block.text.replace(/```json|```/g, "").trim();
  try {
    const result = JSON.parse(clean) as ModerationResult;
    return result;
  } catch (e) {
    throw new Error(`Failed to parse moderation response: ${clean}`);
  }
}
