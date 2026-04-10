import { useEffect, useState } from "react";
import useAuth from "./useAuth";
import useLoginContext from "./useLoginContext";
import useDmContext from "./useDmContext";
import { markDirectMessageAsRead } from "../services/dmService";
import type {
  DirectMessageDeletedPayload,
  DirectMessageNewPayload,
  MessageInfo,
} from "@gamenite/shared";

/**
 * Sets up socket listeners for a direct message thread, and provides handlers for creating and deleting messages.
 * @param dmId The direct message thread to listen to
 * @param initialMessages The messages to display in the thread already
 * @returns the current list of messages, and handlers for creating and deleting messages
 */
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
      void markDirectMessageAsRead(auth, dmId);
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
  }, [socket, dmId, setUnreadCount, auth]);

  /**
   * Handles creating a new message in a dm
   * @param text The message
   * @returns True if message is sent successfully
   */
  function handleMessageCreation(text: string): boolean {
    socket.emit("directMessageNew", { auth, payload: { dmId, text } });
    return true;
  }

  /**
   * Handles deleting a message in a dm
   * @param text The message to delete
   * @returns True if message is deleted successfully
   */
  function handleMessageDeletion(messageId: string) {
    socket.emit("directMessageDeleteMessage", { auth, payload: { dmId, messageId } });
  }

  return { messages, handleMessageCreation, handleMessageDeletion };
}
