import { z } from "zod";

export type SocialProfilePlatform = z.infer<typeof zSocialProfilePlatform>;
export const zSocialProfilePlatform = z.enum(["twitter", "instagram", "twitch", "youtube"]);

export type SocialProfilePlatformWithAuth = z.infer<typeof zSocialProfilePlatformWithAuth>;
export const zSocialProfilePlatformWithAuth = z.enum(["twitch", "youtube"]);

export type VerifySocialProfilePayload = z.infer<typeof zVerifySocialProfilePayload>;
export const zVerifySocialProfilePayload = z.object({
  link: z.string(),
});

export const zSocialPlatformState = z.object({
  username: z.string(),
  link: z.string(),
  type: zSocialProfilePlatformWithAuth,
});
