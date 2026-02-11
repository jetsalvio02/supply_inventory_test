import { database } from "@/lib/db";
import { stockCards, inventoryTransactions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const idParam = searchParams.get("id");
  const itemId = Number(idParam);

  if (!idParam || Number.isNaN(itemId)) {
    return NextResponse.json([]);
  }

  const data = await database
    .select({
      id: stockCards.id,
      date: stockCards.createdAt,
      type: inventoryTransactions.type,
      inQty: stockCards.inQty,
      outQty: stockCards.outQty,
      balance: stockCards.balance,
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

  return NextResponse.json(data);
}
