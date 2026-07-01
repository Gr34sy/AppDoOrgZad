import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { recordActivityEvent } from "@/lib/activity-events";
import { connectDatabase } from "@/lib/mongoose";
import { Project } from "@/models/project";
import { Task } from "@/models/task";
import { GET, POST } from "./route";

vi.mock("@/lib/session", () => ({
  getCurrentUserId: vi.fn(),
  sanitizeMutation: (payload: Record<string, unknown>) => payload,
  unauthorizedResponse: () => NextResponse.json({ message: "Unauthorized" }, { status: 401 })
}));

vi.mock("@/lib/mongoose", () => ({
  connectDatabase: vi.fn()
}));

vi.mock("@/lib/activity-events", () => ({
  recordActivityEvent: vi.fn()
}));

vi.mock("@/models/project", () => ({
  Project: {
    updateOne: vi.fn()
  }
}));

vi.mock("@/models/task", () => ({
  Task: {
    find: vi.fn(),
    create: vi.fn()
  }
}));

function createJsonRequest(body: unknown) {
  return new Request("http://localhost/api/tasks", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    }
  });
}

describe("/api/tasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated list requests", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(connectDatabase).not.toHaveBeenCalled();
  });

  it("lists active tasks for the current owner", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
    const sort = vi.fn().mockResolvedValue([{ title: "Task" }]);
    vi.mocked(Task.find).mockReturnValue({ sort } as never);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(Task.find).toHaveBeenCalledWith({ ownerId: "user-1", archivedAt: null });
    expect(sort).toHaveBeenCalledWith({
      projectId: 1,
      statusId: 1,
      position: 1,
      updatedAt: -1
    });
    expect(payload.tasks).toEqual([{ title: "Task" }]);
  });

  it("validates create requests before writing", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");

    const response = await POST(createJsonRequest({ title: "", priority: "urgent" }) as never);

    expect(response.status).toBe(400);
    expect(Task.create).not.toHaveBeenCalled();
  });

  it("creates a task, links it to a project and records activity", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
    vi.mocked(Task.create).mockResolvedValue({
      id: "task-1",
      _id: "task-1",
      title: "Write docs",
      projectId: "project-1"
    } as never);
    vi.mocked(Project.updateOne).mockResolvedValue({} as never);

    const response = await POST(
      createJsonRequest({
        title: "Write docs",
        description: "Prepare release notes",
        priority: "high",
        statusId: "todo",
        projectId: "project-1",
        tags: ["docs"]
      }) as never
    );

    expect(response.status).toBe(201);
    expect(Task.create).toHaveBeenCalledWith({
      title: "Write docs",
      description: "Prepare release notes",
      priority: "high",
      statusId: "todo",
      projectId: "project-1",
      tags: ["docs"],
      ownerId: "user-1"
    });
    expect(Project.updateOne).toHaveBeenCalledWith(
      { _id: "project-1", ownerId: "user-1", archivedAt: null },
      { $addToSet: { taskIds: "task-1" } }
    );
    expect(recordActivityEvent).toHaveBeenCalledWith({
      ownerId: "user-1",
      entityType: "task",
      entityId: "task-1",
      action: "created"
    });
  });
});
