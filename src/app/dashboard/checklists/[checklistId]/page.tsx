import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { ArrowLeft } from "lucide-react";
import { ChecklistDetailsPanel } from "@/components/checklists/checklist-details-panel";
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
      <section className="app-page">
        <Link
          href="/dashboard/checklists"
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to checklists
        </Link>

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
      </section>
    </AppShell>
  );
}
