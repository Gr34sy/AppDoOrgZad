/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ListControls } from "@/components/dashboard/list-controls";

const navigation = vi.hoisted(() => ({
  pathname: "/dashboard/tasks",
  searchParams: "",
  push: vi.fn(),
  replace: vi.fn()
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({
    push: navigation.push,
    replace: navigation.replace
  }),
  useSearchParams: () => new URLSearchParams(navigation.searchParams)
}));

describe("ListControls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ preference: {} })));
    vi.useFakeTimers();
    navigation.pathname = "/dashboard/tasks";
    navigation.searchParams = "";
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("debounces search changes and preserves the selected sort", () => {
    render(
      <ListControls
        entityType="tasks"
        searchValue=""
        filterValue=""
        linkedValue=""
        sortValue="position"
        sortDirection="asc"
        clearHref="/dashboard/tasks"
      />
    );

    fireEvent.change(screen.getByLabelText("Sort"), { target: { value: "due" } });
    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "release" } });
    vi.advanceTimersByTime(260);

    expect(navigation.replace).toHaveBeenCalledWith("/dashboard/tasks?q=release&priority=&linked=&sort=due&direction=asc&pinned=false");
  });

  it("applies priority and relation filters", () => {
    render(
      <ListControls
        entityType="tasks"
        searchValue=""
        filterValue=""
        linkedValue=""
        sortValue="position"
        sortDirection="asc"
        clearHref="/dashboard/tasks"
      />
    );

    fireEvent.change(screen.getByLabelText("Priority"), { target: { value: "high" } });
    expect(navigation.replace).toHaveBeenLastCalledWith("/dashboard/tasks?priority=high&linked=&sort=position&direction=asc&pinned=false");

    fireEvent.change(screen.getByLabelText("Relation"), { target: { value: "project" } });
    expect(navigation.replace).toHaveBeenLastCalledWith(
      "/dashboard/tasks?priority=high&linked=project&sort=position&direction=asc&pinned=false"
    );
  });

  it("uses All as the default task relation filter", () => {
    render(
      <ListControls
        entityType="tasks"
        searchValue=""
        filterValue=""
        linkedValue=""
        sortValue="position"
        sortDirection="asc"
        clearHref="/dashboard/tasks"
      />
    );

    expect(screen.getByLabelText("Relation")).toHaveValue("");

    fireEvent.change(screen.getByLabelText("Relation"), {
      target: { value: "unlinked" }
    });

    expect(navigation.replace).toHaveBeenLastCalledWith(
      "/dashboard/tasks?priority=&linked=unlinked&sort=position&direction=asc&pinned=false"
    );
  });

  it("updates sort automatically and resets controls", () => {
    render(
      <ListControls
        entityType="tasks"
        searchValue="demo"
        filterValue="medium"
        linkedValue="task"
        sortValue="position"
        sortDirection="asc"
        clearHref="/dashboard/tasks"
      />
    );

    fireEvent.change(screen.getByLabelText("Sort"), { target: { value: "priority" } });
    vi.advanceTimersByTime(260);

    expect(navigation.replace).toHaveBeenCalledWith(
      "/dashboard/tasks?q=demo&priority=medium&linked=task&sort=priority&direction=asc&pinned=false"
    );

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(navigation.replace).toHaveBeenLastCalledWith("/dashboard/tasks?sort=created&direction=desc&pinned=false&priority=&linked=");
  });
  it("restores pinned-only and keeps it enabled while changing other controls", () => {
    render(<ListControls entityType="tasks" searchValue="" sortValue="position" sortDirection="asc" clearHref="/dashboard/tasks" pinnedValue />);
    expect(screen.getByLabelText("Pinned")).toHaveValue("true");
    fireEvent.change(screen.getByLabelText("Priority"), { target: { value: "high" } });
    expect(navigation.replace).toHaveBeenLastCalledWith("/dashboard/tasks?priority=high&linked=&sort=position&direction=asc&pinned=true");
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByLabelText("Pinned")).toHaveValue("false");
    expect(navigation.replace).toHaveBeenLastCalledWith("/dashboard/tasks?sort=created&direction=desc&pinned=false&priority=&linked=");
  });

});
