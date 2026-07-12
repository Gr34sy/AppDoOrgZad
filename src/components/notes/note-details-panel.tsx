"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Link2, Plus, StickyNote, Tag, X } from "lucide-react";
import { DeleteEntityButton } from "@/components/dashboard/delete-entity-button";
import { InlineEditableField } from "@/components/dashboard/inline-editable-field";
import { PinEntityButton } from "@/components/dashboard/pin-entity-button";
import { SaveChangesButton } from "@/components/dashboard/save-changes-button";

type LinkedItem = {
  targetType: "note" | "checklist" | "task" | "project";
  targetId: string;
};

type LinkOption = LinkedItem & {
  title: string;
  href: string;
};

type NoteDetailsPanelProps = {
  noteId: string;
  title: string;
  content: string;
  tags: string[];
  linkedItems: LinkedItem[];
  linkOptions: LinkOption[];
  createdAtLabel?: string;
  updatedAtLabel?: string;
  pinId?: string;
};

function normalizeTags(tags: string[]) {
  return tags.map((tag) => tag.trim()).filter(Boolean);
}

function NoteTagPreview({ tags }: { tags: string[] }) {
  if (!tags.length) {
    return (
      <span className="inline-flex items-center gap-2 text-[0.9375rem] opacity-75">
        <Tag aria-hidden="true" className="h-[1.09375rem] w-[1.09375rem] opacity-80" />
        No tags
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Tag aria-hidden="true" className="h-[1.09375rem] w-[1.09375rem] shrink-0 opacity-80" />
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center rounded-full border border-current px-[0.78125rem] py-[0.3125rem] text-[0.9375rem] font-medium"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

export function NoteDetailsPanel({
  noteId,
  title,
  content,
  tags,
  linkedItems,
  linkOptions,
  createdAtLabel,
  updatedAtLabel,
  pinId
}: NoteDetailsPanelProps) {
  const router = useRouter();
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftContent, setDraftContent] = useState(content);
  const [draftTags, setDraftTags] = useState(tags.length ? tags : [""]);
  const [isTagEditorOpen, setIsTagEditorOpen] = useState(false);
  const [draftLinkedItems, setDraftLinkedItems] = useState(linkedItems);
  const [selectedLinkKey, setSelectedLinkKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const normalizedDraftTags = normalizeTags(draftTags);
  const isDirty =
    draftTitle.trim() !== title.trim() ||
    draftContent !== content ||
    normalizedDraftTags.join("\n") !== tags.join("\n") ||
    draftLinkedItems.map((item) => `${item.targetType}:${item.targetId}`).join("\n") !==
      linkedItems.map((item) => `${item.targetType}:${item.targetId}`).join("\n");

  useEffect(() => {
    setDraftTitle(title);
    setDraftContent(content);
    setDraftTags(tags.length ? tags : [""]);
    setDraftLinkedItems(linkedItems);
  }, [title, content, tags, linkedItems]);

  function resetDrafts() {
    setDraftTitle(title);
    setDraftContent(content);
    setDraftTags(tags.length ? tags : [""]);
    setDraftLinkedItems(linkedItems);
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
    const response = await fetch(`/api/notes/${noteId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: draftTitle.trim(),
        content: draftContent,
        tags: normalizedDraftTags,
        linkedItems: draftLinkedItems
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
          targetType="note"
          targetId={noteId}
          initialPinId={pinId}
          className="-mb-5 z-10"
        />
      </div>

      <div
        className="min-h-[20rem] rounded-md border border-zinc-200 bg-[var(--app-sidebar-background)] p-4 text-zinc-950 shadow-sm sm:min-h-[28rem] sm:p-6 dark:border-zinc-800 dark:text-zinc-50"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <StickyNote
              aria-hidden="true"
              className="mt-2 h-7 w-7 shrink-0 text-[var(--app-accent)]"
            />
            <InlineEditableField
              value={draftTitle}
              onChange={setDraftTitle}
              required
              className="min-w-0 break-words p-1 text-2xl font-semibold tracking-normal sm:text-3xl"
              inputClassName="w-full rounded-md border border-[var(--app-accent)] bg-white/80 px-2 py-1 text-2xl font-semibold outline-none ring-2 ring-[var(--app-accent)]/15 sm:text-3xl"
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
                className="inline-flex h-10 w-full items-center justify-center rounded-md border border-black/20 px-3 text-sm font-medium transition hover:border-black/40 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                Cancel
              </button>
            ) : null}
            <DeleteEntityButton
              endpoint={`/api/notes/${noteId}`}
              redirectTo="/dashboard/notes"
              label="Delete"
              errorLabel="Could not delete the note."
              iconOnly
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm opacity-75">
          {createdAtLabel ? (
            <span>
              <strong className="font-semibold">Created:</strong> {createdAtLabel}
            </span>
          ) : null}
          {updatedAtLabel ? (
            <span>
              <strong className="font-semibold">Updated:</strong> {updatedAtLabel}
            </span>
          ) : null}
        </div>

        <div className="mt-6">
          {isTagEditorOpen ? (
            <div className="rounded-md border border-black/10 bg-white/35 p-3 shadow-sm backdrop-blur-sm">
              <div className="flex flex-wrap gap-2">
                {draftTags.map((tag, index) => (
                  <label
                    key={index}
                    className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border border-current bg-white/35 px-[0.78125rem] text-[0.9375rem] shadow-sm transition focus-within:ring-2 focus-within:ring-black/10"
                  >
                    <Tag aria-hidden="true" className="h-[1.09375rem] w-[1.09375rem] shrink-0 opacity-80" />
                    <span className="sr-only">Tag {index + 1}</span>
                    <input
                      type="text"
                      value={tag}
                      placeholder={`Tag ${index + 1}`}
                      onChange={(event) => updateTag(index, event.target.value)}
                      size={Math.max(tag.length, `Tag ${index + 1}`.length, 1)}
                      className="w-auto min-w-[1ch] bg-transparent text-[0.9375rem] outline-none placeholder:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-full opacity-70 transition hover:bg-red-50 hover:text-red-600 hover:opacity-100"
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
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-dashed border-current px-[0.78125rem] text-[0.9375rem] font-medium transition hover:bg-white/25"
                >
                  <Plus aria-hidden="true" className="h-[1.09375rem] w-[1.09375rem]" />
                  Add tag
                </button>
                <button
                  type="button"
                  onClick={() => setIsTagEditorOpen(false)}
                  className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10"
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
              className="group -m-2 flex w-fit max-w-full rounded-md p-2 text-left transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10"
            >
              <NoteTagPreview tags={normalizedDraftTags} />
            </button>
          )}
        </div>

        <InlineEditableField
          value={draftContent}
          onChange={setDraftContent}
          multiline
          emptyLabel="No content yet."
          className="mt-6 whitespace-pre-wrap p-1 text-sm leading-7 opacity-90"
          inputClassName="mt-6 min-h-40 w-full rounded-md border border-[var(--app-accent)] bg-white/80 px-3 py-3 text-sm leading-7 outline-none ring-2 ring-[var(--app-accent)]/15"
        />

        <section className="mt-8 border-t border-zinc-200 pt-5 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Link2 aria-hidden="true" className="h-4 w-4 text-[var(--app-accent)]" />
            <h2 className="text-sm font-semibold">Linked items</h2>
          </div>

          {draftLinkedItems.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {draftLinkedItems.map((linkedItem) => {
                const option = linkOptions.find((candidate) =>
                  candidate.targetType === linkedItem.targetType && candidate.targetId === linkedItem.targetId
                );

                return (
                  <span key={`${linkedItem.targetType}:${linkedItem.targetId}`} className="inline-flex max-w-full items-center rounded-md border border-zinc-200 bg-white text-sm dark:border-zinc-700 dark:bg-zinc-900">
                    {option ? (
                      <Link href={option.href} className="min-w-0 truncate px-3 py-2 hover:text-[var(--app-accent)]">
                        <span className="mr-2 text-xs uppercase text-zinc-500">{linkedItem.targetType}</span>
                        {option.title}
                      </Link>
                    ) : (
                      <span className="px-3 py-2 text-zinc-500">Unavailable item</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setDraftLinkedItems((current) => current.filter((item) => !(item.targetType === linkedItem.targetType && item.targetId === linkedItem.targetId)))}
                      className="grid h-9 w-9 shrink-0 place-items-center border-l border-zinc-200 text-zinc-500 hover:text-red-600 dark:border-zinc-700"
                      aria-label={`Remove linked ${linkedItem.targetType}`}
                    >
                      <X aria-hidden="true" className="h-4 w-4" />
                    </button>
                  </span>
                );
              })}
            </div>
          ) : <p className="mt-3 text-sm text-zinc-500">No linked items.</p>}

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <select value={selectedLinkKey} onChange={(event) => setSelectedLinkKey(event.target.value)} className="h-10 min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900">
              <option value="">Select an item</option>
              {linkOptions.filter((option) => !draftLinkedItems.some((item) => item.targetType === option.targetType && item.targetId === option.targetId)).map((option) => (
                <option key={`${option.targetType}:${option.targetId}`} value={`${option.targetType}:${option.targetId}`}>
                  {option.targetType}: {option.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!selectedLinkKey}
              onClick={() => {
                const option = linkOptions.find((candidate) => `${candidate.targetType}:${candidate.targetId}` === selectedLinkKey);
                if (option) setDraftLinkedItems((current) => [...current, { targetType: option.targetType, targetId: option.targetId }]);
                setSelectedLinkKey("");
              }}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--app-accent)] px-4 text-sm font-medium text-white disabled:opacity-50"
            >
              <Plus aria-hidden="true" className="h-4 w-4" /> Add link
            </button>
          </div>
        </section>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      </div>

    </article>
  );
}
