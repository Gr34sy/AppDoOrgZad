import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { FilterSelect } from "@/components/dashboard/filter-select";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
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
      <DashboardTabs />

      <h1>checklists</h1>
      <p>
        <Link href="/dashboard/checklists/new">add checklist</Link>
      </p>

      <form method="get">
        <SearchInput defaultValue={search} />
        <FilterSelect
          name="tag"
          defaultValue={tag}
          options={tagOptions}
          placeholder="all tags"
        />
        <SortSelect defaultValue={sort} options={defaultSortOptions} />
        <button type="submit">apply</button>
        <Link href="/dashboard/checklists">clear</Link>
      </form>

      <div>
        {checklists.map((checklist) => {
          const checklistId = String(checklist._id);

          return (
            <article key={checklistId}>
              <Link href={`/dashboard/checklists/${checklistId}`}>
                <h2>{checklist.title}</h2>
              </Link>
              {checklist.description ? <p>{checklist.description}</p> : null}
              <p>items: {checklist.items?.length ?? 0}</p>
              {checklist.tags?.length ? <p>{checklist.tags.join(", ")}</p> : null}
            </article>
          );
        })}
      </div>
    </AppShell>
  );
}
