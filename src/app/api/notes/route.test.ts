import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { resetRateLimitCache } from "@/lib/rate-limit";
import { getCurrentUserId } from "@/lib/session";
import { recordActivityEvent } from "@/lib/activity-events";
import { connectDatabase } from "@/lib/mongoose";
import { areValidNoteLinks } from "@/lib/note-links";
import { Note } from "@/models/note";
import { GET, POST } from "./route";

vi.mock("@/lib/session", () => ({
  getCurrentUserId: vi.fn(),
  unauthorizedResponse: () => NextResponse.json({ message: "Unauthorized" }, { status: 401 })
}));

vi.mock("@/lib/mongoose", () => ({
  connectDatabase: vi.fn()
}));

vi.mock("@/lib/activity-events", () => ({
  recordActivityEvent: vi.fn()
}));

vi.mock("@/lib/note-links", () => ({ areValidNoteLinks: vi.fn() }));

vi.mock("@/models/note", () => ({
  Note: {
    find: vi.fn(),
    create: vi.fn()
  }
}));

function createJsonRequest(body: unknown) {
  return new Request("http://localhost/api/notes", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    }
  });
}

describe("/api/notes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimitCache();
    vi.mocked(areValidNoteLinks).mockResolvedValue(true);
  });

  it("rejects unauthenticated list requests", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(connectDatabase).not.toHaveBeenCalled();
  });

  it("lists only active notes for the current owner", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
    const sort = vi.fn().mockResolvedValue([{ title: "Note" }]);
    vi.mocked(Note.find).mockReturnValue({ sort } as never);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(Note.find).toHaveBeenCalledWith({ ownerId: "user-1", archivedAt: null });
    expect(sort).toHaveBeenCalledWith({ position: 1, updatedAt: -1 });
    expect(payload.notes).toEqual([{ title: "Note" }]);
  });

  it("validates create requests before writing to the database", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");

    const response = await POST(createJsonRequest({ title: "" }) as never);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.message).toContain("Too small");
    expect(Note.create).not.toHaveBeenCalled();
  });

  it("creates a note for the current owner and records activity", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
    vi.mocked(Note.create).mockResolvedValue({ id: "note-1", title: "Demo note" } as never);

    const response = await POST(
      createJsonRequest({
        title: "Demo note",
        content: "Hello",
        tags: ["work"]
      }) as never
    );
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(Note.create).toHaveBeenCalledWith({
      title: "Demo note",
      content: "Hello",
      tags: ["work"],
      ownerId: "user-1"
    });
    expect(recordActivityEvent).toHaveBeenCalledWith({
      ownerId: "user-1",
      entityType: "note",
      entityId: "note-1",
      action: "created"
    });
    expect(payload.note).toEqual({ id: "note-1", title: "Demo note" });
  });

  it("rate limits repeated create requests", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
    vi.mocked(Note.create).mockResolvedValue({ id: "note-1", title: "Demo note" } as never);

    for (let index = 0; index < 30; index += 1) {
      await POST(createJsonRequest({ title: `Note ${index}` }) as never);
    }

    const response = await POST(createJsonRequest({ title: "Too many" }) as never);

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
  });
  it.each(["task", "project"] as const)("creates a note linked to an owned %s", async (targetType) => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
    vi.mocked(Note.create).mockResolvedValue({ id: "note-1" } as never);
    const linkedItems = [{ targetType, targetId: "665f1f77bcf86cd799439011" }];
    const response = await POST(createJsonRequest({ title: "Linked note", linkedItems }) as never);
    expect(response.status).toBe(201);
    expect(areValidNoteLinks).toHaveBeenCalledWith(linkedItems, "user-1");
    expect(Note.create).toHaveBeenCalledWith({ title: "Linked note", linkedItems, ownerId: "user-1" });
  });

  it("rejects a note link to an unavailable or foreign element", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
    vi.mocked(areValidNoteLinks).mockResolvedValue(false);
    const response = await POST(createJsonRequest({ title: "Linked note", linkedItems: [{ targetType: "task", targetId: "665f1f77bcf86cd799439011" }] }) as never);
    expect(response.status).toBe(400);
    expect(Note.create).not.toHaveBeenCalled();
  });

});
