import { NextRequest } from "next/server";
import {
  addRealtimeClient,
  removeRealtimeClient,
} from "@/lib/realtime";

export async function GET(request: NextRequest) {
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  addRealtimeClient(writer);

  const encoder = new TextEncoder();
  await writer.write(encoder.encode("data: connected\n\n"));

  request.signal.addEventListener("abort", () => {
    removeRealtimeClient(writer);
    writer.close();
  });

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

