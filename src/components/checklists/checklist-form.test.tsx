/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChecklistForm } from "@/components/checklists/checklist-form";

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn()
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation
}));

describe("ChecklistForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue(
      Response.json({ checklist: { id: "checklist-1" } }, { status: 201 })
    );
  });

  it("shows an English validation message when title is missing", async () => {
    const { container } = render(<ChecklistForm mode="create" />);

    fireEvent.submit(container.querySelector("form") as HTMLFormElement);

    expect(await screen.findByText("Checklist title is required.")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("creates checklist items and redirects to the created checklist", async () => {
    const user = userEvent.setup();

    render(<ChecklistForm mode="create" returnTo="/dashboard" />);

    await user.type(screen.getByLabelText("Title"), "Release checklist");
    await user.type(screen.getByLabelText("Item 1"), "Run tests");
    await user.click(screen.getByText("Done"));
    await user.click(screen.getByRole("button", { name: /create checklist/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/checklists",
        expect.objectContaining({
          method: "POST",
          body: expect.any(String)
        })
      );
    });

    const request = vi.mocked(global.fetch).mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(request.body))).toEqual({
      title: "Release checklist",
      items: [
        expect.objectContaining({
          title: "Run tests",
          isCompleted: true,
          position: 0
        })
      ]
    });
    expect(navigation.push).toHaveBeenCalledWith("/dashboard/checklists/checklist-1");
    expect(navigation.refresh).toHaveBeenCalled();
  });
});
