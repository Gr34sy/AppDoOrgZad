"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type RealtimeEvent = {
  type?: string;
};

export function RealtimeRefresh() {
  const router = useRouter();
  const lastRefreshAt = useRef(0);

  useEffect(() => {
    const eventSource = new EventSource("/api/realtime");

    eventSource.onmessage = (event) => {
      let payload: RealtimeEvent;

      try {
        payload = JSON.parse(event.data) as RealtimeEvent;
      } catch {
        return;
      }

      if (payload.type === "connected") {
        return;
      }

      const now = Date.now();

      if (now - lastRefreshAt.current < 1000) {
        return;
      }

      lastRefreshAt.current = now;
      router.refresh();
    };

    return () => eventSource.close();
  }, [router]);

  return null;
}
