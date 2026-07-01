import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { TaskForm } from "@/components/tasks/task-form";
import { authOptions } from "@/lib/auth";
import { connectDatabase } from "@/lib/mongoose";
import { Checklist } from "@/models/checklist";
import { Project } from "@/models/project";

type EntityOptionDocument = {
  _id: unknown;
  title: string;
  kanbanColumns?: Array<{
    id: string;
    title: string;
  }>;
};

type NewTaskPageProps = {
  searchParams?: {
    projectId?: string | string[];
  };
};

function getSearchParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function NewTaskPage({ searchParams }: NewTaskPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectDatabase();
  const [projects, checklists] = await Promise.all([
    Project.find({ ownerId: session.user.id, archivedAt: null })
      .sort({ title: 1 })
      .lean<EntityOptionDocument[]>(),
    Checklist.find({ ownerId: session.user.id, archivedAt: null })
      .sort({ title: 1 })
      .lean<EntityOptionDocument[]>()
  ]);
  const initialProjectId = getSearchParam(searchParams?.projectId);

  return (
    <AppShell>
      <section className="app-page max-w-4xl">
        <div className="grid gap-3">
          <Link
            href="/dashboard/tasks"
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to tasks
          </Link>
          <div>
            <h1 className="app-page-title">
              New task
            </h1>
            <p className="app-page-description">
              Create a task with priority, status and optional project links.
            </p>
          </div>
        </div>
        <TaskForm
          mode="create"
          projectOptions={projects.map((project) => ({
            id: String(project._id),
            title: project.title,
            kanbanColumns: (project.kanbanColumns ?? []).map((column) => ({
              id: column.id,
              title: column.title
            }))
          }))}
          checklistOptions={checklists.map((checklist) => ({
            id: String(checklist._id),
            title: checklist.title
          }))}
          initialProjectId={initialProjectId}
        />
      </section>
    </AppShell>
  );
}
