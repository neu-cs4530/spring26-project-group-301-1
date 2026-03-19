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

  return (
    <div className="profile-page">
      <div className="profile-card">
        {isViewingOtherUser ? <ViewProfile username={username!} /> : <UpdateProfile />}
      </div>
    </div>
  );
}
