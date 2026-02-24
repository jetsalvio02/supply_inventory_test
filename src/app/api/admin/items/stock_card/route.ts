import { database } from "@/lib/db";
import {
  stockCards,
  inventoryTransactions,
  users,
  departments,
} from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const idParam = searchParams.get("id");

  if (!idParam) {
    return NextResponse.json([]);
  }

  const itemIds = idParam
    .split(",")
    .map(Number)
    .filter((id) => !Number.isNaN(id));

  if (itemIds.length === 0) {
    return NextResponse.json([]);
  }

  const data = await database
    .select({
      id: stockCards.id,
      itemId: stockCards.itemId,
      date: stockCards.createdAt,
      type: inventoryTransactions.type,
      inQty: stockCards.inQty,
      outQty: stockCards.outQty,
      balance: stockCards.balance,
      remarks: inventoryTransactions.remarks,
      performedBy: users.name,
      department: departments.name,
    })
    .from(stockCards)
    .leftJoin(
      inventoryTransactions,
      eq(stockCards.transactionId, inventoryTransactions.id),
    )
    .leftJoin(users, eq(inventoryTransactions.userId, users.id))
    .leftJoin(departments, eq(users.departmentId, departments.id))
    .where(inArray(stockCards.itemId, itemIds))
    .orderBy(stockCards.createdAt);

  return NextResponse.json(data);
}
