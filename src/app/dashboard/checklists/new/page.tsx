import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ListChecks } from "lucide-react";
import { ChecklistForm } from "@/components/checklists/checklist-form";
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
        <div className="grid min-w-0 gap-6">
          <aside className="app-form-hint p-5">
            <ListChecks
              aria-hidden="true"
              className="h-8 w-8 text-[var(--app-accent)]"
              strokeWidth={2.25}
            />
            <h2 className="mt-4 text-base font-semibold text-zinc-950 dark:text-zinc-50">
              Checklists keep things clear
            </h2>
            <p className="mt-2">
              Add a title, list the steps or items, then check them off as you go.
            </p>
          </aside>
          <ChecklistForm mode="create" returnTo={returnTo} />
        </div>
      </section>
  );
}
