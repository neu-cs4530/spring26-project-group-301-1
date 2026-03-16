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

  return (
    <form className="content spacedSection" onSubmit={handleSubmit}>
      <h2>Profile</h2>
      <div>
        <h3>General information</h3>
        <ul>
          <li>Username: {user.username}</li>
          <li>Account created {timeSince(user.createdAt)}</li>
        </ul>
      </div>
      <hr />
      <div className="spacedSection">
        <h3>Friend Requests</h3>
        {requestsErr && <p className="error-message">{requestsErr}</p>}
        {!requestsErr && requests.length === 0 && (
          <p className="smallAndGray">No pending friend requests.</p>
        )}
        {requests.map((req) => (
          <div
            key={req.requestId}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "0.5rem",
            }}
          >
            <span>
              <strong>{req.from.display}</strong>
              {!req.from.hideUsername && (
                <span className="smallAndGray"> @{req.from.username}</span>
              )}
              <span className="smallAndGray"> · {timeSince(req.createdAt)}</span>
            </span>
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
            {resolveErrors[req.requestId] && (
              <span className="error-message">{resolveErrors[req.requestId]}</span>
            )}
          </div>
        ))}
      </div>
      <hr />
      <div className="spacedSection">
        <h3>Game background</h3>
        <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem", alignItems: "center" }}>
          <select value={backgroundType} onChange={(e) => setBackgroundType(e.target.value)}>
            <option value="color">Color</option>
            <option value="preset">Image</option>
          </select>
          {backgroundType === "color" ? (
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{ width: "2.5em", height: "2em", border: "none", background: "none" }}
              title={color}
            />
          ) : (
            <>
              <select
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="widefill notTooWide"
              >
                <option value="" disabled>
                  Select an image
                </option>
                <option value="/backgrounds/stripes.jpeg">Stripes</option>
                <option value="/backgrounds/sky.jpeg">Sky</option>
                <option value="/backgrounds/pastel.jpeg">Pastels</option>
                <option value="/backgrounds/lake.jpeg">Lake</option>
              </select>
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Preset preview"
                  style={{ width: 60, height: 60, marginLeft: "1em", borderRadius: 8 }}
                />
              )}
            </>
          )}
          <button
            className="secondary narrow"
            onClick={(e) => {
              e.preventDefault();
              if (backgroundType === "color") {
                setColor(
                  user.customBackground && presetColors.includes(user.customBackground)
                    ? user.customBackground
                    : presetColors[0],
                );
              } else {
                setImageUrl("");
              }
            }}
          >
            Reset
          </button>
        </div>
        <div className="smallAndGray">Choose a color or image for your game background.</div>
      </div>
      <div className="spacedSection">
        <h3>Password</h3>
        <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem" }}>
          <input
            type={showPass ? "text" : "password"}
            className="widefill notTooWide"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="secondary narrow"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              setShowPass((v) => !v);
            }}
          >
            {showPass ? "Hide" : "Reveal"}
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem" }}>
          <input
            type={showPass ? "text" : "password"}
            className="widefill notTooWide"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
      </div>
      <hr />
      <div className="spacedSection">
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
              <span className="privacyRowDescription">
                Only approved followers can see your profile
              </span>
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
      </div>
      {err && <p className="error-message">{err}</p>}
      <div>
        <button aria-label="Submit profile edits" className="primary narrow">
          Submit
        </button>
      </div>
      <div className="smallAndGray">After updating your profile, you will be logged out</div>
    </form>
  );
}
