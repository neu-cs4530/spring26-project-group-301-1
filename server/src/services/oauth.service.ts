import {
  type SocialProfilePlatformWithAuth,
  zSocialProfilePlatformWithAuth,
} from "@gamenite/shared";

const SITE_URL = process.env.RENDER_EXTERNAL_URL ?? "http://localhost:8000";
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID ?? "";
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET ?? "";
const TWITCH_REDIRECT_URI = SITE_URL + "/api/oauth/twitch/callback";

const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const YOUTUBE_REDIRECT_URI = SITE_URL + "/api/oauth/youtube/callback";

type PlatformFuncs = {
  getAuthUrl: (username: string, link: string, type: SocialProfilePlatformWithAuth) => string;
  getLogin: (accessToken: string) => Promise<string>;
  exchangeCode: (code: string) => Promise<string>;
};

/**
 * Gets the OAuth URl to redirect to during the OAuth process for Twitch. Encodes the username, link, and
 * type in the 'state' returned from the redirected-to site for synchronization.
 * @param username the username of the user
 * @param link the link provided by the user to their account
 * @param type the social media platform type
 * @returns the URL
 */
export function getTwitchAuthUrl(
  username: string,
  link: string,
  type: SocialProfilePlatformWithAuth,
): string {
  const state = Buffer.from(
    JSON.stringify({ username: username, link: link, type: type }),
  ).toString("base64");
  const query = `client_id=${TWITCH_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    TWITCH_REDIRECT_URI,
  )}&response_type=code&scope=user%3Aread%3Aemail&state=${encodeURIComponent(state)}`;
  return `https://id.twitch.tv/oauth2/authorize?${query}`;
}

/**
 * Gets the OAuth URl to redirect to during the OAuth process for YouTube. Encodes the username, link, and
 * type in the 'state' returned from the redirected-to site for synchronization.
 * @param username the username of the user
 * @param link the link provided by the user to their account
 * @param type the social media platform type
 * @returns the URL
 */
export function getYoutubeAuthUrl(
  username: string,
  link: string,
  type: SocialProfilePlatformWithAuth,
): string {
  // https://www.googleapis.com/auth/youtube
  const state = Buffer.from(
    JSON.stringify({ username: username, link: link, type: type }),
  ).toString("base64");
  const query = `client_id=${YOUTUBE_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    YOUTUBE_REDIRECT_URI,
  )}&response_type=code&&scope=${encodeURIComponent(
    "https://www.googleapis.com/auth/youtube.readonly",
  )} &state=${encodeURIComponent(state)}`;
  return `https://accounts.google.com/o/oauth2/v2/auth?${query}`;
}

/**
 * Exchanges a Twitch authorization code for an access token.
 * @param code the authorization code received from Twitch's callback.
 * @returns the access token string.
 * @throws if the token exchange fails.
 */
export async function exchangeTwitchCode(code: string): Promise<string> {
  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    body: `client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&code=${code}&grant_type=authorization_code&redirect_uri=${encodeURIComponent(
      TWITCH_REDIRECT_URI,
    )}`,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  if (!response.ok) throw new Error(`Twitch token exchange failed: ${response.status}`);
  // Must be named 'access_token' to be compatible with API
  const data = (await response.json()) as {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    access_token: string;
  };
  return data.access_token;
}

/**
 * Exchanges the OAuth code retured after the initial redirect for an access token.
 * @param code the authorization code received from the YouTube callback.
 * @returns the access token, provided the user properly authenticated. This allows us to access information
 * about the user's YouTube account through their APIs.
 * @throws if the exchange fails.
 */
export async function exchangeYoutubeCode(code: string): Promise<string> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: `client_id=${YOUTUBE_CLIENT_ID}&client_secret=${YOUTUBE_CLIENT_SECRET}&code=${code}&grant_type=authorization_code&redirect_uri=${encodeURIComponent(
      YOUTUBE_REDIRECT_URI,
    )}`,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  if (!response.ok) throw new Error(`Youtube token exchange failed: ${response.status}`);
  // Must be named 'access_token' to be compatible with API
  const data = (await response.json()) as {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    access_token: string;
  };
  return data.access_token;
}

/**
 * Retrieves the Twitch login name for the authenticated user.
 * @param accessToken a valid Twitch OAuth access token.
 * @returns the lowercase Twitch login name.
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

/**
 * Retreives the YouTube login name for the authenticated user. This is used to validate that the user
 * provided the correct link during the initial social media profile upload process.
 * @param accessToken a valid YouTube OAuth access token.
 * @returns the lowercase youtube username.
 * @throws if the API call fails or returns no user.
 */
export async function getYoutubeLogin(accessToken: string): Promise<string> {
  const response = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
    {
      headers: {
        ["Authorization"]: `Bearer ${accessToken}`,
        "Client-Id": YOUTUBE_CLIENT_ID,
      },
    },
  );
  if (!response.ok) throw new Error(`Youtube users API failed: ${response.status}`);
  const data = (await response.json()) as { items: { snippet: { customUrl: string } }[] };
  if (!data.items?.[0]) throw new Error("No Youtube user returned");
  return data.items[0].snippet.customUrl.toLowerCase();
}

const platformToFunc: Record<SocialProfilePlatformWithAuth, PlatformFuncs> = {
  twitch: {
    getAuthUrl: getTwitchAuthUrl,
    getLogin: getTwitchLogin,
    exchangeCode: exchangeTwitchCode,
  },
  youtube: {
    getAuthUrl: getYoutubeAuthUrl,
    getLogin: getYoutubeLogin,
    exchangeCode: exchangeYoutubeCode,
  },
};

/**
 * Gets the login for a given Social Media platform for a user.
 * @param accessToken the access token returned from the OAuth process for the platform.
 * @param platform the platform to get a login for.
 * @returns the username of the user.
 */
export async function getLogin(
  accessToken: string,
  platform: SocialProfilePlatformWithAuth,
): Promise<string> {
  const funcs = platformToFunc[platform];
  if (!funcs) throw new Error("Unsupported platform for verification!");
  return funcs.getLogin(accessToken);
}

/**
 * Exchanges a valid code returned from the OAuth login process for an access token.
 * @param code the code from the user logging into the given platform.
 * @param platform the social media platform.
 * @returns the access token for the platform.
 */
export async function exchangeCode(
  code: string,
  platform: SocialProfilePlatformWithAuth,
): Promise<string> {
  const funcs = platformToFunc[platform];
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
export function initOAuthFlow(
  platform: SocialProfilePlatformWithAuth,
  username: string,
  link: string,
): { url: string } | { error: string } {
  const parsedPlatform = zSocialProfilePlatformWithAuth.safeParse(platform);
  if (!parsedPlatform.success) return { error: "Unsupported platform" };

  const funcs = platformToFunc[platform];
  if (!funcs) return { error: "Unsupported platform" };

  return { url: funcs.getAuthUrl(username, link, platform) };
}
