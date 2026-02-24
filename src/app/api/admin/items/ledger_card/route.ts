import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/db";
import { stockCards, inventoryTransactions, users } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const itemIdParam = searchParams.get("itemId") || searchParams.get("id");

  if (!itemIdParam) {
    return NextResponse.json([]);
  }

  const itemIds = itemIdParam
    .split(",")
    .map(Number)
    .filter((id) => !Number.isNaN(id));

  if (itemIds.length === 0) {
    return NextResponse.json([]);
  }

  const rows = await database
    .select({
      id: stockCards.id,
      itemId: stockCards.itemId,
      date: stockCards.createdAt,
      type: inventoryTransactions.type,
      inQty: stockCards.inQty,
      outQty: stockCards.outQty,
      quantity: inventoryTransactions.quantity,
      unitCost: inventoryTransactions.unitCost,
      totalCost: inventoryTransactions.totalCost,
      balanceQty: stockCards.balance,
      remarks: inventoryTransactions.remarks,
      performedBy: users.name,
    })
    .from(stockCards)
    .leftJoin(
      inventoryTransactions,
      eq(stockCards.transactionId, inventoryTransactions.id),
    )
    .leftJoin(users, eq(inventoryTransactions.userId, users.id))
    .where(
      itemIds.length === 1
        ? eq(stockCards.itemId, itemIds[0])
        : inArray(stockCards.itemId, itemIds),
    )
    .orderBy(stockCards.createdAt);

  return NextResponse.json(rows);
}
