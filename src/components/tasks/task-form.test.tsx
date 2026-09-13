/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TaskForm } from "@/components/tasks/task-form";

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn()
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation
}));

describe("TaskForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue(
      Response.json({ task: { id: "task-1" } }, { status: 201 })
    );
  });

  it("shows an English validation message when title is missing", async () => {
    const { container } = render(
      <TaskForm
        mode="create"
        projectOptions={[]}
        checklistOptions={[]}
        noteOptions={[]}
      />
    );

    fireEvent.submit(container.querySelector("form") as HTMLFormElement);

    expect(await screen.findByText("Task title is required.")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("creates a task and redirects to the created task", async () => {
    const user = userEvent.setup();

    render(
      <TaskForm
        mode="create"
        projectOptions={[
          {
            id: "project-1",
            title: "Website",
            kanbanColumns: [
              { id: "todo", title: "To do" },
              { id: "review", title: "Review" }
            ]
          }
        ]}
        checklistOptions={[{ id: "checklist-1", title: "Launch checklist" }]}
        noteOptions={[{ id: "note-1", title: "Brief" }]}
        returnTo="/dashboard/projects/project-1"
      />
    );

    await user.type(screen.getByLabelText("Title"), "Prepare release");
    await user.selectOptions(screen.getByLabelText("Priority"), "high");
    await user.selectOptions(screen.getByLabelText("Project"), "project-1");
    await user.selectOptions(screen.getByLabelText("Status"), "review");
    await user.type(screen.getByLabelText("Tag 1"), "frontend");
    await user.click(screen.getByText("Launch checklist"));
    await user.click(screen.getByText("Brief"));
    await user.click(screen.getByRole("button", { name: /create task/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/tasks",
        expect.objectContaining({
          method: "POST",
          body: expect.any(String)
        })
      );
    });

    const request = vi.mocked(global.fetch).mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(request.body))).toEqual(
      expect.objectContaining({
        title: "Prepare release",
        priority: "high",
        projectId: "project-1",
        statusId: "review",
        tags: ["frontend"],
        checklistIds: ["checklist-1"],
        noteIds: ["note-1"]
      })
    );
    expect(navigation.push).toHaveBeenCalledWith("/dashboard/tasks/task-1");
    expect(navigation.refresh).toHaveBeenCalled();
  });
});
