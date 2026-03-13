import { createContext, useEffect, useState, type ReactNode } from "react";
import useLoginContext from "../hooks/useLoginContext";
import useAuth from "../hooks/useAuth";

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

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
  const setUnreadCount = (dmId: string, count: number) =>
    setUnreadCounts((prev) => ({ ...prev, [dmId]: count }));

  return (
    <DmContext.Provider value={{ unreadCounts, totalUnread, setUnreadCount }}>
      {children}
    </DmContext.Provider>
  );
}
