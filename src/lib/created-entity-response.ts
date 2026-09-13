type CreatedEntityPayload = Record<string, unknown>;

function readEntityId(entity: unknown) {
  if (!entity || typeof entity !== "object") {
    return "";
  }

  const record = entity as Record<string, unknown>;
  const id = record.id ?? record._id;

  if (typeof id === "string") {
    return id;
  }

  if (id && typeof id === "object" && typeof (id as { $oid?: unknown }).$oid === "string") {
    return (id as { $oid: string }).$oid;
  }

  return "";
}

export async function getCreatedEntityId(response: Response, entityKey: string) {
  const payload = await response.json().catch(() => null) as CreatedEntityPayload | null;

  if (!payload) {
    return "";
  }

  return readEntityId(payload[entityKey]);
}
