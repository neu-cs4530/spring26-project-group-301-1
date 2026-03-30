import {
  withAuth,
  zVerifySocialProfilePayload,
  type SocialProfilePlatform,
} from "@gamenite/shared";
import { checkAuth, getUserByUsername } from "../services/auth.service.ts";
import { type RestAPI } from "../types.ts";
import { initOAuthFlow, exchangeCode, getLogin } from "../services/oauth.service.ts";
import { UserRepo } from "../repository.ts";

const CLIENT_URL = "http://localhost:4530";

// TODO: make service util function so this is not needed here?
function validateAuthByPlatform(
  platform: SocialProfilePlatform,
  link: string,
  login: string
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
 * Initiates the OAuth flow for the given platform.
 * Validates credentials and returns the platform's auth URL.
 */
export const getAuthByPlatform: RestAPI<{ url: string }, { platform: string }> = async (
  req,
  res
) => {
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
  res.send(
    await initOAuthFlow(
      req.params.platform as SocialProfilePlatform,
      user.username,
      body.data.payload.link
    )
  );
};

/**
 * Handles the OAuth callback from the platform.
 * Verifies the authenticated account matches the linked profile URL, then marks it verified.
 */
export const getCallbackByPlatform: RestAPI<never, { platform: SocialProfilePlatform }> = async (
  req,
  res
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
  let username: string;
  let link: string;
  let type: SocialProfilePlatform;
  try {
    ({ username, link, type } = JSON.parse(Buffer.from(state, "base64").toString("utf8")));
  } catch {
    res.status(400).send({ error: "Invalid state parameter" });
    return;
  }

  const user = await getUserByUsername(username);
  if (!user) {
    res.status(400).send({ error: "User not found" });
    return;
  }

  const accessToken = await exchangeCode(code, type);
  const login = await getLogin(accessToken, type);

  if (validateAuthByPlatform(type, link, login) === false) {
    res.redirect(
      `${CLIENT_URL}/?oauth_error=${encodeURIComponent("Account does not match linked profile")}`
    );
    return;
  }

  const record = await UserRepo.get(user.userId);
  record.profileLinks = record.profileLinks.map((p) =>
    p.link === link && p.type === type ? { ...p, verified: true } : p
  );
  await UserRepo.set(user.userId, record);

  res.redirect(`${CLIENT_URL}/?oauth_success=${encodeURIComponent("Account verified")}`);
};
