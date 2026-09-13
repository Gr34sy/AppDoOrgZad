import { Tag } from "lucide-react";
import type { CSSProperties } from "react";

type TagListProps = {
  tags: string[];
  className?: string;
  limit?: number;
  showEmpty?: boolean;
  size?: "default" | "compact";
  tone?: "accent" | "current";
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
  accent: {
    empty: "text-zinc-500 dark:text-zinc-400",
    icon: "text-[var(--app-accent)]",
    tag: "border-[var(--app-accent)] text-[var(--app-accent)]"
  },
  current: {
    empty: "opacity-75",
    icon: "opacity-80",
    tag: "border-current text-current"
  }
};

const tagColorPalette = [
  {
    border: "#bae6fd",
    background: "#f0f9ff",
    color: "#0369a1",
    darkBorder: "rgba(14, 165, 233, 0.35)",
    darkBackground: "rgba(14, 165, 233, 0.12)",
    darkColor: "#bae6fd"
  },
  {
    border: "#bbf7d0",
    background: "#f0fdf4",
    color: "#15803d",
    darkBorder: "rgba(34, 197, 94, 0.35)",
    darkBackground: "rgba(34, 197, 94, 0.12)",
    darkColor: "#bbf7d0"
  },
  {
    border: "#fde68a",
    background: "#fffbeb",
    color: "#b45309",
    darkBorder: "rgba(245, 158, 11, 0.35)",
    darkBackground: "rgba(245, 158, 11, 0.12)",
    darkColor: "#fde68a"
  },
  {
    border: "#fbcfe8",
    background: "#fdf2f8",
    color: "#be185d",
    darkBorder: "rgba(236, 72, 153, 0.35)",
    darkBackground: "rgba(236, 72, 153, 0.12)",
    darkColor: "#fbcfe8"
  },
  {
    border: "#ddd6fe",
    background: "#f5f3ff",
    color: "#6d28d9",
    darkBorder: "rgba(139, 92, 246, 0.35)",
    darkBackground: "rgba(139, 92, 246, 0.12)",
    darkColor: "#ddd6fe"
  },
  {
    border: "#fecaca",
    background: "#fef2f2",
    color: "#b91c1c",
    darkBorder: "rgba(239, 68, 68, 0.35)",
    darkBackground: "rgba(239, 68, 68, 0.12)",
    darkColor: "#fecaca"
  }
];

function getTagColor(tag: string) {
  const hash = tag
    .trim()
    .toLowerCase()
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0);

  return tagColorPalette[hash % tagColorPalette.length];
}

export function TagList({
  tags,
  className = "",
  limit,
  showEmpty = false,
  size = "default",
  tone = "accent"
}: TagListProps) {
  const visibleTags = typeof limit === "number" ? tags.slice(0, limit) : tags;
  const styles = sizeStyles[size];
  const colors = toneStyles[tone];

  if (!visibleTags.length) {
    return showEmpty ? (
      <span className={`inline-flex items-center ${styles.empty} ${colors.empty} ${className}`}>
        <Tag aria-hidden="true" className={`${styles.icon} ${colors.icon}`} />
        No tags
      </span>
    ) : null;
  }

  return (
    <div className={`flex min-w-0 flex-wrap items-center ${styles.wrapper} ${className}`}>
      <Tag aria-hidden="true" className={`${styles.icon} shrink-0 ${colors.icon}`} />
      {visibleTags.map((tag) => {
        const tagColor = tone === "accent" ? getTagColor(tag) : null;

        return (
        <span
          key={tag}
          className={`inline-flex max-w-full items-center truncate border font-medium dark:[background-color:var(--app-tag-dark-background)] dark:[border-color:var(--app-tag-dark-border)] dark:[color:var(--app-tag-dark-color)] ${colors.tag} ${styles.tag}`}
          style={
            tagColor
              ? ({
                  borderColor: tagColor.border,
                  backgroundColor: tagColor.background,
                  color: tagColor.color,
                  "--app-tag-dark-border": tagColor.darkBorder,
                  "--app-tag-dark-background": tagColor.darkBackground,
                  "--app-tag-dark-color": tagColor.darkColor
                } as CSSProperties)
              : undefined
          }
        >
          {tag}
        </span>
        );
      })}
    </div>
  );
}
