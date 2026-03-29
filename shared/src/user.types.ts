import { z } from "zod";

/**
 * Supported type of social profile link.
 */
export type SocialProfileLinkType =
  | "twitter"
  | "instagram"
  | "facebook"
  | "patreon"
  | "twitch"
  | "youtube";

/**
 * Represents a link to a user's social media profile.
 * - `link`: the URL to the user's profile
 * - `type`: the social media platform the link goes to
 * - `verified`: whether or not the user has verified the link is their own profile
 */
export interface SocialProfileLink {
  link: string;
  type: SocialProfileLinkType;
  verified: boolean;
}

/**
 * Represents a "safe" user object that excludes sensitive information like
 * the password, suitable for exposing to clients,
 * - `username`: unique username of the user
 * - `display`: A display name
 * - `createdAt`: when this when the user registered.
 * - `hideUsername`: privacy preference of user, will hide username from profile page.
 */
export interface SafeUserInfo {
  username: string;
  display: string;
  createdAt: Date;
  customBackground?: string;
  hideUsername: boolean;
  privateProfile: boolean;
  profileLinks: SocialProfileLink[];
}

/*** TYPES USED IN THE USER API ***/

export const zSocialProfileLinkType = z.enum([
  "twitter",
  "instagram",
  "facebook",
  "patreon",
  "twitch",
  "youtube",
]);

export type SocialProfileReqType = "add" | "delete";

export const zSocialProfileReqType = z.enum(["add", "delete"]);

/**
 * Represents allowed updates to a user.
 */
export type UserUpdateRequest = z.infer<typeof zUserUpdateRequest>;
export const zUserUpdateRequest = z.object({
  password: z.string().optional(),
  display: z.string().optional(),
  customBackground: z.string().optional(),
  hideUsername: z.boolean().optional(),
  privateProfile: z.boolean().optional(),
  profileLink: z.string().optional(),
  profileLinkType: zSocialProfileLinkType.optional(),
  profileLinkReqType: zSocialProfileReqType.optional(),
});
