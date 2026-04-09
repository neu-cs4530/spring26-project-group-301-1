import { type SubmitEvent, useState } from "react";
import useLoginContext from "./useLoginContext.ts";
import useAuth from "./useAuth.ts";
import { updateUser } from "../services/userService.ts";
import {
  type UserUpdateRequest,
  type SocialProfileLink,
  type SocialProfilePlatform,
} from "@gamenite/shared";

/**
 * Custom hook to manage profile form logic
 * @returns an object containing
 *  - Form values `display`, `password`, and `confirm`
 *  - Form setters `setDisplay`, `setPassword`, and `setConfirm`
 *  - Possibly-null error message `err`
 *  - Submission handler `handleSubmit`
 */
export default function useEditProfileForm() {
  // Helper for image URL validation
  async function validateImageUrl(url: string): Promise<string | null> {
    if (url && !url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return "Image URL must end with .jpg, .jpeg, .png, .gif, or .webp";
    }
    if (url) {
      try {
        const resp = await fetch(url, { method: "HEAD" });
        const size = resp.headers.get("content-length");
        if (size && parseInt(size) > 2 * 1024 * 1024) {
          return "Image file is too large (max 2MB)";
        }
      } catch {
        return "Could not validate image size. Please check the URL.";
      }
    }
    return null;
  }
  const { user, reset } = useLoginContext();
  const [display, setDisplay] = useState(user.display);
  // backgroundType: 'color' or 'preset'
  const initialBg = user.customBackground || "";
  const presetColors = [
    "#ffffff",
    "#f8f9fa",
    "#e0e0e0",
    "#a7c7e7",
    "#ffe4e1",
    "#d1ffd6",
    "#f7cac9",
    "#b5ead7",
    "#ffb347",
    "#77dd77",
  ];
  function isHexColor(str: string) {
    return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(str);
  }
  function isPresetImage(str: string) {
    return str.startsWith("/backgrounds/");
  }
  const isPreset = presetColors.includes(initialBg);
  const isColor = isPreset || isHexColor(initialBg);
  const isPresetImg = isPresetImage(initialBg);
  const [backgroundType, setBackgroundType] = useState(
    isColor ? "color" : isPresetImg ? "preset" : initialBg ? "image" : "color",
  );
  const [color, setColor] = useState(isColor ? initialBg : "");
  const [imageUrl, setImageUrl] = useState(isPresetImg || !isColor ? initialBg : "");
  const [password, setPassword] = useState("");
  const [hideUsername, setHideUsername] = useState<boolean>(user.hideUsername);
  const [privateProfile, setPrivateProfile] = useState<boolean>(user.privateProfile);
  const [profilesToDelete, setProfilesToDelete] = useState<SocialProfileLink[]>([]);
  const [profilesToAdd, setProfilesToAdd] = useState<SocialProfileLink[]>([]);
  const [socialLink, setSocialLink] = useState("");
  const [socialLinkType, setSocialLinkType] = useState<SocialProfilePlatform | null>(null);
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<null | string>(null);
  const auth = useAuth();

  /**
   * Handles submission of the form
   */
  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newBg = backgroundType === "color" ? color : imageUrl;
    if (
      user.display === display &&
      (user.customBackground || "") === newBg &&
      password === confirm &&
      password === "" &&
      user.hideUsername === hideUsername &&
      user.privateProfile === privateProfile &&
      profilesToAdd.length === 0 &&
      profilesToDelete.length === 0
    ) {
      setErr("No changes to submit");
      return;
    }

    if (display !== user.display && display.trim() !== display) {
      setErr("Display names can't begin or end with whitespace");
      return;
    }

    if (display !== user.display && display.trim() === "") {
      setErr("Please enter a display name");
      return;
    }

    if (password !== "" && password.trim() !== password) {
      setErr("Passwords can't begin or end with whitespace");
      return;
    }

    if (password !== "" && password !== confirm) {
      setErr("Passwords don't match");
      return;
    }

    const updates: UserUpdateRequest = {};
    if (display !== user.display) updates.display = display;
    if (newBg !== (user.customBackground || "")) updates.customBackground = newBg;
    if (password !== "") updates.password = password;
    if (user.hideUsername !== hideUsername) updates.hideUsername = hideUsername;
    if (user.privateProfile !== privateProfile) updates.privateProfile = privateProfile;
    if (profilesToAdd.length > 0) updates.profilesToAdd = profilesToAdd;
    if (profilesToDelete.length > 0) updates.profilesToDelete = profilesToDelete;

    const response = await updateUser(auth, updates);
    if ("error" in response) {
      setErr(response.error);
      return;
    }

    // We need to do this — or do something else that resets the login context
    reset();
  };

  return {
    display,
    setDisplay,
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
    profilesToAdd,
    setProfilesToAdd,
    profilesToDelete,
    setProfilesToDelete,
    socialLink,
    setSocialLink,
    socialLinkType,
    setSocialLinkType,
    err,
    setErr,
    handleSubmit,
    validateImageUrl,
  };
}
