import { type SocialProfileLinkType, zSocialProfileLinkType } from "@gamenite/shared";

// https://developers.facebook.com/docs/instagram-platform/reference/oauth-authorize/
// https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID ?? "";
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET ?? "";
const TWITCH_REDIRECT_URI = "http://localhost:8000/api/oauth/twitch/callback";

const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const YOUTUBE_REDIRECT_URI = "http://localhost:8000/api/oauth/youtube/callback";

export function getTwitchAuthUrl(
  username: string,
  link: string,
  type: SocialProfileLinkType
): string {
  const state = Buffer.from(JSON.stringify({ username, link, type })).toString("base64");
  const query = `client_id=${TWITCH_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    TWITCH_REDIRECT_URI
  )}&response_type=code&scope=user%3Aread%3Aemail&state=${encodeURIComponent(state)}`;
  return `https://id.twitch.tv/oauth2/authorize?${query}`;
}

export function getYoutubeAuthUrl(
  username: string,
  link: string,
  type: SocialProfileLinkType
): string {
  // https://www.googleapis.com/auth/youtube
  const state = Buffer.from(JSON.stringify({ username, link, type })).toString("base64");
  const query = `client_id=${YOUTUBE_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    YOUTUBE_REDIRECT_URI
  )}&response_type=code&&scope=${encodeURIComponent(
    "https://www.googleapis.com/auth/youtube.readonly"
  )} &state=${encodeURIComponent(state)}`;
  return `https://accounts.google.com/o/oauth2/v2/auth?${query}`;
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
  return data.accessToken;
}

export async function exchangeYoutubeCode(code: string): Promise<string> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: `client_id=${YOUTUBE_CLIENT_ID}&client_secret=${YOUTUBE_CLIENT_SECRET}&code=${code}&grant_type=authorization_code&redirect_uri=${encodeURIComponent(
      YOUTUBE_REDIRECT_URI
    )}`,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  if (!response.ok) throw new Error(`Youtube token exchange failed: ${response.status}`);
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
      ["Authorization"]: `Bearer ${accessToken}`,
      "Client-Id": TWITCH_CLIENT_ID,
    },
  });
  if (!response.ok) throw new Error(`Twitch users API failed: ${response.status}`);
  const data = (await response.json()) as { data: { login: string }[] };
  if (!data.data[0]) throw new Error("No Twitch user returned");
  return data.data[0].login.toLowerCase();
}

export async function getYoutubeLogin(accessToken: string): Promise<string> {
  const response = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
    {
      headers: {
        ["Authorization"]: `Bearer ${accessToken}`,
        "Client-Id": YOUTUBE_CLIENT_ID,
      },
    }
  );
  if (!response.ok) throw new Error(`Youtube users API failed: ${response.status}`);
  const data = (await response.json()) as { items: { snippet: { customUrl: string } }[] };
  if (!data.items?.[0]) throw new Error("No Youtube user returned");
  return data.items[0].snippet.customUrl.toLowerCase();
}

type PlatformFuncs = {
  getAuthUrl: (username: string, link: string, type: SocialProfileLinkType) => string;
  getLogin: (accessToken: string) => Promise<string>;
  exchangeCode: (code: string) => Promise<string>;
};

// TODO: make supported type so that Partial is not needed
const PLATFORM_TO_FUNC: Partial<Record<SocialProfileLinkType, PlatformFuncs>> = {
  Twitch: {
    getAuthUrl: getTwitchAuthUrl,
    getLogin: getTwitchLogin,
    exchangeCode: exchangeTwitchCode,
  },
  YouTube: {
    getAuthUrl: getYoutubeAuthUrl,
    getLogin: getYoutubeLogin,
    exchangeCode: exchangeYoutubeCode,
  },
};

export async function getLogin(
  accessToken: string,
  platform: SocialProfileLinkType
): Promise<string> {
  const funcs = PLATFORM_TO_FUNC[platform];
  if (!funcs) throw new Error("Unsupported platform for verification!");
  return funcs.getLogin(accessToken);
}

export async function exchangeCode(code: string, platform: SocialProfileLinkType): Promise<string> {
  const funcs = PLATFORM_TO_FUNC[platform];
  if (!funcs) throw new Error("Unsupported platform for verification!");
  return funcs.exchangeCode(code);
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
  username: string,
  link: string
): Promise<{ url: string } | { error: string }> {
  // TODO:; no longer async, has no await!
  const parsedPlatform = zSocialProfileLinkType.safeParse(platform);
  if (!parsedPlatform.success) return { error: "Unsupported platform" };

  const funcs = PLATFORM_TO_FUNC[platform];
  if (!funcs) return { error: "Unsupported platform" };

  return { url: funcs.getAuthUrl(username, link, platform) };
}
