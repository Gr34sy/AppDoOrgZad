"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Columns3, List, Maximize2, Minimize2, Plus } from "lucide-react";
import { ProjectKanbanBoard } from "@/components/projects/project-kanban-board";
import { TagList } from "@/components/dashboard/tag-list";

type Column = { id: string; title: string; color?: string; isDone: boolean };
type Task = { id: string; title: string; description: string; priority: string; statusId: string; position: number; dueDateLabel?: string; tags: string[] };

export function ProjectTaskView({ projectId, initialView, columns, tasks, projectInformation }: {
  projectId: string;
  initialView: "kanban" | "list";
  columns: Column[];
  tasks: Task[];
  projectInformation: ReactNode;
}) {
  const [view, setView] = useState(initialView);
  const [expanded, setExpanded] = useState(false);
  const [savingView, setSavingView] = useState(false);
  const [error, setError] = useState("");

  async function changeView(nextView: "kanban" | "list") {
    if (nextView === view || savingView) return;
    const previousView = view;
    setView(nextView);
    setExpanded(false);
    setSavingView(true);
    setError("");
    const response = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskView: nextView })
    });
    setSavingView(false);
    if (!response.ok) {
      setView(previousView);
      setError("Could not save the task view.");
    }
  }

  return (
    <div className={expanded ? "fixed inset-0 z-50 overflow-auto bg-zinc-100 p-3 sm:p-5 dark:bg-zinc-900" : "contents"}>
      {!expanded ? projectInformation : null}
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-fit rounded-md border border-zinc-200 bg-white p-1 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <button type="button" disabled={savingView} onClick={() => void changeView("kanban")} className={`inline-flex h-9 items-center gap-2 rounded px-3 text-sm font-medium transition ${view === "kanban" ? "bg-[var(--app-accent)] text-white" : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"}`}>
            <Columns3 className="h-4 w-4" /> Kanban
          </button>
          <button type="button" disabled={savingView} onClick={() => void changeView("list")} className={`inline-flex h-9 items-center gap-2 rounded px-3 text-sm font-medium transition ${view === "list" ? "bg-[var(--app-accent)] text-white" : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"}`}>
            <List className="h-4 w-4" /> List
          </button>
        </div>
        {view === "kanban" ? (
          <button type="button" onClick={() => setExpanded((value) => !value)} className="app-form-secondary-button">
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            {expanded ? "Restore view" : "Expand kanban"}
          </button>
        ) : null}
      </div>
      {error ? <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">{error}</p> : null}
      {view === "kanban" ? <ProjectKanbanBoard projectId={projectId} columns={columns} tasks={tasks} /> : (
        <section className="grid gap-4 rounded-md border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between gap-3">
            <div><h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Task list</h2><p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{tasks.length} {tasks.length === 1 ? "task" : "tasks"}</p></div>
            <Link href={`/dashboard/tasks/new?projectId=${projectId}`} className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--app-accent)] px-3 text-sm font-medium text-white"><Plus className="h-4 w-4" /> New task</Link>
          </div>
          <div className="grid gap-2">
            {tasks.length ? tasks.map((task) => {
              const column = columns.find((item) => item.id === task.statusId);
              return <Link key={task.id} href={`/dashboard/tasks/${task.id}`} className="grid gap-3 rounded-md border border-zinc-200 p-3 transition hover:border-[var(--app-accent)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center dark:border-zinc-800">
                <div className="min-w-0"><h3 className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">{task.title}</h3>{task.description ? <p className="mt-1 line-clamp-1 text-sm text-zinc-500 dark:text-zinc-400">{task.description}</p> : null}<div className="mt-2"><TagList tags={task.tags} limit={4} /></div></div>
                <div className="flex flex-wrap items-center gap-2 text-xs"><span className="rounded-md bg-zinc-100 px-2 py-1 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">{task.priority}</span><span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-2 py-1 dark:border-zinc-700"><i className="h-2 w-2 rounded-full" style={{ backgroundColor: column?.color ?? "#71717a" }} />{column?.title ?? task.statusId}</span>{task.dueDateLabel ? <span className="text-zinc-500">{task.dueDateLabel}</span> : null}</div>
              </Link>;
            }) : <p className="rounded-md border border-dashed border-zinc-300 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700">No tasks in this project.</p>}
          </div>
        </section>
      )}
    </div>
  );
}
