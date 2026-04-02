import { useCallback, useEffect, useRef, useState } from "react";

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;
const INACTIVITY_WARNING_MS = 60 * 1000;

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"] as const;

export default function useInactivityForfeit(isActivePlayer: boolean, onForfeit: () => void) {
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(INACTIVITY_WARNING_MS / 1000);

  const clearAllTimers = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    inactivityTimer.current = null;
    warningTimer.current = null;
    countdownInterval.current = null;
  }, []);

  const reset = useCallback(() => {
    clearAllTimers();

    warningTimer.current = setTimeout(() => {
      setShowWarning(true);
      setSecondsLeft(INACTIVITY_WARNING_MS / 1000);
      countdownInterval.current = setInterval(() => {
        setSecondsLeft((s) => Math.max(0, s - 1));
      }, 1000);
    }, INACTIVITY_TIMEOUT_MS - INACTIVITY_WARNING_MS);

    inactivityTimer.current = setTimeout(() => {
      clearAllTimers();
      onForfeit();
    }, INACTIVITY_TIMEOUT_MS);
  }, [clearAllTimers, onForfeit]);

  useEffect(() => {
    if (!isActivePlayer) {
      clearAllTimers();
      return;
    }

    reset();
    const handleActivity = () => {
      setShowWarning(false);
      reset();
    };
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }));

    return () => {
      clearAllTimers();
      setShowWarning(false);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, handleActivity));
    };
  }, [isActivePlayer, reset, clearAllTimers]);

  return { showWarning, secondsLeft, reset };
}
