import { isValidObjectId } from "mongoose";
import { Checklist } from "@/models/checklist";
import { Note } from "@/models/note";
import { Pin } from "@/models/pin";
import { Project } from "@/models/project";
import { Task } from "@/models/task";
import type { PinTargetType } from "@/types/domain";

type ChecklistParentType = "task" | "project";

const targetModelByType = {
  note: Note,
  checklist: Checklist,
  task: Task,
  project: Project
};

export async function ownedActiveEntityExists({
  ownerId,
  targetType,
  targetId
}: {
  ownerId: string;
  targetType: PinTargetType;
  targetId: string;
}) {
  if (!isValidObjectId(targetId)) {
    return false;
  }

  const model = targetModelByType[targetType];
  const entity = await model.exists({
    _id: targetId,
    ownerId,
    archivedAt: null
  });

  return Boolean(entity);
}

export async function validOwnedChecklistIds(checklistIds: string[] | undefined, ownerId: string) {
  if (!checklistIds) {
    return true;
  }

  const uniqueChecklistIds = Array.from(new Set(checklistIds.filter(Boolean)));

  if (uniqueChecklistIds.length !== checklistIds.filter(Boolean).length) {
    return false;
  }

  if (uniqueChecklistIds.some((checklistId) => !isValidObjectId(checklistId))) {
    return false;
  }

  const checklistCount = await Checklist.countDocuments({
    _id: { $in: uniqueChecklistIds },
    ownerId,
    archivedAt: null
  });

  return checklistCount === uniqueChecklistIds.length;
}

export async function validChecklistParent({
  ownerId,
  parentType,
  parentId
}: {
  ownerId: string;
  parentType?: ChecklistParentType | null;
  parentId?: string | null;
}) {
  if (!parentType && !parentId) {
    return true;
  }

  if (!parentType || !parentId) {
    return false;
  }

  return ownedActiveEntityExists({
    ownerId,
    targetType: parentType,
    targetId: parentId
  });
}

export async function cleanupEntityReferences({
  ownerId,
  targetType,
  targetId
}: {
  ownerId: string;
  targetType: PinTargetType;
  targetId: string;
}) {
  await Pin.deleteMany({ ownerId, targetType, targetId });

  await Note.updateMany(
    {
      ownerId,
      archivedAt: null,
      linkedItems: { $elemMatch: { targetType, targetId } }
    },
    {
      $pull: { linkedItems: { targetType, targetId } }
    }
  );

  if (targetType === "checklist") {
    await Task.updateMany(
      { ownerId, archivedAt: null },
      { $pull: { checklistIds: targetId } }
    );
    await Project.updateMany(
      { ownerId, archivedAt: null },
      { $pull: { checklistIds: targetId } }
    );
  }

  if (targetType === "task") {
    await Checklist.updateMany(
      { ownerId, archivedAt: null, parentType: "task", parentId: targetId },
      { $set: { parentType: null, parentId: null } }
    );
    await Project.updateMany(
      { ownerId, archivedAt: null },
      { $pull: { taskIds: targetId } }
    );
  }

  if (targetType === "project") {
    await Checklist.updateMany(
      { ownerId, archivedAt: null, parentType: "project", parentId: targetId },
      { $set: { parentType: null, parentId: null } }
    );
    await Task.updateMany(
      { ownerId, archivedAt: null, projectId: targetId },
      { $set: { projectId: null, statusId: "todo" } }
    );
  }
}
