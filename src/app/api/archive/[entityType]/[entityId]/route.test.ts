import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { recordActivityEvent } from "@/lib/activity-events";
import { cleanupEntityReferences } from "@/lib/entity-relations";
import { connectDatabase } from "@/lib/mongoose";
import { Note } from "@/models/note";
import { Project } from "@/models/project";
import { DELETE, PATCH } from "./route";

vi.mock("@/lib/session", () => ({
  getCurrentUserId: vi.fn(),
  notFoundResponse: () => NextResponse.json({ message: "Not found" }, { status: 404 }),
  unauthorizedResponse: () => NextResponse.json({ message: "Unauthorized" }, { status: 401 })
}));

vi.mock("@/lib/mongoose", () => ({
  connectDatabase: vi.fn()
}));

vi.mock("@/lib/activity-events", () => ({
  recordActivityEvent: vi.fn()
}));

vi.mock("@/lib/entity-relations", () => ({
  cleanupEntityReferences: vi.fn()
}));

vi.mock("@/models/checklist", () => ({
  Checklist: {
    findOneAndUpdate: vi.fn(),
    findOneAndDelete: vi.fn()
  }
}));

vi.mock("@/models/note", () => ({
  Note: {
    findOneAndUpdate: vi.fn(),
    findOneAndDelete: vi.fn()
  }
}));

vi.mock("@/models/project", () => ({
  Project: {
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findOneAndDelete: vi.fn()
  }
}));

vi.mock("@/models/task", () => ({
  Task: {
    findOneAndUpdate: vi.fn(),
    findOneAndDelete: vi.fn()
  }
}));

const noteId = "665f1f77bcf86cd799439011";
const projectId = "665f1f77bcf86cd799439012";

describe("/api/archive/[entityType]/[entityId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("restores archived notes owned by the current user", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
    vi.mocked(Note.findOneAndUpdate).mockResolvedValue({ id: noteId, title: "Note" } as never);

    const response = await PATCH({} as never, {
      params: { entityType: "note", entityId: noteId }
    });

    expect(response.status).toBe(200);
    expect(Note.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: noteId, ownerId: "user-1", archivedAt: { $ne: null } },
      { $set: { archivedAt: null } },
      { new: true, runValidators: true }
    );
    expect(recordActivityEvent).toHaveBeenCalledWith({
      ownerId: "user-1",
      entityType: "note",
      entityId: noteId,
      action: "restored"
    });
  });

  it("restores a project to its previous lifecycle status", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
    vi.mocked(Project.findOne).mockResolvedValue({
      id: projectId,
      previousLifecycleStatus: "completed"
    } as never);
    vi.mocked(Project.findOneAndUpdate).mockResolvedValue({
      id: projectId,
      lifecycleStatus: "completed"
    } as never);

    const response = await PATCH({} as never, {
      params: { entityType: "project", entityId: projectId }
    });

    expect(response.status).toBe(200);
    expect(Project.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: projectId, ownerId: "user-1", archivedAt: { $ne: null } },
      {
        $set: { archivedAt: null, lifecycleStatus: "completed" },
        $unset: { previousLifecycleStatus: "" }
      },
      { new: true, runValidators: true }
    );
  });

  it("permanently deletes archived items and cleans references", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
    vi.mocked(Note.findOneAndDelete).mockResolvedValue({ id: noteId, title: "Note" } as never);

    const response = await DELETE({} as never, {
      params: { entityType: "note", entityId: noteId }
    });

    expect(response.status).toBe(200);
    expect(Note.findOneAndDelete).toHaveBeenCalledWith({
      _id: noteId,
      ownerId: "user-1",
      archivedAt: { $ne: null }
    });
    expect(cleanupEntityReferences).toHaveBeenCalledWith({
      ownerId: "user-1",
      targetType: "note",
      targetId: noteId
    });
    expect(recordActivityEvent).toHaveBeenCalledWith({
      ownerId: "user-1",
      entityType: "note",
      entityId: noteId,
      action: "permanentlyDeleted"
    });
  });
});
