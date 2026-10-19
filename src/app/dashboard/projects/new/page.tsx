import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, FolderKanban } from "lucide-react";
import { ProjectForm } from "@/components/projects/project-form";
import { authOptions } from "@/lib/auth";
import { connectDatabase } from "@/lib/mongoose";
import { getSafeReturnTo } from "@/lib/return-to";
import { Checklist } from "@/models/checklist";
import { Note } from "@/models/note";

type EntityOptionDocument = {
  _id: unknown;
  title: string;
};

type NewProjectPageProps = {
  searchParams?: {
    returnTo?: string | string[];
  };
};

export default async function NewProjectPage({ searchParams }: NewProjectPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectDatabase();
  const [checklists, notes] = await Promise.all([
    Checklist.find({ ownerId: session.user.id, archivedAt: null })
      .sort({ title: 1 })
      .lean<EntityOptionDocument[]>(),
    Note.find({ ownerId: session.user.id, archivedAt: null })
      .select({ title: 1 })
      .sort({ title: 1 })
      .lean<EntityOptionDocument[]>()
  ]);
  const returnTo = getSafeReturnTo(searchParams?.returnTo, "/dashboard/projects");

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
                New project
              </h1>
              <p className="app-page-description">
                Create a project with priority, lifecycle status and linked checklists.
              </p>
            </div>
            <FolderKanban
              aria-hidden="true"
              className="hidden h-10 w-10 text-[var(--app-accent)] sm:block"
            />
          </div>
        </div>
        <div className="grid min-w-0 gap-6">
          <aside className="app-form-hint p-5">
            <FolderKanban
              aria-hidden="true"
              className="h-8 w-8 text-[var(--app-accent)]"
              strokeWidth={2.25}
            />
            <h2 className="mt-4 text-base font-semibold text-zinc-950 dark:text-zinc-50">
              Projects bring work together
            </h2>
            <p className="mt-2">
              Add a title, define your Kanban columns, then organize related tasks, checklists and notes in one place.
            </p>
          </aside>
          <ProjectForm
            mode="create"
            checklistOptions={checklists.map((checklist) => ({
              id: String(checklist._id),
              title: checklist.title
            }))}
            noteOptions={notes.map((note) => ({
              id: String(note._id),
              title: note.title
            }))}
            returnTo={returnTo}
          />
        </div>
      </section>
  );
}
