import { NextRequest } from "next/server";
import { z } from "zod";

export async function readJsonBody(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function parseJsonBody<TSchema extends z.ZodTypeAny>(
  request: NextRequest,
  schema: TSchema
) {
  const body = await readJsonBody(request);

  if (!body) {
    return {
      data: null,
      error: "Invalid JSON body"
    };
  }

  const result = schema.safeParse(body);

  if (!result.success) {
    return {
      data: null,
      error: result.error.issues[0]?.message ?? "Invalid request body"
    };
  }

  return {
    data: result.data as z.infer<TSchema>,
    error: null
  };
}
