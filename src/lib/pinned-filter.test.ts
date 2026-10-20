import { beforeEach, describe, expect, it, vi } from "vitest";
import { withPinnedFilter } from "./pinned-filter";
import { Pin } from "@/models/pin";

vi.mock("@/models/pin", () => ({ Pin: { distinct: vi.fn() } }));

describe("pinned list filter", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it.each(["note", "checklist", "task", "project"] as const)("uses only the current user's %s pins", async (targetType) => {
    vi.mocked(Pin.distinct).mockImplementation(((_field: string, filter: { ownerId: string }) =>
      Promise.resolve(filter.ownerId === "user-a" ? ["item-a"] : ["item-b"])) as never);
    for (const ownerId of ["user-a", "user-b"]) {
      const base = { ownerId, archivedAt: null, priority: "high" };
      const targetId = ownerId === "user-a" ? "item-a" : "item-b";
      expect(await withPinnedFilter(base, ownerId, targetType, true)).toEqual({
        $and: [base, { _id: { $in: [targetId] } }]
      });
      expect(Pin.distinct).toHaveBeenLastCalledWith("targetId", { ownerId, targetType });
    }
  });

  it("does not look up pins with All selected", async () => {
    const query = { ownerId: "user-a", archivedAt: null };
    expect(await withPinnedFilter(query, "user-a", "note", false)).toBe(query);
    expect(Pin.distinct).not.toHaveBeenCalled();
  });

  it("returns an empty match when there are no pins and preserves existing _id conditions", async () => {
    vi.mocked(Pin.distinct).mockResolvedValue([]);
    const query = { ownerId: "user-a", archivedAt: null, _id: null };
    expect(await withPinnedFilter(query, "user-a", "task", true)).toEqual({
      $and: [query, { _id: { $in: [] } }]
    });
  });
});
