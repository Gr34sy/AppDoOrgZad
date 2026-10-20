import { Note } from "@/models/note";
import { recordActivityEvent } from "@/lib/activity-events";

export async function createLinkedNotes({ ownerId, targetType, targetId, notes }: {
  ownerId: string;
  targetType: "task" | "project";
  targetId: string;
  notes: Array<{ title: string }>;
}) {
  return Promise.all(notes.map(async ({ title }) => {
    const note = await Note.create({
      title,
      content: "",
      ownerId,
      linkedItems: [{ targetType, targetId }]
    });
    await recordActivityEvent({ ownerId, entityType: "note", entityId: note.id, action: "created" });
    return note;
  }));
}
