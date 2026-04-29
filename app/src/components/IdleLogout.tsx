"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface Props {
  logoutEndpoint: "/api/admin/logout" | "/api/seller/logout";
  redirectTo: string;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000;

export default function IdleLogout({ logoutEndpoint, redirectTo, timeoutMs = DEFAULT_TIMEOUT_MS }: Props) {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loggingOutRef = useRef(false);

  useEffect(() => {
    async function logoutForIdle() {
      if (loggingOutRef.current) return;
      loggingOutRef.current = true;

      try {
        await fetch(logoutEndpoint, { method: "POST" });
      } catch {
        // Ignore network errors and continue with redirect.
      } finally {
        router.replace(redirectTo);
        router.refresh();
      }
    }

    function resetTimer() {
      if (loggingOutRef.current) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(logoutForIdle, timeoutMs);
    }

    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "focus",
    ];

    events.forEach((eventName) => {
      window.addEventListener(eventName, resetTimer, { passive: true });
    });

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        resetTimer();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((eventName) => {
        window.removeEventListener(eventName, resetTimer);
      });
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [logoutEndpoint, redirectTo, router, timeoutMs]);

  return null;
}
