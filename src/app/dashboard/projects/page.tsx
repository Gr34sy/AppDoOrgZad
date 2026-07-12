import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { FolderKanban, Plus } from "lucide-react";
import { ListControls } from "@/components/dashboard/list-controls";
import { ObjectCard } from "@/components/dashboard/object-card";
import { AppShell } from "@/components/layout/app-shell";
import { authOptions } from "@/lib/auth";
import { escapeRegex, getListSort, getSearchParam } from "@/lib/list-query";
import { connectDatabase } from "@/lib/mongoose";
import { Project } from "@/models/project";

type ProjectsPageProps = {
  searchParams?: {
    q?: string | string[];
    priority?: string | string[];
    sort?: string | string[];
    direction?: string | string[];
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

function getProjectSort(sort: string, direction: string): Record<string, 1 | -1> {
  const order = direction === "asc" ? 1 : -1;

  switch (sort) {
    case "due":
      return { dueDate: order, updatedAt: -1 };
    case "priority":
      return { priority: order, updatedAt: -1 };
    default:
      return getListSort(sort, direction);
  }
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const ownerId = session.user.id;
  const search = getSearchParam(searchParams?.q).trim();
  const priority = getSearchParam(searchParams?.priority).trim();
  const sort = getSearchParam(searchParams?.sort) || "updated";
  const direction = getSearchParam(searchParams?.direction) === "asc" ? "asc" : "desc";
  const query: Record<string, unknown> = {
    ownerId,
    archivedAt: null
  };

  if (search) {
    const searchRegex = new RegExp(escapeRegex(search), "i");
    query.$or = [{ title: searchRegex }, { description: searchRegex }, { tags: searchRegex }];
  }

  if (priority) {
    query.priority = priority;
  }

  await connectDatabase();
  const projects = await Project.find(query).sort(getProjectSort(sort, direction)).lean<ListedProject[]>();

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

        <ListControls
          entityType="projects"
          searchValue={search}
          filterValue={priority}
          sortValue={sort}
          sortDirection={direction}
          clearHref="/dashboard/projects"
        />

        {projects.length ? (
          <div className="app-card-grid">
            {projects.map((project) => {
              const projectId = String(project._id);

              return (
                <ObjectCard
                  key={projectId}
                  href={`/dashboard/projects/${projectId}`}
                  title={project.title}
                  icon={FolderKanban}
                  deleteEndpoint={`/api/projects/${projectId}`}
                  description={project.description}
                  tags={project.tags ?? []}
                  status={project.lifecycleStatus ?? "active"}
                  priority={project.priority ?? "medium"}
                />
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
