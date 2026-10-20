import { Pin } from "@/models/pin";
import type { PinTargetType } from "@/types/domain";

export async function withPinnedFilter(
  query: Record<string, unknown>,
  ownerId: string,
  targetType: PinTargetType,
  pinned: boolean
): Promise<Record<string, unknown>> {
  if (!pinned) return query;

  const targetIds = await Pin.distinct("targetId", { ownerId, targetType });
  // Preserve existing constraints, including filters that already restrict _id.
  return { $and: [query, { _id: { $in: targetIds } }] };
}
