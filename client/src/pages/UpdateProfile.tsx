import { useState } from "react";
import useLoginContext from "../hooks/useLoginContext";
import useTimeSince from "../hooks/useTimeSince";
import useEditProfileForm from "../hooks/useEditProfileForm";

export default function UpdateProfile() {
  const { user } = useLoginContext();
  const timeSince = useTimeSince();
  const [showPass, setShowPass] = useState(false);
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
    err,
    handleSubmit,
  } = useEditProfileForm();

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
        <h3>Game background</h3>
        <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem", alignItems: "center" }}>
          <select value={backgroundType} onChange={(e) => setBackgroundType(e.target.value)}>
            <option value="color">Color</option>
            <option value="preset">Preset Image</option>
          </select>
          {backgroundType === "color" ? (
            <>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{ width: "2.5em", height: "2em", border: "none", background: "none" }}
                title={color}
              />
            </>
          ) : (
            <>
              <select
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="widefill notTooWide"
              >
                <option value="">Select a preset image</option>
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
        <div className="smallAndGray">Choose a color or preset image for your game background.</div>
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
      {err && <p className="error-message">{err}</p>}
      <div>
        <button className="primary narrow">Submit</button>
      </div>
      <div className="smallAndGray">After updating your profile, you will be logged out</div>
    </form>
  );
}
