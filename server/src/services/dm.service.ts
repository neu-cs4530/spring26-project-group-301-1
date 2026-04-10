import { DirectMessageRepo } from "../repository.ts";
import { type DirectMessageInfo } from "@gamenite/shared";
import { safeUserFromUsername } from "./user.service.ts";
import { getMessagesById } from "./message.service.ts";
import { areFriends } from "./friends.service.ts";

function dmKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

/**
 * Creates a new direct message between two users if it doesn't already exist, and returns the dmId
 * @param userA The first user involved in the direct message
 * @param userB The second user involved in the direct message
 * @returns The dmId of the created or existing direct message
 */
export async function createDirectMessage(userA: string, userB: string): Promise<string> {
  if (userA === userB) throw new Error("Cannot create DM with yourself");

  if (!(await areFriends(userA, userB))) {
    throw new Error("Can only create DMs between friends");
  }

  const key = dmKey(userA, userB);
  const existingDM = await DirectMessageRepo.find(key);
  if (!existingDM) {
    const [a, b] = userA < userB ? [userA, userB] : [userB, userA];
    await DirectMessageRepo.set(key, {
      userA: a,
      userB: b,
      messages: [],
      lastReadAt: {},
      createdAt: new Date().toISOString(),
    });
  }
  return key;
}

/**
 * Obtain the relevant information about an existing direct message and populate direct message information
 * @param dmId The id based on the key of two users of the direct message to obtain information about
 * @param loggedInUser the user that is viewing the direct message with unread messages
 * @returns the relevant information about the direct message, including the other user, the messages, and the unread count
 */
export async function getDirectMessageInfo(
  dmId: string,
  loggedInUser: string,
): Promise<DirectMessageInfo> {
  const directMessage = await DirectMessageRepo.find(dmId);
  if (!directMessage) throw new Error("Direct message not found");
  const friendUsername =
    directMessage.userA === loggedInUser ? directMessage.userB : directMessage.userA;
  const messages = await getMessagesById(directMessage.messages);
  const lastRead = directMessage.lastReadAt[loggedInUser];
  const unreadCount = lastRead
    ? messages.filter(
        (msg) =>
          new Date(msg.createdAt) > new Date(lastRead) && msg.createdBy.username !== loggedInUser,
      ).length
    : messages.filter((msg) => msg.createdBy.username !== loggedInUser).length;
  return {
    dmId,
    otherUser: await safeUserFromUsername(friendUsername),
    messages,
    unreadCount,
    createdAt: new Date(directMessage.createdAt),
  };
}

/**
 * Obtains the list of direct messages a user is involved with among different friends
 * @param username the username of the user to obtain direct messages for
 * @returns the list of direct messages the user is involved with
 */
export async function getDirectMessagesForUser(username: string): Promise<DirectMessageInfo[]> {
  const keys = await DirectMessageRepo.getAllKeys();
  const results: DirectMessageInfo[] = [];
  for (const key of keys) {
    const directMessage = await DirectMessageRepo.get(key);
    if (directMessage.userA === username || directMessage.userB === username) {
      const otherUser =
        directMessage.userA === username ? directMessage.userB : directMessage.userA;
      if (await areFriends(username, otherUser)) {
        results.push(await getDirectMessageInfo(key, username));
      }
    }
  }
  return results;
}

/**
 * Get the other user involved in a direct message.
 * @param dmId the id of the direct message to obtain the other user of
 * @param loggedInUser the user that is requesting the other user of the direct message
 * @returns the username of the other user involved in the direct message
 */
export async function getOtherDirectMessageUser(
  dmId: string,
  loggedInUser: string,
): Promise<string> {
  const directMessage = await DirectMessageRepo.get(dmId);
  return directMessage.userA === loggedInUser ? directMessage.userB : directMessage.userA;
}

/**
 * Adds a message to an existing direct message, updating the direct message
 * @param dmId The id of the direct message to add a message to
 * @param messageId The id of the message to add to the direct message
 */
export async function addMessageToDirectMessage(dmId: string, messageId: string): Promise<void> {
  const directMessage = await DirectMessageRepo.get(dmId);
  await DirectMessageRepo.set(dmId, {
    ...directMessage,
    messages: [...directMessage.messages, messageId],
  });
}

/**
 * Marks a direct message as read by updating the last read timestamp for the user
 * @param dmId the id of the direct message to mark as read
 * @param username the user that is marking the direct message as read
 */
export async function markDirectMessageRead(dmId: string, username: string): Promise<void> {
  const record = await DirectMessageRepo.get(dmId);
  await DirectMessageRepo.set(dmId, {
    ...record,
    lastReadAt: { ...record.lastReadAt, [username]: new Date().toISOString() },
  });
}

/**
 * If a DM exists between two users, marks it as read for both so unread counts
 * don't carry over if they later re-friend each other.
 * @param userA One user of the DM
 * @param userB The other user of the DM
 */
export async function markDmReadForBothIfExists(userA: string, userB: string): Promise<void> {
  const key = dmKey(userA, userB);
  const dm = await DirectMessageRepo.find(key);
  if (!dm) return;
  await markDirectMessageRead(key, userA);
  await markDirectMessageRead(key, userB);
}
