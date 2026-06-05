import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
import { AppShell } from "@/components/layout/app-shell";
import { TaskForm } from "@/components/tasks/task-form";
import { authOptions } from "@/lib/auth";
import { connectDatabase } from "@/lib/mongoose";
import { Checklist } from "@/models/checklist";
import { Project } from "@/models/project";

type EntityOptionDocument = {
  _id: unknown;
  title: string;
};

export default async function NewTaskPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectDatabase();
  const [projects, checklists] = await Promise.all([
    Project.find({ ownerId: session.user.id, archivedAt: null })
      .sort({ title: 1 })
      .lean<EntityOptionDocument[]>(),
    Checklist.find({ ownerId: session.user.id, archivedAt: null })
      .sort({ title: 1 })
      .lean<EntityOptionDocument[]>()
  ]);

  return (
    <AppShell>
      <DashboardTabs />
      <h1>new task</h1>
      <TaskForm
        mode="create"
        projectOptions={projects.map((project) => ({
          id: String(project._id),
          title: project.title
        }))}
        checklistOptions={checklists.map((checklist) => ({
          id: String(checklist._id),
          title: checklist.title
        }))}
      />
    </AppShell>
  );
}
