import { NextRequest } from "next/server";
import { connectDatabase } from "@/lib/mongoose";
import { getCurrentUserId } from "@/lib/session";
import { ActivityEvent } from "@/models/activity-event";

export const dynamic = "force-dynamic";

function formatServerEvent(data: unknown) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function GET(request: NextRequest) {
  const ownerId = await getCurrentUserId();

  if (!ownerId) {
    return new Response("Unauthorized", { status: 401 });
  }

  await connectDatabase();

  const encoder = new TextEncoder();
  const initialSince = request.nextUrl.searchParams.get("since");
  let lastSeenAt = initialSince ? new Date(initialSince) : new Date(Date.now() - 5000);

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(formatServerEvent(data)));
      };

      const poll = async () => {
        const events = await ActivityEvent.find({
          ownerId,
          occurredAt: { $gt: lastSeenAt }
        })
          .sort({ occurredAt: 1 })
          .limit(50)
          .lean();

        for (const event of events) {
          send(event);
          lastSeenAt = event.occurredAt;
        }
      };

      send({ type: "connected", at: new Date().toISOString() });
      const interval = setInterval(() => {
        void poll();
      }, 2000);

      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream"
    }
  });
}
