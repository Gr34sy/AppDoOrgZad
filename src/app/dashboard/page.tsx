import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PinnedBoard } from "@/components/dashboard/pinned-board";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <AppShell>
      <PinnedBoard />
    </AppShell>
  );
}
