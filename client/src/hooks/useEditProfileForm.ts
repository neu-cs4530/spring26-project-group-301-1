import { type SubmitEvent, useState } from "react";
import useLoginContext from "./useLoginContext.ts";
import useAuth from "./useAuth.ts";
import { updateUser } from "../services/userService.ts";
import type { UserUpdateRequest } from "@gamenite/shared";

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
  const [color, setColor] = useState(isColor ? initialBg : presetColors[0]);
  const [imageUrl, setImageUrl] = useState(isPresetImg || !isColor ? initialBg : "");
  const [password, setPassword] = useState("");
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
      password === ""
    ) {
      setErr("No changes to submit");
      return;
    }

    if (display.trim() !== display) {
      setErr("Display names can't begin or end with whitespace");
      return;
    }

    if (display.trim() === "") {
      setErr("Please enter a display name");
      return;
    }

    if (password.trim() !== password) {
      setErr("Passwords can't begin or end with whitespace");
      return;
    }

    if (password !== confirm) {
      setErr("Passwords don't match");
      return;
    }

    const updates: UserUpdateRequest = {};
    if (display !== user.display) updates.display = display;
    if (newBg !== (user.customBackground || "")) updates.customBackground = newBg;
    if (password !== "") updates.password = password;
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
    err,
    setErr,
    handleSubmit,
    validateImageUrl,
  };
}
