import { z } from "zod";
import {
  withAuth,
  zSendFriendRequestPayload,
  zResolveFriendRequestPayload,
  zRemoveFriendPayload,
  zUserAuth,
} from "@gamenite/shared";
import { type RestAPI } from "../types.ts";
import { checkAuth } from "../services/auth.service.ts";
import {
  sendFriendRequest,
  resolveRequest,
  removeFriend,
  getFriends,
  getPendingRequests,
} from "../services/friends.service.ts";
import { type FriendInfo, type FriendRequestInfo } from "@gamenite/shared";

/**
 * GET /api/friends/:username
 * Returns the friends list for a user.
 */
export const getByUsername: RestAPI<FriendInfo[], { username: string }> = async (req, res) => {
  res.send(await getFriends(req.params.username));
};

/**
 * GET /api/friends/:username/requests
 * Returns pending inbound friend requests for a user.
 */
export const getRequests: RestAPI<FriendRequestInfo[], { username: string }> = async (req, res) => {
  const body = z.object({ auth: zUserAuth }).safeParse(req.body);
  if (body.error) {
    res.status(400).send({ error: "Poorly-formed request" });
    return;
  }

  const caller = await checkAuth(body.data.auth);
  if (!caller || caller.username !== req.params.username) {
    res.status(403).send({ error: "Invalid credentials" });
    return;
  }

  res.send(await getPendingRequests(req.params.username));
};

/**
 * POST /api/friends/request
 */
export const postRequest: RestAPI<{ message: string }> = async (req, res) => {
  const body = withAuth(zSendFriendRequestPayload).safeParse(req.body);
  if (body.error) {
    res.status(400).send({ error: "Poorly-formed request" });
    return;
  }

  const caller = await checkAuth(body.data.auth);
  if (!caller) {
    res.status(403).send({ error: "Invalid credentials" });
    return;
  }

  try {
    await sendFriendRequest(caller.username, body.data.payload.toUsername);
    res.send({ message: "Friend request sent" });
  } catch (error) {
    res.status(409).send({ error: "Failed to send friend request" });
  }
};

/**
 * POST /api/friends/request/:requestId/resolve
 */
export const postResolve: RestAPI<{ message: string }, { requestId: string }> = async (
  req,
  res,
) => {
  const body = withAuth(zResolveFriendRequestPayload).safeParse(req.body);
  if (body.error) {
    res.status(400).send({ error: "Poorly-formed request" });
    return;
  }

  const caller = await checkAuth(body.data.auth);
  if (!caller) {
    res.status(403).send({ error: "Invalid credentials" });
    return;
  }

  try {
    await resolveRequest(req.params.requestId, caller.username, body.data.payload.action);
    const past = body.data.payload.action === "accept" ? "accepted" : "declined";
    res.send({ message: `Request ${past}` });
  } catch (error) {
    res.status(400).send({ error: "Failed to resolve friend request" });
  }
};

/**
 * POST /api/friends/remove
 */
export const postRemove: RestAPI<{ message: string }> = async (req, res) => {
  const body = withAuth(zRemoveFriendPayload).safeParse(req.body);
  if (body.error) {
    res.status(400).send({ error: "Poorly-formed request" });
    return;
  }

  const caller = await checkAuth(body.data.auth);
  if (!caller) {
    res.status(403).send({ error: "Invalid credentials" });
    return;
  }

  try {
    await removeFriend(caller.username, body.data.payload.friendUsername);
    res.send({ message: "Friend removed" });
  } catch (error) {
    res.status(400).send({ error: "Failed to remove friend" });
  }
};
