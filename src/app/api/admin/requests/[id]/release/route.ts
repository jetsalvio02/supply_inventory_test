import { NextResponse, NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { database } from "@/lib/db";
import {
  risRequests,
  risRequestItems,
  inventorySummary,
  inventoryTransactions,
  stockCards,
  items,
} from "@/lib/db/schema";
import { broadcastRequestsUpdated } from "@/lib/realtime";
import { readAuthenticatedUserIdFromCookies } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await readAuthenticatedUserIdFromCookies();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const idParam = resolvedParams?.id;
    const requestId = Number(idParam);

    if (!idParam || !Number.isFinite(requestId)) {
      return NextResponse.json(
        { success: false, message: "Invalid request id" },
        { status: 400 }
      );
    }

    const [request] = await database
      .select({ id: risRequests.id })
      .from(risRequests)
      .where(eq(risRequests.id, requestId))
      .limit(1);

    if (!request) {
      return NextResponse.json(
        { success: false, message: "Request not found" },
        { status: 404 }
      );
    }

    const requestItems = await database
      .select({
        id: risRequestItems.id,
        itemId: risRequestItems.itemId,
        quantity: risRequestItems.quantity,
        stockNo: risRequestItems.stockNo,
        name: risRequestItems.name,
        description: risRequestItems.description,
      })
      .from(risRequestItems)
      .where(eq(risRequestItems.requestId, requestId));

    if (!requestItems.length) {
      return NextResponse.json(
        { success: false, message: "No items to release for this request" },
        { status: 400 }
      );
    }

    let processedCount = 0;

    for (const row of requestItems) {
      let itemId = row.itemId;
      const quantity = row.quantity;

      if (!Number.isFinite(quantity) || quantity <= 0) continue;

      if (!itemId) {
        const stockNoValue = row.stockNo ?? null;
        if (stockNoValue) {
          const [itemRow] = await database
            .select({ id: items.id })
            .from(items)
            .where(eq(items.stockNo, stockNoValue))
            .limit(1);

          if (itemRow) {
            itemId = itemRow.id;
          }
        }
      }

      if (!itemId) continue;

      const [summary] = await database
        .select({
          id: inventorySummary.id,
          totalOut: inventorySummary.totalOut,
          actualBalance: inventorySummary.actualBalance,
        })
        .from(inventorySummary)
        .where(eq(inventorySummary.itemId, itemId))
        .limit(1);

      if (!summary) continue;

      const currentBalance = summary.actualBalance ?? 0;
      const newBalance = currentBalance - quantity;

      const [txRow] = await database
        .insert(inventoryTransactions)
        .values({
          itemId,
          userId,
          type: "OUT",
          quantity,
          remarks: `RIS #${requestId}`,
        })
        .returning({ id: inventoryTransactions.id });

      await database.insert(stockCards).values({
        itemId,
        transactionId: txRow.id,
        inQty: 0,
        outQty: quantity,
        balance: newBalance,
      });

      await database
        .update(inventorySummary)
        .set({
          totalOut: (summary.totalOut ?? 0) + quantity,
          actualBalance: newBalance,
          updatedAt: new Date(),
        })
        .where(and(eq(inventorySummary.id, summary.id)));

      processedCount += 1;
    }

    if (processedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No inventory was updated for this request. Make sure the request items are linked to inventory items.",
        },
        { status: 400 }
      );
    }

    await broadcastRequestsUpdated();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message ?? "Failed to release items for request",
      },
      { status: 500 }
    );
  }
}
