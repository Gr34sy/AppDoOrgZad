export type SortDirection = "asc" | "desc";

export function matchesSearch(values: string[], normalizedQuery: string) {
  return !normalizedQuery || values.join(" ").toLowerCase().includes(normalizedQuery);
}

export function compareTextValues(
  firstValue: string,
  secondValue: string,
  direction: SortDirection
) {
  return firstValue.localeCompare(secondValue) * getDirectionModifier(direction);
}

export function compareNumberValues(
  firstValue: number,
  secondValue: number,
  direction: SortDirection
) {
  return (firstValue - secondValue) * getDirectionModifier(direction);
}

export function compareDateValues(
  firstValue: string,
  secondValue: string,
  direction: SortDirection
) {
  const firstTime = firstValue ? new Date(firstValue).getTime() : 0;
  const secondTime = secondValue ? new Date(secondValue).getTime() : 0;

  return compareNumberValues(firstTime, secondTime, direction);
}

function getDirectionModifier(direction: SortDirection) {
  return direction === "asc" ? 1 : -1;
}
