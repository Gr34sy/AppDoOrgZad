import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { FilterSelect } from "@/components/dashboard/filter-select";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
import { SearchInput } from "@/components/dashboard/search-input";
import { SortSelect } from "@/components/dashboard/sort-select";
import { authOptions } from "@/lib/auth";
import { defaultSortOptions, escapeRegex, getListSort, getSearchParam } from "@/lib/list-query";
import { connectDatabase } from "@/lib/mongoose";
import { Note } from "@/models/note";

type NotesPageProps = {
  searchParams?: {
    q?: string | string[];
    tag?: string | string[];
    sort?: string | string[];
  };
};

type ListedNote = {
  _id: unknown;
  title: string;
  content?: string;
  color?: string | null;
  tags?: string[];
};

export default async function NotesPage({ searchParams }: NotesPageProps) {
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
    query.$or = [{ title: searchRegex }, { content: searchRegex }, { tags: searchRegex }];
  }

  if (tag) {
    query.tags = tag;
  }

  await connectDatabase();

  const [notes, tags] = await Promise.all([
    Note.find(query).sort(getListSort(sort)).lean<ListedNote[]>(),
    Note.distinct("tags", { ownerId, archivedAt: null })
  ]);
  const tagOptions = tags.map((tagName) => ({ label: tagName, value: tagName }));

  return (
    <AppShell>
      <DashboardTabs />

      <h1>notes</h1>

      <p>
        <Link href="/dashboard/notes/new">add note</Link>
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
        <Link href="/dashboard/notes">clear</Link>
      </form>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
        {notes.map((note) => {
          const noteColor = note.color?.trim();
          const hasColor = Boolean(noteColor);
          const noteId = String(note._id);

          return (
            <Link
              key={noteId}
              href={`/dashboard/notes/${noteId}`}
              style={{
                display: "block",
                width: "160px",
                height: "160px",
                overflow: "hidden",
                backgroundColor: hasColor ? noteColor : "#ffffff",
                border: hasColor ? "1px solid transparent" : "1px solid #000000",
                color: "#000000",
                textDecoration: "none"
              }}
            >
              <h2>{note.title}</h2>
              {note.content ? <p>{note.content}</p> : null}
              {note.tags?.length ? <p>{note.tags.join(", ")}</p> : null}
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
