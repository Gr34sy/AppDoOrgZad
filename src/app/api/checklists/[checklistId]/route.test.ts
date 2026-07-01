import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { recordActivityEvent } from "@/lib/activity-events";
import { connectDatabase } from "@/lib/mongoose";
import { Checklist } from "@/models/checklist";
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

vi.mock("@/models/checklist", () => ({
  Checklist: {
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn()
  }
}));

const checklistId = "665f1f77bcf86cd799439012";
const context = { params: { checklistId } };

function createJsonRequest(body: unknown) {
  return new Request(`http://localhost/api/checklists/${checklistId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    }
  });
}

describe("/api/checklists/[checklistId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads a checklist owned by the current user", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
    vi.mocked(Checklist.findOne).mockResolvedValue({ _id: checklistId, title: "Launch" });

    const response = await GET({} as never, context);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(Checklist.findOne).toHaveBeenCalledWith({
      _id: checklistId,
      ownerId: "user-1",
      archivedAt: null
    });
    expect(payload.checklist).toEqual({ _id: checklistId, title: "Launch" });
  });

  it("rejects empty update payloads", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");

    const response = await PATCH(createJsonRequest({}) as never, context);

    expect(response.status).toBe(400);
    expect(Checklist.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("updates an owned checklist and records activity", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
    vi.mocked(Checklist.findOneAndUpdate).mockResolvedValue({ id: checklistId, title: "Updated" });

    const response = await PATCH(
      createJsonRequest({
        title: "Updated",
        items: [{ title: "Ship it", isCompleted: true, position: 0 }]
      }) as never,
      context
    );

    expect(response.status).toBe(200);
    expect(Checklist.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: checklistId, ownerId: "user-1", archivedAt: null },
      { $set: { title: "Updated", items: [{ title: "Ship it", isCompleted: true, position: 0 }] } },
      { new: true, runValidators: true }
    );
    expect(recordActivityEvent).toHaveBeenCalledWith({
      ownerId: "user-1",
      entityType: "checklist",
      entityId: checklistId,
      action: "updated"
    });
  });

  it("soft deletes an owned checklist", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
    vi.mocked(Checklist.findOneAndUpdate).mockResolvedValue({ id: checklistId, title: "Deleted" });

    const response = await DELETE({} as never, context);

    expect(response.status).toBe(200);
    expect(Checklist.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: checklistId, ownerId: "user-1", archivedAt: null },
      { $set: { archivedAt: expect.any(Date) } },
      { new: true }
    );
    expect(recordActivityEvent).toHaveBeenCalledWith({
      ownerId: "user-1",
      entityType: "checklist",
      entityId: checklistId,
      action: "deleted"
    });
  });
});
