"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

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
    <div className="grid gap-2">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="inline-flex h-10 items-center gap-2 rounded-md border border-red-200 px-3 text-sm font-medium text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/30 dark:text-red-300 dark:hover:border-red-500/60 dark:hover:bg-red-500/10"
      >
        <Trash2 aria-hidden="true" className="h-4 w-4" />
        {isDeleting ? "Deleting..." : label}
      </button>
      {error ? <p className="text-sm text-red-600 dark:text-red-300">{error}</p> : null}
    </div>
  );
}
