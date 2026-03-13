import { z } from "zod";
import { type SafeUserInfo } from "./user.types.ts";

/**
 * Represents a chat message as exposed to the client
 * - `messageId`: database key
 * - `text`: message contents
 * - `createdBy`: message sender
 * - `createdAt`: when the message was sent
 * - `deleted`: whether the message has been deleted
 * - `deletedAt`: when the message was deleted (if, indeed, it was)
 */
export interface MessageInfo {
  messageId: string;
  text: string;
  createdBy: SafeUserInfo;
  createdAt: Date;
  deleted: boolean;
  deletedAt?: Date | string;
}

/*** TYPES USED IN THE MESSAGE API ***/

/**
 * Relevant information for creating a new message
 */
export type NewMessagePayload = z.infer<typeof zNewMessageRequest>;
export const zNewMessageRequest = z.object({
  chatId: z.string(),
  text: z.string(),
});

/**
 * Relevant information for creating a new direct message
 */
export type NewDirectMessagePayload = z.infer<typeof zNewDirectMessageRequest>;
export const zNewDirectMessageRequest = z.object({
  dmId: z.string(),
  text: z.string(),
});
