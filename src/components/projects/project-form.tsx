"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Plus, Save, Trash2, X } from "lucide-react";
import { FormShell } from "@/components/dashboard/form-shell";
import { TagEditor } from "@/components/dashboard/tag-editor";

type EntityOption = {
  id: string;
  title: string;
};

export type KanbanColumnInput = {
  id: string;
  title: string;
  color: string;
  isDone: boolean;
};

type ProjectTaskInput = {
  clientId: string;
  title: string;
  priority: string;
  statusId: string;
  dueDate: string;
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
  initialTags?: string[];
  initialChecklistIds?: string[];
  initialKanbanColumns?: KanbanColumnInput[];
  onCancel?: () => void;
  onSaved?: () => void;
};

const priorityOptions = ["low", "medium", "high", "urgent"];
const lifecycleStatusOptions = ["active", "paused", "completed", "archived"];

export const defaultKanbanColumns: KanbanColumnInput[] = [
  { id: "backlog", title: "Backlog", color: "#71717a", isDone: false },
  { id: "todo", title: "To do", color: "#2563eb", isDone: false },
  { id: "in_progress", title: "In progress", color: "#d97706", isDone: false },
  { id: "testing", title: "Testing", color: "#7c3aed", isDone: false },
  { id: "done", title: "Done", color: "#16a34a", isDone: true }
];

function slugifyColumnId(value: string, fallback: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || fallback;
}

function normalizeKanbanColumns(columns: KanbanColumnInput[]) {
  const usedIds = new Set<string>();

  return columns
    .map((column, index) => {
      const title = column.title.trim();
      const baseId = slugifyColumnId(column.id || title, `column_${index + 1}`);
      let id = baseId;
      let duplicateIndex = 2;

      while (usedIds.has(id)) {
        id = `${baseId}_${duplicateIndex}`;
        duplicateIndex += 1;
      }

      usedIds.add(id);

      return {
        id,
        title,
        position: index,
        color: column.color || "#71717a",
        isDone: column.isDone
      };
    })
    .filter((column) => column.title);
}

