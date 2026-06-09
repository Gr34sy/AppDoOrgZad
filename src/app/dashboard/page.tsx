import { getServerSession } from "next-auth";
import { Types } from "mongoose";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PinnedBoard } from "@/components/dashboard/pinned-board";
import { authOptions } from "@/lib/auth";
import { connectDatabase } from "@/lib/mongoose";
import { Checklist } from "@/models/checklist";
import { Note } from "@/models/note";
import { Pin } from "@/models/pin";
import { Project } from "@/models/project";
import { Task } from "@/models/task";
import type { PinTargetType } from "@/types/domain";

type PinDocument = {
  _id: unknown;
  targetType: PinTargetType;
  targetId: unknown;
};

type PinnedTarget = {
  title: string;
  description?: string;
  content?: string;
  priority?: string;
  lifecycleStatus?: string;
  statusId?: string;
  dueDate?: Date | string | null;
  items?: unknown[];
};

type WorkflowTask = {
  _id: unknown;
  title: string;
  priority?: string;
  statusId?: string;
  dueDate?: Date | string | null;
};

const targetConfig: Record<PinTargetType, { hrefBase: string; label: string }> = {
  note: { hrefBase: "/dashboard/notes", label: "Note" },
  checklist: { hrefBase: "/dashboard/checklists", label: "Checklist" },
  task: { hrefBase: "/dashboard/tasks", label: "Task" },
  project: { hrefBase: "/dashboard/projects", label: "Project" }
};

async function findPinnedTarget(pin: PinDocument, ownerId: string) {
  const query = { _id: pin.targetId, ownerId, archivedAt: null };

  switch (pin.targetType) {
    case "note":
      return Note.findOne(query).lean<PinnedTarget>();
    case "checklist":
      return Checklist.findOne(query).lean<PinnedTarget>();
    case "task":
      return Task.findOne(query).lean<PinnedTarget>();
    case "project":
      return Project.findOne(query).lean<PinnedTarget>();
    default:
      return null;
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const ownerId = session.user.id;
  const ownerObjectId = new Types.ObjectId(ownerId);

  await connectDatabase();
  const now = new Date();
  const calendarStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const calendarEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [pins, taskStatusCounts, workflowTasks, calendarTasks, calendarProjects] = await Promise.all([
    Pin.find({ ownerId }).sort({ position: 1, updatedAt: -1 }).lean<PinDocument[]>(),
    Task.aggregate<{ _id: string; count: number }>([
      { $match: { ownerId: ownerObjectId, archivedAt: null } },
      { $group: { _id: "$statusId", count: { $sum: 1 } } }
    ]),
    Task.find({
      ownerId,
      archivedAt: null,
      statusId: { $in: ["todo", "in_progress", "done"] }
    })
      .sort({ updatedAt: -1 })
      .select({ title: 1, priority: 1, dueDate: 1, statusId: 1 })
      .lean<WorkflowTask[]>(),
    Task.find({
      ownerId,
      archivedAt: null,
      dueDate: { $gte: calendarStart, $lt: calendarEnd }
    })
      .sort({ dueDate: 1, priority: -1 })
      .select({ title: 1, priority: 1, dueDate: 1, statusId: 1 })
      .lean<Array<{ _id: unknown; title: string; priority?: string; dueDate?: Date | string; statusId?: string }>>(),
    Project.find({
      ownerId,
      archivedAt: null,
      dueDate: { $gte: calendarStart, $lt: calendarEnd }
    })
      .sort({ dueDate: 1, priority: -1 })
      .select({ title: 1, priority: 1, dueDate: 1, lifecycleStatus: 1 })
      .lean<
        Array<{
          _id: unknown;
          title: string;
          priority?: string;
          dueDate?: Date | string;
          lifecycleStatus?: string;
        }>
      >()
  ]);

  const pinnedItems = (
    await Promise.all(
      pins.map(async (pin) => {
        const target = await findPinnedTarget(pin, ownerId);

        if (!target) {
          return null;
        }

        const targetId = String(pin.targetId);
        const config = targetConfig[pin.targetType];
        const meta =
          target.description ??
          target.content ??
          (target.items ? `items: ${target.items.length}` : target.priority ?? "Pinned");

        return {
          id: String(pin._id),
          title: target.title,
          type: config.label,
          meta,
          status: target.lifecycleStatus ?? target.statusId ?? target.priority ?? "Pinned",
          href: `${config.hrefBase}/${targetId}`
        };
      })
    )
  ).filter((item) => item !== null);

  const workflowColumns = ["todo", "in_progress", "done"].map((status) => ({
    title: status,
    count: taskStatusCounts.find((taskStatus) => taskStatus._id === status)?.count ?? 0,
    items: workflowTasks
      .filter((task) => task.statusId === status)
      .slice(0, 5)
      .map((task) => ({
        id: String(task._id),
        title: task.title,
        priority: task.priority ?? "medium",
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : "",
        href: `/dashboard/tasks/${String(task._id)}`
      }))
  }));

  const calendarEvents = [
    ...calendarTasks.map((task) => ({
      id: String(task._id),
      title: task.title,
      type: "Task",
      date: task.dueDate ? new Date(task.dueDate).toISOString() : "",
      priority: task.priority ?? "medium",
      status: task.statusId ?? "todo",
      href: `/dashboard/tasks/${String(task._id)}`
    })),
    ...calendarProjects.map((project) => ({
      id: String(project._id),
      title: project.title,
      type: "Project",
      date: project.dueDate ? new Date(project.dueDate).toISOString() : "",
      priority: project.priority ?? "medium",
      status: project.lifecycleStatus ?? "active",
      href: `/dashboard/projects/${String(project._id)}`
    }))
  ].filter((event) => event.date);

  return (
    <AppShell>
      <PinnedBoard
        pinnedItems={pinnedItems}
        workflowColumns={workflowColumns}
        calendarEvents={calendarEvents}
      />
    </AppShell>
  );
}
