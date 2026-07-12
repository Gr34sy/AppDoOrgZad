"use client";

import { ArrowDown, ArrowUp } from "lucide-react";

type SortDirectionButtonProps = {
  direction: "asc" | "desc";
  onToggle: () => void;
  className?: string;
};

export function SortDirectionButton({
  direction,
  onToggle,
  className = "h-11"
}: SortDirectionButtonProps) {
  const label = direction === "asc" ? "Ascending" : "Descending";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={`Sort ${label.toLowerCase()}. Click to reverse.`}
      title={label}
      className={`inline-flex items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:border-[var(--app-accent)] hover:text-[var(--app-accent)] sm:min-w-36 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 ${className}`}
    >
      {direction === "asc" ? (
        <ArrowUp aria-hidden="true" className="h-4 w-4" />
      ) : (
        <ArrowDown aria-hidden="true" className="h-4 w-4" />
      )}
      <span className="sr-only sm:not-sr-only">{label}</span>
    </button>
  );
}
