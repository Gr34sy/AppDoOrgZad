export type SearchParams = Record<string, string | string[] | undefined>;

export const defaultSortOptions = [
  { label: "updated", value: "updated" },
  { label: "created", value: "created" },
  { label: "title", value: "title" },
  { label: "position", value: "position" }
];

export function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getListSort(sort: string, direction: string): Record<string, 1 | -1> {
  const order = direction === "asc" ? 1 : -1;

  switch (sort) {
    case "title":
      return { title: order };
    case "created":
      return { createdAt: order };
    case "position":
      return { position: order, updatedAt: -1 };
    case "updated":
    default:
      return { updatedAt: order };
  }
}
