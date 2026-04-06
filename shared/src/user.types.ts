import { z } from "zod";
import { type SocialProfilePlatform, zSocialProfilePlatform } from "./oauth.types.ts";

/**
 * Represents a link to a user's social media profile.
 * - `link`: the URL to the user's profile
 * - `type`: the social media platform the link goes to
 * - `verified`: whether or not the user has verified the link is their own profile
 */
export interface SocialProfileLink {
  link: string;
  type: SocialProfilePlatform;
  verified: boolean;
}

export const zSocialProfileLink = z.object({
  link: z.string(),
  type: zSocialProfilePlatform,
  verified: z.boolean(),
});

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

/**
 * Represents a type of Social Media profile that can be linked to by a user.
 */
export type SocialProfileReqType = "add" | "delete" | "verify";
export const zSocialProfileReqType = z.enum(["add", "delete", "verify"]);

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
  profilesToAdd: z.array(zSocialProfileLink).optional(),
  profilesToDelete: z.array(zSocialProfileLink).optional(),
});
