"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

type CardDeleteButtonProps = {
  endpoint: string;
  label?: string;
};

export function CardDeleteButton({ endpoint, label = "Delete" }: CardDeleteButtonProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  async function confirmDelete() {
    setError("");
    setIsDeleting(true);
    const response = await fetch(endpoint, {
      method: "DELETE"
    });

    setIsDeleting(false);

    if (!response.ok) {
      setError("Could not delete the item.");
      return;
    }

    setIsConfirming(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsConfirming(true)}
        aria-label={label}
        title={label}
        className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-md border border-red-200 bg-white/90 text-red-600 opacity-0 shadow-sm transition hover:border-red-300 hover:bg-red-50 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-red-500/30 dark:bg-zinc-950/90 dark:text-red-300 dark:hover:border-red-500/60 dark:hover:bg-red-500/10"
      >
        <Trash2 aria-hidden="true" className="h-4 w-4" />
      </button>

      {isConfirming ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-zinc-950/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-md border border-zinc-200 bg-white p-5 text-center shadow-2xl shadow-zinc-950/20 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
              Are you sure to delete?
            </p>
            {error ? <p className="mt-3 text-sm text-red-600 dark:text-red-300">{error}</p> : null}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={confirmDelete}
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
      ) : null}
    </>
  );
}
