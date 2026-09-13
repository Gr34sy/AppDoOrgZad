"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";

type ConfirmationDialogProps = {
  cancelLabel?: string;
  confirmLabel: string;
  description?: string;
  error?: string | null;
  icon?: ReactNode;
  isOpen: boolean;
  isPending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  variant?: "archive" | "danger" | "success";
};

export function ConfirmationDialog({
  cancelLabel = "Cancel",
  confirmLabel,
  description,
  error,
  icon,
  isOpen,
  isPending = false,
  onCancel,
  onConfirm,
  title,
  variant = "danger"
}: ConfirmationDialogProps) {
  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  const confirmClassName =
    variant === "success"
      ? "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500/30"
      : variant === "archive"
        ? "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500/30"
        : "bg-red-600 hover:bg-red-700 focus:ring-red-500/30";
  const iconClassName =
    variant === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
      : variant === "archive"
        ? "border-amber-200 bg-amber-50 text-yellow-500 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-yellow-300"
        : "border-red-200 bg-red-50 text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300";

  return createPortal(
    <div className="fixed inset-0 z-[100] grid place-items-center bg-zinc-950/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-md border border-zinc-200 bg-white p-5 text-center shadow-2xl shadow-zinc-950/20 dark:border-zinc-800 dark:bg-zinc-950">
        {icon ? (
          <div className={`mx-auto mb-3 grid h-10 w-10 place-items-center rounded-md border ${iconClassName}`}>
            {icon}
          </div>
        ) : null}
        <p className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">{title}</p>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            {description}
          </p>
        ) : null}
        {error ? <p className="mt-3 text-sm text-red-600 dark:text-red-300">{error}</p> : null}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={`inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium text-white transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${confirmClassName}`}
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition hover:border-[var(--app-accent)] hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-[var(--app-accent)] dark:hover:text-white"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
