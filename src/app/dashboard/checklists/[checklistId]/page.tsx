import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { ChecklistDetailsPanel } from "@/components/checklists/checklist-details-panel";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
import { AppShell } from "@/components/layout/app-shell";
import { authOptions } from "@/lib/auth";
import { connectDatabase } from "@/lib/mongoose";
import { Checklist } from "@/models/checklist";
import { Pin } from "@/models/pin";

type ChecklistPageProps = {
  params: {
    checklistId: string;
  };
};

type ChecklistItemDetails = {
  title: string;
  isCompleted?: boolean;
  completedAt?: Date | null;
  position?: number;
};

type ChecklistDetails = {
  title: string;
  description?: string;
  tags?: string[];
  items?: ChecklistItemDetails[];
  parentType?: string | null;
  parentId?: unknown;
  createdAt?: Date;
  updatedAt?: Date;
};

export default async function ChecklistPage({ params }: ChecklistPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!isValidObjectId(params.checklistId)) {
    notFound();
  }

  await connectDatabase();

  const [checklist, pin] = await Promise.all([
    Checklist.findOne({
      _id: params.checklistId,
      ownerId: session.user.id,
      archivedAt: null
    }).lean<ChecklistDetails>(),
    Pin.findOne({
      ownerId: session.user.id,
      targetType: "checklist",
      targetId: params.checklistId
    }).lean<{ _id: unknown }>()
  ]);

  if (!checklist) {
    notFound();
  }

  const items = [...(checklist.items ?? [])].sort((firstItem, secondItem) => {
    return (firstItem.position ?? 0) - (secondItem.position ?? 0);
  });

  return (
    <AppShell>
      <DashboardTabs />

      <p>
        <Link href="/dashboard/checklists">back to checklists</Link>
      </p>

      <ChecklistDetailsPanel
        checklistId={params.checklistId}
        title={checklist.title}
        description={checklist.description ?? ""}
        tags={checklist.tags ?? []}
        items={items.map((item) => ({
          title: item.title,
          isCompleted: Boolean(item.isCompleted)
        }))}
        parentType={checklist.parentType}
        createdAtLabel={checklist.createdAt?.toLocaleString("pl-PL")}
        updatedAtLabel={checklist.updatedAt?.toLocaleString("pl-PL")}
        pinId={pin ? String(pin._id) : undefined}
      />
    </AppShell>
  );
}
