import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
import { AppShell } from "@/components/layout/app-shell";
import { authOptions } from "@/lib/auth";
import { connectDatabase } from "@/lib/mongoose";
import { Checklist } from "@/models/checklist";

type ListPageProps = {
  params: {
    listId: string;
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

export default async function ListPage({ params }: ListPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!isValidObjectId(params.listId)) {
    notFound();
  }

  await connectDatabase();

  const list = await Checklist.findOne({
    _id: params.listId,
    ownerId: session.user.id,
    archivedAt: null
  }).lean<ChecklistDetails>();

  if (!list) {
    notFound();
  }

  const items = [...(list.items ?? [])].sort((firstItem, secondItem) => {
    return (firstItem.position ?? 0) - (secondItem.position ?? 0);
  });

  return (
    <AppShell>
      <DashboardTabs />

      <p>
        <Link href="/dashboard/lists">back to lists</Link>
      </p>

      <article>
        <h1>{list.title}</h1>
        {list.description ? <p>{list.description}</p> : null}
        {list.tags?.length ? <p>{list.tags.join(", ")}</p> : null}
        {list.parentType ? <p>parent: {list.parentType}</p> : null}
        {list.createdAt ? <p>created: {list.createdAt.toLocaleString("pl-PL")}</p> : null}
        {list.updatedAt ? <p>updated: {list.updatedAt.toLocaleString("pl-PL")}</p> : null}

        <h2>items</h2>
        <ul>
          {items.map((item, index) => (
            <li key={`${item.title}-${index}`}>
              <input type="checkbox" checked={Boolean(item.isCompleted)} readOnly /> {item.title}
              {item.completedAt ? ` - completed: ${item.completedAt.toLocaleString("pl-PL")}` : ""}
            </li>
          ))}
        </ul>
      </article>
    </AppShell>
  );
}
