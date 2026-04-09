import React from "react";
import type { SocialProfileLink, SocialProfilePlatform } from "@gamenite/shared";
import {
  SquarePlay,
  Bird,
  Camera,
  CircleAlert,
  CircleCheck,
  MessageSquareQuote,
  type LucideIcon,
} from "lucide-react";

type PlatformMeta = {
  label: string;
  icon: LucideIcon;
  color: string;
  supportsVerification: boolean;
};

const platformMeta: Record<SocialProfilePlatform, PlatformMeta> = {
  youtube: { label: "YouTube", icon: SquarePlay, color: "red", supportsVerification: true },
  twitter: { label: "Twitter/X", icon: Bird, color: "blue", supportsVerification: false },
  instagram: { label: "Instagram", icon: Camera, color: "pink", supportsVerification: false },
  twitch: {
    label: "Twitch",
    icon: MessageSquareQuote,
    color: "purple",
    supportsVerification: true,
  },
};

/**
 * Props for SocialPlatformLink.
 * - `link`: the SocialProfileLink to display
 * - `verifyPlatform`: callback to verify the link
 * - `deletePlatform`: callback to delete the linked social media account for the platform
 * - `modifyable`: boolean to control whether or not link should be verify-able or delete-able
 *        (helpful for displaying to own vs other users)
 * - `queued`: whether or not the link is queued to be added/deleted
 */
interface SocialPlatformLinkProps {
  link: SocialProfileLink;
  verifyPlatform: (link: SocialProfileLink) => void;
  deletePlatform: (link: SocialProfileLink) => void;
  modifyable: boolean;
  queued: boolean;
}

/**
 * Helper function to get styled div for link based on the platform type
 * @param link the SocialProfileLink to style and display
 * @returns JSX element to display for link
 */
export function getIconByPlatform(link: SocialProfileLink) {
  const { icon, color, label } = platformMeta[link.type];
  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      {React.createElement(icon, { color })}
      <p style={{ paddingLeft: "6px" }}>{label}</p>
    </div>
  );
}

export default function SocialPlatformLink({
  link,
  verifyPlatform,
  deletePlatform,
  modifyable,
  queued,
}: SocialPlatformLinkProps) {
  return (
    <div className="linkedSocialMediaCard">
      <a href={link.link} target="_blank">
        {getIconByPlatform(link)}
      </a>
      {link.verified ? (
        <p title="This profile is verified.">
          <CircleCheck color="green" />
        </p>
      ) : modifyable ? (
        platformMeta[link.type].supportsVerification ? (
          <button
            className="profilePrimaryButton"
            type="button"
            onClick={() => verifyPlatform(link)}
          >
            Verify
          </button>
        ) : (
          <p className="smallAndGray">Platform does not support verification</p>
        )
      ) : (
        <p title="Warning! This profile is unverified. Verification is supported for Twitch and YouTube accounts.">
          <CircleAlert color="orange" />
        </p>
      )}
      <button
        className="profileDangerButton"
        type="button"
        onClick={() => deletePlatform(link)}
        disabled={queued}
      >
        {queued ? "Queued for deletion" : "Delete Link"}
      </button>
    </div>
  );
}
