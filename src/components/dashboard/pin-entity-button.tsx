"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <div>
      <button type="button" onClick={handleToggle} disabled={isSubmitting}>
        {isSubmitting ? "Zapisywanie..." : pinId ? "Odepnij" : "Przypnij"}
      </button>
      {error ? <p>{error}</p> : null}
    </div>
  );
}
