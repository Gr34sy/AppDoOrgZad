import { describe, expect, it } from "vitest";
import { sanitizeNoteMutation } from "@/lib/note-mutations";

describe("sanitizeNoteMutation", () => {
  it("keeps only editable note fields", () => {
    const payload = sanitizeNoteMutation({
      _id: "note-id",
      ownerId: "other-user",
      title: "Meeting notes",
      content: "Follow up tomorrow",
      color: "#fff7cc",
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
      color: "#fff7cc",
      tags: ["work"],
      position: 2
    });
  });

  it("maps named note colors to hex values", () => {
    const payload = sanitizeNoteMutation({
      title: "Color note",
      color: "turquoise"
    });

    expect(payload).toEqual({
      title: "Color note",
      color: "#5eead4"
    });
  });
});
