import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { NoteDetailsPanel } from "@/components/notes/note-details-panel";
import { authOptions } from "@/lib/auth";
import { connectDatabase } from "@/lib/mongoose";
import { Note } from "@/models/note";
import { Pin } from "@/models/pin";
import { Checklist } from "@/models/checklist";
import { Project } from "@/models/project";
import { Task } from "@/models/task";

type NotePageProps = {
  params: {
    noteId: string;
  };
};

type NoteDetails = {
  title: string;
  content?: string;
  tags?: string[];
  linkedItems?: Array<{ targetType: "note" | "checklist" | "task" | "project"; targetId: unknown }>;
  createdAt?: Date;
  updatedAt?: Date;
};

export default async function NotePage({ params }: NotePageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!isValidObjectId(params.noteId)) {
    notFound();
  }

  await connectDatabase();

  const [note, pin, notes, checklists, tasks, projects] = await Promise.all([
    Note.findOne({
      _id: params.noteId,
      ownerId: session.user.id,
      archivedAt: null
    }).lean<NoteDetails>(),
    Pin.findOne({
      ownerId: session.user.id,
      targetType: "note",
      targetId: params.noteId
    }).lean<{ _id: unknown }>(),
    Note.find({ ownerId: session.user.id, archivedAt: null, _id: { $ne: params.noteId } }).select({ title: 1 }).sort({ title: 1 }).lean<Array<{ _id: unknown; title: string }>>(),
    Checklist.find({ ownerId: session.user.id, archivedAt: null }).select({ title: 1 }).sort({ title: 1 }).lean<Array<{ _id: unknown; title: string }>>(),
    Task.find({ ownerId: session.user.id, archivedAt: null }).select({ title: 1 }).sort({ title: 1 }).lean<Array<{ _id: unknown; title: string }>>(),
    Project.find({ ownerId: session.user.id, archivedAt: null }).select({ title: 1 }).sort({ title: 1 }).lean<Array<{ _id: unknown; title: string }>>()
  ]);

  if (!note) {
    notFound();
  }

  const linkOptions = [
    ...notes.map((item) => ({ targetType: "note" as const, targetId: String(item._id), title: item.title, href: `/dashboard/notes/${String(item._id)}` })),
    ...checklists.map((item) => ({ targetType: "checklist" as const, targetId: String(item._id), title: item.title, href: `/dashboard/checklists/${String(item._id)}` })),
    ...tasks.map((item) => ({ targetType: "task" as const, targetId: String(item._id), title: item.title, href: `/dashboard/tasks/${String(item._id)}` })),
    ...projects.map((item) => ({ targetType: "project" as const, targetId: String(item._id), title: item.title, href: `/dashboard/projects/${String(item._id)}` }))
  ];

  return (
    <AppShell>
      <section className="app-page">
      <Link
        href="/dashboard/notes"
        className="inline-flex w-fit items-center gap-2 text-sm font-medium text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Back to notes
      </Link>

      <NoteDetailsPanel
        noteId={params.noteId}
        title={note.title}
        content={note.content ?? ""}
        tags={note.tags ?? []}
        linkedItems={(note.linkedItems ?? []).map((item) => ({ targetType: item.targetType, targetId: String(item.targetId) }))}
        linkOptions={linkOptions}
        createdAtLabel={note.createdAt?.toLocaleString("pl-PL")}
        updatedAtLabel={note.updatedAt?.toLocaleString("pl-PL")}
        pinId={pin ? String(pin._id) : undefined}
      />
      </section>
    </AppShell>
  );
}
