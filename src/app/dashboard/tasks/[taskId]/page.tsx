import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
import { AppShell } from "@/components/layout/app-shell";
import { authOptions } from "@/lib/auth";
import { connectDatabase } from "@/lib/mongoose";
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

export default async function TaskPage({ params }: TaskPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!isValidObjectId(params.taskId)) {
    notFound();
  }

  await connectDatabase();

  const task = await Task.findOne({
    _id: params.taskId,
    ownerId: session.user.id,
    archivedAt: null
  }).lean<TaskDetails>();

  if (!task) {
    notFound();
  }

  return (
    <AppShell>
      <DashboardTabs />

      <p>
        <Link href="/dashboard/tasks">back to tasks</Link>
      </p>

      <article>
        <h1>{task.title}</h1>
        {task.description ? <p>{task.description}</p> : null}
        <p>priority: {task.priority}</p>
        <p>status: {task.statusId}</p>
        {task.projectId ? <p>projectId: {String(task.projectId)}</p> : null}
        {task.dueDate ? <p>due: {task.dueDate.toLocaleString("pl-PL")}</p> : null}
        {task.estimatedMinutes ? <p>estimated minutes: {task.estimatedMinutes}</p> : null}
        {task.tags?.length ? <p>{task.tags.join(", ")}</p> : null}
        {task.checklistIds?.length ? <p>checklists: {task.checklistIds.length}</p> : null}
        {task.completedAt ? <p>completed: {task.completedAt.toLocaleString("pl-PL")}</p> : null}
        {task.createdAt ? <p>created: {task.createdAt.toLocaleString("pl-PL")}</p> : null}
        {task.updatedAt ? <p>updated: {task.updatedAt.toLocaleString("pl-PL")}</p> : null}
      </article>
    </AppShell>
  );
}
