/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LinkedNoteList, type LinkedNoteOption } from "./linked-note-list";

const navigation = vi.hoisted(() => ({ pathname: "/dashboard/tasks/task-1", push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
  usePathname: () => navigation.pathname,
  useSearchParams: () => new URLSearchParams("returnTo=%2Fdashboard")
}));

const notes: LinkedNoteOption[] = [
  { id: "note-1", title: "Existing note", content: "Meeting details", tags: ["work"], linkedItems: [{ targetType: "task", targetId: "task-1" }, { targetType: "project", targetId: "project-1" }] },
  { id: "note-2", title: "Available note", content: "Context", tags: [], linkedItems: [{ targetType: "task", targetId: "other-task" }] }
];

describe("LinkedNoteList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ note: { id: "new-note" } })));
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  it.each(["task", "project"] as const)("shows only notes linked to the current %s and preserves return navigation", (parentType) => {
    const parentId = `${parentType}-1`;
    navigation.pathname = `/dashboard/${parentType}s/${parentId}`;
    render(<LinkedNoteList parentType={parentType} parentId={parentId} noteOptions={notes} />);
    const link = screen.getByRole("link", { name: /Existing note/ });
    expect(link).toHaveAttribute("href", `/dashboard/notes/note-1?returnTo=${encodeURIComponent(`${navigation.pathname}?returnTo=%2Fdashboard`)}`);
    expect(screen.queryByText("Meeting details")).not.toBeInTheDocument();
    expect(link).toHaveTextContent("work");
    expect(screen.queryByRole("link", { name: /Available note/ })).not.toBeInTheDocument();
  });

  it.each(["task", "project"] as const)("creates a note already attached to the %s without leaving its page", async (parentType) => {
    const user = userEvent.setup();
    const parentId = `${parentType}-1`;
    render(<LinkedNoteList parentType={parentType} parentId={parentId} noteOptions={[]} />);
    await user.click(screen.getByRole("button", { name: "Add note" }));
    await user.click(screen.getByRole("button", { name: "New note" }));
    expect(screen.getByLabelText("Title")).toHaveFocus();
    await user.keyboard("Delivery details");
    await user.type(screen.getByLabelText("Content"), "Three pallets returned");
    await user.type(screen.getByLabelText("Tag 1"), "delivery");
    await user.click(screen.getByRole("button", { name: "Create note" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/notes", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ title: "Delivery details", content: "Three pallets returned", tags: ["delivery"], linkedItems: [{ targetType: parentType, targetId: parentId }] })
    })));
    expect(await screen.findByRole("link", { name: /Delivery details/ })).toBeInTheDocument();
    expect(navigation.push).not.toHaveBeenCalled();
    expect(navigation.refresh).toHaveBeenCalled();
  });

  it.each(["task", "project"] as const)("attaches and unlinks notes through the %s API", async (parentType) => {
    const user = userEvent.setup();
    const parentId = `${parentType}-1`;
    render(<LinkedNoteList parentType={parentType} parentId={parentId} noteOptions={notes} />);
    await user.click(screen.getByRole("button", { name: "Add note" }));
    await user.selectOptions(screen.getByLabelText("Existing note"), "note-2");
    await user.click(screen.getByRole("button", { name: "Attach" }));
    expect(await screen.findByRole("link", { name: /Available note/ })).toBeInTheDocument();
    expect(fetch).toHaveBeenLastCalledWith(`/api/${parentType}s/${parentId}`, expect.objectContaining({ method: "PATCH", body: JSON.stringify({ noteIds: ["note-1", "note-2"] }) }));
    await user.click(screen.getByRole("button", { name: "Unlink Existing note" }));
    await waitFor(() => expect(screen.queryByRole("link", { name: /Existing note/ })).not.toBeInTheDocument());
    expect(fetch).toHaveBeenLastCalledWith(`/api/${parentType}s/${parentId}`, expect.objectContaining({ body: JSON.stringify({ noteIds: ["note-2"] }) }));
  });

  it("preserves the note and reports an error when unlinking fails", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Offline"));
    const user = userEvent.setup();
    render(<LinkedNoteList parentType="task" parentId="task-1" noteOptions={notes} />);
    await user.click(screen.getByRole("button", { name: "Unlink Existing note" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not update linked notes");
    expect(screen.getByRole("link", { name: /Existing note/ })).toBeInTheDocument();
  });

  it("lets the user cancel a new note without saving anything", async () => {
    const user = userEvent.setup();
    render(<LinkedNoteList parentType="task" parentId="task-1" noteOptions={[]} />);
    await user.click(screen.getByRole("button", { name: "Add note" }));
    await user.click(screen.getByRole("button", { name: "New note" }));
    await user.type(screen.getByLabelText("Title"), "Draft");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByLabelText("Title")).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });
});
