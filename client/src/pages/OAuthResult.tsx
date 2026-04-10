import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./Login.css";

/**
 * Landing page for OAuth callbacks. Reads oauth_error or oauth_success from
 * query params, displays the result, then redirects the user to the login page.
 */
export default function OAuthResult() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const error = params.get("oauth_error");
  const success = params.get("oauth_success");
  const username = params.get("username");

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login");
    }, 3000);
    return () => clearTimeout(timer);
  }, [success, username, navigate]);

  return (
    <div className="login-page">
      <div className="login">
        <h1 className="login__brand">PlaySpace</h1>
        {success ? (
          <>
            <h2 className="login__title">Verification Successful</h2>
            <p className="centered">{success}</p>
          </>
        ) : (
          <>
            <h2 className="login__title">Verification Failed</h2>
            <p className="error-message centered">{error ?? "An unknown error occurred"}</p>
          </>
        )}
        <p className="smallAndGray centered">
          {success && username ? "Redirecting to your profile..." : "Redirecting to login..."}
        </p>
      </div>
    </div>
  );
}
