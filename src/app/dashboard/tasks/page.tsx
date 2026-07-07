import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { CalendarClock, CheckCircle2, ClipboardList, Plus } from "lucide-react";
import { FilterSelect } from "@/components/dashboard/filter-select";
import { SearchInput } from "@/components/dashboard/search-input";
import { SortSelect } from "@/components/dashboard/sort-select";
import { TagList } from "@/components/dashboard/tag-list";
import { AppShell } from "@/components/layout/app-shell";
import { authOptions } from "@/lib/auth";
import { defaultSortOptions, escapeRegex, getListSort, getSearchParam } from "@/lib/list-query";
import { connectDatabase } from "@/lib/mongoose";
import { Task } from "@/models/task";

type TasksPageProps = {
  searchParams?: {
    q?: string | string[];
    priority?: string | string[];
    sort?: string | string[];
  };
};

type ListedTask = {
  _id: unknown;
  title: string;
  description?: string;
  priority?: string;
  statusId?: string;
  dueDate?: Date | null;
  tags?: string[];
};

const priorityOptions = [
  { label: "low", value: "low" },
  { label: "medium", value: "medium" },
  { label: "high", value: "high" },
  { label: "urgent", value: "urgent" }
];

const taskSortOptions = [
  ...defaultSortOptions,
  { label: "due date newest", value: "due-desc" },
  { label: "due date oldest", value: "due-asc" },
  { label: "priority", value: "priority-asc" }
];

function getTaskSort(sort: string): Record<string, 1 | -1> {
  switch (sort) {
    case "due-desc":
      return { dueDate: -1, updatedAt: -1 };
    case "due-asc":
      return { dueDate: 1, updatedAt: -1 };
    case "priority-asc":
      return { priority: 1, updatedAt: -1 };
    default:
      return getListSort(sort);
  }
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const ownerId = session.user.id;
  const search = getSearchParam(searchParams?.q).trim();
  const priority = getSearchParam(searchParams?.priority).trim();
  const sort = getSearchParam(searchParams?.sort) || "updated-desc";
  const query: Record<string, unknown> = {
    ownerId,
    archivedAt: null
  };

  if (search) {
    const searchRegex = new RegExp(escapeRegex(search), "i");
    query.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { tags: searchRegex },
      { statusId: searchRegex }
    ];
  }

  if (priority) {
    query.priority = priority;
  }

  await connectDatabase();
  const tasks = await Task.find(query).sort(getTaskSort(sort)).lean<ListedTask[]>();

  return (
    <AppShell>
      <section className="app-page">
        <div className="app-page-header">
          <div className="app-page-heading">
            <h1 className="app-page-title">Tasks</h1>
            <p className="app-page-description">
              Track work items, priorities, due dates and progress.
            </p>
          </div>
          <Link
            href="/dashboard/tasks/new"
            className="app-primary-action"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            New task
          </Link>
        </div>

      <form
        method="get"
        className="app-filter-form"
      >
          <SearchInput defaultValue={search} />
        <FilterSelect
          name="priority"
          defaultValue={priority}
          options={priorityOptions}
          placeholder="all priorities"
        />
        <SortSelect defaultValue={sort} options={taskSortOptions} />
        <button
          type="submit"
          className="h-11 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          Apply
        </button>
        <Link
          href="/dashboard/tasks"
          className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition hover:border-[var(--app-accent)] hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-[var(--app-accent)] dark:hover:text-white"
        >
          Clear
        </Link>
      </form>

        {tasks.length ? (
          <div className="app-card-grid">
            {tasks.map((task) => {
              const taskId = String(task._id);

              return (
                <Link
                  key={taskId}
                  href={`/dashboard/tasks/${taskId}`}
                  className="group grid min-h-56 grid-rows-[auto_1fr_auto] rounded-md border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--app-accent)] hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="line-clamp-2 text-lg font-semibold tracking-normal text-zinc-950 dark:text-zinc-50">
                        {task.title}
                      </h2>
                      <p className="mt-2 text-xs font-medium uppercase tracking-normal text-zinc-500 dark:text-zinc-400">
                        {task.statusId ?? "todo"} / {task.priority ?? "medium"}
                      </p>
                    </div>
                    <ClipboardList
                      aria-hidden="true"
                      className="h-5 w-5 shrink-0 text-[var(--app-accent)] opacity-70 transition group-hover:opacity-100"
                    />
                  </div>

                  {task.description ? (
                    <p className="mt-4 line-clamp-4 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                      {task.description}
                    </p>
                  ) : (
                    <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                      No description yet.
                    </p>
                  )}

                  <div className="mt-4 grid gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    {task.dueDate ? (
                      <span className="inline-flex items-center gap-2">
                        <CalendarClock aria-hidden="true" className="h-3.5 w-3.5" />
                        {task.dueDate.toLocaleString("pl-PL")}
                      </span>
                    ) : null}
                    <TagList tags={task.tags ?? []} limit={3} />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="grid min-h-72 place-items-center rounded-md border border-dashed border-zinc-300 bg-white px-6 py-12 text-center dark:border-zinc-700 dark:bg-zinc-950">
            <div className="max-w-sm">
              <CheckCircle2
                aria-hidden="true"
                className="mx-auto h-10 w-10 text-[var(--app-accent)]"
              />
              <h2 className="mt-4 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                No tasks found
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                Add a task or adjust the current filters.
              </p>
            </div>
          </div>
        )}
      </section>
    </AppShell>
  );
}
