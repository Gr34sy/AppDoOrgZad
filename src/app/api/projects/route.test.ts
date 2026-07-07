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
    find: vi.fn(),
    create: vi.fn(),
    updateOne: vi.fn()
  }
}));

vi.mock("@/models/task", () => ({
  Task: {
    create: vi.fn()
  }
}));

function createJsonRequest(body: unknown) {
  return new Request("http://localhost/api/projects", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    }
  });
}

describe("/api/projects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated list requests", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(connectDatabase).not.toHaveBeenCalled();
  });

  it("lists active projects for the current owner", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
    const sort = vi.fn().mockResolvedValue([{ title: "Project" }]);
    vi.mocked(Project.find).mockReturnValue({ sort } as never);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(Project.find).toHaveBeenCalledWith({ ownerId: "user-1", archivedAt: null });
    expect(sort).toHaveBeenCalledWith({
      lifecycleStatus: 1,
      position: 1,
      updatedAt: -1
    });
    expect(payload.projects).toEqual([{ title: "Project" }]);
  });

  it("validates create requests before writing", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");

    const response = await POST(createJsonRequest({ title: "", priority: "low" }) as never);

    expect(response.status).toBe(400);
    expect(Project.create).not.toHaveBeenCalled();
  });

  it("creates a project for the current owner and records activity", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
    vi.mocked(Project.create).mockResolvedValue({ id: "project-1", title: "Website" } as never);

    const response = await POST(
      createJsonRequest({
        title: "Website",
        description: "Refresh public site",
        priority: "medium",
        lifecycleStatus: "active",
        tags: ["web"]
      }) as never
    );
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(Project.create).toHaveBeenCalledWith({
      title: "Website",
      description: "Refresh public site",
      priority: "medium",
      lifecycleStatus: "active",
      tags: ["web"],
      ownerId: "user-1"
    });
    expect(recordActivityEvent).toHaveBeenCalledWith({
      ownerId: "user-1",
      entityType: "project",
      entityId: "project-1",
      action: "created"
    });
    expect(payload.project).toEqual({ id: "project-1", title: "Website" });
  });

  it("creates project tasks as regular tasks linked to the project", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
    vi.mocked(Project.create).mockResolvedValue({
      id: "project-1",
      _id: "project-1",
      title: "Website"
    } as never);
    vi.mocked(Task.create).mockResolvedValueOnce({
      id: "task-1",
      _id: "task-1",
      title: "Draft content"
    } as never);
    vi.mocked(Project.updateOne).mockResolvedValue({} as never);

    const response = await POST(
      createJsonRequest({
        title: "Website",
        newTasks: [
          {
            title: "Draft content",
            priority: "high",
            statusId: "todo"
          }
        ]
      }) as never
    );

    expect(response.status).toBe(201);
    expect(Task.create).toHaveBeenCalledWith({
      title: "Draft content",
      priority: "high",
      statusId: "todo",
      ownerId: "user-1",
      projectId: "project-1"
    });
    expect(Project.updateOne).toHaveBeenCalledWith(
      { _id: "project-1", ownerId: "user-1", archivedAt: null },
      { $addToSet: { taskIds: { $each: ["task-1"] } } }
    );
  });
});
