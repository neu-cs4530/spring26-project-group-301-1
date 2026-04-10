import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";
import useLoginContext from "../hooks/useLoginContext";
import useAuth from "../hooks/useAuth";
import { getDirectMessages } from "../services/dmService";

/**
 * The context for direct messages, which holds the number of unread messages in each dm,
 * and provides a function for setting the unread count. It also sets up a socket listener
 * for receiving notifications about new messages in dms.
 */
export interface DmContextValue {
  unreadCounts: Record<string, number>;
  totalUnread: number;
  setUnreadCount: (dmId: string, count: number) => void;
  setActiveDmId: (dmId: string | null) => void;
}
export const DmContext = createContext<DmContextValue | null>(null);

export function DmContextProvider({ children }: { children: ReactNode }) {
  const { socket } = useLoginContext();
  const auth = useAuth();
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [activeDmId, setActiveDmId] = useState<string | null>(null);
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
  const setUnreadCount = useCallback((dmId: string, count: number) => {
    setUnreadCounts((prev) => ({ ...prev, [dmId]: count }));
  }, []);

  useEffect(() => {
    void getDirectMessages(auth.username).then((result) => {
      if ("error" in result) return;
      result.forEach((dm) => {
        if (dm.unreadCount > 0) {
          setUnreadCounts((prev) => {
            if (dm.dmId in prev) return prev;
            return { ...prev, [dm.dmId]: dm.unreadCount };
          });
        }
      });
    });
  }, [auth.username]);

  useEffect(() => {
    socket.emit("directMessageRegister", { auth, payload: null });
  }, [auth, socket]);

  useEffect(() => {
    function handleNotify({ dmId, unreadCount }: { dmId: string; unreadCount: number }) {
      setUnreadCounts((prev) => {
        if (dmId === activeDmId) return prev;
        return { ...prev, [dmId]: unreadCount };
      });
    }
    function handleFriendRemoved({ otherUsername }: { otherUsername: string }) {
      const dmId = [auth.username, otherUsername].sort().join(":");
      setUnreadCounts((prev) => {
        const next = { ...prev };
        delete next[dmId];
        return next;
      });
    }
    socket.on("directMessageNotify", handleNotify);
    socket.on("friendRemoved", handleFriendRemoved);
    return () => {
      socket.off("directMessageNotify", handleNotify);
      socket.off("friendRemoved", handleFriendRemoved);
    };
  }, [auth.username, socket, activeDmId]);

  return (
    <DmContext.Provider value={{ unreadCounts, totalUnread, setUnreadCount, setActiveDmId }}>
      {children}
    </DmContext.Provider>
  );
}
