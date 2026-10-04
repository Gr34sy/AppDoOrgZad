"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  FolderKanban,
  Gauge,
  ListChecks,
  Plus,
  Tag,
  X
} from "lucide-react";
import { LinkedChecklistList, type LinkedChecklistOption } from "@/components/checklists/linked-checklist-list";
import { DeleteEntityButton } from "@/components/dashboard/delete-entity-button";
import { InlineEditableField } from "@/components/dashboard/inline-editable-field";
import { PinEntityButton } from "@/components/dashboard/pin-entity-button";
import { SaveChangesButton } from "@/components/dashboard/save-changes-button";
import { TagList } from "@/components/dashboard/tag-list";

type EntityOption = {
  id: string;
  title: string;
  items?: LinkedChecklistOption["items"];
  kanbanColumns?: Array<{
    id: string;
    title: string;
  }>;
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

function normalizeTags(tags: string[]) {
  return tags.map((tag) => tag.trim()).filter(Boolean);
}

function formatMetaValue(value: string) {
  const normalizedValue = value.replace(/_/g, " ").trim();

  return normalizedValue ? normalizedValue[0].toUpperCase() + normalizedValue.slice(1) : "-";
}

function getTaskDatePayload(date: string) {
  return date ? new Date(`${date}T00:00:00`).toISOString() : null;
}

const priorityOptions = ["low", "medium", "high", "urgent"];

function TaskTagPreview({ tags }: { tags: string[] }) {
  return <TagList tags={tags} showEmpty />;
}

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
  const [draftTags, setDraftTags] = useState(tags.length ? tags : [""]);
  const [draftPriority, setDraftPriority] = useState(priority);
  const [draftStatusId, setDraftStatusId] = useState(statusId);
  const [draftProjectId, setDraftProjectId] = useState(projectId);
  const [draftDueDate, setDraftDueDate] = useState(dueDate);
  const [draftChecklistIds, setDraftChecklistIds] = useState(checklistIds);
  const [editingMetaField, setEditingMetaField] = useState<
    "status" | "priority" | "project" | "due" | null
  >(null);
  const [isTagEditorOpen, setIsTagEditorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const selectedProject = useMemo(
    () => projectOptions.find((project) => project.id === draftProjectId),
    [draftProjectId, projectOptions]
  );
  const projectTitle = selectedProject?.title;
  const projectStatusOptions = useMemo(
    () => selectedProject?.kanbanColumns ?? [],
    [selectedProject]
  );
  const isProjectTask = Boolean(draftProjectId);
  const statusTitle =
    projectStatusOptions.find((status) => status.id === draftStatusId)?.title ?? draftStatusId;
  const dueDateDisplay = draftDueDate
    ? draftDueDate === dueDate
      ? dueDateLabel ?? draftDueDate
      : draftDueDate
    : "-";
  const normalizedDraftTags = normalizeTags(draftTags);
  const isDirty =
    draftTitle.trim() !== title.trim() ||
    draftDescription !== description ||
    draftPriority !== priority ||
    draftStatusId !== statusId ||
    draftProjectId !== projectId ||
    draftDueDate !== dueDate ||
    normalizedDraftTags.join("\n") !== tags.join("\n");

  useEffect(() => {
    setDraftTitle(title);
    setDraftDescription(description);
    setDraftTags(tags.length ? tags : [""]);
    setDraftPriority(priority);
    setDraftStatusId(statusId);
    setDraftProjectId(projectId);
    setDraftDueDate(dueDate);
    setDraftChecklistIds(checklistIds);
  }, [title, description, priority, statusId, projectId, dueDate, tags, checklistIds]);

  useEffect(() => {
    if (
      isProjectTask &&
      projectStatusOptions.length &&
      !projectStatusOptions.some((status) => status.id === draftStatusId)
    ) {
      setDraftStatusId(projectStatusOptions[0]?.id ?? "todo");
    }
  }, [draftStatusId, isProjectTask, projectStatusOptions]);

  function resetDrafts() {
    setDraftTitle(title);
    setDraftDescription(description);
    setDraftTags(tags.length ? tags : [""]);
    setDraftPriority(priority);
    setDraftStatusId(statusId);
    setDraftProjectId(projectId);
    setDraftDueDate(dueDate);
    setEditingMetaField(null);
    setError("");
  }

  function updateTag(index: number, value: string) {
    setDraftTags((currentTags) => {
      const nextTags = [...currentTags];
      nextTags[index] = value;

      return nextTags;
    });
  }

  function removeTag(index: number) {
    setDraftTags((currentTags) => {
      const nextTags = currentTags.filter((_, tagIndex) => tagIndex !== index);

      return nextTags.length ? nextTags : [""];
    });
  }

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
        description: draftDescription,
        priority: draftPriority,
        statusId: draftStatusId.trim() || "todo",
        projectId: draftProjectId || null,
        dueDate: getTaskDatePayload(draftDueDate),
        tags: normalizedDraftTags,
        checklistIds: draftChecklistIds
      })
    });

    setIsSaving(false);

    if (!response.ok) {
      setError("Could not save changes.");
      return;
    }

    router.refresh();
  }

  const inlineMetaControlClass =
    "h-8 min-w-28 rounded-md bg-zinc-100/80 px-2 text-[0.9375rem] text-zinc-950 outline-none dark:bg-zinc-900 dark:text-zinc-50";
  const inlineMetaButtonClass =
    "rounded-md p-1 text-left transition hover:bg-zinc-100/80 focus-visible:bg-zinc-100/80 focus-visible:outline-none dark:hover:bg-zinc-900 dark:focus-visible:bg-zinc-900";

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
      <div className="rounded-md border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-200 pb-4 dark:border-zinc-800">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <CheckCircle2
              aria-hidden="true"
              className="mt-2 h-7 w-7 shrink-0 text-[var(--app-accent)]"
            />
            <InlineEditableField
              value={draftTitle}
              onChange={setDraftTitle}
              required
              className="min-w-0 break-words p-1 text-2xl font-semibold tracking-normal text-zinc-950 sm:text-3xl dark:text-zinc-50"
              inputClassName="w-full bg-transparent p-1 text-2xl font-semibold tracking-normal text-zinc-950 outline-none sm:text-3xl dark:text-zinc-50"
            />
          </div>
          <div className="app-action-row">
            <SaveChangesButton
              isDirty={isDirty}
              isSaving={isSaving}
              onClick={saveChanges}
              label="Save"
            />
            {isDirty ? (
              <button
                type="button"
                onClick={resetDrafts}
                disabled={isSaving}
                className="inline-flex h-10 w-full items-center justify-center rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-700 transition hover:border-[var(--app-accent)] hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-[var(--app-accent)] dark:hover:text-white"
              >
                Cancel
              </button>
            ) : null}
            <DeleteEntityButton
              endpoint={`/api/tasks/${taskId}`}
              redirectTo="/dashboard/tasks"
              label="Archive"
              errorLabel="Could not archive the task."
              iconOnly
            />
          </div>
        </div>

        <div className="my-6 grid gap-2 text-[0.9375rem] text-zinc-600 dark:text-zinc-300">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="inline-flex items-center gap-1.5">
            <Gauge aria-hidden="true" className="h-4 w-4 text-[var(--app-accent)]" />
            {editingMetaField === "status" ? (
              isProjectTask ? (
                <select
                  autoFocus
                  aria-label="Status"
                  value={draftStatusId}
                  onChange={(event) => {
                    setDraftStatusId(event.target.value);
                    setEditingMetaField(null);
                  }}
                  onBlur={() => setEditingMetaField(null)}
                  className={inlineMetaControlClass}
                >
                  {projectStatusOptions.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.title}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  autoFocus
                  aria-label="Status"
                  value={draftStatusId}
                  onChange={(event) => setDraftStatusId(event.target.value)}
                  onBlur={() => setEditingMetaField(null)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === "Escape") {
                      setEditingMetaField(null);
                    }
                  }}
                  className={inlineMetaControlClass}
                />
              )
            ) : (
              <button
                type="button"
                onClick={() => setEditingMetaField("status")}
                className={inlineMetaButtonClass}
              >
                <strong className="font-semibold text-zinc-700 dark:text-zinc-200">Status</strong>{" "}
                {formatMetaValue(statusTitle)}
              </button>
            )}
          </span>
          <span className="inline-flex items-center gap-1.5">
            {editingMetaField === "priority" ? (
              <select
                autoFocus
                aria-label="Priority"
                value={draftPriority}
                onChange={(event) => {
                  setDraftPriority(event.target.value);
                  setEditingMetaField(null);
                }}
                onBlur={() => setEditingMetaField(null)}
                className={inlineMetaControlClass}
              >
                {priorityOptions.map((priorityOption) => (
                  <option key={priorityOption} value={priorityOption}>
                    {priorityOption}
                  </option>
                ))}
              </select>
            ) : (
              <button
                type="button"
                onClick={() => setEditingMetaField("priority")}
                className={inlineMetaButtonClass}
              >
                <strong className="font-semibold text-zinc-700 dark:text-zinc-200">Priority</strong>{" "}
                {formatMetaValue(draftPriority)}
              </button>
            )}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FolderKanban aria-hidden="true" className="h-4 w-4 text-[var(--app-accent)]" />
            {editingMetaField === "project" ? (
              <select
                autoFocus
                aria-label="Project"
                value={draftProjectId}
                onChange={(event) => {
                  setDraftProjectId(event.target.value);
                  setEditingMetaField(null);
                }}
                onBlur={() => setEditingMetaField(null)}
                className={inlineMetaControlClass}
              >
                <option value="">No project</option>
                {projectOptions.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            ) : (
              <button
                type="button"
                onClick={() => setEditingMetaField("project")}
                className={inlineMetaButtonClass}
              >
                <strong className="font-semibold text-zinc-700 dark:text-zinc-200">Project</strong>{" "}
                {projectTitle ?? "-"}
              </button>
            )}
          </span>
            {draftChecklistIds.length ? (
              <span className="inline-flex items-center gap-1.5">
                <ListChecks aria-hidden="true" className="h-4 w-4 text-[var(--app-accent)]" />
                Checklists: {draftChecklistIds.length}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <CalendarClock aria-hidden="true" className="h-4 w-4 text-[var(--app-accent)]" />
            {editingMetaField === "due" ? (
              <input
                autoFocus
                type="date"
                aria-label="Due"
                value={draftDueDate}
                onChange={(event) => setDraftDueDate(event.target.value)}
                onBlur={() => setEditingMetaField(null)}
                className={inlineMetaControlClass}
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditingMetaField("due")}
                className={inlineMetaButtonClass}
              >
                <strong className="font-semibold text-zinc-700 dark:text-zinc-200">Due</strong>{" "}
                {dueDateDisplay}
              </button>
            )}
            {createdAtLabel ? (
              <span className="inline-flex items-center gap-1.5">
                <strong className="font-semibold text-zinc-700 dark:text-zinc-200">Created</strong>{" "}
                {createdAtLabel}
              </span>
            ) : null}
            {updatedAtLabel ? (
              <span className="inline-flex items-center gap-1.5">
                <strong className="font-semibold text-zinc-700 dark:text-zinc-200">Updated</strong>{" "}
                {updatedAtLabel}
              </span>
            ) : null}
            {completedAtLabel ? (
              <span>Completed {completedAtLabel}</span>
            ) : null}
          </div>
        </div>

        <div>
          {isTagEditorOpen ? (
            <div>
              <div className="flex flex-wrap gap-2">
                {draftTags.map((tag, index) => (
                  <label
                    key={index}
                    className="inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-full border border-[var(--app-accent)]/35 bg-white px-[0.78125rem] text-[0.9375rem] shadow-sm transition focus-within:border-[var(--app-accent)] dark:bg-zinc-950"
                  >
                    <Tag aria-hidden="true" className="h-[1.09375rem] w-[1.09375rem] shrink-0 text-[var(--app-accent)]" />
                    <span className="sr-only">Tag {index + 1}</span>
                    <input
                      type="text"
                      value={tag}
                      placeholder={`Tag ${index + 1}`}
                      onChange={(event) => updateTag(index, event.target.value)}
                      size={Math.max(tag.length, `Tag ${index + 1}`.length, 1)}
                      className="w-auto min-w-[1ch] bg-transparent text-[0.9375rem] text-zinc-950 outline-none placeholder:text-zinc-400 dark:text-zinc-50 dark:placeholder:text-zinc-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                      aria-label={`Remove tag ${index + 1}`}
                      title="Remove tag"
                    >
                      <X aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                  </label>
                ))}
                <button
                  type="button"
                  onClick={() => setDraftTags((currentTags) => [...currentTags, ""])}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-dashed border-[var(--app-accent)]/50 px-[0.78125rem] text-[0.9375rem] font-medium text-[var(--app-accent)] transition hover:border-[var(--app-accent)] hover:bg-[var(--app-accent)]/5"
                >
                  <Plus aria-hidden="true" className="h-[1.09375rem] w-[1.09375rem]" />
                  Add tag
                </button>
                <button
                  type="button"
                  onClick={() => setIsTagEditorOpen(false)}
                  className="grid h-8 w-8 place-items-center rounded-full text-[var(--app-accent)] transition hover:bg-[var(--app-accent)]/5 focus-visible:outline-none"
                  aria-label="Back to tag preview"
                  title="Back to tag preview"
                >
                  <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsTagEditorOpen(true)}
              className="group -m-2 flex w-fit max-w-full rounded-md p-2 text-left focus-visible:outline-none"
            >
              <TaskTagPreview tags={normalizedDraftTags} />
            </button>
          )}
        </div>

        <InlineEditableField
          value={draftDescription}
          onChange={setDraftDescription}
          multiline
          emptyLabel="No description yet."
          className="mt-6 whitespace-pre-wrap p-1 text-sm leading-7 text-zinc-700 dark:text-zinc-300"
          inputClassName="mt-6 w-full rounded-md bg-zinc-100/80 p-1 text-sm leading-7 text-zinc-950 outline-none dark:bg-zinc-900 dark:text-zinc-50"
        />

        <LinkedChecklistList
          parentType="task"
          parentId={taskId}
          checklistIds={draftChecklistIds}
          checklistOptions={checklistOptions}
          onChecklistIdsChange={setDraftChecklistIds}
          className="mt-6"
        />

        {error ? <p className="mt-4 text-sm text-red-600 dark:text-red-300">{error}</p> : null}
      </div>
    </article>
  );
}
