export type SearchParams = Record<string, string | string[] | undefined>;

export const defaultSortOptions = [
  { label: "updated newest", value: "updated-desc" },
  { label: "updated oldest", value: "updated-asc" },
  { label: "created newest", value: "created-desc" },
  { label: "created oldest", value: "created-asc" },
  { label: "title A-Z", value: "title-asc" },
  { label: "position", value: "position-asc" }
];

export function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getListSort(sort: string): Record<string, 1 | -1> {
  switch (sort) {
    case "title-asc":
      return { title: 1 };
    case "created-asc":
      return { createdAt: 1 };
    case "created-desc":
      return { createdAt: -1 };
    case "updated-asc":
      return { updatedAt: 1 };
    case "position-asc":
      return { position: 1, updatedAt: -1 };
    case "updated-desc":
    default:
      return { updatedAt: -1 };
  }
}
