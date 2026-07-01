"use client";

import { useState } from "react";
import { Check, Clock, Edit3, ListChecks, Tag } from "lucide-react";
import { ChecklistForm } from "@/components/checklists/checklist-form";
import { DeleteEntityButton } from "@/components/dashboard/delete-entity-button";
import { PinEntityButton } from "@/components/dashboard/pin-entity-button";

type ChecklistDetailsPanelProps = {
  checklistId: string;
  title: string;
  description: string;
  tags: string[];
  items: {
    title: string;
    isCompleted: boolean;
  }[];
  parentType?: string | null;
  createdAtLabel?: string;
  updatedAtLabel?: string;
  pinId?: string;
};

export function ChecklistDetailsPanel({
  checklistId,
  title,
  description,
  tags,
  items,
  parentType,
  createdAtLabel,
  updatedAtLabel,
  pinId
}: ChecklistDetailsPanelProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <ChecklistForm
        mode="edit"
        checklistId={checklistId}
        initialTitle={title}
        initialDescription={description}
        initialTags={tags}
        initialItems={items}
        onCancel={() => setIsEditing(false)}
        onSaved={() => setIsEditing(false)}
      />
    );
  }

  return (
    <article className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-3 text-sm font-medium text-zinc-600 dark:text-zinc-300">
          <ListChecks aria-hidden="true" className="h-5 w-5 text-[var(--app-accent)]" />
          Checklist details
        </div>
        <div className="app-action-row">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-700 transition hover:border-[var(--app-accent)] hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-[var(--app-accent)] dark:hover:text-white"
          >
            <Edit3 aria-hidden="true" className="h-4 w-4" />
            Edit
          </button>
          <PinEntityButton targetType="checklist" targetId={checklistId} initialPinId={pinId} />
          <DeleteEntityButton
            endpoint={`/api/checklists/${checklistId}`}
            redirectTo="/dashboard/checklists"
            label="Delete"
            errorLabel="Could not delete the checklist."
          />
        </div>
      </div>

      <div className="rounded-md border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="break-words text-2xl font-semibold tracking-normal text-zinc-950 sm:text-3xl dark:text-zinc-50">
              {title}
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {items.length} {items.length === 1 ? "item" : "items"}
              {parentType ? ` / parent: ${parentType}` : ""}
            </p>
          </div>
          <ListChecks aria-hidden="true" className="h-7 w-7 text-[var(--app-accent)]" />
        </div>

        {description ? (
          <p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-zinc-700 dark:text-zinc-300">
            {description}
          </p>
        ) : null}

        {tags.length ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
              >
                <Tag aria-hidden="true" className="h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold tracking-normal text-zinc-950 dark:text-zinc-50">
          Items
        </h2>
        {items.length ? (
          <ul className="mt-4 grid gap-2">
            {items.map((item, index) => (
              <li
                key={`${item.title}-${index}`}
                className="flex items-center gap-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
              >
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded border ${
                    item.isCompleted
                      ? "border-[var(--app-accent)] bg-[var(--app-accent)] text-white"
                      : "border-zinc-300 dark:border-zinc-700"
                  }`}
                >
                  {item.isCompleted ? <Check aria-hidden="true" className="h-3 w-3" /> : null}
                </span>
                {item.title}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">No items yet.</p>
        )}
      </div>

      <div className="grid gap-3 rounded-md border border-zinc-200 bg-white p-4 text-sm text-zinc-600 shadow-sm sm:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
        {createdAtLabel ? (
          <p className="inline-flex items-center gap-2">
            <Clock aria-hidden="true" className="h-4 w-4 text-[var(--app-accent)]" />
            Created {createdAtLabel}
          </p>
        ) : null}
        {updatedAtLabel ? (
          <p className="inline-flex items-center gap-2">
            <Clock aria-hidden="true" className="h-4 w-4 text-[var(--app-accent)]" />
            Updated {updatedAtLabel}
          </p>
        ) : null}
      </div>
    </article>
  );
}
