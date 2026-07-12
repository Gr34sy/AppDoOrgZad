"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2, X } from "lucide-react";
import { FormShell } from "@/components/dashboard/form-shell";
import { TagEditor } from "@/components/dashboard/tag-editor";

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
  noteOptions: EntityOption[];
  initialTitle?: string;
  initialDescription?: string;
  initialPriority?: string;
  initialStatusId?: string;
  initialProjectId?: string;
  initialDueDate?: string;
  initialTags?: string[];
  initialChecklistIds?: string[];
  initialNoteIds?: string[];
  onCancel?: () => void;
  onSaved?: () => void;
};

const priorityOptions = ["low", "medium", "high", "urgent"];

export function TaskForm({
  mode,
  taskId,
  projectOptions,
  checklistOptions,
  noteOptions,
  initialTitle = "",
  initialDescription = "",
  initialPriority = "medium",
  initialStatusId = "todo",
  initialProjectId = "",
  initialDueDate = "",
  initialTags = [],
  initialChecklistIds = [],
  initialNoteIds = [],
  onCancel,
  onSaved
}: TaskFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState(initialTags.length ? initialTags : [""]);
  const [checklistIds, setChecklistIds] = useState(initialChecklistIds);
  const [noteIds, setNoteIds] = useState(initialNoteIds);
  const [newChecklistTitles, setNewChecklistTitles] = useState<string[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId);
  const [selectedStatusId, setSelectedStatusId] = useState(initialStatusId);
  const selectedProject = useMemo(
    () => projectOptions.find((project) => project.id === selectedProjectId),
    [projectOptions, selectedProjectId]
  );
  const projectStatusOptions = useMemo(
    () => selectedProject?.kanbanColumns ?? [],
    [selectedProject]
  );
  const isProjectTask = Boolean(selectedProjectId);

  function addNewChecklist() {
    setNewChecklistTitles((currentTitles) => [...currentTitles, ""]);
  }

  function updateNewChecklist(index: number, title: string) {
    setNewChecklistTitles((currentTitles) =>
      currentTitles.map((currentTitle, titleIndex) => titleIndex === index ? title : currentTitle)
    );
  }

  function removeNewChecklist(index: number) {
    setNewChecklistTitles((currentTitles) =>
      currentTitles.filter((_, titleIndex) => titleIndex !== index)
    );
  }

  useEffect(() => {
    if (
      isProjectTask &&
      projectStatusOptions.length &&
      !projectStatusOptions.some((status) => status.id === selectedStatusId)
    ) {
      setSelectedStatusId(projectStatusOptions[0]?.id ?? "todo");
    }
  }, [isProjectTask, projectStatusOptions, selectedStatusId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "");
    const projectId = String(formData.get("projectId") ?? "");
    const statusId = String(formData.get("statusId") ?? "").trim() || "todo";
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
        statusId,
        projectId: projectId || null,
        dueDate: dueDate ? new Date(`${dueDate}T00:00:00`).toISOString() : null,
        tags: tags.map((tag) => tag.trim()).filter(Boolean),
        checklistIds,
        newChecklists: newChecklistTitles
          .map((checklistTitle) => ({ title: checklistTitle.trim() }))
          .filter((checklist) => checklist.title),
        noteIds
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

  return (
    <FormShell entityType="task" mode={mode} onSubmit={handleSubmit}>
      <div className="app-form-field">
        <label htmlFor="title" className="app-form-label">
          Title
        </label>
        <input id="title" name="title" type="text" defaultValue={initialTitle} required className="app-form-control" />
      </div>

      <div className="app-form-field">
        <label htmlFor="description" className="app-form-label">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={6}
          defaultValue={initialDescription}
          className="app-form-textarea min-h-40"
        />
      </div>

      <div className="app-form-section">
        <div className="app-form-grid">
        <div className="app-form-field">
          <label htmlFor="priority" className="app-form-label">
            Priority
          </label>
          <select id="priority" name="priority" defaultValue={initialPriority} className="app-form-control">
            {priorityOptions.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </div>

        <div className="app-form-field">
          <label htmlFor="statusId" className="app-form-label">
            Status
          </label>
          {isProjectTask ? (
            <select
              id="statusId"
              name="statusId"
              value={selectedStatusId}
              onChange={(event) => setSelectedStatusId(event.target.value)}
              className="app-form-control"
            >
              {projectStatusOptions.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.title}
                </option>
              ))}
            </select>
          ) : (
            <input
              id="statusId"
              name="statusId"
              type="text"
              value={selectedStatusId}
              onChange={(event) => setSelectedStatusId(event.target.value)}
              placeholder="todo"
              className="app-form-control"
            />
          )}
        </div>

        <div className="app-form-field">
          <label htmlFor="projectId" className="app-form-label">
            Project
          </label>
          <select
            id="projectId"
            name="projectId"
            value={selectedProjectId}
            onChange={(event) => setSelectedProjectId(event.target.value)}
            className="app-form-control"
          >
            <option value="">No project</option>
            {projectOptions.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </div>

        <div className="app-form-field">
          <label htmlFor="dueDate" className="app-form-label">
            Due date
          </label>
          <input id="dueDate" name="dueDate" type="date" defaultValue={initialDueDate} className="app-form-control" />
        </div>
        </div>
      </div>

      <TagEditor tags={tags} onChange={setTags} />

      <fieldset className="grid gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <legend className="app-form-legend">
            Checklists
          </legend>
          <button
            type="button"
            onClick={addNewChecklist}
            className="app-form-secondary-button sm:w-auto"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Add checklist
          </button>
        </div>
        {checklistOptions.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {checklistOptions.map((checklist) => (
              <label
                key={checklist.id}
                className="app-form-checkbox-card"
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
                  className="app-form-checkbox"
                />
                <span className="min-w-0 break-words">{checklist.title}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No checklists available.</p>
        )}
        {newChecklistTitles.length ? (
          <div className="grid gap-2">
            {newChecklistTitles.map((newChecklistTitle, index) => (
              <div
                key={index}
                className="grid gap-2 rounded-md bg-zinc-50/80 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end dark:bg-zinc-900/70"
              >
                <label className="app-form-field">
                  <span className="app-form-label">New checklist title</span>
                  <input
                    type="text"
                    value={newChecklistTitle}
                    onChange={(event) => updateNewChecklist(index, event.target.value)}
                    className="app-form-control"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removeNewChecklist(index)}
                  className="app-form-icon-button w-full sm:w-11"
                  aria-label="Remove new checklist"
                  title="Remove checklist"
                >
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="app-form-legend">
          Linked notes
        </legend>
        {noteOptions.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {noteOptions.map((note) => (
              <label key={note.id} className="app-form-checkbox-card">
                <input
                  type="checkbox"
                  checked={noteIds.includes(note.id)}
                  onChange={(event) => {
                    setNoteIds((currentNoteIds) =>
                      event.target.checked
                        ? [...currentNoteIds, note.id]
                        : currentNoteIds.filter((id) => id !== note.id)
                    );
                  }}
                  className="app-form-checkbox"
                />
                <span className="min-w-0 break-words">{note.title}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No notes available.</p>
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
    </FormShell>
  );
}
