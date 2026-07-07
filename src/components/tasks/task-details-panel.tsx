"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, CheckCircle2, FolderKanban } from "lucide-react";
import { DeleteEntityButton } from "@/components/dashboard/delete-entity-button";
import { DetailsMeta } from "@/components/dashboard/details-meta";
import { InlineEditableField } from "@/components/dashboard/inline-editable-field";
import { PinEntityButton } from "@/components/dashboard/pin-entity-button";
import { SaveChangesButton } from "@/components/dashboard/save-changes-button";
import { TagList } from "@/components/dashboard/tag-list";

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
  tags,
  checklistIds,
  completedAtLabel,
  createdAtLabel,
  updatedAtLabel,
  pinId
}: TaskDetailsPanelProps) {
  const router = useRouter();
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftDescription, setDraftDescription] = useState(description);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const projectTitle = projectOptions.find((project) => project.id === projectId)?.title;
  void checklistOptions;
  void dueDate;
  const isDirty = draftTitle.trim() !== title.trim() || draftDescription !== description;

  useEffect(() => {
    setDraftTitle(title);
    setDraftDescription(description);
  }, [title, description]);

  async function saveChanges() {
    if (!draftTitle.trim()) {
      setDraftTitle(title);
      return;
    }

    setError("");
    setIsSaving(true);
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: draftTitle.trim(),
        description: draftDescription
      })
    });

    setIsSaving(false);

    if (!response.ok) {
      setError("Could not save changes.");
      return;
    }

    router.refresh();
  }

  return (
    <article className="grid gap-5">
      <div className="flex justify-end px-3">
        <PinEntityButton
          targetType="task"
          targetId={taskId}
          initialPinId={pinId}
          className="-mb-5 z-10"
        />
      </div>
      <div className="flex flex-col gap-3 rounded-md border border-zinc-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <DetailsMeta createdAtLabel={createdAtLabel} updatedAtLabel={updatedAtLabel} />
        </div>
        <div className="app-action-row">
          <SaveChangesButton isDirty={isDirty} isSaving={isSaving} onClick={saveChanges} />
          <DeleteEntityButton
            endpoint={`/api/tasks/${taskId}`}
            redirectTo="/dashboard/tasks"
            label="Delete"
            errorLabel="Could not delete the task."
          />
        </div>
        {error ? <p className="text-sm text-red-600 dark:text-red-300 sm:w-full">{error}</p> : null}
      </div>

      <div className="rounded-md border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <InlineEditableField
              value={draftTitle}
              onChange={setDraftTitle}
              required
              className="break-words p-1 text-2xl font-semibold tracking-normal text-zinc-950 sm:text-3xl dark:text-zinc-50"
              inputClassName="w-full rounded-md border border-[var(--app-accent)] bg-white px-2 py-1 text-2xl font-semibold text-zinc-950 outline-none ring-2 ring-[var(--app-accent)]/15 sm:text-3xl dark:bg-zinc-900 dark:text-zinc-50"
            />
            <p className="mt-2 text-sm font-medium uppercase tracking-normal text-zinc-500 dark:text-zinc-400">
              {statusId} / {priority}
            </p>
          </div>
          <CheckCircle2 aria-hidden="true" className="h-7 w-7 text-[var(--app-accent)]" />
        </div>

        <InlineEditableField
          value={draftDescription}
          onChange={setDraftDescription}
          multiline
          emptyLabel="No description yet."
          className="mt-6 whitespace-pre-wrap p-1 text-sm leading-7 text-zinc-700 dark:text-zinc-300"
          inputClassName="mt-6 min-h-32 w-full rounded-md border border-[var(--app-accent)] bg-white px-3 py-3 text-sm leading-7 text-zinc-950 outline-none ring-2 ring-[var(--app-accent)]/15 dark:bg-zinc-900 dark:text-zinc-50"
        />

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
          {checklistIds.length ? <p>Checklists: {checklistIds.length}</p> : null}
        </div>

        <TagList tags={tags} className="mt-6" />
      </div>

      {completedAtLabel ? (
      <div className="grid gap-3 rounded-md border border-zinc-200 bg-white p-4 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
        {completedAtLabel ? <p>Completed {completedAtLabel}</p> : null}
      </div>
      ) : null}
    </article>
  );
}
