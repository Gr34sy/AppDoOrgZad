import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Archive } from "lucide-react";
import { ArchiveItemsSearch } from "@/components/dashboard/archive-items-search";
import { AppShell } from "@/components/layout/app-shell";
import { authOptions } from "@/lib/auth";
import { connectDatabase } from "@/lib/mongoose";
import { Checklist } from "@/models/checklist";
import { Note } from "@/models/note";
import { Project } from "@/models/project";
import { Task } from "@/models/task";
import type { EntityType } from "@/types/domain";

type ArchivedDocument = {
  _id: unknown;
  title: string;
  description?: string;
  content?: string;
  projectId?: unknown;
  parentType?: string | null;
  parentId?: unknown;
  linkedItems?: Array<{ targetType?: string }>;
  priority?: string;
  lifecycleStatus?: string;
  statusId?: string;
  items?: Array<{ title: string; isCompleted?: boolean }>;
  tags?: string[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
  archivedAt?: Date | string;
};

type RelationTarget = "project" | "task";

function createArchivedItems(
  type: EntityType,
  typeLabel: string,
  documents: ArchivedDocument[]
) {
  return documents.map((item) => {
    const relationTargets: RelationTarget[] = [];

    if (type === "task" && Boolean(item.projectId)) {
      relationTargets.push("project");
    }

    if (
      type === "checklist" &&
      Boolean(item.parentId) &&
      (item.parentType === "task" || item.parentType === "project")
    ) {
      relationTargets.push(item.parentType);
    }

    if (type === "note") {
      item.linkedItems?.forEach((linkedItem) => {
        if (linkedItem.targetType === "task" || linkedItem.targetType === "project") {
          relationTargets.push(linkedItem.targetType);
        }
      });
    }

    return {
      id: String(item._id),
      title: item.title,
      description: item.description ?? item.content ?? "",
      type,
      typeLabel,
      status: item.lifecycleStatus ?? item.statusId ?? item.priority ?? "Archived",
      priority: item.priority,
      tags: item.tags ?? [],
      items: type === "checklist" ? item.items ?? [] : undefined,
      canFilterRelation: type !== "project",
      relationTargets,
      createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : "",
      updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : "",
      archivedAt: item.archivedAt ? new Date(item.archivedAt).toISOString() : ""
    };
  });
}

export default async function ArchivePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const ownerId = session.user.id;

  await connectDatabase();
  const [notes, checklists, tasks, projects] = await Promise.all([
    Note.find({ ownerId, archivedAt: { $ne: null } })
      .sort({ archivedAt: -1, updatedAt: -1 })
      .lean<ArchivedDocument[]>(),
    Checklist.find({ ownerId, archivedAt: { $ne: null } })
      .sort({ archivedAt: -1, updatedAt: -1 })
      .lean<ArchivedDocument[]>(),
    Task.find({ ownerId, archivedAt: { $ne: null } })
      .sort({ archivedAt: -1, updatedAt: -1 })
      .lean<ArchivedDocument[]>(),
    Project.find({ ownerId, archivedAt: { $ne: null } })
      .sort({ archivedAt: -1, updatedAt: -1 })
      .lean<ArchivedDocument[]>()
  ]);

  const archivedItems = [
    ...createArchivedItems("note", "Note", notes),
    ...createArchivedItems("checklist", "Checklist", checklists),
    ...createArchivedItems("task", "Task", tasks),
    ...createArchivedItems("project", "Project", projects)
  ];

  return (
    <AppShell>
      <section className="app-page">
        <div className="app-page-header">
          <div className="app-page-heading">
            <h1 className="app-page-title">Archive</h1>
            <p className="app-page-description">
              Restore archived work or remove items permanently.
            </p>
          </div>
          <Archive
            aria-hidden="true"
            className="hidden h-10 w-10 text-[var(--app-accent)] sm:block"
          />
        </div>

        <ArchiveItemsSearch items={archivedItems} />
      </section>
    </AppShell>
  );
}
