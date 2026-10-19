"use client";

import { ReturnToLink } from "@/components/dashboard/return-to-link";
import { useEffect, useId, useRef, useState } from "react";

export type DashboardMetric = {
  title: string;
  count: number;
  colorKey: "notes" | "checklists" | "tasks" | "projects";
  items: Array<{
    id: string;
    title: string;
    href: string;
    updatedAt: string;
    meta: string;
    priority?: string;
  }>;
};

const metricStyles = {
  notes: "bg-[var(--dashboard-notes-color)]",
  checklists: "bg-[var(--dashboard-checklists-color)]",
  tasks: "bg-[var(--dashboard-tasks-color)]",
  projects: "bg-[var(--dashboard-projects-color)]"
};

const priorityStyles: Record<string, string> = {
  low: "bg-emerald-400",
  medium: "bg-sky-400",
  high: "bg-fuchsia-400",
  urgent: "bg-rose-500"
};

export function DashboardMetricTile({ metric, alignRight }: {
  metric: DashboardMetric;
  alignRight: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!isOpen) return;

    function closeOnOutsideClick(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false);
      }}
      className={`relative rounded-lg shadow-lg shadow-black/20 ${metricStyles[metric.colorKey]} ${isOpen ? "z-20" : "z-0"}`}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-full w-full flex-col items-center justify-center rounded-lg p-3 text-center outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:focus-visible:ring-white"
      >
        <span className="text-[11px] font-medium uppercase text-zinc-200">{metric.title}</span>
        <span className="mt-2 text-2xl font-semibold text-zinc-100">{metric.count}</span>
      </button>
      {isOpen ? (
        <div
          id={panelId}
          className={`absolute left-0 top-full z-30 w-80 max-w-[calc(100vw-2rem)] pt-2 ${alignRight ? "sm:left-auto sm:right-0" : ""}`}
        >
          <div className="max-h-72 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-3 text-zinc-950 shadow-xl shadow-zinc-950/15 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
            {metric.items.length ? metric.items.map((item) => (
              <ReturnToLink
                key={item.id}
                href={item.href}
                className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-lg border-b border-zinc-200 p-2 transition last:border-b-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-950/60"
              >
                <span className={`mt-1 h-2.5 w-2.5 rounded-full ${priorityStyles[item.priority ?? ""] ?? "bg-[var(--dashboard-accent)]"}`} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{item.title}</span>
                  <span className="mt-0.5 block truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {[item.meta, item.updatedAt ? `Updated ${new Date(item.updatedAt).toLocaleDateString("en")}` : "Recently updated"].filter(Boolean).join(" / ")}
                  </span>
                </span>
              </ReturnToLink>
            )) : <p className="text-sm text-zinc-500 dark:text-zinc-400">No recently updated {metric.title.toLowerCase()}</p>}
          </div>
        </div>
      ) : null}
    </div>
  );
}
