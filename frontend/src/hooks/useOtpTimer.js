/**
 * useOtpTimer — countdown timer for OTP expiry.
 * Returns { timeLeft, isExpired, restart }
 */
import { useState, useEffect, useCallback } from "react";

export function useOtpTimer(seconds = 180) {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft]);

  const restart = useCallback(() => setTimeLeft(seconds), [seconds]);

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");

  return { timeLeft, isExpired: timeLeft <= 0, display: `${mm}:${ss}`, restart };
}