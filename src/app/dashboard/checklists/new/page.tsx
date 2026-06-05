import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ChecklistForm } from "@/components/checklists/checklist-form";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
import { AppShell } from "@/components/layout/app-shell";
import { authOptions } from "@/lib/auth";

export default async function NewChecklistPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <AppShell>
      <DashboardTabs />
      <h1>new checklist</h1>
      <ChecklistForm mode="create" />
    </AppShell>
  );
}
