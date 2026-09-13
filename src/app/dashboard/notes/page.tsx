import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Plus, StickyNote } from "lucide-react";
import { ListControls } from "@/components/dashboard/list-controls";
import { ObjectCard } from "@/components/dashboard/object-card";
import { ReorderableList } from "@/components/dashboard/reorderable-list";
import { ReturnToLink } from "@/components/dashboard/return-to-link";
import { AppShell } from "@/components/layout/app-shell";
import { authOptions } from "@/lib/auth";
import { escapeRegex, getListSort, getSearchParam } from "@/lib/list-query";
import { connectDatabase } from "@/lib/mongoose";
import { Note } from "@/models/note";

type NotesPageProps = {
  searchParams?: {
    q?: string | string[];
    linked?: string | string[];
    sort?: string | string[];
    direction?: string | string[];
  };
};

type ListedNote = {
  _id: unknown;
  title: string;
  content?: string;
  tags?: string[];
  position?: number;
};

function getNoteSort(sort: string, direction: string): Record<string, 1 | -1> {
  const order = direction === "asc" ? 1 : -1;

  if (sort === "description") {
    return { content: order };
  }

  return getListSort(sort, direction);
}

export default async function NotesPage({ searchParams }: NotesPageProps) {
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
    query.$or = [{ title: searchRegex }, { content: searchRegex }, { tags: searchRegex }];
  }

  if (linked === "linked" || linked === "project" || linked === "task") {
    query.linkedItems = {
      $elemMatch: {
        targetType: linked === "linked" ? { $in: ["task", "project"] } : linked
      }
    };
  }

  await connectDatabase();

  const notes = await Note.find(query).sort(getNoteSort(sort, direction)).lean<ListedNote[]>();
  const isReorderEnabled = sort === "position" && !search && !linked;

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
          <StickyNote
            aria-hidden="true"
            className="hidden h-10 w-10 text-[var(--app-accent)] sm:block"
          />
        </div>

        <ListControls
          entityType="notes"
          searchValue={search}
          linkedValue={linked}
          sortValue={sort}
          sortDirection={direction}
          clearHref="/dashboard/notes"
          action={
            <ReturnToLink href="/dashboard/notes/new" className="app-primary-action">
              <Plus aria-hidden="true" className="h-4 w-4" />
              New note
            </ReturnToLink>
          }
        />

        {notes.length ? (
          <ReorderableList
            entityType="note"
            className="app-card-grid"
            disabled={!isReorderEnabled}
            items={notes.map((note, index) => {
              const noteId = String(note._id);

              return {
                id: noteId,
                position: note.position ?? index,
                content: (
                  <ObjectCard
                  key={noteId}
                  href={`/dashboard/notes/${noteId}`}
                  title={note.title}
                  icon={StickyNote}
                  deleteEndpoint={`/api/notes/${noteId}`}
                  description={note.content}
                  tags={note.tags ?? []}
                />
                )
              };
            })}
          />
        ) : (
          <div className="grid min-h-72 place-items-center rounded-md bg-white px-6 py-12 text-center dark:bg-zinc-950">
            <div className="max-w-sm">
              <StickyNote
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
