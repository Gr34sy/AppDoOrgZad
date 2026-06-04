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
import { Project } from "@/models/project";

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
  taskIds?: unknown[];
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

  return (
    <AppShell>
      <DashboardTabs />

      <h1>projects</h1>

      <form method="get">
        <SearchInput defaultValue={search} />
        <FilterSelect
          name="lifecycleStatus"
          defaultValue={lifecycleStatus}
          options={lifecycleStatusOptions}
          placeholder="all statuses"
        />
        <SortSelect defaultValue={sort} options={projectSortOptions} />
        <button type="submit">apply</button>
        <Link href="/dashboard/projects">clear</Link>
      </form>

      <div>
        {projects.map((project) => {
          const projectId = String(project._id);

          return (
            <article key={projectId}>
              <Link href={`/dashboard/projects/${projectId}`}>
                <h2>{project.title}</h2>
              </Link>
              {project.description ? <p>{project.description}</p> : null}
              <p>status: {project.lifecycleStatus}</p>
              <p>priority: {project.priority}</p>
              {project.dueDate ? <p>due: {project.dueDate.toLocaleString("pl-PL")}</p> : null}
              <p>tasks: {project.taskIds?.length ?? 0}</p>
              {project.tags?.length ? <p>{project.tags.join(", ")}</p> : null}
            </article>
          );
        })}
      </div>
    </AppShell>
  );
}
