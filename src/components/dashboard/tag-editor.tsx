import { Plus, Tag, X } from "lucide-react";

type TagEditorProps = {
  tags: string[];
  onChange: (tags: string[]) => void;
};

export function TagEditor({ tags, onChange }: TagEditorProps) {
  const tagFields = tags.length ? tags : [""];

  function updateTag(index: number, value: string) {
    const nextTags = [...tagFields];
    nextTags[index] = value;
    onChange(nextTags);
  }

  function removeTag(index: number) {
    const nextTags = tagFields.filter((_, tagIndex) => tagIndex !== index);
    onChange(nextTags.length ? nextTags : [""]);
  }

  return (
    <fieldset className="grid gap-3">
      <legend className="app-form-legend">Tags</legend>
      <div className="rounded-md bg-zinc-50/80 p-3 shadow-sm dark:bg-zinc-900/70">
        <div className="flex flex-wrap gap-2">
          {tagFields.map((tag, index) => (
            <label
              key={index}
              className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border border-[var(--app-accent)]/35 bg-white px-[0.78125rem] text-[0.9375rem] shadow-sm transition focus-within:border-[var(--app-accent)] focus-within:ring-2 focus-within:ring-[var(--app-accent)]/15 dark:bg-zinc-950"
            >
              <Tag aria-hidden="true" className="h-[1.09375rem] w-[1.09375rem] shrink-0 text-[var(--app-accent)]" />
              <span className="sr-only">Tag {index + 1}</span>
              <input
                type="text"
                value={tag}
                placeholder={`Tag ${index + 1}`}
                onChange={(event) => updateTag(index, event.target.value)}
                size={Math.max(tag.length, `Tag ${index + 1}`.length, 1)}
                className="w-auto min-w-[1ch] bg-transparent text-[0.9375rem] text-zinc-950 outline-none placeholder:text-zinc-400 dark:text-zinc-50 dark:placeholder:text-zinc-500"
              />
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                aria-label={`Remove tag ${index + 1}`}
                title="Remove tag"
              >
                <X aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            </label>
          ))}
          <button
            type="button"
            onClick={() => onChange([...tagFields, ""])}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-dashed border-[var(--app-accent)]/50 px-[0.78125rem] text-[0.9375rem] font-medium text-[var(--app-accent)] transition hover:border-[var(--app-accent)] hover:bg-[var(--app-accent)]/5"
          >
            <Plus aria-hidden="true" className="h-[1.09375rem] w-[1.09375rem]" />
            Add tag
          </button>
        </div>
      </div>
    </fieldset>
  );
}
