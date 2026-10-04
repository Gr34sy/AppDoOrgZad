"use client";

import Link from "next/link";
import { ArrowLeft, RotateCcw, SearchX, TriangleAlert } from "lucide-react";

type StatusPageProps = {
  kind: "error" | "not-found";
  onRetry?: () => void;
  withinDashboard?: boolean;
};

export function StatusPage({ kind, onRetry, withinDashboard = false }: StatusPageProps) {
  const isNotFound = kind === "not-found";
  const Icon = isNotFound ? SearchX : TriangleAlert;

  return (
    <section
      className={`grid place-items-center px-5 py-12 text-center ${
        withinDashboard ? "min-h-[calc(100vh-4rem)]" : "min-h-screen bg-[var(--app-background)]"
      }`}
    >
      <div className="w-full max-w-md">
        <Icon
          aria-hidden="true"
          className="mx-auto h-10 w-10 text-[var(--app-accent)]"
          strokeWidth={1.75}
        />
        <p className="mt-5 text-sm font-semibold uppercase text-[var(--app-accent)]">
          {isNotFound ? "404" : "Something went wrong"}
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-950 sm:text-3xl dark:text-zinc-50">
          {isNotFound ? "Page not found" : "We could not load this page"}
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {isNotFound
            ? "The address may be incorrect or the requested item is no longer available."
            : "Try loading the page again. Your saved data has not been changed."}
        </p>
        <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--app-accent)] px-4 text-sm font-medium text-white transition hover:opacity-90"
            >
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
              Try again
            </button>
          ) : null}
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}
