/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChecklistDetailsPanel } from "@/components/checklists/checklist-details-panel";
import { TaskForm } from "@/components/tasks/task-form";
import { ProjectForm } from "@/components/projects/project-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams()
}));

describe("Checklist focus", () => {
  it("focuses new items on the standalone checklist page", async () => {
    const user = userEvent.setup();
    render(<ChecklistDetailsPanel checklistId="checklist-1" title="Shopping" items={[]} />);
    await user.click(screen.getByRole("button", { name: "Add item" }));
    expect(screen.getByRole("textbox")).toHaveFocus();
    await user.keyboard("Milk");
    await user.click(screen.getByRole("button", { name: "Add item" }));
    expect(screen.getByRole("textbox")).toHaveFocus();
    await user.keyboard("Bread");
    expect(screen.getByRole("textbox")).toHaveValue("Bread");
    expect(screen.getByText("Milk")).toBeInTheDocument();
  });

  it.each(["create", "edit"] as const)("focuses new checklist titles in %s forms", async (mode) => {
    const user = userEvent.setup();
    const { unmount } = render(
      <TaskForm mode={mode} projectOptions={[]} checklistOptions={[]} noteOptions={[]} />
    );
    await user.click(screen.getByRole("button", { name: "Add checklist" }));
    expect(screen.getByLabelText("New checklist title")).toHaveFocus();
    await user.keyboard("Shopping");
    await user.click(screen.getByRole("button", { name: "Add checklist" }));
    expect(screen.getAllByLabelText("New checklist title")[1]).toHaveFocus();
    unmount();

    render(<ProjectForm mode={mode} checklistOptions={[]} noteOptions={[]} />);
    await user.click(screen.getByRole("button", { name: "Add checklist" }));
    expect(screen.getByLabelText("New checklist title")).toHaveFocus();
    await user.keyboard("Shopping");
    await user.click(screen.getByRole("button", { name: "Add checklist" }));
    expect(screen.getAllByLabelText("New checklist title")[1]).toHaveFocus();
  });
});
