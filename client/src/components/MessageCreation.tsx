import "./MessageCreation.css";
import { type SubmitEvent, type KeyboardEvent, useEffect, useState } from "react";

interface MessageCreationProps {
  handleMessageCreation: (text: string) => boolean;
  cooldownUntil: number;
  cooldownMessage: string | null;
}

export default function MessageCreation({
  handleMessageCreation,
  cooldownUntil,
  cooldownMessage,
}: MessageCreationProps) {
  const [text, setText] = useState<string>("");
  const [now, setNow] = useState<number>(0);

  useEffect(() => {
    if (cooldownUntil <= 0) return;

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 250);

    return () => window.clearInterval(timer);
  }, [cooldownUntil]);

  const effectiveNow = now === 0 ? cooldownUntil : now;
  const cooldownMsLeft = Math.max(0, cooldownUntil - effectiveNow);
  const cooldownSecondsLeft = Math.ceil(cooldownMsLeft / 1000);

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
      {(cooldownMsLeft > 0 || cooldownMessage) && (
        <p className="messageCooldown" role="status">
          {cooldownMsLeft > 0
            ? `Cooldown active. Try again in ${cooldownSecondsLeft}s.`
            : cooldownMessage}
        </p>
      )}
      <button className="visuallyHidden">Submit</button>
    </form>
  );
}
