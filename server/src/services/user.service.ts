import {
  type SafeUserInfo,
  type UserUpdateRequest,
  type SocialProfilePlatform,
} from "@gamenite/shared";
import { getUserByUsername, updateAuth } from "./auth.service.ts";
import { UserRepo } from "../repository.ts";
import { is } from "is-social";

const disallowedUsernames = new Set(["login", "signup", "list"]);

/**
 * Retrieves a single user from the database.
 *
 * @param userId - Valid user id.
 * @returns the found user object (without the password).
 */
export async function populateSafeUserInfo(userId: string): Promise<SafeUserInfo> {
  const record = await UserRepo.get(userId);
  return Promise.resolve({
    username: record.username,
    display: record.display,
    createdAt: new Date(record.createdAt),
    customBackground: record.customBackground,
    hideUsername: record.hideUsername,
    privateProfile: record.privateProfile,
    profileLinks: record.profileLinks,
  });
}

/**
 * Create and store a new user
 *
 * @param newUser - The user object to be saved, containing user details like username, password, etc.
 * @returns Resolves with the saved user object (without the password) or an error message.
 */
export async function createUser(
  username: string,
  password: string,
  createdAt: Date,
): Promise<SafeUserInfo | { error: string }> {
  if ((await getUserByUsername(username)) !== null) {
    return { error: "User already exists" };
  }
  if (disallowedUsernames.has(username)) {
    return { error: "That is not a permitted username" };
  }
  const id = await UserRepo.add({
    username,
    createdAt: createdAt.toISOString(),
    display: username,
    hideUsername: false,
    privateProfile: false,
    profileLinks: [],
  });
  await updateAuth(username, password, id);
  return Promise.resolve({
    username,
    createdAt,
    display: username,
    hideUsername: false,
    privateProfile: false,
    profileLinks: [],
  });
}

/**
 * Retrieves a list of usernames from the database
 *
 * @param usernames - A list of usernames
 * @returns the SafeUserInfo objects corresponding to those users
 * @throws if any of the usernames are not valid
 */
export async function getUsersByUsername(usernames: string[]): Promise<SafeUserInfo[]> {
  return Promise.all(
    usernames.map(async (username) => {
      const user = await getUserByUsername(username);
      if (user === null) {
        throw new Error(`No user ${username}`);
      }
      return populateSafeUserInfo(user.userId);
    }),
  );
}

/**
 * Returns the SafeUserInfo object corresponding to a given username
 * @param username a username
 * @returns user information for that username, if valid
 */
export async function safeUserFromUsername(username: string): Promise<SafeUserInfo> {
  const [user] = await getUsersByUsername([username]);
  return user;
}

/**
 * Helper function to verify provided URL is valid
 * @param link the URL to the social media account
 * @param type the type of social media account being linked
 * @returns
 */
function validateProfileURL(link: string, type: SocialProfilePlatform): boolean {
  if (type === "twitter") {
    // twitter requires also matching the 'x' domain
    return (
      is.twitter.profile(link) ||
      link.match(
        /^https?:\/\/(?:www\.)?(?:x)\.com\/(?!home|share|i\/flow|search|hashtag|explore)([a-zA-Z0-9_]{1,15})\/?$/,
      )?.[1] !== null
    );
  } else if (type === "instagram") {
    return is.instagram.url(link);
  } else if (type === "twitch") {
    return is.twitch.url(link);
  } else if (type === "youtube") {
    return is.youtube.url(link);
  }
  return false;
}

/**
 * Updates user information in the database
 *
 * @param username - A valid username for the user to update
 * @param updates - An object that defines the fields to be updated and their new values
 * @returns the updated user object (without the password)
 * @throws if the username does not exist in the database
 */
export async function updateUser(
  username: string,
  {
    display,
    password,
    customBackground,
    hideUsername,
    privateProfile,
    profilesToAdd,
    profilesToDelete,
  }: UserUpdateRequest,
): Promise<SafeUserInfo | { error: string }> {
  const user = await getUserByUsername(username);
  if (!user) throw new Error(`No user ${username}`);
  if (password !== undefined) await updateAuth(username, password, user.userId);
  const newUser = await UserRepo.get(user.userId);
  if (display !== undefined) newUser.display = display;
  if (customBackground !== undefined) newUser.customBackground = customBackground;
  if (hideUsername !== undefined) newUser.hideUsername = hideUsername;
  if (privateProfile !== undefined) newUser.privateProfile = privateProfile;

  if (profilesToAdd !== undefined) {
    for (const profile of profilesToAdd) {
      if (validateProfileURL(profile.link, profile.type) === false) {
        return { error: "Invalid URL for platform type!" };
      }
      if (newUser.profileLinks.filter((p) => p.type === profile.type).length > 0) {
        return { error: "Platform type is already linked-to!" };
      }
      newUser.profileLinks = [
        { link: profile.link, type: profile.type, verified: false },
        ...newUser.profileLinks,
      ];
    }
  }

  if (profilesToDelete !== undefined) {
    for (const profile of profilesToDelete) {
      newUser.profileLinks = newUser.profileLinks.filter((p) => {
        return !(p.link === profile.link && p.type === profile.type);
      });
    }
  }

  await UserRepo.set(user.userId, newUser);
  return populateSafeUserInfo(user.userId);
}
