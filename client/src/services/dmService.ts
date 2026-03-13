import type { DirectMessageInfo, ErrorMsg, UserAuth } from "@gamenite/shared";
import type { APIResponse } from "../util/types";
import { api, exceptionToErrorMsg } from "./api.ts";

const DM_API_URL = `/api/dms`;

export const getDirectMessages = async (username: string): APIResponse<DirectMessageInfo[]> => {
  try {
    const res = await api.get<DirectMessageInfo[] | ErrorMsg>(`${DM_API_URL}/${username}`);
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

export const openDirectMessage = async (
  auth: UserAuth,
  username: string,
): APIResponse<DirectMessageInfo> => {
  try {
    const res = await api.post<DirectMessageInfo | ErrorMsg>(`${DM_API_URL}/${username}`, {
      auth,
    });
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

export const markDirectMessageAsRead = async (
  auth: UserAuth,
  dmId: string,
): APIResponse<{ message: string }> => {
  try {
    const res = await api.post<{ message: string } | ErrorMsg>(`${DM_API_URL}/${dmId}/read`, {
      auth,
    });
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};
