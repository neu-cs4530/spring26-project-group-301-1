import useAuth from "../hooks/useAuth.ts";
import useDmContext from "../hooks/useDmContext.ts";
import useSocketsForDirectMessage from "../hooks/useSocketsForDm.ts";
import MessageList from "../components/MessageList.tsx";
import MessageCreation from "../components/MessageCreation.tsx";
import type { DirectMessageInfo } from "@gamenite/shared";
import { useEffect } from "react";
import { markDirectMessageAsRead } from "../services/dmService.ts";
import "../components/ChatPanel.css";

export default function DirectMessagePanel({ dm }: { dm: DirectMessageInfo }) {
  const auth = useAuth();
  const { setUnreadCount } = useDmContext();
  const { messages, handleMessageCreation, handleMessageDeletion } = useSocketsForDirectMessage(
    dm.dmId,
    dm.messages,
  );

  useEffect(() => {
    void markDirectMessageAsRead(auth, dm.dmId);
    setUnreadCount(dm.dmId, 0);
    return () => setUnreadCount(dm.dmId, 0);
  }, [auth, dm.dmId, setUnreadCount]);

  return (
    <>
      <MessageList messages={messages} onDeleteMessage={handleMessageDeletion} />
      <MessageCreation
        handleMessageCreation={handleMessageCreation}
        cooldownUntil={0}
        cooldownMessage={null}
      />
    </>
  );
}
