"use client";

import { useState } from "react";
import { Clock, Edit3, StickyNote, Tag } from "lucide-react";
import { DeleteEntityButton } from "@/components/dashboard/delete-entity-button";
import { PinEntityButton } from "@/components/dashboard/pin-entity-button";
import { NoteEditForm } from "@/components/notes/note-edit-form";
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
  const [isEditing, setIsEditing] = useState(false);
  const noteStyle = getNoteCardStyle(color);

  if (isEditing) {
    return (
      <NoteEditForm
        noteId={noteId}
        initialTitle={title}
        initialContent={content}
        initialColor={color}
        initialTags={tags}
        onCancel={() => setIsEditing(false)}
        onSaved={() => setIsEditing(false)}
      />
    );
  }

  return (
    <article className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-3 text-sm font-medium text-zinc-600 dark:text-zinc-300">
          <StickyNote aria-hidden="true" className="h-5 w-5 text-[var(--app-accent)]" />
          Note details
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
          <PinEntityButton targetType="note" targetId={noteId} initialPinId={pinId} />
          <DeleteEntityButton
            endpoint={`/api/notes/${noteId}`}
            redirectTo="/dashboard/notes"
            label="Delete"
            errorLabel="Could not delete the note."
          />
        </div>
      </div>

      <div
        className="min-h-[20rem] rounded-md border p-4 shadow-sm sm:min-h-[28rem] sm:p-6"
        style={noteStyle}
      >
        <div className="flex items-start justify-between gap-4">
          <h1 className="max-w-3xl break-words text-2xl font-semibold tracking-normal sm:text-3xl">{title}</h1>
          <StickyNote aria-hidden="true" className="h-7 w-7 shrink-0 opacity-60" />
        </div>

        {content ? (
          <div className="mt-6 whitespace-pre-wrap text-sm leading-7 opacity-90">{content}</div>
        ) : (
          <p className="mt-6 text-sm opacity-60">No content yet.</p>
        )}

        {tags.length ? (
          <div className="mt-8 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full border border-current px-2.5 py-1 text-xs font-medium opacity-75"
              >
                <Tag aria-hidden="true" className="h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 rounded-md border border-zinc-200 bg-white p-4 text-sm text-zinc-600 shadow-sm sm:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
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
