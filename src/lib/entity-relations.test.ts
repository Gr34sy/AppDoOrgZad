import { beforeEach, describe, expect, it, vi } from "vitest";
import { Checklist } from "@/models/checklist";
import { Note } from "@/models/note";
import { Pin } from "@/models/pin";
import { Project } from "@/models/project";
import { Task } from "@/models/task";
import {
  cleanupEntityReferences,
  ownedActiveEntityExists,
  validChecklistParent,
  validOwnedChecklistIds
} from "@/lib/entity-relations";

vi.mock("@/models/checklist", () => ({
  Checklist: {
    countDocuments: vi.fn(),
    exists: vi.fn(),
    updateMany: vi.fn()
  }
}));

vi.mock("@/models/note", () => ({
  Note: {
    exists: vi.fn(),
    updateMany: vi.fn()
  }
}));

vi.mock("@/models/pin", () => ({
  Pin: {
    deleteMany: vi.fn()
  }
}));

vi.mock("@/models/project", () => ({
  Project: {
    countDocuments: vi.fn(),
    exists: vi.fn(),
    updateMany: vi.fn()
  }
}));

vi.mock("@/models/task", () => ({
  Task: {
    exists: vi.fn(),
    updateMany: vi.fn()
  }
}));

const ownerId = "665f1f77bcf86cd799439001";
const taskId = "665f1f77bcf86cd799439013";
const checklistId = "665f1f77bcf86cd799439012";

describe("entity relations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects relation checks for invalid object ids", async () => {
    const result = await ownedActiveEntityExists({
      ownerId,
      targetType: "task",
      targetId: "bad-id"
    });

    expect(result).toBe(false);
    expect(Task.exists).not.toHaveBeenCalled();
  });

  it("checks whether a target belongs to the current user and is active", async () => {
    vi.mocked(Task.exists).mockResolvedValue({ _id: taskId } as never);

    const result = await ownedActiveEntityExists({
      ownerId,
      targetType: "task",
      targetId: taskId
    });

    expect(result).toBe(true);
    expect(Task.exists).toHaveBeenCalledWith({
      _id: taskId,
      ownerId,
      archivedAt: null
    });
  });

  it("rejects duplicate checklist ids", async () => {
    const result = await validOwnedChecklistIds([checklistId, checklistId], ownerId);

    expect(result).toBe(false);
    expect(Checklist.countDocuments).not.toHaveBeenCalled();
  });

  it("validates checklist parents through the related entity", async () => {
    vi.mocked(Project.exists).mockResolvedValue({ _id: taskId } as never);

    const result = await validChecklistParent({
      ownerId,
      parentType: "project",
      parentId: taskId
    });

    expect(result).toBe(true);
    expect(Project.exists).toHaveBeenCalledWith({
      _id: taskId,
      ownerId,
      archivedAt: null
    });
  });

  it("cleans references when a project is archived", async () => {
    await cleanupEntityReferences({
      ownerId,
      targetType: "project",
      targetId: taskId
    });

    expect(Pin.deleteMany).toHaveBeenCalledWith({
      ownerId,
      targetType: "project",
      targetId: taskId
    });
    expect(Note.updateMany).toHaveBeenCalledWith(
      {
        ownerId,
        archivedAt: null,
        linkedItems: { $elemMatch: { targetType: "project", targetId: taskId } }
      },
      {
        $pull: { linkedItems: { targetType: "project", targetId: taskId } }
      }
    );
    expect(Checklist.updateMany).toHaveBeenCalledWith(
      { ownerId, archivedAt: null, parentType: "project", parentId: taskId },
      { $set: { parentType: null, parentId: null } }
    );
    expect(Task.updateMany).toHaveBeenCalledWith(
      { ownerId, archivedAt: null, projectId: taskId },
      { $set: { projectId: null, statusId: "todo" } }
    );
  });
});
