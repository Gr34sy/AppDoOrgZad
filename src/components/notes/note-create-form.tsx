"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { TagInputs } from "@/components/dashboard/tag-inputs";
import { NoteColorInput } from "@/components/notes/note-color-input";

export function NoteCreateForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState([""]);
  const [colorMode, setColorMode] = useState("");
  const [hexColor, setHexColor] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
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

    const response = await fetch("/api/notes", {
      method: "POST",
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
      setError("Could not create the note.");
      setIsSubmitting(false);
      return;
    }

    router.push("/dashboard/notes");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid w-full min-w-0 gap-6 rounded-md border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="grid gap-2">
        <label htmlFor="title" className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          placeholder="Give this note a clear name"
          className="h-12 w-full min-w-0 rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-950 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-[var(--app-accent)] focus:ring-2 focus:ring-[var(--app-accent)]/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500"
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="content" className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
          Content
        </label>
        <textarea
          id="content"
          name="content"
          rows={12}
          placeholder="Write the note..."
          className="min-h-72 w-full min-w-0 resize-y rounded-md border border-zinc-300 bg-white px-3 py-3 text-sm leading-6 text-zinc-950 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-[var(--app-accent)] focus:ring-2 focus:ring-[var(--app-accent)]/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500"
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

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[var(--app-accent)] px-4 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit"
      >
        <Save aria-hidden="true" className="h-4 w-4" />
        {isSubmitting ? "Creating..." : "Create note"}
      </button>
    </form>
  );
}
