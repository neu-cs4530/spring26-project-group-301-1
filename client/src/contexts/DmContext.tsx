import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";
import useLoginContext from "../hooks/useLoginContext";
import useAuth from "../hooks/useAuth";

/**
 * The context for direct messages, which holds the number of unread messages in each dm,
 * and provides a function for setting the unread count. It also sets up a socket listener
 * for receiving notifications about new messages in dms.
 */
export interface DmContextValue {
  unreadCounts: Record<string, number>;
  totalUnread: number;
  setUnreadCount: (dmId: string, count: number) => void;
}
export const DmContext = createContext<DmContextValue | null>(null);

export function DmContextProvider({ children }: { children: ReactNode }) {
  const { socket } = useLoginContext();
  const auth = useAuth();
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
  const setUnreadCount = useCallback((dmId: string, count: number) => {
    setUnreadCounts((prev) => ({ ...prev, [dmId]: count }));
  }, []);

  useEffect(() => {
    // Register inbox on mount
    socket.emit("directMessageRegister", { auth, payload: null });

    // Listen for unread notifications
    function handleNotify({ dmId, unreadCount }: { dmId: string; unreadCount: number }) {
      setUnreadCounts((prev) => ({ ...prev, [dmId]: unreadCount }));
    }
    socket.on("directMessageNotify", handleNotify);
    return () => {
      socket.off("directMessageNotify", handleNotify);
    };
  }, [auth, socket]);

  return (
    <DmContext.Provider value={{ unreadCounts, totalUnread, setUnreadCount }}>
      {children}
    </DmContext.Provider>
  );
}
