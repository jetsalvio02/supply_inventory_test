import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { database } from "@/lib/db";
import { risRequests, risRequestItems } from "@/lib/db/schema";
import { broadcastRequestsUpdated } from "@/lib/realtime";
import { readAuthenticatedUserIdFromCookies } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await readAuthenticatedUserIdFromCookies();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const rows = await database
      .select({
        requestId: risRequests.id,
        createdAt: risRequests.createdAt,
        purpose: risRequests.purpose,
        itemId: risRequestItems.id,
        stockNo: risRequestItems.stockNo,
        unit: risRequestItems.unit,
        name: risRequestItems.name,
        description: risRequestItems.description,
        quantity: risRequestItems.quantity,
        remarks: risRequestItems.remarks,
      })
      .from(risRequests)
      .leftJoin(risRequestItems, eq(risRequestItems.requestId, risRequests.id))
      .where(eq(risRequests.userId, userId))
      .orderBy(desc(risRequests.createdAt));

    const map = new Map<
      number,
      {
        id: number;
        createdAt: string;
        purpose: string;
        items: {
          id: number;
          stockNo: string;
          unit: string;
          name: string;
          description: string;
          quantity: number;
          remarks: string;
        }[];
      }
    >();

    for (const row of rows) {
      const existing = map.get(row.requestId);
      const base = existing ?? {
        id: row.requestId,
        createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
        purpose: row.purpose ?? "",
        items: [],
      };

      if (row.itemId) {
        base.items.push({
          id: row.itemId,
          stockNo: row.stockNo ?? "",
          unit: row.unit ?? "",
          name: row.name ?? "",
          description: row.description ?? "",
          quantity: row.quantity ?? 0,
          remarks: row.remarks ?? "",
        });
      }

      if (!existing) {
        map.set(row.requestId, base);
      }
    }

    const normalized = Array.from(map.values());

    return NextResponse.json({ success: true, requests: normalized });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message ?? "Failed to load requests" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const userId = await readAuthenticatedUserIdFromCookies();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const purpose = String(body.purpose ?? "").trim();
    const itemsInput = Array.isArray(body.items) ? body.items : [];

    if (!itemsInput.length) {
      return NextResponse.json(
        { success: false, message: "No items to save" },
        { status: 400 }
      );
    }

    const [request] = await database
      .insert(risRequests)
      .values({
        userId,
        purpose: purpose || null,
      })
      .returning();

    const itemValues = itemsInput.map((item: any) => ({
      requestId: request.id,
      itemId: item.itemId ?? null,
      stockNo: item.stockNo ?? null,
      unit: item.unit ?? null,
      name: item.name ?? "",
      description: item.description ?? "",
      quantity: Number(item.quantity ?? 0) || 0,
      remarks: item.remarks ?? "",
    }));

    if (itemValues.length > 0) {
      await database.insert(risRequestItems).values(itemValues);
    }

    const responsePayload: {
      id: number;
      createdAt: string;
      purpose: string;
      items: {
        id: number;
        stockNo: string;
        unit: string;
        name: string;
        description: string;
        quantity: number;
        remarks: string;
      }[];
    } = {
      id: request.id,
      createdAt: (request.createdAt ?? new Date()).toISOString(),
      purpose: request.purpose ?? "",
      items: itemValues.map((i: any, index: number) => ({
        id: i.itemId ?? index + 1,
        stockNo: i.stockNo ?? "",
        unit: i.unit ?? "",
        name: i.name ?? "",
        description: i.description ?? "",
        quantity: i.quantity ?? 0,
        remarks: i.remarks ?? "",
      })),
    };

    await broadcastRequestsUpdated();

    return NextResponse.json(
      { success: true, request: responsePayload },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message ?? "Failed to save request" },
      { status: 500 }
    );
  }
}
