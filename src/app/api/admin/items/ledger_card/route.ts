import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/db";
import { stockCards, inventoryTransactions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const itemIdParam = searchParams.get("itemId");
  const itemId = itemIdParam ? Number(itemIdParam) : NaN;

  if (!itemIdParam || Number.isNaN(itemId)) {
    return NextResponse.json([]);
  }

  const rows = await database
    .select({
      id: stockCards.id,
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
      eq(stockCards.transactionId, inventoryTransactions.id)
    )
    .leftJoin(users, eq(inventoryTransactions.userId, users.id))
    .where(eq(stockCards.itemId, itemId))
    .orderBy(stockCards.createdAt);

  return NextResponse.json(rows);
}

