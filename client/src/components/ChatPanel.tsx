import "./ChatPanel.css";
import MessageCreation from "./MessageCreation.tsx";
import MessageList from "./MessageList.tsx";
import useSocketsForChat from "../hooks/useSocketsForChat.ts";

interface ChatProps {
  chatId: string;
}

/**
 * A chat panel allows viewing and updating messages in live chat
 */
export default function ChatPanel({ chatId }: ChatProps) {
  const { messages, handleMessageCreation, handleMessageDeletion, cooldownUntil, cooldownMessage } =
    useSocketsForChat(chatId);
  return (
    messages && (
      <div className="chatContainer">
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
