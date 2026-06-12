import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { CheckSquare, ListChecks, Plus, Tag } from "lucide-react";
import { FilterSelect } from "@/components/dashboard/filter-select";
import { SearchInput } from "@/components/dashboard/search-input";
import { SortSelect } from "@/components/dashboard/sort-select";
import { AppShell } from "@/components/layout/app-shell";
import { authOptions } from "@/lib/auth";
import { defaultSortOptions, escapeRegex, getListSort, getSearchParam } from "@/lib/list-query";
import { connectDatabase } from "@/lib/mongoose";
import { Checklist } from "@/models/checklist";

type ChecklistsPageProps = {
  searchParams?: {
    q?: string | string[];
    tag?: string | string[];
    sort?: string | string[];
  };
};

type ListedChecklist = {
  _id: unknown;
  title: string;
  description?: string;
  tags?: string[];
  items?: unknown[];
};

export default async function ChecklistsPage({ searchParams }: ChecklistsPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const ownerId = session.user.id;
  const search = getSearchParam(searchParams?.q).trim();
  const tag = getSearchParam(searchParams?.tag).trim();
  const sort = getSearchParam(searchParams?.sort) || "updated-desc";
  const query: Record<string, unknown> = {
    ownerId,
    archivedAt: null
  };

  if (search) {
    const searchRegex = new RegExp(escapeRegex(search), "i");
    query.$or = [{ title: searchRegex }, { description: searchRegex }, { tags: searchRegex }];
  }

  if (tag) {
    query.tags = tag;
  }

  await connectDatabase();

  const [checklists, tags] = await Promise.all([
    Checklist.find(query).sort(getListSort(sort)).lean<ListedChecklist[]>(),
    Checklist.distinct("tags", { ownerId, archivedAt: null })
  ]);
  const tagOptions = tags.map((tagName) => ({ label: tagName, value: tagName }));

  return (
    <AppShell>
      <section className="grid gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal text-zinc-950 dark:text-zinc-50">
              Checklists
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Build reusable lists and track completion item by item.
            </p>
          </div>
          <Link
            href="/dashboard/checklists/new"
            className="inline-flex h-11 items-center gap-2 rounded-md bg-[var(--app-accent)] px-4 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            New checklist
          </Link>
        </div>

        <form
          method="get"
          className="grid gap-3 rounded-md border border-zinc-200 bg-white p-4 shadow-sm md:grid-cols-[minmax(18rem,1fr)_12rem_12rem_auto_auto] md:items-end dark:border-zinc-800 dark:bg-zinc-950"
        >
          <SearchInput defaultValue={search} />
          <FilterSelect
            name="tag"
            defaultValue={tag}
            options={tagOptions}
            placeholder="all tags"
          />
          <SortSelect defaultValue={sort} options={defaultSortOptions} />
          <button
            type="submit"
            className="h-11 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Apply
          </button>
          <Link
            href="/dashboard/checklists"
            className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition hover:border-[var(--app-accent)] hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-[var(--app-accent)] dark:hover:text-white"
          >
            Clear
          </Link>
        </form>

        {checklists.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {checklists.map((checklist) => {
              const checklistId = String(checklist._id);
              const itemCount = checklist.items?.length ?? 0;

              return (
                <Link
                  key={checklistId}
                  href={`/dashboard/checklists/${checklistId}`}
                  className="group grid min-h-52 grid-rows-[auto_1fr_auto] rounded-md border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--app-accent)] hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="line-clamp-2 text-lg font-semibold tracking-normal text-zinc-950 dark:text-zinc-50">
                        {checklist.title}
                      </h2>
                      <p className="mt-2 text-xs font-medium uppercase tracking-normal text-zinc-500 dark:text-zinc-400">
                        {itemCount} {itemCount === 1 ? "item" : "items"}
                      </p>
                    </div>
                    <ListChecks
                      aria-hidden="true"
                      className="h-5 w-5 shrink-0 text-[var(--app-accent)] opacity-70 transition group-hover:opacity-100"
                    />
                  </div>

                  {checklist.description ? (
                    <p className="mt-4 line-clamp-4 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                      {checklist.description}
                    </p>
                  ) : (
                    <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                      No description yet.
                    </p>
                  )}

                  {checklist.tags?.length ? (
                    <span className="mt-4 inline-flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                      <Tag aria-hidden="true" className="h-3.5 w-3.5" />
                      {checklist.tags.slice(0, 3).join(", ")}
                    </span>
                  ) : null}
                </Link>
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
