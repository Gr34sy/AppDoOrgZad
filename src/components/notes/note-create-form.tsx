"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
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
    const noteColor = colorMode === "hexadecimal" ? hexColor.trim() : colorMode;
    const noteTags = tags
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (!title) {
      setError("Tytuł notatki jest wymagany.");
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
      setError("Nie udało się dodać notatki.");
      setIsSubmitting(false);
      return;
    }

    router.push("/dashboard/notes");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="title">Tytuł</label>
        <input id="title" name="title" type="text" required />
      </div>

      <div>
        <label htmlFor="content">Treść</label>
        <textarea id="content" name="content" />
      </div>

      <NoteColorInput
        colorMode={colorMode}
        hexColor={hexColor}
        onColorModeChange={setColorMode}
        onHexColorChange={setHexColor}
      />

      <TagInputs tags={tags} onChange={setTags} />

      {error ? <p>{error}</p> : null}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Dodawanie..." : "Dodaj notatkę"}
      </button>
    </form>
  );
}
