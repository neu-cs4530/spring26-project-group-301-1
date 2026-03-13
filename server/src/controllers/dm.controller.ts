import { z } from "zod";
import { zUserAuth, withAuth } from "@gamenite/shared";
import { checkAuth, enforceAuth } from "../services/auth.service.ts";
import type { DirectMessageInfo } from "@gamenite/shared";
import type { RestAPI, SocketAPI } from "../types.ts";
import { logSocketError } from "./socket.controller.ts";
import {
  addMessageToDirectMessage,
  createDirectMessage,
  getDirectMessageInfo,
  getDirectMessagesForUser,
  getOtherDirectMessageUser,
} from "../services/dm.service.ts";
import { createMessage, deleteMessage } from "../services/message.service.ts";

/**
 * GET /api/dms/:username
 * Returns the direct messages for a user.
 */
export const getDirectMessagesByUsername: RestAPI<
  DirectMessageInfo[],
  { username: string }
> = async (req, res) => {
  res.send(await getDirectMessagesForUser(req.params.username));
};

/**
 * POST /api/dms/:username
 * Either creates a new or obtains an existing direct message for a user.
 */
export const postDirectMessage: RestAPI<DirectMessageInfo, { username: string }> = async (
  req,
  res,
) => {
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

  try {
    const dmId = await createDirectMessage(caller.username, req.params.username);
    res.send(await getDirectMessageInfo(dmId, caller.username));
  } catch (error) {
    res.status(400).send({ error: "Unable to obtain direct message" });
  }
};

/**
 * Handle a socket request to set up inboxes for users involved in a direct message
 * so messages sent have somewhere to go.
 */
export const socketDirectMessageInbox: SocketAPI = (socket) => async (body) => {
  try {
    const { auth } = withAuth(z.null()).parse(body);
    const user = await enforceAuth(auth);
    await socket.join(`inbox:${user.username}`);
  } catch (error) {
    logSocketError(socket, error);
  }
};

/**
 * Handle a socket request to send a message to a direct message: store the chat and
 * add the message to the other users unread messages.
 */
export const socketDirectMessageNew: SocketAPI = (socket, io) => async (body) => {
  try {
    const {
      auth,
      payload: { dmId, text },
    } = withAuth(z.object({ dmId: z.string(), text: z.string() })).parse(body);
    const user = await enforceAuth(auth);
    const message = await createMessage(user, text, new Date());

    await addMessageToDirectMessage(dmId, message.messageId);
    const otherUsername = await getOtherDirectMessageUser(dmId, user.username);

    io.to(`inbox:${user.username}`).emit("directMessageNew", { dmId, message });
    io.to(`inbox:${otherUsername}`).emit("directMessageNew", { dmId, message });

    const otherInfo = await getDirectMessageInfo(dmId, otherUsername);
    io.to(`inbox:${otherUsername}`).emit("directMessageNotify", {
      dmId,
      unreadCount: otherInfo.unreadCount,
    });
  } catch (error) {
    logSocketError(socket, error);
  }
};

/**
 * Handle a socket request to delete a message in a direct message.
 */
export const socketDirectMessageDeleteMessage: SocketAPI = (socket, io) => async (body) => {
  try {
    const {
      auth,
      payload: { dmId, messageId },
    } = withAuth(z.object({ dmId: z.string(), messageId: z.string() })).parse(body);
    const user = await enforceAuth(auth);
    const deletedAt = await deleteMessage(messageId, user);

    const otherUsername = await getOtherDirectMessageUser(dmId, user.username);
    io.to(`inbox:${user.username}`).emit("directMessageDeleted", {
      dmId,
      messageId,
      deletedAt: deletedAt.toISOString(),
    });
    io.to(`inbox:${otherUsername}`).emit("directMessageDeleted", {
      dmId,
      messageId,
      deletedAt: deletedAt.toISOString(),
    });
  } catch (err) {
    logSocketError(socket, err);
  }
};
