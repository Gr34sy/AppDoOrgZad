"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DeleteEntityButtonProps = {
  endpoint: string;
  redirectTo: string;
  label: string;
  errorLabel: string;
};

export function DeleteEntityButton({
  endpoint,
  redirectTo,
  label,
  errorLabel
}: DeleteEntityButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setError(null);
    setIsDeleting(true);

    const response = await fetch(endpoint, {
      method: "DELETE"
    });

    if (!response.ok) {
      setError(errorLabel);
      setIsDeleting(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div>
      <button type="button" onClick={handleDelete} disabled={isDeleting}>
        {isDeleting ? "Usuwanie..." : label}
      </button>
      {error ? <p>{error}</p> : null}
    </div>
  );
}
