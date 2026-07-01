import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { FileText, Plus, StickyNote, Tag } from "lucide-react";
import { FilterSelect } from "@/components/dashboard/filter-select";
import { AppShell } from "@/components/layout/app-shell";
import { SearchInput } from "@/components/dashboard/search-input";
import { SortSelect } from "@/components/dashboard/sort-select";
import { authOptions } from "@/lib/auth";
import { defaultSortOptions, escapeRegex, getListSort, getSearchParam } from "@/lib/list-query";
import { connectDatabase } from "@/lib/mongoose";
import { getNoteCardStyle } from "@/lib/note-colors";
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
      <section className="app-page">
        <div className="app-page-header">
          <div className="app-page-heading">
            <h1 className="app-page-title">Notes</h1>
          </div>
          <Link
            href="/dashboard/notes/new"
            className="app-primary-action"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            New note
          </Link>
        </div>

        <form
          method="get"
          className="app-filter-form"
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
            href="/dashboard/notes"
            className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition hover:border-[var(--app-accent)] hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-[var(--app-accent)] dark:hover:text-white"
          >
            Clear
          </Link>
        </form>

        {notes.length ? (
          <div className="app-card-grid">
            {notes.map((note) => {
              const noteId = String(note._id);
              const noteStyle = getNoteCardStyle(note.color);
              const preview = note.content?.trim();

              return (
                <Link
                  key={noteId}
                  href={`/dashboard/notes/${noteId}`}
                  className="group grid min-h-56 grid-rows-[auto_1fr_auto] overflow-hidden rounded-md border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  style={noteStyle}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="line-clamp-2 text-lg font-semibold tracking-normal">
                      {note.title}
                    </h2>
                    <StickyNote
                      aria-hidden="true"
                      className="h-5 w-5 shrink-0 opacity-60 transition group-hover:opacity-100"
                    />
                  </div>

                  {preview ? (
                    <p className="mt-3 line-clamp-5 text-sm leading-6 opacity-80">{preview}</p>
                  ) : (
                    <p className="mt-3 text-sm opacity-60">No content yet.</p>
                  )}

                  {note.tags?.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {note.tags.slice(0, 4).map((noteTag) => (
                        <span
                          key={noteTag}
                          className="inline-flex items-center gap-1 rounded-full border border-current px-2 py-1 text-xs font-medium opacity-70"
                        >
                          <Tag aria-hidden="true" className="h-3 w-3" />
                          {noteTag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="grid min-h-72 place-items-center rounded-md border border-dashed border-zinc-300 bg-white px-6 py-12 text-center dark:border-zinc-700 dark:bg-zinc-950">
            <div className="max-w-sm">
              <FileText
                aria-hidden="true"
                className="mx-auto h-10 w-10 text-[var(--app-accent)]"
              />
              <h2 className="mt-4 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                No notes found
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                Create a new note or adjust the current filters.
              </p>
            </div>
          </div>
        )}
      </section>
    </AppShell>
  );
}
