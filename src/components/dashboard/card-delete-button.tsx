"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive as ArchiveIcon } from "lucide-react";
import { ConfirmationDialog } from "@/components/dashboard/confirmation-dialog";

type CardDeleteButtonProps = {
  endpoint: string;
  label?: string;
};

export function CardDeleteButton({ endpoint, label = "Archive" }: CardDeleteButtonProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState("");

  async function confirmArchive() {
    setError("");
    setIsArchiving(true);
    const response = await fetch(endpoint, {
      method: "DELETE"
    });

    setIsArchiving(false);

    if (!response.ok) {
      setError("Could not archive the item.");
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
        className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-md text-amber-700 transition hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100 dark:text-amber-300 dark:hover:bg-amber-500/10"
      >
        <ArchiveIcon aria-hidden="true" className="h-4 w-4 text-yellow-500 dark:text-yellow-300" />
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
        onConfirm={() => void confirmArchive()}
        variant="archive"
      />
    </>
  );
}
