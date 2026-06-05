import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
import { AppShell } from "@/components/layout/app-shell";
import { TaskDetailsPanel } from "@/components/tasks/task-details-panel";
import { authOptions } from "@/lib/auth";
import { connectDatabase } from "@/lib/mongoose";
import { Checklist } from "@/models/checklist";
import { Pin } from "@/models/pin";
import { Project } from "@/models/project";
import { Task } from "@/models/task";

type TaskPageProps = {
  params: {
    taskId: string;
  };
};

type TaskDetails = {
  title: string;
  description?: string;
  priority?: string;
  statusId?: string;
  projectId?: unknown;
  dueDate?: Date | null;
  estimatedMinutes?: number | null;
  tags?: string[];
  checklistIds?: unknown[];
  position?: number;
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

export default async function TaskPage({ params }: TaskPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!isValidObjectId(params.taskId)) {
    notFound();
  }

  await connectDatabase();

  const [task, projects, checklists, pin] = await Promise.all([
    Task.findOne({
      _id: params.taskId,
      ownerId: session.user.id,
      archivedAt: null
    }).lean<TaskDetails>(),
    Project.find({ ownerId: session.user.id, archivedAt: null })
      .sort({ title: 1 })
      .lean<EntityOptionDocument[]>(),
    Checklist.find({ ownerId: session.user.id, archivedAt: null })
      .sort({ title: 1 })
      .lean<EntityOptionDocument[]>(),
    Pin.findOne({
      ownerId: session.user.id,
      targetType: "task",
      targetId: params.taskId
    }).lean<{ _id: unknown }>()
  ]);

  if (!task) {
    notFound();
  }

  return (
    <AppShell>
      <DashboardTabs />

      <p>
        <Link href="/dashboard/tasks">back to tasks</Link>
      </p>

      <TaskDetailsPanel
        taskId={params.taskId}
        projectOptions={projects.map((project) => ({
          id: String(project._id),
          title: project.title
        }))}
        checklistOptions={checklists.map((checklist) => ({
          id: String(checklist._id),
          title: checklist.title
        }))}
        title={task.title}
        description={task.description ?? ""}
        priority={task.priority ?? "medium"}
        statusId={task.statusId ?? "todo"}
        projectId={task.projectId ? String(task.projectId) : ""}
        dueDate={getDateInputValue(task.dueDate)}
        dueDateLabel={task.dueDate?.toLocaleString("pl-PL")}
        estimatedMinutes={task.estimatedMinutes}
        tags={task.tags ?? []}
        checklistIds={(task.checklistIds ?? []).map((checklistId) => String(checklistId))}
        completedAtLabel={task.completedAt?.toLocaleString("pl-PL")}
        createdAtLabel={task.createdAt?.toLocaleString("pl-PL")}
        updatedAtLabel={task.updatedAt?.toLocaleString("pl-PL")}
        pinId={pin ? String(pin._id) : undefined}
      />
    </AppShell>
  );
}
