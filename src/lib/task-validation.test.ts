import { describe, expect, it } from "vitest";
import { taskCreateSchema, taskUpdateSchema } from "./validation-schemas";

describe("task validation schemas", () => {
  it("accepts a complete task payload and trims text fields", () => {
    const result = taskCreateSchema.safeParse({
      title: "  Prepare implementation chapter  ",
      description: "Describe backend and tests",
      priority: "high",
      statusId: "  in_progress  ",
      projectId: "665f1f77bcf86cd799439013",
      dueDate: "2026-07-26T10:00:00.000Z",
      tags: ["  thesis  ", "backend"],
      checklistIds: ["665f1f77bcf86cd799439014"],
      newChecklists: [{ title: "  Review sources  " }],
      noteIds: ["665f1f77bcf86cd799439015"],
      position: 2,
      completedAt: null
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.data.title).toBe("Prepare implementation chapter");
    expect(result.data.statusId).toBe("in_progress");
    expect(result.data.tags).toEqual(["thesis", "backend"]);
    expect(result.data.newChecklists).toEqual([{ title: "Review sources" }]);
  });

  it("rejects unknown task and checklist fields", () => {
    const result = taskCreateSchema.safeParse({
      title: "Task with unsupported fields",
      unsupported: true,
      newChecklists: [
        {
          title: "Checklist",
          extra: "field"
        }
      ]
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid priority, dates and empty linked identifiers", () => {
    const result = taskCreateSchema.safeParse({
      title: "Invalid task",
      priority: "critical",
      dueDate: "tomorrow",
      checklistIds: [""],
      noteIds: ["   "]
    });

    expect(result.success).toBe(false);
  });

  it("requires at least one field when updating a task", () => {
    expect(taskUpdateSchema.safeParse({}).success).toBe(false);
    expect(taskUpdateSchema.safeParse({ statusId: "done" }).success).toBe(true);
  });
});
