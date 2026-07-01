"use client";

import { useState } from "react";
import { CalendarClock, CheckCircle2, Clock, Edit3, FolderKanban, Tag, Timer } from "lucide-react";
import { DeleteEntityButton } from "@/components/dashboard/delete-entity-button";
import { PinEntityButton } from "@/components/dashboard/pin-entity-button";
import { ProjectForm } from "@/components/projects/project-form";

type EntityOption = {
  id: string;
  title: string;
};

type KanbanColumn = {
  id: string;
  title: string;
  color?: string;
  isDone: boolean;
};

type ProjectDetailsPanelProps = {
  projectId: string;
  checklistOptions: EntityOption[];
  title: string;
  description: string;
  priority: string;
  lifecycleStatus: string;
  dueDate: string;
  dueDateLabel?: string;
  estimatedMinutes?: number | null;
  tags: string[];
  checklistIds: string[];
  taskCount: number;
  kanbanColumns: KanbanColumn[];
  completedAtLabel?: string;
  createdAtLabel?: string;
  updatedAtLabel?: string;
  pinId?: string;
};

export function ProjectDetailsPanel({
  projectId,
  checklistOptions,
  title,
  description,
  priority,
  lifecycleStatus,
  dueDate,
  dueDateLabel,
  estimatedMinutes,
  tags,
  checklistIds,
  taskCount,
  kanbanColumns,
  completedAtLabel,
  createdAtLabel,
  updatedAtLabel,
  pinId
}: ProjectDetailsPanelProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <ProjectForm
        mode="edit"
        projectId={projectId}
        checklistOptions={checklistOptions}
        initialTitle={title}
        initialDescription={description}
        initialPriority={priority}
        initialLifecycleStatus={lifecycleStatus}
        initialDueDate={dueDate}
        initialEstimatedMinutes={estimatedMinutes}
        initialTags={tags}
        initialChecklistIds={checklistIds}
        initialKanbanColumns={kanbanColumns.map((column) => ({
          id: column.id,
          title: column.title,
          color: column.color ?? "#71717a",
          isDone: column.isDone
        }))}
        onCancel={() => setIsEditing(false)}
        onSaved={() => setIsEditing(false)}
      />
    );
  }

  return (
    <article className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-3 text-sm font-medium text-zinc-600 dark:text-zinc-300">
          <FolderKanban aria-hidden="true" className="h-5 w-5 text-[var(--app-accent)]" />
          Project details
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
          <PinEntityButton targetType="project" targetId={projectId} initialPinId={pinId} />
          <DeleteEntityButton
            endpoint={`/api/projects/${projectId}`}
            redirectTo="/dashboard/projects"
            label="Delete"
            errorLabel="Could not delete the project."
          />
        </div>
      </div>

      <div className="rounded-md border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="break-words text-2xl font-semibold tracking-normal text-zinc-950 sm:text-3xl dark:text-zinc-50">
              {title}
            </h1>
            <p className="mt-2 text-sm font-medium uppercase tracking-normal text-zinc-500 dark:text-zinc-400">
              {lifecycleStatus} / {priority}
            </p>
          </div>
          <FolderKanban aria-hidden="true" className="h-7 w-7 text-[var(--app-accent)]" />
        </div>

        {description ? (
          <p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-zinc-700 dark:text-zinc-300">
            {description}
          </p>
        ) : (
          <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">No description yet.</p>
        )}

        <div className="mt-6 grid gap-3 text-sm text-zinc-600 sm:grid-cols-2 dark:text-zinc-300">
          <p>{taskCount} {taskCount === 1 ? "task" : "tasks"}</p>
          {checklistIds.length ? <p>Checklists: {checklistIds.length}</p> : null}
          {dueDateLabel ? (
            <p className="inline-flex items-center gap-2">
              <CalendarClock aria-hidden="true" className="h-4 w-4 text-[var(--app-accent)]" />
              Due {dueDateLabel}
            </p>
          ) : null}
          {estimatedMinutes ? (
            <p className="inline-flex items-center gap-2">
              <Timer aria-hidden="true" className="h-4 w-4 text-[var(--app-accent)]" />
              {estimatedMinutes} estimated minutes
            </p>
          ) : null}
        </div>

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
          Kanban columns
        </h2>
        {kanbanColumns.length ? (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {kanbanColumns.map((column) => (
              <li
                key={column.id}
                className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
              >
                <span className="inline-flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: column.color ?? "var(--app-accent)" }}
                  />
                  <span className="truncate">{column.title}</span>
                </span>
                {column.isDone ? (
                  <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-[var(--app-accent)]" />
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">No columns configured.</p>
        )}
      </div>

      <div className="grid gap-3 rounded-md border border-zinc-200 bg-white p-4 text-sm text-zinc-600 shadow-sm sm:grid-cols-3 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
        {completedAtLabel ? <p>Completed {completedAtLabel}</p> : null}
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
