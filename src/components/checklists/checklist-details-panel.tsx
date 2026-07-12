"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Edit2, ListChecks, Trash2 } from "lucide-react";
import { DeleteEntityButton } from "@/components/dashboard/delete-entity-button";
import { InlineEditableField } from "@/components/dashboard/inline-editable-field";
import { PinEntityButton } from "@/components/dashboard/pin-entity-button";
import { SaveChangesButton } from "@/components/dashboard/save-changes-button";

type ChecklistDetailsPanelProps = {
  checklistId: string;
  title: string;
  items: {
    title: string;
    isCompleted: boolean;
    completedAt?: string | null;
    position?: number;
  }[];
  createdAtLabel?: string;
  updatedAtLabel?: string;
  pinId?: string;
};

export function ChecklistDetailsPanel({
  checklistId,
  title,
  items,
  createdAtLabel,
  updatedAtLabel,
  pinId
}: ChecklistDetailsPanelProps) {
  const router = useRouter();
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftItems, setDraftItems] = useState(items);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const itemSnapshot = JSON.stringify(
    items.map((item) => ({
      title: item.title,
      isCompleted: item.isCompleted,
      completedAt: item.completedAt ?? null
    }))
  );
  const draftItemSnapshot = JSON.stringify(
    draftItems.map((item) => ({
      title: item.title,
      isCompleted: item.isCompleted,
      completedAt: item.completedAt ?? null
    }))
  );
  const isDirty = draftTitle.trim() !== title.trim() || draftItemSnapshot !== itemSnapshot;

  useEffect(() => {
    setDraftTitle(title);
    setDraftItems(items);
    setEditingItemIndex(null);
  }, [title, items]);

  function resetDrafts() {
    setDraftTitle(title);
    setDraftItems(items);
    setEditingItemIndex(null);
    setError("");
  }

  async function saveChanges() {
    if (!draftTitle.trim()) {
      setDraftTitle(title);
      return;
    }

    setError("");
    setIsSaving(true);
    const response = await fetch(`/api/checklists/${checklistId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: draftTitle.trim(),
        items: draftItems
          .map((item, index) => ({
            title: item.title.trim(),
            isCompleted: item.isCompleted,
            completedAt: item.completedAt ?? null,
            position: index
          }))
          .filter((item) => item.title)
      })
    });

    setIsSaving(false);

    if (!response.ok) {
      setError("Could not save changes.");
      return;
    }

    router.refresh();
  }

  function toggleItem(index: number) {
    setDraftItems((currentItems) =>
      currentItems.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        const isCompleted = !item.isCompleted;

        return {
          ...item,
          isCompleted,
          completedAt: isCompleted ? new Date().toISOString() : null
        };
      })
    );
  }

  function updateItemTitle(index: number, nextTitle: string) {
    setDraftItems((currentItems) =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, title: nextTitle } : item
      )
    );
  }

  function removeItem(index: number) {
    setDraftItems((currentItems) => currentItems.filter((_, itemIndex) => itemIndex !== index));
    setEditingItemIndex(null);
  }

  function cancelItemEdit(index: number) {
    const originalTitle = items[index]?.title ?? "";
    setDraftItems((currentItems) =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, title: originalTitle } : item
      )
    );
    setEditingItemIndex(null);
  }

  return (
    <article className="grid gap-5">
      <div className="flex justify-end px-3">
        <PinEntityButton
          targetType="checklist"
          targetId={checklistId}
          initialPinId={pinId}
          className="-mb-5 z-10"
        />
      </div>
      <div className="rounded-md border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <ListChecks
              aria-hidden="true"
              className="mt-2 h-7 w-7 shrink-0 text-[var(--app-accent)]"
            />
            <div className="min-w-0 flex-1">
              <InlineEditableField
                value={draftTitle}
                onChange={setDraftTitle}
                required
                className="min-w-0 break-words p-1 text-2xl font-semibold tracking-normal text-zinc-950 sm:text-3xl dark:text-zinc-50"
                inputClassName="w-full rounded-md border border-[var(--app-accent)] bg-white px-2 py-1 text-2xl font-semibold text-zinc-950 outline-none ring-2 ring-[var(--app-accent)]/15 sm:text-3xl dark:bg-zinc-900 dark:text-zinc-50"
              />
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
                {createdAtLabel ? (
                  <span>
                    <strong className="font-semibold text-zinc-700 dark:text-zinc-200">Created:</strong>{" "}
                    {createdAtLabel}
                  </span>
                ) : null}
                {updatedAtLabel ? (
                  <span>
                    <strong className="font-semibold text-zinc-700 dark:text-zinc-200">Updated:</strong>{" "}
                    {updatedAtLabel}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="app-action-row">
            <SaveChangesButton
              isDirty={isDirty}
              isSaving={isSaving}
              onClick={saveChanges}
              label="Save"
            />
            {isDirty ? (
              <button
                type="button"
                onClick={resetDrafts}
                disabled={isSaving}
                className="inline-flex h-10 w-full items-center justify-center rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-700 transition hover:border-[var(--app-accent)] hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-[var(--app-accent)] dark:hover:text-white"
              >
                Cancel
              </button>
            ) : null}
            <DeleteEntityButton
              endpoint={`/api/checklists/${checklistId}`}
              redirectTo="/dashboard/checklists"
              label="Delete"
              errorLabel="Could not delete the checklist."
              iconOnly
            />
          </div>
        </div>

        {error ? <p className="mt-4 text-sm text-red-600 dark:text-red-300">{error}</p> : null}

        {draftItems.length ? (
          <ul className="mt-6 grid gap-1">
            {draftItems.map((item, index) => (
              <li
                key={`${item.title}-${index}`}
                className="group relative rounded-md text-sm text-zinc-700 transition [--app-checkbox-check-color:#fff] hover:bg-zinc-50 hover:[--app-checkbox-check-color:#fafafa] dark:text-zinc-200 dark:[--app-checkbox-check-color:#09090b] dark:hover:bg-zinc-900 dark:hover:[--app-checkbox-check-color:#18181b]"
              >
                <div className="flex items-center gap-3 py-3 pl-3 pr-24">
                  <button
                    type="button"
                    onClick={() => toggleItem(index)}
                    aria-pressed={item.isCompleted}
                    aria-label={item.isCompleted ? `Mark ${item.title} as incomplete` : `Mark ${item.title} as complete`}
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded border ${
                      item.isCompleted
                        ? "border-[var(--app-accent)] bg-[var(--app-accent)] text-[var(--app-checkbox-check-color)]"
                        : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-950"
                    } transition`}
                  >
                    {item.isCompleted ? <Check aria-hidden="true" className="h-3 w-3" /> : null}
                  </button>
                  <span className="min-w-0 flex-1">
                    {editingItemIndex === index ? (
                      <input
                        value={item.title}
                        autoFocus
                        onChange={(event) => updateItemTitle(index, event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            setEditingItemIndex(null);
                          }

                          if (event.key === "Escape") {
                            cancelItemEdit(index);
                          }
                        }}
                        onBlur={() => setEditingItemIndex(null)}
                        onClick={(event) => event.stopPropagation()}
                        className="w-full rounded-md border border-[var(--app-accent)] bg-white px-2 py-1 text-sm font-medium text-zinc-950 outline-none ring-2 ring-[var(--app-accent)]/15 dark:bg-zinc-900 dark:text-zinc-50"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleItem(index)}
                        aria-label={item.isCompleted ? `Mark ${item.title} as incomplete` : `Mark ${item.title} as complete`}
                        className={`block w-full min-w-0 cursor-pointer break-words rounded p-1 text-left transition hover:text-[var(--app-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-accent)]/25 ${
                          item.isCompleted ? "line-through opacity-70" : ""
                        }`}
                      >
                        {item.title}
                      </button>
                    )}
                  </span>
                </div>
                <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-2">
                  {editingItemIndex === index ? (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="grid h-8 w-8 place-items-center rounded-md border border-red-200 text-red-600 transition hover:border-red-300 hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:border-red-500/60 dark:hover:bg-red-500/10"
                      aria-label={`Remove ${item.title || "checklist entry"}`}
                      title="Remove"
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4" />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setEditingItemIndex(index)}
                    className="grid h-8 w-8 place-items-center rounded-md border border-zinc-200 text-zinc-600 transition hover:border-[var(--app-accent)] hover:text-[var(--app-accent)] dark:border-zinc-800 dark:text-zinc-300"
                    aria-label={`Edit ${item.title || "checklist entry"}`}
                    title="Edit"
                  >
                    <Edit2 aria-hidden="true" className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">No checklist entries yet.</p>
        )}
      </div>

    </article>
  );
}
