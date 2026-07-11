"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

type DeleteEntityButtonProps = {
  endpoint: string;
  redirectTo: string;
  label: string;
  errorLabel: string;
  iconOnly?: boolean;
};

export function DeleteEntityButton({
  endpoint,
  redirectTo,
  label,
  errorLabel,
  iconOnly = false
}: DeleteEntityButtonProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

    setIsConfirming(false);
    router.push(redirectTo);
    router.refresh();
  }

  const confirmationDialog = isConfirming ? (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-zinc-950/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-md border border-zinc-200 bg-white p-5 text-center shadow-2xl shadow-zinc-950/20 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
          Are you sure to delete?
        </p>
        {error ? <p className="mt-3 text-sm text-red-600 dark:text-red-300">{error}</p> : null}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? "Deleting..." : "Yes"}
          </button>
          <button
            type="button"
            onClick={() => setIsConfirming(false)}
            disabled={isDeleting}
            className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition hover:border-[var(--app-accent)] hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-[var(--app-accent)] dark:hover:text-white"
          >
            No
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={() => setIsConfirming(true)}
        disabled={isDeleting}
        aria-label={label}
        title={label}
        className={`inline-flex h-10 items-center justify-center gap-2 rounded-md border border-red-200 text-sm font-medium text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/30 dark:text-red-300 dark:hover:border-red-500/60 dark:hover:bg-red-500/10 ${
          iconOnly ? "w-10 px-0" : "px-3"
        }`}
      >
        <Trash2 aria-hidden="true" className="h-4 w-4" />
        {iconOnly ? (
          <span className="sr-only">{isDeleting ? "Deleting..." : label}</span>
        ) : isDeleting ? (
          "Deleting..."
        ) : (
          label
        )}
      </button>
      {isMounted && confirmationDialog ? createPortal(confirmationDialog, document.body) : null}
      {error && !isConfirming ? <p className="text-sm text-red-600 dark:text-red-300">{error}</p> : null}
    </div>
  );
}
