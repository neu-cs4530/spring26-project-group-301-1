import "./MessageList.css";
import useLoginContext from "../hooks/useLoginContext.ts";
import type { ChatMessage } from "../util/types.ts";
import { useEffect, useRef } from "react";
import useTimeSince from "../hooks/useTimeSince.ts";
import UserLink from "./UserLink.tsx";

interface MessageListProps {
  messages: ChatMessage[];
  onDeleteMessage: (messageId: string) => void;
}

export default function MessageList({ messages, onDeleteMessage }: MessageListProps) {
  const { user } = useLoginContext();
  const chatWindowRef = useRef<HTMLDivElement | null>(null);
  const timeSince = useTimeSince();
  useEffect(() => {
    if (!chatWindowRef.current) return;
    chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
  }, [messages]);

  return (
    <div className="chatWindow" ref={chatWindowRef}>
      <div className="chatScroller">
        {messages.map((message) => {
          if ("meta" in message) {
            if (message.meta === "move") {
              const moveText = message.moveDescription.trimStart();
              const isAutomatedMove = moveText.startsWith("automated opponent moved");

              return (
                <div key={message.messageId} className="chatMoveLog">
                  {isAutomatedMove ? (
                    moveText
                  ) : (
                    <>
                      <UserLink user={message.user} /> {moveText}
                    </>
                  )}
                </div>
              );
            }
            return (
              <div key={message.messageId} className="chatMeta">
                <UserLink user={message.user} /> {message.meta}
                {" chat "}
                {timeSince(message.dateTime)}
              </div>
            );
          }

          const isMessageSender = user.username === message.createdBy.username;

          if (message.deleted) {
            return (
              <div key={message.messageId} className={isMessageSender ? "chatMe" : "chatOther"}>
                <div className="chatSender">
                  {!isMessageSender && (
                    <>
                      <UserLink user={message.createdBy} />{" "}
                    </>
                  )}
                  {timeSince(message.createdAt)}
                </div>
                <div className="chatContent chatDeleted">
                  {isMessageSender
                    ? "You deleted this message"
                    : `${message.createdBy.display} deleted a message`}
                </div>
              </div>
            );
          }

          if (isMessageSender) {
            return (
              <div key={message.messageId} className="chatMe chatDeletable">
                <button
                  className="chatDeleteBtn"
                  aria-label="Delete message"
                  onClick={() => onDeleteMessage(message.messageId)}
                >
                  ✕
                </button>
                <div className="chatSender">{timeSince(message.createdAt)}</div>
                <div className="chatContent">{message.text}</div>
              </div>
            );
          }
          return (
            <div key={message.messageId} className="chatOther">
              <div className="chatSender">
                <UserLink user={message.createdBy} /> {timeSince(message.createdAt)}
              </div>
              <div className="chatContent">{message.text}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
