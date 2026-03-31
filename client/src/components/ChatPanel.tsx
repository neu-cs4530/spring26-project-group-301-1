import "./ChatPanel.css";
import MessageCreation from "./MessageCreation.tsx";
import MessageList from "./MessageList.tsx";
import useSocketsForChat from "../hooks/useSocketsForChat.ts";
import { useEffect, useMemo, useState } from "react";

interface ChatProps {
  chatId: string;
  lightText?: boolean;
}

function readHiddenMessageIds(storageKey: string): Set<string> {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return new Set();

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();

    return new Set(parsed.filter((value): value is string => typeof value === "string"));
  } catch {
    return new Set();
  }
}

/**
 * A chat panel allows viewing and updating messages in live chat
 */
export default function ChatPanel({ chatId, lightText = false }: ChatProps) {
  const { messages, handleMessageCreation, handleMessageDeletion, cooldownUntil, cooldownMessage } =
    useSocketsForChat(chatId);
  const hiddenStorageKey = useMemo(() => `hidden-game-chat-messages:${chatId}`, [chatId]);
  const [hiddenMessageIdsByChat, setHiddenMessageIdsByChat] = useState<Record<string, Set<string>>>(
    () => ({ [chatId]: readHiddenMessageIds(hiddenStorageKey) }),
  );
  const hiddenMessageIds = useMemo(
    () => hiddenMessageIdsByChat[chatId] ?? readHiddenMessageIds(hiddenStorageKey),
    [chatId, hiddenMessageIdsByChat, hiddenStorageKey],
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(hiddenStorageKey, JSON.stringify(Array.from(hiddenMessageIds)));
    } catch {
      // Ignore storage failures (private mode, quota, etc.) and keep UI functional.
    }
  }, [hiddenMessageIds, hiddenStorageKey]);

  function handleHideMessage(messageId: string): void {
    setHiddenMessageIdsByChat((existing) => {
      const next = new Set(existing[chatId] ?? hiddenMessageIds);
      next.add(messageId);
      return { ...existing, [chatId]: next };
    });
  }

  function handleUnhideMessage(messageId: string): void {
    setHiddenMessageIdsByChat((existing) => {
      const next = new Set(existing[chatId] ?? hiddenMessageIds);
      next.delete(messageId);
      return { ...existing, [chatId]: next };
    });
  }

  return (
    messages && (
      <div className={lightText ? "chatContainer chatContainer--lightText" : "chatContainer"}>
        <div className="chatHeader">
          <h3 className="chatHeader__title">Game Chat</h3>
        </div>
        <MessageList
          messages={messages}
          onDeleteMessage={handleMessageDeletion}
          hiddenMessageIds={hiddenMessageIds}
          onHideMessage={handleHideMessage}
          onUnhideMessage={handleUnhideMessage}
        />
        <MessageCreation
          handleMessageCreation={handleMessageCreation}
          cooldownUntil={cooldownUntil}
          cooldownMessage={cooldownMessage}
        />
      </div>
    )
  );
}
