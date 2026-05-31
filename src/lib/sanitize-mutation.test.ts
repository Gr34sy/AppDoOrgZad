import { describe, expect, it } from "vitest";
import { sanitizeMutation } from "@/lib/sanitize-mutation";

describe("sanitizeMutation", () => {
  it("removes immutable and ownership fields", () => {
    const payload = sanitizeMutation({
      _id: "item-id",
      ownerId: "other-user",
      title: "Keep me",
      updatedAt: new Date()
    });

    expect(payload).toEqual({ title: "Keep me" });
  });
});
