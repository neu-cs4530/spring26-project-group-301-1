import {
  type ChatInfo,
  type ChatMoveLogPayload,
  type ChatNewMessagePayload,
  type ChatUserJoinedPayload,
  type ChatUserLeftPayload,
  type ChatMessageDeletedPayload,
  type ChatDeleteMessagePayload,
} from "./chat.types.ts";
import {
  type DirectMessageNewPayload,
  type DirectMessageDeleteMessagePayload,
  type DirectMessageDeletedPayload,
} from "./dm.types.ts";
import { type NewMessagePayload, type NewDirectMessagePayload } from "./message.types.ts";
import { type WithAuth } from "./auth.types.ts";
import { type GameMakeMovePayload, type GamePlayInfo, type TaggedGameView } from "./game.types.ts";
import { type SafeUserInfo } from "./user.types.ts";

/**
 * The Socket.io interface for client to server communication
 */
export interface ClientToServerEvents {
  chatJoin: (payload: WithAuth<string>) => void;
  chatLeave: (payload: WithAuth<string>) => void;
  chatSendMessage: (payload: WithAuth<NewMessagePayload>) => void;
  gameJoinAsPlayer: (payload: WithAuth<string>) => void;
  gameMakeMove: (payload: WithAuth<GameMakeMovePayload>) => void;
  gameStart: (payload: WithAuth<string>) => void;
  gameWatch: (payload: WithAuth<string>) => void;
  gameNotWatched: (payload: WithAuth<string>) => void;
  chatDeleteMessage: (payload: WithAuth<ChatDeleteMessagePayload>) => void;
  directMessageRegister: (payload: WithAuth<null>) => void; // serves as an inbox room
  directMessageNew: (payload: WithAuth<NewDirectMessagePayload>) => void;
  directMessageDeleteMessage: (payload: WithAuth<DirectMessageDeleteMessagePayload>) => void;
}

/**
 * The Socket.io interface for server to client information
 */
export interface ServerToClientEvents {
  chatJoined: (payload: ChatInfo) => void;
  chatMoveLog: (payload: ChatMoveLogPayload) => void;
  chatNewMessage: (payload: ChatNewMessagePayload) => void;
  chatUserJoined: (payload: ChatUserJoinedPayload) => void;
  chatUserLeft: (payload: ChatUserLeftPayload) => void;
  gamePlayersUpdated: (payload: SafeUserInfo[]) => void;
  gameStateUpdated: (payload: TaggedGameView & { forPlayer: boolean }) => void;
  gameWatched: (payload: GamePlayInfo) => void;
  gameViewCountUpdated: (payload: number) => void;
  chatSendError: (payload: ChatSendErrorPayload) => void;
  error: (payload: ChatSendErrorPayload) => void;
  chatMessageDeleted: (payload: ChatMessageDeletedPayload) => void;
  directMessageNew: (payload: DirectMessageNewPayload) => void;
  directMessageDeleted: (payload: DirectMessageDeletedPayload) => void;
  directMessageNotify: (payload: { dmId: string; unreadCount: number }) => void;
  friendRemoved: (payload: { otherUsername: string }) => void;
}

export type ChatSendErrorPayload = {
  code: string;
  message: string;
  retryAfterMs?: number;
};
