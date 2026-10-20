/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TaskForm } from "@/components/tasks/task-form";
import { ProjectForm } from "@/components/projects/project-form";

const navigation = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));

describe("title-only notes in parent forms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ task: { id: "task-1" }, project: { id: "project-1" } })));
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  it.each(["task", "project"] as const)("creates new note titles alongside the %s", async (entity) => {
    const user = userEvent.setup();
    const options = [{ id: "note-1", title: "Brief" }];
    if (entity === "task") render(<TaskForm mode="create" projectOptions={[]} checklistOptions={[]} noteOptions={options} />);
    else render(<ProjectForm mode="create" checklistOptions={[]} noteOptions={options} />);
    await user.type(screen.getByLabelText("Title"), "Parent");
    await user.click(screen.getByRole("checkbox", { name: "Brief" }));
    await user.click(screen.getByRole("button", { name: "Add note" }));
    expect(screen.getByLabelText("New note title")).toHaveFocus();
    await user.keyboard("  Delivery details  ");
    await user.click(screen.getByRole("button", { name: "Add note" }));
    expect(screen.getAllByLabelText("New note title")[1]).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Add note" }));
    await user.keyboard("Discard");
    await user.click(screen.getByRole("button", { name: "Remove new note 3" }));
    expect(screen.queryByLabelText("Content")).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: entity === "task" ? "Create task" : "Create project" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    const [url, request] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe(`/api/${entity}s`);
    expect(JSON.parse(String(request?.body))).toMatchObject({
      title: "Parent", noteIds: ["note-1"], newNotes: [{ title: "Delivery details" }]
    });
  });
});
