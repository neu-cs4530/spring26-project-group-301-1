import useLoginForm from "../hooks/useLoginForm.ts";
import "./Login.css";
import { useState } from "react";
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

  return (
    <div className="container">
      <form className="login" onSubmit={(e) => handleSubmit(e)}>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            marginBottom: "0.5rem",
            textAlign: "center",
          }}
        >
          GameNite Connect
        </h1>
        <h2 style={{ textAlign: "center" }}>Log into GameNite Connect</h2>
        <input
          type="text"
          value={username}
          onChange={(event) => handleInputChange(event, "username")}
          placeholder="Username"
          aria-label="Username"
          className="widefill"
        />
        <div style={{ position: "relative", width: "100%" }}>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => handleInputChange(event, "password")}
            placeholder="Password"
            aria-label="Password"
            className="widefill"
            style={{ paddingRight: 36 }}
          />
          <span
            style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)" }}
          >
            <EyeToggle shown={showPassword} onClick={() => setShowPassword((v) => !v)} />
          </span>
        </div>
        {mode === "signup" && (
          <div style={{ position: "relative", width: "100%" }}>
            <input
              type={showPassword ? "text" : "password"}
              value={confirm}
              onChange={(event) => handleInputChange(event, "confirm")}
              placeholder="Confirm Password"
              aria-label="Confirm Password"
              className="widefill"
              style={{ paddingRight: 36 }}
            />
            <span
              style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)" }}
            >
              <EyeToggle shown={showPassword} onClick={() => setShowPassword((v) => !v)} />
            </span>
          </div>
        )}
        {err && <p className="error-message centered">{err}</p>}
        <button
          type="submit"
          className="widefill login-blue-btn"
          style={{
            background: "#dbeafe",
            color: "#1e3a8a",
            border: "1px solid #93c5fd",
            fontWeight: 700,
            fontSize: "1.05rem",
            minHeight: "2.6rem",
            borderRadius: "10px",
            marginTop: "0.5rem",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "#bfdbfe";
            e.currentTarget.style.borderColor = "#60a5fa";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "#dbeafe";
            e.currentTarget.style.borderColor = "#93c5fd";
          }}
        >
          {mode === "signup" ? "Sign Up" : "Log In"}
        </button>
        <div className="intertext">or</div>
        <button
          className="narrowcenter login-green-btn"
          style={{
            background: "#f0fdf4",
            color: "#166534",
            border: "1px solid #bbf7d0",
            fontWeight: 600,
            fontSize: "1.05rem",
            minHeight: "2.6rem",
            borderRadius: "10px",
            marginTop: "0.5rem",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "#dcfce7";
            e.currentTarget.style.borderColor = "#86efac";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "#f0fdf4";
            e.currentTarget.style.borderColor = "#bbf7d0";
          }}
          onClick={(e) => {
            e.preventDefault();
            toggleMode();
          }}
        >
          {mode === "signup" ? "Use Existing Account" : "Create New Account"}
        </button>
      </form>
      <div className="smallAndGray" style={{ marginTop: "1rem" }}>
        GameNite stores passwords in cleartext; reusing passwords here is a catastrophically bad
        idea
      </div>
    </div>
  );
}
