import "./ChatPanel.css";
import MessageCreation from "./MessageCreation.tsx";
import MessageList from "./MessageList.tsx";
import useSocketsForChat from "../hooks/useSocketsForChat.ts";
import useHiddenIds from "../hooks/useHiddenIds.ts";
import useLoginContext from "../hooks/useLoginContext.ts";
import { ShieldCheck, ShieldOff } from "lucide-react";

interface ChatProps {
  chatId: string;
  lightText?: boolean;
  darkText?: boolean;
}

/**
 * A chat panel allows viewing and updating messages in live chat
 */
export default function ChatPanel({ chatId, lightText = false, darkText = false }: ChatProps) {
  const { user } = useLoginContext();
  const {
    messages,
    handleMessageCreation,
    handleMessageDeletion,
    cooldownUntil,
    cooldownMessage,
    chatFilter,
  } = useSocketsForChat(chatId);
  const {
    hiddenIds: hiddenMessageIds,
    hideItem: handleHideMessage,
    unhideItem: handleUnhideMessage,
  } = useHiddenIds({
    storagePrefix: "hidden-game-chat-messages",
    entityId: chatId,
    scopeId: user.username,
  });

  return (
    messages && (
      <div
        className={`chatContainer ${lightText ? "chatContainer--lightText" : ""} ${darkText ? "chatContainer--darkText" : ""}`}
      >
        <div className="chatHeader">
          <h3 className="chatHeader__title">
            Game Chat{" "}
            {chatFilter ? (
              <span title="Chat filter on">
                <ShieldCheck size={20} />
              </span>
            ) : (
              <span title="Chat filter off">
                <ShieldOff size={20} />
              </span>
            )}
          </h3>
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
