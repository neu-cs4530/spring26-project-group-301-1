import "./DirectMessage.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { DirectMessageInfo } from "@gamenite/shared";
import useLoginContext from "../hooks/useLoginContext.ts";
import { getDirectMessages } from "../services/dmService.ts";

export default function DirectMessageList() {
  const { user } = useLoginContext();
  const navigate = useNavigate();
  const [dms, setDms] = useState<DirectMessageInfo[] | null>(null);

  useEffect(() => {
    void getDirectMessages(user.username).then((result) => {
      if ("error" in result) return;
      setDms(result);
    });
  }, [user.username]);

  return (
    <div className="content">
      <div className="spacedSection">
        <h2>Messages</h2>
        {dms === null ? (
          <p>Loading...</p>
        ) : dms.length === 0 ? (
          <p>No messages yet.</p>
        ) : (
          <div className="dottedList">
            {dms.map((dm) => {
              const lastMessage = dm.messages.at(-1);
              return (
                <div
                  key={dm.dmId}
                  className="clickable"
                  onClick={() => void navigate(`/messages/${dm.dmId}`)}
                >
                  <strong>{dm.otherUser.display}</strong>
                  {dm.unreadCount > 0 && <span className="dmBadge">{dm.unreadCount}</span>}
                  {lastMessage && (
                    <p className="smallAndGray">
                      {lastMessage.deleted ? "[deleted]" : lastMessage.text}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
