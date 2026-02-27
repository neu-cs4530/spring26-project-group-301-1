import type { GameKey, FriendRequestStatus } from "@gamenite/shared";

/**
 * Record identifiers used to look up keys in a database. This type
 * abbreviation is intended to suggest that the key should be a randomly
 * generated unique ID.
 */
export type RecordId = string;

/**
 * Actual JavaScript Date objects can't necessarily be stored in a database;
 * this type indicates that the string should be the result of taking a Date
 * object and turning it to a string with the Date.toISOString() method.
 */
export type DateISO = string;

/**
 * Represents a user's authorization record in the database.
 * - `user`: the user ID of the corresponding User model
 * - `password`: the password for this user
 */
export interface AuthRecord {
  userId: RecordId; // References User models
  password: string;
}

/**
 * Represents a chat document in the database.
 * - `messages`: the ordered list of messages in the chat
 * - `moveLog`: the ordered list of move log entries for this chat
 * - `createdAt`: when the chat was created
 */
export interface ChatRecord {
  messages: RecordId[]; // References Message models
  moveLog: MoveLogEntry[];
  createdAt: DateISO;
}

/**
 * Represents a game move log entry stored in a chat.
 * - `moveDescription`: human-readable description of the move
 * - `userId`: the user who made the move
 * - `createdAt`: when the move was made
 */
export interface MoveLogEntry {
  moveDescription: string;
  userId: RecordId;
  createdAt: DateISO;
}

/**
 * Represents a comment in the database.
 * - `text`: comment contents
 * - `createdBy`: username of the commenter
 * - `createdAt`: when the comment was made
 * - `editedAt`: when the comment was last modified
 */
export interface CommentRecord {
  text: string;
  createdBy: RecordId; // References User records
  createdAt: DateISO;
  editedAt?: DateISO;
}

/**
 * Represents a game document in the database.
 * - `type`: picks which game this is
 * - `state`: absent if the game hasn't started, or the id for the game's state
 * - `chat`: id for the game's chat
 * - `players`: active players for the game
 * - `createdAt`: when the game was created
 * - `createdBy`: username of the person who created the game
 */
export interface GameRecord {
  type: GameKey;
  state?: unknown;
  done: boolean;
  chat: RecordId; // References Chat records
  players: RecordId[]; // References User records
  createdAt: DateISO;
  createdBy: RecordId; // References User records
}

/**
 * Represents a message in the database.
 * - `text`: message contents
 * - `createdBy`: username of message sender
 * - `createdAt`: when the message was sent
 */
export interface MessageRecord {
  text: string;
  createdBy: RecordId; // References User records
  createdAt: DateISO;
}

/**
 * Represents a forum post as it's stored in the database.
 * - `title`: post title
 * - `text`: post contents
 * - `createdAt`: when the thread was posted
 * - `createdBy`: username of OP
 * - `comments`: replies to the post
 */
export interface ThreadRecord {
  title: string;
  text: string;
  createdAt: DateISO;
  createdBy: RecordId; // References User records
  comments: RecordId[]; // References Comment records
}

/**
 * Represents a user document in the database.
 * - `password`: user's password
 * - `display`: A display name
 * - `createdAt`: when this user registered.
 * - `hideUsername`: privacy preference for user, will hide username if true
 */
export interface UserRecord {
  username: string; // References Auth records
  display: string;
  createdAt: DateISO;
  customBackground?: string;
  hideUsername: boolean;
}

/**
 * Represents a user's game statistics for a particular game type.
 * - `username`: the user these stats belong to
 * - `gameType`: the game these stats are for
 * - `wins`: number of wins the user has for this game type
 * - `losses`: number of losses the user has for this game type
 * - `draws`: number of draws the user has for this game type
 * - `gamesPlayed`: total number of games played for this game type
 * - `lastPlayedAt`: when the user last played a game of this type
 */
export interface UserStatsRecord {
  username: string;
  gameType: GameKey;
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
  lastPlayedAt: string; // DateISO
}

/**
 * Represents a friend request between two users.
 * - `fromUsername`: the user who sent the friend request
 * - `toUsername`: the user who received the friend request
 * - `status`: the current status of the friend request (ex: pending, accepted, or declined)
 * - `createdAt`: when the friend request was sent
 * - `resolvedAt`: when the friend request was accepted or declined, or null if still pending
 */
export interface FriendRequestRecord {
  fromUsername: string;
  toUsername: string;
  status: FriendRequestStatus;
  createdAt: string; // DateISO
  resolvedAt: string | null;
}

/**
 * Represents a confirmed friendship.
 * - `usernameA`: one of the two friends
 * - `usernameB`: the other friend
 * - `friendsSince`: when the friendship was established
 *
 * Note that there should only be one FriendRecord for any given pair of users.
 * (Friend A <-> Friend B should be represented by either A->B or B->A, but not both.)
 */
export interface FriendRecord {
  usernameA: string;
  usernameB: string;
  friendsSince: string; // DateISO
}
