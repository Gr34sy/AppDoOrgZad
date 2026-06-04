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

type ListsPageProps = {
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

export default async function ListsPage({ searchParams }: ListsPageProps) {
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

  const [lists, tags] = await Promise.all([
    Checklist.find(query).sort(getListSort(sort)).lean<ListedChecklist[]>(),
    Checklist.distinct("tags", { ownerId, archivedAt: null })
  ]);
  const tagOptions = tags.map((tagName) => ({ label: tagName, value: tagName }));

  return (
    <AppShell>
      <DashboardTabs />

      <h1>lists</h1>

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
        <Link href="/dashboard/lists">clear</Link>
      </form>

      <div>
        {lists.map((list) => {
          const listId = String(list._id);

          return (
            <article key={listId}>
              <Link href={`/dashboard/lists/${listId}`}>
                <h2>{list.title}</h2>
              </Link>
              {list.description ? <p>{list.description}</p> : null}
              <p>items: {list.items?.length ?? 0}</p>
              {list.tags?.length ? <p>{list.tags.join(", ")}</p> : null}
            </article>
          );
        })}
      </div>
    </AppShell>
  );
}
