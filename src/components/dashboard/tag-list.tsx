import { Tag } from "lucide-react";

type TagListProps = {
  tags: string[];
  className?: string;
  limit?: number;
  showEmpty?: boolean;
};

export function TagList({ tags, className = "", limit, showEmpty = false }: TagListProps) {
  const visibleTags = typeof limit === "number" ? tags.slice(0, limit) : tags;

  if (!visibleTags.length) {
    return showEmpty ? (
      <span className={`inline-flex items-center gap-2 text-[0.9375rem] text-zinc-500 dark:text-zinc-400 ${className}`}>
        <Tag aria-hidden="true" className="h-[1.09375rem] w-[1.09375rem] text-[var(--app-accent)]" />
        No tags
      </span>
    ) : null;
  }

  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      <Tag aria-hidden="true" className="h-[1.09375rem] w-[1.09375rem] shrink-0 text-[var(--app-accent)]" />
      {visibleTags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center rounded-full border border-[var(--app-accent)] px-[0.78125rem] py-[0.3125rem] text-[0.9375rem] font-medium text-[var(--app-accent)]"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
