/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProjectKanbanBoard } from "@/components/projects/project-kanban-board";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push: vi.fn() }),
  usePathname: () => "/dashboard/projects/project-1",
  useSearchParams: () => new URLSearchParams()
}));

const columns = [
  { id: "todo", title: "To do", color: "#2563eb", isDone: false },
  { id: "done", title: "Done", color: "#16a34a", isDone: true }
];

function createDataTransfer() {
  const values = new Map<string, string>();

  return {
    effectAllowed: "move",
    dropEffect: "move",
    setData: (type: string, value: string) => values.set(type, value),
    getData: (type: string) => values.get(type) ?? ""
  };
}

describe("ProjectKanbanBoard columns", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    refresh.mockClear();
  });

  it("adds a column to an existing board", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ project: {} }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }));
    vi.stubGlobal("fetch", fetchMock);

    render(<ProjectKanbanBoard projectId="project-1" columns={columns} tasks={[]} />);

    await user.click(screen.getByRole("button", { name: "Add column" }));
    expect(screen.getByRole("heading", { name: "Add Kanban column" })).toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: "Column name" }), "Review");
    await user.click(screen.getByRole("button", { name: /^Add$/ }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(request.body));

    expect(body.kanbanColumns).toHaveLength(3);
    expect(body.kanbanColumns[2]).toEqual(expect.objectContaining({
      title: "Review",
      color: "#71717a",
      isDone: false,
      position: 2
    }));
  });

  it("reorders columns by dragging the column surface", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ project: {} }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }));
    vi.stubGlobal("fetch", fetchMock);
    render(
      <ProjectKanbanBoard
        projectId="project-1"
        columns={columns}
        tasks={[
          {
            id: "task-todo",
            title: "Planned task",
            description: "",
            priority: "medium",
            statusId: "todo",
            position: 0,
            tags: []
          },
          {
            id: "task-done",
            title: "Completed task",
            description: "",
            priority: "medium",
            statusId: "done",
            position: 0,
            tags: []
          }
        ]}
      />
    );

    const firstHeader = screen.getByText("To do").closest("[draggable='true']");
    const targetTask = screen.getByRole("link", { name: "Open task Completed task" });
    const dataTransfer = createDataTransfer();

    expect(firstHeader).not.toBeNull();
    fireEvent.dragStart(firstHeader as Element, { dataTransfer });
    fireEvent.dragOver(targetTask, { dataTransfer });
    fireEvent.drop(targetTask, { dataTransfer });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(request.body));

    expect(body.kanbanColumns.map((column: { id: string; position: number }) => [column.id, column.position])).toEqual([
      ["done", 0],
      ["todo", 1]
    ]);
  });

  it("does not start a column drag when a task card is dragged", () => {
    render(
      <ProjectKanbanBoard
        projectId="project-1"
        columns={columns}
        tasks={[{
          id: "task-1",
          title: "Prepare release",
          description: "",
          priority: "medium",
          statusId: "todo",
          position: 0,
          tags: []
        }]}
      />
    );

    const taskCard = screen.getByRole("link", { name: "Open task Prepare release" });
    const dataTransfer = createDataTransfer();
    fireEvent.dragStart(taskCard, { dataTransfer });

    expect(dataTransfer.getData("application/x-kanban-task")).toBe("task-1");
    expect(dataTransfer.getData("application/x-kanban-column")).toBe("");
  });

  it("deletes an empty column from the title editor", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ project: {} }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }));
    vi.stubGlobal("fetch", fetchMock);
    render(<ProjectKanbanBoard projectId="project-1" columns={columns} tasks={[]} />);

    await user.click(screen.getByText("To do").closest("button") as HTMLButtonElement);
    await user.click(screen.getByRole("button", { name: "Delete To do column" }));
    await user.click(screen.getByRole("button", { name: /^Delete$/ }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(request.body));

    expect(body.kanbanColumns).toEqual([
      { id: "done", title: "Done", color: "#16a34a", isDone: true, position: 0 }
    ]);
  });

  it("moves the first task to the second task position regardless of the drop half", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }));
    vi.stubGlobal("fetch", fetchMock);
    render(
      <ProjectKanbanBoard
        projectId="project-1"
        columns={columns}
        tasks={[
          {
            id: "task-1",
            title: "First task",
            description: "",
            priority: "medium",
            statusId: "todo",
            position: 0,
            tags: []
          },
          {
            id: "task-2",
            title: "Second task",
            description: "",
            priority: "medium",
            statusId: "todo",
            position: 1,
            tags: []
          }
        ]}
      />
    );

    const firstTask = screen.getByRole("link", { name: "Open task First task" });
    const secondTask = screen.getByRole("link", { name: "Open task Second task" });
    const dataTransfer = createDataTransfer();
    Object.defineProperty(secondTask, "getBoundingClientRect", {
      value: () => ({ top: 100, height: 80 })
    });

    fireEvent.dragStart(firstTask, { dataTransfer });
    fireEvent.dragOver(secondTask, { dataTransfer, clientY: 110 });
    fireEvent.drop(secondTask, { dataTransfer, clientY: 110 });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(request.body));
    const positions = Object.fromEntries(
      body.items.map((item: { id: string; position: number }) => [item.id, item.position])
    );

    expect(positions).toEqual({ "task-1": 1, "task-2": 0 });
  });
});
