import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { CheckSquare, ListChecks, Plus } from "lucide-react";
import { ListControls } from "@/components/dashboard/list-controls";
import { ObjectCard } from "@/components/dashboard/object-card";
import { ReorderableList } from "@/components/dashboard/reorderable-list";
import { ReturnToLink } from "@/components/dashboard/return-to-link";
import { AppShell } from "@/components/layout/app-shell";
import { authOptions } from "@/lib/auth";
import { escapeRegex, getListSort, getSearchParam } from "@/lib/list-query";
import { connectDatabase } from "@/lib/mongoose";
import { Checklist } from "@/models/checklist";

type ChecklistsPageProps = {
  searchParams?: {
    q?: string | string[];
    linked?: string | string[];
    sort?: string | string[];
    direction?: string | string[];
  };
};

type ListedChecklist = {
  _id: unknown;
  title: string;
  items?: Array<{ title: string; isCompleted?: boolean }>;
  position?: number;
};

export default async function ChecklistsPage({ searchParams }: ChecklistsPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const ownerId = session.user.id;
  const search = getSearchParam(searchParams?.q).trim();
  const linked = getSearchParam(searchParams?.linked).trim();
  const sort = getSearchParam(searchParams?.sort) || "position";
  const requestedDirection = getSearchParam(searchParams?.direction) === "desc" ? "desc" : "asc";
  const direction = sort === "position" ? "asc" : requestedDirection;
  const query: Record<string, unknown> = {
    ownerId,
    archivedAt: null
  };

  if (search) {
    const searchRegex = new RegExp(escapeRegex(search), "i");
    query.title = searchRegex;
  }

  if (linked === "linked" || linked === "project" || linked === "task") {
    query.parentType = linked === "linked" ? { $in: ["task", "project"] } : linked;
    query.parentId = { $exists: true, $ne: null };
  }

  await connectDatabase();

  const checklists = await Checklist.find(query).sort(getListSort(sort, direction)).lean<ListedChecklist[]>();
  const isReorderEnabled = sort === "position" && !search && !linked;

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
          <ListChecks
            aria-hidden="true"
            className="hidden h-10 w-10 text-[var(--app-accent)] sm:block"
          />
        </div>

        <ListControls
          entityType="checklists"
          searchValue={search}
          linkedValue={linked}
          sortValue={sort}
          sortDirection={direction}
          clearHref="/dashboard/checklists"
          action={
            <ReturnToLink href="/dashboard/checklists/new" className="app-primary-action">
              <Plus aria-hidden="true" className="h-4 w-4" />
              New checklist
            </ReturnToLink>
          }
        />

        {checklists.length ? (
          <ReorderableList
            entityType="checklist"
            className="app-card-grid"
            disabled={!isReorderEnabled}
            items={checklists.map((checklist, index) => {
              const checklistId = String(checklist._id);

              return {
                id: checklistId,
                position: checklist.position ?? index,
                content: (
                  <ObjectCard
                  key={checklistId}
                  href={`/dashboard/checklists/${checklistId}`}
                  title={checklist.title}
                  icon={ListChecks}
                  deleteEndpoint={`/api/checklists/${checklistId}`}
                  previewItems={checklist.items ?? []}
                />
                )
              };
            })}
          />
        ) : (
          <div className="grid min-h-72 place-items-center rounded-md bg-white px-6 py-12 text-center dark:bg-zinc-950">
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
