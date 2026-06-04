import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
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
      <h1>Dodaj notatkę</h1>
      <NoteCreateForm />
    </AppShell>
  );
}
