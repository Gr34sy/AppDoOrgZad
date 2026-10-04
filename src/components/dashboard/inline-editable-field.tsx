"use client";

import { ChangeEvent, KeyboardEvent, RefObject, useEffect, useRef, useState } from "react";

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
  const previewRef = useRef<HTMLButtonElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [valueBeforeEdit, setValueBeforeEdit] = useState(value);
  const [editHeight, setEditHeight] = useState<number | null>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  function startEdit() {
    setValueBeforeEdit(value);
    setEditHeight(multiline ? previewRef.current?.offsetHeight ?? null : null);
    setIsEditing(true);
  }

  function handleMultilineChange(event: ChangeEvent<HTMLTextAreaElement>) {
    onChange(event.target.value);
    event.currentTarget.style.height = "auto";
    const nextHeight = Math.max(editHeight ?? 0, event.currentTarget.scrollHeight);
    event.currentTarget.style.height = `${nextHeight}px`;
    setEditHeight(nextHeight);
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
      "w-full rounded-md bg-zinc-100/80 px-3 py-2 text-sm text-zinc-950 outline-none dark:bg-zinc-900 dark:text-zinc-50";

    return multiline ? (
      <textarea
        ref={inputRef as RefObject<HTMLTextAreaElement>}
        value={value}
        rows={1}
        onChange={handleMultilineChange}
        onBlur={finishEdit}
        onKeyDown={handleKeyDown}
        style={editHeight ? { height: `${editHeight}px` } : undefined}
        className={`${controlClassName} min-w-0 flex-1 resize-none overflow-hidden border-0`}
      />
    ) : (
      <input
        ref={inputRef as RefObject<HTMLInputElement>}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={finishEdit}
        onKeyDown={handleKeyDown}
        className={`${controlClassName} min-w-0 flex-1 border-0`}
      />
    );
  }

  return (
    <button
      ref={previewRef}
      type="button"
      onClick={startEdit}
      className={`block w-full cursor-text rounded-md text-left outline-none transition hover:bg-zinc-100/80 focus-visible:bg-zinc-100/80 dark:hover:bg-zinc-900 dark:focus-visible:bg-zinc-900 ${className}`}
    >
      {value ? value : <span className="text-zinc-500 dark:text-zinc-400">{emptyLabel}</span>}
    </button>
  );
}
