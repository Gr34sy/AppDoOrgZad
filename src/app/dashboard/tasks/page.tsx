import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { CheckCircle2, ClipboardList, Plus } from "lucide-react";
import { ListControls } from "@/components/dashboard/list-controls";
import { ObjectCard } from "@/components/dashboard/object-card";
import { AppShell } from "@/components/layout/app-shell";
import { authOptions } from "@/lib/auth";
import { escapeRegex, getListSort, getSearchParam } from "@/lib/list-query";
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

        <ListControls
          entityType="tasks"
          searchValue={search}
          filterValue={priority}
          sortValue={sort}
          clearHref="/dashboard/tasks"
        />

        {tasks.length ? (
          <div className="app-card-grid">
            {tasks.map((task) => {
              const taskId = String(task._id);

              return (
                <ObjectCard
                  key={taskId}
                  href={`/dashboard/tasks/${taskId}`}
                  title={task.title}
                  icon={ClipboardList}
                  deleteEndpoint={`/api/tasks/${taskId}`}
                  description={task.description}
                  tags={task.tags ?? []}
                  status={task.statusId ?? "todo"}
                  priority={task.priority ?? "medium"}
                />
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
