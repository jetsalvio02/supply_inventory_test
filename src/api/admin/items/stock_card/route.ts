import { database } from "@/lib/db";
import { stockCards, inventoryTransactions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const itemId = Number(params.id);

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
      eq(stockCards.transactionId, inventoryTransactions.id),
    )
    .leftJoin(users, eq(inventoryTransactions.userId, users.id))
    .where(eq(stockCards.itemId, itemId))
    .orderBy(stockCards.createdAt);

  return NextResponse.json(data);
}
