import { MESSAGE_COOLDOWN_MS, type MessageInfo } from "@gamenite/shared";
import { populateSafeUserInfo } from "./user.service.ts";
import { type UserWithId } from "../types.ts";
import { MessageRepo } from "../repository.ts";

const lastMessageAtByUser = new Map<string, number>();

export class MessageCooldownError extends Error {
  public readonly retryAfterMs: number;

  constructor(retryAfterMs: number) {
    super("You are sending messages too quickly.");
    this.name = "MessageCooldownError";
    this.retryAfterMs = retryAfterMs;
  }
}

function enforceMessageCooldown(userId: string, createdAt: Date): void {
  const nowMs = createdAt.getTime();
  const lastMs = lastMessageAtByUser.get(userId) ?? 0;
  const elapsedMs = nowMs - lastMs;

  if (elapsedMs < MESSAGE_COOLDOWN_MS) {
    throw new MessageCooldownError(MESSAGE_COOLDOWN_MS - elapsedMs);
  }

  lastMessageAtByUser.set(userId, nowMs);
}

/**
 * Expand a stored message
 *
 * @param messageId - Valid message id
 * @returns the expanded message info object
 */
async function populateMessageInfo(messageId: string): Promise<MessageInfo> {
  const message = await MessageRepo.get(messageId);
  return {
    messageId,
    text: message.text,
    createdAt: new Date(message.createdAt),
    createdBy: await populateSafeUserInfo(message.createdBy),
    deleted: message.deleted ?? false,
    deletedAt: message.deletedAt ? new Date(message.deletedAt) : undefined,
  };
}

/**
 * Creates and stores a new message
 *
 * @param user - a valid user
 * @param text - the message's text
 * @param createdAt - the time of message creation
 * @returns the message's info object
 */
export async function createMessage(
  user: UserWithId,
  text: string,
  createdAt: Date,
  skipCooldown = false,
): Promise<MessageInfo> {
  if (!skipCooldown) enforceMessageCooldown(user.userId, createdAt);

  const messageId = await MessageRepo.add({
    text,
    createdAt: createdAt.toISOString(),
    createdBy: user.userId,
  });
  return populateMessageInfo(messageId);
}

/**
 * Retrieves a list of message ids from the database
 *
 * @param ids - A list of valid message ids
 * @returns the MessageInfo objects corresponding to those ids
 * @throws if any of the ids are not valid
 */
export async function getMessagesById(ids: string[]): Promise<MessageInfo[]> {
  return Promise.all(ids.map(populateMessageInfo));
}

/**
 * Marks a message as deleted
 *
 * @param messageId - Valid message id
 * @param user - Authenticated user
 * @returns the time of deletion
 * @throws if the message doesn't exist or the user doesn't own it
 */
export async function deleteMessage(messageId: string, user: UserWithId): Promise<Date> {
  const message = await MessageRepo.get(messageId);

  if (message.createdBy !== user.userId) {
    throw new Error(`user ${user.username} cannot delete another user's message`);
  }

  const deletedAt = new Date();
  await MessageRepo.set(messageId, {
    ...message,
    deleted: true,
    deletedAt: deletedAt.toISOString(),
  });

  return deletedAt;
}
