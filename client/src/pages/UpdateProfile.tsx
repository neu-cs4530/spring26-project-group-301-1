import "./Profile.css";
import { useState, useEffect, useMemo } from "react";
import { initiateOAuth } from "../services/oauthService";
import type { FriendRequestInfo, SocialProfileLink, SocialProfilePlatform } from "@gamenite/shared";
import useLoginContext from "../hooks/useLoginContext";
import useTimeSince from "../hooks/useTimeSince";
import useTopFriendsList from "../hooks/useTopFriendsList";
import useEditProfileForm from "../hooks/useEditProfileForm";
import { getPendingRequests, resolveRequest } from "../services/friendsService";
import ProfileSidebar from "../components/ProfileSidebar";
import UserLink from "../components/UserLink";
import { Gamepad2, InfoIcon, Users } from "lucide-react";
import SocialPlatformLink, { getIconByPlatform } from "../components/SocialPlatformLink";

const PRESET_BACKGROUNDS: { label: string; url: string }[] = [
  { label: "Blue", url: "/backgrounds/blue.jpg" },
  { label: "Green", url: "/backgrounds/green.jpg" },
  { label: "Yellow", url: "/backgrounds/yellow.jpg" },
  { label: "Star", url: "/backgrounds/star.jpg" },
];

export default function UpdateProfile() {
  const [activeSection, setActiveSection] = useState<string>("friend-requests");
  const { user, pass } = useLoginContext();
  const timeSince = useTimeSince();
  const [showPass, setShowPass] = useState(false);
  const [hideSelectionCheck, setHideSelectionCheck] = useState(false); // add
  const [customColor, setCustomColor] = useState("#3b82f6");
  const [socialProfileErr, setSocialProfileErr] = useState<string | null>(null);

  const [requests, setRequests] = useState<FriendRequestInfo[]>([]);
  const [requestsErr, setRequestsErr] = useState<string | null>(null);
  const [resolveErrors, setResolveErrors] = useState<Record<string, string>>({});

  const {
    backgroundType,
    setBackgroundType,
    color,
    setColor,
    imageUrl,
    setImageUrl,
    password,
    setPassword,
    confirm,
    setConfirm,
    display,
    setDisplay,
    hideUsername,
    setHideUsername,
    privateProfile,
    setPrivateProfile,
    socialLink,
    setSocialLink,
    socialLinkType,
    setSocialLinkType,
    profilesToAdd,
    setProfilesToAdd,
    profilesToDelete,
    setProfilesToDelete,
    err,
    handleSubmit,
  } = useEditProfileForm();

  // Determine if any fields are dirty
  const isDirty = useMemo(() => {
    return (
      password !== "" ||
      confirm !== "" ||
      user.display !== display ||
      (user.customBackground || "") !== (backgroundType === "color" ? color : imageUrl) ||
      user.hideUsername !== hideUsername ||
      user.privateProfile !== privateProfile ||
      profilesToAdd.length > 0 ||
      profilesToDelete.length > 0
    );
  }, [
    password,
    confirm,
    display,
    backgroundType,
    color,
    imageUrl,
    hideUsername,
    privateProfile,
    profilesToAdd,
    profilesToDelete,
    user,
  ]);

  useEffect(() => {
    getPendingRequests({ username: user.username, password: pass }).then(
      (res: FriendRequestInfo[] | { error: string }) => {
        if (Array.isArray(res)) {
          setRequests(res);
          setRequestsErr(null);
        } else {
          setRequestsErr(res.error);
          setRequests([]);
        }
      },
    );
  }, [user.username, pass]);

  const displayName = user.display || user.username;

  async function handleResolve(requestId: string, action: "accept" | "decline") {
    setResolveErrors((prev: Record<string, string>) => ({ ...prev, [requestId]: "" }));
    const res = await resolveRequest(
      { username: user.username, password: pass },
      requestId,
      action,
    );
    if ("error" in res) {
      setResolveErrors((prev: Record<string, string>) => ({ ...prev, [requestId]: res.error }));
    } else {
      setRequests((prev: FriendRequestInfo[]) => prev.filter((r) => r.requestId !== requestId));
    }
  }

  /**
   * Handle verification requests for linked social media accounts. Note that this will re-direct the
   * user upon verification.
   * @param link the social media linked account
   */
  async function handleVerify(link: SocialProfileLink) {
    const result = await initiateOAuth(link.type, user.username, pass, link.link);
    if ("error" in result) {
      setSocialProfileErr(result.error);
    }
    if ("url" in result) {
      setSocialProfileErr(null);
      window.location.replace(result.url);
    }
  }

  function handleDelete(link: SocialProfileLink) {
    setProfilesToDelete((prev) => {
      if (prev.some((p) => p.link === link.link && p.type === link.type)) return prev;
      return [...prev, link];
    });
  }

  function queueProfileToAdd() {
    if (socialLink === "" || socialLinkType === null) return;
    setProfilesToAdd((prev) => {
      if (prev.some((p) => p.link === socialLink && p.type === socialLinkType)) return prev;
      return [...prev, { link: socialLink, type: socialLinkType, verified: false }];
    });
    setSocialLink("");
    setSocialLinkType(null);
  }

  const { getTopFriends, getFriendGameCount } = useTopFriendsList(user.username);
  const topFriends = getTopFriends(-1); // get all friends without slicing

  function renderTopFriends() {
    return (
      topFriends.length > 0 && (
        <section className="profileSectionCard">
          <h3>All Friends</h3>
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
  return (
    <div>
      <form className="profileForm" onSubmit={handleSubmit}>
        <div className="profileIdentityCard">
          <div className="profileIdentityMain">
            <div>
              <div className="profileIdentityName">{displayName}</div>
              <div className="profileIdentityMeta">@{user.username}</div>
              <div className="profileIdentityMeta">Joined {timeSince(user.createdAt)}</div>
            </div>
          </div>
          <div className="profileIdentityRight">
            <button
              type="button"
              className={
                activeSection === "friends"
                  ? "profileFriendRequestsTab is-active"
                  : "profileFriendRequestsTab"
              }
              onClick={() => setActiveSection("friends")}
            >
              <Users aria-hidden="true" />
              Friends
              <span
                style={{
                  background: "#1d4ed8",
                  color: "#fff",
                  borderRadius: "999px",
                  minWidth: 22,
                  height: 22,
                  padding: "0 7px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                }}
              >
                {topFriends.length}
              </span>
            </button>

            <button
              type="button"
              className={
                activeSection === "friend-requests"
                  ? "profileFriendRequestsTab is-active"
                  : "profileFriendRequestsTab"
              }
              onClick={() => setActiveSection("friend-requests")}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              Friend Requests
              {requests.length > 0 && (
                <span
                  style={{
                    background: "#ef4444",
                    color: "#fff",
                    borderRadius: "999px",
                    minWidth: 22,
                    height: 22,
                    padding: "0 7px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                  }}
                >
                  {requests.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="profileLayout">
          <ProfileSidebar
            activeSection={activeSection}
            onSelect={setActiveSection}
            isDirty={isDirty}
            onSubmit={(e) => handleSubmit(e as React.SubmitEvent<HTMLFormElement>)}
          />
          <div className="profileCol profileCol--left">
            {activeSection === "friend-requests" && (
              <section className="profileSectionCard" id="friend-requests">
                <h3>Friend Requests</h3>
                {requestsErr && <p className="error-message">{requestsErr}</p>}
                {!requestsErr && requests.length === 0 && (
                  <p className="smallAndGray friendRequestsEmpty">No pending friend requests.</p>
                )}
                {requests.map((req) => (
                  <div key={req.requestId} className="friendRequestRow">
                    <span className="friendRequestMetaLarge">
                      <strong className="friendRequestDisplayName">{req.from.display}</strong>
                      {!req.from.hideUsername && (
                        <span className="smallAndGray"> @{req.from.username}</span>
                      )}
                      <span className="smallAndGray"> · {timeSince(req.createdAt)}</span>
                    </span>
                    <div className="friendRequestActions">
                      <button
                        type="button"
                        className="friendRequestAcceptButton"
                        onClick={() => handleResolve(req.requestId, "accept")}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className="friendRequestDeclineButton"
                        onClick={() => handleResolve(req.requestId, "decline")}
                      >
                        Decline
                      </button>
                    </div>
                    {resolveErrors[req.requestId] && (
                      <span className="error-message">{resolveErrors[req.requestId]}</span>
                    )}
                  </div>
                ))}
              </section>
            )}
          </div>
          <div className="profileCol">
            {activeSection === "friends" && (
              <section className="friendsProfileSectionCard" id="friends">
                {renderTopFriends()}
              </section>
            )}
          </div>

          <div className="profileCol">
            {activeSection === "display-name" && (
              <section className="profileSectionCard" id="display-name">
                <h3>Display Name</h3>
                <div className="profileControlRow">
                  <input
                    type="text"
                    className="widefill notTooWide"
                    placeholder="Display name"
                    value={display}
                    onChange={(e) => setDisplay(e.target.value)}
                  />
                </div>
                <p className="smallAndGray">This is the name shown to other users.</p>
                {err && <p className="error-message">{err}</p>}
              </section>
            )}
            {activeSection === "game-background" && (
              <section className="profileSectionCard gameBgCard" id="game-background">
                <div className="gameBgCard__header">
                  <h3>Background</h3>
                  <button
                    type="button"
                    className="gameBgCard__reset"
                    onClick={() => {
                      setBackgroundType("color");
                      setImageUrl("");
                      setColor("");
                      setHideSelectionCheck(true); // hide checks after reset
                    }}
                  >
                    ↻ Reset
                  </button>
                </div>
                <p className="gameBgCard__help">Choose a color or image for your background.</p>
                <div className="gameBgCard__divider" />
                <div className="gameBgCard__images">
                  <label
                    className={`gameBgTile gameBgTile--color ${
                      backgroundType === "color" ? "is-selected" : ""
                    }`}
                    aria-label="Pick custom background color"
                    onClick={() => {
                      setBackgroundType("color");
                      setImageUrl("");
                      setColor(customColor);
                      setHideSelectionCheck(false);
                    }}
                  >
                    <input
                      type="color"
                      value={customColor}
                      className="gameBgTile__colorInput"
                      onChange={(e) => {
                        const next = e.target.value;
                        setCustomColor(next);
                        setBackgroundType("color");
                        setImageUrl("");
                        setColor(next);
                        setHideSelectionCheck(false);
                      }}
                    />
                    <div
                      className="gameBgTile__colorPreview"
                      style={{ backgroundColor: customColor }}
                    />
                    <span className="gameBgTile__label">Pick custom color</span>
                    <span
                      className={`gameBgTile__check ${
                        !hideSelectionCheck && backgroundType === "color" ? "is-selected" : ""
                      }`}
                    >
                      {!hideSelectionCheck && backgroundType === "color" ? "✓" : ""}
                    </span>
                  </label>
                  {PRESET_BACKGROUNDS.map((bg: { label: string; url: string }) => {
                    const selected = backgroundType === "preset" && imageUrl === bg.url;
                    return (
                      <button
                        key={bg.url}
                        type="button"
                        className={`gameBgTile ${selected ? "is-selected" : ""}`}
                        onClick={() => {
                          setBackgroundType("preset");
                          setImageUrl(bg.url);
                          setHideSelectionCheck(false);
                          // do NOT clear customColor
                        }}
                        aria-label={`Choose ${bg.label} background`}
                      >
                        <img src={bg.url} alt={bg.label} />
                        <span
                          className={`gameBgTile__check ${
                            !hideSelectionCheck && selected ? "is-selected" : ""
                          }`}
                        >
                          {!hideSelectionCheck && selected ? "✓" : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}
            {activeSection === "password" && (
              <section className="profileSectionCard" id="password">
                <h3>Password</h3>
                <div className="profileControlRow">
                  <input
                    type={showPass ? "text" : "password"}
                    className="widefill notTooWide"
                    placeholder="New password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="secondary narrow profilePasswordRevealButton"
                    onClick={() => setShowPass((v: boolean) => !v)}
                  >
                    {showPass ? "Hide" : "Reveal"}
                  </button>
                </div>
                <div className="profileControlRow">
                  <input
                    type={showPass ? "text" : "password"}
                    className="widefill notTooWide"
                    placeholder="Confirm new password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>
              </section>
            )}
            {activeSection === "privacy" && (
              <section className="profileSectionCard" id="privacy">
                <h3>Privacy</h3>
                <div className="privacyCard">
                  <div className="privacyRow">
                    <div className="privacyRowText">
                      <span className="privacyRowLabel">Hide username</span>
                      <span className="privacyRowDescription">
                        Your username won't be visible to other users
                      </span>
                    </div>
                    <label className="toggleSwitch" aria-label="Toggle hide username">
                      <input
                        type="checkbox"
                        checked={hideUsername}
                        onChange={() => setHideUsername((v: boolean) => !v)}
                      />
                      <span className="toggleSlider" />
                    </label>
                  </div>
                  <div className="privacyDivider" />
                  <div className="privacyRow">
                    <div className="privacyRowText">
                      <span className="privacyRowLabel">Private profile</span>
                      <span className="privacyRowDescription">
                        Only friends can see your profile
                      </span>
                    </div>
                    <label className="toggleSwitch" aria-label="Toggle private profile">
                      <input
                        type="checkbox"
                        checked={privateProfile}
                        onChange={() => setPrivateProfile((p: boolean) => !p)}
                      />
                      <span className="toggleSlider" />
                    </label>
                  </div>
                </div>
                {err && <p className="error-message">{err}</p>}
              </section>
            )}
            {activeSection === "social-media" && (
              <section className="profileSectionCard" id="social-media">
                <h3>Social Media</h3>
                <div style={{ paddingBottom: 6 }}>
                  <p style={{ fontWeight: "bold", fontSize: "1.25em" }}>Linked accounts: </p>
                  <p className="smallAndGray" style={{ display: "flex", flexDirection: "row" }}>
                    <span style={{ paddingRight: "3px" }}>
                      <InfoIcon size={15} />
                    </span>{" "}
                    verifying an account will re-direct you away from GameNite Connect!
                  </p>
                  {socialProfileErr !== null && <p className="smallAndGray">{socialProfileErr}</p>}
                  {user.profileLinks === undefined || user.profileLinks.length === 0 ? (
                    <p>You have no linked accounts</p>
                  ) : (
                    user.profileLinks.map((l, i) => {
                      const queued = profilesToDelete.some(
                        (p) => p.link === l.link && p.type === l.type,
                      );
                      return (
                        <div key={i}>
                          <SocialPlatformLink
                            link={l}
                            verifyPlatform={handleVerify}
                            deletePlatform={handleDelete}
                            modifyable={true}
                            queued={queued}
                          />
                        </div>
                      );
                    })
                  )}
                </div>
                <div>
                  <p style={{ fontWeight: "bold", fontSize: "1.25em" }}>Add Social Profile Links</p>
                  <input
                    type="text"
                    placeholder="https://platform/yourhandle"
                    value={socialLink}
                    onChange={(e) => setSocialLink(e.target.value)}
                  />
                  <p>Select the profile name:</p>
                  <select
                    value={socialLinkType ?? ""}
                    onChange={(e) => setSocialLinkType(e.target.value as SocialProfilePlatform)}
                  >
                    <option value="" disabled hidden></option>
                    <option value="twitter">Twitter/X</option>
                    <option value="instagram">Instagram</option>
                    <option value="twitch">Twitch</option>
                    <option value="youtube">YouTube</option>
                  </select>
                  <button
                    className="profilePrimaryButton"
                    style={{ marginTop: "10px" }}
                    type="button"
                    onClick={queueProfileToAdd}
                  >
                    Add Profile
                  </button>
                  {profilesToAdd.length > 0 && (
                    <div>
                      {profilesToAdd.map((p, i) => (
                        <div key={i} className="linkedSocialMediaCard">
                          <a href={p.link} target="_blank">
                            {getIconByPlatform(p)}
                          </a>
                          <p className="smallAndGray">Queued for adding to profile</p>
                          <button
                            className="profileDangerButton"
                            type="button"
                            onClick={() =>
                              setProfilesToAdd((prev) => prev.filter((_, idx) => idx !== i))
                            }
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {err && <p className="error-message">{err}</p>}
              </section>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
