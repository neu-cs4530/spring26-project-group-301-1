import {
  withAuth,
  zVerifySocialProfilePayload,
  zSocialPlatformState,
  zOauthCallbackQuery,
  type SocialProfilePlatform,
  type SocialProfilePlatformWithAuth,
} from "@gamenite/shared";
import { checkAuth, getUserByUsername } from "../services/auth.service.ts";
import { type RestAPI } from "../types.ts";
import { initOAuthFlow, exchangeCode, getLogin } from "../services/oauth.service.ts";
import { UserRepo } from "../repository.ts";

const CLIENT_URL = process.env.RENDER_EXTERNAL_URL ?? "http://localhost:4530";

/**
 * Helper function to validate user-provided credentials by platform
 * @param platform the platform to check validation
 * @param link the link provided by the user
 * @param login the login context returned by the OAuth flow
 * @returns true if valid, false if not
 */
function validateAuthByPlatform(
  platform: SocialProfilePlatformWithAuth,
  link: string,
  login: string,
): boolean {
  if (platform === "twitch") {
    const linkedUsername = link.match(/twitch\.tv\/([^/?#]+)/i)?.[1]?.toLowerCase();
    return linkedUsername !== undefined && login === linkedUsername;
  } else {
    const username = link
      .match(/(?:youtube\.com\/)(@[\w.]+|(?:c|user|channel)\/[\w.-]+)/)?.[1]
      ?.toLowerCase();
    return username?.[1] !== null && username === login;
  }
}

/**
 * Helper function to check for supported authentication platforms.
 * @param platform the social media platform
 * @returns the platform with auth if supported, otherwise null
 */
function convertSocialPlatformToSupported(
  platform: SocialProfilePlatform,
): SocialProfilePlatformWithAuth | null {
  if (platform === "twitch") {
    return "twitch";
  }
  if (platform === "youtube") {
    return "youtube";
  }
  return null;
}

/**
 * Initiates the OAuth flow for the given platform.
 * Validates credentials and returns the platform's auth URL.
 */
export const getAuthByPlatform: RestAPI<
  { url: string },
  { platform: SocialProfilePlatform }
> = async (req, res) => {
  const supportedPlatform = convertSocialPlatformToSupported(req.params.platform);
  if (supportedPlatform === null) {
    res.status(400).send({ error: "Unsupported platform for authentication" });
    return;
  }

  const body = withAuth(zVerifySocialProfilePayload).safeParse(req.body);
  if (!body.success) {
    res.status(400).send({ error: "Poorly-formed request" });
    return;
  }

  const user = await checkAuth(body.data.auth);
  if (user === null) {
    res.status(400).send({ error: "Invalid user request" });
    return;
  }
  res.send(initOAuthFlow(supportedPlatform, user.username, body.data.payload.link));
};

/**
 * Handles the OAuth callback from the platform.
 * Verifies the authenticated account matches the linked profile URL, then marks it verified.
 */
export const getCallbackByPlatform: RestAPI<never, { platform: SocialProfilePlatform }> = async (
  req,
  res,
) => {
  const callbackQuery = zOauthCallbackQuery.safeParse(req.query);
  // parse will never fail, because all fields are optional
  const code = callbackQuery.data?.code;
  const state = callbackQuery.data?.state;
  const error = callbackQuery.data?.error;
  if (error) {
    res.redirect(`${CLIENT_URL}/oauth?oauth_error=${encodeURIComponent(error)}`);
    return;
  }
  if (!code || !state) {
    res.redirect(
      `${CLIENT_URL}/oauth?oauth_error=${encodeURIComponent("Invalid callback request")}`,
    );
    return;
  }

  // this is the 'state' maintained between the initial POST request and the external
  // platform callback. This lets us verify that we are receiving the right access code for the
  // given user & linked account.
  const decoded: string = Buffer.from(state, "base64").toString("utf8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(decoded);
  } catch (error) {
    res.redirect(
      `${CLIENT_URL}/oauth?oauth_error=${encodeURIComponent("Error decoding OAuth state")}`,
    );
    return;
  }
  const result = zSocialPlatformState.safeParse(parsed);
  if (result.error) {
    res.redirect(
      `${CLIENT_URL}/oauth?oauth_error=${encodeURIComponent("Invalid state parameter")}`,
    );
    return;
  }

  const username = result.data.username;
  const link = result.data.link;
  const type = result.data.type;

  const user = await getUserByUsername(username);
  if (!user) {
    res.redirect(`${CLIENT_URL}/oauth?oauth_error=${encodeURIComponent("User not found")}`);
    return;
  }

  let accessToken: string;
  try {
    accessToken = await exchangeCode(code, type);
  } catch (error) {
    res.redirect(
      `${CLIENT_URL}/oauth?oauth_error=${encodeURIComponent(
        "Error exchanging OAuth token for code",
      )}`,
    );
    return;
  }

  let login: string;
  try {
    login = await getLogin(accessToken, type);
  } catch (error) {
    res.redirect(
      `${CLIENT_URL}/oauth?oauth_error=${encodeURIComponent("Error retrieving login information")}`,
    );
    return;
  }

  if (validateAuthByPlatform(type, link, login) === false) {
    res.redirect(
      `${CLIENT_URL}/oauth?oauth_error=${encodeURIComponent(
        "Account does not match linked profile",
      )}`,
    );
    return;
  }

  const record = await UserRepo.get(user.userId);
  if (record.profileLinks === undefined) {
    res.redirect(
      `${CLIENT_URL}/oauth?oauth_error=${encodeURIComponent(
        "User does not have any linked profiles to verify!",
      )}`,
    );
    return;
  }
  record.profileLinks = record.profileLinks.map((p) =>
    p.link === link && p.type === type ? { ...p, verified: true } : p,
  );
  await UserRepo.set(user.userId, record);

  res.redirect(
    `${CLIENT_URL}/oauth?oauth_success=${encodeURIComponent(
      "Account verified",
    )}&username=${encodeURIComponent(username)}`,
  );
};
