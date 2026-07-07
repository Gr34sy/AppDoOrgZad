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
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    updateOne: vi.fn()
  }
}));

vi.mock("@/models/task", () => ({
  Task: {
    create: vi.fn()
  }
}));

const projectId = "665f1f77bcf86cd799439014";
const context = { params: { projectId } };

function createJsonRequest(body: unknown) {
  return new Request(`http://localhost/api/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    }
  });
}

describe("/api/projects/[projectId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads a project owned by the current user", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
    vi.mocked(Project.findOne).mockResolvedValue({ _id: projectId, title: "Project" });

    const response = await GET({} as never, context);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(Project.findOne).toHaveBeenCalledWith({
      _id: projectId,
      ownerId: "user-1",
      archivedAt: null
    });
    expect(payload.project).toEqual({ _id: projectId, title: "Project" });
  });

  it("rejects empty update payloads", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");

    const response = await PATCH(createJsonRequest({}) as never, context);

    expect(response.status).toBe(400);
    expect(Project.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("updates an owned project and records activity", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
    vi.mocked(Project.findOneAndUpdate).mockResolvedValue({ id: projectId, title: "Updated" });

    const response = await PATCH(
      createJsonRequest({
        title: "Updated",
        lifecycleStatus: "paused",
        priority: "high"
      }) as never,
      context
    );

    expect(response.status).toBe(200);
    expect(Project.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: projectId, ownerId: "user-1", archivedAt: null },
      { $set: { title: "Updated", lifecycleStatus: "paused", priority: "high" } },
      { new: true, runValidators: true }
    );
    expect(recordActivityEvent).toHaveBeenCalledWith({
      ownerId: "user-1",
      entityType: "project",
      entityId: projectId,
      action: "updated"
    });
  });

  it("archives an owned project", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
    vi.mocked(Project.findOneAndUpdate).mockResolvedValue({ id: projectId, title: "Archived" });

    const response = await DELETE({} as never, context);

    expect(response.status).toBe(200);
    expect(Project.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: projectId, ownerId: "user-1", archivedAt: null },
      { $set: { archivedAt: expect.any(Date), lifecycleStatus: "archived" } },
      { new: true }
    );
    expect(recordActivityEvent).toHaveBeenCalledWith({
      ownerId: "user-1",
      entityType: "project",
      entityId: projectId,
      action: "deleted"
    });
  });
});
