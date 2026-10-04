/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LinkedChecklistList } from "@/components/checklists/linked-checklist-list";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/tasks/task-1",
  useSearchParams: () => new URLSearchParams()
}));

describe("LinkedChecklistList", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("expands and edits a linked checklist", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ checklist: {} }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <LinkedChecklistList
        parentType="task"
        parentId="665f1f77bcf86cd799439011"
        checklistIds={["665f1f77bcf86cd799439012"]}
        checklistOptions={[
          {
            id: "665f1f77bcf86cd799439012",
            title: "Release checklist",
            items: [{ title: "Run tests", isCompleted: false }],
            parentType: "task",
            parentId: "665f1f77bcf86cd799439011"
          }
        ]}
      />
    );

    expect(screen.getByRole("link", { name: /open release checklist/i })).toHaveAttribute(
      "href",
      expect.stringContaining("/dashboard/checklists/665f1f77bcf86cd799439012")
    );
    await user.click(screen.getByRole("button", { name: "Expand Release checklist" }));
    const itemRow = screen.getByText("Run tests").closest("[draggable='true']");
    await user.click(itemRow as Element);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/checklists/665f1f77bcf86cd799439012",
        expect.objectContaining({ method: "PATCH" })
      );
    });

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(request.body))).toEqual({
      title: "Release checklist",
      items: [{ title: "Run tests", isCompleted: true, position: 0 }]
    });
  });

  it("persists reordered checklist items immediately after drop", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ checklist: {} }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <LinkedChecklistList
        parentType="project"
        parentId="665f1f77bcf86cd799439011"
        checklistIds={["665f1f77bcf86cd799439012"]}
        checklistOptions={[
          {
            id: "665f1f77bcf86cd799439012",
            title: "Release checklist",
            items: [
              { title: "First", isCompleted: false },
              { title: "Second", isCompleted: false }
            ]
          }
        ]}
      />
    );

    await user.click(screen.getByRole("button", { name: "Expand Release checklist" }));
    const firstRow = screen.getByText("First").closest("[draggable='true']");
    const secondRow = screen.getByText("Second").closest("[draggable='true']");
    const transfer = new Map<string, string>();
    const dataTransfer = {
      effectAllowed: "move",
      dropEffect: "move",
      setData: (type: string, value: string) => transfer.set(type, value),
      getData: (type: string) => transfer.get(type) ?? ""
    };

    Object.defineProperty(secondRow, "getBoundingClientRect", {
      value: () => ({ top: 0, height: 40 })
    });
    fireEvent.dragStart(firstRow as Element, { dataTransfer });
    fireEvent.dragOver(secondRow as Element, { dataTransfer, clientY: 30 });
    fireEvent.drop(secondRow as Element, { dataTransfer, clientY: 30 });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(request.body)).items).toEqual([
      { title: "Second", isCompleted: false, position: 0 },
      { title: "First", isCompleted: false, position: 1 }
    ]);
  });

  it("unlinks a checklist from both the checklist and its parent", async () => {
    const user = userEvent.setup();
    const onChecklistIdsChange = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <LinkedChecklistList
        parentType="task"
        parentId="665f1f77bcf86cd799439011"
        checklistIds={["665f1f77bcf86cd799439012"]}
        checklistOptions={[
          {
            id: "665f1f77bcf86cd799439012",
            title: "Release checklist",
            items: [],
            parentType: "task",
            parentId: "665f1f77bcf86cd799439011"
          }
        ]}
        onChecklistIdsChange={onChecklistIdsChange}
      />
    );

    await user.click(screen.getByRole("button", { name: "Unlink Release checklist" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/checklists/665f1f77bcf86cd799439012",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ parentType: null, parentId: null })
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/tasks/665f1f77bcf86cd799439011",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ checklistIds: [] })
      })
    );
    expect(onChecklistIdsChange).toHaveBeenCalledWith([]);
    expect(screen.queryByText("Release checklist")).not.toBeInTheDocument();
  });

  it("does not save an unchanged item after opening its editor", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      <LinkedChecklistList
        parentType="task"
        parentId="665f1f77bcf86cd799439011"
        checklistIds={["665f1f77bcf86cd799439012"]}
        checklistOptions={[
          {
            id: "665f1f77bcf86cd799439012",
            title: "Release checklist",
            items: [{ title: "Run tests", isCompleted: false }]
          }
        ]}
      />
    );

    await user.click(screen.getByRole("button", { name: "Expand Release checklist" }));
    await user.click(screen.getByRole("button", { name: "Edit Run tests" }));
    const input = screen.getByLabelText("Checklist item 1");
    fireEvent.blur(input);

    await waitFor(() => expect(screen.queryByLabelText("Checklist item 1")).not.toBeInTheDocument());
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
