import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ListChecks } from "lucide-react";
import { ChecklistForm } from "@/components/checklists/checklist-form";
import { AppShell } from "@/components/layout/app-shell";
import { authOptions } from "@/lib/auth";
import { getSafeReturnTo } from "@/lib/return-to";

type NewChecklistPageProps = {
  searchParams?: {
    returnTo?: string | string[];
  };
};

export default async function NewChecklistPage({ searchParams }: NewChecklistPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const returnTo = getSafeReturnTo(searchParams?.returnTo, "/dashboard/checklists");

  return (
    <AppShell>
      <section className="app-page">
        <div className="grid gap-3">
          <Link
            href={returnTo}
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to checklists
          </Link>
          <div className="app-page-header">
            <div className="app-page-heading">
              <h1 className="app-page-title">
                New checklist
              </h1>
              <p className="app-page-description">
                Create a checklist and define the items to complete.
              </p>
            </div>
            <ListChecks
              aria-hidden="true"
              className="hidden h-10 w-10 text-[var(--app-accent)] sm:block"
            />
          </div>
        </div>
        <div className="w-full max-w-4xl">
          <ChecklistForm mode="create" returnTo={returnTo} />
        </div>
      </section>
    </AppShell>
  );
}
