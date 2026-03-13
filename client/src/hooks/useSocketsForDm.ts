import { useEffect, useState } from "react";
import useAuth from "./useAuth";
import useLoginContext from "./useLoginContext";
import useDmContext from "./useDmContext";
import type {
  DirectMessageDeletedPayload,
  DirectMessageNewPayload,
  MessageInfo,
} from "@gamenite/shared";

export default function useSocketsForDirectMessage(dmId: string, initialMessages: MessageInfo[]) {
  const auth = useAuth();
  const { socket } = useLoginContext();
  const { setUnreadCount } = useDmContext();
  const [messages, setMessages] = useState<MessageInfo[]>(initialMessages);

  useEffect(() => {
    function handleNew({ dmId: id, message }: DirectMessageNewPayload) {
      if (id !== dmId) return;
      setMessages((prev) => [...prev, message]);
      setUnreadCount(dmId, 0);
    }
    function handleDeleted({ dmId: id, messageId, deletedAt }: DirectMessageDeletedPayload) {
      if (id !== dmId) return;
      setMessages((prev) =>
        prev.map((m) => (m.messageId === messageId ? { ...m, deleted: true, deletedAt } : m)),
      );
    }
    socket.on("directMessageNew", handleNew);
    socket.on("directMessageDeleted", handleDeleted);
    return () => {
      socket.off("directMessageNew", handleNew);
      socket.off("directMessageDeleted", handleDeleted);
    };
  }, [socket, dmId, setUnreadCount]);

  function handleMessageCreation(text: string): boolean {
    socket.emit("directMessageNew", { auth, payload: { dmId, text } });
    return true;
  }

  function handleMessageDeletion(messageId: string) {
    socket.emit("directMessageDeleteMessage", { auth, payload: { dmId, messageId } });
  }

  return { messages, handleMessageCreation, handleMessageDeletion };
}
