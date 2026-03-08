import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const WARNING_MS = 2 * 60 * 1000; // Warn 2 minutes before
const EVENTS = ["mousedown", "keydown", "touchstart", "scroll", "mousemove"] as const;

export const useSessionTimeout = () => {
  const { user, signOut } = useAuth();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const warningRef = useRef<ReturnType<typeof setTimeout>>();
  const hasWarnedRef = useRef(false);

  const handleLogout = useCallback(async () => {
    toast.error("Session expired due to inactivity. Please log in again.");
    await signOut();
  }, [signOut]);

  const resetTimer = useCallback(() => {
    if (!user) return;

    hasWarnedRef.current = false;

    if (timerRef.current) clearTimeout(timerRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    // Warning toast before timeout
    warningRef.current = setTimeout(() => {
      if (!hasWarnedRef.current) {
        hasWarnedRef.current = true;
        toast.warning("Your session will expire in 2 minutes due to inactivity.", {
          duration: 10000,
        });
      }
    }, TIMEOUT_MS - WARNING_MS);

    // Actual logout
    timerRef.current = setTimeout(handleLogout, TIMEOUT_MS);
  }, [user, handleLogout]);

  useEffect(() => {
    if (!user) return;

    resetTimer();

    const handler = () => resetTimer();
    EVENTS.forEach((event) => window.addEventListener(event, handler, { passive: true }));

    return () => {
      EVENTS.forEach((event) => window.removeEventListener(event, handler));
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [user, resetTimer]);
};
