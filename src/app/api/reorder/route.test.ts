import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { connectDatabase } from "@/lib/mongoose";
import { Checklist } from "@/models/checklist";
import { Note } from "@/models/note";
import { Task } from "@/models/task";
import { PATCH } from "./route";

vi.mock("@/lib/session", () => ({
  getCurrentUserId: vi.fn(),
  unauthorizedResponse: () => NextResponse.json({ message: "Unauthorized" }, { status: 401 })
}));

vi.mock("@/lib/mongoose", () => ({
  connectDatabase: vi.fn()
}));

vi.mock("@/models/pin", () => ({
  Pin: {
    countDocuments: vi.fn(),
    bulkWrite: vi.fn()
  }
}));

vi.mock("@/models/note", () => ({
  Note: {
    countDocuments: vi.fn(),
    bulkWrite: vi.fn()
  }
}));

vi.mock("@/models/checklist", () => ({
  Checklist: {
    countDocuments: vi.fn(),
    bulkWrite: vi.fn()
  }
}));

vi.mock("@/models/project", () => ({
  Project: {
    countDocuments: vi.fn(),
    bulkWrite: vi.fn()
  }
}));

vi.mock("@/models/task", () => ({
  Task: {
    countDocuments: vi.fn(),
    bulkWrite: vi.fn()
  }
}));

const firstTaskId = "665f1f77bcf86cd799439011";
const secondTaskId = "665f1f77bcf86cd799439012";

function createJsonRequest(body: unknown) {
  return new Request("http://localhost/api/reorder", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    }
  });
}

describe("/api/reorder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated reorder requests", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue(null);

    const response = await PATCH(
      createJsonRequest({
        entityType: "task",
        items: [{ id: firstTaskId, position: 0 }]
      }) as never
    );

    expect(response.status).toBe(401);
    expect(connectDatabase).not.toHaveBeenCalled();
  });

  it("updates all positions in one batch for the current owner", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
    vi.mocked(Task.countDocuments).mockResolvedValue(2);
    vi.mocked(Task.bulkWrite).mockResolvedValue({} as never);

    const response = await PATCH(
      createJsonRequest({
        entityType: "task",
        items: [
          { id: firstTaskId, position: 0 },
          { id: secondTaskId, position: 1 }
        ]
      }) as never
    );

    expect(response.status).toBe(200);
    expect(Task.countDocuments).toHaveBeenCalledWith({
      ownerId: "user-1",
      archivedAt: null,
      _id: { $in: [firstTaskId, secondTaskId] }
    });
    expect(Task.bulkWrite).toHaveBeenCalledWith([
      {
        updateOne: {
          filter: { ownerId: "user-1", archivedAt: null, _id: firstTaskId },
          update: { $set: { position: 0 } }
        }
      },
      {
        updateOne: {
          filter: { ownerId: "user-1", archivedAt: null, _id: secondTaskId },
          update: { $set: { position: 1 } }
        }
      }
    ]);
  });

  it("rejects duplicate identifiers", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");

    const response = await PATCH(
      createJsonRequest({
        entityType: "task",
        items: [
          { id: firstTaskId, position: 0 },
          { id: firstTaskId, position: 1 }
        ]
      }) as never
    );

    expect(response.status).toBe(400);
    expect(Task.bulkWrite).not.toHaveBeenCalled();
  });

  it("updates checklist positions", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
    vi.mocked(Checklist.countDocuments).mockResolvedValue(1);
    vi.mocked(Checklist.bulkWrite).mockResolvedValue({} as never);

    const response = await PATCH(
      createJsonRequest({
        entityType: "checklist",
        items: [{ id: firstTaskId, position: 0 }]
      }) as never
    );

    expect(response.status).toBe(200);
    expect(Checklist.countDocuments).toHaveBeenCalledWith({
      ownerId: "user-1",
      archivedAt: null,
      _id: { $in: [firstTaskId] }
    });
  });

  it("updates note positions", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
    vi.mocked(Note.countDocuments).mockResolvedValue(1);
    vi.mocked(Note.bulkWrite).mockResolvedValue({} as never);

    const response = await PATCH(
      createJsonRequest({
        entityType: "note",
        items: [{ id: secondTaskId, position: 0 }]
      }) as never
    );

    expect(response.status).toBe(200);
    expect(Note.countDocuments).toHaveBeenCalledWith({
      ownerId: "user-1",
      archivedAt: null,
      _id: { $in: [secondTaskId] }
    });
  });
});
