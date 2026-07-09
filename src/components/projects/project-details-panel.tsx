"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarClock, FolderKanban, Gauge, ListChecks, Plus, Tag, X } from "lucide-react";
import { DeleteEntityButton } from "@/components/dashboard/delete-entity-button";
import { InlineEditableField } from "@/components/dashboard/inline-editable-field";
import { PinEntityButton } from "@/components/dashboard/pin-entity-button";
import { SaveChangesButton } from "@/components/dashboard/save-changes-button";

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
  tags: string[];
  checklistIds: string[];
  taskCount: number;
  kanbanColumns: KanbanColumn[];
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

  return normalizedValue ? normalizedValue[0].toUpperCase() + normalizedValue.slice(1) : value;
}

function ProjectTagPreview({ tags }: { tags: string[] }) {
  if (!tags.length) {
    return (
      <span className="inline-flex items-center gap-2 text-[0.9375rem] text-zinc-500 dark:text-zinc-400">
        <Tag aria-hidden="true" className="h-[1.09375rem] w-[1.09375rem] text-[var(--app-accent)]" />
        No tags
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Tag
        aria-hidden="true"
        className="h-[1.09375rem] w-[1.09375rem] shrink-0 text-[var(--app-accent)]"
      />
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center rounded-full border border-[var(--app-accent)] px-[0.78125rem] py-[0.3125rem] text-[0.9375rem] font-medium text-[var(--app-accent)]"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

export function ProjectDetailsPanel({
  projectId,
  checklistOptions,
  title,
  description,
  priority,
  lifecycleStatus,
  dueDate,
  dueDateLabel,
  tags,
  checklistIds,
  taskCount,
  kanbanColumns,
  completedAtLabel,
  createdAtLabel,
  updatedAtLabel,
  pinId
}: ProjectDetailsPanelProps) {
  const router = useRouter();
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftDescription, setDraftDescription] = useState(description);
  const [draftTags, setDraftTags] = useState(tags.length ? tags : [""]);
  const [isTagEditorOpen, setIsTagEditorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  void checklistOptions;
  void dueDate;
  void dueDateLabel;
  void kanbanColumns;
  void completedAtLabel;
  const normalizedDraftTags = normalizeTags(draftTags);
  const isDirty =
    draftTitle.trim() !== title.trim() ||
    draftDescription !== description ||
    normalizedDraftTags.join("\n") !== tags.join("\n");

  useEffect(() => {
    setDraftTitle(title);
    setDraftDescription(description);
    setDraftTags(tags.length ? tags : [""]);
  }, [title, description, tags]);

  function resetDrafts() {
    setDraftTitle(title);
    setDraftDescription(description);
    setDraftTags(tags.length ? tags : [""]);
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
    const response = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: draftTitle.trim(),
        description: draftDescription,
        tags: normalizedDraftTags
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
          targetType="project"
          targetId={projectId}
          initialPinId={pinId}
          className="-mb-5 z-10"
        />
      </div>
      <div className="rounded-md border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <FolderKanban
              aria-hidden="true"
              className="mt-2 h-7 w-7 shrink-0 text-[var(--app-accent)]"
            />
            <InlineEditableField
              value={draftTitle}
              onChange={setDraftTitle}
              required
              className="min-w-0 break-words p-1 text-2xl font-semibold tracking-normal text-zinc-950 sm:text-3xl dark:text-zinc-50"
              inputClassName="w-full rounded-md border border-[var(--app-accent)] bg-white px-2 py-1 text-2xl font-semibold text-zinc-950 outline-none ring-2 ring-[var(--app-accent)]/15 sm:text-3xl dark:bg-zinc-900 dark:text-zinc-50"
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
              endpoint={`/api/projects/${projectId}`}
              redirectTo="/dashboard/projects"
              label="Delete"
              errorLabel="Could not delete the project."
              iconOnly
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-zinc-600 dark:text-zinc-300">
          <span className="inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
            <Gauge aria-hidden="true" className="h-4 w-4 text-[var(--app-accent)]" />
            <span>
              <strong className="font-semibold text-zinc-700 dark:text-zinc-200">Status:</strong>{" "}
              {formatMetaValue(lifecycleStatus)}
            </span>
            <span aria-hidden="true" className="text-zinc-400 dark:text-zinc-500">
              |
            </span>
            <span>
              <strong className="font-semibold text-zinc-700 dark:text-zinc-200">Priority:</strong>{" "}
              {formatMetaValue(priority)}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ListChecks aria-hidden="true" className="h-4 w-4 text-[var(--app-accent)]" />
            {taskCount} {taskCount === 1 ? "task" : "tasks"}
          </span>
          {checklistIds.length ? (
            <span className="inline-flex items-center gap-1.5">
              <ListChecks aria-hidden="true" className="h-4 w-4 text-[var(--app-accent)]" />
              Checklists: {checklistIds.length}
            </span>
          ) : null}
          <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
            <CalendarClock aria-hidden="true" className="h-4 w-4 text-[var(--app-accent)]" />
            {createdAtLabel ? (
              <span>
                <strong className="font-semibold text-zinc-700 dark:text-zinc-200">Created:</strong>{" "}
                {createdAtLabel}
              </span>
            ) : null}
            {updatedAtLabel ? (
              <span>
                <strong className="font-semibold text-zinc-700 dark:text-zinc-200">Updated:</strong>{" "}
                {updatedAtLabel}
              </span>
            ) : null}
          </span>
        </div>

        <div className="mt-6">
          {isTagEditorOpen ? (
            <div className="rounded-md bg-zinc-50/80 p-3 shadow-sm dark:bg-zinc-900/70">
              <div className="flex flex-wrap gap-2">
                {draftTags.map((tag, index) => (
                  <label
                    key={index}
                    className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border border-[var(--app-accent)]/35 bg-white px-[0.78125rem] text-[0.9375rem] shadow-sm transition focus-within:border-[var(--app-accent)] focus-within:ring-2 focus-within:ring-[var(--app-accent)]/15 dark:bg-zinc-950"
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
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-300"
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
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-dashed border-[var(--app-accent)]/50 px-[0.78125rem] text-[0.9375rem] font-medium text-[var(--app-accent)] transition hover:border-[var(--app-accent)] hover:bg-[var(--app-accent)]/5"
                >
                  <Plus aria-hidden="true" className="h-[1.09375rem] w-[1.09375rem]" />
                  Add tag
                </button>
                <button
                  type="button"
                  onClick={() => setIsTagEditorOpen(false)}
                  className="grid h-10 w-10 place-items-center rounded-full text-[var(--app-accent)] transition hover:bg-[var(--app-accent)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-accent)]/20"
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
              className="group -m-2 flex w-fit max-w-full rounded-md p-2 text-left transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-accent)]/20 dark:hover:bg-zinc-900"
            >
              <ProjectTagPreview tags={normalizedDraftTags} />
            </button>
          )}
        </div>

        <InlineEditableField
          value={draftDescription}
          onChange={setDraftDescription}
          multiline
          emptyLabel="No description yet."
          className="mt-6 whitespace-pre-wrap p-1 text-sm leading-7 text-zinc-700 dark:text-zinc-300"
          inputClassName="mt-6 min-h-32 w-full rounded-md border border-[var(--app-accent)] bg-white px-3 py-3 text-sm leading-7 text-zinc-950 outline-none ring-2 ring-[var(--app-accent)]/15 dark:bg-zinc-900 dark:text-zinc-50"
        />

        {error ? <p className="mt-4 text-sm text-red-600 dark:text-red-300">{error}</p> : null}
      </div>
    </article>
  );
}
