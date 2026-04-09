import { z } from "zod";

/** Represents a type of Social Media Platform accounts can be linked from */
export type SocialProfilePlatform = z.infer<typeof zSocialProfilePlatform>;
export const zSocialProfilePlatform = z.enum(["twitter", "instagram", "twitch", "youtube"]);

/** Represents a link-able Social Media Platform which also supports verification */
export type SocialProfilePlatformWithAuth = z.infer<typeof zSocialProfilePlatformWithAuth>;
export const zSocialProfilePlatformWithAuth = z.enum(["twitch", "youtube"]);

/** Payload for verification. Platform type is included in API endpoint url, so only need URL of account */
export type VerifySocialProfilePayload = z.infer<typeof zVerifySocialProfilePayload>;
export const zVerifySocialProfilePayload = z.object({
  link: z.string(),
});

/** Defines a 'state' used to match up OAuth verification requests with callbacks */
export const zSocialPlatformState = z.object({
  username: z.string(),
  link: z.string(),
  type: zSocialProfilePlatformWithAuth,
});

/** Sent by external API to callback endpoint */
export const zOauthCallbackQuery = z.object({
  code: z.string().optional(),
  state: z.string().optional(),
  error: z.string().optional(),
});
