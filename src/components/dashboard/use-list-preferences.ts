"use client";

import { useEffect, useRef, useState } from "react";
import type { ListControlSettings, ListPreferenceScope } from "@/lib/list-preferences";

// Serialize saves for each view, including when its component is unmounted and reopened.
const pendingSaves = new Map<ListPreferenceScope, Promise<unknown>>();

export function useListPreferences(scope: ListPreferenceScope, settings: ListControlSettings) {
  const serialized = JSON.stringify(settings);
  const previous = useRef(serialized);
  const [error, setError] = useState("");

  useEffect(() => {
    if (previous.current === serialized) return;
    previous.current = serialized;
    let active = true;
    const save = (pendingSaves.get(scope) ?? Promise.resolve()).catch(() => undefined).then(async () => {
      const response = await fetch("/api/user-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listControls: { scope, settings: JSON.parse(serialized) } }),
        keepalive: true
      });
      if (!response.ok) throw new Error("Could not save list preferences.");
    });
    pendingSaves.set(scope, save);
    void save.then(() => {
      if (active) setError("");
    }).catch(() => {
      if (active) setError("Could not save list preferences. Change a control to try again.");
    }).finally(() => {
      if (pendingSaves.get(scope) === save) pendingSaves.delete(scope);
    });
    return () => { active = false; };
  }, [scope, serialized]);

  return error;
}
