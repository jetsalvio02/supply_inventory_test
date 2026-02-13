import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { database } from "@/lib/db";
import { risRequests, risRequestItems, users } from "@/lib/db/schema";

export async function GET() {
  try {
    const rows = await database
      .select({
        requestId: risRequests.id,
        createdAt: risRequests.createdAt,
        purpose: risRequests.purpose,
        userName: users.name,
        itemId: risRequestItems.id,
        stockNo: risRequestItems.stockNo,
        unit: risRequestItems.unit,
        name: risRequestItems.name,
        description: risRequestItems.description,
        quantity: risRequestItems.quantity,
        remarks: risRequestItems.remarks,
      })
      .from(risRequests)
      .leftJoin(users, eq(risRequests.userId, users.id))
      .leftJoin(risRequestItems, eq(risRequestItems.requestId, risRequests.id))
      .orderBy(desc(risRequests.createdAt));

    const map = new Map<
      number,
      {
        id: number;
        createdAt: string;
        purpose: string;
        userName: string | null;
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
        userName: row.userName ?? null,
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

