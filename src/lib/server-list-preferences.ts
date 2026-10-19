import { connectDatabase } from "@/lib/mongoose";
import { UserPreference } from "@/models/user-preference";
import { resolveListSettings, type ListPreferenceScope } from "@/lib/list-preferences";
import type { SearchParams } from "@/lib/list-query";

export async function getListSettings(userId: string, scope: ListPreferenceScope, params?: SearchParams) {
  await connectDatabase();
  const preference = await UserPreference.findOne({ userId })
    .select({ listControls: 1 })
    .lean<{ listControls?: Record<string, unknown> }>();
  return resolveListSettings(scope, preference?.listControls?.[scope], params);
}
