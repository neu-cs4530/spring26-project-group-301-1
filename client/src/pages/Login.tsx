import useLoginForm from "../hooks/useLoginForm.ts";
import "./Login.css";
import { useState, type MouseEvent } from "react";
import EyeToggle from "../components/EyeToggle";
import { type AuthContext } from "../contexts/LoginContext.ts";

interface LoginProps {
  setAuth: (s: AuthContext | null) => void;
}

/**
 * Renders a login form with username and password inputs, password visibility toggle,
 * and error handling.
 */
export default function Login({ setAuth }: LoginProps) {
  const { mode, username, password, confirm, err, handleInputChange, handleSubmit, toggleMode } =
    useLoginForm(setAuth);
  const [showPassword, setShowPassword] = useState(false);

  const handleCardGlowMove = (event: MouseEvent<HTMLFormElement>) => {
    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    const relativeX = ((event.clientX - rect.left) / rect.width) * 100;
    const relativeY = ((event.clientY - rect.top) / rect.height) * 100;

    card.style.setProperty("--glow-x", `${relativeX}%`);
    card.style.setProperty("--glow-y", `${relativeY}%`);
    card.style.setProperty("--glow-intensity", "1");
  };

  const handleCardGlowLeave = (event: MouseEvent<HTMLFormElement>) => {
    const card = event.currentTarget;
    card.style.setProperty("--glow-intensity", "0");
  };

  return (
    <div className="login-page">
      <form
        className="login"
        onSubmit={(e) => handleSubmit(e)}
        onMouseMove={handleCardGlowMove}
        onMouseLeave={handleCardGlowLeave}
      >
        <h1 className="login__brand">PlaySpace</h1>
        <img src="/PlaySpace.png" alt="PlaySpace logo" className="login__logo" />
        <h2 className="login__title">Log into PlaySpace</h2>
        <input
          type="text"
          value={username}
          onChange={(event) => handleInputChange(event, "username")}
          placeholder="Username"
          aria-label="Username"
          className="widefill"
        />
        <div className="login__password-field">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => handleInputChange(event, "password")}
            placeholder="Password"
            aria-label="Password"
            className="widefill"
          />
          <span className="login__eye-toggle">
            <EyeToggle shown={showPassword} onClick={() => setShowPassword((v) => !v)} />
          </span>
        </div>
        {mode === "signup" && (
          <div className="login__password-field">
            <input
              type={showPassword ? "text" : "password"}
              value={confirm}
              onChange={(event) => handleInputChange(event, "confirm")}
              placeholder="Confirm Password"
              aria-label="Confirm Password"
              className="widefill"
            />
            <span className="login__eye-toggle">
              <EyeToggle shown={showPassword} onClick={() => setShowPassword((v) => !v)} />
            </span>
          </div>
        )}
        {err && <p className="error-message centered">{err}</p>}
        <button type="submit" className="widefill login__primary-btn">
          {mode === "signup" ? "Sign Up" : "Log In"}
        </button>
        <div className="intertext">or</div>
        <button
          type="button"
          className="narrowcenter login__secondary-btn"
          onClick={(e) => {
            e.preventDefault();
            toggleMode();
          }}
        >
          {mode === "signup" ? "Use Existing Account" : "Create New Account"}
        </button>
      </form>
      <div className="smallAndGray login__footnote">
        PlaySpace stores passwords in cleartext; reusing passwords here is a catastrophically bad
        idea
      </div>
    </div>
  );
}
