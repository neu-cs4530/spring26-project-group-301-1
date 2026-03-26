import "./ChatPanel.css";
import MessageCreation from "./MessageCreation.tsx";
import MessageList from "./MessageList.tsx";
import useSocketsForChat from "../hooks/useSocketsForChat.ts";

interface ChatProps {
  chatId: string;
  lightText?: boolean;
}

/**
 * A chat panel allows viewing and updating messages in live chat
 */
export default function ChatPanel({ chatId, lightText = false }: ChatProps) {
  const { messages, handleMessageCreation, handleMessageDeletion, cooldownUntil, cooldownMessage } =
    useSocketsForChat(chatId);
  return (
    messages && (
      <div className={lightText ? "chatContainer chatContainer--lightText" : "chatContainer"}>
        <div className="chatHeader">
          <h3 className="chatHeader__title">Game Chat</h3>
        </div>
        <MessageList messages={messages} onDeleteMessage={handleMessageDeletion} />
        <MessageCreation
          handleMessageCreation={handleMessageCreation}
          cooldownUntil={cooldownUntil}
          cooldownMessage={cooldownMessage}
        />
      </div>
    )
  );
}
