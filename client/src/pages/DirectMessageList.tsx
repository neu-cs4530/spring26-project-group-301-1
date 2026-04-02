import "./DirectMessage.css";
import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import type { DirectMessageInfo } from "@gamenite/shared";
import useLoginContext from "../hooks/useLoginContext.ts";
import { getDirectMessages } from "../services/dmService.ts";
import useDmContext from "../hooks/useDmContext.ts";

export default function DirectMessageList() {
  const { user } = useLoginContext();
  const [dms, setDms] = useState<DirectMessageInfo[] | null>(null);
  const { unreadCounts } = useDmContext();

  useEffect(() => {
    void getDirectMessages(user.username).then((result) => {
      if ("error" in result) return;
      setDms(result);
    });
  }, [user.username]);

  return (
    <div className="dm-layout">
      <div className="dm-sidebar">
        <h3 className="dm-sidebar-title">Direct Messages</h3>
        {dms === null ? (
          <p className="dm-sidebar-empty">Loading...</p>
        ) : dms.length === 0 ? (
          <p className="dm-sidebar-empty">No messages yet.</p>
        ) : (
          <div className="dm-list">
            {dms.map((dm) => {
              const lastMessage = dm.messages.at(-1);
              const liveUnread = unreadCounts[dm.dmId] ?? dm.unreadCount;
              return (
                <NavLink
                  key={dm.dmId}
                  to={`/messages/${dm.dmId}`}
                  className={({ isActive }) =>
                    `dm-list-item ${isActive ? "dm-list-item--active" : ""}`
                  }
                >
                  <strong>{dm.otherUser.display}</strong>
                  {liveUnread > 0 && <span className="dmAlert">{liveUnread}</span>}
                  {lastMessage && (
                    <p className="smallAndGray">
                      {lastMessage.deleted ? "[deleted]" : lastMessage.text}
                    </p>
                  )}
                </NavLink>
              );
            })}
          </div>
        )}
      </div>
      <div className="dm-main">
        <Outlet />
      </div>
    </div>
  );
}
