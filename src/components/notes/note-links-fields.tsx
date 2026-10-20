"use client";

import { useId, useRef } from "react";
import { Plus, Trash2 } from "lucide-react";

type NoteLinksFieldsProps = {
  options: Array<{ id: string; title: string }>;
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
  newTitles: string[];
  onNewTitlesChange: (titles: string[]) => void;
};

export function NoteLinksFields({ options, selectedIds, onSelectedIdsChange, newTitles, onNewTitlesChange }: NoteLinksFieldsProps) {
  const id = useId();
  const pendingFocus = useRef<number | null>(null);

  return (
    <fieldset className="grid gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <legend className="app-form-legend">Linked notes</legend>
        <button
          type="button"
          onClick={() => {
            pendingFocus.current = newTitles.length;
            onNewTitlesChange([...newTitles, ""]);
          }}
          disabled={newTitles.length >= 50}
          className="app-form-secondary-button sm:w-auto"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          Add note
        </button>
      </div>
      {options.length ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {options.map((note) => (
            <label key={note.id} className="app-form-checkbox-card">
              <input
                type="checkbox"
                checked={selectedIds.includes(note.id)}
                onChange={(event) => onSelectedIdsChange(event.target.checked
                  ? [...selectedIds, note.id]
                  : selectedIds.filter((selectedId) => selectedId !== note.id))}
                className="app-form-checkbox"
              />
              <span className="min-w-0 break-words">{note.title}</span>
            </label>
          ))}
        </div>
      ) : <p className="app-form-hint px-3 py-2">No notes available.</p>}
      {newTitles.length ? (
        <div className="grid gap-2">
          {newTitles.map((title, index) => (
            <div key={index} className="grid gap-2 rounded-md bg-zinc-50/80 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end dark:bg-zinc-900/70">
              <label htmlFor={`${id}-note-${index}`} className="app-form-field">
                <span className="app-form-label">New note title</span>
                <input
                  id={`${id}-note-${index}`}
                  type="text"
                  maxLength={160}
                  value={title}
                  ref={(input) => {
                    if (input && pendingFocus.current === index) {
                      input.focus();
                      pendingFocus.current = null;
                    }
                  }}
                  onChange={(event) => onNewTitlesChange(newTitles.map((current, titleIndex) => titleIndex === index ? event.target.value : current))}
                  className="app-form-control"
                />
              </label>
              <button
                type="button"
                onClick={() => onNewTitlesChange(newTitles.filter((_, titleIndex) => titleIndex !== index))}
                className="app-form-icon-button w-full sm:w-11"
                aria-label={`Remove new note ${index + 1}`}
                title="Remove note"
              ><Trash2 aria-hidden="true" className="h-4 w-4" /></button>
            </div>
          ))}
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Add the content later by opening the note.</p>
        </div>
      ) : null}
    </fieldset>
  );
}
