import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { resetRateLimitCache } from "@/lib/rate-limit";
import { getCurrentUserId } from "@/lib/session";
import { recordActivityEvent } from "@/lib/activity-events";
import { connectDatabase } from "@/lib/mongoose";
import { Note } from "@/models/note";
import { Pin } from "@/models/pin";
import { DELETE, GET, PATCH } from "./route";

vi.mock("@/lib/session", () => ({
  getCurrentUserId: vi.fn(),
  unauthorizedResponse: () => NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
  notFoundResponse: () => NextResponse.json({ message: "Not found" }, { status: 404 })
}));

vi.mock("@/lib/mongoose", () => ({
  connectDatabase: vi.fn()
}));

vi.mock("@/lib/activity-events", () => ({
  recordActivityEvent: vi.fn()
}));

vi.mock("@/models/note", () => ({
  Note: {
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findOneAndDelete: vi.fn()
  }
}));

vi.mock("@/models/pin", () => ({
  Pin: {
    deleteMany: vi.fn()
  }
}));

const noteId = "665f1f77bcf86cd799439011";
const context = { params: { noteId } };

function createJsonRequest(body: unknown, method = "PATCH") {
  return new Request(`http://localhost/api/notes/${noteId}`, {
    method,
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    }
  });
}

describe("/api/notes/[noteId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimitCache();
  });

  it("returns 404 for invalid object ids", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");

    const response = await GET({} as never, { params: { noteId: "bad-id" } });

    expect(response.status).toBe(404);
    expect(connectDatabase).not.toHaveBeenCalled();
  });

  it("reads a note owned by the current user", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
    vi.mocked(Note.findOne).mockResolvedValue({ _id: noteId, title: "Demo note" });

    const response = await GET({} as never, context);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(Note.findOne).toHaveBeenCalledWith({
      _id: noteId,
      ownerId: "user-1",
      archivedAt: null
    });
    expect(payload.note).toEqual({ _id: noteId, title: "Demo note" });
  });

  it("rejects empty update payloads", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");

    const response = await PATCH(createJsonRequest({}) as never, context);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.message).toBe("At least one note field is required");
    expect(Note.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("updates an owned note and records activity", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
    vi.mocked(Note.findOneAndUpdate).mockResolvedValue({ id: noteId, title: "Updated" });

    const response = await PATCH(
      createJsonRequest({
        title: "Updated",
        tags: ["demo"]
      }) as never,
      context
    );

    expect(response.status).toBe(200);
    expect(Note.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: noteId, ownerId: "user-1", archivedAt: null },
      { $set: { title: "Updated", tags: ["demo"] } },
      { new: true, runValidators: true }
    );
    expect(recordActivityEvent).toHaveBeenCalledWith({
      ownerId: "user-1",
      entityType: "note",
      entityId: noteId,
      action: "updated"
    });
  });

  it("deletes an owned note and removes related pins", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
    vi.mocked(Note.findOneAndDelete).mockResolvedValue({ id: noteId, title: "Deleted" });

    const response = await DELETE({} as never, context);

    expect(response.status).toBe(200);
    expect(Note.findOneAndDelete).toHaveBeenCalledWith({
      _id: noteId,
      ownerId: "user-1",
      archivedAt: null
    });
    expect(Pin.deleteMany).toHaveBeenCalledWith({
      ownerId: "user-1",
      targetType: "note",
      targetId: noteId
    });
    expect(recordActivityEvent).toHaveBeenCalledWith({
      ownerId: "user-1",
      entityType: "note",
      entityId: noteId,
      action: "deleted"
    });
  });
});
