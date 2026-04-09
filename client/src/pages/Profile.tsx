import React, { useRef } from "react";
import useLoginContext from "../hooks/useLoginContext.ts";
import { useParams } from "react-router-dom";
import UpdateProfile from "./UpdateProfile.tsx";
import ViewProfile from "./ViewProfile.tsx";
import { ParticleCard, GlobalSpotlight } from "../components/ui/MagicBento.tsx";
import "./Profile.css";
import { getCustomBackgroundStyle, isLightHexColor } from "../util/customBackground.ts";

const baseCardStyle: React.CSSProperties = {
  borderRadius: "20px",
  border: "3px solid rgba(116, 148, 235, 0.7)",
  backgroundColor: "#000001",
  padding: "1.5rem",
  color: "white",
};

/** Route to the appropriate page based on username */
export default function Profile() {
  const { username } = useParams();
  const { user } = useLoginContext();
  const gridRef = useRef<HTMLDivElement>(null);
  const isViewingOtherUser = Boolean(username && username !== user.username);
  const customBackground = (user.customBackground || "").trim();
  const useDarkTextForContrast = !isViewingOtherUser && isLightHexColor(customBackground);

  // Determine background style for personal profile
  let personalProfileBackgroundStyle: React.CSSProperties = {};
  if (!isViewingOtherUser) {
    personalProfileBackgroundStyle = getCustomBackgroundStyle(customBackground);
  }

  const cardStyle = !isViewingOtherUser
    ? { ...baseCardStyle, ...personalProfileBackgroundStyle }
    : baseCardStyle;

  return (
    <div className="profile-page bento-section" ref={gridRef}>
      <GlobalSpotlight
        gridRef={gridRef}
        spotlightRadius={500}
        glowColor="116, 148, 235"
        showSpotlight={false}
      />
      <ParticleCard
        className={`profile-card magic-bento-card magic-bento-card--border-glow ${isViewingOtherUser ? "profile-card--public" : ""} ${useDarkTextForContrast ? "profile-card--darkText" : ""}`}
        style={cardStyle}
        glowColor="116, 148, 235"
        particleCount={0}
        enableTilt={false}
        enableMagnetism={false}
      >
        {isViewingOtherUser ? <ViewProfile username={username!} /> : <UpdateProfile />}
      </ParticleCard>
    </div>
  );
}
