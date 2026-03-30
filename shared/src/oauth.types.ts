import { z } from "zod";

export type SocialProfileLinkType = z.infer<typeof zSocialProfileLinkType>;
export const zSocialProfileLinkType = z.enum(["twitter", "instagram", "twitch", "youtube"]);

export type VerifySocialProfilePayload = z.infer<typeof zVerifySocialProfilePayload>;
export const zVerifySocialProfilePayload = z.object({
  link: z.string(),
  username: z.string(),
  password: z.string(),
});
