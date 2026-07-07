"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pin } from "lucide-react";

type PinEntityButtonProps = {
  targetType: "note" | "checklist" | "task" | "project";
  targetId: string;
  initialPinId?: string;
  className?: string;
};

export function PinEntityButton({
  targetType,
  targetId,
  initialPinId,
  className = ""
}: PinEntityButtonProps) {
  const router = useRouter();
  const [pinId, setPinId] = useState(initialPinId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleToggle() {
    setError(null);
    setIsSubmitting(true);

    const response = pinId
      ? await fetch(`/api/pins/${pinId}`, { method: "DELETE" })
      : await fetch("/api/pins", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ targetType, targetId })
        });

    if (!response.ok) {
      setError(pinId ? "Nie udało się odpiąć elementu." : "Nie udało się przypiąć elementu.");
      setIsSubmitting(false);
      return;
    }

    const payload = await response.json();
    setPinId(pinId ? "" : String(payload.pin._id));
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <div className={`group relative grid gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={isSubmitting}
        aria-label={pinId ? "Unpin" : "Pin"}
        className={`inline-flex h-11 w-12 items-center justify-center rounded-t-md border text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
          pinId
            ? "border-zinc-950 bg-zinc-950 text-white hover:opacity-90 dark:border-white dark:bg-white dark:text-zinc-950"
            : "border-zinc-200 bg-white text-[var(--app-accent)] hover:border-[var(--app-accent)] dark:border-zinc-800 dark:bg-zinc-950"
        }`}
      >
        <Pin aria-hidden="true" className="h-5 w-5" fill={pinId ? "currentColor" : "none"} />
      </button>
      <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-700 opacity-0 shadow-sm transition group-hover:opacity-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
        {pinId ? "Unpin" : "Pin"}
      </span>
      {error ? <p className="text-sm text-red-600 dark:text-red-300">{error}</p> : null}
    </div>
  );
}
