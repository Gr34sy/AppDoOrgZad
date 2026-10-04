"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, Save, Trash2, X } from "lucide-react";
import { FormShell } from "@/components/dashboard/form-shell";
import { getCreatedEntityId } from "@/lib/created-entity-response";

type ChecklistItemInput = {
  title: string;
  isCompleted: boolean;
};

type ChecklistFormProps = {
  mode: "create" | "edit";
  checklistId?: string;
  initialTitle?: string;
  initialItems?: ChecklistItemInput[];
  returnTo?: string;
  onCancel?: () => void;
  onSaved?: () => void;
};

export function ChecklistForm({
  mode,
  checklistId,
  initialTitle = "",
  initialItems = [],
  returnTo = "/dashboard/checklists",
  onCancel,
  onSaved
}: ChecklistFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [items, setItems] = useState<ChecklistItemInput[]>(
    initialItems.length ? initialItems : [{ title: "", isCompleted: false }]
  );

  function updateItem(index: number, item: ChecklistItemInput) {
    const nextItems = [...items];
    nextItems[index] = item;
    setItems(nextItems);
  }

  function removeItem(index: number) {
    const nextItems = items.filter((_, itemIndex) => itemIndex !== index);
    setItems(nextItems.length ? nextItems : [{ title: "", isCompleted: false }]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const checklistItems = items
      .map((item, position) => ({
        title: item.title.trim(),
        isCompleted: item.isCompleted,
        completedAt: item.isCompleted ? new Date().toISOString() : null,
        position
      }))
      .filter((item) => item.title);

    if (!title) {
      setError("Checklist title is required.");
      setIsSubmitting(false);
      return;
    }

    const endpoint = mode === "create" ? "/api/checklists" : `/api/checklists/${checklistId}`;
    const response = await fetch(endpoint, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title,
        items: checklistItems
      })
    });

    if (!response.ok) {
      setError(
        mode === "create" ? "Could not create the checklist." : "Could not save the checklist."
      );
      setIsSubmitting(false);
      return;
    }

    if (mode === "create") {
      const createdChecklistId = await getCreatedEntityId(response, "checklist");

      router.push(
        createdChecklistId ? `/dashboard/checklists/${createdChecklistId}` : returnTo
      );
      router.refresh();
      return;
    }

    setMessage("Checklist saved.");
    setIsSubmitting(false);
    onSaved?.();
    router.refresh();
  }

  const inputClass = "app-form-control";

  return (
    <FormShell entityType="checklist" mode={mode} onSubmit={handleSubmit}>
      <div className="app-form-field">
        <label htmlFor="title" className="app-form-label">
          Title
        </label>
        <input id="title" name="title" type="text" defaultValue={initialTitle} required className={inputClass} />
      </div>

      <fieldset className="grid gap-3">
        <legend className="app-form-legend">Items</legend>
        <div className="grid gap-1">
          {items.map((item, index) => (
            <div
              key={index}
              className="group relative flex min-w-0 items-center gap-3 rounded-md py-3 pl-3 pr-12 text-sm text-zinc-700 transition hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              <button
                type="button"
                onClick={() => updateItem(index, { ...item, isCompleted: !item.isCompleted })}
                aria-pressed={item.isCompleted}
                aria-label={item.isCompleted ? `Mark item ${index + 1} as incomplete` : `Mark item ${index + 1} as complete`}
                className={`grid h-5 w-5 shrink-0 place-items-center rounded border transition ${
                  item.isCompleted
                    ? "border-[var(--app-accent)] bg-[var(--app-accent)] text-white"
                    : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-950"
                }`}
              >
                {item.isCompleted ? <Check aria-hidden="true" className="h-3 w-3" /> : null}
              </button>
              <label htmlFor={`item-${index}`} className="sr-only">
                Item {index + 1}
              </label>
              <input
                id={`item-${index}`}
                type="text"
                value={item.title}
                placeholder={`Item ${index + 1}`}
                onChange={(event) => updateItem(index, { ...item, title: event.target.value })}
                className={`min-w-0 flex-1 cursor-pointer rounded bg-transparent p-1 text-sm outline-none transition hover:bg-zinc-100/80 focus:bg-zinc-100/80 dark:hover:bg-zinc-800/70 dark:focus:bg-zinc-800/70 ${
                  item.isCompleted ? "text-zinc-400 line-through dark:text-zinc-500" : ""
                }`}
              />
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-zinc-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 focus-visible:opacity-100 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                aria-label={`Remove item ${index + 1}`}
                title="Remove item"
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setItems([...items, { title: "", isCompleted: false }])}
          className="app-form-secondary-button"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          Add item
        </button>
      </fieldset>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
          {message}
        </p>
      ) : null}

      <div className="app-action-row">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 items-center gap-2 rounded-md bg-[var(--app-accent)] px-4 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save aria-hidden="true" className="h-4 w-4" />
          {isSubmitting
            ? "Saving..."
            : mode === "create"
              ? "Create checklist"
              : "Save checklist"}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-11 items-center gap-2 rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition hover:border-zinc-500 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-white"
          >
            <X aria-hidden="true" className="h-4 w-4" />
            Cancel
          </button>
        ) : null}
      </div>
    </FormShell>
  );
}
