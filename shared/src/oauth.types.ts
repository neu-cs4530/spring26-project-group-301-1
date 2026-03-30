import { z } from "zod";

export type SocialProfileLinkType = z.infer<typeof zSocialProfileLinkType>;
export const zSocialProfileLinkType = z.enum(["Twitter", "Instagram", "Twitch", "YouTube"]);

export type VerifySocialProfilePayload = z.infer<typeof zVerifySocialProfilePayload>;
export const zVerifySocialProfilePayload = z.object({
  link: z.string(),
});
