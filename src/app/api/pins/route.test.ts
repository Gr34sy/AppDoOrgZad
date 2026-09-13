import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { recordActivityEvent } from "@/lib/activity-events";
import { ownedActiveEntityExists } from "@/lib/entity-relations";
import { connectDatabase } from "@/lib/mongoose";
import { Pin } from "@/models/pin";
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

vi.mock("@/lib/entity-relations", () => ({
  ownedActiveEntityExists: vi.fn()
}));

vi.mock("@/models/pin", () => ({
  Pin: {
    find: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn()
  }
}));

const targetId = "665f1f77bcf86cd799439013";

function createJsonRequest(body: unknown) {
  return new Request("http://localhost/api/pins", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    }
  });
}

describe("/api/pins", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ownedActiveEntityExists).mockResolvedValue(true);
  });

  it("rejects unauthenticated list requests", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(connectDatabase).not.toHaveBeenCalled();
  });

  it("lists pins for the current owner", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
    const sort = vi.fn().mockResolvedValue([{ targetType: "task", targetId }]);
    vi.mocked(Pin.find).mockReturnValue({ sort } as never);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(Pin.find).toHaveBeenCalledWith({ ownerId: "user-1" });
    expect(sort).toHaveBeenCalledWith({ position: 1, updatedAt: -1 });
    expect(payload.pins).toEqual([{ targetType: "task", targetId }]);
  });

  it("creates a pin only for an owned active target", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
    const selectLastPin = vi.fn().mockResolvedValue({ position: 3 });
    const sortLastPin = vi.fn().mockReturnValue({ select: selectLastPin });
    vi.mocked(Pin.findOne)
      .mockResolvedValueOnce(null)
      .mockReturnValueOnce({ sort: sortLastPin } as never);
    vi.mocked(Pin.create).mockResolvedValue({
      _id: "pin-1",
      targetType: "task",
      targetId
    } as never);

    const response = await POST(createJsonRequest({ targetType: "task", targetId }) as never);

    expect(response.status).toBe(201);
    expect(ownedActiveEntityExists).toHaveBeenCalledWith({
      ownerId: "user-1",
      targetType: "task",
      targetId
    });
    expect(Pin.create).toHaveBeenCalledWith({
      targetType: "task",
      targetId,
      ownerId: "user-1",
      position: 4
    });
    expect(recordActivityEvent).toHaveBeenCalledWith({
      ownerId: "user-1",
      entityType: "task",
      entityId: targetId,
      action: "pinned"
    });
  });

  it("returns an existing pin instead of creating a duplicate", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
    vi.mocked(Pin.findOne).mockResolvedValue({
      _id: "pin-1",
      targetType: "task",
      targetId
    });

    const response = await POST(createJsonRequest({ targetType: "task", targetId }) as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(Pin.create).not.toHaveBeenCalled();
    expect(recordActivityEvent).not.toHaveBeenCalled();
    expect(payload.pin).toEqual({
      _id: "pin-1",
      targetType: "task",
      targetId
    });
  });

  it("rejects pins for unavailable targets", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
    vi.mocked(ownedActiveEntityExists).mockResolvedValue(false);

    const response = await POST(createJsonRequest({ targetType: "task", targetId }) as never);

    expect(response.status).toBe(400);
    expect(Pin.create).not.toHaveBeenCalled();
  });
});
