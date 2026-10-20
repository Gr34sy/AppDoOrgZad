"use client";

import { formatPriority } from "@/lib/priority";
import { useState, type ReactNode } from "react";
import { Columns3, List, Maximize2, Minimize2, Plus } from "lucide-react";
import { ReturnToLink } from "@/components/dashboard/return-to-link";
import { ReorderableList } from "@/components/dashboard/reorderable-list";
import { TagList } from "@/components/dashboard/tag-list";
import { ProjectKanbanBoard } from "@/components/projects/project-kanban-board";

type ProjectTaskViewMode = "kanban" | "list";

type Column = {
  id: string;
  title: string;
  color?: string;
  isDone: boolean;
};

type Task = {
  id: string;
  title: string;
  description: string;
  priority: string;
  statusId: string;
  position: number;
  dueDateLabel?: string;
  tags: string[];
};

type ProjectTaskViewProps = {
  projectId: string;
  initialView: ProjectTaskViewMode;
  initialExpanded?: boolean;
  columns: Column[];
  tasks: Task[];
  projectInformation: ReactNode;
};

type ViewToggleProps = {
  view: ProjectTaskViewMode;
  savingView: boolean;
  onChange: (view: ProjectTaskViewMode) => void;
};

type ProjectTaskListProps = {
  projectId: string;
  columns: Column[];
  tasks: Task[];
};

function ViewToggle({ view, savingView, onChange }: ViewToggleProps) {
  return (
    <div className="inline-flex w-fit rounded-md border border-zinc-200 bg-white p-1 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <button
        type="button"
        disabled={savingView}
        onClick={() => onChange("kanban")}
        className={`inline-flex h-9 items-center gap-2 rounded px-3 text-sm font-medium transition ${
          view === "kanban"
            ? "bg-[var(--app-accent)] text-white"
            : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
        }`}
      >
        <Columns3 aria-hidden="true" className="h-4 w-4" />
        Kanban
      </button>
      <button
        type="button"
        disabled={savingView}
        onClick={() => onChange("list")}
        className={`inline-flex h-9 items-center gap-2 rounded px-3 text-sm font-medium transition ${
          view === "list"
            ? "bg-[var(--app-accent)] text-white"
            : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
        }`}
      >
        <List aria-hidden="true" className="h-4 w-4" />
        List
      </button>
    </div>
  );
}

function ExpandButton({
  expanded,
  savingView,
  onToggle
}: {
  expanded: boolean;
  savingView: boolean;
  onToggle: () => void;
}) {
  return (
    <button type="button" disabled={savingView} aria-expanded={expanded} onClick={onToggle} className="app-form-secondary-button">
      {expanded ? (
        <Minimize2 aria-hidden="true" className="h-4 w-4" />
      ) : (
        <Maximize2 aria-hidden="true" className="h-4 w-4" />
      )}
      {expanded ? "Restore view" : "Expand View"}
    </button>
  );
}

function ProjectTaskListItem({ task, column }: { task: Task; column?: Column }) {
  return (
    <ReturnToLink
      href={`/dashboard/tasks/${task.id}`}
      className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 rounded-md border border-zinc-200 bg-white p-3 transition hover:border-[var(--app-accent)] sm:pl-28 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex min-w-0 flex-auto flex-wrap items-center gap-x-3 gap-y-2">
        <h3 className="min-w-0 max-w-full break-words text-sm font-semibold text-zinc-950 [overflow-wrap:anywhere] dark:text-zinc-50">
          {task.title}
        </h3>
        {task.description ? (
          <p className="min-w-0 max-w-full break-words text-sm text-zinc-500 [overflow-wrap:anywhere] dark:text-zinc-400">
            {task.description}
          </p>
        ) : null}
        <TagList tags={task.tags} className="max-w-full" limit={4} size="compact" />
        {task.dueDateLabel ? (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{task.dueDateLabel}</span>
        ) : null}
      </div>
      <div className="ml-auto flex max-w-full shrink-0 flex-wrap items-center justify-end gap-2 text-xs">
        <span className="rounded-md bg-zinc-100 px-2 py-1 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          {formatPriority(task.priority)}
        </span>
        <span className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-md border border-zinc-200 px-2 py-1 [overflow-wrap:anywhere] dark:border-zinc-700">
          <i
            aria-hidden="true"
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: column?.color ?? "#71717a" }}
          />
          {column?.title ?? task.statusId}
        </span>
      </div>
    </ReturnToLink>
  );
}

function ProjectTaskList({ projectId, columns, tasks }: ProjectTaskListProps) {
  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            Task list
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
          </p>
        </div>
        <ReturnToLink
          href={`/dashboard/tasks/new?projectId=${projectId}`}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--app-accent)] px-3 text-sm font-medium text-white"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          New task
        </ReturnToLink>
      </div>

      {tasks.length ? (
        <ReorderableList
          entityType="task"
          className="grid gap-2"
          items={tasks.map((task, index) => {
            const column = columns.find((item) => item.id === task.statusId);

            return {
              id: task.id,
              position: task.position ?? index,
              content: <ProjectTaskListItem task={task} column={column} />
            };
          })}
        />
      ) : (
        <p className="rounded-md border border-dashed border-zinc-300 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
          No tasks in this project.
        </p>
      )}
    </section>
  );
}

export function ProjectTaskView({
  projectId,
  initialView,
  initialExpanded = false,
  columns,
  tasks,
  projectInformation
}: ProjectTaskViewProps) {
  const [view, setView] = useState<ProjectTaskViewMode>(initialView);
  const [expanded, setExpanded] = useState(initialExpanded);
  const [savingView, setSavingView] = useState(false);
  const [error, setError] = useState("");

  async function changeView(nextView: ProjectTaskViewMode, nextExpanded = expanded) {
    if ((nextView === view && nextExpanded === expanded) || savingView) {
      return;
    }

    const previousView = view;
    const previousExpanded = expanded;
    setView(nextView);
    setExpanded(nextExpanded);
    setSavingView(true);
    setError("");

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskView: nextView, taskViewExpanded: nextExpanded }),
        keepalive: true
      });
      if (!response.ok) throw new Error("Could not save the task view.");
    } catch {
      setView(previousView);
      setExpanded(previousExpanded);
      setError("Could not save the task view.");
    } finally {
      setSavingView(false);
    }
  }

  return (
    <div
      className={
        expanded
          ? "fixed inset-0 z-50 overflow-auto bg-zinc-100 p-3 sm:p-5 dark:bg-zinc-900"
          : "contents"
      }
    >
      {!expanded ? projectInformation : null}

      <div className={`grid gap-3 ${expanded ? "" : "mt-2"}`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <ViewToggle
            view={view}
            savingView={savingView}
            onChange={(nextView) => void changeView(nextView)}
          />
          <ExpandButton expanded={expanded} savingView={savingView} onToggle={() => void changeView(view, !expanded)} />
        </div>

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </p>
        ) : null}

        {view === "kanban" ? (
          <ProjectKanbanBoard projectId={projectId} columns={columns} tasks={tasks} />
        ) : (
          <ProjectTaskList projectId={projectId} columns={columns} tasks={tasks} />
        )}
      </div>
    </div>
  );
}
