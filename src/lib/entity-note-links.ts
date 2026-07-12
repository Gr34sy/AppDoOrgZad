import { isValidObjectId } from "mongoose";
import { Note } from "@/models/note";

type LinkableEntityType = "task" | "project";

export async function areValidNoteIds(noteIds: string[], ownerId: string) {
  const uniqueNoteIds = Array.from(new Set(noteIds.filter(Boolean)));

  if (uniqueNoteIds.length !== noteIds.filter(Boolean).length) {
    return false;
  }

  if (uniqueNoteIds.some((noteId) => !isValidObjectId(noteId))) {
    return false;
  }

  const existingNoteCount = await Note.countDocuments({
    _id: { $in: uniqueNoteIds },
    ownerId,
    archivedAt: null
  });

  return existingNoteCount === uniqueNoteIds.length;
}

export async function syncEntityNoteLinks({
  ownerId,
  targetType,
  targetId,
  noteIds
}: {
  ownerId: string;
  targetType: LinkableEntityType;
  targetId: string;
  noteIds: string[];
}) {
  const uniqueNoteIds = Array.from(new Set(noteIds.filter(Boolean)));
  const linkedItem = { targetType, targetId };

  await Note.updateMany(
    {
      ownerId,
      archivedAt: null,
      _id: { $nin: uniqueNoteIds },
      linkedItems: { $elemMatch: linkedItem }
    },
    {
      $pull: { linkedItems: linkedItem }
    }
  );

  if (!uniqueNoteIds.length) {
    return;
  }

  await Note.updateMany(
    {
      _id: { $in: uniqueNoteIds },
      ownerId,
      archivedAt: null
    },
    {
      $addToSet: { linkedItems: linkedItem }
    }
  );
}
