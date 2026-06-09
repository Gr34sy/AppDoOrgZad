"use client";

import { Plus, X } from "lucide-react";

type TagInputsProps = {
  tags: string[];
  onChange: (tags: string[]) => void;
};

export function TagInputs({ tags, onChange }: TagInputsProps) {
  function updateTag(index: number, value: string) {
    const nextTags = [...tags];
    nextTags[index] = value;
    onChange(nextTags);
  }

  function removeTag(index: number) {
    const nextTags = tags.filter((_, tagIndex) => tagIndex !== index);
    onChange(nextTags.length ? nextTags : [""]);
  }

  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Tags</legend>
      <div className="grid gap-2">
        {tags.map((tag, index) => (
          <div key={index} className="grid grid-cols-[minmax(0,1fr)_2.75rem] gap-2">
            <label htmlFor={`tag-${index}`} className="sr-only">
              Tag {index + 1}
            </label>
            <input
              id={`tag-${index}`}
              type="text"
              value={tag}
              placeholder={`Tag ${index + 1}`}
              onChange={(event) => updateTag(index, event.target.value)}
              className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-[var(--app-accent)] focus:ring-2 focus:ring-[var(--app-accent)]/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500"
            />
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="grid h-11 place-items-center rounded-md border border-zinc-300 text-zinc-500 transition hover:border-red-300 hover:text-red-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-red-500/60 dark:hover:text-red-300"
              aria-label={`Remove tag ${index + 1}`}
              title="Remove tag"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...tags, ""])}
        className="inline-flex h-10 w-fit items-center gap-2 rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-700 transition hover:border-[var(--app-accent)] hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-[var(--app-accent)] dark:hover:text-white"
      >
        <Plus aria-hidden="true" className="h-4 w-4" />
        Add tag
      </button>
    </fieldset>
  );
}
