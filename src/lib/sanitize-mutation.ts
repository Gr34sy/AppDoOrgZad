export function sanitizeMutation<T extends Record<string, unknown>>(payload: T) {
  const blockedFields = ["_id", "id", "ownerId", "createdAt", "updatedAt"] as const;
  const sanitizedPayload = { ...payload };

  for (const field of blockedFields) {
    delete sanitizedPayload[field];
  }

  return sanitizedPayload;
}
