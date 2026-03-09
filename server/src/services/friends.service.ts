import { FriendRepo, FriendRequestRepo } from "../repository.ts";
import {
  type FriendRequestInfo,
  type FriendInfo,
  type FriendRequestStatus,
} from "@gamenite/shared";
import { safeUserFromUsername } from "./user.service.ts";

function friendKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function sortedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

/**
 * Send a friend request from one user to another.
 * @param from username of the sender
 * @param to username of the recipient
 * @throws if already friends, a request is already pending, or the sender is friending themselves
 */
export async function sendFriendRequest(from: string, to: string): Promise<void> {
  if (from === to) throw new Error("Cannot add yourself as a friend");

  const existingFriend = await FriendRepo.find(friendKey(from, to));
  if (existingFriend) throw new Error("Already friends");

  const allFriendRequestKeys = await FriendRequestRepo.getAllKeys();
  for (const key of allFriendRequestKeys) {
    const req = await FriendRequestRepo.get(key);
    if (req.status === ("pending" satisfies FriendRequestStatus)) {
      if (
        (req.fromUsername === from && req.toUsername === to) ||
        (req.fromUsername === to && req.toUsername === from)
      ) {
        throw new Error("Friend Request Already Pending");
      }
    }
  }

  await FriendRequestRepo.add({
    fromUsername: from,
    toUsername: to,
    status: "pending",
    createdAt: new Date().toISOString(),
    resolvedAt: null,
  });
}

/**
 * Resolve a friend request by accepting or declining it.
 *
 * @param requestId the id of the friend request to resolve
 * @param requestRecipientUsername the username of the user resolving the request (must be the recipient of the friend request)
 * @param action either "accept" or "decline"
 * @throws if the request is not found, the caller is not the recipient, or the request is not pending
 */
export async function resolveRequest(
  requestId: string,
  requestRecipientUsername: string,
  action: "accept" | "decline",
): Promise<void> {
  const req = await FriendRequestRepo.find(requestId);
  if (!req) throw new Error("Request not found");
  if (req.toUsername !== requestRecipientUsername) throw new Error("Not authorised");
  if (req.status !== "pending") throw new Error("Request is no longer pending");

  await FriendRequestRepo.set(requestId, {
    ...req,
    status: action === "accept" ? "accepted" : "declined",
    resolvedAt: new Date().toISOString(),
  });

  if (action === "accept") {
    const [a, b] = sortedPair(req.fromUsername, req.toUsername);
    await FriendRepo.set(friendKey(a, b), {
      usernameA: a,
      usernameB: b,
      friendsSince: new Date().toISOString(),
    });
  }
}

export async function removeFriend(callerUsername: string, otherUsername: string): Promise<void> {
  const key = friendKey(callerUsername, otherUsername);
  const existing = await FriendRepo.find(key);
  if (!existing) throw new Error("Not friends");

  await FriendRepo.delete(key);
}

/**
 * Returns all friends of a user.
 *
 * @param username the user whose friends we want to look up
 * @returns a list of the user's friends, with their friend info
 **/
export async function getFriends(username: string): Promise<FriendInfo[]> {
  const keys = await FriendRepo.getAllKeys();
  const results: FriendInfo[] = [];
  for (const key of keys) {
    const rec = await FriendRepo.get(key);
    if (!rec.usernameA || !rec.usernameB) continue;
    if (rec.usernameA === username || rec.usernameB === username) {
      const friendUsername = rec.usernameA === username ? rec.usernameB : rec.usernameA;
      results.push({
        user: await safeUserFromUsername(friendUsername),
        friendsSince: new Date(rec.friendsSince),
      });
    }
  }
  return results;
}

/**
 * Returns all pending friend requests for a user.
 *
 * @param username the user whose pending friend requests we want to look up
 * @returns  a list of pending friend requests where the user is the recipient, with their request info
 */
export async function getPendingRequests(username: string): Promise<FriendRequestInfo[]> {
  const keys = await FriendRequestRepo.getAllKeys();
  const results: FriendRequestInfo[] = [];
  for (const key of keys) {
    const req = await FriendRequestRepo.get(key);
    if (req.toUsername === username && req.status === ("pending" satisfies FriendRequestStatus)) {
      results.push({
        requestId: key,
        from: await safeUserFromUsername(req.fromUsername),
        to: await safeUserFromUsername(req.toUsername),
        status: req.status,
        createdAt: new Date(req.createdAt),
        resolvedAt: req.resolvedAt ? new Date(req.resolvedAt) : undefined,
      });
    }
  }
  return results;
}

/**
 * Returns whether two users are friends.
 *
 * @param a username of one user
 * @param b username of another user
 * @returns true if these users are friends, false otherwise
 */
export async function areFriends(a: string, b: string): Promise<boolean> {
  const rec = await FriendRepo.find(friendKey(a, b));
  return rec !== null && rec.usernameA !== "";
}

/**
 * Returns the friendship status between two users from the perspective of `from`.
 *
 * @param from the username of the user making the request
 * @param to the username of the user being viewed
 * @returns "friends" | "request-sent" | "request-received" | "not-friends"
 */
export async function getFriendStatus(
  from: string,
  to: string,
): Promise<"friends" | "request-sent" | "request-received" | "not-friends"> {
  const existing = await areFriends(from, to);
  if (existing) return "friends";

  const allKeys = await FriendRequestRepo.getAllKeys();
  for (const key of allKeys) {
    const req = await FriendRequestRepo.get(key);
    if (req.status !== "pending") continue;
    if (req.fromUsername === from && req.toUsername === to) return "request-sent";
    if (req.fromUsername === to && req.toUsername === from) return "request-received";
  }

  return "not-friends";
}
