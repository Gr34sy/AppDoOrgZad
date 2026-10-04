import { Tag } from "lucide-react";

type TagListProps = {
  tags: string[];
  className?: string;
  limit?: number;
  showEmpty?: boolean;
  size?: "default" | "compact";
};

const sizeStyles = {
  default: {
    wrapper: "gap-2.5",
    icon: "h-[1.09375rem] w-[1.09375rem]",
    empty: "gap-2 text-[0.9375rem]",
    tag: "rounded-full px-[0.78125rem] py-[0.3125rem] text-[0.9375rem]"
  },
  compact: {
    wrapper: "gap-1.5",
    icon: "h-3.5 w-3.5",
    empty: "gap-1.5 text-xs",
    tag: "max-w-[7rem] rounded-md px-1.5 py-0.5 text-[0.6875rem] leading-4"
  }
};

const toneStyles = {
  empty: "text-zinc-500 dark:text-zinc-400",
  icon: "text-[var(--app-accent)]",
  tag: "border-[var(--app-accent)]/35 bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50"
};

export function TagList({
  tags,
  className = "",
  limit,
  showEmpty = false,
  size = "default"
}: TagListProps) {
  const visibleTags = typeof limit === "number" ? tags.slice(0, limit) : tags;
  const styles = sizeStyles[size];

  if (!visibleTags.length) {
    return showEmpty ? (
      <span className={`inline-flex items-center ${styles.empty} ${toneStyles.empty} ${className}`}>
        <Tag aria-hidden="true" className={`${styles.icon} ${toneStyles.icon}`} />
        No tags
      </span>
    ) : null;
  }

  return (
    <div className={`flex min-w-0 flex-wrap items-center ${styles.wrapper} ${className}`}>
      <Tag aria-hidden="true" className={`${styles.icon} shrink-0 ${toneStyles.icon}`} />
      {visibleTags.map((tag) => {
        return (
        <span
          key={tag}
          className={`inline-flex max-w-full items-center truncate border ${toneStyles.tag} ${styles.tag}`}
        >
          {tag}
        </span>
        );
      })}
    </div>
  );
}
