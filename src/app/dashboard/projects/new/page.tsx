import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ProjectForm } from "@/components/projects/project-form";
import { authOptions } from "@/lib/auth";
import { connectDatabase } from "@/lib/mongoose";
import { Checklist } from "@/models/checklist";

type EntityOptionDocument = {
  _id: unknown;
  title: string;
};

export default async function NewProjectPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectDatabase();
  const checklists = await Checklist.find({ ownerId: session.user.id, archivedAt: null })
    .sort({ title: 1 })
    .lean<EntityOptionDocument[]>();

  return (
    <AppShell>
      <section className="grid max-w-4xl gap-6">
        <div className="grid gap-3">
          <Link
            href="/dashboard/projects"
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to projects
          </Link>
          <div>
            <h1 className="text-3xl font-semibold tracking-normal text-zinc-950 dark:text-zinc-50">
              New project
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Create a project with priority, lifecycle status and linked checklists.
            </p>
          </div>
        </div>
        <ProjectForm
          mode="create"
          checklistOptions={checklists.map((checklist) => ({
            id: String(checklist._id),
            title: checklist.title
          }))}
        />
      </section>
    </AppShell>
  );
}
