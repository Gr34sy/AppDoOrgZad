"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive as ArchiveIcon } from "lucide-react";
import { ConfirmationDialog } from "@/components/dashboard/confirmation-dialog";

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
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  async function handleArchive() {
    setError(null);
    setIsArchiving(true);

    const response = await fetch(endpoint, {
      method: "DELETE"
    });

    if (!response.ok) {
      setError(errorLabel);
      setIsArchiving(false);
      return;
    }

    setIsConfirming(false);
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={() => setIsConfirming(true)}
        disabled={isArchiving}
        aria-label={label}
        title={label}
        className={`inline-flex h-10 items-center justify-center gap-2 rounded-md text-sm font-medium text-amber-700 transition hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:text-amber-300 dark:hover:bg-amber-500/10 ${
          iconOnly ? "w-10 px-0" : "px-3"
        }`}
      >
        <ArchiveIcon aria-hidden="true" className="h-4 w-4 text-yellow-500 dark:text-yellow-300" />
        {iconOnly ? (
          <span className="sr-only">{isArchiving ? "Archiving..." : label}</span>
        ) : isArchiving ? (
          "Archiving..."
        ) : (
          label
        )}
      </button>
      <ConfirmationDialog
        isOpen={isConfirming}
        title="Archive this item?"
        description="The item will be moved to the archive. You can restore it later from the Archive page."
        confirmLabel={isArchiving ? "Archiving..." : "Archive"}
        cancelLabel="Cancel"
        error={error}
        icon={<ArchiveIcon aria-hidden="true" className="h-5 w-5 text-yellow-500 dark:text-yellow-300" />}
        isPending={isArchiving}
        onCancel={() => setIsConfirming(false)}
        onConfirm={() => void handleArchive()}
        variant="archive"
      />
      {error && !isConfirming ? <p className="text-sm text-red-600 dark:text-red-300">{error}</p> : null}
    </div>
  );
}
