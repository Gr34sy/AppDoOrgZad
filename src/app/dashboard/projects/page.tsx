import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Types } from "mongoose";
import { CalendarClock, FolderKanban, Plus } from "lucide-react";
import { CardDeleteButton } from "@/components/dashboard/card-delete-button";
import { FilterSelect } from "@/components/dashboard/filter-select";
import { SearchInput } from "@/components/dashboard/search-input";
import { SortSelect } from "@/components/dashboard/sort-select";
import { TagList } from "@/components/dashboard/tag-list";
import { AppShell } from "@/components/layout/app-shell";
import { authOptions } from "@/lib/auth";
import { defaultSortOptions, escapeRegex, getListSort, getSearchParam } from "@/lib/list-query";
import { connectDatabase } from "@/lib/mongoose";
import { Project } from "@/models/project";
import { Task } from "@/models/task";

type ProjectsPageProps = {
  searchParams?: {
    q?: string | string[];
    lifecycleStatus?: string | string[];
    sort?: string | string[];
  };
};

type ListedProject = {
  _id: unknown;
  title: string;
  description?: string;
  priority?: string;
  lifecycleStatus?: string;
  dueDate?: Date | null;
  tags?: string[];
};

const lifecycleStatusOptions = [
  { label: "active", value: "active" },
  { label: "paused", value: "paused" },
  { label: "completed", value: "completed" },
  { label: "archived", value: "archived" }
];

const projectSortOptions = [
  ...defaultSortOptions,
  { label: "due date newest", value: "due-desc" },
  { label: "due date oldest", value: "due-asc" },
  { label: "priority", value: "priority-asc" }
];

function getProjectSort(sort: string): Record<string, 1 | -1> {
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

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const ownerId = session.user.id;
  const search = getSearchParam(searchParams?.q).trim();
  const lifecycleStatus = getSearchParam(searchParams?.lifecycleStatus).trim();
  const sort = getSearchParam(searchParams?.sort) || "updated-desc";
  const query: Record<string, unknown> = {
    ownerId,
    archivedAt: null
  };

  if (search) {
    const searchRegex = new RegExp(escapeRegex(search), "i");
    query.$or = [{ title: searchRegex }, { description: searchRegex }, { tags: searchRegex }];
  }

  if (lifecycleStatus) {
    query.lifecycleStatus = lifecycleStatus;
  }

  await connectDatabase();
  const projects = await Project.find(query).sort(getProjectSort(sort)).lean<ListedProject[]>();
  const projectTaskCounts = await Task.aggregate<{ _id: unknown; count: number }>([
    {
      $match: {
        ownerId: new Types.ObjectId(ownerId),
        archivedAt: null,
        projectId: { $ne: null }
      }
    },
    { $group: { _id: "$projectId", count: { $sum: 1 } } }
  ]);
  const taskCountByProjectId = new Map(
    projectTaskCounts.map((projectTaskCount) => [
      String(projectTaskCount._id),
      projectTaskCount.count
    ])
  );

  return (
    <AppShell>
      <section className="app-page">
        <div className="app-page-header">
          <div className="app-page-heading">
            <h1 className="app-page-title">Projects</h1>
            <p className="app-page-description">
              Organize larger work streams with status, priority and linked tasks.
            </p>
          </div>
          <Link
            href="/dashboard/projects/new"
            className="app-primary-action"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            New project
          </Link>
        </div>

        <form
          method="get"
          className="app-filter-form"
        >
          <SearchInput defaultValue={search} />
          <FilterSelect
            name="lifecycleStatus"
            defaultValue={lifecycleStatus}
            options={lifecycleStatusOptions}
            placeholder="all statuses"
          />
          <SortSelect defaultValue={sort} options={projectSortOptions} />
          <button
            type="submit"
            className="h-11 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Apply
          </button>
          <Link
            href="/dashboard/projects"
            className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition hover:border-[var(--app-accent)] hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-[var(--app-accent)] dark:hover:text-white"
          >
            Clear
          </Link>
        </form>

        {projects.length ? (
          <div className="app-card-grid">
            {projects.map((project) => {
              const projectId = String(project._id);
              const taskCount = taskCountByProjectId.get(projectId) ?? 0;

              return (
                <article
                  key={projectId}
                  className="group relative transition hover:-translate-y-0.5"
                >
                  <CardDeleteButton endpoint={`/api/projects/${projectId}`} />
                  <Link
                    href={`/dashboard/projects/${projectId}`}
                    className="grid min-h-56 grid-rows-[auto_1fr_auto] rounded-md border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-[var(--app-accent)] hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div className="flex items-start justify-between gap-3 pr-9">
                      <div>
                        <h2 className="line-clamp-2 text-lg font-semibold tracking-normal text-zinc-950 dark:text-zinc-50">
                          {project.title}
                        </h2>
                        <p className="mt-2 text-xs font-medium uppercase tracking-normal text-zinc-500 dark:text-zinc-400">
                          {project.lifecycleStatus ?? "active"} / {project.priority ?? "medium"}
                        </p>
                      </div>
                      <FolderKanban
                        aria-hidden="true"
                        className="h-5 w-5 shrink-0 text-[var(--app-accent)] opacity-70 transition group-hover:opacity-100"
                      />
                    </div>

                    {project.description ? (
                      <p className="mt-4 line-clamp-4 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                        {project.description}
                      </p>
                    ) : (
                      <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                        No description yet.
                      </p>
                    )}

                    <div className="mt-4 grid gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                      <span>{taskCount} {taskCount === 1 ? "task" : "tasks"}</span>
                      {project.dueDate ? (
                        <span className="inline-flex items-center gap-2">
                          <CalendarClock aria-hidden="true" className="h-3.5 w-3.5" />
                          {project.dueDate.toLocaleString("pl-PL")}
                        </span>
                      ) : null}
                      <TagList tags={project.tags ?? []} limit={3} />
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="grid min-h-72 place-items-center rounded-md border border-dashed border-zinc-300 bg-white px-6 py-12 text-center dark:border-zinc-700 dark:bg-zinc-950">
            <div className="max-w-sm">
              <FolderKanban
                aria-hidden="true"
                className="mx-auto h-10 w-10 text-[var(--app-accent)]"
              />
              <h2 className="mt-4 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                No projects found
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                Create a project or adjust the current filters.
              </p>
            </div>
          </div>
        )}
      </section>
    </AppShell>
  );
}
