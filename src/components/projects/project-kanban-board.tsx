"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarClock, GripVertical, Plus } from "lucide-react";
import { DragEvent, useEffect, useMemo, useState } from "react";

type KanbanColumn = {
  id: string;
  title: string;
  color?: string;
  isDone: boolean;
};

type KanbanTask = {
  id: string;
  title: string;
  description: string;
  priority: string;
  statusId: string;
  dueDateLabel?: string;
  tags: string[];
};

type ProjectKanbanBoardProps = {
  projectId: string;
  columns: KanbanColumn[];
  tasks: KanbanTask[];
};

const priorityStyles: Record<string, string> = {
  low: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200",
  medium: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200",
  high: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-500/30 dark:bg-fuchsia-500/10 dark:text-fuchsia-200",
  urgent: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
};

function getColumnProgress(tasks: KanbanTask[], taskCount: number) {
  if (!taskCount) {
    return 0;
  }

  return Math.round((tasks.length / taskCount) * 100);
}

export function ProjectKanbanBoard({ projectId, columns, tasks }: ProjectKanbanBoardProps) {
  const router = useRouter();
  const [movingTaskId, setMovingTaskId] = useState("");
  const [draggedTaskId, setDraggedTaskId] = useState("");
  const [activeDropColumnId, setActiveDropColumnId] = useState("");
  const [boardTasks, setBoardTasks] = useState(tasks);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBoardTasks(tasks);
  }, [tasks]);

  const orderedColumns = useMemo(() => {
    const baseColumns = columns.length
      ? columns
      : [{ id: "todo", title: "To do", color: "#2563eb", isDone: false }];
    const knownColumnIds = new Set(baseColumns.map((column) => column.id));
    const extraColumns = Array.from(
      new Set(
        boardTasks
          .map((task) => task.statusId)
          .filter((statusId) => statusId && !knownColumnIds.has(statusId))
      )
    ).map((statusId) => ({
      id: statusId,
      title: statusId.replace(/_/g, " "),
      color: "#71717a",
      isDone: false
    }));

    return [...baseColumns, ...extraColumns];
  }, [boardTasks, columns]);
  const columnIds = useMemo(() => orderedColumns.map((column) => column.id), [orderedColumns]);
  const taskCount = boardTasks.length;

  async function moveTask(task: KanbanTask, nextStatusId: string) {
    if (task.statusId === nextStatusId) {
      return;
    }

    setError(null);
    setMovingTaskId(task.id);
    setBoardTasks((currentTasks) =>
      currentTasks.map((currentTask) =>
        currentTask.id === task.id ? { ...currentTask, statusId: nextStatusId } : currentTask
      )
    );

    const response = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        statusId: nextStatusId,
        projectId
      })
    });

    if (!response.ok) {
      setError("Could not move the task.");
      setBoardTasks(tasks);
      setMovingTaskId("");
      return;
    }

    setMovingTaskId("");
    router.refresh();
  }

  function handleDragStart(event: DragEvent<HTMLElement>, taskId: string) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", taskId);
    setDraggedTaskId(taskId);
  }

  function handleDragOver(event: DragEvent<HTMLElement>, columnId: string) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setActiveDropColumnId(columnId);
  }

  async function handleDrop(event: DragEvent<HTMLElement>, columnId: string) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/plain") || draggedTaskId;
    const task = boardTasks.find((currentTask) => currentTask.id === taskId);

    setDraggedTaskId("");
    setActiveDropColumnId("");

    if (!task) {
      return;
    }

    await moveTask(task, columnId);
  }

  return (
    <section className="grid gap-4 rounded-md border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-normal text-zinc-950 dark:text-zinc-50">
            Kanban board
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {taskCount} {taskCount === 1 ? "task" : "tasks"} across {orderedColumns.length} columns
          </p>
        </div>
        <Link
          href={`/dashboard/tasks/new?projectId=${projectId}`}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[var(--app-accent)] px-3 text-sm font-medium text-white transition hover:opacity-90 sm:w-auto"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          New task
        </Link>
      </div>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <div className="grid min-w-0 gap-3 overflow-x-auto pb-2 lg:grid-flow-col lg:auto-cols-[minmax(17rem,1fr)]">
        {orderedColumns.map((column, columnIndex) => {
          const columnTasks = boardTasks.filter((task) => task.statusId === column.id);
          const previousColumnId = columnIds[columnIndex - 1];
          const nextColumnId = columnIds[columnIndex + 1];
          const progress = getColumnProgress(columnTasks, taskCount);

          return (
            <section
              key={column.id}
              onDragOver={(event) => handleDragOver(event, column.id)}
              onDragLeave={() => setActiveDropColumnId("")}
              onDrop={(event) => handleDrop(event, column.id)}
              className={`grid min-h-72 min-w-0 content-start gap-3 rounded-md border bg-zinc-50 p-3 transition dark:bg-zinc-900/70 ${
                activeDropColumnId === column.id
                  ? "border-[var(--app-accent)] ring-2 ring-[var(--app-accent)]/15"
                  : "border-zinc-200 dark:border-zinc-800"
              }`}
            >
              <div className="grid gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: column.color ?? "var(--app-accent)" }}
                      />
                      <h3 className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                        {column.title}
                      </h3>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {columnTasks.length} {columnTasks.length === 1 ? "task" : "tasks"}
                    </p>
                  </div>
                  {column.isDone ? (
                    <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                      Done
                    </span>
                  ) : null}
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: column.color ?? "var(--app-accent)"
                    }}
                  />
                </div>
              </div>

              {columnTasks.length ? (
                <div className="grid gap-3">
                  {columnTasks.map((task) => (
                    <article
                      key={task.id}
                      draggable
                      onDragStart={(event) => handleDragStart(event, task.id)}
                      onDragEnd={() => {
                        setDraggedTaskId("");
                        setActiveDropColumnId("");
                      }}
                      className={`group grid cursor-grab gap-3 rounded-md border border-zinc-200 bg-white p-3 shadow-sm transition hover:border-[var(--app-accent)] active:cursor-grabbing dark:border-zinc-800 dark:bg-zinc-950 ${
                        draggedTaskId === task.id ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical
                          aria-hidden="true"
                          className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400"
                        />
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/dashboard/tasks/${task.id}`}
                            className="line-clamp-2 text-sm font-semibold text-zinc-950 transition hover:text-[var(--app-accent)] dark:text-zinc-50"
                          >
                            {task.title}
                          </Link>
                          {task.description ? (
                            <p className="mt-2 line-clamp-3 text-xs leading-5 text-zinc-600 dark:text-zinc-300">
                              {task.description}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-md border px-2 py-1 text-xs font-medium ${
                            priorityStyles[task.priority] ??
                            "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                          }`}
                        >
                          {task.priority}
                        </span>
                        {task.dueDateLabel ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                            <CalendarClock aria-hidden="true" className="h-3 w-3" />
                            {task.dueDateLabel}
                          </span>
                        ) : null}
                      </div>

                      {task.tags.length ? (
                        <div className="flex flex-wrap gap-1.5">
                          {task.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-zinc-200 px-2 py-0.5 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={!previousColumnId || movingTaskId === task.id}
                          onClick={() => previousColumnId && moveTask(task, previousColumnId)}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-zinc-300 px-2 text-xs font-medium text-zinc-700 transition hover:border-[var(--app-accent)] hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-45 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-[var(--app-accent)] dark:hover:text-white"
                        >
                          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
                          Back
                        </button>
                        <button
                          type="button"
                          disabled={!nextColumnId || movingTaskId === task.id}
                          onClick={() => nextColumnId && moveTask(task, nextColumnId)}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-zinc-300 px-2 text-xs font-medium text-zinc-700 transition hover:border-[var(--app-accent)] hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-45 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-[var(--app-accent)] dark:hover:text-white"
                        >
                          Next
                          <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="grid min-h-32 place-items-center rounded-md border border-dashed border-zinc-300 bg-white px-4 py-8 text-center dark:border-zinc-700 dark:bg-zinc-950">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">No tasks in this column.</p>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </section>
  );
}
