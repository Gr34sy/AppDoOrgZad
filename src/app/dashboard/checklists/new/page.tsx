import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ChecklistForm } from "@/components/checklists/checklist-form";
import { AppShell } from "@/components/layout/app-shell";
import { authOptions } from "@/lib/auth";

export default async function NewChecklistPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <AppShell>
      <section className="app-page max-w-4xl">
        <div className="grid gap-3">
          <Link
            href="/dashboard/checklists"
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to checklists
          </Link>
          <div>
            <h1 className="app-page-title">
              New checklist
            </h1>
            <p className="app-page-description">
              Create a checklist and define the items to complete.
            </p>
          </div>
        </div>
        <ChecklistForm mode="create" />
      </section>
    </AppShell>
  );
}
