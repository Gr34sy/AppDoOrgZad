/**
 * @vitest-environment jsdom
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PinnedItemsSearch } from "./pinned-items-search";
import { ArchiveItemsSearch } from "./archive-items-search";
import { ListControls } from "./list-controls";
import { useListPreferences } from "./use-list-preferences";
import { defaultListSettings } from "@/lib/list-preferences";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/tasks",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() })
}));

function savedRequest() {
  const calls = vi.mocked(fetch).mock.calls;
  return JSON.parse(String(calls[calls.length - 1]?.[1]?.body)).listControls;
}

describe("list preference persistence", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ preference: {} })));
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  it.each(["dashboard", "archive"] as const)("restores and saves %s types, relation, sorting and Reset", async (scope) => {
    const user = userEvent.setup();
    const initial = { ...defaultListSettings(scope), sort: "title" as const, direction: "desc" as const, linked: "project" as const, types: ["task" as const] };
    if (scope === "dashboard") render(<PinnedItemsSearch pinnedItems={[]} initialListSettings={initial} />);
    else render(<ArchiveItemsSearch items={[]} initialListSettings={initial} />);

    expect(screen.getByLabelText("Sort")).toHaveValue("title");
    expect(screen.getByLabelText("Relation")).toHaveValue("project");
    expect(screen.getByRole("button", { name: "Tasks" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Notes" })).toHaveAttribute("aria-pressed", "false");
    expect(fetch).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Notes" }));
    await waitFor(() => expect(savedRequest()).toMatchObject({ scope, settings: { types: ["task", "note"] } }));
    await user.selectOptions(screen.getByLabelText("Relation"), "unlinked");
    await user.selectOptions(screen.getByLabelText("Sort"), "updated");
    await user.click(screen.getByRole("button", { name: "Sort descending. Click to reverse." }));
    await waitFor(() => expect(savedRequest()).toMatchObject({ scope, settings: { linked: "unlinked", sort: "updated", direction: "asc" } }));

    await user.click(screen.getByRole("button", { name: "Reset" }));
    await waitFor(() => expect(savedRequest()).toEqual({ scope, settings: defaultListSettings(scope) }));
    expect(screen.getByLabelText("Sort")).toHaveValue(scope === "archive" ? "archived" : "created");
    expect(screen.getByRole("button", { name: "Sort descending. Click to reverse." })).toBeInTheDocument();
    expect(vi.mocked(fetch).mock.calls.every(([url]) => url === "/api/user-preferences")).toBe(true);
  });

  it.each(["notes", "checklists", "tasks", "projects"] as const)("saves %s controls without persisting the search text", async (scope) => {
    const user = userEvent.setup();
    render(<ListControls entityType={scope} searchValue="" sortValue="position" sortDirection="asc" clearHref={`/dashboard/${scope}`} />);
    expect(fetch).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "temporary search" } });
    expect(fetch).not.toHaveBeenCalled();
    await user.selectOptions(screen.getByLabelText("Sort"), "title");
    await user.click(screen.getByRole("button", { name: "Sort ascending. Click to reverse." }));
    if (scope === "tasks" || scope === "projects") await user.selectOptions(screen.getByLabelText("Priority"), "high");
    if (scope !== "projects") await user.selectOptions(screen.getByLabelText("Relation"), "project");
    await waitFor(() => expect(savedRequest()).toEqual({
      scope,
      settings: {
        ...defaultListSettings(scope), sort: "title", direction: "desc",
        priority: scope === "tasks" || scope === "projects" ? "high" : "",
        linked: scope !== "projects" ? "project" : ""
      }
    }));
    await user.selectOptions(screen.getByLabelText("Pinned"), "true");
    await waitFor(() => expect(savedRequest().settings.pinned).toBe(true));
    await user.click(screen.getByRole("button", { name: "Reset" }));
    await waitFor(() => expect(savedRequest()).toEqual({ scope, settings: defaultListSettings(scope) }));
    expect(screen.getByLabelText("Sort")).toHaveValue("created");
    expect(screen.getByRole("button", { name: "Sort descending. Click to reverse." })).toBeInTheDocument();
    expect(vi.mocked(fetch).mock.calls.every(([url]) => url === "/api/user-preferences")).toBe(true);
  });

  it("reports failed saves", async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({}, { status: 503 }));
    const user = userEvent.setup();
    render(<PinnedItemsSearch pinnedItems={[]} />);
    await user.selectOptions(screen.getByLabelText("Sort"), "title");
    expect(await screen.findByRole("status")).toHaveTextContent("Could not save list preferences");
  });
  it("saves rapid changes in order and finishes pending saves after leaving the view", async () => {
    let finishFirstSave!: (response: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(() => new Promise((resolve) => { finishFirstSave = resolve; }));
    function Controls({ direction }: { direction: "asc" | "desc" }) {
      useListPreferences("notes", { ...defaultListSettings("notes"), sort: "title", direction });
      return null;
    }
    const { rerender, unmount } = render(<Controls direction="asc" />);
    rerender(<Controls direction="desc" />);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    rerender(<Controls direction="asc" />);
    expect(fetch).toHaveBeenCalledTimes(1);
    unmount();
    await act(async () => { finishFirstSave(Response.json({})); });
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(savedRequest().settings.direction).toBe("asc");
    expect(vi.mocked(fetch).mock.calls[1]?.[1]?.keepalive).toBe(true);
  });

  it("restores the same manual order after Reset and switching back to User's Order", async () => {
    const user = userEvent.setup();
    const items = [
      { id: "first", position: 0, title: "First manually", createdAt: "2025-01-01", updatedAt: "2025-01-01" },
      { id: "second", position: 1, title: "Newest", createdAt: "2026-01-01", updatedAt: "2026-01-01" }
    ].map((item) => ({
      ...item, type: "Note", description: "", meta: "Note", status: "", tags: [],
      canFilterRelation: true, relationTargets: [], href: `/dashboard/notes/${item.id}`
    }));
    render(<PinnedItemsSearch pinnedItems={items} initialListSettings={{ ...defaultListSettings("dashboard"), sort: "position", direction: "asc" }} />);
    expect(screen.getAllByRole("link")[0]).toHaveTextContent("First manually");
    await user.click(screen.getByRole("button", { name: "Reset" }));
    await waitFor(() => expect(screen.getAllByRole("link")[0]).toHaveTextContent("Newest"));
    await user.selectOptions(screen.getByLabelText("Sort"), "position");
    await waitFor(() => expect(screen.getAllByRole("link")[0]).toHaveTextContent("First manually"));
    expect(items.map((item) => item.position)).toEqual([0, 1]);
    expect(vi.mocked(fetch).mock.calls.every(([url]) => url === "/api/user-preferences")).toBe(true);
  });

});
