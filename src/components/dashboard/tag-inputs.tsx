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
      <legend className="app-form-legend">Tags</legend>
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
              className="app-form-control"
            />
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="app-form-icon-button"
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
        className="app-form-secondary-button"
      >
        <Plus aria-hidden="true" className="h-4 w-4" />
        Add tag
      </button>
    </fieldset>
  );
}
