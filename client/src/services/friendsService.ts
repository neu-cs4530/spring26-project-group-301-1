import type { APIResponse } from "../util/types.ts";
import { api, exceptionToErrorMsg } from "./api.ts";
import type { ErrorMsg, FriendInfo, FriendRequestInfo, UserAuth } from "@gamenite/shared";

const FRIENDS_API_URL = `/api/friends`;

export const getFriends = async (username: string): APIResponse<FriendInfo[]> => {
  try {
    const res = await api.get<FriendInfo[] | ErrorMsg>(`${FRIENDS_API_URL}/${username}`);
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

export const getPendingRequests = async (auth: UserAuth): APIResponse<FriendRequestInfo[]> => {
  try {
    const res = await api.post<FriendRequestInfo[] | ErrorMsg>(
      `${FRIENDS_API_URL}/${auth.username}/requests`,
      { auth },
    );
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

export const sendFriendRequest = async (
  auth: UserAuth,
  toUsername: string,
): APIResponse<{ message: string }> => {
  try {
    const res = await api.post<{ message: string } | ErrorMsg>(`${FRIENDS_API_URL}/request`, {
      auth,
      payload: { toUsername },
    });
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

export const resolveRequest = async (
  auth: UserAuth,
  requestId: string,
  action: "accept" | "decline",
): APIResponse<{ message: string }> => {
  try {
    const res = await api.post<{ message: string } | ErrorMsg>(
      `${FRIENDS_API_URL}/request/${requestId}/resolve`,
      { auth, payload: { action } },
    );
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

export const removeFriend = async (
  auth: UserAuth,
  friendUsername: string,
): APIResponse<{ message: string }> => {
  try {
    const res = await api.post<{ message: string } | ErrorMsg>(`${FRIENDS_API_URL}/remove`, {
      auth,
      payload: { friendUsername },
    });
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

export const getFriendStatus = async (
  auth: UserAuth,
  username: string,
): APIResponse<{ status: "friends" | "request-sent" | "request-received" | "not-friends" }> => {
  try {
    const res = await api.post<
      { status: "friends" | "request-sent" | "request-received" | "not-friends" } | ErrorMsg
    >(`${FRIENDS_API_URL}/${username}/status`, { auth });
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};
