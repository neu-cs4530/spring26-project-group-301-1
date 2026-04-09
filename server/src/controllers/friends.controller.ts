import { z } from "zod";
import {
  withAuth,
  zSendFriendRequestPayload,
  zResolveFriendRequestPayload,
  zRemoveFriendPayload,
  zUserAuth,
} from "@gamenite/shared";
import { type RestAPI, type GameServer } from "../types.ts";
import { checkAuth } from "../services/auth.service.ts";
import {
  sendFriendRequest,
  resolveRequest,
  removeFriend,
  getFriends,
  getPendingRequests,
  getFriendStatus,
} from "../services/friends.service.ts";
import { markDmReadForBothIfExists } from "../services/dm.service.ts";
import { type FriendInfo, type FriendRequestInfo } from "@gamenite/shared";

/**
 * GET /api/friends/:username
 * Returns the friends list for a user.
 */
export const getByUsername: RestAPI<FriendInfo[], { username: string }> = async (req, res) => {
  res.send(await getFriends(req.params.username));
};

/**
 * POST /api/friends/:username/requests
 * Returns pending inbound friend requests for a user.
 */
export const postRequests: RestAPI<FriendRequestInfo[], { username: string }> = async (
  req,
  res,
) => {
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
  const body = withAuth(zResolveFriendRequestPayload.pick({ action: true })).safeParse(req.body);
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
export const postRemove =
  (io: GameServer): RestAPI<{ message: string }> =>
  async (req, res) => {
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
      const friendUsername = body.data.payload.friendUsername;
      await removeFriend(caller.username, friendUsername);
      await markDmReadForBothIfExists(caller.username, friendUsername);
      io.to(`inbox:${caller.username}`).emit("friendRemoved", { otherUsername: friendUsername });
      io.to(`inbox:${friendUsername}`).emit("friendRemoved", { otherUsername: caller.username });
      res.send({ message: "Friend removed" });
    } catch (error) {
      res.status(400).send({ error: "Failed to remove friend" });
    }
  };

/**
 * POST /api/friends/:username/status
 * Returns the friendship status between the caller and the given user.
 */
export const getStatus: RestAPI<{ status: string }, { username: string }> = async (req, res) => {
  const body = z.object({ auth: zUserAuth }).safeParse(req.body);
  if (body.error) {
    res.status(400).send({ error: "Poorly-formed request" });
    return;
  }

  const caller = await checkAuth(body.data.auth);
  if (!caller) {
    res.status(403).send({ error: "Invalid credentials" });
    return;
  }

  const status = await getFriendStatus(caller.username, req.params.username);
  res.send({ status });
};
