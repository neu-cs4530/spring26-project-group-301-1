import {
  withAuth,
  zVerifySocialProfilePayload,
  zSocialPlatformState,
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
  platform: SocialProfilePlatform,
  link: string,
  login: string,
): boolean {
  if (platform === "twitch") {
    const linkedUsername = link.match(/twitch\.tv\/([^/?#]+)/i)?.[1]?.toLowerCase();
    return linkedUsername !== undefined && login === linkedUsername;
  } else if (platform === "youtube") {
    const username = link.match(/(?:youtube\.com\/)(@[\w.]+|(?:c|user|channel)\/[\w.-]+)/);
    return username?.[1] !== null && username?.[1] === login;
  }

  return false; // unsupported platform for verification
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
  const { code, state, error } = req.query as { code?: string; state?: string; error?: string };

  if (error) {
    res.redirect(`${CLIENT_URL}/?oauth_error=${encodeURIComponent(error)}`);
    return;
  }
  if (!code || !state) {
    res.status(400).send({ error: "Invalid callback request" });
    return;
  }

  // this is the 'state' maintained
  let decoded: string;
  try {
    decoded = Buffer.from(state, "base64").toString("utf8");
  } catch (error) {
    res.status(400).send({ error: "Error decoding OAuth state" });
    return;
  }
  const result = zSocialPlatformState.safeParse(JSON.parse(decoded));
  if (result.error) {
    res.status(400).send({ error: "Invalid state parameter" });
    return;
  }

  const username = result.data.username;
  const link = result.data.link;
  const type = result.data.type;

  const user = await getUserByUsername(username);
  if (!user) {
    res.status(400).send({ error: "User not found" });
    return;
  }

  const accessToken = await exchangeCode(code, type);
  const login = await getLogin(accessToken, type);

  if (validateAuthByPlatform(type, link, login) === false) {
    res.redirect(
      `${CLIENT_URL}/?oauth_error=${encodeURIComponent("Account does not match linked profile")}`,
    );
    return;
  }

  const record = await UserRepo.get(user.userId);
  record.profileLinks = record.profileLinks.map((p) =>
    p.link === link && p.type === type ? { ...p, verified: true } : p,
  );
  await UserRepo.set(user.userId, record);

  res.redirect(`${CLIENT_URL}/?oauth_success=${encodeURIComponent("Account verified")}`);
};
