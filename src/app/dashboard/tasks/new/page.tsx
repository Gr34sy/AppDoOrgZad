import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { TaskForm } from "@/components/tasks/task-form";
import { authOptions } from "@/lib/auth";
import { connectDatabase } from "@/lib/mongoose";
import { getSafeReturnTo } from "@/lib/return-to";
import { Checklist } from "@/models/checklist";
import { Note } from "@/models/note";
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
    returnTo?: string | string[];
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
  const [projects, checklists, notes] = await Promise.all([
    Project.find({ ownerId: session.user.id, archivedAt: null })
      .sort({ title: 1 })
      .lean<EntityOptionDocument[]>(),
    Checklist.find({ ownerId: session.user.id, archivedAt: null })
      .sort({ title: 1 })
      .lean<EntityOptionDocument[]>(),
    Note.find({ ownerId: session.user.id, archivedAt: null })
      .select({ title: 1 })
      .sort({ title: 1 })
      .lean<EntityOptionDocument[]>()
  ]);
  const initialProjectId = getSearchParam(searchParams?.projectId);
  const returnTo = getSafeReturnTo(searchParams?.returnTo, "/dashboard/tasks");

  return (
      <section className="app-page mx-auto max-w-4xl">
        <div className="grid gap-8">
          <Link
            href={returnTo}
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back
          </Link>
          <div className="app-page-header">
            <div className="app-page-heading">
              <h1 className="app-page-title">
                New task
              </h1>
              <p className="app-page-description">
                Create a task with priority, status and optional project links.
              </p>
            </div>
            <ClipboardList
              aria-hidden="true"
              className="hidden h-10 w-10 text-[var(--app-accent)] sm:block"
            />
          </div>
        </div>
        <div className="grid min-w-0 gap-6">
          <aside className="app-form-hint p-5">
            <ClipboardList
              aria-hidden="true"
              className="h-8 w-8 text-[var(--app-accent)]"
              strokeWidth={2.25}
            />
            <h2 className="mt-4 text-base font-semibold text-zinc-950 dark:text-zinc-50">
              Tasks turn plans into action
            </h2>
            <p className="mt-2">
              Add a title, set a priority and due date, then link a project or checklist when you need more context.
            </p>
          </aside>
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
            noteOptions={notes.map((note) => ({
              id: String(note._id),
              title: note.title
            }))}
            initialProjectId={initialProjectId}
            returnTo={returnTo}
          />
        </div>
      </section>
  );
}
