"use client";

import { useState } from "react";
import { CalendarClock, CheckCircle2, Clock, Edit3, FolderKanban, Tag, Timer } from "lucide-react";
import { DeleteEntityButton } from "@/components/dashboard/delete-entity-button";
import { PinEntityButton } from "@/components/dashboard/pin-entity-button";
import { TaskForm } from "@/components/tasks/task-form";

type EntityOption = {
  id: string;
  title: string;
};

type TaskDetailsPanelProps = {
  taskId: string;
  projectOptions: EntityOption[];
  checklistOptions: EntityOption[];
  title: string;
  description: string;
  priority: string;
  statusId: string;
  projectId: string;
  dueDate: string;
  dueDateLabel?: string;
  estimatedMinutes?: number | null;
  tags: string[];
  checklistIds: string[];
  completedAtLabel?: string;
  createdAtLabel?: string;
  updatedAtLabel?: string;
  pinId?: string;
};

export function TaskDetailsPanel({
  taskId,
  projectOptions,
  checklistOptions,
  title,
  description,
  priority,
  statusId,
  projectId,
  dueDate,
  dueDateLabel,
  estimatedMinutes,
  tags,
  checklistIds,
  completedAtLabel,
  createdAtLabel,
  updatedAtLabel,
  pinId
}: TaskDetailsPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const projectTitle = projectOptions.find((project) => project.id === projectId)?.title;

  if (isEditing) {
    return (
      <TaskForm
        mode="edit"
        taskId={taskId}
        projectOptions={projectOptions}
        checklistOptions={checklistOptions}
        initialTitle={title}
        initialDescription={description}
        initialPriority={priority}
        initialStatusId={statusId}
        initialProjectId={projectId}
        initialDueDate={dueDate}
        initialEstimatedMinutes={estimatedMinutes}
        initialTags={tags}
        initialChecklistIds={checklistIds}
        onCancel={() => setIsEditing(false)}
        onSaved={() => setIsEditing(false)}
      />
    );
  }

  return (
    <article className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-3 text-sm font-medium text-zinc-600 dark:text-zinc-300">
          <CheckCircle2 aria-hidden="true" className="h-5 w-5 text-[var(--app-accent)]" />
          Task details
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
          <PinEntityButton targetType="task" targetId={taskId} initialPinId={pinId} />
          <DeleteEntityButton
            endpoint={`/api/tasks/${taskId}`}
            redirectTo="/dashboard/tasks"
            label="Delete"
            errorLabel="Could not delete the task."
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
              {statusId} / {priority}
            </p>
          </div>
          <CheckCircle2 aria-hidden="true" className="h-7 w-7 text-[var(--app-accent)]" />
        </div>

        {description ? (
          <p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-zinc-700 dark:text-zinc-300">
            {description}
          </p>
        ) : (
          <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">No description yet.</p>
        )}

        <div className="mt-6 grid gap-3 text-sm text-zinc-600 sm:grid-cols-2 dark:text-zinc-300">
          {projectTitle ? (
            <p className="inline-flex items-center gap-2">
              <FolderKanban aria-hidden="true" className="h-4 w-4 text-[var(--app-accent)]" />
              Project: {projectTitle}
            </p>
          ) : null}
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
          {checklistIds.length ? <p>Checklists: {checklistIds.length}</p> : null}
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
