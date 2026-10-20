"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Link2Off, Plus, StickyNote, X } from "lucide-react";
import { ReturnToLink } from "@/components/dashboard/return-to-link";
import { TagList } from "@/components/dashboard/tag-list";
import { NoteCreateForm, type CreatedNote, type NoteLink } from "@/components/notes/note-create-form";

export type LinkedNoteOption = CreatedNote & { linkedItems: NoteLink[] };

type LinkedNoteListProps = {
  parentType: "task" | "project";
  parentId: string;
  noteOptions: LinkedNoteOption[];
  className?: string;
};

export function LinkedNoteList({ parentType, parentId, noteOptions, className = "" }: LinkedNoteListProps) {
  const router = useRouter();
  const [options, setOptions] = useState(noteOptions);
  const [isAdding, setIsAdding] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const parentLink: NoteLink = { targetType: parentType, targetId: parentId };
  const isParentLink = (link: NoteLink) => link.targetType === parentType && link.targetId === parentId;
  const linkedNotes = options.filter((note) => note.linkedItems.some(isParentLink));
  const availableNotes = options.filter((note) => !note.linkedItems.some(isParentLink));

  useEffect(() => { setOptions(noteOptions); }, [noteOptions]);

  async function saveLinks(noteIds: string[]) {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/${parentType === "task" ? "tasks" : "projects"}/${parentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteIds })
      });
      if (!response.ok) throw new Error("Could not update linked notes.");
      setOptions((current) => current.map((note) => ({
        ...note,
        linkedItems: [
          ...note.linkedItems.filter((link) => !isParentLink(link)),
          ...(noteIds.includes(note.id) ? [parentLink] : [])
        ]
      })));
      setSelectedNoteId("");
      router.refresh();
    } catch {
      setError("Could not update linked notes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={`border-t border-zinc-200 pt-5 dark:border-zinc-800 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <StickyNote aria-hidden="true" className="h-4 w-4 text-[var(--app-accent)]" />
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Notes</h3>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{linkedNotes.length}</span>
        </div>
        <button
          type="button"
          onClick={() => setIsAdding((current) => !current)}
          aria-expanded={isAdding}
          className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-[var(--app-accent)] transition hover:bg-[var(--app-accent)]/5"
        >
          {isAdding ? <X aria-hidden="true" className="h-4 w-4" /> : <Plus aria-hidden="true" className="h-4 w-4" />}
          {isAdding ? "Close" : "Add note"}
        </button>
      </div>
      {isAdding ? (
        <div className="mt-4 grid gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <select
              aria-label="Existing note"
              value={selectedNoteId}
              onChange={(event) => setSelectedNoteId(event.target.value)}
              disabled={saving || isCreating}
              className="app-select h-9 min-w-0 flex-1 rounded-md bg-zinc-100 px-3 text-sm outline-none dark:bg-zinc-900"
            >
              <option value="">Existing note</option>
              {availableNotes.map((note) => <option key={note.id} value={note.id}>{note.title}</option>)}
            </select>
            <button
              type="button" disabled={!selectedNoteId || saving || isCreating}
              onClick={() => void saveLinks([...linkedNotes.map((note) => note.id), selectedNoteId])}
              className="h-9 rounded-md px-3 text-sm font-medium text-[var(--app-accent)] transition hover:bg-[var(--app-accent)]/5 disabled:opacity-40"
            >Attach</button>
            <button type="button" onClick={() => setIsCreating(true)} disabled={isCreating || saving} className="app-form-secondary-button">
              <Plus aria-hidden="true" className="h-4 w-4" />New note
            </button>
          </div>
          {isCreating ? (
            <NoteCreateForm
              compact
              linkedItems={[parentLink]}
              onCancel={() => setIsCreating(false)}
              onCreated={(note) => {
                setOptions((current) => [...current.filter((option) => option.id !== note.id), { ...note, linkedItems: [parentLink] }]);
                setIsCreating(false);
                setIsAdding(false);
              }}
            />
          ) : null}
        </div>
      ) : null}
      <div className="mt-3">
        {linkedNotes.map((note) => (
          <div key={note.id} className="flex min-w-0 items-start gap-2 border-t border-zinc-200 py-3 first:border-t-0 dark:border-zinc-800">
            <ReturnToLink href={`/dashboard/notes/${note.id}`} className="group min-w-0 flex-1 rounded-md p-2 transition hover:bg-zinc-50 dark:hover:bg-zinc-900">
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 break-words text-sm font-medium text-zinc-800 dark:text-zinc-100">{note.title}</span>
                <ExternalLink aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-zinc-400 group-hover:text-[var(--app-accent)]" />
              </div>
              <TagList tags={note.tags} className="mt-2" limit={4} size="compact" />
            </ReturnToLink>
            <button
              type="button" disabled={saving || isCreating}
              onClick={() => void saveLinks(linkedNotes.filter((item) => item.id !== note.id).map((item) => item.id))}
              aria-label={`Unlink ${note.title}`} title="Unlink note"
              className="mt-2 grid h-7 w-7 shrink-0 place-items-center rounded text-zinc-400 transition hover:bg-zinc-100 hover:text-[var(--app-accent)] disabled:opacity-40 dark:hover:bg-zinc-900"
            ><Link2Off aria-hidden="true" className="h-3.5 w-3.5" /></button>
          </div>
        ))}
        {!linkedNotes.length ? <p className="py-3 text-sm text-zinc-500 dark:text-zinc-400">No linked notes.</p> : null}
      </div>
      {error ? <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-300">{error}</p> : null}
    </section>
  );
}
