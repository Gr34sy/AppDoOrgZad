import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { connectDatabase } from "@/lib/mongoose";
import { UserPreference } from "@/models/user-preference";
import { defaultListSettings, listPreferenceScopes } from "@/lib/list-preferences";
import { resetRateLimitCache } from "@/lib/rate-limit";
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
    resetRateLimitCache();
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
        colors: {
          accent: "#2563eb",
          upcoming: "#16a085",
          todo: "#0284c7",
          inProgress: "#c026d3",
          completed: "#27272a",
          calendar: "#2563eb"
        },
        listControls: {},
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
    expect(payload.preference.colors).toEqual({
      accent: "#000000",
      upcoming: "#22d3ee",
      todo: "#38bdf8",
      inProgress: "#e879f9",
      completed: "#71717a",
      calendar: "#60a5fa"
    });
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
  it.each(listPreferenceScopes)("updates only the %s controls for the authenticated user", async (scope) => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
    const settings = { ...defaultListSettings(scope), sort: "title" as const, direction: "desc" as const };
    vi.mocked(UserPreference.findOneAndUpdate).mockReturnValue({
      lean: vi.fn().mockResolvedValue({ listControls: { [scope]: settings }, colorMode: "dark" })
    } as never);

    const response = await PUT(createJsonRequest({ listControls: { scope, settings } }) as never);
    expect(response.status).toBe(200);
    expect(UserPreference.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: "user-1" },
      { $set: { [`listControls.${scope}`]: settings }, $unset: { theme: "" }, $setOnInsert: { userId: "user-1" } },
      { new: true, upsert: true }
    );
    const payload = await response.json();
    expect(payload.preference.listControls[scope]).toEqual(settings);
    expect(payload.preference.colorMode).toBe("dark");
  });

  it("rejects invalid scopes and unsupported sorting without accessing the database", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
    for (const listControls of [
      { scope: "otherUser", settings: defaultListSettings("notes") },
      { scope: "notes", settings: { ...defaultListSettings("notes"), sort: "archived" } },
      { scope: "tasks", settings: { ...defaultListSettings("tasks"), sort: "position", direction: "desc" } }
    ]) {
      const response = await PUT(createJsonRequest({ listControls }) as never);
      expect(response.status).toBe(400);
    }
    expect(UserPreference.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("does not write preferences without a session", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue(null);
    const response = await PUT(createJsonRequest({ listControls: { scope: "notes", settings: defaultListSettings("notes") } }) as never);
    expect(response.status).toBe(401);
    expect(UserPreference.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("keeps all six views separate for two authenticated users", async () => {
    const records = new Map<string, { listControls: Record<string, unknown> }>();
    vi.mocked(UserPreference.findOneAndUpdate).mockImplementation(((filter: { userId: string }, update: { $set?: Record<string, unknown> }) => ({
      lean: async () => {
        const record = records.get(filter.userId) ?? { listControls: {} };
        for (const [path, value] of Object.entries(update.$set ?? {})) {
          if (path.startsWith("listControls.")) record.listControls[path.slice("listControls.".length)] = value;
        }
        records.set(filter.userId, record);
        return structuredClone(record);
      }
    })) as never);

    for (const userId of ["user-a", "user-b"]) {
      vi.mocked(getCurrentUserId).mockResolvedValue(userId);
      for (const scope of listPreferenceScopes) {
        const settings = {
          ...defaultListSettings(scope),
          sort: "title" as const,
          direction: userId === "user-a" ? "asc" as const : "desc" as const,
          linked: userId === "user-a" ? "project" as const : "unlinked" as const
        };
        const response = await PUT(createJsonRequest({ listControls: { scope, settings } }) as never);
        expect(response.status).toBe(200);
      }
    }

    for (const userId of ["user-a", "user-b"]) {
      vi.mocked(getCurrentUserId).mockResolvedValue(userId);
      const response = await GET();
      const payload = await response.json();
      for (const scope of listPreferenceScopes) {
        expect(payload.preference.listControls[scope]).toMatchObject({
          direction: userId === "user-a" ? "asc" : "desc",
          linked: userId === "user-a" ? "project" : "unlinked"
        });
      }
    }
    expect(records.size).toBe(2);
  });

  it("rejects a supplied userId instead of letting callers select another account", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue("user-a");
    const response = await PUT(createJsonRequest({
      userId: "user-b",
      listControls: { scope: "notes", settings: defaultListSettings("notes") }
    }) as never);
    expect(response.status).toBe(400);
    expect(UserPreference.findOneAndUpdate).not.toHaveBeenCalled();
  });

});
