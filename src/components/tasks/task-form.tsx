"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, X } from "lucide-react";
import { TagInputs } from "@/components/dashboard/tag-inputs";

type EntityOption = {
  id: string;
  title: string;
  kanbanColumns?: Array<{
    id: string;
    title: string;
  }>;
};

type TaskFormProps = {
  mode: "create" | "edit";
  taskId?: string;
  projectOptions: EntityOption[];
  checklistOptions: EntityOption[];
  initialTitle?: string;
  initialDescription?: string;
  initialPriority?: string;
  initialStatusId?: string;
  initialProjectId?: string;
  initialDueDate?: string;
  initialEstimatedMinutes?: number | null;
  initialTags?: string[];
  initialChecklistIds?: string[];
  onCancel?: () => void;
  onSaved?: () => void;
};

const priorityOptions = ["low", "medium", "high", "urgent"];
const defaultStatusOptions = [
  { id: "backlog", title: "Backlog" },
  { id: "todo", title: "To do" },
  { id: "in_progress", title: "In progress" },
  { id: "testing", title: "Testing" },
  { id: "done", title: "Done" }
];

export function TaskForm({
  mode,
  taskId,
  projectOptions,
  checklistOptions,
  initialTitle = "",
  initialDescription = "",
  initialPriority = "medium",
  initialStatusId = "todo",
  initialProjectId = "",
  initialDueDate = "",
  initialEstimatedMinutes = null,
  initialTags = [],
  initialChecklistIds = [],
  onCancel,
  onSaved
}: TaskFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState(initialTags.length ? initialTags : [""]);
  const [checklistIds, setChecklistIds] = useState(initialChecklistIds);
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId);
  const [selectedStatusId, setSelectedStatusId] = useState(initialStatusId);
  const selectedProject = projectOptions.find((project) => project.id === selectedProjectId);
  const statusOptions = selectedProject?.kanbanColumns?.length
    ? selectedProject.kanbanColumns
    : defaultStatusOptions;

  useEffect(() => {
    if (!statusOptions.some((status) => status.id === selectedStatusId)) {
      setSelectedStatusId(statusOptions[0]?.id ?? "todo");
    }
  }, [selectedStatusId, statusOptions]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "");
    const projectId = String(formData.get("projectId") ?? "");
    const estimatedValue = String(formData.get("estimatedMinutes") ?? "").trim();
    const dueDate = String(formData.get("dueDate") ?? "").trim();

    if (!title) {
      setError("Tytuł taska jest wymagany.");
      setIsSubmitting(false);
      return;
    }

    const endpoint = mode === "create" ? "/api/tasks" : `/api/tasks/${taskId}`;
    const response = await fetch(endpoint, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title,
        description,
        priority: String(formData.get("priority") ?? "medium"),
        statusId: String(formData.get("statusId") ?? "todo"),
        projectId: projectId || null,
        dueDate: dueDate ? new Date(`${dueDate}T00:00:00`).toISOString() : null,
        estimatedMinutes: estimatedValue ? Number(estimatedValue) : null,
        tags: tags.map((tag) => tag.trim()).filter(Boolean),
        checklistIds
      })
    });

    if (!response.ok) {
      setError(mode === "create" ? "Nie udało się dodać taska." : "Nie udało się zapisać taska.");
      setIsSubmitting(false);
      return;
    }

    if (mode === "create") {
      router.push("/dashboard/tasks");
      router.refresh();
      return;
    }

    setMessage("Task został zapisany.");
    setIsSubmitting(false);
    onSaved?.();
    router.refresh();
  }

  const inputClass =
    "h-12 w-full min-w-0 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 shadow-sm outline-none transition focus:border-[var(--app-accent)] focus:ring-2 focus:ring-[var(--app-accent)]/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";
  const labelClass = "text-sm font-medium text-zinc-700 dark:text-zinc-200";

  return (
    <form
      onSubmit={handleSubmit}
      className="grid w-full min-w-0 gap-6 rounded-md border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h2 className="text-lg font-semibold tracking-normal text-zinc-950 dark:text-zinc-50">
        {mode === "create" ? "Create task" : "Edit task"}
      </h2>

      <div className="grid gap-2">
        <label htmlFor="title" className={labelClass}>
          Title
        </label>
        <input id="title" name="title" type="text" defaultValue={initialTitle} required className={inputClass} />
      </div>

      <div className="grid gap-2">
        <label htmlFor="description" className={labelClass}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={6}
          defaultValue={initialDescription}
          className="min-h-40 w-full min-w-0 resize-y rounded-md border border-zinc-300 bg-white px-3 py-3 text-sm leading-6 text-zinc-950 shadow-sm outline-none transition focus:border-[var(--app-accent)] focus:ring-2 focus:ring-[var(--app-accent)]/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="priority" className={labelClass}>
            Priority
          </label>
          <select id="priority" name="priority" defaultValue={initialPriority} className={inputClass}>
            {priorityOptions.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label htmlFor="statusId" className={labelClass}>
            Status
          </label>
          <select
            id="statusId"
            name="statusId"
            value={selectedStatusId}
            onChange={(event) => setSelectedStatusId(event.target.value)}
            className={inputClass}
          >
            {statusOptions.map((status) => (
              <option key={status.id} value={status.id}>
                {status.title}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label htmlFor="projectId" className={labelClass}>
            Project
          </label>
          <select
            id="projectId"
            name="projectId"
            value={selectedProjectId}
            onChange={(event) => setSelectedProjectId(event.target.value)}
            className={inputClass}
          >
            <option value="">No project</option>
            {projectOptions.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label htmlFor="dueDate" className={labelClass}>
            Due date
          </label>
          <input id="dueDate" name="dueDate" type="date" defaultValue={initialDueDate} className={inputClass} />
        </div>

        <div className="grid gap-2">
          <label htmlFor="estimatedMinutes" className={labelClass}>
            Estimated minutes
          </label>
          <input
            id="estimatedMinutes"
            name="estimatedMinutes"
            type="number"
            min="0"
            defaultValue={initialEstimatedMinutes ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <TagInputs tags={tags} onChange={setTags} />

      <fieldset className="grid gap-3">
        <legend className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          Checklists
        </legend>
        {checklistOptions.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {checklistOptions.map((checklist) => (
              <label
                key={checklist.id}
              className="flex min-w-0 items-center gap-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
              >
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
                  className="h-4 w-4 accent-[var(--app-accent)]"
                />
                <span className="min-w-0 break-words">{checklist.title}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No checklists available.</p>
        )}
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
          {isSubmitting ? "Saving..." : mode === "create" ? "Create task" : "Save task"}
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
