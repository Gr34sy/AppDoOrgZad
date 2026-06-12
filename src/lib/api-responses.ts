import { NextResponse } from "next/server";

export function badRequestResponse(message: string) {
  return NextResponse.json({ message }, { status: 400 });
}

export function tooManyRequestsResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { message: "Too many requests" },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds)
      }
    }
  );
}
