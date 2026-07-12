import { getServerSession } from "next-auth";
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
  items?: Array<{ title: string; isCompleted?: boolean }>;
  tags?: string[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

type DashboardMetricDocument = {
  _id: unknown;
  title: string;
  updatedAt?: Date | string;
  priority?: string;
  lifecycleStatus?: string;
  statusId?: string;
  items?: unknown[];
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

  await connectDatabase();
  const now = new Date();
  const calendarStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const calendarEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [
    pins,
    noteCount,
    checklistCount,
    taskCount,
    projectCount,
    recentNotes,
    recentChecklists,
    recentTasks,
    recentProjects,
    calendarTasks,
    calendarProjects
  ] = await Promise.all([
    Pin.find({ ownerId }).sort({ position: 1, updatedAt: -1 }).lean<PinDocument[]>(),
    Note.countDocuments({ ownerId, archivedAt: null }),
    Checklist.countDocuments({ ownerId, archivedAt: null }),
    Task.countDocuments({ ownerId, archivedAt: null }),
    Project.countDocuments({ ownerId, archivedAt: null }),
    Note.find({ ownerId, archivedAt: null })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select({ title: 1, updatedAt: 1 })
      .lean<DashboardMetricDocument[]>(),
    Checklist.find({ ownerId, archivedAt: null })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select({ title: 1, updatedAt: 1, items: 1 })
      .lean<DashboardMetricDocument[]>(),
    Task.find({ ownerId, archivedAt: null })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select({ title: 1, updatedAt: 1, priority: 1, statusId: 1 })
      .lean<DashboardMetricDocument[]>(),
    Project.find({ ownerId, archivedAt: null })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select({ title: 1, updatedAt: 1, priority: 1, lifecycleStatus: 1 })
      .lean<DashboardMetricDocument[]>(),
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
          description: target.description ?? target.content ?? "",
          type: config.label,
          meta,
          status: target.lifecycleStatus ?? target.statusId ?? target.priority ?? "Pinned",
          priority: target.priority,
          tags: target.tags ?? [],
          items: pin.targetType === "checklist" ? target.items ?? [] : undefined,
          createdAt: target.createdAt ? new Date(target.createdAt).toISOString() : "",
          updatedAt: target.updatedAt ? new Date(target.updatedAt).toISOString() : "",
          href: `${config.hrefBase}/${targetId}`
        };
      })
    )
  ).filter((item) => item !== null);

  const dashboardMetrics = [
    {
      title: "Notes",
      count: noteCount,
      colorKey: "notes" as const,
      items: recentNotes.map((note) => ({
        id: String(note._id),
        title: note.title,
        href: `/dashboard/notes/${String(note._id)}`,
        updatedAt: note.updatedAt ? new Date(note.updatedAt).toISOString() : "",
        meta: "Note"
      }))
    },
    {
      title: "Checklists",
      count: checklistCount,
      colorKey: "checklists" as const,
      items: recentChecklists.map((checklist) => ({
        id: String(checklist._id),
        title: checklist.title,
        href: `/dashboard/checklists/${String(checklist._id)}`,
        updatedAt: checklist.updatedAt ? new Date(checklist.updatedAt).toISOString() : "",
        meta: `${checklist.items?.length ?? 0} ${(checklist.items?.length ?? 0) === 1 ? "item" : "items"}`
      }))
    },
    {
      title: "Tasks",
      count: taskCount,
      colorKey: "tasks" as const,
      items: recentTasks.map((task) => ({
        id: String(task._id),
        title: task.title,
        href: `/dashboard/tasks/${String(task._id)}`,
        updatedAt: task.updatedAt ? new Date(task.updatedAt).toISOString() : "",
        meta: task.statusId ?? task.priority ?? "Task",
        priority: task.priority
      }))
    },
    {
      title: "Projects",
      count: projectCount,
      colorKey: "projects" as const,
      items: recentProjects.map((project) => ({
        id: String(project._id),
        title: project.title,
        href: `/dashboard/projects/${String(project._id)}`,
        updatedAt: project.updatedAt ? new Date(project.updatedAt).toISOString() : "",
        meta: project.lifecycleStatus ?? project.priority ?? "Project",
        priority: project.priority
      }))
    }
  ];

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
        dashboardMetrics={dashboardMetrics}
        calendarEvents={calendarEvents}
      />
    </AppShell>
  );
}
