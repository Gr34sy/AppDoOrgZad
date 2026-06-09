"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, X } from "lucide-react";
import { TagInputs } from "@/components/dashboard/tag-inputs";
import { NoteColorInput } from "@/components/notes/note-color-input";

type NoteEditFormProps = {
  noteId: string;
  initialTitle: string;
  initialContent: string;
  initialColor: string;
  initialTags: string[];
  onCancel?: () => void;
  onSaved?: () => void;
};

export function NoteEditForm({
  noteId,
  initialTitle,
  initialContent,
  initialColor,
  initialTags,
  onCancel,
  onSaved
}: NoteEditFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState(initialTags.length ? initialTags : [""]);
  const [colorMode, setColorMode] = useState(initialColor ? "hexadecimal" : "");
  const [hexColor, setHexColor] = useState(initialColor);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const content = String(formData.get("content") ?? "");
    const noteColor = colorMode === "hexadecimal" ? hexColor.trim() || "#fff7cc" : colorMode;
    const noteTags = tags
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (!title) {
      setError("Note title is required.");
      setIsSubmitting(false);
      return;
    }

    const response = await fetch(`/api/notes/${noteId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title,
        content,
        color: noteColor,
        tags: noteTags
      })
    });

    if (!response.ok) {
      setError("Could not save the note.");
      setIsSubmitting(false);
      return;
    }

    setMessage("Note saved.");
    setIsSubmitting(false);
    onSaved?.();
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-6 rounded-md border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h2 className="text-lg font-semibold tracking-normal text-zinc-950 dark:text-zinc-50">
        Edit note
      </h2>

      <div className="grid gap-2">
        <label htmlFor="title" className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          defaultValue={initialTitle}
          required
          className="h-12 rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-950 shadow-sm outline-none transition focus:border-[var(--app-accent)] focus:ring-2 focus:ring-[var(--app-accent)]/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="content" className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
          Content
        </label>
        <textarea
          id="content"
          name="content"
          defaultValue={initialContent}
          rows={12}
          className="min-h-72 resize-y rounded-md border border-zinc-300 bg-white px-3 py-3 text-sm leading-6 text-zinc-950 shadow-sm outline-none transition focus:border-[var(--app-accent)] focus:ring-2 focus:ring-[var(--app-accent)]/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>

      <NoteColorInput
        colorMode={colorMode}
        hexColor={hexColor}
        onColorModeChange={setColorMode}
        onHexColorChange={setHexColor}
      />

      <TagInputs tags={tags} onChange={setTags} />

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 items-center gap-2 rounded-md bg-[var(--app-accent)] px-4 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save aria-hidden="true" className="h-4 w-4" />
          {isSubmitting ? "Saving..." : "Save note"}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-11 items-center gap-2 rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition hover:border-zinc-500 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-white"
          >
            <X aria-hidden="true" className="h-4 w-4" />
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
