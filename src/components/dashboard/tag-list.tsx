import { Tag } from "lucide-react";

type TagListProps = {
  tags: string[];
  className?: string;
  limit?: number;
};

export function TagList({ tags, className = "", limit }: TagListProps) {
  const visibleTags = typeof limit === "number" ? tags.slice(0, limit) : tags;

  if (!visibleTags.length) {
    return null;
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <Tag aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-[var(--app-accent)]" />
      {visibleTags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center rounded-full border border-[var(--app-accent)] px-2.5 py-1 text-xs font-medium text-[var(--app-accent)]"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
