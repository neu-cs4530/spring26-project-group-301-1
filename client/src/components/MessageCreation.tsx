import "./MessageCreation.css";
import { type SubmitEvent, type KeyboardEvent, useState } from "react";

interface MessageCreationProps {
  handleMessageCreation: (text: string) => boolean;
  cooldownUntil: number;
  cooldownMessage: string | null;
}

export default function MessageCreation({
  handleMessageCreation,
  cooldownUntil: _cooldownUntil,
  cooldownMessage,
}: MessageCreationProps) {
  const [text, setText] = useState<string>("");

  function trySend() {
    const sent = handleMessageCreation(text);
    if (sent) setText("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.code === "Enter" && !e.shiftKey) {
      e.preventDefault();
      trySend();
    }
  }

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    trySend();
  }

  return (
    <form data-testid="message-creation-form" className="messageCreation" onSubmit={handleSubmit}>
      <textarea
        placeholder="Send a message to chat"
        value={text}
        onKeyDown={handleKeyDown}
        onChange={(e) => setText(e.target.value)}
      />
      {cooldownMessage && (
        <p className="messageCooldown" role="status">
          {cooldownMessage}
        </p>
      )}
      <button className="visuallyHidden">Submit</button>
    </form>
  );
}
