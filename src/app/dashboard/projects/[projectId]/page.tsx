import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
import { AppShell } from "@/components/layout/app-shell";
import { authOptions } from "@/lib/auth";
import { connectDatabase } from "@/lib/mongoose";
import { Project } from "@/models/project";

type ProjectPageProps = {
  params: {
    projectId: string;
  };
};

type KanbanColumnDetails = {
  id: string;
  title: string;
  position: number;
  color?: string;
  isDone?: boolean;
};

type ProjectDetails = {
  title: string;
  description?: string;
  priority?: string;
  lifecycleStatus?: string;
  dueDate?: Date | null;
  estimatedMinutes?: number | null;
  tags?: string[];
  checklistIds?: unknown[];
  taskIds?: unknown[];
  kanbanColumns?: KanbanColumnDetails[];
  completedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!isValidObjectId(params.projectId)) {
    notFound();
  }

  await connectDatabase();

  const project = await Project.findOne({
    _id: params.projectId,
    ownerId: session.user.id,
    archivedAt: null
  }).lean<ProjectDetails>();

  if (!project) {
    notFound();
  }

  const kanbanColumns = [...(project.kanbanColumns ?? [])].sort((firstColumn, secondColumn) => {
    return firstColumn.position - secondColumn.position;
  });

  return (
    <AppShell>
      <DashboardTabs />

      <p>
        <Link href="/dashboard/projects">back to projects</Link>
      </p>

      <article>
        <h1>{project.title}</h1>
        {project.description ? <p>{project.description}</p> : null}
        <p>status: {project.lifecycleStatus}</p>
        <p>priority: {project.priority}</p>
        {project.dueDate ? <p>due: {project.dueDate.toLocaleString("pl-PL")}</p> : null}
        {project.estimatedMinutes ? <p>estimated minutes: {project.estimatedMinutes}</p> : null}
        {project.tags?.length ? <p>{project.tags.join(", ")}</p> : null}
        {project.taskIds?.length ? <p>tasks: {project.taskIds.length}</p> : null}
        {project.checklistIds?.length ? <p>lists: {project.checklistIds.length}</p> : null}
        {project.completedAt ? <p>completed: {project.completedAt.toLocaleString("pl-PL")}</p> : null}
        {project.createdAt ? <p>created: {project.createdAt.toLocaleString("pl-PL")}</p> : null}
        {project.updatedAt ? <p>updated: {project.updatedAt.toLocaleString("pl-PL")}</p> : null}

        <h2>kanban columns</h2>
        <ul>
          {kanbanColumns.map((column) => (
            <li key={column.id}>
              {column.title} - {column.id} - {column.isDone ? "done" : "open"}
            </li>
          ))}
        </ul>
      </article>
    </AppShell>
  );
}
