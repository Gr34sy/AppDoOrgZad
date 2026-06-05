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
  const ownerObjectId = new Types.ObjectId(ownerId);

  await connectDatabase();
  const [pins, taskStatusCounts] = await Promise.all([
    Pin.find({ ownerId }).sort({ position: 1, updatedAt: -1 }).lean<PinDocument[]>(),
    Task.aggregate<{ _id: string; count: number }>([
      { $match: { ownerId: ownerObjectId, archivedAt: null } },
      { $group: { _id: "$statusId", count: { $sum: 1 } } }
    ])
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

  const workflowColumns = ["backlog", "todo", "in_progress", "testing", "done"].map((status) => ({
    title: status,
    count: taskStatusCounts.find((taskStatus) => taskStatus._id === status)?.count ?? 0
  }));

  return (
    <AppShell>
      <PinnedBoard pinnedItems={pinnedItems} workflowColumns={workflowColumns} />
    </AppShell>
  );
}
