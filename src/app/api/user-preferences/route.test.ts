import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { connectDatabase } from "@/lib/mongoose";
import { UserPreference } from "@/models/user-preference";
import { GET, PUT } from "./route";

vi.mock("@/lib/session", () => ({
  getCurrentUserId: vi.fn(),
  unauthorizedResponse: () => NextResponse.json({ message: "Unauthorized" }, { status: 401 })
}));

vi.mock("@/lib/mongoose", () => ({
  connectDatabase: vi.fn()
}));

vi.mock("@/models/user-preference", () => ({
  UserPreference: {
    findOneAndUpdate: vi.fn(),
    updateOne: vi.fn()
  }
}));

function createJsonRequest(body: unknown) {
  return new Request("http://localhost/api/user-preferences", {
    method: "PUT",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    }
  });
}

describe("/api/user-preferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(connectDatabase).mockResolvedValue(undefined as never);
  });

  it("returns defaults when preferences cannot be loaded from the database", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
    vi.mocked(connectDatabase).mockRejectedValue(new Error("querySrv ECONNREFUSED"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      preference: {
        colorMode: "system",
        colors: {},
        savedThemes: []
      },
      unavailable: true
    });
    expect(UserPreference.findOneAndUpdate).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it("loads existing preferences for the current user", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
    const lean = vi.fn().mockResolvedValue({
      colorMode: "dark",
      colors: { accent: "#000000" },
      savedThemes: [
        {
          _id: "theme-1",
          name: "Night",
          colors: {
            accent: "#000000",
            upcoming: "#111111",
            todo: "#222222",
            inProgress: "#333333",
            completed: "#444444",
            calendar: "#555555"
          },
          createdAt: "2026-07-09T00:00:00.000Z"
        }
      ]
    });
    vi.mocked(UserPreference.findOneAndUpdate).mockReturnValue({ lean } as never);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(UserPreference.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: "user-1" },
      { $setOnInsert: { userId: "user-1" } },
      { new: true, upsert: true }
    );
    expect(payload.preference.colorMode).toBe("dark");
    expect(payload.preference.savedThemes[0].id).toBe("theme-1");
  });

  it("returns service unavailable when preferences cannot be saved", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
    vi.mocked(connectDatabase).mockRejectedValue(new Error("querySrv ECONNREFUSED"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await PUT(
      createJsonRequest({
        colorMode: "dark",
        colors: {
          accent: "#000000",
          upcoming: "#111111",
          todo: "#222222",
          inProgress: "#333333",
          completed: "#444444",
          calendar: "#555555"
        }
      }) as never
    );
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.message).toBe("Database connection is currently unavailable.");

    errorSpy.mockRestore();
  });
});
