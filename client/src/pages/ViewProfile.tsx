import type { SafeUserInfo } from "@gamenite/shared";
import { useEffect, useState } from "react";
import useTimeSince from "../hooks/useTimeSince";
import useLoginContext from "../hooks/useLoginContext";
import { getUserById } from "../services/userService";
import { getFriendStatus, sendFriendRequest, removeFriend } from "../services/friendsService";
import useTopFriendsList from "../hooks/useTopFriendsList";
import usePlayersStatsInfo from "../hooks/usePlayerStatsInfo";
import GameSummaryView from "../components/GameSummaryView";

type FriendStatus =
  | "loading"
  | "friends"
  | "not-friends"
  | "request-sent"
  | "request-received"
  | "error";

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
  const { games, friends, getTopFriends, getFriendGameCount } = useTopFriendsList(username);
  const topFriends = getTopFriends();
  const { getWins, getLosses, getCompletedGames, getWaitingGames, getActiveGames } =
    usePlayersStatsInfo(username);
  const recentGames = getCompletedGames();
  const activeGames = getActiveGames();
  const waitingGames = getWaitingGames();

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

    getFriendStatus({ username: self.username, password: pass }, username).then((res) => {
      if (cancel) return;
      if ("error" in res) {
        setFriendStatus("error");
        return;
      }
      setFriendStatus(res.status as FriendStatus);
    });

    return () => {
      cancel = true;
    };
  }, [self.username, pass, username]);

  async function handleSendRequest() {
    setFriendActionErr(null);
    const res = await sendFriendRequest({ username: self.username, password: pass }, username);
    if ("error" in res) {
      if (res.error.includes("Conflict")) {
        setFriendStatus("request-sent");
      } else {
        setFriendActionErr(res.error);
      }
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
      case "request-received":
        return "Request Received";
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
      case "request-received":
        return <span className="smallAndGray">They sent you a friend request</span>;
      case "error":
      default:
        return null;
    }
  }

  function renderTopFriends() {
    return (
      topFriends.length > 0 && (
        <div className="spacedSection">
          <h3>Top Friends</h3>
          {topFriends.slice(0, 3).map((friend, i) => (
            <p key={i} aria-label={"friend-" + friend.user.display}>
              {i + 1}. {friend.user.display} - Games played: {getFriendGameCount(friend)}
            </p>
          ))}
        </div>
      )
    );
  }

  function renderStats() {
    return (
      <div className="spacedSection">
        <h3>Player Stats</h3>
        <p>Wins: {getWins()}</p>
        <p>Losses: {getLosses()}</p>
      </div>
    );
  }

  function renderGames() {
    return (
      <div>
        <h3>Pending Games</h3>
        {waitingGames.length > 0 ? (
          <div className="spacesSection">
            {waitingGames.slice(0, 3).map((game, i) => (
              <div key={i}>
                <GameSummaryView {...game} />
              </div>
            ))}
          </div>
        ) : (
          <p className="smallAndGray">This player has no pending games to join</p>
        )}
        <h3>Active Games</h3>
        {activeGames.length > 0 ? (
          <div className="spacesSection">
            {activeGames.slice(0, 3).map((game, i) => (
              <div key={i}>
                <GameSummaryView {...game} />
              </div>
            ))}
          </div>
        ) : (
          <p className="smallAndGray">This player has no active games</p>
        )}
        <h3>Completed Games</h3>
        {recentGames.length > 0 ? (
          <div className="spacesSection">
            {recentGames.slice(0, 3).map((game, i) => (
              <div key={i}>
                <GameSummaryView {...game} />
              </div>
            ))}
          </div>
        ) : (
          <p className="smallAndGray">This player has not completed any games</p>
        )}
      </div>
    );
  }

  switch (componentState.type) {
    case "error":
      return <div style={{ color: "#f00" }}>{componentState.msg}</div>;
    case "waiting":
      return <div>Loading...</div>;
    case "profile":
      return (
        <div className="content spacedSection">
          {(componentState.user.privateProfile && friendStatus === "friends") ||
          !componentState.user.privateProfile ? (
            <>
              <h2>Profile for {componentState.user.display}</h2>
              <ul>
                {!componentState.user.hideUsername && (
                  <li>Username: {componentState.user.username}</li>
                )}
                <li>Account created {timeSince(componentState.user.createdAt)}</li>
                {friendStatusLabel() && <li>Friend Status: {friendStatusLabel()}</li>}
              </ul>
              <div style={{ alignSelf: "flex-start" }}>{renderFriendControls()}</div>
              {friendActionErr && <p className="error-message">{friendActionErr}</p>}
              {games !== null &&
                !("error" in games) &&
                friends !== null &&
                !("error" in friends) &&
                renderTopFriends()}
              {renderStats()}
              {renderGames()}
            </>
          ) : (
            <>
              <p>User profile is private</p>
              <div style={{ alignSelf: "flex-start" }}>{renderFriendControls()}</div>
              {friendActionErr && <p className="error-message">{friendActionErr}</p>}
            </>
          )}
        </div>
      );
  }
}
