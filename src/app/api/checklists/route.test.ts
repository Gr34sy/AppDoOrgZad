import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { recordActivityEvent } from "@/lib/activity-events";
import { connectDatabase } from "@/lib/mongoose";
import { Checklist } from "@/models/checklist";
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

vi.mock("@/models/checklist", () => ({
  Checklist: {
    find: vi.fn(),
    create: vi.fn()
  }
}));

function createJsonRequest(body: unknown) {
  return new Request("http://localhost/api/checklists", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    }
  });
}

describe("/api/checklists", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated list requests", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(connectDatabase).not.toHaveBeenCalled();
  });

  it("lists active checklists for the current owner", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
    const sort = vi.fn().mockResolvedValue([{ title: "Checklist" }]);
    vi.mocked(Checklist.find).mockReturnValue({ sort } as never);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(Checklist.find).toHaveBeenCalledWith({ ownerId: "user-1", archivedAt: null });
    expect(sort).toHaveBeenCalledWith({ position: 1, updatedAt: -1 });
    expect(payload.checklists).toEqual([{ title: "Checklist" }]);
  });

  it("validates create requests before writing", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");

    const response = await POST(createJsonRequest({ title: "" }) as never);

    expect(response.status).toBe(400);
    expect(Checklist.create).not.toHaveBeenCalled();
  });

  it("creates a checklist for the current owner and records activity", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
    vi.mocked(Checklist.create).mockResolvedValue({ id: "checklist-1", title: "Launch" } as never);

    const response = await POST(
      createJsonRequest({
        title: "Launch",
        description: "Release checklist",
        tags: ["release"],
        items: [{ title: "Run tests", isCompleted: false, position: 0 }]
      }) as never
    );
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(Checklist.create).toHaveBeenCalledWith({
      title: "Launch",
      description: "Release checklist",
      tags: ["release"],
      items: [{ title: "Run tests", isCompleted: false, position: 0 }],
      ownerId: "user-1"
    });
    expect(recordActivityEvent).toHaveBeenCalledWith({
      ownerId: "user-1",
      entityType: "checklist",
      entityId: "checklist-1",
      action: "created"
    });
    expect(payload.checklist).toEqual({ id: "checklist-1", title: "Launch" });
  });
});
