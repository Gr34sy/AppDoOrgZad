/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { StatusPage } from "@/components/layout/status-page";

describe("StatusPage", () => {
  it("offers retrying after an application error", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(<StatusPage kind="error" onRetry={onRetry} />);
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(onRetry).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: "Back to dashboard" })).toHaveAttribute(
      "href",
      "/dashboard"
    );
  });

  it("renders a minimal not-found state", () => {
    render(<StatusPage kind="not-found" withinDashboard />);

    expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
  });
});
