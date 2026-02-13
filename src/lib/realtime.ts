type RealtimeEvent = {
  type: string;
  payload?: any;
};

const encoder = new TextEncoder();

const clients = new Set<WritableStreamDefaultWriter<Uint8Array>>();

export function addRealtimeClient(
  writer: WritableStreamDefaultWriter<Uint8Array>
) {
  clients.add(writer);
}

export function removeRealtimeClient(
  writer: WritableStreamDefaultWriter<Uint8Array>
) {
  clients.delete(writer);
}

export async function broadcastRealtimeEvent(event: RealtimeEvent) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  const encoded = encoder.encode(data);

  for (const client of Array.from(clients)) {
    try {
      await client.write(encoded);
    } catch {
      clients.delete(client);
    }
  }
}

export function broadcastRequestsUpdated() {
  return broadcastRealtimeEvent({ type: "requests-updated" });
}

