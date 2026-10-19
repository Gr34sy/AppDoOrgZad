import { beforeEach, describe, expect, it, vi } from "vitest";
import { getListSettings } from "./server-list-preferences";
import { defaultListSettings, listPreferenceScopes } from "./list-preferences";
import { UserPreference } from "@/models/user-preference";

const query = vi.hoisted(() => ({ select: vi.fn(), lean: vi.fn() }));
vi.mock("@/lib/mongoose", () => ({ connectDatabase: vi.fn() }));
vi.mock("@/models/user-preference", () => ({ UserPreference: { findOne: vi.fn() } }));

describe("saved list controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(UserPreference.findOne).mockReturnValue(query as never);
    query.select.mockReturnValue(query);
  });

  it.each(listPreferenceScopes)("restores %s settings belonging to the current user", async (scope) => {
    const settings = { ...defaultListSettings(scope), sort: "title", direction: "desc", types: [] };
    query.lean.mockResolvedValue({ listControls: { [scope]: settings } });
    expect(await getListSettings("user-1", scope)).toEqual(settings);
    expect(UserPreference.findOne).toHaveBeenCalledWith({ userId: "user-1" });
  });

  it.each(listPreferenceScopes)("provides defaults for %s when preferences are missing", async (scope) => {
    query.lean.mockResolvedValue(null);
    expect(await getListSettings("user-2", scope)).toEqual(defaultListSettings(scope));
  });

  it("lets explicit URL defaults override saved filters and sorting", async () => {
    query.lean.mockResolvedValue({ listControls: { tasks: {
      ...defaultListSettings("tasks"), sort: "due", direction: "desc", priority: "high", linked: "project"
    } } });
    expect(await getListSettings("user-1", "tasks", {
      sort: "position", direction: "asc", priority: "", linked: ""
    })).toEqual(defaultListSettings("tasks"));
    expect(await getListSettings("user-1", "tasks", { sort: "title" })).toMatchObject({
      sort: "title", direction: "desc", priority: "high", linked: "project"
    });
  });
  it.each(listPreferenceScopes)("loads different %s controls for different owners", async (scope) => {
    vi.mocked(UserPreference.findOne).mockImplementation(((filter: { userId: string }) => ({
      select: () => ({ lean: async () => ({ listControls: { [scope]: {
        ...defaultListSettings(scope), sort: "title", direction: filter.userId === "user-a" ? "asc" : "desc"
      } } }) })
    })) as never);
    expect(await getListSettings("user-a", scope)).toMatchObject({ direction: "asc" });
    expect(await getListSettings("user-b", scope)).toMatchObject({ direction: "desc" });
    expect(await getListSettings("user-a", scope)).toMatchObject({ direction: "asc" });
  });

});
