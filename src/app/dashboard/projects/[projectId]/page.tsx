import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ProjectDetailsPanel } from "@/components/projects/project-details-panel";
import { ProjectTaskView } from "@/components/projects/project-task-view";
import { authOptions } from "@/lib/auth";
import { connectDatabase } from "@/lib/mongoose";
import { Checklist } from "@/models/checklist";
import { Pin } from "@/models/pin";
import { Project } from "@/models/project";
import { Task } from "@/models/task";

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
  tags?: string[];
  checklistIds?: unknown[];
  taskIds?: unknown[];
  kanbanColumns?: KanbanColumnDetails[];
  taskView?: "kanban" | "list";
  completedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

type EntityOptionDocument = {
  _id: unknown;
  title: string;
  items?: Array<{
    title: string;
    isCompleted?: boolean;
  }>;
};

type ProjectTask = {
  _id: unknown;
  title: string;
  description?: string;
  priority?: string;
  statusId?: string;
  dueDate?: Date | null;
  tags?: string[];
  position?: number;
};

function getDateInputValue(date?: Date | null) {
  if (!date) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!isValidObjectId(params.projectId)) {
    notFound();
  }

  await connectDatabase();

  const [project, checklists, projectTasks, pin] = await Promise.all([
    Project.findOne({
      _id: params.projectId,
      ownerId: session.user.id,
      archivedAt: null
    }).lean<ProjectDetails>(),
    Checklist.find({ ownerId: session.user.id, archivedAt: null })
      .sort({ title: 1 })
      .lean<EntityOptionDocument[]>(),
    Task.find({
      ownerId: session.user.id,
      projectId: params.projectId,
      archivedAt: null
    })
      .sort({ statusId: 1, position: 1, updatedAt: -1 })
      .lean<ProjectTask[]>(),
    Pin.findOne({
      ownerId: session.user.id,
      targetType: "project",
      targetId: params.projectId
    }).lean<{ _id: unknown }>()
  ]);

  if (!project) {
    notFound();
  }

  const kanbanColumns = [...(project.kanbanColumns ?? [])].sort((firstColumn, secondColumn) => {
    return firstColumn.position - secondColumn.position;
  });

  return (
    <AppShell>
      <section className="app-page">
        <ProjectTaskView
          projectId={params.projectId}
          initialView={project.taskView ?? "kanban"}
          projectInformation={<><Link
            href="/dashboard/projects"
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to projects
          </Link><ProjectDetailsPanel
          projectId={params.projectId}
          checklistOptions={checklists.map((checklist) => ({
            id: String(checklist._id),
            title: checklist.title,
            items: (checklist.items ?? []).map((item) => ({
              title: item.title,
              isCompleted: Boolean(item.isCompleted)
            }))
          }))}
          title={project.title}
          description={project.description ?? ""}
          priority={project.priority ?? "medium"}
          lifecycleStatus={project.lifecycleStatus ?? "active"}
          dueDate={getDateInputValue(project.dueDate)}
          dueDateLabel={project.dueDate?.toLocaleString("pl-PL")}
          tags={project.tags ?? []}
          checklistIds={(project.checklistIds ?? []).map((checklistId) => String(checklistId))}
          taskCount={projectTasks.length}
          kanbanColumns={kanbanColumns.map((column) => ({
            id: column.id,
            title: column.title,
            color: column.color,
            isDone: Boolean(column.isDone)
          }))}
          completedAtLabel={project.completedAt?.toLocaleString("pl-PL")}
          createdAtLabel={project.createdAt?.toLocaleString("pl-PL")}
          updatedAtLabel={project.updatedAt?.toLocaleString("pl-PL")}
          pinId={pin ? String(pin._id) : undefined}
        /></>}
          columns={kanbanColumns.map((column) => ({
            id: column.id,
            title: column.title,
            color: column.color,
            isDone: Boolean(column.isDone)
          }))}
          tasks={projectTasks.map((task) => ({
            id: String(task._id),
            title: task.title,
            description: task.description ?? "",
            priority: task.priority ?? "medium",
            statusId: task.statusId ?? "todo",
            position: task.position ?? 0,
            dueDateLabel: task.dueDate?.toLocaleDateString("pl-PL"),
            tags: task.tags ?? []
          }))}
        />
      </section>
    </AppShell>
  );
}
