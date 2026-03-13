import { type SafeUserInfo } from "./user.types.ts";
import { type MessageInfo } from "./message.types.ts";

/**
 * Represents a direct message document in the database.
 * - `dmId`: database key
 * - `messages`: the ordered list of messages in the direct message
 * - `createdAt`: when the direct message was created
 */
export interface DirectMessageInfo {
  dmId: string;
  otherUser: SafeUserInfo;
  messages: MessageInfo[];
  unreadCount: number;
  createdAt: Date;
}

/*** TYPES USED IN THE DM API ***/

/**
 * Relevant information for informing the client that a message was added to a
 * direct message
 */
export interface DirectMessageNewPayload {
  dmId: string;
  message: MessageInfo;
}

/**
 * Relevant information from the client that a message was deleted from a direct message
 */
export type DirectMessageDeleteMessagePayload = {
  dmId: string;
  messageId: string;
};

/**
 * Relevant information for informing the client that a message was deleted from a
 * direct message
 * - `dmId`: the direct message where the message was deleted
 * - `messageId`: the id of the deleted message
 * - `deletedAt`: when the message was deleted
 */
export type DirectMessageDeletedPayload = {
  dmId: string;
  messageId: string;
  deletedAt: string;
};
