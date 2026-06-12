"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2, X } from "lucide-react";
import { TagInputs } from "@/components/dashboard/tag-inputs";

type ChecklistItemInput = {
  title: string;
  isCompleted: boolean;
};

type ChecklistFormProps = {
  mode: "create" | "edit";
  checklistId?: string;
  initialTitle?: string;
  initialDescription?: string;
  initialTags?: string[];
  initialItems?: ChecklistItemInput[];
  onCancel?: () => void;
  onSaved?: () => void;
};

export function ChecklistForm({
  mode,
  checklistId,
  initialTitle = "",
  initialDescription = "",
  initialTags = [],
  initialItems = [],
  onCancel,
  onSaved
}: ChecklistFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState(initialTags.length ? initialTags : [""]);
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
    const description = String(formData.get("description") ?? "");
    const checklistTags = tags.map((tag) => tag.trim()).filter(Boolean);
    const checklistItems = items
      .map((item, position) => ({
        title: item.title.trim(),
        isCompleted: item.isCompleted,
        completedAt: item.isCompleted ? new Date().toISOString() : null,
        position
      }))
      .filter((item) => item.title);

    if (!title) {
      setError("Tytuł checklisty jest wymagany.");
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
        description,
        tags: checklistTags,
        items: checklistItems
      })
    });

    if (!response.ok) {
      setError(
        mode === "create" ? "Nie udało się dodać checklisty." : "Nie udało się zapisać checklisty."
      );
      setIsSubmitting(false);
      return;
    }

    if (mode === "create") {
      router.push("/dashboard/checklists");
      router.refresh();
      return;
    }

    setMessage("Checklista została zapisana.");
    setIsSubmitting(false);
    onSaved?.();
    router.refresh();
  }

  const inputClass =
    "h-12 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 shadow-sm outline-none transition focus:border-[var(--app-accent)] focus:ring-2 focus:ring-[var(--app-accent)]/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-6 rounded-md border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h2 className="text-lg font-semibold tracking-normal text-zinc-950 dark:text-zinc-50">
        {mode === "create" ? "Create checklist" : "Edit checklist"}
      </h2>

      <div className="grid gap-2">
        <label htmlFor="title" className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
          Title
        </label>
        <input id="title" name="title" type="text" defaultValue={initialTitle} required className={inputClass} />
      </div>

      <div className="grid gap-2">
        <label htmlFor="description" className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={initialDescription}
          className="min-h-36 resize-y rounded-md border border-zinc-300 bg-white px-3 py-3 text-sm leading-6 text-zinc-950 shadow-sm outline-none transition focus:border-[var(--app-accent)] focus:ring-2 focus:ring-[var(--app-accent)]/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>

      <TagInputs tags={tags} onChange={setTags} />

      <fieldset className="grid gap-3">
        <legend className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Items</legend>
        <div className="grid gap-2">
          {items.map((item, index) => (
            <div
              key={index}
              className="grid gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center dark:border-zinc-800 dark:bg-zinc-900"
            >
              <label htmlFor={`item-${index}`} className="sr-only">
                Item {index + 1}
              </label>
              <input
                id={`item-${index}`}
                type="text"
                value={item.title}
                placeholder={`Item ${index + 1}`}
                onChange={(event) => updateItem(index, { ...item, title: event.target.value })}
                className={inputClass}
              />
              <label className="inline-flex h-11 items-center gap-2 rounded-md border border-zinc-300 px-3 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">
                <input
                  type="checkbox"
                  checked={item.isCompleted}
                  onChange={(event) =>
                    updateItem(index, { ...item, isCompleted: event.target.checked })
                  }
                  className="h-4 w-4 accent-[var(--app-accent)]"
                />
                Done
              </label>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="grid h-11 w-11 place-items-center rounded-md border border-zinc-300 text-zinc-500 transition hover:border-red-300 hover:text-red-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-red-500/60 dark:hover:text-red-300"
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
          className="inline-flex h-10 w-fit items-center gap-2 rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-700 transition hover:border-[var(--app-accent)] hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-[var(--app-accent)] dark:hover:text-white"
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

      <div className="flex flex-wrap gap-2">
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
    </form>
  );
}
