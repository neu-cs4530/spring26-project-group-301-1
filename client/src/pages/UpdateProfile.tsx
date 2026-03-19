import "./Profile.css";
import { useState, useEffect, useMemo } from "react";
import type { FriendRequestInfo } from "@gamenite/shared";
import useLoginContext from "../hooks/useLoginContext";
import useTimeSince from "../hooks/useTimeSince";

import useEditProfileForm from "../hooks/useEditProfileForm";
import { getPendingRequests, resolveRequest } from "../services/friendsService";
import ProfileSidebar from "../components/ProfileSidebar";

const PRESET_BACKGROUNDS: { label: string; url: string }[] = [
  { label: "Stripes", url: "/backgrounds/stripes.jpeg" },
  { label: "Sky", url: "/backgrounds/sky.jpeg" },
  { label: "Pastels", url: "/backgrounds/pastel.jpeg" },
  { label: "Lake", url: "/backgrounds/lake.jpeg" },
];

export default function UpdateProfile() {
  const [activeSection, setActiveSection] = useState<string>("friend-requests");
  const { user, pass } = useLoginContext();
  const timeSince = useTimeSince();
  const [showPass, setShowPass] = useState(false);
  const [hideSelectionCheck, setHideSelectionCheck] = useState(false); // add
  const [customColor, setCustomColor] = useState("#3b82f6");

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
    presetColors,
    password,
    setPassword,
    confirm,
    setConfirm,
    display,
    hideUsername,
    setHideUsername,
    privateProfile,
    setPrivateProfile,
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
      user.privateProfile !== privateProfile
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
                    <span>
                      <strong>{req.from.display}</strong>
                      {!req.from.hideUsername && (
                        <span className="smallAndGray"> @{req.from.username}</span>
                      )}
                      <span className="smallAndGray"> · {timeSince(req.createdAt)}</span>
                    </span>
                    <div className="friendRequestActions">
                      <button
                        type="button"
                        className="primary narrow"
                        onClick={() => handleResolve(req.requestId, "accept")}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className="secondary narrow"
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
            {activeSection === "game-background" && (
              <section className="profileSectionCard gameBgCard" id="game-background">
                <div className="gameBgCard__header">
                  <h3>Game Background</h3>
                  <button
                    type="button"
                    className="gameBgCard__reset"
                    onClick={() => {
                      setBackgroundType("color");
                      setImageUrl("");
                      setColor(presetColors[0] ?? "#3b82f6");
                      setHideSelectionCheck(true); // hide checks after reset
                    }}
                  >
                    ↻ Reset
                  </button>
                </div>
                <p className="gameBgCard__help">
                  Choose a color or image for your game background.
                </p>
                <div className="gameBgCard__divider" />
                <div className="gameBgCard__images">
                  <label
                    className={`gameBgTile gameBgTile--color ${backgroundType === "color" ? "is-selected" : ""}`}
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
                      className={`gameBgTile__check ${!hideSelectionCheck && backgroundType === "color" ? "is-selected" : ""}`}
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
                          className={`gameBgTile__check ${!hideSelectionCheck && selected ? "is-selected" : ""}`}
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
                    className="secondary narrow"
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
          </div>
        </div>
      </form>
    </div>
  );
}
