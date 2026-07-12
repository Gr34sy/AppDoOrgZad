import { isValidObjectId } from "mongoose";
import { Checklist } from "@/models/checklist";
import { Note } from "@/models/note";
import { Project } from "@/models/project";
import { Task } from "@/models/task";

type LinkedItem = {
  targetType: "note" | "checklist" | "task" | "project";
  targetId: string;
};

const modelByType = {
  note: Note,
  checklist: Checklist,
  task: Task,
  project: Project
};

export async function areValidNoteLinks(linkedItems: LinkedItem[], ownerId: string) {
  if (linkedItems.some((item) => !isValidObjectId(item.targetId))) {
    return false;
  }

  const uniqueLinks = new Set(linkedItems.map((item) => `${item.targetType}:${item.targetId}`));

  if (uniqueLinks.size !== linkedItems.length) {
    return false;
  }

  const results = await Promise.all(
    linkedItems.map((item) =>
      modelByType[item.targetType].exists({
        _id: item.targetId,
        ownerId,
        archivedAt: null
      })
    )
  );

  return results.every(Boolean);
}
