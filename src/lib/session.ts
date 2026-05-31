import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
export { sanitizeMutation } from "@/lib/sanitize-mutation";

export async function getCurrentUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

export function unauthorizedResponse() {
  return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
}

export function notFoundResponse() {
  return NextResponse.json({ message: "Not found" }, { status: 404 });
}
