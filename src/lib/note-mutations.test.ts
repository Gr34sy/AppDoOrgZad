import { describe, expect, it } from "vitest";
import {
  hasNoteMutationFields,
  isValidNoteTitle,
  sanitizeNoteMutation
} from "@/lib/note-mutations";

describe("sanitizeNoteMutation", () => {
  it("keeps only editable note fields", () => {
    const payload = sanitizeNoteMutation({
      _id: "note-id",
      ownerId: "other-user",
      title: "Meeting notes",
      content: "Follow up tomorrow",
      linkedItems: [{ targetType: "task", targetId: "task-id" }],
      tags: ["work"],
      position: 2,
      archivedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      unknown: "ignore me"
    });

    expect(payload).toEqual({
      title: "Meeting notes",
      content: "Follow up tomorrow",
      linkedItems: [{ targetType: "task", targetId: "task-id" }],
      tags: ["work"],
      position: 2
    });
  });

  it("does not accept legacy per-note colors", () => {
    const payload = sanitizeNoteMutation({
      title: "Color note",
      color: "turquoise"
    });

    expect(payload).toEqual({ title: "Color note" });
  });

  it("detects empty mutation payloads", () => {
    expect(hasNoteMutationFields({})).toBe(false);
    expect(hasNoteMutationFields({ title: "Note" })).toBe(true);
  });

  it("validates note titles", () => {
    expect(isValidNoteTitle("Meeting notes")).toBe(true);
    expect(isValidNoteTitle("   ")).toBe(false);
    expect(isValidNoteTitle(null)).toBe(false);
  });
});
