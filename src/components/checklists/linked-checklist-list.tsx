"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, ListChecks } from "lucide-react";

export type LinkedChecklistOption = {
  id: string;
  title: string;
  items?: Array<{
    title: string;
    isCompleted?: boolean;
  }>;
};

type LinkedChecklistListProps = {
  checklistIds: string[];
  checklistOptions: LinkedChecklistOption[];
  className?: string;
};

export function LinkedChecklistList({
  checklistIds,
  checklistOptions,
  className = ""
}: LinkedChecklistListProps) {
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const linkedChecklists = checklistIds
    .map((checklistId) => checklistOptions.find((checklist) => checklist.id === checklistId))
    .filter((checklist): checklist is LinkedChecklistOption => Boolean(checklist));

  function toggleChecklist(checklistId: string) {
    setExpandedIds((currentIds) =>
      currentIds.includes(checklistId)
        ? currentIds.filter((currentId) => currentId !== checklistId)
        : [...currentIds, checklistId]
    );
  }

  if (!linkedChecklists.length) {
    return null;
  }

  return (
    <section className={`grid gap-3 ${className}`}>
      <h3 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-normal text-zinc-500 dark:text-zinc-400">
        <ListChecks aria-hidden="true" className="h-4 w-4 text-[var(--app-accent)]" />
        Linked checklists
      </h3>
      <div className="grid gap-2">
        {linkedChecklists.map((checklist) => {
          const isExpanded = expandedIds.includes(checklist.id);

          return (
            <div
              key={checklist.id}
              className="rounded-md border border-zinc-200 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/70"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Link
                  href={`/dashboard/checklists/${checklist.id}`}
                  className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-950 transition hover:text-[var(--app-accent)] dark:text-zinc-50"
                >
                  {checklist.title}
                </Link>
                <button
                  type="button"
                  onClick={() => toggleChecklist(checklist.id)}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition hover:border-[var(--app-accent)] hover:text-[var(--app-accent)] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
                  aria-expanded={isExpanded}
                  aria-label={`${isExpanded ? "Collapse" : "Expand"} ${checklist.title}`}
                  title={isExpanded ? "Collapse" : "Expand"}
                >
                  <ChevronDown
                    aria-hidden="true"
                    className={`h-4 w-4 transition ${isExpanded ? "rotate-180" : ""}`}
                  />
                </button>
              </div>

              {isExpanded ? (
                checklist.items?.length ? (
                  <ul className="mt-3 grid gap-1.5 text-sm text-zinc-600 dark:text-zinc-300">
                    {checklist.items.map((item, index) => (
                      <li key={`${item.title}-${index}`} className="flex min-w-0 items-center gap-2">
                        <span
                          className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${
                            item.isCompleted
                              ? "border-[var(--app-accent)] bg-[var(--app-accent)] text-white"
                              : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-950"
                          }`}
                        >
                          {item.isCompleted ? <Check aria-hidden="true" className="h-3 w-3" /> : null}
                        </span>
                        <span
                          className={`min-w-0 break-words ${
                            item.isCompleted
                              ? "text-zinc-400 line-through decoration-2 decoration-zinc-400 dark:text-zinc-500 dark:decoration-zinc-500"
                              : ""
                          }`}
                        >
                          {item.title}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                    No checklist items yet.
                  </p>
                )
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
