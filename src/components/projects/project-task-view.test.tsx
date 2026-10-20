/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectTaskView } from "./project-task-view";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/projects/project-1",
  useSearchParams: () => new URLSearchParams()
}));
vi.mock("./project-kanban-board", () => ({ ProjectKanbanBoard: () => <div>Kanban board</div> }));

const props = {
  projectId: "project-1",
  initialView: "kanban" as const,
  columns: [], tasks: [],
  projectInformation: <div>Project information</div>
};

describe("project view persistence", () => {
  beforeEach(() => { vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({}))); });
  afterEach(() => { vi.unstubAllGlobals(); });

  it("saves expansion and restores it when the project is reopened", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<ProjectTaskView {...props} />);
    expect(screen.getByText("Project information")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Expand View" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Restore view" })).toBeEnabled());
    expect(fetch).toHaveBeenCalledWith("/api/projects/project-1", expect.objectContaining({
      method: "PATCH", body: JSON.stringify({ taskView: "kanban", taskViewExpanded: true })
    }));
    expect(screen.queryByText("Project information")).not.toBeInTheDocument();
    unmount();

    render(<ProjectTaskView {...props} initialExpanded />);
    expect(screen.getByRole("button", { name: "Restore view" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.queryByText("Project information")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Restore view" }));
    await waitFor(() => expect(fetch).toHaveBeenLastCalledWith("/api/projects/project-1", expect.objectContaining({
      body: JSON.stringify({ taskView: "kanban", taskViewExpanded: false })
    })));
    expect(screen.getByText("Project information")).toBeInTheDocument();
  });

  it("keeps expansion when changing from Kanban to list", async () => {
    const user = userEvent.setup();
    render(<ProjectTaskView {...props} initialExpanded />);
    await user.click(screen.getByRole("button", { name: "List" }));
    expect(fetch).toHaveBeenLastCalledWith("/api/projects/project-1", expect.objectContaining({
      body: JSON.stringify({ taskView: "list", taskViewExpanded: true })
    }));
    expect(screen.getByText("Task list")).toBeInTheDocument();
    expect(screen.queryByText("Project information")).not.toBeInTheDocument();
  });

  it.each(["http", "network"])("rolls back expansion on a %s failure", async (failure) => {
    if (failure === "http") vi.mocked(fetch).mockResolvedValue(Response.json({}, { status: 500 }));
    else vi.mocked(fetch).mockRejectedValue(new Error("Offline"));
    const user = userEvent.setup();
    render(<ProjectTaskView {...props} />);
    await user.click(screen.getByRole("button", { name: "Expand View" }));
    expect(await screen.findByText("Could not save the task view.")).toBeInTheDocument();
    expect(screen.getByText("Project information")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Expand View" })).toBeEnabled();
  });
});
