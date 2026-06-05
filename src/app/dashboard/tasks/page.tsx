import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { FilterSelect } from "@/components/dashboard/filter-select";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
import { SearchInput } from "@/components/dashboard/search-input";
import { SortSelect } from "@/components/dashboard/sort-select";
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
      <DashboardTabs />

      <h1>tasks</h1>
      <p>
        <Link href="/dashboard/tasks/new">add task</Link>
      </p>

      <form method="get">
        <SearchInput defaultValue={search} />
        <FilterSelect
          name="priority"
          defaultValue={priority}
          options={priorityOptions}
          placeholder="all priorities"
        />
        <SortSelect defaultValue={sort} options={taskSortOptions} />
        <button type="submit">apply</button>
        <Link href="/dashboard/tasks">clear</Link>
      </form>

      <div>
        {tasks.map((task) => {
          const taskId = String(task._id);

          return (
            <article key={taskId}>
              <Link href={`/dashboard/tasks/${taskId}`}>
                <h2>{task.title}</h2>
              </Link>
              {task.description ? <p>{task.description}</p> : null}
              <p>priority: {task.priority}</p>
              <p>status: {task.statusId}</p>
              {task.dueDate ? <p>due: {task.dueDate.toLocaleString("pl-PL")}</p> : null}
              {task.tags?.length ? <p>{task.tags.join(", ")}</p> : null}
            </article>
          );
        })}
      </div>
    </AppShell>
  );
}
