/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NoteCreateForm } from "@/components/notes/note-create-form";

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn()
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation
}));

describe("NoteCreateForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue(
      Response.json({ note: { id: "note-1" } }, { status: 201 })
    );
  });

  it("shows an English validation message when title is missing", async () => {
    const { container } = render(<NoteCreateForm />);

    fireEvent.submit(container.querySelector("form") as HTMLFormElement);

    expect(await screen.findByText("Note title is required.")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("creates a note with tags", async () => {
    const user = userEvent.setup();

    render(<NoteCreateForm returnTo="/dashboard/notes?q=brief" />);

    await user.type(screen.getByLabelText("Title"), "Meeting brief");
    await user.type(screen.getByLabelText("Content"), "Important context");
    await user.type(screen.getByLabelText("Tag 1"), "client");
    await user.click(screen.getByRole("button", { name: /create note/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/notes",
        expect.objectContaining({
          method: "POST",
          body: expect.any(String)
        })
      );
    });

    const request = vi.mocked(global.fetch).mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(request.body))).toEqual({
      title: "Meeting brief",
      content: "Important context",
      tags: ["client"]
    });
    expect(navigation.push).toHaveBeenCalledWith("/dashboard/notes/note-1");
    expect(navigation.refresh).toHaveBeenCalled();
  });
});
