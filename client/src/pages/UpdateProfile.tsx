import "./Profile.css";
import { useState, useEffect } from "react";
import type { FriendRequestInfo } from "@gamenite/shared";
import useLoginContext from "../hooks/useLoginContext";
import useTimeSince from "../hooks/useTimeSince";
import useEditProfileForm from "../hooks/useEditProfileForm";
import { getPendingRequests, resolveRequest } from "../services/friendsService";

export default function UpdateProfile() {
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
    setColor,
    imageUrl,
    setImageUrl,
    presetColors,
    password,
    setPassword,
    confirm,
    setConfirm,
    hideUsername,
    setHideUsername,
    privateProfile,
    setPrivateProfile,
    err,
    handleSubmit,
  } = useEditProfileForm();

  useEffect(() => {
    getPendingRequests({ username: user.username, password: pass }).then((res) => {
      if ("error" in res) {
        setRequestsErr(res.error);
      } else {
        setRequests(res);
      }
    });
  }, [user.username, pass]);

  async function handleResolve(requestId: string, action: "accept" | "decline") {
    setResolveErrors((prev) => ({ ...prev, [requestId]: "" }));
    const res = await resolveRequest(
      { username: user.username, password: pass },
      requestId,
      action,
    );
    if ("error" in res) {
      setResolveErrors((prev) => ({ ...prev, [requestId]: res.error }));
    } else {
      setRequests((prev) => prev.filter((r) => r.requestId !== requestId));
    }
  }

  const displayName = user.display || user.username;

  return (
    <form className="profileForm" onSubmit={handleSubmit}>
      <h2 className="profileTitle">Profile</h2>

      <div className="profileIdentityCard">
        <div>
          <div className="profileIdentityName">{displayName}</div>
          <div className="smallAndGray">Username: {user.username}</div>
          <div className="smallAndGray">Account created {timeSince(user.createdAt)}</div>
        </div>
      </div>

      <div className="profileLayout">
        <div className="profileCol profileCol--left">
          <section className="profileSectionCard">
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
        </div>

        <div className="profileCol">
          <section className="profileSectionCard gameBgCard">
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

            <p className="gameBgCard__help">Choose a color or image for your game background.</p>
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

              {PRESET_BACKGROUNDS.map((bg) => {
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

          <section className="profileSectionCard">
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
                onClick={() => setShowPass((v) => !v)}
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

          <section className="profileSectionCard">
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
                    onChange={() => setHideUsername((v) => !v)}
                  />
                  <span className="toggleSlider" />
                </label>
              </div>

              <div className="privacyDivider" />

              <div className="privacyRow">
                <div className="privacyRowText">
                  <span className="privacyRowLabel">Private profile</span>
                  <span className="privacyRowDescription">Only friends can see your profile</span>
                </div>
                <label className="toggleSwitch" aria-label="Toggle private profile">
                  <input
                    type="checkbox"
                    checked={privateProfile}
                    onChange={() => setPrivateProfile((p) => !p)}
                  />
                  <span className="toggleSlider" />
                </label>
              </div>
            </div>

            {err && <p className="error-message">{err}</p>}

            <div className="profileSubmitRow">
              <button aria-label="Submit profile edits" className="primary narrow">
                Save Changes
              </button>
            </div>
            <div className="smallAndGray">After updating your profile, you will be logged out</div>
          </section>
        </div>
      </div>
    </form>
  );
}

// keep this near other constants in UpdateProfile.tsx
const PRESET_BACKGROUNDS = [
  { label: "Stripes", url: "/backgrounds/stripes.jpeg" },
  { label: "Sky", url: "/backgrounds/sky.jpeg" },
  { label: "Pastels", url: "/backgrounds/pastel.jpeg" },
  { label: "Lake", url: "/backgrounds/lake.jpeg" },
];
