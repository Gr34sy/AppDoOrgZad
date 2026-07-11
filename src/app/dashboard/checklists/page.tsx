import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { CheckSquare, ListChecks, Plus } from "lucide-react";
import { ListControls } from "@/components/dashboard/list-controls";
import { ObjectCard } from "@/components/dashboard/object-card";
import { AppShell } from "@/components/layout/app-shell";
import { authOptions } from "@/lib/auth";
import { escapeRegex, getListSort, getSearchParam } from "@/lib/list-query";
import { connectDatabase } from "@/lib/mongoose";
import { Checklist } from "@/models/checklist";

type ChecklistsPageProps = {
  searchParams?: {
    q?: string | string[];
    sort?: string | string[];
  };
};

type ListedChecklist = {
  _id: unknown;
  title: string;
};

export default async function ChecklistsPage({ searchParams }: ChecklistsPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const ownerId = session.user.id;
  const search = getSearchParam(searchParams?.q).trim();
  const sort = getSearchParam(searchParams?.sort) || "updated-desc";
  const query: Record<string, unknown> = {
    ownerId,
    archivedAt: null
  };

  if (search) {
    const searchRegex = new RegExp(escapeRegex(search), "i");
    query.title = searchRegex;
  }

  await connectDatabase();

  const checklists = await Checklist.find(query).sort(getListSort(sort)).lean<ListedChecklist[]>();

  return (
    <AppShell>
      <section className="app-page">
        <div className="app-page-header">
          <div className="app-page-heading">
            <h1 className="app-page-title">Checklists</h1>
            <p className="app-page-description">
              Build reusable lists and track completion item by item.
            </p>
          </div>
          <Link
            href="/dashboard/checklists/new"
            className="app-primary-action"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            New checklist
          </Link>
        </div>

        <ListControls
          entityType="checklists"
          searchValue={search}
          sortValue={sort}
          clearHref="/dashboard/checklists"
        />

        {checklists.length ? (
          <div className="app-card-grid">
            {checklists.map((checklist) => {
              const checklistId = String(checklist._id);

              return (
                <ObjectCard
                  key={checklistId}
                  href={`/dashboard/checklists/${checklistId}`}
                  title={checklist.title}
                  icon={ListChecks}
                  deleteEndpoint={`/api/checklists/${checklistId}`}
                />
              );
            })}
          </div>
        ) : (
          <div className="grid min-h-72 place-items-center rounded-md border border-dashed border-zinc-300 bg-white px-6 py-12 text-center dark:border-zinc-700 dark:bg-zinc-950">
            <div className="max-w-sm">
              <CheckSquare
                aria-hidden="true"
                className="mx-auto h-10 w-10 text-[var(--app-accent)]"
              />
              <h2 className="mt-4 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                No checklists found
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                Create a checklist or adjust the current filters.
              </p>
            </div>
          </div>
        )}
      </section>
    </AppShell>
  );
}
