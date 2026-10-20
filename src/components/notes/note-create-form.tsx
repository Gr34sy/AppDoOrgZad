"use client";

import { FormEvent, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, X } from "lucide-react";
import { FormShell } from "@/components/dashboard/form-shell";
import { TagEditor } from "@/components/dashboard/tag-editor";
import { getCreatedEntityId } from "@/lib/created-entity-response";

export type CreatedNote = { id: string; title: string; content: string; tags: string[] };
export type NoteLink = { targetType: "note" | "checklist" | "task" | "project"; targetId: string };

type NoteCreateFormProps = {
  linkedItems?: NoteLink[];
  onCreated?: (note: CreatedNote) => void;
  onCancel?: () => void;
  compact?: boolean;
  returnTo?: string;
};

export function NoteCreateForm({ returnTo = "/dashboard/notes", linkedItems = [], onCreated, onCancel, compact = false }: NoteCreateFormProps) {
  const router = useRouter();
  const formId = useId();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState([""]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const content = String(formData.get("content") ?? "");
    const noteTags = tags
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (!title) {
      setError("Note title is required.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title,
          content,
          tags: noteTags,
          ...(linkedItems.length ? { linkedItems } : {})
        })
      });

      if (!response.ok) {
        setError("Could not create the note.");
        setIsSubmitting(false);
        return;
      }

      const noteId = await getCreatedEntityId(response, "note");

      if (onCreated) {
        if (!noteId) throw new Error("Missing created note ID");
        setIsSubmitting(false);
        onCreated({ id: noteId, title, content, tags: noteTags });
        router.refresh();
        return;
      }

      router.push(noteId ? `/dashboard/notes/${noteId}` : returnTo);
      router.refresh();
    } catch {
      setError("Could not create the note.");
      setIsSubmitting(false);
    }
  }

  return (
    <FormShell entityType="note" mode="create" onSubmit={handleSubmit}>
      <div className="app-form-field">
        <label htmlFor={`${formId}-title`} className="app-form-label">
          Title
        </label>
        <input
          id={`${formId}-title`}
          name="title"
          type="text"
          required
          autoFocus={compact}
          placeholder="Give this note a clear name"
          className="app-form-control"
        />
      </div>

      <div className="app-form-field">
        <label htmlFor={`${formId}-content`} className="app-form-label">
          Content
        </label>
        <textarea
          id={`${formId}-content`}
          name="content"
          rows={compact ? 4 : 12}
          placeholder="Write the note..."
          className={`app-form-textarea ${compact ? "min-h-32" : "min-h-72"}`}
        />
      </div>

      <TagEditor tags={tags} onChange={setTags} />

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[var(--app-accent)] px-4 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit"
      >
        <Save aria-hidden="true" className="h-4 w-4" />
        {isSubmitting ? "Creating..." : "Create note"}
      </button>
      {onCancel ? (
        <button type="button" onClick={onCancel} disabled={isSubmitting} className="app-form-secondary-button">
          <X aria-hidden="true" className="h-4 w-4" />
          Cancel
        </button>
      ) : null}
    </FormShell>
  );
}
