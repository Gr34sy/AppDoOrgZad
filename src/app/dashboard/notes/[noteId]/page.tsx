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

type NotePageProps = {
  params: {
    noteId: string;
  };
};

type NoteDetails = {
  title: string;
  content?: string;
  color?: string | null;
  tags?: string[];
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

  const [note, pin] = await Promise.all([
    Note.findOne({
      _id: params.noteId,
      ownerId: session.user.id,
      archivedAt: null
    }).lean<NoteDetails>(),
    Pin.findOne({
      ownerId: session.user.id,
      targetType: "note",
      targetId: params.noteId
    }).lean<{ _id: unknown }>()
  ]);

  if (!note) {
    notFound();
  }

  return (
    <AppShell>
      <Link
        href="/dashboard/notes"
        className="mb-5 inline-flex w-fit items-center gap-2 text-sm font-medium text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Back to notes
      </Link>

      <NoteDetailsPanel
        noteId={params.noteId}
        title={note.title}
        content={note.content ?? ""}
        color={note.color ?? ""}
        tags={note.tags ?? []}
        createdAtLabel={note.createdAt?.toLocaleString("pl-PL")}
        updatedAtLabel={note.updatedAt?.toLocaleString("pl-PL")}
        pinId={pin ? String(pin._id) : undefined}
      />
    </AppShell>
  );
}
