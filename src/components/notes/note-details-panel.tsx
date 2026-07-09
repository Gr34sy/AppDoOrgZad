"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StickyNote } from "lucide-react";
import { DeleteEntityButton } from "@/components/dashboard/delete-entity-button";
import { DetailsMeta } from "@/components/dashboard/details-meta";
import { InlineEditableField } from "@/components/dashboard/inline-editable-field";
import { PinEntityButton } from "@/components/dashboard/pin-entity-button";
import { SaveChangesButton } from "@/components/dashboard/save-changes-button";
import { TagInputs } from "@/components/dashboard/tag-inputs";
import { getNoteCardStyle } from "@/lib/note-colors";

type NoteDetailsPanelProps = {
  noteId: string;
  title: string;
  content: string;
  color: string;
  tags: string[];
  createdAtLabel?: string;
  updatedAtLabel?: string;
  pinId?: string;
};

function normalizeTags(tags: string[]) {
  return tags.map((tag) => tag.trim()).filter(Boolean);
}

export function NoteDetailsPanel({
  noteId,
  title,
  content,
  color,
  tags,
  createdAtLabel,
  updatedAtLabel,
  pinId
}: NoteDetailsPanelProps) {
  const router = useRouter();
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftContent, setDraftContent] = useState(content);
  const [draftTags, setDraftTags] = useState(tags.length ? tags : [""]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const noteStyle = getNoteCardStyle(color);
  const normalizedDraftTags = normalizeTags(draftTags);
  const isDirty =
    draftTitle.trim() !== title.trim() ||
    draftContent !== content ||
    normalizedDraftTags.join("\n") !== tags.join("\n");

  useEffect(() => {
    setDraftTitle(title);
    setDraftContent(content);
    setDraftTags(tags.length ? tags : [""]);
  }, [title, content, tags]);

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
          targetType="note"
          targetId={noteId}
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
            endpoint={`/api/notes/${noteId}`}
            redirectTo="/dashboard/notes"
            label="Delete"
            errorLabel="Could not delete the note."
          />
        </div>
        {error ? <p className="text-sm text-red-600 dark:text-red-300 sm:w-full">{error}</p> : null}
      </div>

      <div
        className="min-h-[20rem] rounded-md border p-4 shadow-sm sm:min-h-[28rem] sm:p-6"
        style={noteStyle}
      >
        <div className="flex items-start justify-between gap-4">
          <InlineEditableField
            value={draftTitle}
            onChange={setDraftTitle}
            required
            className="max-w-3xl break-words p-1 text-2xl font-semibold tracking-normal sm:text-3xl"
            inputClassName="w-full rounded-md border border-[var(--app-accent)] bg-white/80 px-2 py-1 text-2xl font-semibold outline-none ring-2 ring-[var(--app-accent)]/15 sm:text-3xl"
          />
          <StickyNote aria-hidden="true" className="h-7 w-7 shrink-0 opacity-60" />
        </div>

        <InlineEditableField
          value={draftContent}
          onChange={setDraftContent}
          multiline
          emptyLabel="No content yet."
          className="mt-6 whitespace-pre-wrap p-1 text-sm leading-7 opacity-90"
          inputClassName="mt-6 min-h-40 w-full rounded-md border border-[var(--app-accent)] bg-white/80 px-3 py-3 text-sm leading-7 outline-none ring-2 ring-[var(--app-accent)]/15"
        />

        <div className="mt-8 rounded-md border border-black/10 bg-white/35 p-3 backdrop-blur-sm">
          <TagInputs tags={draftTags} onChange={setDraftTags} />
        </div>
      </div>

    </article>
  );
}
