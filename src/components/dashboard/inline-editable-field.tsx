"use client";

import { KeyboardEvent, RefObject, useEffect, useRef, useState } from "react";

type InlineEditableFieldProps = {
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  required?: boolean;
  emptyLabel?: string;
  className?: string;
  inputClassName?: string;
};

export function InlineEditableField({
  value,
  onChange,
  multiline = false,
  required = false,
  emptyLabel = "Click to add",
  className = "",
  inputClassName = ""
}: InlineEditableFieldProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [valueBeforeEdit, setValueBeforeEdit] = useState(value);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  function startEdit() {
    setValueBeforeEdit(value);
    setIsEditing(true);
  }

  function finishEdit() {
    if (required && !value.trim()) {
      onChange(valueBeforeEdit);
    }

    setIsEditing(false);
  }

  function cancelEdit() {
    onChange(valueBeforeEdit);
    setIsEditing(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (event.key === "Escape") {
      cancelEdit();
    }

    if (!multiline && event.key === "Enter") {
      event.preventDefault();
      finishEdit();
    }

    if (multiline && event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      finishEdit();
    }
  }

  if (isEditing) {
    const controlClassName =
      inputClassName ||
      "w-full rounded-md border border-[var(--app-accent)] bg-white px-3 py-2 text-sm text-zinc-950 outline-none ring-2 ring-[var(--app-accent)]/15 dark:bg-zinc-900 dark:text-zinc-50";

    return (
      <div className="grid gap-1">
        {multiline ? (
          <textarea
            ref={inputRef as RefObject<HTMLTextAreaElement>}
            value={value}
            rows={6}
            onChange={(event) => onChange(event.target.value)}
            onBlur={finishEdit}
            onKeyDown={handleKeyDown}
            className={controlClassName}
          />
        ) : (
          <input
            ref={inputRef as RefObject<HTMLInputElement>}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onBlur={finishEdit}
            onKeyDown={handleKeyDown}
            className={controlClassName}
          />
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      className={`block w-full cursor-text rounded-md text-left outline-none transition hover:bg-[var(--dashboard-accent-muted)] focus-visible:ring-2 focus-visible:ring-[var(--app-accent)]/25 ${className}`}
    >
      {value ? value : <span className="text-zinc-500 dark:text-zinc-400">{emptyLabel}</span>}
    </button>
  );
}
