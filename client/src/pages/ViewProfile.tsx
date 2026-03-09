import type { SafeUserInfo } from "@gamenite/shared";
import { useEffect, useState } from "react";
import useTimeSince from "../hooks/useTimeSince";
import useLoginContext from "../hooks/useLoginContext";
import { getUserById } from "../services/userService";
import { getFriends, sendFriendRequest, removeFriend } from "../services/friendsService";

type FriendStatus = "loading" | "friends" | "not-friends" | "request-sent" | "error";

interface ViewProfileProps {
  username: string;
}

export default function ViewProfile({ username }: ViewProfileProps) {
  const { user: self, pass } = useLoginContext();
  const timeSince = useTimeSince();

  const [componentState, setComponentState] = useState<
    { type: "waiting" } | { type: "error"; msg: string } | { type: "profile"; user: SafeUserInfo }
  >({ type: "waiting" });

  const [friendStatus, setFriendStatus] = useState<FriendStatus>("loading" as FriendStatus);
  const [friendActionErr, setFriendActionErr] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;

    getUserById(username)
      .then((response) => {
        if (cancel) return;
        if ("error" in response) {
          setComponentState({ type: "error", msg: response.error });
        } else {
          setComponentState({ type: "profile", user: response });
        }
      })
      .catch((err) => {
        if (cancel) return;
        setComponentState({ type: "error", msg: `${err}` });
      });

    return () => {
      cancel = true;
    };
  }, [username, self.username]);

  useEffect(() => {
    let cancel = false;

    getFriends(username).then((res) => {
      if (cancel) return;
      if ("error" in res) {
        setFriendStatus("error");
        return;
      }
      const isFriend = res.some((f) => f.user.username === self.username);
      setFriendStatus(isFriend ? "friends" : "not-friends");
    });

    return () => {
      cancel = true;
    };
  }, [username, self.username]);

  async function handleSendRequest() {
    setFriendActionErr(null);
    const res = await sendFriendRequest({ username: self.username, password: pass }, username);
    if ("error" in res) {
      setFriendActionErr(res.error);
    } else {
      setFriendStatus("request-sent");
    }
  }

  async function handleRemoveFriend() {
    setFriendActionErr(null);
    const res = await removeFriend({ username: self.username, password: pass }, username);
    if ("error" in res) {
      setFriendActionErr(res.error);
    } else {
      setFriendStatus("not-friends");
    }
  }

  function friendStatusLabel() {
    switch (friendStatus) {
      case "loading":
        return null;
      case "friends":
        return "Friends";
      case "not-friends":
        return "Not Friends";
      case "request-sent":
        return "Request Sent";
      case "error":
        return null;
    }
  }

  function renderFriendControls() {
    switch (friendStatus) {
      case "loading":
        return <span className="smallAndGray">Loading...</span>;
      case "friends":
        return (
          <button className="secondary narrow" onClick={handleRemoveFriend}>
            Remove Friend
          </button>
        );
      case "not-friends":
        return (
          <button className="primary narrow" onClick={handleSendRequest}>
            Add Friend
          </button>
        );
      case "request-sent":
        return <span className="smallAndGray">Friend request sent</span>;
      case "error":
        return null;
    }
  }

  switch (componentState.type) {
    case "error":
      return <div style={{ color: "#f00" }}>{componentState.msg}</div>;
    case "waiting":
      return <div>Loading...</div>;
    case "profile":
      return (
        <div className="content spacedSection">
          <h2>Profile for {componentState.user.display}</h2>
          <ul>
            {!componentState.user.hideUsername && <li>Username: {componentState.user.username}</li>}
            <li>Account created {timeSince(componentState.user.createdAt)}</li>
            {friendStatusLabel() && <li>Friend Status: {friendStatusLabel()}</li>}
          </ul>
          <div style={{ alignSelf: "flex-start" }}>{renderFriendControls()}</div>
          {friendActionErr && <p className="error-message">{friendActionErr}</p>}
        </div>
      );
  }
}
