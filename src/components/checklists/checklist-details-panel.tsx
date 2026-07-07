"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ListChecks } from "lucide-react";
import { DeleteEntityButton } from "@/components/dashboard/delete-entity-button";
import { DetailsMeta } from "@/components/dashboard/details-meta";
import { InlineEditableField } from "@/components/dashboard/inline-editable-field";
import { PinEntityButton } from "@/components/dashboard/pin-entity-button";
import { SaveChangesButton } from "@/components/dashboard/save-changes-button";
import { TagList } from "@/components/dashboard/tag-list";

type ChecklistDetailsPanelProps = {
  checklistId: string;
  title: string;
  description: string;
  tags: string[];
  items: {
    title: string;
    isCompleted: boolean;
  }[];
  parentType?: string | null;
  createdAtLabel?: string;
  updatedAtLabel?: string;
  pinId?: string;
};

export function ChecklistDetailsPanel({
  checklistId,
  title,
  description,
  tags,
  items,
  parentType,
  createdAtLabel,
  updatedAtLabel,
  pinId
}: ChecklistDetailsPanelProps) {
  const router = useRouter();
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftDescription, setDraftDescription] = useState(description);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
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
    const response = await fetch(`/api/checklists/${checklistId}`, {
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
          targetType="checklist"
          targetId={checklistId}
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
            endpoint={`/api/checklists/${checklistId}`}
            redirectTo="/dashboard/checklists"
            label="Delete"
            errorLabel="Could not delete the checklist."
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
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {items.length} {items.length === 1 ? "item" : "items"}
              {parentType ? ` / parent: ${parentType}` : ""}
            </p>
          </div>
          <ListChecks aria-hidden="true" className="h-7 w-7 text-[var(--app-accent)]" />
        </div>

        <InlineEditableField
          value={draftDescription}
          onChange={setDraftDescription}
          multiline
          emptyLabel="No description yet."
          className="mt-6 whitespace-pre-wrap p-1 text-sm leading-7 text-zinc-700 dark:text-zinc-300"
          inputClassName="mt-6 min-h-32 w-full rounded-md border border-[var(--app-accent)] bg-white px-3 py-3 text-sm leading-7 text-zinc-950 outline-none ring-2 ring-[var(--app-accent)]/15 dark:bg-zinc-900 dark:text-zinc-50"
        />

        <TagList tags={tags} className="mt-6" />
      </div>

      <div className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold tracking-normal text-zinc-950 dark:text-zinc-50">
          Items
        </h2>
        {items.length ? (
          <ul className="mt-4 grid gap-2">
            {items.map((item, index) => (
              <li
                key={`${item.title}-${index}`}
                className="flex items-center gap-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
              >
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded border ${
                    item.isCompleted
                      ? "border-[var(--app-accent)] bg-[var(--app-accent)] text-white"
                      : "border-zinc-300 dark:border-zinc-700"
                  }`}
                >
                  {item.isCompleted ? <Check aria-hidden="true" className="h-3 w-3" /> : null}
                </span>
                {item.title}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">No items yet.</p>
        )}
      </div>

    </article>
  );
}
