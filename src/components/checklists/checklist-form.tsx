"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
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

  return (
    <form onSubmit={handleSubmit}>
      <h2>{mode === "create" ? "Dodaj checklistę" : "Edytuj checklistę"}</h2>

      <div>
        <label htmlFor="title">Tytuł</label>
        <input id="title" name="title" type="text" defaultValue={initialTitle} required />
      </div>

      <div>
        <label htmlFor="description">Opis</label>
        <textarea id="description" name="description" defaultValue={initialDescription} />
      </div>

      <TagInputs tags={tags} onChange={setTags} />

      <fieldset>
        <legend>Elementy</legend>
        {items.map((item, index) => (
          <div key={index}>
            <label htmlFor={`item-${index}`}>Element {index + 1}</label>
            <input
              id={`item-${index}`}
              type="text"
              value={item.title}
              onChange={(event) => updateItem(index, { ...item, title: event.target.value })}
            />
            <label>
              <input
                type="checkbox"
                checked={item.isCompleted}
                onChange={(event) =>
                  updateItem(index, { ...item, isCompleted: event.target.checked })
                }
              />
              ukończone
            </label>
            <button type="button" onClick={() => removeItem(index)}>
              Usuń element
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setItems([...items, { title: "", isCompleted: false }])}>
          Dodaj element
        </button>
      </fieldset>

      {error ? <p>{error}</p> : null}
      {message ? <p>{message}</p> : null}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting
          ? "Zapisywanie..."
          : mode === "create"
            ? "Dodaj checklistę"
            : "Zapisz checklistę"}
      </button>
      {onCancel ? (
        <button type="button" onClick={onCancel}>
          Anuluj
        </button>
      ) : null}
    </form>
  );
}
