"use client";

import { useState } from "react";
import { NoteEditForm } from "@/components/notes/note-edit-form";

type NoteDetailsPanelProps = {
  noteId: string;
  title: string;
  content: string;
  color: string;
  tags: string[];
  createdAtLabel?: string;
  updatedAtLabel?: string;
};

export function NoteDetailsPanel({
  noteId,
  title,
  content,
  color,
  tags,
  createdAtLabel,
  updatedAtLabel
}: NoteDetailsPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const noteColor = color.trim();
  const hasColor = Boolean(noteColor);

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
    <article
      style={{
        backgroundColor: hasColor ? noteColor : "#ffffff",
        border: hasColor ? "1px solid transparent" : "1px solid #000000",
        color: "#000000"
      }}
    >
      <button type="button" onClick={() => setIsEditing(true)}>
        Edytuj
      </button>

      <h1>{title}</h1>
      {content ? <p>{content}</p> : null}
      {tags.length ? <p>{tags.join(", ")}</p> : null}
      {createdAtLabel ? <p>created: {createdAtLabel}</p> : null}
      {updatedAtLabel ? <p>updated: {updatedAtLabel}</p> : null}
    </article>
  );
}
