import type { ErrorMsg } from "@gamenite/shared";
import type { APIResponse } from "../util/types.ts";
import { api, exceptionToErrorMsg } from "./api.ts";

const OAUTH_API_URL = `/api/oauth`;

/**
 * Initiates the OAuth verification flow for a social profile link.
 * Returns the authorization URL to redirect the user to.
 */
export const initiateOAuth = async (
  platform: string,
  username: string,
  password: string,
  link: string,
): APIResponse<{ url: string }> => {
  try {
    const res = await api.post<{ url: string } | ErrorMsg>(
      `${OAUTH_API_URL}/${platform}/verify`,
      { username, password, link },
    );
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};
