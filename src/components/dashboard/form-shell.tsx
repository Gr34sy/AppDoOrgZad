import type { ReactNode } from "react";

type EntityFormType = "note" | "checklist" | "task" | "project";

type FormShellProps = {
  entityType: EntityFormType;
  mode?: "create" | "edit";
  children: ReactNode;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

const formTitleByType: Record<EntityFormType, string> = {
  note: "Note",
  checklist: "Checklist",
  task: "Task",
  project: "Project"
};

export function FormShell({ entityType, mode = "create", children, onSubmit }: FormShellProps) {
  return (
    <form onSubmit={onSubmit} className="app-form-panel">
      {mode === "edit" ? (
        <div className="flex items-center justify-between gap-3">
          <h2 className="app-form-heading">
            Edit {formTitleByType[entityType].toLowerCase()}
          </h2>
        </div>
      ) : null}
      {children}
    </form>
  );
}
