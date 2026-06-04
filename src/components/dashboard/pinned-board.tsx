import Link from "next/link";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";

const pinnedItems = [
  {
    title: "Product launch",
    type: "Project",
    meta: "Kanban: 12 tasks",
    status: "In progress"
  },
  {
    title: "Daily checklist",
    type: "Checklist",
    meta: "4 of 7 completed",
    status: "Today"
  },
  {
    title: "Meeting notes",
    type: "Note",
    meta: "Notebook page",
    status: "Pinned"
  },
  {
    title: "Prepare invoice flow",
    type: "Task",
    meta: "Priority: high",
    status: "Review"
  }
];

const workflowColumns = [
  { title: "Backlog", count: 4 },
  { title: "To do", count: 7 },
  { title: "In progress", count: 3 },
  { title: "Review", count: 2 },
  { title: "Done", count: 9 }
];

export function PinnedBoard() {
  return (
    <div className="grid gap-8">
      <DashboardTabs />

      <section className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600 dark:text-brand-100">Dashboard</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-normal">Pinned workspace</h1>
        </div>
        <Link
          href="/dashboard/notes/new"
          className="w-fit rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-500"
        >
          Add item
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {pinnedItems.map((item) => (
          <article
            key={item.title}
            className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                {item.type}
              </span>
              <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                {item.status}
              </span>
            </div>
            <h2 className="mt-4 text-lg font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{item.meta}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-5">
        {workflowColumns.map((column) => (
          <div
            key={column.title}
            className="min-h-48 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">{column.title}</h2>
              <span className="text-xs text-zinc-500">{column.count}</span>
            </div>
            <div className="mt-4 rounded-md border border-dashed border-zinc-300 p-3 text-sm text-zinc-500 dark:border-zinc-700">
              Project tasks will be grouped here by status.
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
