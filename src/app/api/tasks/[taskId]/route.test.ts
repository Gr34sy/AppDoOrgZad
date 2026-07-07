import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { recordActivityEvent } from "@/lib/activity-events";
import { connectDatabase } from "@/lib/mongoose";
import { Project } from "@/models/project";
import { Task } from "@/models/task";
import { DELETE, GET, PATCH } from "./route";

vi.mock("@/lib/session", () => ({
  getCurrentUserId: vi.fn(),
  sanitizeMutation: (payload: Record<string, unknown>) => payload,
  unauthorizedResponse: () => NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
  notFoundResponse: () => NextResponse.json({ message: "Not found" }, { status: 404 })
}));

vi.mock("@/lib/mongoose", () => ({
  connectDatabase: vi.fn()
}));

vi.mock("@/lib/activity-events", () => ({
  recordActivityEvent: vi.fn()
}));

vi.mock("@/models/project", () => ({
  Project: {
    exists: vi.fn(),
    updateOne: vi.fn()
  }
}));

vi.mock("@/models/task", () => ({
  Task: {
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn()
  }
}));

const taskId = "665f1f77bcf86cd799439013";
const context = { params: { taskId } };

function createJsonRequest(body: unknown) {
  return new Request(`http://localhost/api/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    }
  });
}

describe("/api/tasks/[taskId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads a task owned by the current user", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
    vi.mocked(Task.findOne).mockResolvedValue({ _id: taskId, title: "Task" });

    const response = await GET({} as never, context);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(Task.findOne).toHaveBeenCalledWith({
      _id: taskId,
      ownerId: "user-1",
      archivedAt: null
    });
    expect(payload.task).toEqual({ _id: taskId, title: "Task" });
  });

  it("rejects empty update payloads", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");

    const response = await PATCH(createJsonRequest({}) as never, context);

    expect(response.status).toBe(400);
    expect(Task.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("updates an owned task and moves project links", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
    vi.mocked(Project.exists).mockResolvedValue({ _id: "new-project" } as never);
    vi.mocked(Task.findOne).mockResolvedValue({ id: taskId, projectId: "old-project" });
    vi.mocked(Task.findOneAndUpdate).mockResolvedValue({
      id: taskId,
      _id: taskId,
      title: "Updated",
      projectId: "new-project"
    });
    vi.mocked(Project.updateOne).mockResolvedValue({} as never);

    const response = await PATCH(
      createJsonRequest({
        title: "Updated",
        projectId: "new-project",
        statusId: "in_progress"
      }) as never,
      context
    );

    expect(response.status).toBe(200);
    expect(Task.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: taskId, ownerId: "user-1", archivedAt: null },
      { $set: { title: "Updated", projectId: "new-project", statusId: "in_progress" } },
      { new: true, runValidators: true }
    );
    expect(Project.updateOne).toHaveBeenCalledWith(
      { _id: "old-project", ownerId: "user-1" },
      { $pull: { taskIds: taskId } }
    );
    expect(Project.updateOne).toHaveBeenCalledWith(
      { _id: "new-project", ownerId: "user-1", archivedAt: null },
      { $addToSet: { taskIds: taskId } }
    );
    expect(recordActivityEvent).toHaveBeenCalledWith({
      ownerId: "user-1",
      entityType: "task",
      entityId: taskId,
      action: "moved"
    });
  });

  it("soft deletes an owned task and unlinks it from a project", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
    vi.mocked(Task.findOneAndUpdate).mockResolvedValue({
      id: taskId,
      _id: taskId,
      title: "Deleted",
      projectId: "project-1"
    });
    vi.mocked(Project.updateOne).mockResolvedValue({} as never);

    const response = await DELETE({} as never, context);

    expect(response.status).toBe(200);
    expect(Task.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: taskId, ownerId: "user-1", archivedAt: null },
      { $set: { archivedAt: expect.any(Date) } },
      { new: true }
    );
    expect(Project.updateOne).toHaveBeenCalledWith(
      { _id: "project-1", ownerId: "user-1" },
      { $pull: { taskIds: taskId } }
    );
    expect(recordActivityEvent).toHaveBeenCalledWith({
      ownerId: "user-1",
      entityType: "task",
      entityId: taskId,
      action: "deleted"
    });
  });
});
