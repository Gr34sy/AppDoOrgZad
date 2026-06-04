"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { NoteColorInput } from "@/components/notes/note-color-input";
import { NoteTagInputs } from "@/components/notes/note-tag-inputs";

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
    const noteColor = colorMode === "hexadecimal" ? hexColor.trim() : colorMode;
    const noteTags = tags
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (!title) {
      setError("Tytuł notatki jest wymagany.");
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
      setError("Nie udało się zapisać notatki.");
      setIsSubmitting(false);
      return;
    }

    setMessage("Notatka została zapisana.");
    setIsSubmitting(false);
    onSaved?.();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Edytuj notatkę</h2>

      <div>
        <label htmlFor="title">Tytuł</label>
        <input id="title" name="title" type="text" defaultValue={initialTitle} required />
      </div>

      <div>
        <label htmlFor="content">Treść</label>
        <textarea id="content" name="content" defaultValue={initialContent} />
      </div>

      <NoteColorInput
        colorMode={colorMode}
        hexColor={hexColor}
        onColorModeChange={setColorMode}
        onHexColorChange={setHexColor}
      />

      <NoteTagInputs tags={tags} onChange={setTags} />

      {error ? <p>{error}</p> : null}
      {message ? <p>{message}</p> : null}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Zapisywanie..." : "Zapisz notatkę"}
      </button>
      {onCancel ? (
        <button type="button" onClick={onCancel}>
          Anuluj
        </button>
      ) : null}
    </form>
  );
}
