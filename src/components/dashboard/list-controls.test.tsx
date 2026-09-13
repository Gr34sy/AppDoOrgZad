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
    vi.useFakeTimers();
    navigation.pathname = "/dashboard/tasks";
    navigation.searchParams = "";
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
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

    expect(navigation.replace).toHaveBeenCalledWith("/dashboard/tasks?q=release&sort=due");
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
    expect(navigation.replace).toHaveBeenLastCalledWith("/dashboard/tasks?priority=high");

    fireEvent.change(screen.getByLabelText("Relation"), { target: { value: "project" } });
    expect(navigation.replace).toHaveBeenLastCalledWith(
      "/dashboard/tasks?priority=high&linked=project"
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
      "/dashboard/tasks?q=demo&priority=medium&linked=task&sort=priority"
    );

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(navigation.replace).toHaveBeenLastCalledWith("/dashboard/tasks");
  });
});