export function ProjectForm({
  mode,
  projectId,
  checklistOptions,
  initialTitle = "",
  initialDescription = "",
  initialPriority = "medium",
  initialLifecycleStatus = "active",
  initialDueDate = "",
  initialTags = [],
  initialChecklistIds = [],
  initialKanbanColumns = defaultKanbanColumns,
  onCancel,
  onSaved
}: ProjectFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState(initialTags.length ? initialTags : [""]);
  const [checklistIds, setChecklistIds] = useState(initialChecklistIds);
  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumnInput[]>(
    initialKanbanColumns.length ? initialKanbanColumns : defaultKanbanColumns
  );
  const [newTasks, setNewTasks] = useState<ProjectTaskInput[]>([]);

  function updateKanbanColumn(index: number, column: KanbanColumnInput) {
    const previousColumnId = kanbanColumns[index]?.id;

    setKanbanColumns((currentColumns) =>
      currentColumns.map((currentColumn, columnIndex) =>
        columnIndex === index ? column : currentColumn
      )
    );

    if (previousColumnId && previousColumnId !== column.id) {
      setNewTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.statusId === previousColumnId ? { ...task, statusId: column.id } : task
        )
      );
    }
  }

  function moveKanbanColumn(index: number, direction: -1 | 1) {
    setKanbanColumns((currentColumns) => {
      const nextIndex = index + direction;

      if (nextIndex < 0 || nextIndex >= currentColumns.length) {
        return currentColumns;
      }

      const nextColumns = [...currentColumns];
      const [column] = nextColumns.splice(index, 1);
      nextColumns.splice(nextIndex, 0, column);

      return nextColumns;
    });
  }

  function removeKanbanColumn(index: number) {
    setKanbanColumns((currentColumns) =>
      currentColumns.length > 1
        ? currentColumns.filter((_, columnIndex) => columnIndex !== index)
        : currentColumns
    );
  }

  function addProjectTask() {
    const defaultStatusId = kanbanColumns[0]?.id || "todo";

    setNewTasks((currentTasks) => [
      ...currentTasks,
      {
        clientId: crypto.randomUUID(),
        title: "",
        priority: "medium",
        statusId: defaultStatusId,
        dueDate: ""
      }
    ]);
  }

  function updateProjectTask(clientId: string, task: ProjectTaskInput) {
    setNewTasks((currentTasks) =>
      currentTasks.map((currentTask) => (currentTask.clientId === clientId ? task : currentTask))
    );
  }

  function removeProjectTask(clientId: string) {
    setNewTasks((currentTasks) => currentTasks.filter((task) => task.clientId !== clientId));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const dueDate = String(formData.get("dueDate") ?? "").trim();

    if (!title) {
      setError("Project title is required.");
      setIsSubmitting(false);
      return;
    }

    const normalizedKanbanColumns = normalizeKanbanColumns(kanbanColumns);

    if (!normalizedKanbanColumns.length) {
      setError("At least one Kanban column is required.");
      setIsSubmitting(false);
      return;
    }

    const projectTasks = newTasks
      .map((task) => ({
        title: task.title.trim(),
        priority: task.priority,
        statusId: task.statusId,
        dueDate: task.dueDate ? new Date(`${task.dueDate}T00:00:00`).toISOString() : null
      }))
      .filter((task) => task.title);

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
        tags: tags.map((tag) => tag.trim()).filter(Boolean),
        checklistIds,
        newTasks: projectTasks,
        kanbanColumns: normalizedKanbanColumns
      })
    });

    if (!response.ok) {
      setError(mode === "create" ? "Could not create the project." : "Could not save the project.");
      setIsSubmitting(false);
      return;
    }

    if (mode === "create") {
      router.push("/dashboard/projects");
      router.refresh();
      return;
    }

    setMessage("Project saved.");
    setIsSubmitting(false);
    onSaved?.();
    router.refresh();
  }

  const inputClass = "app-form-control";
  const labelClass = "app-form-label";

  return (
    <FormShell entityType="project" mode={mode} onSubmit={handleSubmit}>
      <div className="app-form-field">
        <label htmlFor="title" className={labelClass}>
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          defaultValue={initialTitle}
          required
          className={inputClass}
        />
      </div>

      <div className="app-form-field">
        <label htmlFor="description" className={labelClass}>
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

        <div className="app-form-field">
          <label htmlFor="lifecycleStatus" className={labelClass}>
            Status
          </label>
          <select
            id="lifecycleStatus"
            name="lifecycleStatus"
            defaultValue={initialLifecycleStatus}
            className={inputClass}
          >
            {lifecycleStatusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="app-form-field">
          <label htmlFor="dueDate" className={labelClass}>
            Due date
          </label>
          <input id="dueDate" name="dueDate" type="date" defaultValue={initialDueDate} className={inputClass} />
        </div>
        </div>
      </div>

      <TagEditor tags={tags} onChange={setTags} />

      <fieldset className="grid gap-3">
        <legend className="app-form-legend">
          Project checklists
        </legend>
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
      </fieldset>

      <fieldset className="grid gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <legend className="app-form-legend">
            Project tasks
          </legend>
          <button
            type="button"
            onClick={addProjectTask}
            className="app-form-secondary-button sm:w-auto"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Add task
          </button>
        </div>

        {newTasks.length ? (
          <div className="grid gap-2">
            {newTasks.map((task) => (
              <div
                key={task.clientId}
                className="grid gap-3 rounded-md bg-zinc-50/80 p-3 shadow-sm md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end dark:bg-zinc-900/70"
              >
                <div className="app-form-field">
                  <label htmlFor={`project-task-title-${task.clientId}`} className={labelClass}>
                    Task title
                  </label>
                  <input
                    id={`project-task-title-${task.clientId}`}
                    type="text"
                    value={task.title}
                    onChange={(event) =>
                      updateProjectTask(task.clientId, { ...task, title: event.target.value })
                    }
                    className={inputClass}
                  />
                </div>
                <div className="app-form-field">
                  <label htmlFor={`project-task-priority-${task.clientId}`} className={labelClass}>
                    Priority
                  </label>
                  <select
                    id={`project-task-priority-${task.clientId}`}
                    value={task.priority}
                    onChange={(event) =>
                      updateProjectTask(task.clientId, { ...task, priority: event.target.value })
                    }
                    className={inputClass}
                  >
                    {priorityOptions.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="app-form-field">
                  <label htmlFor={`project-task-status-${task.clientId}`} className={labelClass}>
                    Status
                  </label>
                  <select
                    id={`project-task-status-${task.clientId}`}
                    value={task.statusId}
                    onChange={(event) =>
                      updateProjectTask(task.clientId, { ...task, statusId: event.target.value })
                    }
                    className={inputClass}
                  >
                    {kanbanColumns.map((column) => (
                      <option key={column.id} value={column.id}>
                        {column.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="app-form-field">
                  <label htmlFor={`project-task-date-${task.clientId}`} className={labelClass}>
                    Due date
                  </label>
                  <input
                    id={`project-task-date-${task.clientId}`}
                    type="date"
                    value={task.dueDate}
                    onChange={(event) =>
                      updateProjectTask(task.clientId, { ...task, dueDate: event.target.value })
                    }
                    className={inputClass}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeProjectTask(task.clientId)}
                  className="app-form-icon-button w-full md:w-11"
                  aria-label={`Remove ${task.title || "project task"}`}
                  title="Remove task"
                >
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Add tasks here to create them together with this project.
          </p>
        )}
      </fieldset>

      <fieldset className="grid gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <legend className="app-form-legend">
            Kanban columns
          </legend>
          <button
            type="button"
            onClick={() =>
              setKanbanColumns((currentColumns) => [
                ...currentColumns,
                {
                  id: `column_${currentColumns.length + 1}`,
                  title: "New column",
                  color: "#71717a",
                  isDone: false
                }
              ])
            }
            className="app-form-secondary-button sm:w-auto"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Add column
          </button>
        </div>

        <div className="grid gap-2">
          {kanbanColumns.map((column, index) => (
            <div
              key={`${column.id}-${index}`}
              className="grid gap-3 rounded-md bg-zinc-50/80 p-3 shadow-sm sm:grid-cols-[minmax(0,1fr)_7rem_auto_auto_auto] sm:items-end dark:bg-zinc-900/70"
            >
              <div className="app-form-field">
                <label htmlFor={`kanban-title-${index}`} className={labelClass}>
                  Column title
                </label>
                <input
                  id={`kanban-title-${index}`}
                  type="text"
                  value={column.title}
                  onChange={(event) =>
                    updateKanbanColumn(index, {
                      ...column,
                      title: event.target.value,
                      id: slugifyColumnId(event.target.value, column.id)
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div className="app-form-field">
                <label htmlFor={`kanban-color-${index}`} className={labelClass}>
                  Color
                </label>
                <input
                  id={`kanban-color-${index}`}
                  type="color"
                  value={column.color}
                  onChange={(event) =>
                    updateKanbanColumn(index, { ...column, color: event.target.value })
                  }
                  className="app-form-color"
                />
              </div>
              <label className="app-form-checkbox-card h-11">
                <input
                  type="checkbox"
                  checked={column.isDone}
                  onChange={(event) =>
                    updateKanbanColumn(index, { ...column, isDone: event.target.checked })
                  }
                  className="app-form-checkbox"
                />
                Done
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => moveKanbanColumn(index, -1)}
                  disabled={index === 0}
                  className="grid h-12 place-items-center rounded-md border border-zinc-300 text-zinc-500 transition hover:border-[var(--app-accent)] hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-[var(--app-accent)] dark:hover:text-white"
                  aria-label={`Move ${column.title} left`}
                  title="Move left"
                >
                  <ArrowUp aria-hidden="true" className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveKanbanColumn(index, 1)}
                  disabled={index === kanbanColumns.length - 1}
                  className="grid h-12 place-items-center rounded-md border border-zinc-300 text-zinc-500 transition hover:border-[var(--app-accent)] hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-[var(--app-accent)] dark:hover:text-white"
                  aria-label={`Move ${column.title} right`}
                  title="Move right"
                >
                  <ArrowDown aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => removeKanbanColumn(index)}
                disabled={kanbanColumns.length === 1}
                className="grid h-12 w-full place-items-center rounded-md border border-zinc-300 text-zinc-500 transition hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 sm:w-12 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-red-500/60 dark:hover:text-red-300"
                aria-label={`Remove ${column.title}`}
                title="Remove column"
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
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
              ? "Create project"
              : "Save project"}
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
