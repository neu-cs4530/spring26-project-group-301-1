import { z } from "zod";
import { type SafeUserInfo } from "./user.types.ts";

/**
 * Possible statuses of a friend request.
 */
export type FriendRequestStatus = z.infer<typeof zFriendRequestStatus>;
export const zFriendRequestStatus = z.union([
  z.literal("pending"),
  z.literal("accepted"),
  z.literal("declined"),
]);

/**
 * Represents a friend request as exposed to the client.
 * - `requestId`: database key
 * - `from`: the user who sent the request
 * - `to`: the user who received the request
 * - `status`: current status of the request
 * - `createdAt`: when the request was sent
 * - `resolvedAt`: when the request was accepted or declined, if it was
 */
export interface FriendRequestInfo {
  requestId: string;
  from: SafeUserInfo;
  to: SafeUserInfo;
  status: FriendRequestStatus;
  createdAt: Date;
  resolvedAt?: Date;
}

/**
 * Represents a confirmed friendship exposed to the client.
 * - `user`: the friend's user info
 * - `friendsSince`: when the friendship was established
 */
export interface FriendInfo {
  user: SafeUserInfo;
  friendsSince: Date;
}

/*** TYPES USED IN THE FRIENDS API ***/

/**
 * Relevant information for sending a friend request.
 */
export type SendFriendRequestPayload = z.infer<typeof zSendFriendRequestPayload>;
export const zSendFriendRequestPayload = z.object({
  toUsername: z.string(),
});

/**
 * Relevant information for resolving (accepting or declining) a friend request.
 */
export type ResolveFriendRequestPayload = z.infer<typeof zResolveFriendRequestPayload>;
export const zResolveFriendRequestPayload = z.object({
  requestId: z.string(),
  action: z.union([z.literal("accept"), z.literal("decline")]),
});

/**
 * Relevant information for removing a friend.
 */
export type RemoveFriendPayload = z.infer<typeof zRemoveFriendPayload>;
export const zRemoveFriendPayload = z.object({
  friendUsername: z.string(),
});
