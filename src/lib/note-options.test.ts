import { describe, expect, it, vi } from "vitest";
import { getNoteOptions } from "./note-options";
import { Note } from "@/models/note";

vi.mock("@/models/note", () => ({ Note: { find: vi.fn() } }));

describe("note options for task and project details", () => {
  it("loads only active notes belonging to the supplied owner and serializes links", async () => {
    const lean = vi.fn().mockResolvedValue([{ _id: "note-1", title: "Note", linkedItems: [{ targetType: "task", targetId: "task-1" }] }]);
    const sort = vi.fn().mockReturnValue({ lean });
    const select = vi.fn().mockReturnValue({ sort });
    vi.mocked(Note.find).mockReturnValue({ select } as never);
    expect(await getNoteOptions("user-1")).toEqual([{ id: "note-1", title: "Note", content: "", tags: [], linkedItems: [{ targetType: "task", targetId: "task-1" }] }]);
    expect(Note.find).toHaveBeenCalledWith({ ownerId: "user-1", archivedAt: null });
  });
});
