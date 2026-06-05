import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
import { AppShell } from "@/components/layout/app-shell";
import { ProjectForm } from "@/components/projects/project-form";
import { authOptions } from "@/lib/auth";
import { connectDatabase } from "@/lib/mongoose";
import { Checklist } from "@/models/checklist";

type EntityOptionDocument = {
  _id: unknown;
  title: string;
};

export default async function NewProjectPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectDatabase();
  const checklists = await Checklist.find({ ownerId: session.user.id, archivedAt: null })
    .sort({ title: 1 })
    .lean<EntityOptionDocument[]>();

  return (
    <AppShell>
      <DashboardTabs />
      <h1>new project</h1>
      <ProjectForm
        mode="create"
        checklistOptions={checklists.map((checklist) => ({
          id: String(checklist._id),
          title: checklist.title
        }))}
      />
    </AppShell>
  );
}
