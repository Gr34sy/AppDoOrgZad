import { Note } from "@/models/note";
import type { LinkedNoteOption } from "@/components/notes/linked-note-list";
import type { EntityType } from "@/types/domain";

type NoteOptionDocument = {
  _id: unknown;
  title: string;
  content?: string;
  tags?: string[];
  linkedItems?: Array<{ targetType: EntityType; targetId: unknown }>;
};

export async function getNoteOptions(ownerId: string): Promise<LinkedNoteOption[]> {
  const notes = await Note.find({ ownerId, archivedAt: null })
    .select({ title: 1, content: 1, tags: 1, linkedItems: 1 })
    .sort({ title: 1 })
    .lean<NoteOptionDocument[]>();
  return notes.map((note) => ({
    id: String(note._id), title: note.title, content: note.content ?? "", tags: note.tags ?? [],
    linkedItems: (note.linkedItems ?? []).map((link) => ({ targetType: link.targetType, targetId: String(link.targetId) }))
  }));
}
