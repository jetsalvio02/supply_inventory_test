import { NextRequest, NextResponse } from "next/server";
import { and, eq, gte, lt } from "drizzle-orm";
import { database } from "@/lib/db";
import {
  items,
  inventorySummary,
  inventoryTransactions,
} from "@/lib/db/schema";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const year = yearParam ? Number(yearParam) : new Date().getFullYear();

  if (Number.isNaN(year)) {
    return NextResponse.json(
      { success: false, message: "Invalid year parameter" },
      { status: 400 },
    );
  }

  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  const baseRows = await database
    .select({
      id: items.id,
      name: items.name,
      description: items.description,
      beginningStock: inventorySummary.beginningStock,
      forwardedBalance: inventorySummary.forwardedBalance,
      totalIn: inventorySummary.totalIn,
      totalOut: inventorySummary.totalOut,
      actualBalance: inventorySummary.actualBalance,
    })
    .from(items)
    .leftJoin(inventorySummary, eq(items.id, inventorySummary.itemId));

  const txRows = await database
    .select({
      itemId: inventoryTransactions.itemId,
      quantity: inventoryTransactions.quantity,
      createdAt: inventoryTransactions.createdAt,
      type: inventoryTransactions.type,
    })
    .from(inventoryTransactions)
    .where(
      and(
        eq(inventoryTransactions.type, "OUT"),
        gte(inventoryTransactions.createdAt, start),
        lt(inventoryTransactions.createdAt, end),
      ),
    );

  const perItem: Record<number, number[]> = {};

  for (const row of txRows) {
    const itemId = row.itemId;
    if (!perItem[itemId]) {
      perItem[itemId] = new Array(12).fill(0);
    }

    if (!row.createdAt) {
      continue;
    }

    const createdAt =
      row.createdAt instanceof Date
        ? row.createdAt
        : new Date(row.createdAt as any);
    const month = createdAt.getMonth(); // 0-11
    const quantity = row.quantity ?? 0;

    if (month >= 0 && month <= 11) {
      perItem[itemId][month] += quantity;
    }
  }

  const itemsReport = baseRows.map((row) => {
    const monthly = perItem[row.id] ?? new Array(12).fill(0);

    return {
      id: row.id,
      name: row.name,
      description: row.description ?? "",
      beginningStock: row.beginningStock ?? 0,
      forwardedBalance: row.forwardedBalance ?? 0,
      newDelivery: row.totalIn ?? 0,
      released: row.totalOut ?? 0,
      actualBalance: row.actualBalance ?? 0,
      jan: monthly[0],
      feb: monthly[1],
      mar: monthly[2],
      apr: monthly[3],
      may: monthly[4],
      jun: monthly[5],
      jul: monthly[6],
      aug: monthly[7],
      sep: monthly[8],
      oct: monthly[9],
      nov: monthly[10],
      dec: monthly[11],
    };
  });

  return NextResponse.json({
    success: true,
    year,
    items: itemsReport,
  });
}
