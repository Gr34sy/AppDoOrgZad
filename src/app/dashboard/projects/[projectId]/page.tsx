import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
import { AppShell } from "@/components/layout/app-shell";
import { ProjectDetailsPanel } from "@/components/projects/project-details-panel";
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
  estimatedMinutes?: number | null;
  tags?: string[];
  checklistIds?: unknown[];
  taskIds?: unknown[];
  kanbanColumns?: KanbanColumnDetails[];
  completedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

type EntityOptionDocument = {
  _id: unknown;
  title: string;
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

  const [project, checklists, taskCount, pin] = await Promise.all([
    Project.findOne({
      _id: params.projectId,
      ownerId: session.user.id,
      archivedAt: null
    }).lean<ProjectDetails>(),
    Checklist.find({ ownerId: session.user.id, archivedAt: null })
      .sort({ title: 1 })
      .lean<EntityOptionDocument[]>(),
    Task.countDocuments({
      ownerId: session.user.id,
      projectId: params.projectId,
      archivedAt: null
    }),
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
      <DashboardTabs />

      <p>
        <Link href="/dashboard/projects">back to projects</Link>
      </p>

      <ProjectDetailsPanel
        projectId={params.projectId}
        checklistOptions={checklists.map((checklist) => ({
          id: String(checklist._id),
          title: checklist.title
        }))}
        title={project.title}
        description={project.description ?? ""}
        priority={project.priority ?? "medium"}
        lifecycleStatus={project.lifecycleStatus ?? "active"}
        dueDate={getDateInputValue(project.dueDate)}
        dueDateLabel={project.dueDate?.toLocaleString("pl-PL")}
        estimatedMinutes={project.estimatedMinutes}
        tags={project.tags ?? []}
        checklistIds={(project.checklistIds ?? []).map((checklistId) => String(checklistId))}
        taskCount={taskCount}
        kanbanColumns={kanbanColumns.map((column) => ({
          id: column.id,
          title: column.title,
          isDone: Boolean(column.isDone)
        }))}
        completedAtLabel={project.completedAt?.toLocaleString("pl-PL")}
        createdAtLabel={project.createdAt?.toLocaleString("pl-PL")}
        updatedAtLabel={project.updatedAt?.toLocaleString("pl-PL")}
        pinId={pin ? String(pin._id) : undefined}
      />
    </AppShell>
  );
}
