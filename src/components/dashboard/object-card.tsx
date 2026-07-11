import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { CardDeleteButton } from "@/components/dashboard/card-delete-button";
import { TagList } from "@/components/dashboard/tag-list";

type ObjectCardProps = {
  href: string;
  title: string;
  icon: LucideIcon;
  deleteEndpoint: string;
  description?: string;
  tags?: string[];
  status?: string;
  priority?: string;
};

function formatMeta(value: string) {
  return value.replace(/_/g, " ");
}

function getDescriptionPreview(description?: string) {
  const trimmedDescription = description?.trim();

  if (!trimmedDescription) {
    return "No description yet.";
  }

  return trimmedDescription.length > 30
    ? `${trimmedDescription.slice(0, 30)}...`
    : trimmedDescription;
}

export function ObjectCard({
  href,
  title,
  icon: Icon,
  deleteEndpoint,
  description,
  tags = [],
  status,
  priority
}: ObjectCardProps) {
  const hasMeta = Boolean(status || priority);

  return (
    <article className="group relative min-w-0 max-w-sm overflow-hidden rounded-md transition hover:-translate-y-0.5">
      <CardDeleteButton endpoint={deleteEndpoint} />
      <Link
        href={href}
        className="grid min-h-44 min-w-0 rounded-md border border-zinc-200 bg-white p-4 pr-12 shadow-sm transition hover:border-[var(--app-accent)] hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="flex min-w-0 items-start gap-3">
          <Icon
            aria-hidden="true"
            className="mt-0.5 h-5 w-5 shrink-0 text-[var(--app-accent)] opacity-80 transition group-hover:opacity-100"
          />
          <h2 className="min-w-0 flex-1 overflow-hidden break-words text-lg font-semibold tracking-normal text-zinc-950 dark:text-zinc-50">
            {title}
          </h2>
        </div>

        {hasMeta ? (
          <p className="mt-2 text-xs font-medium uppercase tracking-normal text-zinc-500 dark:text-zinc-400">
            {[status, priority].filter(Boolean).map((value) => formatMeta(String(value))).join(" / ")}
          </p>
        ) : null}

        <TagList tags={tags} className="mt-4" showEmpty />

        <p className="mt-4 min-w-0 break-words text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          {getDescriptionPreview(description)}
        </p>
      </Link>
    </article>
  );
}
