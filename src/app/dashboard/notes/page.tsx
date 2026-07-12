import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { FileText, Plus, StickyNote } from "lucide-react";
import { ListControls } from "@/components/dashboard/list-controls";
import { ObjectCard } from "@/components/dashboard/object-card";
import { AppShell } from "@/components/layout/app-shell";
import { authOptions } from "@/lib/auth";
import { escapeRegex, getListSort, getSearchParam } from "@/lib/list-query";
import { connectDatabase } from "@/lib/mongoose";
import { Note } from "@/models/note";

type NotesPageProps = {
  searchParams?: {
    q?: string | string[];
    sort?: string | string[];
    direction?: string | string[];
  };
};

type ListedNote = {
  _id: unknown;
  title: string;
  content?: string;
  tags?: string[];
};

export default async function NotesPage({ searchParams }: NotesPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const ownerId = session.user.id;
  const search = getSearchParam(searchParams?.q).trim();
  const sort = getSearchParam(searchParams?.sort) || "updated";
  const direction = getSearchParam(searchParams?.direction) === "asc" ? "asc" : "desc";
  const query: Record<string, unknown> = {
    ownerId,
    archivedAt: null
  };

  if (search) {
    const searchRegex = new RegExp(escapeRegex(search), "i");
    query.$or = [{ title: searchRegex }, { content: searchRegex }, { tags: searchRegex }];
  }

  await connectDatabase();

  const notes = await Note.find(query).sort(getListSort(sort, direction)).lean<ListedNote[]>();

  return (
    <AppShell>
      <section className="app-page">
        <div className="app-page-header">
          <div className="app-page-heading">
            <h1 className="app-page-title">Notes</h1>
            <p className="app-page-description">
              Capture ideas, organize information and keep important details in one place.
            </p>
          </div>
          <Link
            href="/dashboard/notes/new"
            className="app-primary-action"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            New note
          </Link>
        </div>

        <ListControls
          entityType="notes"
          searchValue={search}
          sortValue={sort}
          sortDirection={direction}
          clearHref="/dashboard/notes"
        />

        {notes.length ? (
          <div className="app-card-grid">
            {notes.map((note) => {
              const noteId = String(note._id);

              return (
                <ObjectCard
                  key={noteId}
                  href={`/dashboard/notes/${noteId}`}
                  title={note.title}
                  icon={StickyNote}
                  deleteEndpoint={`/api/notes/${noteId}`}
                  description={note.content}
                  tags={note.tags ?? []}
                />
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
