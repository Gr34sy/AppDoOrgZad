import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
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
      <DashboardTabs />

      <p>
        <Link href="/dashboard/notes">back to notes</Link>
      </p>

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
