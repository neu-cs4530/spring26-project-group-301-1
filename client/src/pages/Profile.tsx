import useLoginContext from "../hooks/useLoginContext.ts";
import { useParams } from "react-router-dom";
import UpdateProfile from "./UpdateProfile.tsx";
import ViewProfile from "./ViewProfile.tsx";
import "./Profile.css";

/** Route to the appropriate page based on username */
export default function Profile() {
  const { username } = useParams();
  const { user } = useLoginContext();

  const isViewingOtherUser = Boolean(username && username !== user.username);

  // Determine background style for personal profile
  let personalProfileBackgroundStyle = {};
  if (!isViewingOtherUser) {
    const customBackground = (user.customBackground || "").trim();
    if (customBackground) {
      const isHex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(customBackground);
      if (isHex) {
        personalProfileBackgroundStyle = { backgroundColor: customBackground };
      } else {
        personalProfileBackgroundStyle = {
          backgroundImage: `url("${customBackground}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        };
      }
    }
  }

  return (
    <div className="profile-page">
      <div
        className={`profile-card ${isViewingOtherUser ? "profile-card--public" : ""}`}
        style={!isViewingOtherUser ? personalProfileBackgroundStyle : undefined}
      >
        {isViewingOtherUser ? <ViewProfile username={username!} /> : <UpdateProfile />}
      </div>
    </div>
  );
}
