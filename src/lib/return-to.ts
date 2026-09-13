export function getSafeReturnTo(value: string | string[] | undefined, fallback: string) {
  const returnTo = Array.isArray(value) ? value[0] : value;

  if (!returnTo || !returnTo.startsWith("/") || returnTo.startsWith("//")) {
    return fallback;
  }

  if (!returnTo.startsWith("/dashboard")) {
    return fallback;
  }

  return returnTo;
}
