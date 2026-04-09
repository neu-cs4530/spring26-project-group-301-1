import { type SafeUserInfo, type GameInfo } from "@gamenite/shared";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Box } from "@chakra-ui/react";
import { CalendarDays, Gamepad2, CircleAlert, CircleCheck } from "lucide-react";
import useTimeSince from "../hooks/useTimeSince";
import useLoginContext from "../hooks/useLoginContext";
import { getUserById } from "../services/userService";
import { getFriendStatus, sendFriendRequest, removeFriend } from "../services/friendsService";
import { useNavigate } from "react-router-dom";
import { openDirectMessage } from "../services/dmService";
import useTopFriendsList from "../hooks/useTopFriendsList";
import usePlayersStatsInfo from "../hooks/usePlayerStatsInfo";
import GameSummaryView from "../components/GameSummaryView";
import UserLink from "../components/UserLink";
import { getIconByPlatform } from "../components/SocialPlatformLink";

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
  const navigate = useNavigate();

  const [componentState, setComponentState] = useState<
    { type: "waiting" } | { type: "error"; msg: string } | { type: "profile"; user: SafeUserInfo }
  >({ type: "waiting" });

  const [friendStatus, setFriendStatus] = useState<FriendStatus>("loading" as FriendStatus);
  const [friendActionErr, setFriendActionErr] = useState<string | null>(null);
  const { games, friends, getTopFriends, getFriendGameCount } = useTopFriendsList(username);
  const { getWins, getLosses, getCompletedGames, getWaitingGames, getActiveGames } =
    usePlayersStatsInfo(username);
  const recentGames = getCompletedGames();
  const activeGames = getActiveGames();
  const waitingGames = getWaitingGames();
  const topFriends = getTopFriends(3); // get top 3 friends for display
  const gamesPlayedCount =
    games !== null && !("error" in games)
      ? games.filter((game) => game.players.some((player) => player.username === username)).length
      : null;

  const publicProfileBackgroundStyle = useMemo<CSSProperties>(() => {
    if (componentState.type !== "profile") return {};

    const customBackground = (componentState.user.customBackground || "").trim();
    if (!customBackground) return {};

    const isHex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(customBackground);
    if (isHex) {
      return { backgroundColor: customBackground };
    }

    return {
      backgroundImage: `url("${customBackground}")`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    };
  }, [componentState]);

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

  async function handleSendMessage() {
    const result = await openDirectMessage({ username: self.username, password: pass }, username);
    if ("error" in result) return;
    void navigate(`/messages/${result.dmId}`);
  }

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
          <>
            <button
              className="primary narrow profilePrimaryButton"
              onClick={() => void handleSendMessage()}
            >
              Send Message
            </button>
            <button className="secondary narrow profileDangerButton" onClick={handleRemoveFriend}>
              Remove Friend
            </button>
          </>
        );
      case "not-friends":
        return (
          <button className="primary narrow profilePrimaryButton" onClick={handleSendRequest}>
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
        <section className="profileSectionCard">
          <h3>Top Friends</h3>
          <div className="profileTopFriendsList">
            {topFriends.map((friend) => {
              const gamesPlayedWithFriend = getFriendGameCount(friend);
              return (
                <div key={friend.user.username} className="profileTopFriendCard">
                  <div className="profileTopFriendNameRow">
                    <UserLink user={friend.user} capitalize />
                  </div>
                  {!friend.user.hideUsername && (
                    <div className="profileTopFriendUsername">@{friend.user.username}</div>
                  )}
                  <div className="profileTopFriendStatRow">
                    <Gamepad2 className="profileTopFriendStatIcon" aria-hidden="true" />
                    <span>
                      {gamesPlayedWithFriend}{" "}
                      {gamesPlayedWithFriend === 1 ? "game played" : "games played"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )
    );
  }

  function getGameListElement(game: GameInfo, key: number) {
    return (
      <Box
        borderRadius="xl"
        border="1px solid #E5E7EB"
        bg="white"
        p={5}
        boxShadow="xs"
        transition="box-shadow 0.2s"
        _hover={{ boxShadow: "md" }}
        className="home-game-list__item"
      >
        <div key={key}>
          <GameSummaryView {...game} />
        </div>
      </Box>
    );
  }

  function renderGames() {
    return (
      <section className="profileSectionCard">
        <div>
          <h3>Pending Games</h3>
          {waitingGames.length > 0 ? (
            <div className="spacesSection">
              {waitingGames.slice(0, 3).map((game, i) => getGameListElement(game, i))}
            </div>
          ) : (
            <p className="smallAndGray">This player has no pending games to join</p>
          )}
          <h3>Active Games</h3>
          {activeGames.length > 0 ? (
            <div className="spacesSection">
              {activeGames.slice(0, 3).map((game, i) => getGameListElement(game, i))}
            </div>
          ) : (
            <p className="smallAndGray">This player has no active games</p>
          )}
          <h3>Completed Games</h3>
          {recentGames.length > 0 ? (
            <div className="spacesSection">
              {recentGames.slice(0, 3).map((game, i) => getGameListElement(game, i))}
            </div>
          ) : (
            <p className="smallAndGray">This player has not completed any games</p>
          )}
        </div>
      </section>
    );
  }

  switch (componentState.type) {
    case "error":
      return <div style={{ color: "#f00" }}>{componentState.msg}</div>;
    case "waiting":
      return <div>Loading...</div>;
    case "profile":
      return (
        <div
          className="profileForm profileForm--publicBackground"
          style={publicProfileBackgroundStyle}
        >
          {(componentState.user.privateProfile && friendStatus === "friends") ||
          !componentState.user.privateProfile ? (
            <>
              <div className="profileIdentityCard profileIdentityCard--actionsTopRight">
                <div className="profileIdentityMain">
                  <div>
                    <div className="profileIdentityName">{componentState.user.display}</div>
                    {!componentState.user.hideUsername && (
                      <div className="profileIdentityMeta">@{componentState.user.username}</div>
                    )}
                    <div className="profileIdentityMetaRow">
                      <span className="profileIdentityMetaJoined">
                        <CalendarDays className="profileIdentityMetaIcon" aria-hidden="true" />
                        Joined {timeSince(componentState.user.createdAt)}
                      </span>
                      {friendStatusLabel() && (
                        <>
                          <span className="profileIdentityMetaDot" aria-hidden="true">
                            •
                          </span>
                          <span className="profileIdtoentityStatusPill">{friendStatusLabel()}</span>
                        </>
                      )}
                    </div>
                    {gamesPlayedCount !== null && (
                      <div className="profileIdentityMeta">Games played: {gamesPlayedCount}</div>
                    )}
                    {getWins() !== null && (
                      <div className="profileIdentityMeta">Games Won: {getWins()}</div>
                    )}
                    {getLosses() !== null && (
                      <div className="profileIdentityMeta">Games Lost: {getLosses()}</div>
                    )}
                    <div>
                      <h3 style={{ fontSize: "2xl", fontWeight: "bold", paddingTop: 4 }}>
                        Social Profiles
                      </h3>
                      {componentState.user.profileLinks === undefined ||
                      componentState.user.profileLinks.length === 0 ? (
                        <span className="smallAndGray">
                          This user has no linked social profiles
                        </span>
                      ) : (
                        componentState.user.profileLinks.map((p) => {
                          return (
                            <a href={p.link} target="_blank">
                              <div
                                className="linkedSocialMediaCard"
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "repeat(2, minmax(0, 0.5fr))",
                                }}
                              >
                                {getIconByPlatform(p)}
                                {p.verified === true ? (
                                  <p title="This profile is verified.">
                                    <CircleCheck color="green" />
                                  </p>
                                ) : (
                                  <p title="Warning! This profile is unverified. Verification is supported for Twitch and YouTube accounts.">
                                    <CircleAlert color="orange" />
                                  </p>
                                )}
                              </div>
                            </a>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
                <div className="profileIdentityRight profileIdentityRight--topRight">
                  {renderFriendControls()}
                </div>
              </div>

              {friendActionErr && <p className="error-message">{friendActionErr}</p>}

              {games !== null &&
                !("error" in games) &&
                friends !== null &&
                !("error" in friends) &&
                renderTopFriends()}
              {renderGames()}
            </>
          ) : (
            <section className="profileSectionCard">
              <h3>Profile</h3>
              <p>User profile is private</p>
              <div className="profilePrivateControls">{renderFriendControls()}</div>
              {friendActionErr && <p className="error-message">{friendActionErr}</p>}
            </section>
          )}
        </div>
      );
  }
}
