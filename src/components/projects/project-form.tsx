"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { TagInputs } from "@/components/dashboard/tag-inputs";

type EntityOption = {
  id: string;
  title: string;
};

type ProjectFormProps = {
  mode: "create" | "edit";
  projectId?: string;
  checklistOptions: EntityOption[];
  initialTitle?: string;
  initialDescription?: string;
  initialPriority?: string;
  initialLifecycleStatus?: string;
  initialDueDate?: string;
  initialEstimatedMinutes?: number | null;
  initialTags?: string[];
  initialChecklistIds?: string[];
  onCancel?: () => void;
  onSaved?: () => void;
};

const priorityOptions = ["low", "medium", "high", "urgent"];
const lifecycleStatusOptions = ["active", "paused", "completed", "archived"];

export function ProjectForm({
  mode,
  projectId,
  checklistOptions,
  initialTitle = "",
  initialDescription = "",
  initialPriority = "medium",
  initialLifecycleStatus = "active",
  initialDueDate = "",
  initialEstimatedMinutes = null,
  initialTags = [],
  initialChecklistIds = [],
  onCancel,
  onSaved
}: ProjectFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState(initialTags.length ? initialTags : [""]);
  const [checklistIds, setChecklistIds] = useState(initialChecklistIds);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const dueDate = String(formData.get("dueDate") ?? "").trim();
    const estimatedValue = String(formData.get("estimatedMinutes") ?? "").trim();

    if (!title) {
      setError("Tytuł projektu jest wymagany.");
      setIsSubmitting(false);
      return;
    }

    const endpoint = mode === "create" ? "/api/projects" : `/api/projects/${projectId}`;
    const response = await fetch(endpoint, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title,
        description: String(formData.get("description") ?? ""),
        priority: String(formData.get("priority") ?? "medium"),
        lifecycleStatus: String(formData.get("lifecycleStatus") ?? "active"),
        dueDate: dueDate ? new Date(`${dueDate}T00:00:00`).toISOString() : null,
        estimatedMinutes: estimatedValue ? Number(estimatedValue) : null,
        tags: tags.map((tag) => tag.trim()).filter(Boolean),
        checklistIds
      })
    });

    if (!response.ok) {
      setError(
        mode === "create" ? "Nie udało się dodać projektu." : "Nie udało się zapisać projektu."
      );
      setIsSubmitting(false);
      return;
    }

    if (mode === "create") {
      router.push("/dashboard/projects");
      router.refresh();
      return;
    }

    setMessage("Projekt został zapisany.");
    setIsSubmitting(false);
    onSaved?.();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>{mode === "create" ? "Dodaj projekt" : "Edytuj projekt"}</h2>

      <div>
        <label htmlFor="title">Tytuł</label>
        <input id="title" name="title" type="text" defaultValue={initialTitle} required />
      </div>

      <div>
        <label htmlFor="description">Opis</label>
        <textarea id="description" name="description" defaultValue={initialDescription} />
      </div>

      <div>
        <label htmlFor="priority">Priorytet</label>
        <select id="priority" name="priority" defaultValue={initialPriority}>
          {priorityOptions.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="lifecycleStatus">Status</label>
        <select id="lifecycleStatus" name="lifecycleStatus" defaultValue={initialLifecycleStatus}>
          {lifecycleStatusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="dueDate">Termin</label>
        <input id="dueDate" name="dueDate" type="date" defaultValue={initialDueDate} />
      </div>

      <div>
        <label htmlFor="estimatedMinutes">Estymacja minut</label>
        <input
          id="estimatedMinutes"
          name="estimatedMinutes"
          type="number"
          min="0"
          defaultValue={initialEstimatedMinutes ?? ""}
        />
      </div>

      <TagInputs tags={tags} onChange={setTags} />

      <fieldset>
        <legend>Checklisty projektu</legend>
        {checklistOptions.map((checklist) => (
          <label key={checklist.id}>
            <input
              type="checkbox"
              checked={checklistIds.includes(checklist.id)}
              onChange={(event) => {
                setChecklistIds((currentChecklistIds) =>
                  event.target.checked
                    ? [...currentChecklistIds, checklist.id]
                    : currentChecklistIds.filter((id) => id !== checklist.id)
                );
              }}
            />
            {checklist.title}
          </label>
        ))}
      </fieldset>

      {error ? <p>{error}</p> : null}
      {message ? <p>{message}</p> : null}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting
          ? "Zapisywanie..."
          : mode === "create"
            ? "Dodaj projekt"
            : "Zapisz projekt"}
      </button>
      {onCancel ? (
        <button type="button" onClick={onCancel}>
          Anuluj
        </button>
      ) : null}
    </form>
  );
}
