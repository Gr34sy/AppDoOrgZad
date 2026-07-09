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
      className="app-form-panel"
    >
      <div className="app-form-field">
        <label htmlFor="title" className="app-form-label">
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          placeholder="Give this note a clear name"
          className="app-form-control"
        />
      </div>

      <div className="app-form-field">
        <label htmlFor="content" className="app-form-label">
          Content
        </label>
        <textarea
          id="content"
          name="content"
          rows={12}
          placeholder="Write the note..."
          className="app-form-textarea min-h-72"
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
