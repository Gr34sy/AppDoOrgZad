"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pin } from "lucide-react";

type PinEntityButtonProps = {
  targetType: "note" | "checklist" | "task" | "project";
  targetId: string;
  initialPinId?: string;
};

export function PinEntityButton({ targetType, targetId, initialPinId }: PinEntityButtonProps) {
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
    <div className="grid gap-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isSubmitting}
        className={`inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
          pinId
            ? "border-[var(--app-accent)] bg-[var(--app-accent)] text-white hover:opacity-90"
            : "border-zinc-300 text-zinc-700 hover:border-[var(--app-accent)] hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-[var(--app-accent)] dark:hover:text-white"
        }`}
      >
        <Pin aria-hidden="true" className="h-4 w-4" />
        {isSubmitting ? "Saving..." : pinId ? "Pinned" : "Pin"}
      </button>
      {error ? <p className="text-sm text-red-600 dark:text-red-300">{error}</p> : null}
    </div>
  );
}
