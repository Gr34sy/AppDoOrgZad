import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ArrowLeft, StickyNote } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { NoteCreateForm } from "@/components/notes/note-create-form";
import { authOptions } from "@/lib/auth";

export default async function NewNotePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <AppShell>
      <section className="grid gap-6">
        <Link
          href="/dashboard/notes"
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to notes
        </Link>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
          <div className="grid gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-normal text-zinc-500 dark:text-zinc-400">
                New note
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-normal text-zinc-950 dark:text-zinc-50">
                Capture an idea
              </h1>
            </div>
            <NoteCreateForm />
          </div>

          <aside className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <StickyNote
              aria-hidden="true"
              className="h-8 w-8 text-[var(--app-accent)]"
              strokeWidth={2.25}
            />
            <h2 className="mt-4 text-base font-semibold text-zinc-950 dark:text-zinc-50">
              Notes stay lightweight
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Add a title, write the important details, then use color and tags to make it easy to
              find later.
            </p>
          </aside>
        </div>
      </section>
    </AppShell>
  );
}
