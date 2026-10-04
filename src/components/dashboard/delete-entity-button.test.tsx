/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DeleteEntityButton } from "@/components/dashboard/delete-entity-button";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
  useSearchParams: () => new URLSearchParams(
    "returnTo=%2Fdashboard%2Fprojects%2Fproject-1%3FreturnTo%3D%252Fdashboard%252Fprojects"
  )
}));

describe("DeleteEntityButton", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    push.mockClear();
    refresh.mockClear();
  });

  it("returns to the originating view after archiving", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })));

    render(
      <DeleteEntityButton
        endpoint="/api/tasks/task-1"
        redirectTo="/dashboard/tasks"
        label="Archive"
        errorLabel="Could not archive the task."
      />
    );

    await user.click(screen.getByRole("button", { name: "Archive" }));
    await user.click(screen.getAllByRole("button", { name: "Archive" })[1]);

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith(
        "/dashboard/projects/project-1?returnTo=%2Fdashboard%2Fprojects"
      );
    });
    expect(refresh).toHaveBeenCalledOnce();
  });
});
