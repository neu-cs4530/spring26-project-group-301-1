import { type SocialProfileLinkType, zSocialProfileLinkType } from "@gamenite/shared";
import { checkAuth } from "./auth.service.ts";
import type { UserAuth } from "@gamenite/shared";

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID ?? "";
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET ?? "";
const TWITCH_REDIRECT_URI =
  process.env.TWITCH_REDIRECT_URI ?? "http://localhost:8000/api/oauth/twitch/callback";

export function getTwitchAuthUrl(username: string, link: string): string {
  const state = Buffer.from(JSON.stringify({ username, link })).toString("base64");
  const query = `client_id=${TWITCH_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    TWITCH_REDIRECT_URI
  )}&response_type=code&scope=user%3Aread%3Aemail&state=${encodeURIComponent(state)}`;
  return `https://id.twitch.tv/oauth2/authorize?${query}`;
}

/**
 * Exchanges a Twitch authorization code for an access token.
 * @param code - The authorization code received from Twitch's callback.
 * @returns The access token string.
 * @throws if the token exchange fails.
 */
export async function exchangeTwitchCode(code: string): Promise<string> {
  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    body: `client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&code=${code}&grant_type=authorization_code&redirect_uri=${encodeURIComponent(
      TWITCH_REDIRECT_URI
    )}`,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  if (!response.ok) throw new Error(`Twitch token exchange failed: ${response.status}`);
  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

/**
 * Retrieves the Twitch login name for the authenticated user.
 * @param accessToken - A valid Twitch OAuth access token.
 * @returns The lowercase Twitch login name.
 * @throws if the API call fails or returns no user.
 */
export async function getTwitchLogin(accessToken: string): Promise<string> {
  const response = await fetch("https://api.twitch.tv/helix/users", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Client-Id": TWITCH_CLIENT_ID,
    },
  });
  if (!response.ok) throw new Error(`Twitch users API failed: ${response.status}`);
  const data = (await response.json()) as { data: { login: string }[] };
  if (!data.data[0]) throw new Error("No Twitch user returned");
  return data.data[0].login.toLowerCase();
}

/**
 * Validates credentials and returns the OAuth authorization URL for the given platform.
 * @param platform - The social platform to authenticate with.
 * @param auth - The user's credentials to verify.
 * @param link - The social profile URL the user wants to verify ownership of.
 * @returns The OAuth URL to redirect the user to, or an error message.
 */
export async function initOAuthFlow(
  platform: SocialProfileLinkType,
  auth: UserAuth,
  link: string
): Promise<{ url: string } | { error: string }> {
  const parsedPlatform = zSocialProfileLinkType.safeParse(platform);
  if (!parsedPlatform.success) return { error: "Unsupported platform" };

  const user = await checkAuth(auth);
  if (!user) return { error: "Invalid credentials" };

  if (platform === "twitch") {
    return { url: getTwitchAuthUrl(user.username, link) };
  }

  return { error: "Unsupported platform" };
}
