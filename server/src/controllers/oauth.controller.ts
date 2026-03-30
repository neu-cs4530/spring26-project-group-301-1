import { zVerifySocialProfilePayload, type SocialProfileLinkType } from "@gamenite/shared";
import { type RestAPI } from "../types.ts";

const CLIENT_URL = process.env.CLIENT_URL ?? "http://localhost:4530";
import { initOAuthFlow, exchangeTwitchCode, getTwitchLogin } from "../services/oauth.service.ts";
import { getUserByUsername } from "../services/auth.service.ts";
import { UserRepo } from "../repository.ts";

/**
 * Initiates the OAuth flow for the given platform.
 * Validates credentials and returns the platform's auth URL.
 */
export const getAuthByPlatform: RestAPI<{ url: string }, { platform: string }> = async (
  req,
  res
) => {
  const body = zVerifySocialProfilePayload.safeParse(req.body);
  if (!body.success) {
    res.status(400).send({ error: "Poorly-formed request" });
    return;
  }
  res.send(await initOAuthFlow(
    req.params.platform as SocialProfileLinkType,
    { username: body.data.username, password: body.data.password },
    body.data.link,
  ));
};

/**
 * Handles the OAuth callback from the platform.
 * Verifies the authenticated account matches the linked profile URL, then marks it verified.
 */
export const getCallbackByPlatform: RestAPI<never, { platform: string }> = async (req, res) => {
  const { code, state, error } = req.query as { code?: string; state?: string; error?: string };

  if (error) {
    res.redirect(`${CLIENT_URL}/?oauth_error=${encodeURIComponent(error)}`);
    return;
  }
  if (!code || !state) {
    res.status(400).send({ error: "Invalid callback request" });
    return;
  }

  let username: string;
  let link: string;
  try {
    ({ username, link } = JSON.parse(Buffer.from(state, "base64").toString("utf8")));
  } catch {
    res.status(400).send({ error: "Invalid state parameter" });
    return;
  }

  const user = await getUserByUsername(username);
  if (!user) {
    res.status(400).send({ error: "User not found" });
    return;
  }

  const accessToken = await exchangeTwitchCode(code);
  const twitchLogin = await getTwitchLogin(accessToken);

  const linkedUsername = link.match(/twitch\.tv\/([^/?#]+)/i)?.[1]?.toLowerCase();
  if (!linkedUsername || twitchLogin !== linkedUsername) {
    res.redirect(
      `${CLIENT_URL}/?oauth_error=${encodeURIComponent("Twitch account does not match linked profile")}`
    );
    return;
  }

  const record = await UserRepo.get(user.userId);
  record.profileLinks = record.profileLinks.map((p) =>
    p.link === link && p.type === "twitch" ? { ...p, verified: true } : p
  );
  await UserRepo.set(user.userId, record);

  res.redirect(`${CLIENT_URL}/?oauth_success=${encodeURIComponent("Twitch account verified")}`);
};
