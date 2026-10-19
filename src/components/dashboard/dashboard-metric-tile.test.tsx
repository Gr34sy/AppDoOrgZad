/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DashboardMetricTile, type DashboardMetric } from "./dashboard-metric-tile";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams()
}));

const metric: DashboardMetric = {
  title: "Tasks",
  count: 1,
  colorKey: "tasks",
  items: [{ id: "task-1", title: "Prepare release", href: "/dashboard/tasks/task-1", updatedAt: "", meta: "Task" }]
};

describe("DashboardMetricTile", () => {
  it("opens with the keyboard and restores focus when Escape closes the preview", async () => {
    const user = userEvent.setup();
    render(<DashboardMetricTile metric={metric} alignRight={false} />);
    const trigger = screen.getByRole("button", { name: /Tasks/ });

    await user.tab();
    await user.keyboard("{Enter}");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const link = screen.getByRole("link", { name: /Prepare release/ });
    expect(link).toHaveAttribute("href", "/dashboard/tasks/task-1?returnTo=%2Fdashboard");
    await user.tab();
    expect(link).toHaveFocus();
    await user.keyboard("{Escape}");

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("toggles by clicking and closes on an outside pointer interaction", async () => {
    const user = userEvent.setup();
    render(<DashboardMetricTile metric={metric} alignRight />);
    const trigger = screen.getByRole("button", { name: /Tasks/ });

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    fireEvent.pointerDown(document.body);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("shows an empty state and closes when keyboard focus leaves the tile", async () => {
    const user = userEvent.setup();
    render(<><DashboardMetricTile metric={{ ...metric, count: 0, items: [] }} alignRight={false} /><button>Next</button></>);

    await user.tab();
    await user.keyboard(" ");
    expect(screen.getByText("No recently updated tasks")).toBeInTheDocument();
    await user.tab();
    expect(screen.getByRole("button", { name: "Next" })).toHaveFocus();
    expect(screen.queryByText("No recently updated tasks")).not.toBeInTheDocument();
  });
});
